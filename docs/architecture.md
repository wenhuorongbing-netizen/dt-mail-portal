# Architecture

## Goal

Create a small but expandable portal for D-Ticket / TicketPlus+ handover operations:

- Customer-facing mobile portal.
- Internal admin workspace.
- Mailbox and delivery workflow.
- Clear deployment path for Mailcow, Roundcube, DNS, DKIM, SPF, and DMARC.

## Stack

- Frontend: React, TypeScript, Vite, React Router, lucide-react.
- Backend: FastAPI, SQLAlchemy, Pydantic settings.
- Database: local SQLite for first smoke tests, PostgreSQL for real deployment.
- Email stack: Mailcow and Roundcube documented before API automation.

## Module Pattern

Backend modules are discovered from `backend/app/modules/*/module.config.json`.
The loader imports `backend_router` and mounts each router at `/api/<module_id>`.

Frontend navigation should request `/api/modules`. During local frontend-only work, it falls back to `frontend/src/core/modules/modulesRegistry.ts`.

## First Domains

- `tickets.buffjo.top`: customer portal.
- `webmail.buffjo.top`: Roundcube webmail.
- `mail.buffjo.top`: mail service.
- `ops.buffjo.top`: internal operations.
