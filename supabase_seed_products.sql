-- ============================================================================
-- PRINTING USTAAD — Full Product Catalog Seed
-- Run this in your Supabase SQL Editor
-- This creates all categories, products, and variants
-- ============================================================================
-- NOTE: This script uses ON CONFLICT to be idempotent (safe to re-run).
-- It will NOT duplicate data if you run it multiple times.
-- ============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 1: CATEGORIES                                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

INSERT INTO categories (name, slug) VALUES
  ('T-Shirts',              't-shirts'),
  ('Hoodies & Sweatshirts', 'hoodies'),
  ('Polo Shirts',           'polo-shirts'),
  ('Caps & Headwear',       'caps'),
  ('Mugs',                  'mugs'),
  ('Drinkware',             'drinkware'),
  ('Phone Cases',           'phone-cases'),
  ('Tote Bags',             'tote-bags'),
  ('Keychains',             'keychains'),
  ('Rings & Jewelry',       'rings'),
  ('Notebooks & Diaries',   'diaries'),
  ('Pens',                  'pens'),
  ('Mousepads',             'mousepads'),
  ('Cushions & Pillows',    'cushions'),
  ('Wall Clocks',           'wall-clocks'),
  ('Photo Frames',          'photo-frames'),
  ('Awards & Trophies',     'awards'),
  ('Visiting Cards',        'visiting-cards'),
  ('Corporate Gifts',       'corporate-gifts'),
  ('Calendars',             'calendars'),
  ('Laptop Sleeves',        'laptop-sleeves'),
  ('Coasters',              'coasters'),
  ('Aprons',                'aprons'),
  ('Badges & Lanyards',     'badges')
ON CONFLICT (slug) DO NOTHING;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 2: PRODUCTS                                                          ║
-- ║  Using inline subqueries to reference category slugs → IDs                 ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝


-- ─── T-SHIRTS ────────────────────────────────────────────────────────────────

INSERT INTO products (name, description, base_price, min_order_quantity, is_active, category_id, base_image_url) VALUES
(
  'Round Neck Cotton T-Shirt',
  '<p>Premium 100% combed cotton round neck t-shirt. Perfect for custom printing with vibrant DTG prints.</p><ul><li>180 GSM bio-washed cotton</li><li>Pre-shrunk fabric</li><li>Double-stitched hem</li><li>Available in 15+ colors</li></ul>',
  349, 1, true, (SELECT id FROM categories WHERE slug = 't-shirts'),
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop'
),
(
  'V-Neck Premium T-Shirt',
  '<p>Stylish V-neck t-shirt made from ring-spun cotton. Ideal for fashion-forward custom prints.</p><ul><li>200 GSM premium cotton</li><li>Tapered V-neck collar</li><li>Side-seamed construction</li><li>Soft hand feel</li></ul>',
  399, 1, true, (SELECT id FROM categories WHERE slug = 't-shirts'),
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=600&fit=crop'
),
(
  'Oversized Streetwear T-Shirt',
  '<p>Trendy oversized fit t-shirt with dropped shoulders. Heavy 240GSM cotton for a premium boxy silhouette.</p><ul><li>240 GSM heavyweight cotton</li><li>Dropped shoulder design</li><li>Relaxed oversized fit</li><li>Ribbed crewneck</li></ul>',
  549, 1, true, (SELECT id FROM categories WHERE slug = 't-shirts'),
  'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=600&fit=crop'
),
(
  'Full Sleeve T-Shirt',
  '<p>Classic full-sleeve t-shirt for all seasons. Great for layering and custom designs.</p><ul><li>190 GSM cotton</li><li>Ribbed cuffs</li><li>Regular fit</li></ul>',
  449, 1, true, (SELECT id FROM categories WHERE slug = 't-shirts'),
  'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=600&fit=crop'
),
(
  'Raglan Baseball T-Shirt',
  '<p>Two-tone raglan sleeve baseball t-shirt. Sporty look with contrast sleeves.</p><ul><li>180 GSM cotton-poly blend</li><li>Contrast raglan sleeves</li><li>Athletic fit</li></ul>',
  399, 1, true, (SELECT id FROM categories WHERE slug = 't-shirts'),
  'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=600&h=600&fit=crop'
),

-- ─── HOODIES & SWEATSHIRTS ──────────────────────────────────────────────────

