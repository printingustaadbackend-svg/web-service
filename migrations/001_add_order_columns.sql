-- Migration: Add order_number, razorpay_payment_id, refund_status, refund_id to orders table
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Add order_number column for human-readable serial (PU-00001)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

-- 2. Add razorpay_payment_id to enable auto-refunds on cancellation
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- 3. Add refund tracking columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS refund_id TEXT DEFAULT NULL;

-- Create index on order_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Verify columns were added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name IN ('order_number', 'razorpay_payment_id', 'refund_status', 'refund_id');
