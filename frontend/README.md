# DT Mail Portal Frontend

React + TypeScript + Vite frontend for the DT Mail Portal workspace.

## Commands

```powershell
npm install
npm run dev
npm run test:run
npm run build
npm run deploy:check
```

## Structure

```text
src/core/      Shared shell, layouts, module registry, UI primitives
src/modules/   Business pages for customer portal, orders, and admin inventory
src/lib/       Supabase client, handover API wrapper, operator auth helper
src/__tests__/ Vitest coverage for API wrappers, handover logic, order text, and SQL contracts
```
