# Mobile and WeChat UX

## Principles

- Assume the customer is on a phone.
- Assume they may be inside WeChat browser.
- Use large buttons and short instructions.
- Avoid complex nested menus.
- Provide clear Wallet add buttons and copyable fallback links when available.
- Keep key information above the fold.

## Customer portal mobile home

Priority order:

1. Add to Apple Wallet / Google Wallet.
2. Pre-ride QR check.
3. Important rules.
4. Contact support.

## Handover message UX

Default wallet-only handover messages must separate:

```text
Ticket month: 2026-06
Wallet action: Add to Apple Wallet / Add to Google Wallet
Pre-ride check: Open the QR code before inspection
```

Do not show TicketPlus+ login email, OTP, mailbox username, mailbox password, or
webmail URL in default `wallet_only` mode.

## WeChat-specific checks

- No tiny text.
- No hover-only behavior.
- Links easy to tap.
- Copyable text not hidden in images.
- WeChat may not open Wallet links correctly; tell customers to open the link in Safari or Chrome if needed.
- Dark mode not required, but contrast must stay readable.
