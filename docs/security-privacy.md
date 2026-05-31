# Security and Privacy Notes

## Key risks

- Customer personal data leakage.
- Mailbox password leakage.
- Unauthorized admin access.
- Customer misuse of mailbox to send spam.
- Third-party platform account confusion.
- Billing/renewal disputes.

## Minimum controls for MVP

- Private GitHub repository.
- No secrets in repo.
- Strong admin password.
- 2FA for GitHub and mailcow.
- HTTPS everywhere.
- Admin panel behind strong authentication.
- Mailbox quota limits.
- Receive-focused email system for customers.
- Audit logs for order state changes.
- Customer terms and privacy pages.

## Data minimization

Only collect what the workflow needs:

- customer contact handle
- passenger name
- passenger birthdate
- ticket month
- mailbox account
- order status

Delete or anonymize passenger details after handover when no longer needed.

## Independent-service notice

Always show:

> This service is an independent mailbox/account assistance service and is not affiliated with TicketPlus+, Deutsche Bahn, Deutschlandticket, BVG, or any transport company.

## Third-party platform boundary

Do not automate TicketPlus+ registration, payment, CAPTCHA, or OTP flows. Keep third-party interactions manual and documented.
