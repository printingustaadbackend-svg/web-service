// Hierarchical category structure for Navigation & Shop browsing
// 18 category groups as per business requirements
export const CATEGORY_GROUPS = [
  {
    id: 'tshirts',
    name: 'T-Shirts',
    shortName: 'T-Shirts',
    icon: 'styler',
    description: 'Round neck, polo, dry-fit, oversized & more',
    slugs: ['t-shirts', 'round-neck-tshirt', 'polo-tshirt', 'dry-fit-tshirt', 'oversized-tshirt', 'full-sleeve-tshirt', 'sports-tshirt', 'kids-tshirt', 'branded-tshirt', 'embroidery-tshirt'],
  },
  {
    id: 'hoodies',
    name: 'Hoodies & Sweatshirts',
    shortName: 'Hoodies',
    icon: 'dry_cleaning',
    description: 'Custom hoodies, zipper hoodies & sweatshirts',
    slugs: ['hoodies', 'hoodie', 'zipper-hoodie', 'sweatshirt', 'oversized-sweatshirt'],
  },
  {
    id: 'shirts',
    name: 'Shirts',
    shortName: 'Shirts',
    icon: 'apparel',
    description: 'Formal, casual & corporate shirts',
    slugs: ['shirts', 'formal-shirt', 'casual-shirt', 'corporate-shirt'],
  },
  {
    id: 'caps',
    name: 'Caps & Headwear',
    shortName: 'Caps',
    icon: 'sports_baseball',
    description: 'Custom caps, hats & bucket hats',
    slugs: ['caps', 'cap', 'hat', 'bucket-hat', 'embroidery-cap'],
  },
  {
    id: 'bags',
    name: 'Bags',
    shortName: 'Bags',
    icon: 'shopping_bag',
    description: 'Tote, jute, laptop bags & more',
    slugs: ['bags', 'tote-bag', 'jute-bag', 'non-woven-bag', 'paper-bag', 'sling-bag', 'backpack', 'laptop-bag', 'laptop-sleeve', 'drawstring-bag'],
  },
  {
    id: 'mugs',
    name: 'Mugs',
    shortName: 'Mugs',
    icon: 'coffee',
    description: 'Custom printed mugs',
    slugs: ['mugs'],
  },
  {
    id: 'bottles',
    name: 'Bottles & Drinkware',
    shortName: 'Bottles',
    icon: 'water_bottle',
    description: 'Water bottles, flasks, sippers & tumblers',
    slugs: ['bottles', 'water-bottle', 'stainless-steel-bottle', 'vacuum-bottle', 'copper-bottle', 'sipper', 'tumbler', 'travel-mug', 'flask'],
  },
  {
    id: 'office',
    name: 'Office & Stationery',
    shortName: 'Office',
    icon: 'menu_book',
    description: 'Diaries, notebooks, pens & desk accessories',
    slugs: ['office', 'diary', 'notebook', 'pen', 'notepad', 'folder', 'paperweight', 'desk-organizer', 'visiting-card-holder', 'mouse-pad'],
  },
  {
    id: 'printed-stationery',
    name: 'Printed Stationery',
    shortName: 'Stationery',
    icon: 'print',
    description: 'Visiting cards, envelopes, brochures & stickers',
    slugs: ['printed-stationery', 'visiting-cards', 'letterhead', 'envelope', 'brochure', 'flyer', 'calendars', 'sticker'],
  },
  {
    id: 'corporate-gifts',
    name: 'Corporate Gifts',
    shortName: 'Corporate',
    icon: 'card_giftcard',
    description: 'Corporate gift sets, welcome kits & hampers',
    slugs: ['corporate-gifts', 'corporate-gift-set', 'executive-gift-set', 'employee-gift', 'client-gift', 'promotional-gift', 'welcome-kit', 'gift-hamper'],
  },
  {
    id: 'awards',
    name: 'Awards & Trophies',
    shortName: 'Awards',
    icon: 'military_tech',
    description: 'Trophies, medals, plaques & awards',
    slugs: ['awards', 'trophy', 'acrylic-trophy', 'crystal-trophy', 'wooden-trophy', 'medal', 'plaque', 'award'],
  },
  {
    id: 'personalized-gifts',
    name: 'Personalized Gifts',
    shortName: 'Gifts',
    icon: 'redeem',
    description: 'Photo frames, cushions, keychains & more',
    slugs: ['personalized-gifts', 'photo-frames', 'cushions', 'wall-clocks', 'keychains', 'magnet', 'rings', 'personalized-gift'],
  },
  {
    id: 'electronic-gifts',
    name: 'Electronic Gifts',
    shortName: 'Electronics',
    icon: 'devices',
    description: 'Power banks, speakers, earbuds & accessories',
    slugs: ['electronic-gifts', 'power-bank', 'bluetooth-speaker', 'earbuds', 'usb-drive', 'wireless-charger', 'charging-cable', 'mobile-stand'],
  },
  {
    id: 'promotional',
    name: 'Promotional & Display',
    shortName: 'Promotional',
    icon: 'campaign',
    description: 'Banners, standees, canopies & posters',
    slugs: ['promotional', 'flex-banner', 'standee', 'roll-up-standee', 'canopy', 'poster', 'backdrop', 'table-display'],
  },
  {
    id: 'packaging',
    name: 'Packaging',
    shortName: 'Packaging',
    icon: 'inventory_2',
    description: 'Gift boxes, paper bags & packaging materials',
    slugs: ['packaging', 'gift-box', 'corporate-gift-box', 'paper-bag-pkg', 'gift-bag', 'packaging-sticker', 'hang-tag', 'thank-you-card'],
  },
  {
    id: 'sports',
    name: 'Sports & Fitness',
    shortName: 'Sports',
    icon: 'sports',
    description: 'Jerseys, gym wear, sports accessories',
    slugs: ['sports', 'sports-jersey', 'sports-tshirt', 'gym-tshirt', 'gym-bag', 'sports-cap', 'sports-bottle', 'yoga-mat', 'gym-towel'],
  },
  {
    id: 'aprons-uniforms',
    name: 'Aprons & Uniforms',
    shortName: 'Uniforms',
    icon: 'soup_kitchen',
    description: 'Aprons, chef wear & corporate uniforms',
    slugs: ['aprons', 'apron', 'chef-apron', 'corporate-uniform', 'staff-uniform', 'school-uniform', 'workwear'],
  },
  {
    id: 'phone-cases',
    name: 'Phone Cases',
    shortName: 'Phone Cases',
    icon: 'smartphone',
    description: 'Custom printed phone cases',
    slugs: ['phone-cases'],
  },
];

