-- Keep the Pro template boundary authoritative when account snapshots are
-- written to Supabase. Existing Flows remain usable after a plan downgrade.
create function noma_private.enforce_pro_flow_creation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_pro boolean;
begin
  is_pro := coalesce(
    (noma_private.my_entitlements()->>'plan') = 'pro',
    false
  );
  if is_pro then
    return new;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(new.payload->'flows', '[]'::jsonb)) as incoming(flow)
    where (
        incoming.flow #>> '{definitionRef,tier}' = 'pro'
        or incoming.flow #>> '{definitionRef,id}' in (
          'job', 'contest', 'college', 'project', 'language', 'office'
        )
      )
      and (
        tg_op = 'INSERT'
        or not exists (
          select 1
          from jsonb_array_elements(coalesce(old.payload->'flows', '[]'::jsonb)) as previous(flow)
          where previous.flow->>'id' = incoming.flow->>'id'
        )
      )
  ) then
    raise exception 'pro_flow_required';
  end if;

  return new;
end;
$$;
revoke all on function noma_private.enforce_pro_flow_creation() from public, anon, authenticated;

create trigger enforce_pro_flow_creation
before insert or update on public.flow_accounts
for each row execute function noma_private.enforce_pro_flow_creation();
