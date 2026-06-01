# Security and Privacy Notes

## Key risks

- Customer personal data leakage.
- Mailbox password leakage.
- TicketPlus+ account access exposing an operator-owned payment method.
- Unauthorized admin access.
- Customer misuse of mailbox to send spam.
- Third-party platform account confusion.
- Billing/renewal disputes.

## Minimum controls for MVP

- Private GitHub repository.
- No secrets in repo.
- Strong admin password.
- 2FA for GitHub and any hosted/self-hosted mailbox admin account in use.
- HTTPS everywhere.
- Admin panel behind strong authentication.
- Mailbox quota limits.
- Operator-controlled receive-focused email system.
- Wallet-only customer delivery by default.
- Do not expose TicketPlus+ login email, OTP, webmail, or mailbox passwords while an operator-owned payment method remains attached.
- Audit logs for order state changes.
- Customer terms and privacy pages.

## Data minimization

Only collect what the workflow needs:

- customer contact handle
- passenger name
- passenger birthdate
- ticket month
- mailbox account
- Wallet delivery status
- order status

Delete or anonymize passenger details after handover when no longer needed.
Remove or expire Wallet add links after delivery unless an approved retention
policy requires keeping them.

## Independent-service notice

Always show:

> This service is an independent purchase-assistance and ticket handover service and is not affiliated with TicketPlus+, Deutsche Bahn, Deutschlandticket, BVG, or any transport company.

## Third-party platform boundary

Do not automate TicketPlus+ registration, payment, CAPTCHA, or OTP flows. Keep third-party interactions manual and documented.
Do not give customers TicketPlus+ account access while an operator-owned payment
method remains attached.
