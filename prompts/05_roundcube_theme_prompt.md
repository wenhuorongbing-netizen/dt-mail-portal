# Prompt — Roundcube Exception-Mode Webmail Theme/Config

Use this only for future approved exception mailbox modes. The current default
customer delivery is wallet-only and must not require customer webmail access.

```text
You are configuring an exception-mode Roundcube webmail login for D-Ticket Mail Portal.

Goal:
Approved exception-mode users should log in to webmail using only the local part, e.g. `dt202606001`, and the system should automatically append `@tickets.buffjo.top`.

Requirements:
- Use Roundcube Docker config.
- Set default IMAP host to mailcow Dovecot.
- Set `ROUNDCUBEMAIL_USERNAME_DOMAIN=tickets.buffjo.top`.
- Create a branded login screen copy:
  Title: D-Ticket Mail Login
  Subtitle: 用于接收票务账号验证码
  Username hint: 只输入账号前缀，例如 dt202606001
  Notice: TicketPlus+ 登录时需要输入完整邮箱。
- Mobile-friendly.
- Do not use official TicketPlus+ or DB logos.
- Add independent-service notice.

Deliver:
- docker-compose override snippet.
- Roundcube config snippet.
- CSS/theme notes.
- Nginx reverse proxy snippet for webmail.buffjo.top.
```
