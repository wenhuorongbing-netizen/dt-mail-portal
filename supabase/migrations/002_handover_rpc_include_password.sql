-- ============================================================
-- Migration 002: Include mailbox password in handover RPC
-- ============================================================
-- The customer needs the mailbox password to log in to webmail
-- and retrieve OTP codes. The RPC is the only anonymous access
-- path and RLS ensures no other data is exposed.
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
  select * into v_handover
  from public.handover_codes
  where code = p_code
  limit 1;

  if v_handover is null then
    return null;
  end if;

  if v_handover.status = 'pending' then
    update public.handover_codes
    set status = 'viewed', viewed_at = now()
    where id = v_handover.id;
    v_handover.status := 'viewed';
    v_handover.viewed_at := now();
  end if;

  select * into v_order
  from public.orders
  where id = v_handover.order_id;

  if v_order.mailbox_account_id is not null then
    select * into v_mailbox
    from public.mailbox_accounts
    where id = v_order.mailbox_account_id;
  end if;

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