export const DEFAULT_SUBCAT_NAMES = {
  // T-Shirts
  't-shirts': 'T-Shirts',
  'round-neck-tshirt': 'Round Neck T-Shirt',
  'polo-tshirt': 'Polo T-Shirt',
  'dry-fit-tshirt': 'Dry Fit T-Shirt',
  'oversized-tshirt': 'Oversized T-Shirt',
  'full-sleeve-tshirt': 'Full Sleeve T-Shirt',
  'sports-tshirt': 'Sports T-Shirt',
  'kids-tshirt': 'Kids T-Shirt',
  'branded-tshirt': 'Branded T-Shirt',
  'embroidery-tshirt': 'Embroidery T-Shirt',

  // Hoodies & Sweatshirts
  'hoodies': 'Hoodies & Sweatshirts',
  'hoodie': 'Hoodie',
  'zipper-hoodie': 'Zipper Hoodie',
  'sweatshirt': 'Sweatshirt',
  'oversized-sweatshirt': 'Oversized Sweatshirt',

  // Shirts
  'shirts': 'Shirts',
  'formal-shirt': 'Formal Shirt',
  'casual-shirt': 'Casual Shirt',
  'corporate-shirt': 'Corporate Shirt',

  // Caps & Headwear
  'caps': 'Caps & Headwear',
  'cap': 'Cap',
  'hat': 'Hat',
  'bucket-hat': 'Bucket Hat',
  'embroidery-cap': 'Embroidery Cap',

  // Bags
  'bags': 'Bags',
  'tote-bag': 'Tote Bag',
  'jute-bag': 'Jute Bag',
  'non-woven-bag': 'Non-Woven Bag',
  'paper-bag': 'Paper Bag',
  'sling-bag': 'Sling Bag',
  'backpack': 'Backpack',
  'laptop-bag': 'Laptop Bag',
  'laptop-sleeve': 'Laptop Sleeve',
  'drawstring-bag': 'Drawstring Bag',

  // Mugs
  'mugs': 'Mugs',

  // Bottles & Drinkware
  'bottles': 'Bottles & Drinkware',
  'water-bottle': 'Water Bottle',
  'stainless-steel-bottle': 'Stainless Steel Bottle',
  'vacuum-bottle': 'Vacuum Bottle',
  'copper-bottle': 'Copper Bottle',
  'sipper': 'Sipper',
  'tumbler': 'Tumbler',
  'travel-mug': 'Travel Mug',
  'flask': 'Flask',

  // Office & Stationery
  'office': 'Office & Stationery',
  'diary': 'Diary',
  'notebook': 'Notebook',
  'pen': 'Pen',
  'notepad': 'Notepad',
  'folder': 'Folder',
  'paperweight': 'Paperweight',
  'desk-organizer': 'Desk Organizer',
  'visiting-card-holder': 'Visiting Card Holder',
  'mouse-pad': 'Mouse Pad',

  // Printed Stationery
  'printed-stationery': 'Printed Stationery',
  'visiting-cards': 'Visiting Card',
  'letterhead': 'Letterhead',
  'envelope': 'Envelope',
  'brochure': 'Brochure',
  'flyer': 'Flyer',
  'calendars': 'Calendar',
  'sticker': 'Sticker',

  // Corporate Gifts
  'corporate-gifts': 'Corporate Gifts',
  'corporate-gift-set': 'Corporate Gift Set',
  'executive-gift-set': 'Executive Gift Set',
  'employee-gift': 'Employee Gift',
  'client-gift': 'Client Gift',
  'promotional-gift': 'Promotional Gift',
  'welcome-kit': 'Welcome Kit',
  'gift-hamper': 'Gift Hamper',

  // Awards & Trophies
  'awards': 'Awards & Trophies',
  'trophy': 'Trophy',
  'acrylic-trophy': 'Acrylic Trophy',
  'crystal-trophy': 'Crystal Trophy',
  'wooden-trophy': 'Wooden Trophy',
  'medal': 'Medal',
  'plaque': 'Plaque',
  'award': 'Award',

  // Personalized Gifts
  'personalized-gifts': 'Personalized Gifts',
  'photo-frames': 'Photo Frame',
  'cushions': 'Cushion',
  'wall-clocks': 'Wall Clock',
  'keychains': 'Keychain',
  'magnet': 'Magnet',
  'rings': 'Ring',
  'personalized-gift': 'Personalized Gift',

  // Electronic Gifts
  'electronic-gifts': 'Electronic Gifts',
  'power-bank': 'Power Bank',
  'bluetooth-speaker': 'Bluetooth Speaker',
  'earbuds': 'Earbuds',
  'usb-drive': 'USB Drive',
  'wireless-charger': 'Wireless Charger',
  'charging-cable': 'Charging Cable',
  'mobile-stand': 'Mobile Stand',

  // Promotional & Display
  'promotional': 'Promotional & Display',
  'flex-banner': 'Flex Banner',
  'standee': 'Standee',
  'roll-up-standee': 'Roll-Up Standee',
  'canopy': 'Canopy',
  'poster': 'Poster',
  'backdrop': 'Backdrop',
  'table-display': 'Table Display',

  // Packaging
  'packaging': 'Packaging',
  'gift-box': 'Gift Box',
  'corporate-gift-box': 'Corporate Gift Box',
  'paper-bag-pkg': 'Paper Bag',
  'gift-bag': 'Gift Bag',
  'packaging-sticker': 'Packaging Sticker',
  'hang-tag': 'Hang Tag',
  'thank-you-card': 'Thank You Card',

  // Sports & Fitness
  'sports': 'Sports & Fitness',
  'sports-jersey': 'Sports Jersey',
  'sports-tshirt': 'Sports T-Shirt',
  'gym-tshirt': 'Gym T-Shirt',
  'gym-bag': 'Gym Bag',
  'sports-cap': 'Sports Cap',
  'sports-bottle': 'Sports Bottle',
  'yoga-mat': 'Yoga Mat',
  'gym-towel': 'Gym Towel',

  // Aprons & Uniforms
  'aprons': 'Aprons & Uniforms',
  'apron': 'Apron',
  'chef-apron': 'Chef Apron',
  'corporate-uniform': 'Corporate Uniform',
  'staff-uniform': 'Staff Uniform',
  'school-uniform': 'School Uniform',
  'workwear': 'Workwear',

  // Phone Cases
  'phone-cases': 'Phone Cases',
};

