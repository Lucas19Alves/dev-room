grant insert, update on public.flow_accounts to authenticated;
create index if not exists flow_templates_user_id_idx on public.flow_templates(user_id);
