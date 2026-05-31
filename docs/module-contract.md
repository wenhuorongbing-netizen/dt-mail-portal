# Module Contract

Every backend module must include:

```json
{
  "id": "orders",
  "title": "Orders",
  "route": "/admin/orders",
  "icon": "ClipboardList",
  "layout": "list",
  "nav_position": 20,
  "backend_router": "app.modules.orders.backend.router.router",
  "permissions": ["admin", "operator"],
  "description": "Internal order workflow",
  "enabled": true
}
```

Required fields:

- `id`: stable module identifier, also used in `/api/<id>`.
- `title`: navigation label.
- `route`: frontend route.
- `icon`: lucide icon name used by the sidebar.
- `layout`: one of `list`, `calendar`, `chat`, `form`, `custom`.
- `nav_position`: numeric navigation sort key.
- `backend_router`: import path to a FastAPI router instance.

Recommended backend files:

```text
backend/app/modules/<module_id>/
  module.config.json
  backend/
    router.py
    models.py
    schemas.py
```

Recommended frontend files:

```text
frontend/src/modules/<moduleName>/<ModuleName>Page.tsx
```
