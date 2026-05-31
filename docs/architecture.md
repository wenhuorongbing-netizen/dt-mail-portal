# Architecture

## MVP Architecture — GitHub Pages + Supabase

Phase 1 uses a **static frontend on GitHub Pages** with **Supabase** as the backend-as-a-service. No custom server, no FastAPI, no self-hosted database in Phase 1.

```text
Customer mobile browser
  -> GitHub Pages (React/Vite static build)
     -> Supabase anon key (public, read-only RPC)
     -> Supabase RPC: lookup_handover(handover_code)
        Returns one mailbox handover record if RLS policy allows

Operator browser
  -> GitHub Pages (same build, different route)
     -> Supabase Auth (email/password login)
     -> Supabase Postgres (orders, mailboxes, handover records)
     -> Supabase RLS policies restrict operator to their own data

Supabase project
  -> Auth          operator login only (customers do NOT register)
  -> Postgres      orders, mailboxes, handover records, audit logs
  -> RLS           customer handover lookup by single-use code
  -> RPC           server-side functions for handover code validation
  -> Storage       (future) handover documents, SOP attachments
```

## Key design decisions

### Customers do not register or log in

Customers receive a **handover code** or **handover link** (e.g. `portal.buffjo.top/h/abc123`). The frontend calls a Supabase RPC function (`lookup_handover`) which:

1. Validates the code.
2. Returns the single handover record (mailbox login, instructions, status).
3. RLS ensures the query returns **only** that one record.

No customer accounts. No customer passwords. No customer session tokens.

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
  status          text          (draft, pending_payment, paid, ticketed, handed_over, closed)
  created_at      timestamptz
  operator_id     uuid FK -> auth.users

mailboxes
  id              uuid PK
  order_id        uuid FK -> orders
  email_address   text
  password_enc    text          (encrypted, never returned raw to frontend)
  domain          text          (e.g. tickets.buffjo.top)
  status          text          (active, disabled)
  created_at      timestamptz

handover
  id              uuid PK
  order_id        uuid FK -> orders
  handover_code   text UNIQUE   (short random code, e.g. 8 alphanumeric)
  instructions    text          (TicketPlus+ login guide, webmail guide)
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
      CustomerHandover.tsx    /h/:code route, calls lookup_handover RPC
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

## Email infrastructure (future)

```text
mailcow                 Postfix, Dovecot, Rspamd, SOGo/admin
Roundcube               customer webmail UI
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
webmail.buffjo.top      customer Roundcube login (future)
ops.buffjo.top          admin panel (same GitHub Pages build, /admin route)
mail.buffjo.top         mailcow host (future)
tickets.buffjo.top      customer mailbox domain (future)
```

## Development principles

- Phase 1 is static frontend + Supabase only. No custom backend.
- `service_role` key never enters the frontend bundle.
- RLS policies enforce all data access boundaries.
- Customers access exactly one handover record via code, nothing else.
- Operators authenticate via Supabase Auth.
- Prefer manual SOP support over risky third-party automation.
- Build mobile-first.
- Treat personal data as sensitive from day one.
- FastAPI and mailcow integration are future automation layers, not Phase 1.
