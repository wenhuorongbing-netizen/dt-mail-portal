# Payment Risk Policy

## Core Rule
Do not store payment-sensitive information in this workspace.

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
- whether the platform creates a subscription or renewal obligation.

## Escalation
Use status `exception` if payment handling is unclear, if customer authorization is incomplete, or if platform rules conflict with this policy.
