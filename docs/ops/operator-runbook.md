# Operator Runbook

## Operator Access
1. Open `/#/admin/login`.
2. Enter the operator email and password.
3. If the account already exists, the portal signs in.
4. If the account does not exist, the portal creates a Supabase Auth operator account.
5. If email confirmation is enabled, confirm the email before returning to log in.

Customers do not create portal accounts. Customer delivery always uses a
handover-code URL.

## Pre-Order
1. Confirm customer request and scope.
2. Complete the customer consent checklist.
3. Review platform-specific account, payment, delivery, refund, transfer, and cancellation rules.
4. Set status to `paid` only after payment and consent are complete.

## Purchase
1. Register or use accounts only through human-approved manual steps.
2. Do not store credentials in this workspace.
3. Assign a controlled login email record for internal purchase. Default customer delivery mode is `wallet_only`.
4. Confirm budget before purchase.
5. Set status to `ticket_purchased` only after purchase is complete.

## Delivery
1. Generate the handover code after ticket purchase.
2. In `wallet_only` mode, give the customer Wallet add instructions or official Apple Wallet / Google Wallet links only.
3. Do not give TicketPlus+ login email, OTP, webmail URL, or mailbox password while an operator-owned payment method remains attached.
4. Use `managed_otp` only after payment-method and subscription risk is cleared and customer account access is explicitly approved.
5. Confirm whether payment method removal is required.
6. Confirm whether subscription cancellation is required.
7. Close only after delivery and cleanup checks are complete.

## Escalation
Set status to `exception` if:
- consent is incomplete,
- payment risk is unclear,
- platform rules are unclear,
- delivery fails,
- cancellation or refund deadlines are unclear,
- customer disputes the order.