(
  'Pullover Hoodie',
  '<p>Cozy pullover hoodie with kangaroo pocket. Fleece-lined for warmth with custom print area on front and back.</p><ul><li>320 GSM fleece</li><li>Drawstring hood</li><li>Kangaroo pocket</li><li>Ribbed cuffs & hem</li></ul>',
  899, 1, true, (SELECT id FROM categories WHERE slug = 'hoodies'),
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=600&fit=crop'
),
(
  'Zip-Up Hoodie',
  '<p>Full-zip hoodie with split kangaroo pockets. Custom print on back, embroidery on chest.</p><ul><li>300 GSM French terry</li><li>YKK zipper</li><li>Two side pockets</li></ul>',
  999, 1, true, (SELECT id FROM categories WHERE slug = 'hoodies'),
  'https://images.unsplash.com/photo-1578768079470-c89b83e73ac6?w=600&h=600&fit=crop'
),
(
  'Crewneck Sweatshirt',
  '<p>Classic crewneck sweatshirt. Clean canvas for bold custom prints.</p><ul><li>280 GSM terry cotton</li><li>Ribbed collar, cuffs & hem</li><li>Relaxed fit</li></ul>',
  749, 1, true, (SELECT id FROM categories WHERE slug = 'hoodies'),
  'https://images.unsplash.com/photo-1572495532056-8583af1cbae0?w=600&h=600&fit=crop'
),

-- ─── POLO SHIRTS ─────────────────────────────────────────────────────────────

(
  'Classic Polo T-Shirt',
  '<p>Professional polo t-shirt with custom embroidery or print. Perfect for corporate uniforms and events.</p><ul><li>220 GSM pique cotton</li><li>Ribbed collar & cuffs</li><li>3-button placket</li><li>Side vents</li></ul>',
  499, 1, true, (SELECT id FROM categories WHERE slug = 'polo-shirts'),
  'https://images.unsplash.com/photo-1625910513413-5fc47e4d82a6?w=600&h=600&fit=crop'
),
(
  'Dry-Fit Polo T-Shirt',
  '<p>Moisture-wicking performance polo for sports teams and outdoor events.</p><ul><li>Polyester micro-mesh</li><li>UV protection</li><li>Quick dry technology</li></ul>',
  549, 1, true, (SELECT id FROM categories WHERE slug = 'polo-shirts'),
  'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&h=600&fit=crop'
),

-- ─── CAPS & HEADWEAR ─────────────────────────────────────────────────────────

(
  'Baseball Cap',
  '<p>Classic 6-panel baseball cap with adjustable strap. Custom embroidery or print on front panel.</p><ul><li>Cotton twill</li><li>Pre-curved visor</li><li>Adjustable metal buckle</li><li>6-panel construction</li></ul>',
  249, 1, true, (SELECT id FROM categories WHERE slug = 'caps'),
  'https://images.unsplash.com/photo-1588850561407-ed78c334e67a?w=600&h=600&fit=crop'
),
(
  'Snapback Cap',
  '<p>Flat-brim snapback cap with adjustable snap closure. Urban streetwear style.</p><ul><li>Acrylic/wool blend</li><li>Flat brim</li><li>Snapback closure</li></ul>',
  299, 1, true, (SELECT id FROM categories WHERE slug = 'caps'),
  'https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=600&h=600&fit=crop'
),
(
  'Trucker Cap',
  '<p>Mesh-back trucker cap. Classic outdoor style with breathable mesh panels.</p><ul><li>Cotton front + mesh back</li><li>Snapback closure</li><li>Structured crown</li></ul>',
  279, 1, true, (SELECT id FROM categories WHERE slug = 'caps'),
  'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=600&h=600&fit=crop'
),

-- ─── MUGS ────────────────────────────────────────────────────────────────────

(
  'White Ceramic Mug (11oz)',
  '<p>Classic white ceramic mug. The most popular choice for custom photo mugs and gift mugs.</p><ul><li>11oz / 330ml capacity</li><li>AAA grade ceramic</li><li>Dishwasher safe</li><li>Sublimation printed</li></ul>',
  199, 1, true, (SELECT id FROM categories WHERE slug = 'mugs'),
  'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&h=600&fit=crop'
),
(
  'Magic Color Changing Mug',
  '<p>Heat-sensitive magic mug that reveals your custom design when hot liquid is poured in.</p><ul><li>11oz ceramic</li><li>Matte black when cold</li><li>Design appears with hot liquid</li><li>Great gift item</li></ul>',
  349, 1, true, (SELECT id FROM categories WHERE slug = 'mugs'),
  'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=600&h=600&fit=crop'
),
(
  'Travel Mug (Stainless Steel)',
  '<p>Insulated stainless steel travel mug with custom wrap-around print.</p><ul><li>450ml capacity</li><li>Double-wall insulation</li><li>Spill-proof lid</li><li>Keeps drinks hot 6hrs</li></ul>',
  499, 1, true, (SELECT id FROM categories WHERE slug = 'mugs'),
  'https://images.unsplash.com/photo-1570784981146-1f66a2b15614?w=600&h=600&fit=crop'
),
(
  'Black Matte Mug',
  '<p>Elegant black matte finish ceramic mug. Premium look with custom white/color print.</p><ul><li>11oz ceramic</li><li>Matte exterior finish</li><li>Glossy interior</li><li>UV printed</li></ul>',
  249, 1, true, (SELECT id FROM categories WHERE slug = 'mugs'),
  'https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=600&h=600&fit=crop'
),

