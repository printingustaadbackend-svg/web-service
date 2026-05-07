-- Run this in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/vfvyfyabvzpzvqwwwaxv/sql/new

CREATE TABLE IF NOT EXISTS bulk_order_enquiries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    company     TEXT,
    email       TEXT NOT NULL,
    phone       TEXT NOT NULL,
    quantity    INTEGER NOT NULL,
    deadline    DATE,
    notes       TEXT,
    categories  TEXT[] DEFAULT '{}',
    status      TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','contacted','quoted','closed')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast status filtering in admin dashboard
CREATE INDEX IF NOT EXISTS idx_bulk_enquiries_status     ON bulk_order_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_bulk_enquiries_created_at ON bulk_order_enquiries(created_at DESC);

-- Allow the service role (backend) full access; no public access via anon key
ALTER TABLE bulk_order_enquiries ENABLE ROW LEVEL SECURITY;

-- Only allow the backend (service_role) to insert / read / update
-- Anon / authenticated users cannot read other people's enquiries
CREATE POLICY "Backend full access"
    ON bulk_order_enquiries
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Optional: let the submitter see their own row (by email match after auth)
-- Uncomment if you add auth to the bulk order form later:
-- CREATE POLICY "Users see own enquiries"
--     ON bulk_order_enquiries FOR SELECT
--     USING (email = auth.jwt() ->> 'email');
