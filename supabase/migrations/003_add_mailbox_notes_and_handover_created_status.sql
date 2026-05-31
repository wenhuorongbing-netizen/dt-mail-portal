-- ============================================================
-- Migration 003: Add mailbox notes column + handover_created status
-- ============================================================

-- 1. Add notes column to mailbox_accounts
ALTER TABLE public.mailbox_accounts
  ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.mailbox_accounts.notes IS 'Operator notes. Not visible to customers.';

-- 2. Add handover_created to order status CHECK constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'requested',
    'paid',
    'mailbox_assigned',
    'ticket_purchased',
    'handover_created',
    'delivered',
    'closed',
    'exception'
  ));
