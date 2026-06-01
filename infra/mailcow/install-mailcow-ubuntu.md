# Install mailcow on Ubuntu

Status: Future optional path. Not used in current GitHub Pages + Supabase deployment.

Current deployment uses GitHub Pages + Supabase with wallet-only customer
delivery. Do not follow this runbook unless the self-hosted email path is
explicitly reopened.

Target host:

- Hostname: `mail.buffjo.top`
- Mail domain: `tickets.buffjo.top`
- Optional exception-mode webmail: `webmail.buffjo.top`
- OS: Ubuntu 22.04 LTS or 24.04 LTS

This runbook prepares manual mailcow + Roundcube deployment. It does not create
mailcow API automation.

## Preflight

Confirm before install:

- Server uses KVM/full virtualization, not OpenVZ or LXC.
- RAM is at least 8 GiB for the first stable deployment.
- Disk is at least 80 GiB.
- Public IPv4 is stable.
- TCP 25 unblock is approved or requested.
- PTR/rDNS is set or can be set to `mail.buffjo.top`.
- DNS A records for `mail` and `webmail` point to the server.
- No existing service is using ports `25`, `80`, `110`, `143`, `443`, `465`, `587`, `993`, `995`, or `4190`.

Check ports:

```bash
ss -tlpn | grep -E -w '25|80|110|143|443|465|587|993|995|4190'
```

## Base Packages

```bash
sudo -i
apt update && apt upgrade -y
apt install -y ca-certificates curl git jq nano
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin
docker version
docker compose version
```

## Install mailcow

```bash
cd /opt
git clone https://github.com/mailcow/mailcow-dockerized
cd /opt/mailcow-dockerized
./generate_config.sh
```

When prompted:

```text
Hostname: mail.buffjo.top
Timezone: Europe/Berlin
```

Start mailcow:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

Open:

```text
https://mail.buffjo.top
```

Immediately:

1. Change the default admin password.
2. Enable admin 2FA.
3. Add domain `tickets.buffjo.top`.
4. Generate DKIM for `tickets.buffjo.top`.
5. Publish DKIM in DNS.
6. Run mailcow DNS checks.

## Add Roundcube

Copy the Roundcube service into the mailcow compose directory:

```bash
cd /opt/mailcow-dockerized
# Merge or copy the repository's infra/mailcow/roundcube-compose.override.yml
# into /opt/mailcow-dockerized/docker-compose.override.yml.
docker compose pull roundcube
docker compose up -d roundcube
docker compose ps roundcube
```

Key setting:

```yaml
ROUNDCUBEMAIL_USERNAME_DOMAIN: tickets.buffjo.top
```

This lets an operator or approved exception-mode customer enter only
`dt202606001` instead of the full email address.

## Add webmail Nginx Host

Use `infra/mailcow/nginx-webmail.buffjo.top.conf` as the starting template.

Typical target path:

```text
/opt/mailcow-dockerized/data/conf/nginx/webmail.buffjo.top.conf
```

Validate and restart nginx:

```bash
cd /opt/mailcow-dockerized
docker compose exec nginx-mailcow nginx -t
docker compose restart nginx-mailcow
```

Open:

```text
https://webmail.buffjo.top
```

## First Mailboxes

Create only test mailboxes first:

- `test-you@tickets.buffjo.top`
- `test-mom@tickets.buffjo.top`
- `dt-test-001@tickets.buffjo.top`

Follow `infra/mailcow/mailbox-creation-sop.md`.

## Validation Order

1. `https://mail.buffjo.top` opens.
2. `https://webmail.buffjo.top` opens.
3. Prefix login works in Roundcube.
4. Gmail inbound test arrives.
5. Outlook inbound test arrives.
6. Mobile webmail works.
7. TicketPlus+ OTP arrives.
8. Supabase wallet-only handover hides webmail/account fields.

References:

- mailcow prerequisites: https://docs.mailcow.email/getstarted/prerequisite-system/
- mailcow DNS setup: https://docs.mailcow.email/getstarted/prerequisite-dns/
- Roundcube Docker env vars: https://github.com/roundcube/roundcubemail-docker
