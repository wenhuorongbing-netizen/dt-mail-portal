# DT Mail Portal

D-Ticket / TicketPlus+ mailbox and account handover portal for the "节操都市" project set.

This repo is intentionally scoped as a starter architecture: FastAPI backend, React + TypeScript frontend, modular admin shell, docs, VS Code workspace, and GitHub planning seeds.

## Current Scope

- Mobile-first customer portal shell for handover instructions.
- Internal admin shell with module registry and example order module.
- FastAPI module loader that exposes `/api/modules` and mounts module routers.
- SQLAlchemy model example and local SQLite default for smoke tests.
- Mailcow / Roundcube / DNS deployment notes prepared as docs.

## Not In Scope For The First Version

- Automated TicketPlus+ registration or payment.
- Customer self checkout.
- Full CRM, full i18n, bulk email blasting, or public free signup.

## Layout

```text
backend/     FastAPI app, module loader, SQLAlchemy setup
frontend/    Vite React app and admin/customer portal UI shell
docs/        Architecture, module contract, roadmap, ops notes
scripts/     GitHub/bootstrap helper scripts
.github/     Issue template and planning metadata
```

## Local Development

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The frontend falls back to local module metadata when `/api/modules` is unavailable.
