# Agent Notes

## Project Intent

DT Mail Portal is the working repo for the D-Ticket / TicketPlus+ customer mailbox handover flow. Keep the first version focused: customer instructions, internal order workflow, mailbox generation workflow, and deployment documentation.

## Architecture Rules

- Backend modules live under `backend/app/modules/<module_id>/`.
- Each module must include `module.config.json`.
- Each enabled module should expose a FastAPI `router` referenced by `backend_router`.
- Frontend navigation should come from `/api/modules` when the backend is running, with local fallback data only for development.
- Shared UI shell belongs in `frontend/src/core/`.
- Business-specific screens belong in `frontend/src/modules/`.

## First-Version Boundaries

Do not build automated TicketPlus+ purchase, customer payment, public signup, mass email, or a full CRM until the MVP admin workflow is stable.

## Verification

Run these before committing changes that touch app code:

```powershell
cd frontend
npm run build
npm run lint
```

For backend syntax checks:

```powershell
python -m compileall backend/app
```