-- ─── DRINKWARE ───────────────────────────────────────────────────────────────

(
  'Custom Water Bottle (750ml)',
  '<p>Stainless steel water bottle with custom print. Eco-friendly and durable.</p><ul><li>750ml capacity</li><li>BPA-free</li><li>Double wall vacuum</li><li>Leak-proof cap</li></ul>',
  599, 1, true, (SELECT id FROM categories WHERE slug = 'drinkware'),
  'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop'
),
(
  'Sipper Bottle with Straw',
  '<p>Clear sipper bottle with built-in straw. Great for gym, school, and outdoor use.</p><ul><li>500ml BPA-free plastic</li><li>Built-in straw</li><li>Flip-top lid</li></ul>',
  349, 1, true, (SELECT id FROM categories WHERE slug = 'drinkware'),
  'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&h=600&fit=crop'
),

-- ─── PHONE CASES ─────────────────────────────────────────────────────────────

(
  'iPhone Slim Case',
  '<p>Ultra-slim snap-on case for iPhone. Custom full-bleed print with glossy or matte finish.</p><ul><li>Polycarbonate shell</li><li>Edge-to-edge print</li><li>Precise cutouts</li><li>Scratch resistant</li></ul>',
  299, 1, true, (SELECT id FROM categories WHERE slug = 'phone-cases'),
  'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&h=600&fit=crop'
),
(
  'Samsung Galaxy Case',
  '<p>Custom printed case for Samsung Galaxy series. Tough protection with stunning prints.</p><ul><li>TPU + PC hybrid</li><li>Raised lip for screen protection</li><li>Wireless charging compatible</li></ul>',
  299, 1, true, (SELECT id FROM categories WHERE slug = 'phone-cases'),
  'https://images.unsplash.com/photo-1609081219671-c71eb98c3d56?w=600&h=600&fit=crop'
),
(
  'Tough Armor Phone Case',
  '<p>Heavy-duty dual-layer phone case with custom print. Military-grade drop protection.</p><ul><li>Dual layer TPU + PC</li><li>Air-cushion corners</li><li>MIL-STD-810G tested</li></ul>',
  449, 1, true, (SELECT id FROM categories WHERE slug = 'phone-cases'),
  'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=600&fit=crop'
),

-- ─── TOTE BAGS ───────────────────────────────────────────────────────────────

(
  'Canvas Tote Bag',
  '<p>Eco-friendly canvas tote bag with custom print. Perfect for shopping, gifting, and events.</p><ul><li>12oz canvas cotton</li><li>Reinforced handles</li><li>38cm × 42cm</li><li>Machine washable</li></ul>',
  249, 1, true, (SELECT id FROM categories WHERE slug = 'tote-bags'),
  'https://images.unsplash.com/photo-1597633425046-08f5110420b5?w=600&h=600&fit=crop'
),
(
  'Jute Tote Bag',
  '<p>Natural jute tote bag. Eco-friendly, biodegradable with rustic charm.</p><ul><li>Natural jute fiber</li><li>Laminated interior</li><li>Cotton webbed handles</li></ul>',
  199, 1, true, (SELECT id FROM categories WHERE slug = 'tote-bags'),
  'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=600&fit=crop'
),

-- ─── KEYCHAINS ───────────────────────────────────────────────────────────────

(
  'Acrylic Photo Keychain',
  '<p>Crystal-clear acrylic keychain with your custom photo. UV printed for vibrant colors.</p><ul><li>3mm acrylic</li><li>Metal keyring</li><li>UV resistant print</li><li>Multiple shapes available</li></ul>',
  99, 1, true, (SELECT id FROM categories WHERE slug = 'keychains'),
  'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=600&h=600&fit=crop'
),
(
  'Metal Keychain',
  '<p>Premium metal keychain with laser engraving. Elegant and durable.</p><ul><li>Zinc alloy</li><li>Laser engraved</li><li>Polished chrome finish</li></ul>',
  149, 1, true, (SELECT id FROM categories WHERE slug = 'keychains'),
  'https://images.unsplash.com/photo-1568633700186-cef08e195b44?w=600&h=600&fit=crop'
),
(
  'Wooden Keychain',
  '<p>Natural wooden keychain with custom engraving. Eco-friendly gift option.</p><ul><li>Premium wood</li><li>Laser engraved</li><li>Natural finish</li></ul>',
  129, 1, true, (SELECT id FROM categories WHERE slug = 'keychains'),
  'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&h=600&fit=crop'
),

