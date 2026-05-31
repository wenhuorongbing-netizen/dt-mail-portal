# Architecture

## High-level system

```text
Customer mobile browser
  -> portal.buffjo.top       customer portal and guides
  -> webmail.buffjo.top      Roundcube webmail, default domain auto-filled

Operator browser
  -> ops.buffjo.top          modular admin/CRM shell

Backend
  -> FastAPI                 module registry, admin API, mailcow API wrapper
  -> PostgreSQL              orders, mailbox records, logs

Email infrastructure
  -> mailcow                 Postfix, Dovecot, Rspamd, SOGo/admin
  -> Roundcube               customer webmail UI
  -> DNS                     MX/SPF/DKIM/DMARC/PTR
```

## Backend architecture

The backend uses a modular addon loader.

```text
backend/app/core/
  config.py
  database.py
  modules_loader.py
  ui_schemas.py

backend/app/modules/<module_id>/
  module.config.json
  backend/router.py
  backend/models.py
  backend/schemas.py
```

`modules_loader.py` scans each module folder, reads `module.config.json`, imports the configured router, and registers it under `/api/<module_id>`.

## Frontend architecture

The frontend uses a module registry fetched from `/api/modules`.

```text
frontend/src/core/
  layout/       shell, sidebar, topbar, page frames
  ui/           shared UI components
  modules/      config fetching and dynamic module loading

frontend/src/modules/<module_id>/
  index.tsx     default exported module component
```

`ModulePage` receives a `ModuleConfig`, selects the standard frame by layout type, and lazy-loads the module component by convention.

## Module layouts

- `list` — CRM lists, orders, knowledge items, notes.
- `calendar` — monthly scheduling, deadlines, renewal dates.
- `chat` — conversation style modules.
- `form` — settings/admin forms.
- `custom` — module has full internal control but still lives inside the shell.

## Production deployment sketch

```text
Tencent Cloud CVM
  Ubuntu 22.04/24.04
  Docker + Compose
  PostgreSQL or managed PostgreSQL
  mailcow-dockerized
  Roundcube container
  FastAPI backend container
  Vite frontend static build behind Nginx
```

## Domain plan

```text
mail.buffjo.top         mailcow host
webmail.buffjo.top      customer Roundcube login
portal.buffjo.top       customer portal
ops.buffjo.top          internal admin
customers/tickets domain: tickets.buffjo.top
```

## Development principles

- Keep shell stable.
- Add features through modules.
- Prefer manual SOP support over risky third-party automation.
- Build mobile-first.
- Treat personal data as sensitive from day one.
