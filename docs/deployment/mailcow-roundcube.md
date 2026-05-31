# Mailcow And Roundcube Deployment Notes

## Target Domains

- `mail.buffjo.top`: mail server.
- `webmail.buffjo.top`: Roundcube.
- `tickets.buffjo.top`: customer portal.
- `ops.buffjo.top`: internal admin.

## First Checks

1. Confirm server IP and hostname.
2. Configure MX, A/AAAA, SPF, DKIM, and DMARC records.
3. Verify TLS certificates.
4. Create a test mailbox manually before adding API automation.
5. Confirm Roundcube login and password reset boundaries.

## Future API Work

Mailcow API integration should start as an internal backend service. Do not expose mailbox creation to customers in MVP-1.
