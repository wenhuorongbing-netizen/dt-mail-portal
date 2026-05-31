# Order Status Flow

## Statuses
1. requested
2. customer_authorized
3. account_registered
4. ticket_purchased
5. delivered_to_customer
6. payment_method_removed
7. subscription_cancelled_or_not_needed
8. closed
9. exception

## Status Meanings
- requested: Customer has asked for assistance, but authorization and scope are not complete.
- customer_authorized: Customer consent and scope have been confirmed.
- account_registered: A human operator has completed any required account setup under approved rules.
- ticket_purchased: Ticket purchase is complete.
- delivered_to_customer: Ticket or access instructions have been delivered through an approved channel.
- payment_method_removed: Any temporary payment method has been removed where applicable.
- subscription_cancelled_or_not_needed: Any recurring subscription obligation is cancelled or confirmed not applicable.
- closed: Order is complete and no further action is expected.
- exception: Order is blocked, disputed, risky, cancelled, or requires human escalation.

## Transition Rules
- Do not move from requested to customer_authorized without explicit customer consent.
- Do not move to account_registered if automated registration would be required.
- Do not move to ticket_purchased unless platform-specific purchase rules are understood.
- Do not move to closed until delivery, payment cleanup, and subscription checks are complete or explicitly not applicable.
- Use exception whenever consent, payment, platform rules, delivery, or cancellation status is unclear.
