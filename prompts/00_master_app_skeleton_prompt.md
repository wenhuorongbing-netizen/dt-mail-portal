# Prompt — Generate Modular CRM/Admin Application Skeleton

Use this prompt with a coding agent when you want to regenerate or extend the skeleton.

```text
You are a senior full-stack product engineer. Design and implement a production-grade web application skeleton for a modular CRM/admin platform.

Project context:
- Product name: D-Ticket Mail Portal.
- Purpose: mobile-first wallet-only ticket handover portal + internal operations CRM for Deutschlandticket purchase-assistance workflows.
- Important boundary: do not implement automated third-party account registration, CAPTCHA/OTP bypass, automated ticket purchasing, or customer account handover while an operator-owned payment method remains attached. Build internal workflow automation only.
- The app must look professional and trustworthy, not like a generic AI admin dashboard.

Tech stack:
- Backend: Python + FastAPI.
- Frontend: React + TypeScript + Vite.
- DB: PostgreSQL via SQLAlchemy.
- Repo split: backend/ and frontend/.

Core idea:
The core owns navigation, layout shell, shared UI components, theme, module registry, and module loading. Business features are addons/modules.

Backend structure:
backend/app/core/config.py
backend/app/core/database.py
backend/app/core/modules_loader.py
backend/app/core/ui_schemas.py
backend/app/modules/<module_id>/module.config.json
backend/app/modules/<module_id>/backend/router.py
backend/app/modules/<module_id>/backend/models.py
backend/app/modules/<module_id>/backend/schemas.py
backend/app/main.py

Frontend structure:
frontend/src/core/layout/Sidebar.tsx
frontend/src/core/layout/Topbar.tsx
frontend/src/core/layout/PageLayout.tsx
frontend/src/core/layout/ModulePage.tsx
frontend/src/core/ui/Button.tsx
frontend/src/core/ui/Input.tsx
frontend/src/core/ui/Card.tsx
frontend/src/core/ui/Table.tsx
frontend/src/core/ui/Tag.tsx
frontend/src/core/ui/Modal.tsx
frontend/src/core/modules/modulesRegistry.ts
frontend/src/core/modules/loadModuleComponent.tsx
frontend/src/modules/example/index.tsx
frontend/src/App.tsx
frontend/src/main.tsx

Module config format:
{
  "id": "calendar",
  "title": "Calendar",
  "route": "/calendar",
  "icon": "calendar",
  "layout": "calendar",
  "nav_position": 10,
  "backend_router": "app.modules.calendar.backend.router:router",
  "description": "Optional description",
  "enabled": true,
  "permissions": []
}

Backend module loader:
- Scan backend/app/modules/*/module.config.json.
- Parse configs with Pydantic.
- Import backend_router using importlib.
- Register with app.include_router(router, prefix=f"/api/{module_id}").
- Expose GET /api/modules with public configs, excluding backend_router.

Frontend module system:
- Fetch module configs from /api/modules.
- Sidebar sorts by nav_position.
- "Add module" item is a stub.
- ModulePage selects layout by config.layout.
- Lazy-load frontend modules using Vite import.meta.glob convention: frontend/src/modules/<id>/index.tsx.

Design:
- Aesthetic: professional transit operations desk.
- Mobile-first.
- Dark navy sidebar, ivory background, amber/blue operational accents.
- Avoid generic purple gradients and default SaaS dashboard templates.
- Use shared components; modules must not create their own shell.

Example module:
- backend/app/modules/example/module.config.json.
- SQLAlchemy model ExampleItem(id, name, created_at).
- Pydantic schemas.
- Router endpoints: GET /items, POST /items, DELETE /items/{id}.
- frontend/src/modules/example/index.tsx uses shared UI and no outer shell.

Documentation:
- Explain how to add a new module.
- Explain available layouts: list, calendar, chat, form, custom.
- Include one example prompt for generating a new module.

Code quality:
- Strong TypeScript types.
- Pydantic request/response schemas.
- Clear comments where module loader and ModulePage work.
- Clean enough that I can add a new module without touching core shell.
```
