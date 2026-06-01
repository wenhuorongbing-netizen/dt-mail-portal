# Mailcow And Roundcube Deployment Notes

Status: Future optional path. Not used in current GitHub Pages + Supabase deployment.

This is an old deployment note. The current Phase E email infrastructure package
is:

- `docs/ops/email-infra-plan.md`
- `docs/ops/email-acceptance-checklist.md`
- `docs/ops/email-troubleshooting.md`
- `infra/mailcow/dns-records-buffjo-top.md`
- `infra/mailcow/install-mailcow-ubuntu.md`
- `infra/mailcow/roundcube-compose.override.yml`
- `infra/mailcow/nginx-webmail.buffjo.top.conf`
- `infra/mailcow/mailbox-creation-sop.md`

Use those files as the active deployment source.

## Target Domains

- `mail.buffjo.top`: mail server and mailcow admin.
- `webmail.buffjo.top`: optional future Roundcube webmail for approved exception modes.
- `tickets.buffjo.top`: operator-controlled login email domain.
- `portal.buffjo.top`: GitHub Pages portal, configured separately.

## First Checks

1. Confirm server IP and hostname.
2. Configure MX, A/AAAA, SPF, DKIM, and DMARC records.
3. Verify TLS certificates.
4. Create a test mailbox manually before adding API automation.
5. Confirm Roundcube prefix login and password reset boundaries.
6. Confirm default `wallet_only` handovers still hide webmail and account-login fields.

## Future API Work

Mailcow API integration should start as an internal backend service in a later
phase. Do not expose mailbox creation to customers in Phase E0.
