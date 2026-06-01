-- ============================================================
-- Migration 005: Wallet-only default handover
-- ============================================================
-- Existing deployments that already applied 004 must run this migration to
-- switch the default delivery mode and harden the anonymous handover RPC.
-- ============================================================

alter table public.mailbox_accounts
  alter column delivery_mode set default 'wallet_only';

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'mailbox_accounts_delivery_mode_check'
      and conrelid = 'public.mailbox_accounts'::regclass
  ) then
    alter table public.mailbox_accounts
      drop constraint mailbox_accounts_delivery_mode_check;
  end if;

  alter table public.mailbox_accounts
    add constraint mailbox_accounts_delivery_mode_check
    check (delivery_mode in ('wallet_only', 'managed_otp', 'external_mailbox', 'customer_mailbox'));
end $$;

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
    'mailbox_email',    case
                          when coalesce(v_mailbox.delivery_mode, 'wallet_only') = 'wallet_only' then null
                          else v_mailbox.email_address
                        end,
    'mailbox_password', case
                          when coalesce(v_mailbox.delivery_mode, 'wallet_only') <> 'wallet_only'
                            and v_mailbox.customer_can_login
                          then v_mailbox.password_enc
                          else null
                        end,
    'mailbox_domain',   v_mailbox.domain,
    'mailbox_provider', v_mailbox.provider,
    'delivery_mode',    coalesce(v_mailbox.delivery_mode, 'wallet_only'),
    'mailbox_login_url', case
                           when coalesce(v_mailbox.delivery_mode, 'wallet_only') <> 'wallet_only'
                             and v_mailbox.customer_can_login
                           then v_mailbox.login_url
                           else null
                         end,
    'mailbox_username', case
                          when coalesce(v_mailbox.delivery_mode, 'wallet_only') <> 'wallet_only'
                            and v_mailbox.customer_can_login
                          then coalesce(v_mailbox.username, split_part(v_mailbox.email_address, '@', 1))
                          else null
                        end,
    'customer_can_login', case
                            when coalesce(v_mailbox.delivery_mode, 'wallet_only') = 'wallet_only' then false
                            else coalesce(v_mailbox.customer_can_login, false)
                          end,
    'otp_managed_by_operator', coalesce(v_mailbox.otp_managed_by_operator, true)
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_handover_by_code(text) to anon;
grant execute on function public.get_handover_by_code(text) to authenticated;

comment on function public.get_handover_by_code(text) is 'RPC for customer handover lookup. Default wallet_only hides TicketPlus+ login email, mailbox password, webmail URL, and username; exception modes expose login fields only when customer_can_login is true. Marks the handover as viewed on first access.';
