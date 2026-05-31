# AGENTS.md — AI Coding Instructions

This file defines how AI agents should work inside this repository.

## Product context

We are building a professional, mobile-first mailbox portal and operations admin panel for Deutschlandticket purchase-assistance workflows.

**Phase 1 architecture: GitHub Pages + Supabase.**

The system includes:

- Customer handover page (static React on GitHub Pages).
- Admin/operator panel (same frontend, different route, Supabase Auth).
- Supabase Postgres for data (orders, mailboxes, handover records).
- Supabase RLS and RPC for access control.
- Manual TicketPlus+ purchase SOP support.

**Future phases** (not Phase 1):

- FastAPI backend for complex operations and module system.
- mailcow API integration for automated mailbox creation.
- Customer webmail via Roundcube.

The project must feel professional, trustworthy, and operationally efficient. Customers will often open pages inside mobile browsers or WeChat, so mobile-first UX is critical.

## Safety and compliance boundaries

AI agents must not implement or propose:

- CAPTCHA bypass.
- OTP interception beyond normal customer-authorized mailbox access.
- Automated third-party platform account creation.
- Automated third-party ticket purchase or payment flows.
- Browser automation that violates third-party terms.
- Impersonation of TicketPlus+, Deutsche Bahn, Deutschlandticket, BVG, or any official ticket provider.
- Use of official logos/trademarks in a way that implies affiliation.
- Customer registration or login systems (customers access via handover code only).

Agents may implement:

- Internal order workflow (via Supabase client).
- Handover code generation and lookup (via Supabase RPC).
- Status tracking and reminders.
- Manual SOP checklists.
- UI/UX for customers and admins.
- Operator authentication (via Supabase Auth).

Always include the independent-service notice where customer-facing pages discuss ticket providers.

## Core architecture rules

1. Phase 1 is **static frontend + Supabase**. Do not add FastAPI, mailcow, or self-hosted DB in Phase 1.
2. Frontend deploys to GitHub Pages. No server-side rendering.
3. Frontend uses **only** the Supabase `anon` key. The `service_role` key must NEVER appear in frontend code, environment variables, or build artifacts.
4. Customer handover lookup uses a Supabase RPC function with RLS enforcement. Customers see exactly one record.
5. Operators authenticate via Supabase Auth. RLS policies restrict operators to their own data.
6. Add business features as modules when the FastAPI backend is introduced (Phase 3+).
7. Do not hard-code business module logic into the layout shell.
8. Do not add raw HTML styling inside modules if a shared UI component exists.
9. Avoid storing personal data unless the workflow requires it.
10. Encrypt or minimize sensitive personal data such as birthdates and mailbox passwords.

## Frontend design direction

Aesthetic: **professional transit operations desk**.

Use a refined, non-generic design language:

- dark ink/navy panels
- ivory/stone backgrounds
- amber or electric-blue operational accents
- card-based mobile flow
- subtle transit-grid line motifs
- high-contrast buttons
- clear status tags
- asymmetric but disciplined spacing

Avoid:

- generic purple gradients
- default Bootstrap look
- default admin-dashboard templates
- overly playful SaaS visuals
- pretending to be an official ticket provider

Frontend must be:

- mobile-first
- WeChat browser friendly
- accessible
- fast
- copy/paste friendly for customer operations

## Supabase rules

- Use the Supabase JS client (`@supabase/supabase-js`) for all database interactions.
- Frontend initializes Supabase with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables only.
- **Never use `service_role` key in the frontend.** It bypasses all RLS policies.
- Customer handover lookup calls an RPC function (`get_handover_by_code`). Do not query the `handover_codes` table directly from the frontend for anonymous users.
- Operator CRUD operations use the Supabase client with the user's auth session. RLS policies enforce access.
- Use Supabase migrations or SQL scripts for schema changes. Track them in the repo.
- Sensitive fields (mailbox passwords) must be encrypted before storing in Postgres.

## Backend rules (future — Phase 3+)

The following rules apply when the FastAPI backend is introduced. **Do not implement these in Phase 1.**

- Use FastAPI.
- Use Pydantic schemas for request/response validation.
- Use SQLAlchemy for DB models.
- Keep routers small and module-specific.
- The module loader must scan `backend/app/modules/*/module.config.json`.
- Expose `/api/modules` for frontend navigation.
- Keep CORS configurable.
- Use dependency injection for DB sessions.

## Data handling rules

Sensitive fields:

- passenger name
- passenger birthdate
- customer contact handle
- mailbox password
- payment notes

Rules:

- Prefer not to store raw passenger data after handover.
- If stored, add encryption before production.
- Never commit `.env`, API keys, passwords, DB dumps, or real customer data.
- The Supabase `service_role` key is a secret. Never commit it or expose it in the frontend.
- Add audit logs for admin actions.
- Design deletion/export workflows early.

## Vibe coding workflow

For every major feature:

1. Write or update the spec in `docs/`.
2. Generate a focused implementation plan.
3. Implement only the minimal working slice.
4. Run/type-check/test.
5. Review against `AGENTS.md`.
6. Improve UX copy and states.
7. Commit with a clear message.

## Suggested commit style

```text
feat(portal): add customer handover page
feat(admin): add order creation workflow
feat(supabase): add handover RPC function and RLS policies
feat(auth): add operator login via Supabase Auth
fix(rls): tighten handover lookup to single record
fix(security): remove service_role key from frontend config
chore(docs): update architecture for Supabase-first MVP
chore(deploy): add GitHub Pages deployment workflow
```

## Testing expectations

Minimum checks before merging:

- Frontend builds without TypeScript errors (`npm run build`).
- Frontend renders without errors on mobile viewport (390px wide).
- Supabase client initializes with anon key only.
- Customer handover page calls `get_handover_by_code` RPC correctly.
- RLS policies tested: anonymous user can only access handover by code.
- RLS policies tested: operator can only access their own orders.
- No `service_role` key in frontend bundle or environment.
- No customer registration or login flows added.
- Sidebar routes match planned module structure.

## When unsure

Prefer a simple, robust workflow over clever automation. The business value is fast, reliable order handling, not risky third-party automation. When in doubt, check `docs/architecture.md` for the current phase rules.
