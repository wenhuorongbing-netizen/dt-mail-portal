# Security And Compliance Notes

First version rules:

- Do not store customer passwords in plaintext.
- Keep mailbox credentials out of Git.
- Keep TicketPlus+ account access on the operator side while an operator-owned payment method remains attached.
- Use wallet-only customer delivery by default.
- Treat generated handover text as customer data.
- Keep retention and deletion policy visible in operator docs.
- Do not automate TicketPlus+ payment or registration until legal and operational boundaries are reviewed.

Open questions:

- Exact customer consent wording.
- Retention period for order records and mailbox handover logs.
- Whether operators need role-based access on day one.
- Backup and restore expectations for PostgreSQL and Mailcow.
