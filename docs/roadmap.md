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
- Handover page (`/h/:code`) — customer enters or opens handover link, sees mailbox credentials and TicketPlus+ login guide.
- Handover lookup via Supabase RPC function (`get_handover_by_code`).
- No customer registration or login. Access by handover code only.
- Login instructions page.
- TicketPlus+ guide page.
- Rules page.
- Privacy and terms pages.

### Admin/operator side

- Admin login via Supabase Auth (email + password).
- Order list (create, view, update status).
- New order form (customer label, notes).
- Manual mailbox import (operator types email address and password into Supabase — no mailcow API yet).
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

## Phase 2 — UX polish and Roundcube prep

- Customer handover page polish (instructions, copy-to-clipboard, status display).
- Admin dashboard improvements (filters, search, bulk view).
- Handover text template editor for operator.
- Roundcube theme/config package design.
- Customer webmail guide content.

## Phase 3 — FastAPI backend + mailcow automation

- FastAPI backend replaces direct Supabase RPC for complex operations.
- Supabase remains as database (FastAPI connects via connection string).
- Module loader system activation.
- mailcow API integration for automated mailbox creation.
- Roundcube container deployment.
- DNS records for `tickets.buffjo.top` (MX/SPF/DKIM/DMARC/PTR).

## Phase 4 — Real server deployment

- Tencent Cloud CVM (or equivalent).
- Docker + Compose for mailcow, Roundcube, FastAPI.
- SSL certificates.
- Test `@tickets.buffjo.top` with TicketPlus+ OTP delivery.
- Test two real end-to-end accounts.

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