-- ─── NOTEBOOKS & DIARIES ────────────────────────────────────────────────────

(
  'Hardcover Notebook (A5)',
  '<p>Premium A5 hardcover notebook with custom printed cover. 200 pages of ivory paper.</p><ul><li>A5 size (148 × 210mm)</li><li>200 ruled pages</li><li>80 GSM ivory paper</li><li>Elastic closure band</li></ul>',
  299, 1, true, (SELECT id FROM categories WHERE slug = 'diaries'),
  'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&h=600&fit=crop'
),
(
  'Spiral Notebook',
  '<p>Wire-bound spiral notebook with custom full-cover print. Lay-flat design for easy writing.</p><ul><li>A4 size</li><li>100 pages</li><li>70 GSM paper</li><li>Full cover print</li></ul>',
  199, 1, true, (SELECT id FROM categories WHERE slug = 'diaries'),
  'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&h=600&fit=crop'
),
(
  'Leather Diary',
  '<p>Premium PU leather diary with custom embossing or UV print. Executive gift item.</p><ul><li>PU leather cover</li><li>A5 size</li><li>Ribbon bookmark</li><li>Pen loop</li></ul>',
  449, 1, true, (SELECT id FROM categories WHERE slug = 'diaries'),
  'https://images.unsplash.com/photo-1528938102132-4a9276b8e320?w=600&h=600&fit=crop'
),

-- ─── PENS ────────────────────────────────────────────────────────────────────

(
  'Ballpoint Pen (Printed)',
  '<p>Custom printed ballpoint pen. Great for corporate events and promotions.</p><ul><li>Plastic barrel</li><li>Blue ink</li><li>Clip design</li><li>MOQ: 50 pieces</li></ul>',
  15, 50, true, (SELECT id FROM categories WHERE slug = 'pens'),
  'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=600&h=600&fit=crop'
),
(
  'Metal Pen (Engraved)',
  '<p>Premium metal pen with laser engraving. Elegant corporate gift in a gift box.</p><ul><li>Brass with chrome finish</li><li>Laser engraved</li><li>Gift box included</li><li>Black ink</li></ul>',
  199, 1, true, (SELECT id FROM categories WHERE slug = 'pens'),
  'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&h=600&fit=crop'
),

-- ─── MOUSEPADS ───────────────────────────────────────────────────────────────

(
  'Standard Mousepad',
  '<p>Custom printed rectangular mousepad. Full-bleed edge-to-edge printing.</p><ul><li>24cm × 20cm</li><li>3mm rubber base</li><li>Smooth cloth surface</li><li>Non-slip bottom</li></ul>',
  149, 1, true, (SELECT id FROM categories WHERE slug = 'mousepads'),
  'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&h=600&fit=crop'
),
(
  'Extended Desk Mousepad',
  '<p>Extra-large desk mat / mousepad with custom print. Covers keyboard + mouse area.</p><ul><li>80cm × 30cm</li><li>4mm rubber base</li><li>Stitched edges</li><li>Machine washable</li></ul>',
  399, 1, true, (SELECT id FROM categories WHERE slug = 'mousepads'),
  'https://images.unsplash.com/photo-1629131726692-1accd0c53ce0?w=600&h=600&fit=crop'
),

-- ─── CUSHIONS & PILLOWS ──────────────────────────────────────────────────────

(
  'Custom Photo Cushion',
  '<p>Soft velvet cushion with custom photo print. Includes cushion filler.</p><ul><li>40cm × 40cm</li><li>Velvet front</li><li>Sublimation printed</li><li>Filler included</li></ul>',
  399, 1, true, (SELECT id FROM categories WHERE slug = 'cushions'),
  'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&h=600&fit=crop'
),
(
  'Sequin Magic Cushion',
  '<p>Reversible sequin cushion that reveals your custom photo when sequins are brushed.</p><ul><li>40cm × 40cm</li><li>Reversible sequins</li><li>Hidden photo reveal</li><li>Filler included</li></ul>',
  549, 1, true, (SELECT id FROM categories WHERE slug = 'cushions'),
  'https://images.unsplash.com/photo-1616486029378-73489d31b3f3?w=600&h=600&fit=crop'
),

-- ─── WALL CLOCKS ─────────────────────────────────────────────────────────────

