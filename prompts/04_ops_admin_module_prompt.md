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
- Generated mailbox local part preview.
- Generated handover text preview with copy buttons.
- Status timeline.
- Buttons: Mark paid, Create mailbox, Mark ticket issued, Mark subscription checked, Mark delivered.
- Mobile-friendly design.

Backend requirements:
- SQLAlchemy models: Order, MailboxRecord, AuditLog.
- Pydantic schemas.
- CRUD endpoints.
- Status transition endpoint.
- Handover text generation endpoint.
- Price calculation helper:
  if day <= 10 => 1 month; else => 2 months.
- No real mailcow API integration yet; use a mock mailbox creation endpoint.

Copy rules:
- Chinese customer-facing handover text.
- Independent-service notice.
- Clear distinction:
  webmail username prefix vs full TicketPlus+ email.

Do not automate TicketPlus+ registration or purchase.
```
