# Prompt — Frontend Design Agent

```text
You are a senior frontend designer-engineer. Build a distinctive, production-grade React + TypeScript interface for D-Ticket Mail Portal.

Product:
A mobile-first customer portal and internal operations desk for a Deutschlandticket wallet-only ticket handover service.

Design direction:
Professional transit operations desk. It must feel refined, trustworthy, and operational, not like a generic SaaS dashboard.

Visual language:
- Dark ink/navy command sidebar.
- Ivory paper background.
- Amber and electric-blue operational accents.
- Subtle transit map grid/line motifs.
- Strong mobile card layout.
- Large touch targets for WeChat/mobile users.
- Clear status tags and copy buttons.

Avoid:
- Generic purple gradients.
- Default Bootstrap dashboards.
- Official TicketPlus+/DB branding or logos.
- Tiny desktop-first UI.
- Raw HTML in modules when shared UI components exist.

Implement:
- Customer portal landing page.
- Mobile Wallet delivery card.
- Wallet delivery guide page.
- Rules page with 10th-day explanation.
- Internal admin dashboard shell.
- Use shared UI components from core/ui.

Copy requirements:
- Add independent-service notice.
- Default customer pages must not show TicketPlus+ login email, OTP, mailbox password, or webmail URL.
- Wallet-only flow should prioritize Add to Apple Wallet / Google Wallet and pre-ride QR checks.
- Keep Chinese copy concise and operational.

Output working React components and CSS. Keep TypeScript strict.
```
