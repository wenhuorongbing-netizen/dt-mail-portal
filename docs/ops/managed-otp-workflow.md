# Managed OTP Workflow

This is now an exception workflow. The default customer delivery workflow is
[`wallet-only-delivery.md`](wallet-only-delivery.md).

## Current Architecture

Current deployment is:

- GitHub Pages for the React portal and admin panel.
- Supabase Auth, Postgres, RLS, and RPC.
- Cloudflare Email Routing, a manual inbox, or another operator-controlled inbox for OTP.

Current deployment is **not**:

- Tencent Cloud CVM.
- Self-hosted mailcow.
- Self-hosted Roundcube.
- Customer self-service mailbox hosting.

## When This Mode Is Allowed

`managed_otp` may be used only when:

- the operator has verified that no operator-owned payment method remains attached to the TicketPlus+ account, or
- the payment method belongs to the customer, and
- subscription or renewal risk has been checked, and
- customer account access is explicitly approved.

In this mode:

- Operator controls the mailbox or routed address.
- Customer receives the TicketPlus+ login email address.
- Customer does not receive mailbox password.
- Customer does not open webmail.
- Operator receives OTP and forwards it through the approved support channel.
- Supabase records the order, handover code, delivery mode, payment cleanup status, and status.

## Operator Flow

1. Customer pays and provides the required passenger information.
2. Operator creates an order in Supabase admin.
3. Operator assigns or records a controlled email address, for example:
   `dt202606001@tickets.buffjo.top`.
4. Email source can be:
   - Cloudflare Email Routing to the operator inbox.
   - Manually controlled Gmail/Outlook/hosted inbox.
   - Future hosted mailbox provider.
5. Operator uses the email address for the manual TicketPlus+ workflow.
6. TicketPlus+ sends OTP to the controlled address.
7. Operator forwards the OTP through WeChat/chat/support channel.
8. Customer logs into TicketPlus+ using the email and OTP only after payment risk is cleared.
9. Handover page shows the login email and managed OTP instructions only for this approved exception mode.

## Handover Page Rules

For `managed_otp`:

- Show TicketPlus+ login email.
- Show "请联系代办方获取验证码".
- Show guide and rules links.
- Do not show mailbox password.
- Do not show "Open Webmail".
- Do not imply the customer controls the mailbox.

For `external_mailbox`:

- Show login URL, username, and password only when `customer_can_login = true`.
- Use this only for third-party hosted mailbox providers or other approved inboxes.

## Database Fields

`mailbox_accounts` tracks:

- `email_address`
- `provider`
- `delivery_mode`
- `login_url`
- `username`
- `password_enc`
- `customer_can_login`
- `otp_managed_by_operator`
- `notes`
- `status`

The handover RPC returns `mailbox_password` only when `customer_can_login = true`.
In `managed_otp` mode, password is returned as `null`.

## Boundaries

Do not automate:

- TicketPlus+ registration.
- TicketPlus+ login.
- CAPTCHA.
- OTP interception.
- Payment.
- Cloudflare Worker parsing into Supabase in the current slice.
- Customer account access while an operator-owned payment method remains attached.

Cloudflare Email Routing or manual inbox handling is only an operator-controlled
receiving path. Any future automated OTP parsing must be separately reviewed for
security, consent, and platform rules.
