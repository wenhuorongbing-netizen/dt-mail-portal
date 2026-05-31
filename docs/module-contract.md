# Module Contract

Each module must include a backend config file:

```json
{
  "id": "orders",
  "title": "Orders",
  "route": "/orders",
  "icon": "crm",
  "layout": "list",
  "nav_position": 10,
  "backend_router": "app.modules.orders.backend.router:router",
  "description": "Order workflow and handover tracking.",
  "enabled": true,
  "permissions": ["orders:read", "orders:write"]
}
```

## Required fields

- `id` — unique identifier, lowercase kebab/snake style recommended.
- `title` — sidebar and page title.
- `route` — frontend route, usually `/<id>`.
- `icon` — icon key used by the sidebar.
- `layout` — one of `list`, `calendar`, `chat`, `form`, `custom`.
- `nav_position` — sidebar order.
- `backend_router` — Python import string for FastAPI APIRouter.

## Backend module folder

```text
backend/app/modules/orders/
  module.config.json
  backend/
    router.py
    models.py
    schemas.py
```

## Frontend module folder

```text
frontend/src/modules/orders/
  index.tsx
```

The frontend `index.tsx` default export receives:

```ts
export type ModuleComponentProps = {
  moduleId: string;
};
```

A module should not render its own sidebar/topbar. It should use shared UI:

```tsx
import { Card } from '../../core/ui/Card';
import { Button } from '../../core/ui/Button';
import { Table } from '../../core/ui/Table';
```

## Adding a new module

1. Create `backend/app/modules/<module_id>/module.config.json`.
2. Implement backend router/models/schemas.
3. Create `frontend/src/modules/<module_id>/index.tsx`.
4. Restart backend and frontend.
5. Confirm `/api/modules` includes the module.
6. Confirm the sidebar renders it.

## AI generation prompt for a new module

Use `prompts/03_new_module_generator.md`.
