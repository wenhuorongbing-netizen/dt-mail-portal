-- ============================================================
-- Migration 004: Delivery mode foundation
-- ============================================================
-- Adds delivery mode metadata for operator-controlled email records.
-- The current default is wallet_only. managed_otp, external_mailbox, and
-- customer_mailbox are exception modes.
-- ============================================================

alter table public.mailbox_accounts
  add column if not exists provider text not null default 'manual',
  add column if not exists delivery_mode text not null default 'wallet_only',
  add column if not exists login_url text,
  add column if not exists username text,
  add column if not exists customer_can_login boolean not null default false,
  add column if not exists otp_managed_by_operator boolean not null default true;

alter table public.mailbox_accounts
  alter column password_enc drop not null,
  alter column delivery_mode set default 'wallet_only';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'mailbox_accounts_provider_check'
      and conrelid = 'public.mailbox_accounts'::regclass
  ) then
    alter table public.mailbox_accounts
      add constraint mailbox_accounts_provider_check
      check (provider in ('manual', 'cloudflare_routing', 'hosted_mailbox', 'customer_mailbox', 'other'));
  end if;

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

comment on column public.mailbox_accounts.provider is 'Mailbox source: manual, cloudflare_routing, hosted_mailbox, customer_mailbox, or other.';
comment on column public.mailbox_accounts.delivery_mode is 'wallet_only hides all account login fields; managed_otp is an exception; external_mailbox/customer_mailbox may show login fields when customer_can_login is true.';
comment on column public.mailbox_accounts.login_url is 'Optional hosted webmail URL for approved customer-login exception modes.';
comment on column public.mailbox_accounts.username is 'Optional customer-facing mailbox username. Defaults can be derived from email local part.';
comment on column public.mailbox_accounts.password_enc is 'Nullable stored password. Return through handover RPC only when customer_can_login is true and delivery mode is not wallet_only. Add reversible encryption before production customer data.';
comment on column public.mailbox_accounts.customer_can_login is 'If false, the handover RPC returns null for mailbox_password and the customer UI must not show webmail login. wallet_only always hides customer login fields.';
comment on column public.mailbox_accounts.otp_managed_by_operator is 'If true, the operator receives OTP and forwards it through the approved support channel in an exception mode.';
