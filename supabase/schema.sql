-- ============================================================
-- D-Ticket Mail Portal — Supabase Schema (Phase 1 MVP)
-- ============================================================
--
-- Run this file FIRST in the Supabase SQL Editor:
--   1. Open your Supabase project dashboard.
--   2. Go to SQL Editor (left sidebar).
--   3. Create a new query.
--   4. Paste the contents of this file and click "Run".
--
-- After this file completes, run policies.sql to set up RLS.
-- ============================================================

-- Enable the pgcrypto extension for gen_random_uuid()
-- (Supabase projects usually have this enabled by default.)
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- mailbox_accounts
-- Stores the operator-controlled login email or hosted mailbox credentials.
-- Operators import or type these manually in Phase 1.
-- Default mode is wallet_only: customers receive only official Wallet delivery
-- instructions, not TicketPlus+ account login or mailbox credentials.
-- ------------------------------------------------------------
create table if not exists public.mailbox_accounts (
  id              uuid primary key default gen_random_uuid(),
  email_address   text        not null unique,
  provider        text        not null default 'manual'
                                      check (provider in ('manual', 'cloudflare_routing', 'hosted_mailbox', 'customer_mailbox', 'other')),
  delivery_mode   text        not null default 'wallet_only'
                                      check (delivery_mode in ('wallet_only', 'managed_otp', 'external_mailbox', 'customer_mailbox')),
  login_url       text,
  username        text,
  password_enc    text,                         -- nullable; returned only when customer_can_login = true
  customer_can_login boolean not null default false,
  otp_managed_by_operator boolean not null default true,
  domain          text        not null default 'tickets.buffjo.top',
  status          text        not null default 'active'
                                      check (status in ('active', 'disabled')),
  notes           text        not null default '',  -- operator notes (not visible to customer)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table  public.mailbox_accounts is 'Operator-controlled login email or hosted mailbox credentials. Default mode is wallet_only, where customers receive only official Wallet delivery instructions and no TicketPlus+ account login.';
comment on column public.mailbox_accounts.provider is 'Mailbox source: manual, cloudflare_routing, hosted_mailbox, customer_mailbox, or other.';
comment on column public.mailbox_accounts.delivery_mode is 'wallet_only hides all account login fields; managed_otp is an exception; external_mailbox/customer_mailbox may show login fields when customer_can_login is true.';
comment on column public.mailbox_accounts.login_url is 'Optional hosted webmail URL for approved customer-login exception modes.';
comment on column public.mailbox_accounts.username is 'Optional customer-facing mailbox username. Defaults can be derived from email local part.';
comment on column public.mailbox_accounts.password_enc is 'Nullable stored password. Return through handover RPC only when customer_can_login is true. Add reversible encryption before production customer data.';
comment on column public.mailbox_accounts.customer_can_login is 'If false, the handover RPC returns null for mailbox_password and the customer UI must not show webmail login. wallet_only always hides customer login fields.';
comment on column public.mailbox_accounts.otp_managed_by_operator is 'If true, the operator receives OTP and forwards it through the approved support channel.';

-- ------------------------------------------------------------
-- orders
-- One row per customer order. Links to the operator who
-- created it via operator_id (references auth.users).
-- ------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  operator_id       uuid        not null references auth.users(id) on delete restrict,
  customer_label    text        not null,         -- short label, e.g. WeChat nickname
  customer_contact  text,                         -- optional contact handle
  passenger_name    text,                         -- real name for ticket (sensitive)
  passenger_birthdate text,                       -- birthdate for ticket (sensitive)
  ticket_month      text,                         -- e.g. "2026-06"
  start_date        date,
  after_tenth_day   boolean     not null default false,
  ticket_month_count smallint   not null default 1
                                      check (ticket_month_count between 1 and 6),
  ticket_price_total numeric(10,2) not null default 0,
  service_fee       numeric(10,2)   not null default 0,
  total_amount      numeric(10,2)   not null default 0,
  status            text        not null default 'requested'
                                      check (status in (
                                        'requested',
                                        'paid',
                                        'mailbox_assigned',
                                        'ticket_purchased',
                                        'handover_created',
                                        'delivered',
                                        'closed',
                                        'exception'
                                      )),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table  public.orders is 'Customer orders managed by operators. Each row belongs to one operator.';
comment on column public.orders.operator_id is 'The Supabase Auth user who created this order. Enforced by RLS.';
comment on column public.orders.passenger_name is 'Sensitive: real name for ticket binding. Encrypt in production.';
comment on column public.orders.passenger_birthdate is 'Sensitive: birthdate for ticket binding. Encrypt in production.';

-- ------------------------------------------------------------
-- handover_codes
-- Each row links one handover code to one order.
-- Customers look up their handover record by code via RPC.
-- The code is a short random string (e.g. 8 alphanumeric).
-- ------------------------------------------------------------
create table if not exists public.handover_codes (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid        not null references public.orders(id) on delete cascade,
  code            text        not null unique,
  instructions    text        not null default '',    -- rendered handover text for customer
  status          text        not null default 'pending'
                                      check (status in ('pending', 'viewed', 'completed')),
  viewed_at       timestamptz,
  created_at      timestamptz not null default now()
);

comment on table  public.handover_codes is 'Handover codes for customer lookup. One code per order.';
comment on column public.handover_codes.code is 'Short unique alphanumeric code used in the handover URL.';

-- Index for fast lookup by code (the primary access path for customers)
create index if not exists idx_handover_codes_code on public.handover_codes(code);

-- Link mailbox_account to order (optional, nullable)
alter table public.orders add column if not exists mailbox_account_id uuid references public.mailbox_accounts(id) on delete set null;

-- ------------------------------------------------------------
-- audit_events
-- Optional audit log for operator actions.
-- ------------------------------------------------------------
create table if not exists public.audit_events (
  id              uuid primary key default gen_random_uuid(),
  operator_id     uuid        not null references auth.users(id) on delete restrict,
  action          text        not null,         -- e.g. 'order.create', 'status.change'
  target_table    text,                         -- e.g. 'orders', 'mailbox_accounts'
  target_id       uuid,
  details         jsonb,
  created_at      timestamptz not null default now()
);

comment on table  public.audit_events is 'Audit log for operator actions. Write-only from the app.';

-- ------------------------------------------------------------
-- updated_at trigger helper
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at trigger to tables that have the column
drop trigger if exists set_updated_at on public.mailbox_accounts;
create trigger set_updated_at
  before update on public.mailbox_accounts
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.orders;
create trigger set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();
