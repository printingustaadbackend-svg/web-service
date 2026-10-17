-- ─── Fix: Add 'awaiting_payment' to orders status check constraint ───
-- The existing constraint only allows: pending, processing, completed, cancelled
-- We need to add 'awaiting_payment' for QR payment orders.
-- Run this in your Supabase SQL editor.

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'awaiting_payment', 'processing', 'completed', 'cancelled'));
