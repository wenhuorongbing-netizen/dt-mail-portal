# Architecture

## MVP Architecture — GitHub Pages + Supabase

Phase 1 uses a **static frontend on GitHub Pages** with **Supabase** as the backend-as-a-service. No custom server, no FastAPI, no self-hosted database in Phase 1.

```text
Customer mobile browser
  -> GitHub Pages (React/Vite static build)
     -> Supabase anon key (public, read-only RPC)
     -> Supabase RPC: get_handover_by_code(p_code)
        Returns one ticket handover record if RLS policy allows

Operator browser
  -> GitHub Pages (same build, different route)
     -> Supabase Auth (operator email/password login or self-registration)
     -> Supabase Postgres (orders, mailboxes, handover records)
     -> Supabase RLS policies restrict operator to their own data

Supabase project
  -> Auth          operator accounts only (customers do NOT register)
  -> Postgres      orders, controlled login records, handover records, audit logs
  -> RLS           customer handover lookup by single-use code
  -> RPC           server-side functions for handover code validation
  -> Storage       (future) handover documents, SOP attachments
```

## Key design decisions

### Customers do not register or log in

Customers receive a **handover code** or **handover link** (e.g. `portal.buffjo.top/h/abc123`). The frontend calls a Supabase RPC function (`get_handover_by_code`) which:

1. Validates the code.
2. Returns the single handover record (delivery mode, Wallet instructions, status).
3. RLS ensures the query returns **only** that one record.

No customer portal accounts. No customer portal passwords. No customer session tokens.
Default `wallet_only` handovers do not expose TicketPlus+ login email, OTP,
webmail URL, or mailbox passwords. Operator-owned payment methods stay on the
operations side.

### Admin/operator uses Supabase Auth

Operators log in via Supabase Auth (email + password). RLS policies ensure operators can read/write orders, mailboxes, and handover records. Operator actions should be logged in an `audit_log` table.

### Supabase RLS and RPC for customer handover lookup

The customer-facing handover page calls a Supabase RPC function. The function receives the handover code as a parameter and returns the matching record. RLS policies on the `handover` table restrict anonymous access to only the row matching the provided code. This prevents customers from browsing other customers' data.

### service_role key must NEVER enter the frontend

The Supabase `service_role` key bypasses all RLS policies. It must only be used in:

- Supabase Edge Functions (if needed).
- Server-side scripts (admin CLI, migration scripts).
- Never in the React/Vite frontend, not even in environment variables.

The frontend uses only the **anon** key, which is safe to expose publicly because RLS policies control all access.

## Supabase schema (Phase 1)

```text
orders
  id              uuid PK
  customer_label  text          (nickname or short ID, not full PII)
  status          text          (requested, paid, mailbox_assigned, ticket_purchased, handover_created, delivered, closed)
  created_at      timestamptz
  operator_id     uuid FK -> auth.users

mailbox_accounts
  id              uuid PK
  email_address   text
  provider        text          (manual, cloudflare_routing, hosted_mailbox, ...)
  delivery_mode   text          (wallet_only, managed_otp, external_mailbox, customer_mailbox)
  login_url       text          (only for customer-login mailbox modes)
  username        text          (optional customer-facing username)
  password_enc    text          (nullable; returned only when customer_can_login = true)
  customer_can_login boolean
  otp_managed_by_operator boolean
  domain          text          (e.g. tickets.buffjo.top)
  status          text          (active, disabled)
  created_at      timestamptz

handover_codes
  id              uuid PK
  order_id        uuid FK -> orders
  handover_code   text UNIQUE   (short random code, e.g. 8 alphanumeric)
  instructions    text          (Wallet-only customer instructions by default)
  status          text          (pending, viewed, completed)
  viewed_at       timestamptz
  created_at      timestamptz

audit_log
  id              uuid PK
  operator_id     uuid FK -> auth.users
  action          text
  target_table    text
  target_id       uuid
  details         jsonb
  created_at      timestamptz
```