// Subcategory display metadata (icon, popular badge)
export const SUBCATEGORY_META = {
  // T-Shirts
  't-shirts': { icon: 'styler', popular: true },
  'round-neck-tshirt': { icon: 'styler' },
  'polo-tshirt': { icon: 'apparel' },
  'dry-fit-tshirt': { icon: 'sprint' },
  'oversized-tshirt': { icon: 'styler' },
  'full-sleeve-tshirt': { icon: 'styler' },
  'sports-tshirt': { icon: 'sports' },
  'kids-tshirt': { icon: 'child_care' },
  'branded-tshirt': { icon: 'verified' },
  'embroidery-tshirt': { icon: 'draw', whatsapp: true },

  // Hoodies
  'hoodies': { icon: 'dry_cleaning', popular: true },
  'hoodie': { icon: 'dry_cleaning' },
  'zipper-hoodie': { icon: 'dry_cleaning' },
  'sweatshirt': { icon: 'dry_cleaning' },
  'oversized-sweatshirt': { icon: 'dry_cleaning' },

  // Shirts
  'shirts': { icon: 'apparel' },
  'formal-shirt': { icon: 'apparel' },
  'casual-shirt': { icon: 'apparel' },
  'corporate-shirt': { icon: 'apparel' },

  // Caps
  'caps': { icon: 'sports_baseball', popular: true },
  'cap': { icon: 'sports_baseball' },
  'hat': { icon: 'sports_baseball' },
  'bucket-hat': { icon: 'sports_baseball' },
  'embroidery-cap': { icon: 'draw', whatsapp: true },

  // Bags
  'bags': { icon: 'shopping_bag' },
  'tote-bag': { icon: 'shopping_bag' },
  'jute-bag': { icon: 'shopping_bag' },
  'non-woven-bag': { icon: 'shopping_bag' },
  'paper-bag': { icon: 'shopping_bag' },
  'sling-bag': { icon: 'backpack' },
  'backpack': { icon: 'backpack' },
  'laptop-bag': { icon: 'laptop' },
  'laptop-sleeve': { icon: 'laptop' },
  'drawstring-bag': { icon: 'shopping_bag' },

  // Mugs
  'mugs': { icon: 'coffee', popular: true },

  // Bottles
  'bottles': { icon: 'water_bottle' },
  'water-bottle': { icon: 'water_bottle' },
  'stainless-steel-bottle': { icon: 'water_bottle' },
  'vacuum-bottle': { icon: 'water_bottle' },
  'copper-bottle': { icon: 'water_bottle' },
  'sipper': { icon: 'water_bottle' },
  'tumbler': { icon: 'local_cafe' },
  'travel-mug': { icon: 'local_cafe' },
  'flask': { icon: 'water_bottle' },

  // Office & Stationery
  'office': { icon: 'menu_book' },
  'diary': { icon: 'book', popular: true },
  'notebook': { icon: 'book' },
  'pen': { icon: 'edit' },
  'notepad': { icon: 'note' },
  'folder': { icon: 'folder' },
  'paperweight': { icon: 'diamond' },
  'desk-organizer': { icon: 'grid_view' },
  'visiting-card-holder': { icon: 'badge' },
  'mouse-pad': { icon: 'mouse' },

  // Printed Stationery
  'printed-stationery': { icon: 'print' },
  'visiting-cards': { icon: 'badge', popular: true },
  'letterhead': { icon: 'description', whatsapp: true },
  'envelope': { icon: 'mail' },
  'brochure': { icon: 'menu_book' },
  'flyer': { icon: 'description', whatsapp: true },
  'calendars': { icon: 'calendar_today', whatsapp: true },
  'sticker': { icon: 'label' },

  // Corporate Gifts
  'corporate-gifts': { icon: 'card_giftcard', popular: true, whatsapp: true },
  'corporate-gift-set': { icon: 'card_giftcard', whatsapp: true },
  'executive-gift-set': { icon: 'card_giftcard', whatsapp: true },
  'employee-gift': { icon: 'card_giftcard', whatsapp: true },
  'client-gift': { icon: 'card_giftcard', whatsapp: true },
  'promotional-gift': { icon: 'card_giftcard', whatsapp: true },
  'welcome-kit': { icon: 'card_giftcard', whatsapp: true },
  'gift-hamper': { icon: 'card_giftcard', whatsapp: true },

  // Awards & Trophies
  'awards': { icon: 'military_tech', whatsapp: true },
  'trophy': { icon: 'emoji_events', whatsapp: true },
  'acrylic-trophy': { icon: 'emoji_events', whatsapp: true },
  'crystal-trophy': { icon: 'diamond', whatsapp: true },
  'wooden-trophy': { icon: 'emoji_events', whatsapp: true },
  'medal': { icon: 'military_tech', whatsapp: true },
  'plaque': { icon: 'military_tech', whatsapp: true },
  'award': { icon: 'military_tech', whatsapp: true },

  // Personalized Gifts
  'personalized-gifts': { icon: 'redeem' },
  'photo-frames': { icon: 'photo_frame' },
  'cushions': { icon: 'airline_seat_individual_suite' },
  'wall-clocks': { icon: 'schedule' },
  'keychains': { icon: 'vpn_key', popular: true },
  'magnet': { icon: 'attractions' },
  'rings': { icon: 'diamond' },
  'personalized-gift': { icon: 'redeem' },

  // Electronic Gifts
  'electronic-gifts': { icon: 'devices' },
  'power-bank': { icon: 'battery_charging_full' },
  'bluetooth-speaker': { icon: 'speaker' },
  'earbuds': { icon: 'headphones' },
  'usb-drive': { icon: 'usb' },
  'wireless-charger': { icon: 'charging_station' },
  'charging-cable': { icon: 'cable' },
  'mobile-stand': { icon: 'smartphone' },

  // Promotional & Display
  'promotional': { icon: 'campaign', whatsapp: true },
  'flex-banner': { icon: 'campaign', whatsapp: true },
  'standee': { icon: 'campaign', whatsapp: true },
  'roll-up-standee': { icon: 'campaign', whatsapp: true },
  'canopy': { icon: 'campaign', whatsapp: true },
  'poster': { icon: 'campaign', whatsapp: true },
  'backdrop': { icon: 'campaign', whatsapp: true },
  'table-display': { icon: 'campaign', whatsapp: true },

  // Packaging
  'packaging': { icon: 'inventory_2', whatsapp: true },
  'gift-box': { icon: 'inventory_2', whatsapp: true },
  'corporate-gift-box': { icon: 'inventory_2', whatsapp: true },
  'paper-bag-pkg': { icon: 'shopping_bag', whatsapp: true },
  'gift-bag': { icon: 'shopping_bag', whatsapp: true },
  'packaging-sticker': { icon: 'label', whatsapp: true },
  'hang-tag': { icon: 'sell', whatsapp: true },
  'thank-you-card': { icon: 'favorite', whatsapp: true },

  // Sports & Fitness
  'sports': { icon: 'sports' },
  'sports-jersey': { icon: 'sports' },
  'sports-tshirt': { icon: 'sports' },
  'gym-tshirt': { icon: 'fitness_center' },
  'gym-bag': { icon: 'backpack' },
  'sports-cap': { icon: 'sports_baseball' },
  'sports-bottle': { icon: 'water_bottle' },
  'yoga-mat': { icon: 'self_improvement' },
  'gym-towel': { icon: 'dry' },

  // Aprons & Uniforms
  'aprons': { icon: 'soup_kitchen' },
  'apron': { icon: 'soup_kitchen' },
  'chef-apron': { icon: 'soup_kitchen' },
  'corporate-uniform': { icon: 'apparel', whatsapp: true },
  'staff-uniform': { icon: 'apparel', whatsapp: true },
  'school-uniform': { icon: 'school', whatsapp: true },
  'workwear': { icon: 'engineering', whatsapp: true },

  // Phone Cases
  'phone-cases': { icon: 'smartphone', popular: true },
};

// WhatsApp number for contact flows
export const WHATSAPP_NUMBER = '917011049502';

// Check if a subcategory requires WhatsApp contact for customization
export const isWhatsAppOnly = (slug) => {
  return SUBCATEGORY_META[slug]?.whatsapp === true;
};

// Get WhatsApp URL for a specific product/category
export const getWhatsAppUrl = (productName, slug) => {
  const message = productName
    ? `Hi! I'm interested in customizing "${productName}" (${DEFAULT_SUBCAT_NAMES[slug] || slug}). Can you help me?`
    : `Hi! I'm interested in ${DEFAULT_SUBCAT_NAMES[slug] || slug}. Can you help me with customization?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};