(
  'Round Wall Clock',
  '<p>Custom printed round wall clock. Full-face sublimation print with silent movement.</p><ul><li>30cm diameter</li><li>MDF with glass front</li><li>Silent quartz movement</li><li>AA battery operated</li></ul>',
  499, 1, true, (SELECT id FROM categories WHERE slug = 'wall-clocks'),
  'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=600&h=600&fit=crop'
),
(
  'Square Wall Clock',
  '<p>Modern square wall clock with edge-to-edge custom print.</p><ul><li>28cm × 28cm</li><li>Acrylic face</li><li>Silent sweep movement</li></ul>',
  549, 1, true, (SELECT id FROM categories WHERE slug = 'wall-clocks'),
  'https://images.unsplash.com/photo-1507206130118-b5907f817163?w=600&h=600&fit=crop'
),

-- ─── PHOTO FRAMES ────────────────────────────────────────────────────────────

(
  'Wooden Photo Frame',
  '<p>Classic wooden photo frame with custom printed photo. Available in multiple sizes.</p><ul><li>Solid wood frame</li><li>Glass front</li><li>Easel back + wall mount</li><li>6×8 inch</li></ul>',
  299, 1, true, (SELECT id FROM categories WHERE slug = 'photo-frames'),
  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&h=600&fit=crop'
),
(
  'Acrylic Photo Frame',
  '<p>Modern frameless acrylic photo frame with UV printed photo. Crystal-clear display.</p><ul><li>Acrylic crystal</li><li>UV printed</li><li>Tabletop stand</li></ul>',
  349, 1, true, (SELECT id FROM categories WHERE slug = 'photo-frames'),
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&h=600&fit=crop'
),

-- ─── AWARDS & TROPHIES ──────────────────────────────────────────────────────

(
  'Crystal Trophy',
  '<p>Premium crystal trophy with laser engraving. Ideal for corporate awards and recognition.</p><ul><li>Optical crystal</li><li>3D laser engraving</li><li>Velvet gift box</li><li>Multiple sizes</li></ul>',
  799, 1, true, (SELECT id FROM categories WHERE slug = 'awards'),
  'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=600&h=600&fit=crop'
),
(
  'Wooden Plaque',
  '<p>Solid wood plaque with metal plate engraving. Classic award for achievements.</p><ul><li>Solid walnut wood</li><li>Brass plate</li><li>Laser engraved</li></ul>',
  599, 1, true, (SELECT id FROM categories WHERE slug = 'awards'),
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&h=600&fit=crop'
),
(
  'Acrylic Award',
  '<p>Custom acrylic award with full-color UV print. Modern and lightweight.</p><ul><li>12mm acrylic</li><li>Full color UV print</li><li>Freestanding design</li></ul>',
  499, 1, true, (SELECT id FROM categories WHERE slug = 'awards'),
  'https://images.unsplash.com/photo-1541178735493-479c1a27ed24?w=600&h=600&fit=crop'
),

-- ─── VISITING CARDS ──────────────────────────────────────────────────────────

(
  'Standard Visiting Card',
  '<p>Custom printed visiting cards on 350 GSM art paper. Matte or glossy lamination.</p><ul><li>350 GSM art paper</li><li>Full color both sides</li><li>Matte/Glossy lamination</li><li>Pack of 200</li></ul>',
  199, 200, true, (SELECT id FROM categories WHERE slug = 'visiting-cards'),
  'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=600&fit=crop'
),
(
  'Premium Textured Visiting Card',
  '<p>Luxury visiting cards on textured cotton paper with letterpress or foil stamping.</p><ul><li>600 GSM cotton paper</li><li>Letterpress or foil stamp</li><li>Edge coloring available</li><li>Pack of 100</li></ul>',
  499, 100, true, (SELECT id FROM categories WHERE slug = 'visiting-cards'),
  'https://images.unsplash.com/photo-1622542796254-5b9c46ab0d2f?w=600&h=600&fit=crop'
),

-- ─── CORPORATE GIFTS ─────────────────────────────────────────────────────────

(
  'Corporate Gift Set',
  '<p>Complete corporate gift set with pen, diary, keychain, and card holder. Custom branding.</p><ul><li>PU leather diary</li><li>Metal pen</li><li>Metal keychain</li><li>Card holder</li><li>Gift box packaging</li></ul>',
  999, 1, true, (SELECT id FROM categories WHERE slug = 'corporate-gifts'),
  'https://images.unsplash.com/photo-1549465220-1a8b9238f760?w=600&h=600&fit=crop'
),
(
  'Welcome Kit Box',
  '<p>Employee welcome kit with custom branded merchandise. Fully customizable contents.</p><ul><li>Custom branded box</li><li>T-shirt + Mug + Notebook</li><li>Pen + Stickers</li><li>Custom welcome card</li></ul>',
  1499, 10, true, (SELECT id FROM categories WHERE slug = 'corporate-gifts'),
  'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600&h=600&fit=crop'
),

-- ─── CALENDARS ───────────────────────────────────────────────────────────────

