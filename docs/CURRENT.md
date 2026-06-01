# Current Source of Truth

> **This file is the single source of truth for Phase 1 development.**  
> If any other doc contradicts this file, this file wins.

## Current phase

**Phase 1: GitHub Pages + Supabase.**

No FastAPI, no mailcow API, no automated TicketPlus+ registration/payment in Phase 1.
No Tencent Cloud CVM, self-hosted mailcow, or self-hosted Roundcube in the current deployment.
Zero-cost deployment should use the default GitHub Pages `github.io` project URL
and the default Supabase `supabase.co` project URL. Custom domains are optional.

Operator accounts use Supabase Auth email/password. The admin login page may
attempt sign-in first and self-register an operator account when the account
does not exist. This applies only to internal operators. Customers never create
portal accounts and continue to access handovers by code only.

Admin login accepts a short operator name. If an operator enters `abc`, the
frontend sends `abc@operators.localhost` by default, or
`abc@<VITE_OPERATOR_AUTH_DOMAIN>` when configured, to Supabase Auth. If Supabase
email confirmations are enabled, the configured domain must receive email;
otherwise disable confirmations for the internal closed operator workflow.

## Routes

Customer (HashRouter, no login required):

| Route | Page |
|-------|------|
| `/#/` | Landing page (Chinese-first) |
| `/#/h/:code` | Customer handover page |
| `/#/guide` | Wallet delivery guide |
| `/#/rules` | Rules & billing |

Admin (requires Supabase Auth):

| Route | Page |
|-------|------|
| `/#/admin/login` | Operator login / self-registration |
| `/#/admin/orders` | Order management |
| `/#/admin/mailboxes` | Mailbox inventory |

Backward compatibility: `/#/handover/:code` redirects to `/#/h/:code`.

## Supabase

Frontend environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPERATOR_AUTH_DOMAIN` — optional suffix for operator short-login names
- `VITE_OPERATOR_MIN_PASSWORD_LENGTH` — optional client-side operator password length; keep aligned with Supabase Auth policy
- `VITE_BASE_PATH` — optional GitHub Pages base path override
- `VITE_WEBMAIL_URL` — optional fallback webmail URL for `external_mailbox` mode only

**Never use `service_role` key in the frontend.**

### Canonical RPC

```
get_handover_by_code(p_code text)
```

This is the only anonymous data access path. RLS ensures no other data is exposed.

### Handover behavior

The RPC returns:

- `mailbox_email` — operator-controlled TicketPlus+ login email; hide from customers when `delivery_mode = wallet_only`
- `mailbox_password` — returned only when `customer_can_login = true`; otherwise `null`
- `mailbox_domain` — mailbox domain
- `mailbox_provider` — mailbox source, e.g. `manual`, `cloudflare_routing`, `hosted_mailbox`
- `delivery_mode` — `wallet_only` / `managed_otp` / `external_mailbox` / `customer_mailbox`
- `mailbox_login_url` — optional hosted webmail URL for customer-login modes
- `mailbox_username` — optional customer-facing username
- `customer_can_login` — controls whether password may be shown
- `otp_managed_by_operator` — true when the operator receives and forwards OTP
- `instructions` — operator-written handover text
- `handover_status` — `pending` / `viewed` / `completed`
- Order status and ticket month

### Ticket delivery mode

Default mode is `wallet_only`:

- Operator controls the mailbox or routed inbox.
- Operator controls the TicketPlus+ account and any attached payment method.
- Customer receives only ticket access instructions, preferably official Apple Wallet / Google Wallet add links from TicketPlus+ email, app, or web account.
- Customer does **not** receive the TicketPlus+ login email by default.
- Customer does **not** receive mailbox password by default.
- Customer does **not** receive OTP by default.
- Handover page must not show "Open Webmail", mailbox password, TicketPlus+ login email, or OTP instructions in this mode.
- Operators must not create custom Apple Wallet `.pkpass` files or custom Google Wallet passes for TicketPlus+ tickets. Use only the official issuer add-to-wallet flow.
- Do not send only a QR screenshot as final delivery.

`managed_otp` is an exception mode, not the default. Use it only when the
operator has verified that no operator-owned payment method, subscription, or
renewal risk remains attached to the TicketPlus+ account, or when the payment
method belongs to the customer and customer account access is explicitly
approved.

`external_mailbox` is allowed only when using a third-party hosted mailbox and
`customer_can_login = true`; then the handover page may show login URL,
username, and password.

### Webmail URL

`VITE_WEBMAIL_URL` is optional and only used as a fallback for `external_mailbox`.
Do not show `webmail.buffjo.top` in current `wallet_only` handovers.

## Self-hosted email docs

The repository may include mailcow/Roundcube documentation and configuration
templates for:

- `mail.buffjo.top`
- `webmail.buffjo.top`
- `tickets.buffjo.top`

These are future optional references only. They are not part of the current
GitHub Pages + Supabase deployment. Do not instruct current operators to buy a
CVM, install mailcow, or deploy Roundcube.

## Status flow

```
requested → paid → mailbox_assigned → ticket_purchased → handover_created → delivered → closed
```

At any point: `exception` (can reset to `requested`).

## Customer UX language

Customer-facing pages are **Chinese-first**, with English secondary. Primary actions:

1. 添加到 Apple Wallet / Google Wallet (Add to Apple Wallet / Google Wallet)
2. 查看乘车前检查 (Pre-ride check)
3. 查看规则 / 联系客服 (Rules / Contact support)

Default stepper: 确认实名信息 → 添加 Wallet → 乘车前打开二维码 → 验票时出示证件

## TicketPlus+ known issues (display where relevant)

- Ticket activates around the 1st of the month at ~03:00.
- Exception account-login support must use the exact same email and login method as purchase.
- Each email/account supports only one active Deutschlandticket.
- Ticket is digital only (app or wallet), no PDF/print.
- If an operator-owned payment method remains attached to the account, do not give the customer account login access.

## No-go boundaries (Phase 1)

- No FastAPI backend
- No mailcow API integration
- No Tencent Cloud CVM / self-hosted mailcow / self-hosted Roundcube in current deployment
- No automated TicketPlus+ account registration
- No automated payment
- No CAPTCHA/OTP bypass
- No impersonation of official ticket providers

## Current priorities

1. ✅ Track Supabase SQL files in GitHub
2. ✅ Unify route: `/#/h/:code`
3. ✅ Unify RPC: `get_handover_by_code`
4. ✅ Fix webmail URL config
5. ✅ Fix password return docs
6. ✅ Customer handover page Chinese mobile UX
7. ✅ Admin responsive layout
8. ✅ Add `handover_created` status
9. ✅ Fix mailbox notes save
10. ✅ Email infrastructure docs/config package
11. ✅ Switch current email handling to operator-controlled mode
12. ✅ Switch default customer delivery to `wallet_only` (migration 005 + schema + RPC + frontend)
13. Apply migration 004 + 005 to real Supabase (manual: SQL Editor or `supabase db push`)
14. Verify RLS/RPC on real Supabase with anon key (manual)
15. GitHub Pages deployment test with real env vars (manual)
16. Create wallet_only test order and verify customer page (manual)
17. (Optional) Configure Cloudflare Email Routing for managed_otp exception mode
18. (Optional) Test TicketPlus+ OTP receipt for managed_otp

See `docs/goal.md` for the full acceptance plan and `docs/ops/acceptance-test-results.md` for results.
