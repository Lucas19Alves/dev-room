-- Flow v2 keeps private instance snapshots in flow_accounts and evolves only the public definition boundary.
alter table public.flow_templates
  add column if not exists definition_version integer not null default 1,
  add column if not exists status text not null default 'published',
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'flow_templates_definition_version_check'
      and conrelid = 'public.flow_templates'::regclass
  ) then
    alter table public.flow_templates
      add constraint flow_templates_definition_version_check
      check (definition_version > 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'flow_templates_status_check'
      and conrelid = 'public.flow_templates'::regclass
  ) then
    alter table public.flow_templates
      add constraint flow_templates_status_check
      check (status in ('draft', 'published', 'archived'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'flow_templates_blueprint_shape_check'
      and conrelid = 'public.flow_templates'::regclass
  ) then
    alter table public.flow_templates
      add constraint flow_templates_blueprint_shape_check
      check (
        blueprint ? 'name'
        and blueprint ? 'components'
        and jsonb_typeof(blueprint -> 'name') = 'string'
        and jsonb_typeof(blueprint -> 'components') = 'array'
        and (blueprint ->> 'kind' is null or blueprint ->> 'kind' = 'flow_definition')
      ) not valid;
  end if;
end $$;

drop policy if exists "Public templates" on public.flow_templates;
create policy "Read published templates" on public.flow_templates
  for select to anon, authenticated
  using (status = 'published');
create policy "Read own template drafts" on public.flow_templates
  for select to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists flow_templates_published_created_idx
  on public.flow_templates (created_at desc)
  where status = 'published';
