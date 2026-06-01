# Email Infrastructure Acceptance Checklist

Status: Future optional path. Not used in current GitHub Pages + Supabase deployment.

Use the current `docs/ops/wallet-only-delivery.md` unless the project explicitly
reopens self-hosted mail infrastructure or an exception `managed_otp` workflow.

Use this checklist before treating `@tickets.buffjo.top` as usable for orders.

## Server

- [ ] Server is a CVM/VPS with full virtualization, not OpenVZ or LXC.
- [ ] OS is Ubuntu 22.04 LTS or 24.04 LTS.
- [ ] RAM is at least 8 GiB for the first stable deployment.
- [ ] Disk is at least 80 GiB.
- [ ] Public IPv4 is dedicated and stable.
- [ ] TCP 25 unblock is approved or confirmed unnecessary by provider.
- [ ] PTR/rDNS can be set by provider.
- [ ] PTR/rDNS is set to `mail.buffjo.top`.
- [ ] Security group allows required inbound mailcow ports, at minimum 25, 80, and 443.
- [ ] SSH is restricted to operator IPs where practical.

## DNS

- [ ] `mail.buffjo.top` A record points to the server IPv4.
- [ ] `webmail.buffjo.top` A record points to the server IPv4.
- [ ] `tickets.buffjo.top` MX points to `mail.buffjo.top` with priority 10.
- [ ] SPF TXT exists for `tickets.buffjo.top`.
- [ ] DMARC TXT exists for `_dmarc.tickets.buffjo.top`.
- [ ] DKIM TXT from mailcow is published.
- [ ] `autoconfig.tickets.buffjo.top` points to `mail.buffjo.top`.
- [ ] `autodiscover.tickets.buffjo.top` points to `mail.buffjo.top`.
- [ ] MX Toolbox or equivalent reports no critical MX/DNS errors.
- [ ] mailcow DNS check is clean or every warning is documented.

## mailcow

- [ ] `https://mail.buffjo.top` opens mailcow admin.
- [ ] Default admin password is changed.
- [ ] Admin 2FA is enabled.
- [ ] Domain `tickets.buffjo.top` exists in mailcow.
- [ ] DKIM is generated for `tickets.buffjo.top`.
- [ ] Test mailboxes exist:
  - [ ] `test-you@tickets.buffjo.top`
  - [ ] `test-mom@tickets.buffjo.top`
  - [ ] `dt-test-001@tickets.buffjo.top`
- [ ] Test mailbox quota is small enough to limit misuse.
- [ ] No mailcow API key is stored in the repo.

## Roundcube

- [ ] `https://webmail.buffjo.top` opens Roundcube.
- [ ] Login with username prefix works, e.g. `test-you`.
- [ ] Full email login also works or fails with a clear message.
- [ ] Wrong-password message is understandable.
- [ ] Inbox is readable on desktop.
- [ ] Inbox is readable in WeChat browser.
- [ ] Inbox is readable on iPhone Safari.
- [ ] Inbox is readable on Android Chrome.
- [ ] OTP text can be copied without layout problems.
- [ ] Customers are not instructed to configure SMTP/IMAP clients.

## Receive Tests

- [ ] Gmail to `test-you@tickets.buffjo.top` arrives.
- [ ] Outlook to `test-you@tickets.buffjo.top` arrives.
- [ ] QQ or another China mailbox test arrives if available.
- [ ] Messages do not land in spam, or the customer guide explains where to look.
- [ ] Chinese subject/body renders correctly.
- [ ] Arrival time is acceptable for OTP use.
- [ ] Mail headers show SPF/DKIM/DMARC status where available.

## TicketPlus+ OTP

- [ ] TicketPlus+ accepts `dt-test-001@tickets.buffjo.top`.
- [ ] OTP email arrives.
- [ ] OTP email arrival time is recorded.
- [ ] Sender domain and subject are recorded.
- [ ] OTP does not land in spam, or the fallback instruction is written.
- [ ] Operator can find and copy the OTP from mobile Roundcube.
- [ ] Repeat with `dt-test-002@tickets.buffjo.top` before production use.

## Portal Integration

- [ ] GitHub repository variable `VITE_WEBMAIL_URL` is set to `https://webmail.buffjo.top`.
- [ ] Local `.env.local` has `VITE_WEBMAIL_URL=https://webmail.buffjo.top`.
- [ ] Customer handover page hides webmail/account fields in `wallet_only`.
- [ ] Supabase admin can store the operator-controlled mailbox email and optional password.
- [ ] Handover text does not include webmail URL unless an exception mode is approved.
- [ ] No `service_role` key appears in frontend env, repo files, or build output.

## Go / No-Go

Go only if all of these are true:

- DNS, PTR/rDNS, SPF, DKIM, and DMARC are configured.
- Roundcube prefix login works on mobile.
- Gmail and Outlook inbound tests pass.
- TicketPlus+ OTP arrives in at least two test mailboxes.
- No secrets or real customer data are committed.

If TicketPlus+ OTP does not arrive reliably, the email stack is not production-ready.
