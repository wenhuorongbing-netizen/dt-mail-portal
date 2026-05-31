# Product Brief — D-Ticket Mail Portal

## Mission

Build a professional mobile-first portal and internal operations system for Deutschlandticket purchase-assistance workflows. The system gives each customer a dedicated mailbox account, makes TicketPlus+ login/OTP collection easier, and gives the operator a fast CRM-like workflow for creating orders, importing mailbox credentials, and generating customer handover instructions.

## MVP architecture

**Phase 1 uses GitHub Pages + Supabase.** No custom backend server in the MVP.

- **Frontend:** React + TypeScript + Vite, deployed as static files on GitHub Pages.
- **Backend:** Supabase provides Auth (operator login), Postgres (data), RLS (access control), and RPC (handover code lookup).
- **Customers** do not register or log in. They receive a handover code/link and can view exactly one mailbox handover record.
- **Operator** logs in via Supabase Auth. Imports or types mailbox credentials manually. Creates handover codes for customers.
- **FastAPI, mailcow API, and automated mailbox creation** are future phases, not part of the MVP.

## Customer-facing promise

- Dedicated mailbox account (credentials provided via handover).
- Simple mobile access — open a link, no login required.
- Clear TicketPlus+ app login instructions.
- Clear month/10th-day rules.
- Clear independent-service disclaimer.

## Operator-facing promise

- Create an order quickly.
- Import or type mailbox credentials (manual for now).
- Generate handover code and instructions.
- Track order state through status workflow.
- Avoid repeated manual copywriting.
- Reduce each order to a repeatable 5–10 minute SOP.

## What the product is not

- Not an official ticket seller.
- Not an official TicketPlus+/DB/Deutschlandticket service.
- Not a tool for bypassing OTP, CAPTCHA, or platform rules.
- Not a third-party ticket purchase bot.
- Not a customer self-registration system.

## MVP user flows

### Customer flow

1. Customer pays / confirms service terms (outside the system).
2. Operator creates order and imports/creates mailbox credentials.
3. Operator buys ticket manually using customer's real name and birthdate.
4. Operator creates handover record with instructions and a unique code.
5. Operator sends the handover link/code to the customer (e.g. via WeChat).
6. Customer opens the link on mobile — sees mailbox login and TicketPlus+ guide.
7. Customer uses webmail to receive OTP and logs into TicketPlus+ app.
8. Customer views ticket in app/wallet.

### Operator flow

1. Open admin panel (`portal.buffjo.top/admin` or `ops.buffjo.top`).
2. Log in via Supabase Auth.
3. Create new order (customer label, notes).
4. Import or type mailbox email and password.
5. Create handover record (generate code, write/paste instructions).
6. Mark payment/ticket/subscription/handover statuses.
7. Send handover link to customer.

## Key Supabase security rules

- `service_role` key must NEVER enter the frontend bundle.
- Frontend uses only the `anon` key.
- Customer handover lookup is via an RPC function with RLS enforcement.
- Operators authenticate via Supabase Auth; RLS restricts them to their own data.
- Sensitive fields (passwords, birthdates) are encrypted or minimized.

## Success metrics

- Customer can open handover link on mobile without asking support.
- Operator can create and hand over an order in 5–10 minutes.
- No confusion between this independent service and official ticket providers.
- No avoidable next-month billing disputes.
- Handover code provides access to exactly one record, nothing else.

## Future phases

- FastAPI backend for complex operations and module system.
- mailcow API integration for automated mailbox provisioning.
- Roundcube webmail theming.
- Real email domain deployment (`tickets.buffjo.top`).
