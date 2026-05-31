# AGENTS.md — AI Coding Instructions

This file defines how AI agents should work inside this repository.

## Product context

We are building a professional, mobile-first mailbox portal and modular operations CRM/admin panel for Deutschlandticket purchase-assistance workflows.

The system includes:

- Customer portal.
- Customer webmail entry and Roundcube theming/config.
- Internal admin/CRM panel.
- Backend module loader.
- Mailbox automation through mailcow API.
- Manual TicketPlus+ purchase SOP support.

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

Agents may implement:

- Internal order workflow automation.
- Mailbox creation through our own mail server/mailcow API.
- Customer handover templates.
- Status tracking and reminders.
- Manual SOP checklists.
- UI/UX for customers and admins.

Always include the independent-service notice where customer-facing pages discuss ticket providers.

## Core architecture rules

1. Keep `core/` stable.
2. Add business features as modules/addons.
3. Do not hard-code business module logic into the layout shell.
4. Do not add raw HTML styling inside modules if a shared UI component exists.
5. New backend modules must have a `module.config.json`.
6. New frontend modules must live under `frontend/src/modules/<module_id>/`.
7. A frontend module must not create its own app shell/sidebar/topbar.
8. A backend module must expose an `APIRouter` referenced by `backend_router` in config.
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

## Backend rules

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
feat(portal): add mobile customer landing page
feat(admin): add order creation workflow
feat(email): integrate mailcow mailbox creation
fix(api): handle disabled module configs
chore(docs): add Tencent Cloud deployment checklist
```

## Testing expectations

Minimum checks before merging:

- Backend imports successfully.
- `/api/health` works.
- `/api/modules` returns module configs.
- Example module CRUD works.
- Frontend renders without TypeScript errors.
- Sidebar routes match module configs.
- Mobile viewport 390px wide is usable.

## When unsure

Prefer a simple, robust workflow over clever automation. The business value is fast, reliable order handling, not risky third-party automation.
