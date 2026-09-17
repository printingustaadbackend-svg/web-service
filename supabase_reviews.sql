-- ============================================================================
-- Product Reviews Table
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name   TEXT NOT NULL DEFAULT 'Anonymous',
    rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One review per user per product
ALTER TABLE product_reviews
    ADD CONSTRAINT unique_user_product_review UNIQUE (product_id, user_id);

-- Fast lookups by product
CREATE INDEX IF NOT EXISTS idx_reviews_product_id
    ON product_reviews(product_id);

-- Newest-first ordering
CREATE INDEX IF NOT EXISTS idx_reviews_created_at
    ON product_reviews(created_at DESC);

-- ─── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Backend (service_role) can do everything
CREATE POLICY "Service role full access"
    ON product_reviews
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Any authenticated user can read all reviews
CREATE POLICY "Authenticated users can read reviews"
    ON product_reviews
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Anon users can also read reviews (public product pages)
CREATE POLICY "Anon users can read reviews"
    ON product_reviews
    FOR SELECT
    USING (auth.role() = 'anon');
