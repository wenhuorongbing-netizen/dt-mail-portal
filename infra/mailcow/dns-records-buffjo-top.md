# DNS Records for buffjo.top Email Infrastructure

Status: Future optional path. Not used in current GitHub Pages + Supabase deployment.

Do not buy a CVM or point current deployment DNS at a mail server unless the
self-hosted email path is explicitly reopened.

Replace `1.2.3.4` with the server public IPv4.

`portal.buffjo.top` is the GitHub Pages portal and is not part of this mail
server template. Configure it according to GitHub Pages separately.

## Required Records

| Type | Host | Value | Notes |
|------|------|-------|-------|
| A | `mail` | `1.2.3.4` | mailcow hostname |
| A | `webmail` | `1.2.3.4` | Optional exception-mode Roundcube webmail |
| MX | `tickets` | `mail.buffjo.top.` | priority `10` |
| TXT | `tickets` | `v=spf1 mx a:mail.buffjo.top ~all` | staging SPF |
| TXT | `_dmarc.tickets` | `v=DMARC1; p=none; rua=mailto:postmaster@tickets.buffjo.top` | start with monitoring |
| CNAME | `autoconfig.tickets` | `mail.buffjo.top.` | mail client autodiscovery |
| CNAME | `autodiscover.tickets` | `mail.buffjo.top.` | mail client autodiscovery |

## DKIM Placeholder

Do not create a fake DKIM value.

After mailcow is installed:

1. Add domain `tickets.buffjo.top` in mailcow.
2. Generate DKIM in the mailcow UI.
3. Copy the selector and TXT value exactly.

Typical shape:

```text
Type: TXT
Host: <selector>._domainkey.tickets
Value: v=DKIM1; k=rsa; t=s; s=email; p=<mailcow-generated-public-key>
```

## PTR / rDNS

PTR/rDNS is configured at the server provider, not in the normal DNS zone.

```text
1.2.3.4 -> mail.buffjo.top
```

The forward A record must also resolve:

```text
mail.buffjo.top -> 1.2.3.4
```

## Validation

Run these checks after DNS propagation:

```bash
nslookup mail.buffjo.top
nslookup webmail.buffjo.top
nslookup -type=mx tickets.buffjo.top
nslookup -type=txt tickets.buffjo.top
nslookup -type=txt _dmarc.tickets.buffjo.top
```

Then use:

- mailcow DNS check.
- MX Toolbox.
- Mail-tester after outbound mail is configured.

References:

- mailcow DNS setup: https://docs.mailcow.email/getstarted/prerequisite-dns/
- mailcow system and ports: https://docs.mailcow.email/getstarted/prerequisite-system/
