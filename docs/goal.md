# Current Documentation Goal

This file is a short working note. `docs/CURRENT.md` remains the source of
truth.

## Current Decision

Default customer delivery is `wallet_only`.

The operator keeps the TicketPlus+ account, login email, OTP receiving path,
subscription controls, and any operator-owned payment method under operational
control. The customer receives a handover-code page with Wallet delivery
instructions and support/rules information.

## Why

TicketPlus+ accounts may require a payment method to remain attached. If the
customer receives account login access while an operator-owned payment method is
attached, the customer may be able to affect payment settings, subscription
status, or renewal behavior. That risk is outside the default customer delivery
scope.

## Default Handover

- Show Apple Wallet / Google Wallet add instructions or official issuer links.
- Show ticket month, passenger-name reminder, and pre-ride QR check.
- Show independent-service notice.
- Hide TicketPlus+ login email, OTP, mailbox password, and webmail URL.
- Do not send only a QR screenshot as final delivery.

## Exception Modes

`managed_otp`, `external_mailbox`, and `customer_mailbox` are exception modes.
Use them only after payment-method and subscription risk is cleared and customer
account access is explicitly approved.

## Next Implementation Follow-Ups

- Update Supabase SQL/default enum to include `wallet_only`.
- Update frontend handover UI to hide account-login fields in `wallet_only`.
- Update admin order forms and generated copy to default to Wallet-only.
- Add end-to-end tests for a wallet-only handover record.
