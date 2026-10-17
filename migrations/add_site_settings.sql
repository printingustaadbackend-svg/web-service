-- ─── Site Settings Table ────────────────────────────────────────────
-- Stores key-value configuration like active payment method.
-- Run this in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the default payment method (razorpay)
INSERT INTO site_settings (key, value)
VALUES ('payment_method', 'razorpay')
ON CONFLICT (key) DO NOTHING;

-- Allow service role full access (admin only via server)
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on site_settings"
    ON site_settings
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
