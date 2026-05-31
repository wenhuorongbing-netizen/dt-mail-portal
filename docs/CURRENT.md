# Current Source of Truth

> **This file is the single source of truth for Phase 1 development.**  
> If any other doc contradicts this file, this file wins.

## Current phase

**Phase 1: GitHub Pages + Supabase.**

No FastAPI, no mailcow API, no automated TicketPlus+ registration/payment in Phase 1.

## Routes

Customer (HashRouter, no login required):

| Route | Page |
|-------|------|
| `/#/` | Landing page (Chinese-first) |
| `/#/h/:code` | Customer handover page |
| `/#/guide` | TicketPlus+ login guide |
| `/#/rules` | Rules & billing |

Admin (requires Supabase Auth):

| Route | Page |
|-------|------|
| `/#/admin/login` | Operator login |
| `/#/admin/orders` | Order management |
| `/#/admin/mailboxes` | Mailbox inventory |

Backward compatibility: `/#/handover/:code` redirects to `/#/h/:code`.

## Supabase

Frontend environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_WEBMAIL_URL` — webmail URL shown to customers (default: `https://webmail.buffjo.top`)

**Never use `service_role` key in the frontend.**

### Canonical RPC

```
get_handover_by_code(p_code text)
```

This is the only anonymous data access path. RLS ensures no other data is exposed.

### Handover behavior

The RPC returns:

- `mailbox_email` — full email for TicketPlus+ login
- `mailbox_password` — mailbox password (returned **intentionally**: customer needs it to log in to webmail and receive OTP)
- `mailbox_domain` — mailbox domain
- `instructions` — operator-written handover text
- `handover_status` — `pending` / `viewed` / `completed`
- Order status and ticket month

### Webmail URL

The webmail URL is configured via `VITE_WEBMAIL_URL` and defaults to `https://webmail.buffjo.top`.

**Do NOT derive webmail URL from mailbox domain.** The mailbox domain (`tickets.buffjo.top`) and the webmail host (`webmail.buffjo.top`) are different concepts.

## Status flow

```
requested → paid → mailbox_assigned → ticket_purchased → handover_created → delivered → closed
```

At any point: `exception` (can reset to `requested`).

## Customer UX language

Customer-facing pages are **Chinese-first**, with English secondary. Primary actions:

1. 打开邮箱收验证码 (Open webmail to get OTP)
2. 复制 TicketPlus+ 登录邮箱 (Copy TicketPlus+ login email)
3. 一键复制全部登录信息 (Copy all login info)

Stepper: 登录邮箱 → 收验证码 → 登录 TicketPlus+ → 查看车票

## TicketPlus+ known issues (must display to customers)

- Ticket activates around the 1st of the month at ~03:00.
- Must use the exact same email and login method as purchase.
- Each email/account supports only one active Deutschlandticket.
- Ticket is digital only (app or wallet), no PDF/print.

## No-go boundaries (Phase 1)

- No FastAPI backend
- No mailcow API integration
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
10. Real Supabase end-to-end test
11. GitHub Pages deployment test
