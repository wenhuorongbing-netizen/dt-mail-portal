# Prompt — Generate Orders/Admin MVP Module

```text
Build the first real business module for D-Ticket Mail Portal: Orders.

Purpose:
Help the operator process one customer order quickly and professionally.

Frontend requirements:
- Add module `orders` with layout `list`.
- Order list table.
- New order form.
- 10th-day price calculator.
- Controlled login email preview for internal purchase.
- Wallet-only handover text preview with copy buttons.
- Status timeline.
- Buttons: Mark paid, Assign controlled email, Mark ticket issued, Mark wallet prepared, Mark subscription checked, Mark delivered.
- Mobile-friendly design.

Backend requirements:
- SQLAlchemy models: Order, MailboxRecord, AuditLog.
- Pydantic schemas.
- CRUD endpoints.
- Status transition endpoint.
- Wallet-only handover text generation endpoint.
- Price calculation helper:
  if day <= 10 => 1 month; else => 2 months.
- No real mailcow API integration yet; use a mock mailbox creation endpoint.

Copy rules:
- Chinese customer-facing handover text.
- Independent-service notice.
- Default customer copy must not include TicketPlus+ login email, OTP, webmail URL, or mailbox password.
- Account/OTP handover copy is exception-only after payment-method risk is cleared.

Do not automate TicketPlus+ registration or purchase.
```
