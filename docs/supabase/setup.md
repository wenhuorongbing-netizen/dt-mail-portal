# Supabase MVP Setup Guide

This document explains how to set up the Supabase backend for the D-Ticket Mail Portal Phase 1 MVP.

## Overview

Phase 1 uses **Supabase** as the only backend. No FastAPI, no self-hosted database.

| Component | Purpose |
|-----------|---------|
| Supabase Postgres | Data storage (orders, mailboxes, handover codes, audit log) |
| Supabase Auth | Operator login (email + password) |
| Supabase RLS | Access control (operators see own data, customers see one handover) |
| Supabase RPC | `get_handover_by_code()` — the only anonymous data access path |
| Frontend | React/Vite static build on GitHub Pages |

## Required environment variables

The frontend needs the Supabase public URL and anon key. Create a `.env.local`
file in the `frontend/` directory:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key-here
# Optional fallback only for external_mailbox mode:
# VITE_WEBMAIL_URL=https://hosted-mail.example.com
```

### Where to find these values

1. Go to your Supabase project dashboard.
2. Click **Settings** (gear icon) → **API**.
3. Copy the **Project URL** → this is `VITE_SUPABASE_URL`.
4. Copy the **anon public** key → this is `VITE_SUPABASE_ANON_KEY`.

### Security rules

- **`VITE_SUPABASE_ANON_KEY`** is safe to expose in the frontend. RLS policies control all access.
- **`service_role` key must NEVER enter the frontend.** It bypasses all RLS policies. Keep it only in server-side scripts, Supabase Edge Functions, or admin CLI tools.
- Never commit `.env.local` to git. It should be in `.gitignore`.

## Setting up the database

### Step 1: Run schema.sql

1. Open your Supabase project dashboard.
2. Go to **SQL Editor** (left sidebar).
3. Click **New query**.
4. Paste the contents of `supabase/schema.sql`.
5. Click **Run**.

This creates the following tables:

| Table | Purpose |
|-------|---------|
| `mailbox_accounts` | Operator-controlled TicketPlus+ login email records and optional hosted mailbox credentials |
| `orders` | Customer orders (operator-owned, tracks status and pricing) |
| `handover_codes` | Handover codes linked to orders (customers look up by code) |
| `audit_events` | Operator action log (write-only from the app) |

It also creates:
- `set_updated_at()` trigger function for automatic `updated_at` timestamps.
- Index on `handover_codes.code` for fast lookup.

### Step 2: Run policies.sql

1. In the same SQL Editor, create another new query.
2. Paste the contents of `supabase/policies.sql`.
3. Click **Run**.

This sets up:

- **RLS enabled** on all four tables.
- **anon role**: no direct table access. Can only call `get_handover_by_code()` RPC.
- **authenticated role** (operators): admin CRUD. Orders, handover codes, and audit events are scoped by `operator_id = auth.uid()`. Mailbox records are authenticated-only in the current MVP.
- **`get_handover_by_code(p_code)`** RPC: SECURITY DEFINER function that returns one handover record by code. Default `wallet_only` handovers must not expose TicketPlus+ login email, OTP, webmail URL, or mailbox password. `mailbox_password` is returned only when `customer_can_login = true`.
- **`generate_handover_code()`** helper: generates unique 8-char alphanumeric codes.

## How RLS works

### Anonymous (customer) access

Customers do NOT log in. They access the system through a handover code in the URL (e.g. `portal.buffjo.top/#/h/abc123`).

The frontend calls:

```typescript
const { data, error } = await supabase.rpc('get_handover_by_code', {
  p_code: 'abc123'
});
```

The `get_handover_by_code()` function:
1. Looks up the code in `handover_codes`.
2. If found, joins the related `orders` and `mailbox_accounts` rows.
3. Returns a JSON object with handover info, order status, delivery mode, Wallet instructions, and optional exception-mode login fields.
4. Default `wallet_only` handovers hide TicketPlus+ login email and return `mailbox_password = null`. The password field is returned only when `customer_can_login = true`.
5. Marks the handover as `viewed` on first access.
6. If the code is invalid, returns `null`.

Because RLS is enabled and there are no policies granting `SELECT` to `anon`, customers cannot query `mailbox_accounts`, `orders`, or `handover_codes` directly. The RPC is the only access path.

### Authenticated (operator) access

Operators log in via Supabase Auth (email + password). The frontend uses the Supabase client with the user's session:

```typescript
const { data, error } = await supabase
  .from('orders')
  .select('*');
```

