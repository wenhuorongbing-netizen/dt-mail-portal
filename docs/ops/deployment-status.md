# Deployment Status

> Last updated: 2026-06-02

## GitHub

| Item | Value |
|------|-------|
| Repository | `wenhuorongbing-netizen/dt-mail-portal` |
| Branch | `main` |
| Latest commit | `4318c77` — docs: record Phase A acceptance results, update CURRENT.md |
| GitHub Pages URL | https://wenhuorongbing-netizen.github.io/dt-mail-portal/ |
| Custom domain | `buffjo.top` ✅ configured |
| Live site | https://buffjo.top |
| Pages source | GitHub Actions (`pages.yml`) |
| Workflow status | Active, deploys on push to `main` |

### GitHub Pages Custom Domain

CNAME file: `frontend/public/CNAME` → `buffjo.top`.

DNS records configured at Tencent Cloud DNSPod (free tier, max 2 A records per subdomain):

| Host | Type | Value |
|------|------|-------|
| `@` | A | `185.199.108.153` |
| `@` | A | `185.199.109.153` |

DNS check: in progress. HTTPS: pending DNS propagation.

---

## Supabase

| Item | Value |
|------|-------|
| Project name | SpirePlus |
| Project ID | `zmqjcwxrkvbtmtcfucwo` |
| Region | AWS eu-north-1 |
| Dashboard URL | https://supabase.com/dashboard/project/zmqjcwxrkvbtmtcfucwo |
| API URL | `https://zmqjcwxrkvbtmtcfucwo.supabase.co` |
| Anon key | Stored in `frontend/.env.local` (not committed) |

### Schema Status

| Table | Status |
|-------|--------|
| `mailbox_accounts` | Created with `delivery_mode`, `customer_can_login`, `otp_managed_by_operator` fields |
| `orders` | Created with full status workflow |
| `handover_codes` | Created with code index |
| `audit_events` | Created |

### Migrations Applied

| Migration | Description | Applied |
|-----------|-------------|---------|
| `001_update_status_workflow.sql` | Status workflow expansion | Yes (via SQL Editor) |
| `002_handover_rpc_include_password.sql` | RPC returns password | Yes |
| `003_add_mailbox_notes_and_handover_created_status.sql` | Notes + handover_created status | Yes |
| `004_managed_otp_delivery_mode.sql` | delivery_mode + customer_can_login fields | Yes |
| `005_wallet_only_default.sql` | wallet_only default + hardened RPC | Yes |

### RPC Functions

| Function | Access | Status |
|----------|--------|--------|
| `get_handover_by_code(text)` | `anon`, `authenticated` | Active — returns `null` for `mailbox_password` when `wallet_only` |

### RLS Policies

- `anon` can only call `get_handover_by_code` RPC (no direct table access)
- `authenticated` (operators) can CRUD their own orders via `operator_id`

---

## Frontend Environment Variables

| Variable | Value | Source |
|----------|-------|--------|
| `VITE_SUPABASE_URL` | `https://zmqjcwxrkvbtmtcfucwo.supabase.co` | `.env.local` / GitHub repo variables |
| `VITE_SUPABASE_ANON_KEY` | (see `.env.local`) | `.env.local` / GitHub repo variables |
| `VITE_OPERATOR_AUTH_DOMAIN` | `operators.localhost` | `.env.local` |
| `VITE_BASE_PATH` | `/` (default) | vite.config.ts |

---

## Current Deployment URLs

| Environment | URL |
|-------------|-----|
| GitHub Pages (current) | https://wenhuorongbing-netizen.github.io/dt-mail-portal/ |
| Custom domain (pending DNS) | https://buffjo.top |
| Local preview | http://localhost:4173 |

## Customer Routes

| Route | Page |
|-------|------|
| `/#/` | Landing page |
| `/#/h/:code` | Customer handover page |
| `/#/guide` | Wallet delivery guide |
| `/#/rules` | Rules & billing |

## Admin Routes

| Route | Page |
|-------|------|
| `/#/admin/login` | Operator login / self-registration |
| `/#/admin/orders` | Order management |
| `/#/admin/mailboxes` | Mailbox inventory |
