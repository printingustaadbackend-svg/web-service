-- ============================================================================
-- Insert a test Ring product to verify ring customization
-- Run this in your Supabase SQL Editor AFTER you have a 'rings' category
-- ============================================================================

-- Step 1: Create the 'rings' category if it doesn't exist
INSERT INTO categories (name, slug)
VALUES ('Rings', 'rings')
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Insert a sample ring product
INSERT INTO products (
    name,
    description,
    base_price,
    min_order_quantity,
    is_active,
    category_id,
    base_image_url
)
SELECT
    'Custom Engraved Ring',
    '<p>Premium stainless steel ring with custom engraving. Perfect for personalized gifts, couple rings, or corporate accessories.</p><ul><li>Material: 316L Stainless Steel</li><li>Finish: Polished / Matte</li><li>Custom text or design engraving</li><li>Sizes: 5 to 13</li></ul>',
    499,
    1,
    true,
    c.id,
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop'
FROM categories c
WHERE c.slug = 'rings'
LIMIT 1;