(
  'Wall Calendar (12 Months)',
  '<p>Custom printed wall calendar with your photos. 12 months with wire-o binding.</p><ul><li>A3 size (29.7 × 42cm)</li><li>250 GSM art paper</li><li>Wire-o binding</li><li>Custom photos per month</li></ul>',
  349, 1, true, (SELECT id FROM categories WHERE slug = 'calendars'),
  'https://images.unsplash.com/photo-1506784365847-bbad939e9335?w=600&h=600&fit=crop'
),
(
  'Desk Calendar',
  '<p>Compact desk calendar with custom design. Stands on any desk or table.</p><ul><li>20 × 15cm</li><li>300 GSM card</li><li>Spiral bound</li><li>6 or 12 month options</li></ul>',
  199, 1, true, (SELECT id FROM categories WHERE slug = 'calendars'),
  'https://images.unsplash.com/photo-1435527173128-983b87201f4d?w=600&h=600&fit=crop'
),

-- ─── LAPTOP SLEEVES ──────────────────────────────────────────────────────────

(
  'Laptop Sleeve (13 inch)',
  '<p>Padded neoprene laptop sleeve with custom print. Fits 13" MacBook, Surface, and more.</p><ul><li>Neoprene material</li><li>Padded interior</li><li>Full zip closure</li><li>Water resistant</li></ul>',
  499, 1, true, (SELECT id FROM categories WHERE slug = 'laptop-sleeves'),
  'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&h=600&fit=crop'
),
(
  'Laptop Sleeve (15 inch)',
  '<p>Larger padded laptop sleeve for 15" laptops. Custom all-over print.</p><ul><li>Neoprene material</li><li>Padded interior</li><li>Full zip closure</li></ul>',
  549, 1, true, (SELECT id FROM categories WHERE slug = 'laptop-sleeves'),
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop'
),

-- ─── COASTERS ────────────────────────────────────────────────────────────────

(
  'MDF Coaster Set (4 pcs)',
  '<p>Set of 4 MDF coasters with custom print. Cork-backed for surface protection.</p><ul><li>9cm × 9cm each</li><li>3mm MDF</li><li>Cork backing</li><li>UV printed</li></ul>',
  249, 1, true, (SELECT id FROM categories WHERE slug = 'coasters'),
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=600&fit=crop'
),
(
  'Ceramic Coaster Set (4 pcs)',
  '<p>Premium ceramic coasters with custom design. Absorbent surface with cork base.</p><ul><li>10cm × 10cm</li><li>Ceramic tile</li><li>Absorbent surface</li><li>Cork base</li></ul>',
  349, 1, true, (SELECT id FROM categories WHERE slug = 'coasters'),
  'https://images.unsplash.com/photo-1523413363574-c4e3e4f31eb4?w=600&h=600&fit=crop'
),

-- ─── APRONS ──────────────────────────────────────────────────────────────────

(
  'Kitchen Apron',
  '<p>Custom printed kitchen apron. Full front print with adjustable neck strap.</p><ul><li>Poly-cotton blend</li><li>65cm × 75cm</li><li>Adjustable neck strap</li><li>Front pocket</li></ul>',
  349, 1, true, (SELECT id FROM categories WHERE slug = 'aprons'),
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=600&fit=crop'
),
(
  'Chef Apron (Canvas)',
  '<p>Heavy-duty canvas apron for professional kitchen or BBQ use. Custom embroidery or print.</p><ul><li>14oz canvas</li><li>Cross-back straps</li><li>Multiple pockets</li><li>Wax-coated option</li></ul>',
  549, 1, true, (SELECT id FROM categories WHERE slug = 'aprons'),
  'https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=600&h=600&fit=crop'
),

-- ─── BADGES & LANYARDS ───────────────────────────────────────────────────────

(
  'Button Badge',
  '<p>Custom printed pin-back button badges. Great for events, campaigns, and merch.</p><ul><li>58mm diameter</li><li>Metal pin back</li><li>Full color print</li><li>MOQ: 10 pieces</li></ul>',
  25, 10, true, (SELECT id FROM categories WHERE slug = 'badges'),
  'https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=600&h=600&fit=crop'
),
(
  'Custom Lanyard',
  '<p>Custom printed lanyard with ID card holder. Perfect for offices, events, and conferences.</p><ul><li>20mm width</li><li>Polyester satin</li><li>Safety breakaway buckle</li><li>ID holder included</li></ul>',
  49, 25, true, (SELECT id FROM categories WHERE slug = 'badges'),
  'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=600&h=600&fit=crop'
),
(
  'Fridge Magnet',
  '<p>Custom printed fridge magnet. Perfect souvenir or promotional item.</p><ul><li>7cm × 5cm</li><li>Flexible magnet</li><li>Full color print</li><li>Laminated surface</li></ul>',
  49, 1, true, (SELECT id FROM categories WHERE slug = 'badges'),
  'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=600&fit=crop'
),

