# Prompt — Tencent Cloud + mailcow Deployment Plan

```text
Create a deployment checklist for D-Ticket Mail Portal on Tencent Cloud using buffjo.top.

Target domains:
- mail.buffjo.top
- webmail.buffjo.top
- portal.buffjo.top
- ops.buffjo.top
- tickets.buffjo.top as mailbox domain

Infrastructure:
- Tencent Cloud CVM, not lightweight server.
- Ubuntu 22.04 or 24.04.
- Docker and Docker Compose.
- mailcow-dockerized.
- Roundcube.
- FastAPI backend.
- Vite frontend build.

Include:
1. CVM size recommendation.
2. Security group ports.
3. TCP 25 unblocking note.
4. DNS records: A, MX, SPF, DKIM, DMARC, autoconfig, autodiscover.
5. PTR/rDNS requirement.
6. mailcow installation steps.
7. Roundcube setup with default username domain.
8. Nginx vhost snippets.
9. Backup strategy.
10. Go-live test checklist.

Do not claim official affiliation with ticket providers.
```
