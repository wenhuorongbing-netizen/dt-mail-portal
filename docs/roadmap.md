# Roadmap

## Phase 0 — Starter kit (done)

- Repository structure.
- Architecture docs.
- AGENTS.md.
- Prompt library.
- Backend/frontend skeleton.

## Phase 1 — Static frontend + Supabase MVP

**Architecture:** React/Vite frontend on GitHub Pages. Supabase for Auth, Postgres, RLS, RPC.

### Customer side

- Mobile landing page with independent-service notice.
- Handover page (`/h/:code`) — customer enters or opens handover link, sees Wallet-only delivery instructions, ticket rules, and support links.
- Handover lookup via Supabase RPC function (`get_handover_by_code`).
- No customer registration or login. Access by handover code only.
- Wallet delivery instructions page.
- Wallet delivery guide page.
- Rules page.
- Privacy and terms pages.

### Admin/operator side

- Admin login via Supabase Auth (email + password).
- Order list (create, view, update status).
- New order form (customer label, notes).
- Manual controlled-login record import (operator records login email, provider, delivery mode, Wallet delivery notes, and optional customer-login credentials for approved exception modes).
- Handover record creation (generate handover code, write instructions).
- Status workflow: `requested` → `paid` → `mailbox_assigned` → `ticket_purchased` → `handover_created` → `delivered` → `closed` (or `exception`).
- Audit log for admin actions.

### Supabase setup

- Create Supabase project.
- Design and migrate schema (orders, mailboxes, handover, audit_log).
- Implement RLS policies (operator CRUD on own orders, anon RPC-only handover lookup).
- Implement `get_handover_by_code` RPC function.
- Frontend uses anon key only. `service_role` key stays out of the bundle.

### Deployment

- GitHub Pages deployment (Vite build, `gh-pages` branch or GitHub Actions).
- Custom domain setup for `portal.buffjo.top`.

## Phase 2 — Wallet-only hardening and UX polish

- Customer handover page polish (instructions, copy-to-clipboard, status display).
- Admin dashboard improvements (filters, search, bulk view).
- Handover text template editor for operator.
- Cloudflare Email Routing / manual inbox test notes.
- Customer Wallet add guide content.
- Exception managed-OTP review checklist.
- Real Supabase end-to-end tests and GitHub Pages deployment test.

## Phase 3 — Optional hosted mailbox or backend expansion

- FastAPI backend replaces direct Supabase RPC for complex operations.
- Supabase remains as database (FastAPI connects via connection string).
- Module loader system activation.
- Optional hosted mailbox provider support for approved exception modes when customers must log into mailboxes.
- Self-hosted mailcow/Roundcube remains a future optional path only.
- DNS records for routed `tickets.buffjo.top` email.

## Phase 4 — Future optional self-hosted email

- Only if the self-hosted path is explicitly reopened.
- Tencent Cloud CVM or equivalent.
- Docker + Compose for mailcow, Roundcube, FastAPI.
- SSL certificates.
- Test `@tickets.buffjo.top` with TicketPlus+ OTP delivery for operator-controlled accounts.
- Test two real end-to-end wallet-only handovers.

## Phase 5 — Launch hardening

- Operator auth hardening (MFA, session management).
- Automated backups.
- Privacy/deletion workflows (GDPR-style data export and deletion).
- Customer SOP refinements.
- Error handling and monitoring.
- Rate limiting on handover RPC.

## Phase 6 — Addons and modules

Possible modules (when FastAPI backend is active):

- Orders module (enhanced).
- Mailboxes module (automated provisioning).
- Customer templates module.
- Calendar/reminders.
- Support inbox.
- Knowledge base.
- Profit dashboard.
- Compliance/audit log.
