-- Creator studio: publishable offerings, enrollments and privacy-preserving progress shares.
alter table public.flow_templates
  drop constraint if exists flow_templates_blueprint_length;
-- The original insert check used octet_length < 20000. Structured course
-- definitions with stages, collections and layout need more room.
alter table public.flow_templates
  drop constraint if exists flow_templates_blueprint_check;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'flow_templates_blueprint_shape_check'
      and conrelid = 'public.flow_templates'::regclass
  ) then
    alter table public.flow_templates drop constraint flow_templates_blueprint_shape_check;
  end if;
end $$;

alter table public.flow_templates
  add constraint flow_templates_blueprint_shape_check
  check (
    jsonb_typeof(blueprint) = 'object'
    and octet_length(blueprint::text) < 120000
    and blueprint ? 'name'
    and blueprint ? 'components'
    and jsonb_typeof(blueprint -> 'name') = 'string'
    and jsonb_typeof(blueprint -> 'components') = 'array'
    and (blueprint ->> 'kind' is null or blueprint ->> 'kind' = 'flow_definition')
  );

drop policy if exists "Update own templates" on public.flow_templates;
create policy "Update own templates" on public.flow_templates
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.flow_offerings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  template_id uuid references public.flow_templates(id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  summary text not null default '' check (char_length(summary) <= 500),
  audience text not null default 'learners' check (audience in ('personal', 'learners')),
  access_mode text not null default 'open' check (access_mode in ('open', 'invite', 'paid')),
  price_cents integer not null default 0 check (price_cents >= 0 and price_cents <= 100000000),
  currency text not null default 'BRL',
  invite_code text unique,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists flow_offerings_creator_idx on public.flow_offerings(creator_id);
create index if not exists flow_offerings_published_idx on public.flow_offerings(created_at desc) where status = 'published';

create table if not exists public.flow_access_codes (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.flow_offerings(id) on delete cascade,
  code text not null unique,
  note text not null default '',
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists flow_access_codes_offering_idx on public.flow_access_codes(offering_id);

create table if not exists public.flow_enrollments (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references public.flow_offerings(id) on delete cascade,
  learner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  enrolled_at timestamptz not null default now(),
  unique (offering_id, learner_id)
);
create index if not exists flow_enrollments_offering_idx on public.flow_enrollments(offering_id);
create index if not exists flow_enrollments_learner_idx on public.flow_enrollments(learner_id);

create table if not exists public.flow_progress_shares (
  offering_id uuid not null references public.flow_offerings(id) on delete cascade,
  learner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object' and octet_length(snapshot::text) < 20000),
  updated_at timestamptz not null default now(),
  primary key (offering_id, learner_id)
);

alter table public.flow_offerings enable row level security;
alter table public.flow_access_codes enable row level security;
alter table public.flow_enrollments enable row level security;
alter table public.flow_progress_shares enable row level security;

create policy "Read published offerings" on public.flow_offerings
  for select to anon, authenticated
  using (status = 'published' or (select auth.uid()) = creator_id);
create policy "Create own offerings" on public.flow_offerings
  for insert to authenticated
  with check ((select auth.uid()) = creator_id);
create policy "Update own offerings" on public.flow_offerings
  for update to authenticated
  using ((select auth.uid()) = creator_id)
  with check ((select auth.uid()) = creator_id);
create policy "Delete own offerings" on public.flow_offerings
  for delete to authenticated
  using ((select auth.uid()) = creator_id);

create policy "Read own access codes" on public.flow_access_codes
  for select to authenticated
  using (exists (select 1 from public.flow_offerings o where o.id = offering_id and o.creator_id = (select auth.uid())));
create policy "Create own access codes" on public.flow_access_codes
  for insert to authenticated
  with check (exists (select 1 from public.flow_offerings o where o.id = offering_id and o.creator_id = (select auth.uid())));
create policy "Delete own access codes" on public.flow_access_codes
  for delete to authenticated
  using (exists (select 1 from public.flow_offerings o where o.id = offering_id and o.creator_id = (select auth.uid())));

create policy "Read relevant enrollments" on public.flow_enrollments
  for select to authenticated
  using (
    (select auth.uid()) = learner_id
    or exists (select 1 from public.flow_offerings o where o.id = offering_id and o.creator_id = (select auth.uid()))
  );
create policy "Learner leaves enrollment" on public.flow_enrollments
  for delete to authenticated
  using ((select auth.uid()) = learner_id);
create policy "Creator updates enrollment status" on public.flow_enrollments
  for update to authenticated
  using (exists (select 1 from public.flow_offerings o where o.id = offering_id and o.creator_id = (select auth.uid())))
  with check (exists (select 1 from public.flow_offerings o where o.id = offering_id and o.creator_id = (select auth.uid())));

create policy "Read relevant progress shares" on public.flow_progress_shares
  for select to authenticated
  using (
    (select auth.uid()) = learner_id
    or exists (select 1 from public.flow_offerings o where o.id = offering_id and o.creator_id = (select auth.uid()))
  );
create policy "Share own progress" on public.flow_progress_shares
  for insert to authenticated
  with check (
    (select auth.uid()) = learner_id
    and exists (select 1 from public.flow_enrollments e where e.offering_id = offering_id and e.learner_id = (select auth.uid()))
  );
create policy "Update own progress share" on public.flow_progress_shares
  for update to authenticated
  using ((select auth.uid()) = learner_id)
  with check ((select auth.uid()) = learner_id);

create or replace function public.enroll_in_offering(target_offering uuid, access_code text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  offering public.flow_offerings;
  enrollment_id uuid;
  normalized text;
  code_row public.flow_access_codes;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into offering from public.flow_offerings where id = target_offering;
  if offering.id is null or offering.status <> 'published' then raise exception 'offering_unavailable'; end if;
  if offering.creator_id = auth.uid() then raise exception 'cannot_enroll_own_offering'; end if;

  select id into enrollment_id from public.flow_enrollments
    where offering_id = target_offering and learner_id = auth.uid();
  if enrollment_id is not null then return enrollment_id; end if;

  normalized := nullif(upper(btrim(coalesce(access_code, ''))), '');
  if offering.access_mode = 'open' then
    null;
  elsif offering.access_mode = 'invite' then
    if normalized is null or (normalized <> offering.invite_code and not exists (
      select 1 from public.flow_access_codes c
      where c.offering_id = offering.id and c.code = normalized and c.redeemed_at is null
    )) then raise exception 'invalid_access_code'; end if;
  else
    select * into code_row from public.flow_access_codes
      where offering_id = offering.id and code = normalized and redeemed_at is null
      for update;
    if code_row.id is null then raise exception 'invalid_access_code'; end if;
  end if;

  if normalized is not null then
    update public.flow_access_codes
      set redeemed_by = auth.uid(), redeemed_at = now()
      where offering_id = offering.id and code = normalized and redeemed_at is null;
  end if;

  insert into public.flow_enrollments(offering_id, learner_id)
    values (offering.id, auth.uid())
    returning id into enrollment_id;
  return enrollment_id;
end $$;

revoke all on function public.enroll_in_offering(uuid, text) from public;
grant execute on function public.enroll_in_offering(uuid, text) to authenticated;

grant select on public.flow_offerings to anon, authenticated;
grant insert, update, delete on public.flow_offerings to authenticated;
grant select, insert, delete on public.flow_access_codes to authenticated;
grant select, delete, update on public.flow_enrollments to authenticated;
grant select, insert, update on public.flow_progress_shares to authenticated;
