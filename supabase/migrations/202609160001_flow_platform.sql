-- CentralOS 2: private account snapshots with optimistic concurrency.
create table public.flow_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.flow_accounts enable row level security;
create policy "Read own flows" on public.flow_accounts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own flows" on public.flow_accounts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own flows" on public.flow_accounts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- Writes go through an atomic compare-and-swap function, never an unconditional upsert.
create function public.save_flow_account(payload jsonb, expected_revision bigint)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare next_revision bigint;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if jsonb_typeof(payload) <> 'object' or octet_length(payload::text) > 5000000 then raise exception 'invalid_payload'; end if;
  if expected_revision = 0 then
    insert into public.flow_accounts(user_id,payload,revision) values(auth.uid(),payload,1)
    on conflict do nothing returning revision into next_revision;
  else
    update public.flow_accounts a set payload = save_flow_account.payload, revision = a.revision + 1, updated_at = now()
    where a.user_id = auth.uid() and a.revision = expected_revision returning a.revision into next_revision;
  end if;
  if next_revision is null then raise exception 'revision_conflict'; end if;
  return next_revision;
end $$;
revoke all on function public.save_flow_account(jsonb,bigint) from public;
grant execute on function public.save_flow_account(jsonb,bigint) to authenticated;
create table public.flow_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blueprint jsonb not null check (jsonb_typeof(blueprint) = 'object' and octet_length(blueprint::text) < 20000),
  created_at timestamptz not null default now()
);
alter table public.flow_templates enable row level security;
create policy "Public templates" on public.flow_templates for select to anon, authenticated using (true);
create policy "Publish own template" on public.flow_templates for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Delete own template" on public.flow_templates for delete to authenticated using ((select auth.uid()) = user_id);
grant select on public.flow_accounts to authenticated;
grant insert, update on public.flow_accounts to authenticated;
grant select on public.flow_templates to anon, authenticated;
grant insert, delete on public.flow_templates to authenticated;
create index flow_templates_user_id_idx on public.flow_templates(user_id);
