-- 006: Add apple_wallet_link and google_wallet_link to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS apple_wallet_link text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS google_wallet_link text;

COMMENT ON COLUMN public.orders.apple_wallet_link IS 'Official Apple Wallet add link from TicketPlus+ email/app/web. Operator-managed.';
COMMENT ON COLUMN public.orders.google_wallet_link IS 'Official Google Wallet add link from TicketPlus+ email/app/web. Operator-managed.';
