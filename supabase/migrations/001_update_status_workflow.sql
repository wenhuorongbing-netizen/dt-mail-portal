-- ============================================================
-- Migration: Update order status workflow
-- ============================================================
-- Old: requested → customer_authorized → account_registered
--      → ticket_purchased → delivered_to_customer → closed
-- New: requested → paid → mailbox_assigned → ticket_purchased
--      → delivered → closed (or exception at any point)
-- ============================================================

-- Drop the old CHECK constraint
alter table public.orders drop constraint if exists orders_status_check;

-- Add the new CHECK constraint
alter table public.orders add constraint orders_status_check
  check (status in (
    'requested',
    'paid',
    'mailbox_assigned',
    'ticket_purchased',
    'delivered',
    'closed',
    'exception'
  ));

-- Update the default (already 'requested', no change needed)
