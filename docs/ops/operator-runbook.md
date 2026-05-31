# Operator Runbook

## Pre-Order
1. Confirm customer request and scope.
2. Complete the customer consent checklist.
3. Review platform-specific account, payment, delivery, refund, transfer, and cancellation rules.
4. Set status to `customer_authorized` only after consent is complete.

## Purchase
1. Register or use accounts only through human-approved manual steps.
2. Do not store credentials in this workspace.
3. Confirm budget before purchase.
4. Set status to `ticket_purchased` only after purchase is complete.

## Delivery
1. Deliver through the approved channel.
2. Confirm whether payment method removal is required.
3. Confirm whether subscription cancellation is required.
4. Close only after delivery and cleanup checks are complete.

## Escalation
Set status to `exception` if:
- consent is incomplete,
- payment risk is unclear,
- platform rules are unclear,
- delivery fails,
- cancellation or refund deadlines are unclear,
- customer disputes the order.
