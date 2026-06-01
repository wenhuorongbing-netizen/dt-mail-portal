# Payment Risk Policy

## Core Rule
Do not store payment-sensitive information in this workspace.

If an operator-owned payment method remains attached to a TicketPlus+ account,
the customer must not receive account login access. Default delivery is
`wallet_only`.

## Prohibited Data
- Card number
- CVV
- Bank account details
- Payment account password
- One-time payment verification codes
- Payment processor tokens or secrets

## Risk Checks
Before purchase, confirm:
- the authorized maximum spend,
- refund and cancellation terms,
- whether the payment method can be removed after purchase,
- whether the platform stores payment credentials,
- whether the platform creates a subscription or renewal obligation,
- whether customer account access would allow payment-method changes,
- whether Wallet-only delivery is sufficient for the customer.

## Escalation
Use status `exception` if payment handling is unclear, if customer authorization is incomplete, if customer account access would expose an operator-owned payment method, or if platform rules conflict with this policy.
