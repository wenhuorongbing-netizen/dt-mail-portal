# Manual Mailbox Creation SOP

Status: Future optional path. Not used in current GitHub Pages + Supabase deployment.

This SOP is manual by design. Do not use mailcow API automation in Phase E0.
Do not run or extend `infra/scripts/create-mailbox.py` for this phase.

## Purpose

Create receive-focused operator-controlled mailboxes under `tickets.buffjo.top`
for TicketPlus+ OTP and ticket emails, then manually record the credentials in
Supabase admin.

## Naming

Test accounts:

- `test-you@tickets.buffjo.top`
- `test-mom@tickets.buffjo.top`
- `dt-test-001@tickets.buffjo.top`
- `dt-test-002@tickets.buffjo.top`

Production pattern:

```text
dtYYYYMMNNN@tickets.buffjo.top
```

Example:

```text
dt202606001@tickets.buffjo.top
```

Exception-mode Roundcube username is only the local part:

```text
dt202606001
```

## Create Mailbox in mailcow

1. Open `https://mail.buffjo.top`.
2. Log in as admin.
3. Confirm admin 2FA is active.
4. Go to Mailboxes.
5. Add mailbox under domain `tickets.buffjo.top`.
6. Set local part, for example `dt202606001`.
7. Generate a strong password.
8. Set a small quota, for example `250 MB`.
9. Keep mailbox active.
10. Save.

Do not store the password in repo files, issue comments, screenshots, or chat
logs. Enter it only into the operational system that needs it. Do not expose it
in default wallet-only customer handovers.

## Smoke Test Mailbox

Before using the mailbox for an order:

1. Log in at `https://webmail.buffjo.top`.
2. Use username local part only, e.g. `dt202606001`.
3. Use the generated mailbox password.
4. Send a test message from Gmail or Outlook.
5. Confirm the message reaches Inbox or Spam.
6. Confirm mobile browser login works.

## Record in Supabase Admin

In the admin mailbox inventory, manually enter:

```text
local_part: dt202606001
domain: tickets.buffjo.top
full email: dt202606001@tickets.buffjo.top
password: <generated password>
notes: created manually in mailcow; receive test passed
```

Use the existing Supabase frontend workflow. Do not add a backend service or API
script for this phase.

## TicketPlus+ OTP Test

For the first two test mailboxes:

1. Request TicketPlus+ email login OTP.
2. Record request time.
3. Check Roundcube Inbox and Spam.
4. Record arrival time.
5. Record sender domain and subject.
6. Confirm OTP is easy to copy on mobile.

If OTP does not arrive reliably, do not use the mailbox domain for production
orders.

## Decommission

When a mailbox is no longer needed:

1. Confirm no active order depends on it.
2. Export or delete data according to the retention policy.
3. Disable the mailbox in mailcow.
4. Update the Supabase mailbox status.
5. Remove credentials from operational notes where possible.
