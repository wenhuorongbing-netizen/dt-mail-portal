# Cancellation Deadline Policy

## Purpose
Some platforms may create subscriptions, memberships, waitlist holds, payment authorizations, or cancellation windows. Do not assume rules are consistent.

## Manual Checks
For each order, check:
- cancellation deadline,
- refund deadline,
- transfer deadline,
- subscription or renewal deadline,
- account closure restrictions,
- payment method removal timing,
- whether customer account access must remain blocked because an operator-owned payment method is still attached.

## Status Use
- Use `subscription_cancelled_or_not_needed` only after the operator confirms no subscription exists or cancellation is complete.
- Use `exception` if cancellation, transfer, refund, subscription rules, or payment-method exposure are unclear.

## Reminder
This file is a policy skeleton, not legal advice and not a substitute for platform-specific review.
