> **Archived historical draft. Do not use as implementation source of truth.**  
> Current data model is in [`docs/supabase/setup.md`](../supabase/setup.md).

# Data Model Draft

## orders

```text
id
order_code
customer_note
customer_contact
passenger_name_encrypted
passenger_birthdate_encrypted
ticket_month
after_tenth_day
ticket_month_count
ticket_price_total
service_fee
total_amount
status
created_at
updated_at
delivered_at
```

## mailboxes

```text
id
order_id
local_part
domain
full_email
password_encrypted
quota_mb
created_at
handed_over_at
disabled_at
```

## ticket_tasks

```text
id
order_id
platform
purchase_status
payment_method_status
subscription_status
ticket_valid_from
ticket_valid_to
notes
created_at
updated_at
```

## audit_logs

```text
id
actor_id
action
entity_type
entity_id
metadata_json
ip_address
created_at
```

## Sensitive data policy

- Do not keep raw passenger name/birthdate longer than necessary.
- Encrypt sensitive fields before production.
- Store only hashes for admin passwords.
- Store mailbox passwords encrypted or support one-time reveal/reset.
- Add a data deletion workflow before real customers.
