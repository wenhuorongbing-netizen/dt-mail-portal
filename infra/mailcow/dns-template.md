# DNS Template for buffjo.top — Scheme A

Replace `1.2.3.4` with your Tencent Cloud CVM public IPv4.

```text
Type    Host                    Value
A       mail                    1.2.3.4
A       webmail                 1.2.3.4
A       portal                  1.2.3.4
A       ops                     1.2.3.4
MX      tickets                 mail.buffjo.top priority 10
TXT     tickets                 v=spf1 mx a:mail.buffjo.top ~all
TXT     _dmarc.tickets          v=DMARC1; p=quarantine; rua=mailto:postmaster@tickets.buffjo.top
CNAME   autoconfig.tickets      mail.buffjo.top
CNAME   autodiscover.tickets    mail.buffjo.top
```

DKIM is generated after adding `tickets.buffjo.top` in mailcow.

PTR/rDNS:

```text
1.2.3.4 -> mail.buffjo.top
```
