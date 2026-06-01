# Working Prompts

## Build A New Module

Use this when adding an admin feature:

```text
Add a new DT Mail Portal module named <name>. Follow docs/module-contract.md.
Create backend module.config.json, router.py, schemas.py, models.py if persistence is needed.
Create a frontend page under frontend/src/modules and wire the route in App.tsx.
Run frontend build/lint and backend compile checks.
```

## Customer Portal Page

```text
Create a mobile-first customer portal page for <topic>.
Keep the content operational and clear. Default delivery is `wallet_only`; do not add customer account login, payment, public signup, or automated TicketPlus+ registration.
```

## Deployment Task

```text
Update docs/deployment for <service>.
Include prerequisites, commands, DNS records, verification checks, rollback notes, and open questions.
```
