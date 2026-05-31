-- ============================================================
-- D-Ticket Mail Portal — Supabase RLS Policies (Phase 1 MVP)
-- ============================================================
--
-- Run this file AFTER schema.sql in the Supabase SQL Editor.
--
-- Security model:
--   - anon role: can only call the get_handover_by_code() RPC.
--     Cannot SELECT from mailbox_accounts, orders, or handover_codes directly.
--   - authenticated role (operators): full CRUD on all tables.
--     RLS restricts each operator to rows they own (operator_id = auth.uid()).
--   - service_role key: bypasses all RLS. Must NEVER be used in the frontend.
--
-- The get_handover_by_code() function uses SECURITY DEFINER so it can
-- read the handover_codes table even for anon users, but it returns
-- only the single matching row. No other data is exposed.
-- ============================================================

-- ============================================================
-- 1. Enable RLS on all tables
-- ============================================================
alter table public.mailbox_accounts enable row level security;
alter table public.orders           enable row level security;
alter table public.handover_codes   enable row level security;
alter table public.audit_events     enable row level security;

-- ============================================================
-- 2. mailbox_accounts policies
-- ============================================================
-- anon: no access (RLS enabled = denied by default)
-- authenticated: full access for operators

create policy "authenticated_select_mailbox_accounts"
  on public.mailbox_accounts for select
  to authenticated
  using (true);

create policy "authenticated_insert_mailbox_accounts"
  on public.mailbox_accounts for insert
  to authenticated
  with check (true);

create policy "authenticated_update_mailbox_accounts"
  on public.mailbox_accounts for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_delete_mailbox_accounts"
  on public.mailbox_accounts for delete
  to authenticated
  using (true);

-- ============================================================
-- 3. orders policies
-- ============================================================
-- anon: no access
-- authenticated: operators see only their own orders

create policy "authenticated_select_orders"
  on public.orders for select
  to authenticated
  using (operator_id = auth.uid());

create policy "authenticated_insert_orders"
  on public.orders for insert
  to authenticated
  with check (operator_id = auth.uid());

create policy "authenticated_update_orders"
  on public.orders for update
  to authenticated
  using (operator_id = auth.uid())
  with check (operator_id = auth.uid());

create policy "authenticated_delete_orders"
  on public.orders for delete
  to authenticated
  using (operator_id = auth.uid());

-- ============================================================
-- 4. handover_codes policies
-- ============================================================
-- anon: no direct table access (lookup is through RPC only)
-- authenticated: operators can manage codes for their own orders

create policy "authenticated_select_handover_codes"
  on public.handover_codes for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = handover_codes.order_id
        and orders.operator_id = auth.uid()
    )
  );

create policy "authenticated_insert_handover_codes"
  on public.handover_codes for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders
      where orders.id = handover_codes.order_id
        and orders.operator_id = auth.uid()
    )
  );

create policy "authenticated_update_handover_codes"
  on public.handover_codes for update
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = handover_codes.order_id
        and orders.operator_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.orders
      where orders.id = handover_codes.order_id
        and orders.operator_id = auth.uid()
    )
  );

create policy "authenticated_delete_handover_codes"
  on public.handover_codes for delete
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.id = handover_codes.order_id
        and orders.operator_id = auth.uid()
    )
  );

-- ============================================================
-- 5. audit_events policies
-- ============================================================
-- anon: no access
-- authenticated: can insert (write-only log), can read own entries

create policy "authenticated_insert_audit_events"
  on public.audit_events for insert
  to authenticated
  with check (operator_id = auth.uid());

create policy "authenticated_select_audit_events"
  on public.audit_events for select
  to authenticated
  using (operator_id = auth.uid());

-- ============================================================
-- 6. RPC: get_handover_by_code(code)
-- ============================================================
-- This is the ONLY way anonymous users can access handover data.
-- The function runs as SECURITY DEFINER (executes with the
-- privileges of the function owner, which is the postgres/supabase
-- admin role). It reads the handover_codes table, joins the
-- related order and mailbox, and returns exactly one row if
-- the code matches. If the code is invalid, it returns nothing.
--
-- Call from the frontend:
--   const { data, error } = await supabase.rpc('get_handover_by_code', {
--     p_code: 'abc123'
--   });
--
-- The function also marks the handover as 'viewed' on first access.
-- ============================================================

create or replace function public.get_handover_by_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_handover  public.handover_codes%rowtype;
  v_order     public.orders%rowtype;
  v_mailbox   public.mailbox_accounts%rowtype;
  v_result    json;
begin
  -- Look up the handover code
  select * into v_handover
  from public.handover_codes
  where code = p_code
  limit 1;

  -- If no match, return null
  if v_handover is null then
    return null;
  end if;

  -- Mark as viewed if still pending
  if v_handover.status = 'pending' then
    update public.handover_codes
    set status = 'viewed', viewed_at = now()
    where id = v_handover.id;
    v_handover.status := 'viewed';
    v_handover.viewed_at := now();
  end if;

  -- Load the related order
  select * into v_order
  from public.orders
  where id = v_handover.order_id;

  -- Load the related mailbox (if linked)
  if v_order.mailbox_account_id is not null then
    select * into v_mailbox
    from public.mailbox_accounts
    where id = v_order.mailbox_account_id;
  end if;

  -- Build the response JSON.
  -- password_enc IS included: the customer needs it to log in to webmail
  -- and retrieve OTP codes. This RPC is the only anonymous access path,
  -- and RLS ensures no other data is exposed.
  select json_build_object(
    'handover_id',      v_handover.id,
    'code',             v_handover.code,
    'instructions',     v_handover.instructions,
    'handover_status',  v_handover.status,
    'viewed_at',        v_handover.viewed_at,
    'order_id',         v_order.id,
    'customer_label',   v_order.customer_label,
    'ticket_month',     v_order.ticket_month,
    'status',           v_order.status,
    'mailbox_email',    v_mailbox.email_address,
    'mailbox_password', v_mailbox.password_enc,
    'mailbox_domain',   v_mailbox.domain
  ) into v_result;

  return v_result;
end;
$$;

-- Grant execute to anon (unauthenticated customers) and authenticated (operators)
grant execute on function public.get_handover_by_code(text) to anon;
grant execute on function public.get_handover_by_code(text) to authenticated;

comment on function public.get_handover_by_code(text) is 'RPC for customer handover lookup. Accepts a handover code, returns the handover record with order and mailbox info. mailbox_password IS included — the customer needs it to log in to webmail and retrieve OTP codes. Marks the handover as viewed on first access.';

-- ============================================================
-- 7. Helper: generate_handover_code()
-- ============================================================
-- Generates a short random alphanumeric code for handover URLs.
-- Operators call this when creating a new handover record.
-- ============================================================

create or replace function public.generate_handover_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chars  text := 'abcdefghjkmnpqrstuvwxyz23456789';  -- ambiguous chars removed
  v_code   text := '';
  v_length int := 8;
  v_i      int;
begin
  for v_i in 1..v_length loop
    v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
  end loop;

  -- Ensure uniqueness
  while exists (select 1 from public.handover_codes where code = v_code) loop
    v_code := '';
    for v_i in 1..v_length loop
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    end loop;
  end loop;

  return v_code;
end;
$$;

grant execute on function public.generate_handover_code() to authenticated;

comment on function public.generate_handover_code() is 'Generates a unique 8-char alphanumeric handover code. Ambiguous characters (0/O, 1/l/I) are excluded.';
