# D-Ticket Mail Portal

A mobile-first mailbox portal + admin panel for a Deutschlandticket purchase-assistance workflow.

**MVP architecture: GitHub Pages + Supabase.** The frontend is a React/Vite static build deployed to GitHub Pages. Supabase provides Auth, Postgres, RLS, and RPC. No custom backend server in Phase 1.

> Independent service notice: this project is not an official TicketPlus+, Deutsche Bahn, BVG, Deutschlandticket, Ticketmaster, or transport-company service. It is a mailbox/account handover and operational workflow system for purchase assistance.

## How it works

1. Operator creates an order and manually imports/types mailbox credentials into Supabase.
2. Operator creates a handover record with instructions and a unique code.
3. Customer receives a handover link (e.g. `portal.buffjo.top/h/abc123`).
4. Customer opens the link — sees mailbox login and TicketPlus+ guide. No login required.
5. Operator tracks order status through the admin panel.

Customers do **not** register or log in. They access exactly one handover record via code.

## What this repo includes

- React + TypeScript + Vite frontend (static, deploys to GitHub Pages).
- Supabase integration (Auth, Postgres, RLS, RPC).
- `AGENTS.md` for AI coding agents.
- Docs for architecture, roadmap, product brief, security, and workflow.
- FastAPI backend skeleton (for future automation phases, not used in MVP).
- Module config contract (for future phases).

## Target production domains

```text
portal.buffjo.top       customer portal + admin panel (GitHub Pages)
webmail.buffjo.top      customer mailbox login (future — Roundcube)
mail.buffjo.top         mail host (future — mailcow)
tickets.buffjo.top      customer mailbox domain (future)
```

## Phase 1 — Static frontend + Supabase

No custom backend. No server to rent.

1. Create a Supabase project (free tier works for development).
2. Set up schema: `orders`, `mailboxes`, `handover`, `audit_log`.
3. Implement RLS policies and `lookup_handover` RPC function.
4. Build React frontend with Supabase JS client.
5. Deploy to GitHub Pages (GitHub Actions or `gh-pages` branch).
6. Configure custom domain.

### Local development

```bash
cd frontend
npm install
npm run dev
```

Create a `.env.local` with your Supabase credentials:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> **Never commit `.env.local` or expose the `service_role` key in the frontend.**

### GitHub Pages deployment

The repository includes a GitHub Actions workflow (`.github/workflows/pages.yml`) that builds the frontend and deploys to GitHub Pages on every push to `main`.

**Setup steps:**

1. **Enable GitHub Pages** — go to your repo → Settings → Pages → set **Source** to **GitHub Actions**.
2. **Add repository variables** — go to Settings → Secrets and variables → Actions → Variables tab:
   - `VITE_SUPABASE_URL` — your Supabase project URL (e.g. `https://your-project.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` — your Supabase **anon** public key
3. Push to `main` or trigger the workflow manually from the Actions tab.

> The `anon` key is safe to expose in the frontend bundle — RLS policies control all access. **Never** add the `service_role` key as a variable or secret for this workflow.

**Custom domain** — after the first deploy, go to Settings → Pages → Custom domain and enter your domain (e.g. `portal.buffjo.top`). Add a `CNAME` DNS record pointing to `<username>.github.io`.

### Future backend (Phase 3+)

The FastAPI skeleton remains in the repo for future automation:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

This is not used in Phase 1.

## Security rules

- `service_role` key must NEVER enter the frontend bundle.
- Frontend uses only the `anon` key.
- Customer handover lookup uses Supabase RPC + RLS — customers can only see their own record.
- Operators authenticate via Supabase Auth.
- Sensitive fields (passwords, birthdates) are encrypted or minimized.
- Never commit `.env`, API keys, passwords, or real customer data.

## Non-negotiable product boundaries

This project may automate:

- Internal order workflow.
- Handover code generation.
- Status tracking.
- Manual SOP checklist display.
- Customer handover text delivery.

This project should **not** automate:

- Third-party account registration at TicketPlus+ or similar platforms.
- CAPTCHA/OTP bypass.
- Automated payment.
- Platform rule evasion.
- Impersonating official ticket providers.

Keep the system professional, efficient, and compliant.

## Key docs

- `AGENTS.md` — instructions for AI coding agents.
- `docs/product-brief.md` — project purpose and product scope.
- `docs/architecture.md` — technical architecture (Supabase-first).
- `docs/roadmap.md` — implementation phases.
- `docs/module-contract.md` — addon/module contract (for future phases).
- `docs/design-system.md` — visual direction.
- `docs/ticketplus-sop.md` — manual purchase workflow.
- `docs/vibe-coding-workflow.md` — AI-assisted build workflow.
- `prompts/` — prompt library for vibe coding.