-- ─── RINGS & JEWELRY ─────────────────────────────────────────────────────────

(
  'Custom Engraved Ring',
  '<p>Premium stainless steel ring with custom engraving. Perfect for personalized gifts.</p><ul><li>316L Stainless Steel</li><li>Polished / Matte finish</li><li>Custom text engraving</li><li>Sizes 5 to 13</li></ul>',
  499, 1, true, (SELECT id FROM categories WHERE slug = 'rings'),
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop'
),
(
  'Name Pendant Necklace',
  '<p>Custom name pendant necklace in stainless steel or gold-plated finish.</p><ul><li>Stainless steel / Gold-plated</li><li>Custom name laser cut</li><li>18-inch chain</li><li>Gift box included</li></ul>',
  399, 1, true, (SELECT id FROM categories WHERE slug = 'rings'),
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop'
)
ON CONFLICT DO NOTHING;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 3: PRODUCT VARIANTS (sizes/colors for clothing, sizes for mugs, etc) ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝


-- ─── T-Shirt Variants (all t-shirts get S/M/L/XL/XXL in multiple colors) ────

DO $$
DECLARE
  tshirt_names TEXT[] := ARRAY[
    'Round Neck Cotton T-Shirt',
    'V-Neck Premium T-Shirt',
    'Oversized Streetwear T-Shirt',
    'Full Sleeve T-Shirt',
    'Raglan Baseball T-Shirt'
  ];
  sizes TEXT[] := ARRAY['S', 'M', 'L', 'XL', 'XXL'];
  colors TEXT[] := ARRAY['White', 'Black', 'Navy', 'Red', 'Grey'];
  tshirt TEXT;
  prod_id UUID;
  s TEXT;
  c TEXT;
  price_adj NUMERIC;
