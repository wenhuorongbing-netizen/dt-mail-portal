# Email Infrastructure Plan

Status: Future optional path. Not used in current GitHub Pages + Supabase deployment.

Current default customer delivery is `wallet_only`; email infrastructure remains
operator-controlled. Do not buy a CVM, install mailcow, or deploy Roundcube for
the current phase.

## Scope

Phase E builds the mailbox infrastructure needed by the existing portal:

- `mail.buffjo.top` for mailcow admin and the mail host.
- `webmail.buffjo.top` for optional future Roundcube webmail.
- `tickets.buffjo.top` for operator-controlled TicketPlus+ login addresses.
- `portal.buffjo.top` remains the GitHub Pages portal.

This phase is receive-focused. The first production question is whether
`@tickets.buffjo.top` can reliably receive TicketPlus+ OTP and ticket emails for
operator-controlled accounts. Passing this test does not mean customers should
receive account login access.

Existing scripts under `infra/scripts/` are not part of Phase E0. Do not run or
extend mailbox-creation automation until manual mailbox creation and OTP
delivery are proven stable.

## Non-goals

Do not implement these in Phase E0:

- mailcow API automation.
- Bulk mailbox generation.
- Customer self-registration.
- Customer password reset.
- TicketPlus+ account automation.
- Automated payment or provider account creation.
- Use of Supabase `service_role` keys in frontend or repository files.

## Architecture

```text
Tencent Cloud CVM / VPS
├─ mailcow
│  ├─ Postfix receives mail for tickets.buffjo.top
│  ├─ Dovecot provides IMAP to webmail
│  ├─ Rspamd filters spam
│  ├─ SOGo remains available as an admin/backup webmail
│  └─ mailcow UI manages domains, mailboxes, DKIM, and quotas
│
├─ Roundcube
│  └─ Optional exception-mode webmail at webmail.buffjo.top
│     Username input auto-appends tickets.buffjo.top
│
└─ Nginx / mailcow nginx
   ├─ mail.buffjo.top
   └─ webmail.buffjo.top
```

The existing React/Supabase portal stays unchanged. Operators manually create
mailboxes in mailcow, then manually enter mailbox credentials in the Supabase
admin panel.

## Phase E0: Repository Preparation

Goal: make deployment repeatable without touching a real server.

Required files:

- `docs/ops/email-infra-plan.md`
- `docs/ops/email-acceptance-checklist.md`
- `docs/ops/email-troubleshooting.md`
- `infra/mailcow/dns-records-buffjo-top.md`
- `infra/mailcow/install-mailcow-ubuntu.md`
- `infra/mailcow/roundcube-compose.override.yml`
- `infra/mailcow/nginx-webmail.buffjo.top.conf`
- `infra/mailcow/mailbox-creation-sop.md`

Acceptance:

- A server can be selected from the checklist.
- DNS records can be copied from the template.
- mailcow can be installed from the runbook.
- Roundcube can be wired to mailcow with username suffix login.
- Test mailboxes can be created manually.
- No secrets are committed.
- No application code is changed.

## Phase E1: Server Selection

Prefer a prepaid Tencent Cloud CVM or equivalent VPS:

- Full virtualization: KVM, ESX, Hyper-V, or equivalent.
- Not OpenVZ, LXC, container VPS, or lightweight app server.
- Ubuntu 22.04 LTS or 24.04 LTS.
- 2 vCPU minimum.
- 8 GiB RAM recommended for a stable small deployment.
- 80 GiB disk recommended.
- Dedicated public IPv4.
- Stable IP that can keep the same PTR/rDNS.
- Ability to request TCP 25 unblocking.

Before purchase, verify:

- Provider allows inbound SMTP on port 25.
- Provider allows outbound SMTP or has a documented unblock process.
- Provider can set PTR/rDNS to `mail.buffjo.top`.
- Security groups can expose 25, 80, and 443.

References:

- mailcow system requirements: https://docs.mailcow.email/getstarted/prerequisite-system/
- Tencent Cloud port 25: https://www.tencentcloud.com/document/product/213/34833

## Phase E2: mailcow Deployment

Use `infra/mailcow/install-mailcow-ubuntu.md`.

Minimum post-install tasks:

1. Change the default mailcow admin password.
2. Enable admin 2FA.
3. Add domain `tickets.buffjo.top`.
4. Generate DKIM in mailcow.
5. Publish the DKIM TXT record in DNS.
6. Verify MX, SPF, DKIM, DMARC, and PTR/rDNS.

## Phase E3: Roundcube Exception-Mode Webmail

Use `infra/mailcow/roundcube-compose.override.yml`.

Roundcube must support:

- `https://webmail.buffjo.top`.
- Username `dt202606001` logging in as `dt202606001@tickets.buffjo.top`.
- Mobile browser and WeChat browser use.
- Easy OTP copying.

The key setting is:

```yaml
ROUNDCUBEMAIL_USERNAME_DOMAIN: tickets.buffjo.top
```

Reference:

- Roundcube Docker configuration: https://github.com/roundcube/roundcubemail-docker

## Phase E4: Receive-First Testing

Test in this order:

1. DNS and PTR/rDNS.
2. mailcow admin login and DKIM generation.
3. Manual test mailbox creation.
4. Inbound mail from Gmail, Outlook, and QQ if available.
5. Roundcube prefix login on desktop and mobile.
6. TicketPlus+ OTP delivery to one or two test mailboxes.
7. Supabase handover link hides webmail/account fields in `wallet_only`.

Do not test bulk operations before the first two TicketPlus+ OTP tests pass.
