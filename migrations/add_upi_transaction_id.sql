-- ─── Add UPI Transaction ID column to orders table ───────────────────
-- Run this in your Supabase SQL editor.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS upi_transaction_id TEXT DEFAULT NULL;
