# Data Model

`docs/CURRENT.md` and `docs/supabase/setup.md` are the current data-model sources.

Current mailbox records are operator-controlled login records, not customer
account handover assets. Default customer ticket delivery mode is `wallet_only`:
the customer receives Wallet delivery instructions, while TicketPlus+ login
email, OTP, webmail, mailbox password, subscription controls, and payment method
remain on the operator side.

`managed_otp`, `external_mailbox`, and `customer_mailbox` are exception modes.
Use them only after payment-method and subscription risk has been reviewed and
customer account access is explicitly approved.

Historical draft fields are kept under `docs/archive/`.
