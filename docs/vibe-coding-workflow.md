# Vibe Coding Workflow

This project is designed to be built in short AI-assisted passes, but with strong architectural contracts.

## The rule

Never ask an AI agent to "build everything". Give it one slice, one acceptance test, and one boundary.

## Current architecture context

**Phase 1 is GitHub Pages + Supabase.** No FastAPI backend, no mailcow, no self-hosted database. The frontend is a React/Vite static build deployed to GitHub Pages. Supabase handles Auth, Postgres, RLS, and RPC.

Read `docs/architecture.md` before starting any implementation work.

## Session pattern

### 1. Context pack

Paste these files or mention them to the coding agent:

- `AGENTS.md`
- `docs/architecture.md`
- `docs/product-brief.md`
- relevant prompt from `prompts/`

### 2. One-slice prompt

Example:

```text
Read AGENTS.md and docs/architecture.md. Implement the customer handover page only. The page calls a Supabase RPC function get_handover_by_code(p_code) and displays the result. Use only the Supabase anon key — never the service_role key. Do not add customer login. At the end, list files changed and how to test.
```

### 3. Review pass

Use `prompts/07_review_agent_prompt.md` to review the output.

### 4. Human checkpoint

Before accepting:

- Does the UI work on mobile?
- Does it use only the Supabase anon key?
- Did it avoid introducing customer login/registration?
- Did it store sensitive data casually?
- Did it imply official affiliation?
- Did it cross the third-party automation boundary?
- Are RLS policies respected?

## Suggested build order (Phase 1)

1. Supabase project setup (schema, RLS, RPC functions).
2. `supabaseClient.ts` with anon key only.
3. Customer landing page (static, independent-service notice).
4. Customer handover page (`/h/:code`, calls `get_handover_by_code` RPC).
5. Admin login page (Supabase Auth).
6. Admin order list (CRUD on `orders` table via Supabase client).
7. Admin new order form.
8. Admin mailbox import form (manual entry into `mailboxes` table).
9. Admin handover record creation (generate code, write instructions).
10. Status workflow (order status updates).
11. Audit log (operator actions).
12. GitHub Pages deployment setup.
13. Custom domain configuration.
14. UX polish and mobile testing.

## Future build order (Phase 3+)

1. FastAPI backend skeleton activation.
2. Module loader system.
3. mailcow API integration.
4. Roundcube theme/config.
5. Tencent Cloud deployment docs.
6. Real email test.
7. Launch hardening.

## Prompt chaining

Phase 1 prompts:

```text
01_frontend_design_agent.md
04_ops_admin_module_prompt.md
07_review_agent_prompt.md
```

Phase 3+ prompts (when FastAPI backend is introduced):

```text
00_master_app_skeleton_prompt.md
05_roundcube_theme_prompt.md
06_tencent_mailcow_deploy_prompt.md
```

## Definition of done for every slice

- Works locally (Vite dev server).
- Typed (TypeScript, no `any`).
- Mobile usable (390px viewport).
- No `service_role` key in frontend code.
- No customer login/registration added.
- No core architecture violation.
- RLS policies tested (customer sees only their handover record).
- README/docs updated if behavior changed.