RLS policies ensure:
- Operators can only `SELECT` orders where `operator_id = auth.uid()`.
- The same restriction applies to order `INSERT`, `UPDATE`, and `DELETE`.
- `handover_codes` access is restricted to codes linked to the operator's orders.
- `mailbox_accounts` access is authenticated-only in the current MVP.
- `audit_events` is write-only for operators (they can insert and read their own entries).

### service_role key

The `service_role` key bypasses all RLS policies. It must NEVER be used in:
- Frontend JavaScript code
- `.env.local` or any environment variable exposed to the build
- GitHub Pages deployment artifacts

It should only be used in:
- Supabase Edge Functions (server-side)
- Admin CLI scripts
- Database migration scripts

## Setting up operator accounts

Operators are Supabase Auth users. The admin page supports a one-click
operator entry flow:

1. The operator enters email and password.
2. The frontend first calls `supabase.auth.signInWithPassword()`.
3. If the account does not exist, the frontend calls `supabase.auth.signUp()`.
4. If Supabase email confirmation is enabled, the operator confirms the email
   before returning to log in.

This is only for internal operators. Customers do not register or log in; they
use handover-code URLs only.

For production, restrict who can self-register as an operator and consider
enabling email confirmation or MFA.

## Frontend integration

### Supabase client setup

```typescript
// frontend/src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Customer handover lookup

```typescript
const { data, error } = await supabase.rpc('get_handover_by_code', {
  p_code: handoverCode
});

if (error || !data) {
  // Invalid code — show error
} else {
  // Display handover info. In wallet_only mode, hide account-login fields and show Wallet instructions.
}
```

### Operator order list

```typescript
// Requires supabase.auth.signInWithPassword() first
const { data: orders, error } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false });
```

### Creating a handover code

```typescript
// First, generate a code
const { data: code } = await supabase.rpc('generate_handover_code');

// Then insert the handover record
const { error } = await supabase
  .from('handover_codes')
  .insert({
    order_id: orderId,
    code: code,
    instructions: 'Wallet delivery instructions...'
  });
```

## Data model reference

### mailbox_accounts

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| email_address | text | Unique, e.g. `user@tickets.buffjo.top` |
| provider | text | `manual`, `cloudflare_routing`, `hosted_mailbox`, `customer_mailbox`, or `other` |
| delivery_mode | text | `wallet_only`, `managed_otp`, `external_mailbox`, or `customer_mailbox` |
| login_url | text | Optional hosted mailbox login URL |
| username | text | Optional customer-facing mailbox username |
| password_enc | text | Nullable password. Return only when `customer_can_login = true`. Never return for default `wallet_only`. |
| customer_can_login | boolean | Controls whether exception-mode handover may show mailbox login fields |
| otp_managed_by_operator | boolean | True when operator receives OTP; default wallet-only handovers do not forward OTP to customers |
| domain | text | Default `tickets.buffjo.top` |
| status | text | `active` or `disabled` |
| notes | text | Operator notes. Not visible to customer. |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-updated via trigger |

### orders

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| operator_id | uuid | FK → `auth.users`. Set on insert, enforced by RLS. |
| customer_label | text | Short label (WeChat nickname) |
| customer_contact | text | Optional contact handle |
| passenger_name | text | Sensitive. Encrypt in production. |
| passenger_birthdate | text | Sensitive. Encrypt in production. |
| ticket_month | text | e.g. `2026-06` |
| start_date | date | Ticket start date |
| after_tenth_day | bool | Whether 10th-day rule applies |
| ticket_month_count | smallint | 1–6 months |
| ticket_price_total | numeric | Base ticket price |
| service_fee | numeric | Operator service fee |
| total_amount | numeric | ticket_price_total + service_fee |
| status | text | Order status (see enum below) |
| mailbox_account_id | uuid | FK → `mailbox_accounts`. Nullable. |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-updated via trigger |

Order status flow: `requested` → `paid` → `mailbox_assigned` → `ticket_purchased` → `handover_created` → `delivered` → `closed` (or `exception` at any point)

### handover_codes

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| order_id | uuid | FK → `orders`. Cascade delete. |
| code | text | Unique. 8-char alphanumeric. |
| instructions | text | Handover text shown to customer. |
| status | text | `pending`, `viewed`, or `completed` |
| viewed_at | timestamptz | Set automatically on first RPC call |
| created_at | timestamptz | Auto-set |

### audit_events

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| operator_id | uuid | FK → `auth.users` |
| action | text | e.g. `order.create`, `status.change` |
| target_table | text | e.g. `orders` |
| target_id | uuid | ID of the affected row |
| details | jsonb | Additional context |
| created_at | timestamptz | Auto-set |
