# Prompt — Generate a New Addon Module

```text
You are adding a new addon module to D-Ticket Mail Portal.

Module to create:
- id: <MODULE_ID>
- title: <MODULE_TITLE>
- route: /<MODULE_ID>
- icon: <ICON_KEY>
- layout: <list|calendar|chat|form|custom>
- nav_position: <NUMBER>
- purpose: <PURPOSE>

Follow the repository module contract exactly.

Backend files:
backend/app/modules/<MODULE_ID>/module.config.json
backend/app/modules/<MODULE_ID>/backend/router.py
backend/app/modules/<MODULE_ID>/backend/models.py
backend/app/modules/<MODULE_ID>/backend/schemas.py
backend/app/modules/<MODULE_ID>/backend/__init__.py

Frontend files:
frontend/src/modules/<MODULE_ID>/index.tsx

Rules:
- Do not modify core layout unless absolutely necessary.
- Do not render sidebar/topbar in the module component.
- Use shared UI components from core/ui.
- Add Pydantic schemas for all API payloads.
- Add response_model to FastAPI routes.
- Keep frontend TypeScript strict.
- Add a short README note explaining the module.

Business/safety boundaries:
- No automation of third-party account registration, CAPTCHA/OTP bypass, or payment.
- If the module touches customer data, explain data minimization.

Generate code and a short implementation summary.
```