## RLS policy sketch

```sql
-- Customers can look up one handover by code via RPC only
-- The RPC function uses SECURITY DEFINER to read the handover table
-- and returns only the matching row. No direct table access for anon.

-- Operators can read/write orders, mailboxes, handover
CREATE POLICY "Operators manage orders" ON orders
  FOR ALL USING (operator_id = auth.uid());

CREATE POLICY "Operators manage mailboxes" ON mailboxes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = mailboxes.order_id AND orders.operator_id = auth.uid())
  );

CREATE POLICY "Operators manage handover" ON handover
  FOR ALL USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = handover.order_id AND orders.operator_id = auth.uid())
  );
```

## Frontend architecture (Phase 1)

```text
frontend/
  src/
    pages/
      CustomerHandover.tsx    /h/:code route, calls get_handover_by_code RPC
      CustomerLanding.tsx     / landing page with independent-service notice
      AdminLogin.tsx          /admin login via Supabase Auth
      AdminDashboard.tsx      /admin orders, mailboxes, handover management
    lib/
      supabaseClient.ts       Supabase JS client init (anon key only)
    App.tsx                   router setup
    main.tsx                  entry point
```

The frontend is a standard React + TypeScript + Vite project. It builds to static files and deploys to GitHub Pages. No server-side rendering, no API proxy needed in Phase 1.

## Future phases — FastAPI backend

FastAPI, mailcow API integration, and the modular backend system are planned for **future phases** when automated mailbox creation and more complex workflows are needed. The FastAPI skeleton in this repo remains as preparation for that phase.

```text
Future architecture (Phase 3+):
  FastAPI backend
    -> module registry, admin API, mailcow API wrapper
    -> replaces direct Supabase RPC for complex operations
    -> Supabase remains as the database (via connection string)
    -> mailcow integration for automated mailbox provisioning
```

## Wallet-only workflow (current)

Current customer delivery is wallet-only:

```text
TicketPlus+ ticket
  -> official TicketPlus+ App / email / web account Wallet add flow
  -> operator prepares Apple Wallet / Google Wallet customer instructions
  -> customer adds ticket to Wallet and shows the QR code during inspection
```

Customers do not receive TicketPlus+ login email, OTP, webmail links, or mailbox
passwords by default. `managed_otp` and `external_mailbox` are exception modes
only after payment-method and subscription risk has been reviewed.

## Self-hosted email infrastructure (future optional only)

```text
mailcow                 Postfix, Dovecot, Rspamd, SOGo/admin
Roundcube               optional exception-mode webmail UI
DNS                     MX/SPF/DKIM/DMARC/PTR
```

## Production deployment

### Phase 1

```text
GitHub Pages            static React/Vite frontend
Supabase                Auth, Postgres, RLS, RPC
```

### Future

```text
Tencent Cloud CVM (or similar)
  Docker + Compose
  mailcow-dockerized
  Roundcube container
  FastAPI backend container
  Nginx reverse proxy
```

## Domain plan

```text
portal.buffjo.top       customer portal (GitHub Pages custom domain)
webmail.buffjo.top      optional hosted/self-hosted webmail (not current default)
ops.buffjo.top          admin panel (same GitHub Pages build, /admin route)
mail.buffjo.top         mailcow host (future)
tickets.buffjo.top      customer-facing login email / routed address domain
```

## Development principles

- Phase 1 is static frontend + Supabase only. No custom backend.
- `service_role` key never enters the frontend bundle.
- RLS policies enforce all data access boundaries.
- Customers access exactly one handover record via code, nothing else.
- Default customer delivery is `wallet_only`; do not expose account login while an operator-owned payment method remains attached.
- Operators authenticate via Supabase Auth.
- Prefer manual SOP support over risky third-party automation.
- Build mobile-first.
- Treat personal data as sensitive from day one.
- Self-hosted mailcow/Roundcube is a future optional path, not the current deployment.
