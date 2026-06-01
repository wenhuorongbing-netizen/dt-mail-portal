# Email Infrastructure Troubleshooting

Status: Future optional path. Not used in current GitHub Pages + Supabase deployment.

Current deployment does not run mailcow or Roundcube. Use this only if the
self-hosted email path is explicitly reopened.

This file is for the receive-focused `mail.buffjo.top` / `webmail.buffjo.top`
deployment. Keep credentials, API keys, and real customer data out of logs copied
into tickets or commits.

## Quick Commands

Run on the server:

```bash
cd /opt/mailcow-dockerized
docker compose ps
docker compose logs --tail=200 postfix-mailcow
docker compose logs --tail=200 dovecot-mailcow
docker compose logs --tail=200 nginx-mailcow
docker compose exec nginx-mailcow nginx -t
```

Run from any machine with DNS tools:

```bash
nslookup -type=mx tickets.buffjo.top
nslookup mail.buffjo.top
nslookup webmail.buffjo.top
nslookup -type=txt tickets.buffjo.top
nslookup -type=txt _dmarc.tickets.buffjo.top
```

## DNS or MX Does Not Resolve

Check:

- DNS record was added in the correct zone: `buffjo.top`.
- `tickets.buffjo.top` has an MX record to `mail.buffjo.top`.
- `mail.buffjo.top` has an A record to the server IPv4.
- DNS TTL has elapsed.
- There is no accidental MX on `portal.buffjo.top`.

Fix:

1. Correct records using `infra/mailcow/dns-records-buffjo-top.md`.
2. Wait for TTL.
3. Re-run mailcow DNS check and MX Toolbox.

## Port 25 Problems

Symptoms:

- External mail never reaches mailcow.
- SMTP checks time out.
- Tencent Cloud shows port 25 blocked.

Check:

- CVM is prepaid annual/monthly if Tencent Cloud is used.
- Port 25 unblock request is approved.
- Security group allows inbound TCP 25.
- Server firewall is not blocking Docker forwarding.
- No other service is already bound to port 25.

Commands:

```bash
ss -tlpn | grep -E -w '25|80|143|443|465|587|993|995|4190'
```

## PTR / rDNS Problems

Symptoms:

- Gmail or Outlook accepts mail slowly, rejects mail, or marks mail suspicious.
- DNS tests warn about reverse DNS.

Fix:

1. Set PTR/rDNS at the server provider, not in normal DNS records.
2. Target value must be `mail.buffjo.top`.
3. Confirm forward DNS also resolves `mail.buffjo.top` to the same IPv4.

## DKIM Missing or Wrong

Symptoms:

- mailcow DNS check says DKIM missing.
- Mail-tester reports DKIM failure.

Fix:

1. In mailcow, open domain `tickets.buffjo.top`.
2. Generate or view DKIM.
3. Copy the exact selector and TXT value to DNS.
4. Do not invent the DKIM value manually.
5. Wait for TTL and re-test.

## Roundcube Prefix Login Fails

Expected behavior for future exception mailbox modes:

- Operator or approved exception-mode customer enters `dt202606001`.
- Roundcube logs in as `dt202606001@tickets.buffjo.top`.

Check:

- `ROUNDCUBEMAIL_USERNAME_DOMAIN=tickets.buffjo.top` exists in the Roundcube service.
- Roundcube container was recreated after config change.
- Mailbox exists in mailcow.
- Password was copied exactly.
- Default IMAP host points at mailcow Dovecot.

Commands:

```bash
cd /opt/mailcow-dockerized
docker compose ps roundcube
docker compose logs --tail=100 roundcube
docker compose up -d roundcube
```

## webmail.buffjo.top Does Not Open

Check:

- `webmail.buffjo.top` A record points to server IPv4.
- Nginx config is present and valid.
- Roundcube container is running.
- `nginx-mailcow` can reach `roundcube` on the Docker network.
- Certificate includes `webmail.buffjo.top` or the proxy is using a valid certificate.

Commands:

```bash
cd /opt/mailcow-dockerized
docker compose exec nginx-mailcow nginx -t
docker compose logs --tail=100 nginx-mailcow
docker compose logs --tail=100 roundcube
```

## Gmail / Outlook Mail Does Not Arrive

Check:

- MX points to `mail.buffjo.top`.
- Inbound TCP 25 is reachable.
- Rspamd did not quarantine the message.
- Mailbox quota is not full.
- The sender did not bounce with a DNS or SMTP error.

Record every test:

- sender provider
- recipient mailbox
- send time
- arrival time
- inbox or spam
- sender domain
- subject

## TicketPlus+ OTP Does Not Arrive

Do not change application code first. Check the mail stack:

1. Confirm Gmail/Outlook inbound tests pass for the same mailbox.
2. Search Inbox and Spam in Roundcube.
3. Check postfix and rspamd logs around the request time.
4. Confirm TicketPlus+ accepted the exact email address.
5. Try a second test mailbox before concluding the domain is blocked.

If Gmail/Outlook pass but TicketPlus+ fails repeatedly, mark the email stack as
not ready for production orders and keep testing with only test accounts.

## Mobile Webmail Issues

Check:

- WeChat browser can open `https://webmail.buffjo.top` for approved exception modes.
- Login fields are not hidden by keyboard.
- OTP text can be selected and copied.
- Font size is readable.
- No desktop-only hover interaction blocks the workflow.

Frontend beautification can wait, but mobile OTP retrieval must be usable before
any exception customer-login mode is approved. Default `wallet_only` handovers
must not depend on customer webmail access.
