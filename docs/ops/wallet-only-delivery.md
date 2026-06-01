# Wallet-Only Delivery Workflow

This is the default customer delivery model for Phase 1.

## Why This Is Default

TicketPlus+ accounts may require a payment method to remain attached. Giving a
customer TicketPlus+ account access can expose payment settings, subscription
controls, and renewal risk. Therefore, the operator-controlled account stays on
the operations side by default.

## Customer Receives

- The handover-code page.
- Official Apple Wallet / Google Wallet add instructions or links from the
  TicketPlus+ ticket email, app, or web account.
- Ticket month and passenger-name reminder.
- Rules, billing, cancellation, and support instructions.
- Independent-service notice.

## Customer Does Not Receive

- TicketPlus+ login email.
- TicketPlus+ OTP.
- Mailbox password.
- Webmail URL.
- Operator payment method details.
- Account recovery details.

## Operator Flow

1. Confirm customer consent, passenger data, month, price, and service scope.
2. Create the order in the admin panel.
3. Assign an operator-controlled TicketPlus+ login email.
4. Purchase manually through TicketPlus+.
5. Confirm the ticket is issued and the passenger name is correct.
6. Add or prepare the ticket through the official Apple Wallet / Google Wallet
   flow provided by TicketPlus+.
7. Record subscription status, cancellation status, and payment-method risk.
8. Create a handover record with wallet-only customer instructions.
9. Send the handover link to the customer.
10. Close only after delivery and cleanup checks are complete.

## Handover Page Rules

For `wallet_only`:

- Show only Wallet add actions, ticket month, passenger-name reminder, and
  support/rules links.
- Hide TicketPlus+ login email even if the RPC returns it for legacy reasons.
- Hide mailbox password.
- Hide webmail links.
- Hide OTP instructions.
- Do not imply that the customer controls the TicketPlus+ account.

## Fallback Modes

`managed_otp` is an exception mode. Use it only when:

- the operator has verified that no operator-owned payment method remains
  attached, or
- the payment method belongs to the customer, and
- customer account access has been explicitly approved.

`external_mailbox` and `customer_mailbox` are also exception modes. They may show
mailbox login fields only when `customer_can_login = true` and payment-account
risk has been reviewed.

## Do Not

- Do not create custom `.pkpass` files for Apple Wallet.
- Do not create custom Google Wallet passes.
- Do not send only a QR screenshot as final delivery.
- Do not give customers account login access while an operator-owned payment
  method remains attached.
- Do not promise payment method deletion unless it has been verified and logged.
