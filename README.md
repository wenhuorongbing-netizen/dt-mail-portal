# D-Ticket Mail Portal Startup Kit

A mobile-first mailbox portal + modular CRM/admin panel for a Deutschlandticket purchase-assistance workflow.

This repository is designed for **vibe coding with guardrails**: one human owner, multiple AI-assisted implementation passes, clear architecture contracts, and a module system that allows new features to be added without rewriting the core shell.

> Independent service notice: this project is not an official TicketPlus+, Deutsche Bahn, BVG, Deutschlandticket, Ticketmaster, or transport-company service. It is a mailbox/account handover and operational workflow system for purchase assistance.

## What this starter includes

- FastAPI backend skeleton with module loader.
- React + TypeScript + Vite frontend skeleton.
- Module config contract using `module.config.json`.
- Example addon module.
- Professional mobile-first UI direction.
- `AGENTS.md` for AI coding agents.
- Prompt library for generating modules, UI, backend APIs, deployment docs, and reviews.
- Docs for architecture, roadmap, security, privacy, and TicketPlus+ manual SOP.
- Initial GitHub issues / milestone plan.

## Target production domains

```text
portal.buffjo.top       customer portal
webmail.buffjo.top      customer mailbox login
ops.buffjo.top          internal operations/admin panel
mail.buffjo.top         mailcow admin/mail host
tickets.buffjo.top      customer mailbox domain
```

## Recommended first phase

Do **not** rent production infrastructure yet. First build and test locally:

1. Initialize a private GitHub repository.
2. Push this starter kit.
3. Run frontend and backend locally.
4. Polish the customer portal and admin order workflow.
5. Build the Roundcube theme/config package.
6. Only then rent the Tencent Cloud CVM and deploy mailcow/Roundcube.

## Local development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend URLs:

```text
http://localhost:8000/api/health
http://localhost:8000/api/modules
http://localhost:8000/api/example/items
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Module philosophy

The core owns:

- navigation
- layout shell
- shared UI components
- module config loading
- base routing
- theme and design system

Each module owns:

- module config
- its backend router/models/schemas
- its frontend page content
- its business logic

A new module should work by adding a new folder under:

```text
backend/app/modules/<module_id>/
frontend/src/modules/<module_id>/
```

and adding a `module.config.json` on the backend.

## Non-negotiable product boundaries

This project may automate:

- mailbox creation
- password generation
- internal order creation
- customer handover text
- manual purchase checklist generation
- internal status tracking

This project should **not** automate:

- third-party account registration at TicketPlus+ or similar platforms
- CAPTCHA/OTP bypass
- automated payment
- platform rule evasion
- impersonating official ticket providers

Keep the system professional, efficient, and compliant.

## Key docs

- `AGENTS.md` — instructions for AI coding agents.
- `docs/product-brief.md` — project purpose and product scope.
- `docs/architecture.md` — technical architecture.
- `docs/module-contract.md` — addon/module contract.
- `docs/design-system.md` — visual direction.
- `docs/ticketplus-sop.md` — manual purchase workflow.
- `docs/roadmap.md` — implementation phases.
- `prompts/` — prompt library for vibe coding.
