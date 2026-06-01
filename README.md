# D-Ticket Mail Portal

Mobile-first customer handover portal and admin panel for a Deutschlandticket purchase-assistance workflow.

**Phase 1 architecture: GitHub Pages + Supabase.** The frontend is a React/Vite static build deployed to GitHub Pages. Supabase provides Auth, Postgres, RLS, and RPC. There is no custom backend server in Phase 1.

> Independent service notice: this project is not an official TicketPlus+, Deutsche Bahn, BVG, Deutschlandticket, Ticketmaster, or transport-company service. It is a purchase-assistance and ticket handover workflow system.

## Current Workflow

1. Operator creates an order and records the operator-controlled TicketPlus+ login email internally.
2. Operator purchases manually and prepares official Apple Wallet / Google Wallet delivery links from the issuer flow.
3. Operator creates a Wallet-only handover record with a unique code.
4. Customer opens `/#/h/:code` and sees Wallet add instructions, ticket rules, and support information.
5. Operator tracks order status in the admin panel.

Customers do **not** register or log in. By default, customers do **not** receive TicketPlus+ login email, OTP, mailbox password, or webmail access.

## What This Repo Includes

- React + TypeScript + Vite frontend.
- Supabase Auth, Postgres, RLS, and RPC SQL files.
- Wallet-only customer handover UI.
- Admin order and email inventory panels.
- Vitest tests for API wrappers, handover view logic, order handover text, operator auth, and Supabase SQL contracts.
- GitHub Actions for CI and GitHub Pages deployment.
- Future backend skeleton/docs only; not part of Phase 1 deployment.

## One-Step Commands

Install frontend dependencies:

```bash
npm run install:all
```

Start local development:

```bash
npm run dev
```

Run the deploy gate:

```bash
npm run deploy:check
```

`deploy:check` runs Vitest, builds the production frontend, and scans the bundle for forbidden `service_role`-style tokens.

## Environment

Create `frontend/.env.local` from `frontend/.env.example`:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
# Optional only for approved customer-login exception modes:
# VITE_WEBMAIL_URL=https://hosted-mail.example.com
# Optional operator short-login suffix:
# VITE_OPERATOR_AUTH_DOMAIN=operators.localhost
# Optional; keep aligned with Supabase Auth password policy:
# VITE_OPERATOR_MIN_PASSWORD_LENGTH=6
# Optional GitHub Pages base path override:
# VITE_BASE_PATH=/dt-mail-portal/
```

Never commit `.env.local`. Never expose the Supabase `service_role` key in frontend code, environment variables, GitHub Pages variables, or build artifacts.

Operator login accepts a short account name. For example, typing `abc` is sent to Supabase Auth as `abc@operators.localhost` by default, or as `abc@<VITE_OPERATOR_AUTH_DOMAIN>` when configured. Supabase's default password policy still requires at least 6 characters; lowering this for `482`-style short passwords requires matching Supabase Auth settings and is not recommended for production.

## GitHub Pages Deployment

The repository includes `.github/workflows/pages.yml`. On push to `main`, it installs frontend dependencies, runs `npm run deploy:check`, and uploads `frontend/dist` to GitHub Pages.

Setup:

1. Enable GitHub Pages in repo Settings, Pages, Source: **GitHub Actions**.
2. Add repository variables under Settings, Secrets and variables, Actions, Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_WEBMAIL_URL` only if an exception-mode webmail fallback is needed
   - `VITE_OPERATOR_AUTH_DOMAIN` optional; use a real email domain if Supabase email confirmations stay enabled
   - `VITE_BASE_PATH` optional; GitHub Actions auto-detects `/<repo>/` for the default `github.io/<repo>/` Pages domain
3. Run `supabase/schema.sql`, then `supabase/policies.sql`, then pending files in `supabase/migrations/` for existing databases.

For a zero-cost deployment, use the GitHub Pages default URL (`https://<owner>.github.io/<repo>/`) and the Supabase project URL (`https://<project-ref>.supabase.co`). A custom domain is optional and not required.

## Security Rules

- Frontend uses only the Supabase `anon` key.
- Customer lookup uses only `get_handover_by_code(p_code text)`.
- Wallet-only handovers hide TicketPlus+ login email, mailbox password, webmail URL, and mailbox username.
- `managed_otp`, `external_mailbox`, and `customer_mailbox` are exception modes only.
- Do not give customers account access while an operator-owned payment method remains attached.
- Do not automate CAPTCHA, OTP bypass, third-party account creation, third-party payment, or ticket purchase.

## Key Docs

- [`docs/CURRENT.md`](docs/CURRENT.md): single source of truth for Phase 1.
- [`docs/ops/wallet-only-delivery.md`](docs/ops/wallet-only-delivery.md): default Wallet-only workflow.
- [`docs/ops/managed-otp-workflow.md`](docs/ops/managed-otp-workflow.md): managed OTP exception workflow.
- [`docs/supabase/setup.md`](docs/supabase/setup.md): Supabase setup, schema, RLS, RPC.
- [`docs/architecture.md`](docs/architecture.md): Supabase-first architecture.
- [`AGENTS.md`](AGENTS.md): AI coding instructions.
