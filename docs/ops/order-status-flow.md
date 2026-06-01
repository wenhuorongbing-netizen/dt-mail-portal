# Order Status Flow

## Statuses
1. requested
2. paid
3. mailbox_assigned
4. ticket_purchased
5. handover_created
6. delivered
7. closed
8. exception

## Status Meanings
- requested: Customer has asked for assistance, but authorization and scope are not complete.
- paid: Customer payment, consent, and scope have been confirmed.
- mailbox_assigned: Operator has assigned a controlled TicketPlus+ login email record for internal purchase. Default customer delivery mode is `wallet_only`.
- ticket_purchased: Ticket purchase is complete.
- handover_created: Handover code and customer instructions have been generated.
- delivered: Wallet-only ticket access instructions, or an approved exception workflow, has been delivered through an approved channel.
- closed: Order is complete and no further action is expected.
- exception: Order is blocked, disputed, risky, cancelled, or requires human escalation.

## Transition Rules
- Do not move from requested to paid without explicit customer consent and payment confirmation.
- Do not move to mailbox_assigned without a controlled email/OTP record.
- Do not move to ticket_purchased unless platform-specific purchase rules are understood.
- Do not move to delivered until the handover code exists and the customer has Wallet access instructions. Do not give TicketPlus+ account access unless the order is explicitly approved for an exception mode.
- Do not move to closed until delivery, payment cleanup, and subscription checks are complete or explicitly not applicable.
- Use exception whenever consent, payment, platform rules, delivery, or cancellation status is unclear.
