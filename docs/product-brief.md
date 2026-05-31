# Product Brief — D-Ticket Mail Portal

## Mission

Build a professional mobile-first portal and internal operations system for Deutschlandticket purchase-assistance workflows. The system gives each customer a dedicated mailbox account, makes TicketPlus+ login/OTP collection easier, and gives the operator a fast CRM-like workflow for creating mailboxes, tracking orders, and generating customer handover instructions.

## Customer-facing promise

- Dedicated mailbox account.
- Simple mobile login.
- Clear TicketPlus+ app login instructions.
- Clear month/10th-day rules.
- Clear independent-service disclaimer.

## Operator-facing promise

- Create a mailbox quickly.
- Generate strong passwords.
- Generate handover text.
- Track order state.
- Avoid repeated manual copywriting.
- Reduce each order to a repeatable 5–10 minute SOP.

## What the product is not

- Not an official ticket seller.
- Not an official TicketPlus+/DB/Deutschlandticket service.
- Not a tool for bypassing OTP, CAPTCHA, or platform rules.
- Not a third-party ticket purchase bot.

## MVP user flows

### Customer flow

1. Customer pays / confirms service terms.
2. Operator creates dedicated mailbox.
3. Operator buys ticket manually using customer's real name and birthdate.
4. Operator hands over mailbox login and TicketPlus+ login instructions.
5. Customer uses webmail to receive OTP and logs into TicketPlus+ app.
6. Customer views ticket in app/wallet.

### Operator flow

1. Open `ops.buffjo.top`.
2. Create new order.
3. Enter minimal customer/order data.
4. Generate mailbox and password.
5. Copy TicketPlus+ manual purchase checklist.
6. Mark payment/ticket/subscription/handover statuses.
7. Send customer handover message.

## Success metrics

- Customer can log in on mobile without asking support.
- Operator can create and hand over an order in 5–10 minutes.
- TicketPlus+ OTP arrives reliably to `@tickets.buffjo.top`.
- No confusion between this independent service and official ticket providers.
- No avoidable next-month billing disputes.
