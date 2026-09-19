-- Production boundary: atomic snapshots, server-authoritative plans and an
-- idempotent Stripe receipt ledger. This migration does not rewrite user data.
create schema if not exists noma_private;
revoke all on schema noma_private from public, anon;
grant usage on schema noma_private to authenticated, service_role;

create table public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);
create table public.subscriptions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null,
  price_id text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_event_created bigint not null default 0,
  updated_at timestamptz not null default now()
);
create index subscriptions_user_id_idx on public.subscriptions(user_id);
create table noma_private.billing_events (
  id text primary key,
  event_type text not null,
  event_created bigint not null,
  received_at timestamptz not null default now()
);
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table noma_private.billing_events enable row level security;
revoke all on public.billing_customers, public.subscriptions from public, anon, authenticated;
revoke all on noma_private.billing_events from public, anon, authenticated;
grant all on public.billing_customers, public.subscriptions, noma_private.billing_events to service_role;
-- A user reads only a safe computed entitlement result through the RPC below.

create function noma_private.my_entitlements()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare selected public.subscriptions; pro boolean;
begin
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) then raise exception 'authentication_required'; end if;
  select * into selected from public.subscriptions where user_id=auth.uid()
    order by (status in ('active','trialing') and (current_period_end is null or current_period_end > now())) desc, updated_at desc limit 1;
  pro := selected.status in ('active','trialing') and (selected.current_period_end is null or selected.current_period_end > now());
  return jsonb_build_object('plan',case when coalesce(pro,false) then 'pro' else 'free' end,
    'activeFlowLimit',case when coalesce(pro,false) then null else 3 end,
    'subscription',case when selected.id is null then null else jsonb_build_object(
      'status',selected.status,'cancelAtPeriodEnd',selected.cancel_at_period_end,'currentPeriodEnd',selected.current_period_end) end);
end $$;
revoke all on function noma_private.my_entitlements() from public, anon;
grant execute on function noma_private.my_entitlements() to authenticated;
create function public.get_my_entitlements()
returns jsonb language sql stable security invoker set search_path = '' as $$ select noma_private.my_entitlements() $$;
revoke all on function public.get_my_entitlements() from public, anon;
grant execute on function public.get_my_entitlements() to authenticated;

create function noma_private.save_account(payload jsonb, expected_revision bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare previous public.flow_accounts; next_revision bigint; active_count integer; is_pro boolean;
begin
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) then raise exception 'authentication_required'; end if;
  if payload is null or jsonb_typeof(payload) <> 'object' or jsonb_typeof(payload->'flows') <> 'array'
    or octet_length(payload::text) > 5000000 or expected_revision is null or expected_revision < 0 then raise exception 'invalid_payload'; end if;
  -- Serialize account creation and updates, including plan-limit checks.
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));
  select * into previous from public.flow_accounts where user_id=auth.uid() for update;
  if coalesce(previous.revision,0) <> expected_revision then raise exception 'revision_conflict'; end if;
  if exists(select 1 from jsonb_array_elements(payload->'flows') f where jsonb_typeof(f)<>'object' or coalesce(f->>'id','')='') then raise exception 'invalid_flow'; end if;
  if (select count(*) from jsonb_array_elements(payload->'flows')) <>
     (select count(distinct f->>'id') from jsonb_array_elements(payload->'flows') f) then raise exception 'duplicate_flow'; end if;
  is_pro := (noma_private.my_entitlements()->>'plan')='pro';
  select count(*) into active_count from jsonb_array_elements(payload->'flows') f
    where coalesce(f->>'status','') <> 'archived' and coalesce(f->>'archivedAt','') in ('','0','false');
  -- Existing excess Flows remain intact after downgrade. Until the user chooses
  -- three active Flows they may save existing work and archive, but not activate
  -- another Flow. No server process archives or deletes content on their behalf.
  if not is_pro and active_count > 3 and exists (
    select 1 from jsonb_array_elements(payload->'flows') f
    where coalesce(f->>'status','')<>'archived' and coalesce(f->>'archivedAt','') in ('','0','false')
    and not exists(select 1 from jsonb_array_elements(coalesce(previous.payload->'flows','[]'::jsonb)) old
      where old->>'id'=f->>'id' and coalesce(old->>'status','')<>'archived' and coalesce(old->>'archivedAt','') in ('','0','false'))
  ) then raise exception 'active_flow_limit'; end if;
  next_revision := expected_revision + 1;
  insert into public.flow_accounts(user_id,payload,revision) values(auth.uid(),payload,next_revision)
    on conflict(user_id) do update set payload=excluded.payload,revision=excluded.revision,updated_at=now();
  return next_revision;
end $$;
revoke all on function noma_private.save_account(jsonb,bigint) from public, anon;
grant execute on function noma_private.save_account(jsonb,bigint) to authenticated;
create or replace function public.save_flow_account(payload jsonb, expected_revision bigint)
returns bigint language sql security invoker set search_path = '' as $$ select noma_private.save_account(payload,expected_revision) $$;
revoke all on function public.save_flow_account(jsonb,bigint) from public, anon;
grant execute on function public.save_flow_account(jsonb,bigint) to authenticated;
-- Direct writes would bypass compare-and-swap and entitlement enforcement.
revoke insert,update,delete on public.flow_accounts from authenticated, anon;

create function public.apply_billing_event(event_id text, event_type text, event_created bigint, customer_id text, subscription jsonb)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare owner_id uuid; inserted integer;
begin
  if event_id is null or event_created is null or jsonb_typeof(subscription)<>'object' then raise exception 'invalid_billing_event'; end if;
  select user_id into owner_id from public.billing_customers where stripe_customer_id=customer_id;
  if owner_id is null then raise exception 'unknown_billing_customer'; end if;
  insert into noma_private.billing_events(id,event_type,event_created) values(event_id,event_type,event_created) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted=0 then return false; end if;
  insert into public.subscriptions(id,user_id,status,price_id,current_period_end,cancel_at_period_end,last_event_created)
  values(subscription->>'id',owner_id,subscription->>'status',subscription->>'priceId',
    nullif(subscription->>'currentPeriodEnd','')::timestamptz,coalesce((subscription->>'cancelAtPeriodEnd')::boolean,false),event_created)
  on conflict(id) do update set status=excluded.status,price_id=excluded.price_id,
    current_period_end=excluded.current_period_end,cancel_at_period_end=excluded.cancel_at_period_end,
    last_event_created=excluded.last_event_created,updated_at=now()
  where public.subscriptions.user_id=excluded.user_id and public.subscriptions.last_event_created <= excluded.last_event_created;
  return true;
end $$;
revoke all on function public.apply_billing_event(text,text,bigint,text,jsonb) from public, anon, authenticated;
grant execute on function public.apply_billing_event(text,text,bigint,text,jsonb) to service_role;

-- Permit richer declarative templates while denying private instance fields at
-- the database boundary. Client validation imposes stricter structural limits.
alter table public.flow_templates drop constraint if exists flow_templates_blueprint_check;
alter table public.flow_templates add constraint flow_templates_public_payload_check check (
  jsonb_typeof(blueprint)='object' and octet_length(blueprint::text)<=250000
  and not (blueprint ?| array['componentData','sessions','events','checkins','history','private','ownerId'])
  and (not (blueprint ? 'metrics') or jsonb_typeof(blueprint->'metrics')='array')
  and not (coalesce(blueprint->'onboarding','{}'::jsonb) ? 'answers')
) not valid;