BEGIN
  FOREACH tshirt IN ARRAY tshirt_names LOOP
    SELECT id INTO prod_id FROM products WHERE name = tshirt LIMIT 1;
    IF prod_id IS NULL THEN CONTINUE; END IF;

    FOREACH s IN ARRAY sizes LOOP
      FOREACH c IN ARRAY colors LOOP
        -- XXL gets +50, XL gets +30
        price_adj := CASE WHEN s = 'XXL' THEN 50 WHEN s = 'XL' THEN 30 ELSE 0 END;

        INSERT INTO product_variants (product_id, size, color, price_adjustment, stock_quantity, sku)
        VALUES (
          prod_id, s, c, price_adj, 100,
          LOWER(REPLACE(tshirt, ' ', '-')) || '-' || LOWER(s) || '-' || LOWER(c)
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ─── Hoodie/Sweatshirt Variants ──────────────────────────────────────────────

DO $$
DECLARE
  hoodie_names TEXT[] := ARRAY[
    'Pullover Hoodie',
    'Zip-Up Hoodie',
    'Crewneck Sweatshirt'
  ];
  sizes TEXT[] := ARRAY['S', 'M', 'L', 'XL', 'XXL'];
  colors TEXT[] := ARRAY['Black', 'Grey', 'Navy', 'White'];
  h TEXT;
  prod_id UUID;
  s TEXT;
  c TEXT;
  price_adj NUMERIC;
BEGIN
  FOREACH h IN ARRAY hoodie_names LOOP
    SELECT id INTO prod_id FROM products WHERE name = h LIMIT 1;
    IF prod_id IS NULL THEN CONTINUE; END IF;

    FOREACH s IN ARRAY sizes LOOP
      FOREACH c IN ARRAY colors LOOP
        price_adj := CASE WHEN s = 'XXL' THEN 100 WHEN s = 'XL' THEN 50 ELSE 0 END;

        INSERT INTO product_variants (product_id, size, color, price_adjustment, stock_quantity, sku)
        VALUES (
          prod_id, s, c, price_adj, 50,
          LOWER(REPLACE(h, ' ', '-')) || '-' || LOWER(s) || '-' || LOWER(c)
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ─── Polo Shirt Variants ────────────────────────────────────────────────────

DO $$
DECLARE
  polo_names TEXT[] := ARRAY['Classic Polo T-Shirt', 'Dry-Fit Polo T-Shirt'];
  sizes TEXT[] := ARRAY['S', 'M', 'L', 'XL', 'XXL'];
  colors TEXT[] := ARRAY['White', 'Black', 'Navy', 'Royal Blue', 'Red'];
  p TEXT;
  prod_id UUID;
  s TEXT;
  c TEXT;
BEGIN
  FOREACH p IN ARRAY polo_names LOOP
    SELECT id INTO prod_id FROM products WHERE name = p LIMIT 1;
    IF prod_id IS NULL THEN CONTINUE; END IF;

    FOREACH s IN ARRAY sizes LOOP
      FOREACH c IN ARRAY colors LOOP
        INSERT INTO product_variants (product_id, size, color, price_adjustment, stock_quantity, sku)
        VALUES (
          prod_id, s, c,
          CASE WHEN s = 'XXL' THEN 50 WHEN s = 'XL' THEN 30 ELSE 0 END,
          75,
          LOWER(REPLACE(p, ' ', '-')) || '-' || LOWER(s) || '-' || LOWER(REPLACE(c, ' ', '-'))
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- ─── Cap Variants ────────────────────────────────────────────────────────────

DO $$
DECLARE
  cap_names TEXT[] := ARRAY['Baseball Cap', 'Snapback Cap', 'Trucker Cap'];
  colors TEXT[] := ARRAY['Black', 'White', 'Navy', 'Red', 'Khaki'];
  cap TEXT;
  prod_id UUID;
  c TEXT;
BEGIN
  FOREACH cap IN ARRAY cap_names LOOP
    SELECT id INTO prod_id FROM products WHERE name = cap LIMIT 1;
    IF prod_id IS NULL THEN CONTINUE; END IF;

    FOREACH c IN ARRAY colors LOOP
      INSERT INTO product_variants (product_id, color, price_adjustment, stock_quantity, sku)
      VALUES (
        prod_id, c, 0, 100,
        LOWER(REPLACE(cap, ' ', '-')) || '-' || LOWER(c)
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ─── Ring Variants (sizes) ───────────────────────────────────────────────────

DO $$
DECLARE
  ring_sizes TEXT[] := ARRAY['5', '6', '7', '8', '9', '10', '11', '12', '13'];
  ring_colors TEXT[] := ARRAY['Silver', 'Gold', 'Rose Gold', 'Black'];
  prod_id UUID;
  s TEXT;
  c TEXT;
BEGIN
  SELECT id INTO prod_id FROM products WHERE name = 'Custom Engraved Ring' LIMIT 1;
  IF prod_id IS NOT NULL THEN
    FOREACH s IN ARRAY ring_sizes LOOP
      FOREACH c IN ARRAY ring_colors LOOP
        INSERT INTO product_variants (product_id, size, color, price_adjustment, stock_quantity, sku)
        VALUES (
          prod_id, s, c,
          CASE WHEN c = 'Gold' THEN 200 WHEN c = 'Rose Gold' THEN 150 ELSE 0 END,
          30,
          'ring-' || LOWER(s) || '-' || LOWER(REPLACE(c, ' ', '-'))
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
END $$;

-- ─── Phone Case Variants ────────────────────────────────────────────────────

DO $$
DECLARE
  case_names TEXT[] := ARRAY['iPhone Slim Case', 'Samsung Galaxy Case', 'Tough Armor Phone Case'];
  models TEXT[] := ARRAY['iPhone 15', 'iPhone 14', 'iPhone 13', 'Galaxy S24', 'Galaxy S23'];
  cn TEXT;
  prod_id UUID;
  m TEXT;
BEGIN
  FOREACH cn IN ARRAY case_names LOOP
    SELECT id INTO prod_id FROM products WHERE name = cn LIMIT 1;
    IF prod_id IS NULL THEN CONTINUE; END IF;

    FOREACH m IN ARRAY models LOOP
      INSERT INTO product_variants (product_id, size, price_adjustment, stock_quantity, sku)
      VALUES (
        prod_id, m, 0, 50,
        LOWER(REPLACE(cn, ' ', '-')) || '-' || LOWER(REPLACE(m, ' ', '-'))
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ─── Cushion Variants ────────────────────────────────────────────────────────

DO $$
DECLARE
  cushion_names TEXT[] := ARRAY['Custom Photo Cushion', 'Sequin Magic Cushion'];
  sizes TEXT[] := ARRAY['30×30 cm', '40×40 cm', '50×50 cm'];
  cn TEXT;
  prod_id UUID;
  s TEXT;
BEGIN
  FOREACH cn IN ARRAY cushion_names LOOP
    SELECT id INTO prod_id FROM products WHERE name = cn LIMIT 1;
    IF prod_id IS NULL THEN CONTINUE; END IF;

    FOREACH s IN ARRAY sizes LOOP
      INSERT INTO product_variants (product_id, size, price_adjustment, stock_quantity, sku)
      VALUES (
        prod_id, s,
        CASE WHEN s = '50×50 cm' THEN 200 WHEN s = '40×40 cm' THEN 100 ELSE 0 END,
        40,
        LOWER(REPLACE(cn, ' ', '-')) || '-' || LOWER(REPLACE(s, '×', 'x'))
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;



-- ✅ Done! Refresh your shop page to see all products.
