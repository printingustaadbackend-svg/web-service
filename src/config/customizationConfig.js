/**
 * Customization configuration
 *
 * This file controls which customizer is available
 * for each product/category.
 *
 * Print area coordinates are defined for a 900×900 canvas.
 * They are also expressed as 0-1 fractions so they scale to any resolution.
 *
 * Types:
 *  - 'clothing' → shows size selector (S/M/L/XL/XXL/XXXL) in customizer
 *  - 'mug', 'bottle', 'phone-case', etc → product-specific customizer
 *  - 'whatsapp' → no customizer, shows WhatsApp contact button
 */

// Default clothing sizes available in customizer
export const CLOTHING_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export const CUSTOMIZATION_CONFIG = {
    // ─── T-SHIRTS ──────────────────────────────────────────────────────
    't-shirts': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize T-Shirt',
        templateImage: '/templates/blank_tshirt.png',
        templateBackImage: '/templates/blank_tshirt.png',
        printArea: { x: 0.30, y: 0.22, width: 0.40, height: 0.46 },
        backPrintArea: { x: 0.30, y: 0.18, width: 0.40, height: 0.50 },
    },
    'round-neck-tshirt': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize T-Shirt',
        templateImage: '/templates/blank_tshirt.png',
        templateBackImage: '/templates/blank_tshirt.png',
        printArea: { x: 0.30, y: 0.22, width: 0.40, height: 0.46 },
        backPrintArea: { x: 0.30, y: 0.18, width: 0.40, height: 0.50 },
    },
    'polo-tshirt': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Polo',
        templateImage: '/templates/blank_polo.jpg',
        templateBackImage: '/templates/blank_polo.jpg',
        printArea: { x: 0.30, y: 0.25, width: 0.40, height: 0.44 },
        backPrintArea: { x: 0.30, y: 0.20, width: 0.40, height: 0.48 },
    },
    'dry-fit-tshirt': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Dry Fit',
        templateImage: '/templates/blank_tshirt.png',
        templateBackImage: '/templates/blank_tshirt.png',
        printArea: { x: 0.30, y: 0.22, width: 0.40, height: 0.46 },
        backPrintArea: { x: 0.30, y: 0.18, width: 0.40, height: 0.50 },
    },
    'oversized-tshirt': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Oversized T-Shirt',
        templateImage: '/templates/blank_tshirt.png',
        templateBackImage: '/templates/blank_tshirt.png',
        printArea: { x: 0.28, y: 0.20, width: 0.44, height: 0.48 },
        backPrintArea: { x: 0.28, y: 0.16, width: 0.44, height: 0.52 },
    },
    'full-sleeve-tshirt': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Full Sleeve',
        templateImage: '/templates/blank_tshirt.png',
        templateBackImage: '/templates/blank_tshirt.png',
        printArea: { x: 0.30, y: 0.22, width: 0.40, height: 0.46 },
        backPrintArea: { x: 0.30, y: 0.18, width: 0.40, height: 0.50 },
    },
    'sports-tshirt': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Sports T-Shirt',
        templateImage: '/templates/blank_tshirt.png',
        templateBackImage: '/templates/blank_tshirt.png',
        printArea: { x: 0.30, y: 0.22, width: 0.40, height: 0.46 },
        backPrintArea: { x: 0.30, y: 0.18, width: 0.40, height: 0.50 },
    },
    'kids-tshirt': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Kids T-Shirt',
        templateImage: '/templates/blank_tshirt.png',
        templateBackImage: '/templates/blank_tshirt.png',
        printArea: { x: 0.30, y: 0.22, width: 0.40, height: 0.46 },
        backPrintArea: { x: 0.30, y: 0.18, width: 0.40, height: 0.50 },
    },
    'branded-tshirt': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize T-Shirt',
        templateImage: '/templates/blank_tshirt.png',
        templateBackImage: '/templates/blank_tshirt.png',
        printArea: { x: 0.30, y: 0.22, width: 0.40, height: 0.46 },
        backPrintArea: { x: 0.30, y: 0.18, width: 0.40, height: 0.50 },
    },
    // Embroidery T-Shirt: WhatsApp only + direct purchase
    'embroidery-tshirt': {
        enabled: false,
        whatsappOnly: true,
        label: 'Contact on WhatsApp for Embroidery',
        directPurchase: true,
    },

    // ─── HOODIES & SWEATSHIRTS ─────────────────────────────────────────
    'hoodies': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Hoodie',
        templateImage: '/templates/blank_hoodie.jpg',
        templateBackImage: '/templates/blank_hoodie.jpg',
        printArea: { x: 0.30, y: 0.25, width: 0.40, height: 0.42 },
        backPrintArea: { x: 0.30, y: 0.20, width: 0.40, height: 0.48 },
    },
    'hoodie': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Hoodie',
        templateImage: '/templates/blank_hoodie.jpg',
        templateBackImage: '/templates/blank_hoodie.jpg',
        printArea: { x: 0.30, y: 0.25, width: 0.40, height: 0.42 },
        backPrintArea: { x: 0.30, y: 0.20, width: 0.40, height: 0.48 },
    },
    'zipper-hoodie': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Zipper Hoodie',
        templateImage: '/templates/blank_hoodie.jpg',
        templateBackImage: '/templates/blank_hoodie.jpg',
        printArea: { x: 0.30, y: 0.25, width: 0.40, height: 0.42 },
        backPrintArea: { x: 0.30, y: 0.20, width: 0.40, height: 0.48 },
    },
    'sweatshirt': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Sweatshirt',
        templateImage: '/templates/blank_hoodie.jpg',
        templateBackImage: '/templates/blank_hoodie.jpg',
        printArea: { x: 0.30, y: 0.22, width: 0.40, height: 0.46 },
        backPrintArea: { x: 0.30, y: 0.18, width: 0.40, height: 0.50 },
    },
    'oversized-sweatshirt': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Oversized Sweatshirt',
        templateImage: '/templates/blank_hoodie.jpg',
        templateBackImage: '/templates/blank_hoodie.jpg',
        printArea: { x: 0.28, y: 0.20, width: 0.44, height: 0.48 },
        backPrintArea: { x: 0.28, y: 0.16, width: 0.44, height: 0.52 },
    },

    // ─── POLO (legacy slug) ─────────────────────────────────────────────
    'polo-shirts': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Polo',
        templateImage: '/templates/blank_polo.jpg',
        templateBackImage: '/templates/blank_polo.jpg',
        printArea: { x: 0.30, y: 0.25, width: 0.40, height: 0.44 },
        backPrintArea: { x: 0.30, y: 0.20, width: 0.40, height: 0.48 },
    },

    // ─── CAPS & HEADWEAR ───────────────────────────────────────────────
    'caps': {
        enabled: true,
        type: 'cap',
        sides: ['front'],
        label: 'Customize Cap',
        templateImage: '/templates/blank_cap.jpg',
        printArea: { x: 0.25, y: 0.15, width: 0.50, height: 0.45 },
    },
    'cap': {
        enabled: true,
        type: 'cap',
        sides: ['front'],
        label: 'Customize Cap',
        templateImage: '/templates/blank_cap.jpg',
        printArea: { x: 0.25, y: 0.15, width: 0.50, height: 0.45 },
    },
    'hat': {
        enabled: true,
        type: 'cap',
        sides: ['front'],
        label: 'Customize Hat',
        templateImage: '/templates/blank_cap.jpg',
        printArea: { x: 0.25, y: 0.15, width: 0.50, height: 0.45 },
    },
    'bucket-hat': {
        enabled: true,
        type: 'cap',
        sides: ['front'],
        label: 'Customize Bucket Hat',
        templateImage: '/templates/blank_cap.jpg',
        printArea: { x: 0.25, y: 0.15, width: 0.50, height: 0.45 },
    },
    'embroidery-cap': {
        enabled: false,
        whatsappOnly: true,
        label: 'Contact on WhatsApp for Embroidery',
        directPurchase: true,
    },

    // ─── MUGS ──────────────────────────────────────────────────────────
    'mugs': {
        enabled: true,
        type: 'mug',
        sides: ['front', 'back'],
        label: 'Customize Mug',
        templateImage: '/templates/blank_mug.png',
        printArea: { x: 0.25, y: 0.25, width: 0.50, height: 0.50 },
    },

    // ─── BOTTLES & DRINKWARE ───────────────────────────────────────────
    'bottles': {
        enabled: true,
        type: 'bottle',
        sides: ['front'],
        label: 'Customize Bottle',
        templateImage: '/templates/blank_bottle.png',
        printArea: { x: 0.25, y: 0.20, width: 0.50, height: 0.55 },
    },
    'water-bottle': {
        enabled: true,
        type: 'bottle',
        sides: ['front'],
        label: 'Customize Bottle',
        templateImage: '/templates/blank_bottle.png',
        printArea: { x: 0.25, y: 0.20, width: 0.50, height: 0.55 },
    },
    'stainless-steel-bottle': {
        enabled: true,
        type: 'bottle',
        sides: ['front'],
        label: 'Customize Bottle',
        templateImage: '/templates/blank_bottle.png',
        printArea: { x: 0.25, y: 0.20, width: 0.50, height: 0.55 },
    },
    'vacuum-bottle': {
        enabled: true,
        type: 'bottle',
        sides: ['front'],
        label: 'Customize Bottle',
        templateImage: '/templates/blank_bottle.png',
        printArea: { x: 0.25, y: 0.20, width: 0.50, height: 0.55 },
    },
    'copper-bottle': {
        enabled: false,
        whatsappOnly: true,
        label: 'Contact on WhatsApp for Customization',
    },
    'sipper': {
        enabled: true,
        type: 'bottle',
        sides: ['front'],
        label: 'Customize Sipper',
        templateImage: '/templates/blank_bottle.png',
        printArea: { x: 0.25, y: 0.20, width: 0.50, height: 0.55 },
    },
    'tumbler': {
        enabled: true,
        type: 'bottle',
        sides: ['front'],
        label: 'Customize Tumbler',
        templateImage: '/templates/blank_bottle.png',
        printArea: { x: 0.25, y: 0.20, width: 0.50, height: 0.55 },
    },
    'travel-mug': {
        enabled: true,
        type: 'mug',
        sides: ['front'],
        label: 'Customize Travel Mug',
        templateImage: '/templates/blank_mug.png',
        printArea: { x: 0.25, y: 0.25, width: 0.50, height: 0.50 },
    },
    'flask': {
        enabled: true,
        type: 'bottle',
        sides: ['front'],
        label: 'Customize Flask',
        templateImage: '/templates/blank_bottle.png',
        printArea: { x: 0.25, y: 0.20, width: 0.50, height: 0.55 },
    },

    // ─── PHONE CASES ───────────────────────────────────────────────────
    'phone-cases': {
        enabled: true,
        type: 'phone-case',
        sides: ['front'],
        label: 'Customize Case',
        templateImage: '/templates/blank_tshirt.png', // will use product image as fallback
        printArea: { x: 0.15, y: 0.10, width: 0.70, height: 0.80 },
    },

    // ─── OFFICE & STATIONERY ───────────────────────────────────────────
    'diary': {
        enabled: true,
        type: 'diary',
        sides: ['front'],
        label: 'Customize Diary',
        templateImage: '/templates/blank_notebook.png',
        printArea: { x: 0.20, y: 0.15, width: 0.60, height: 0.70 },
    },
    'diaries': {
        enabled: true,
        type: 'diary',
        sides: ['front'],
        label: 'Customize Diary',
        templateImage: '/templates/blank_notebook.png',
        printArea: { x: 0.20, y: 0.15, width: 0.60, height: 0.70 },
    },
    'notebook': {
        enabled: true,
        type: 'diary',
        sides: ['front'],
        label: 'Customize Notebook',
        templateImage: '/templates/blank_notebook.png',
        printArea: { x: 0.20, y: 0.15, width: 0.60, height: 0.70 },
    },
    'mouse-pad': {
        enabled: true,
        type: 'mousepad',
        sides: ['front'],
        label: 'Customize Mouse Pad',
        templateImage: null,
        printArea: { x: 0.05, y: 0.10, width: 0.90, height: 0.80 },
    },
    'mousepads': {
        enabled: true,
        type: 'mousepad',
        sides: ['front'],
        label: 'Customize Mousepad',
        templateImage: null,
        printArea: { x: 0.05, y: 0.10, width: 0.90, height: 0.80 },
    },

    // ─── PRINTED STATIONERY ────────────────────────────────────────────
    'visiting-cards': {
        enabled: true,
        type: 'card',
        sides: ['front', 'back'],
        label: 'Design Card',
        templateImage: '/templates/blank_visitingcard.png',
        printArea: { x: 0.05, y: 0.10, width: 0.90, height: 0.80 },
    },
    'envelope': {
        enabled: true,
        type: 'card',
        sides: ['front'],
        label: 'Design Envelope',
        templateImage: null,
        printArea: { x: 0.05, y: 0.10, width: 0.90, height: 0.80 },
    },
    'brochure': {
        enabled: true,
        type: 'card',
        sides: ['front', 'back'],
        label: 'Design Brochure',
        templateImage: null,
        printArea: { x: 0.05, y: 0.05, width: 0.90, height: 0.90 },
    },
    'sticker': {
        enabled: true,
        type: 'sticker',
        sides: ['front'],
        label: 'Design Sticker',
        templateImage: null,
        printArea: { x: 0.10, y: 0.10, width: 0.80, height: 0.80 },
    },
    // WhatsApp-only stationery
    'letterhead': {
        enabled: false,
        whatsappOnly: true,
        label: 'Contact on WhatsApp',
    },
    'flyer': {
        enabled: false,
        whatsappOnly: true,
        label: 'Contact on WhatsApp',
    },
    'calendars': {
        enabled: false,
        whatsappOnly: true,
        label: 'Contact on WhatsApp for Calendars',
    },

    // ─── PERSONALIZED GIFTS ────────────────────────────────────────────
    'photo-frames': {
        enabled: true,
        type: 'frame',
        sides: ['front'],
        label: 'Customize Frame',
        templateImage: '/templates/blank_photoframe.png',
        printArea: { x: 0.15, y: 0.15, width: 0.70, height: 0.70 },
    },
    'cushions': {
        enabled: true,
        type: 'cushion',
        sides: ['front', 'back'],
        label: 'Customize Cushion',
        templateImage: null,
        printArea: { x: 0.15, y: 0.15, width: 0.70, height: 0.70 },
    },
    'wall-clocks': {
        enabled: true,
        type: 'clock',
        sides: ['front'],
        label: 'Customize Clock',
        templateImage: null,
        printArea: { x: 0.10, y: 0.10, width: 0.80, height: 0.80 },
    },
    'keychains': {
        enabled: true,
        type: 'keychain',
        sides: ['front'],
        label: 'Customize Keychain',
        templateImage: null,
        printArea: { x: 0.30, y: 0.30, width: 0.40, height: 0.40 },
    },

    // ─── BAGS ──────────────────────────────────────────────────────────
    'tote-bag': {
        enabled: true,
        type: 'tote-bag',
        sides: ['front', 'back'],
        label: 'Customize Bag',
        templateImage: null,
        printArea: { x: 0.20, y: 0.15, width: 0.60, height: 0.60 },
    },
    'tote-bags': {
        enabled: true,
        type: 'tote-bag',
        sides: ['front', 'back'],
        label: 'Customize Bag',
        templateImage: null,
        printArea: { x: 0.20, y: 0.15, width: 0.60, height: 0.60 },
    },
    'jute-bag': {
        enabled: true,
        type: 'tote-bag',
        sides: ['front'],
        label: 'Customize Jute Bag',
        templateImage: null,
        printArea: { x: 0.20, y: 0.15, width: 0.60, height: 0.60 },
    },

    // ─── APRONS ────────────────────────────────────────────────────────
    'aprons': {
        enabled: true,
        type: 'apron',
        sides: ['front'],
        label: 'Customize Apron',
        templateImage: null,
        printArea: { x: 0.25, y: 0.15, width: 0.50, height: 0.55 },
    },
    'apron': {
        enabled: true,
        type: 'apron',
        sides: ['front'],
        label: 'Customize Apron',
        templateImage: null,
        printArea: { x: 0.25, y: 0.15, width: 0.50, height: 0.55 },
    },

    // ─── SPORTS ────────────────────────────────────────────────────────
    'sports-jersey': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Jersey',
        templateImage: '/templates/blank_tshirt.png',
        templateBackImage: '/templates/blank_tshirt.png',
        printArea: { x: 0.28, y: 0.20, width: 0.44, height: 0.48 },
        backPrintArea: { x: 0.28, y: 0.16, width: 0.44, height: 0.52 },
    },
    'sports-tshirt': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Sports T-Shirt',
        templateImage: '/templates/blank_tshirt.png',
        templateBackImage: '/templates/blank_tshirt.png',
        printArea: { x: 0.30, y: 0.22, width: 0.40, height: 0.46 },
        backPrintArea: { x: 0.30, y: 0.18, width: 0.40, height: 0.50 },
    },
    'gym-tshirt': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Gym T-Shirt',
        templateImage: '/templates/blank_tshirt.png',
        templateBackImage: '/templates/blank_tshirt.png',
        printArea: { x: 0.30, y: 0.22, width: 0.40, height: 0.46 },
        backPrintArea: { x: 0.30, y: 0.18, width: 0.40, height: 0.50 },
    },

    // ─── LEGACY / FALLBACK SLUGS ───────────────────────────────────────
    'rings': {
        enabled: false,
        whatsappOnly: false,
        label: 'Ring',
    },
    'coasters': {
        enabled: true,
        type: 'coaster',
        sides: ['front'],
        label: 'Customize Coaster',
        templateImage: null,
        printArea: { x: 0.10, y: 0.10, width: 0.80, height: 0.80 },
    },
    'badges': {
        enabled: true,
        type: 'badge',
        sides: ['front'],
        label: 'Customize Badge',
        templateImage: null,
        printArea: { x: 0.15, y: 0.15, width: 0.70, height: 0.70 },
    },
    'laptop-sleeves': {
        enabled: true,
        type: 'laptop-sleeve',
        sides: ['front'],
        label: 'Customize Sleeve',
        templateImage: null,
        printArea: { x: 0.10, y: 0.15, width: 0.80, height: 0.70 },
    },
};

export const getCustomizationConfig = (categorySlug) => {
    if (!categorySlug) {
        return null;
    }

    return CUSTOMIZATION_CONFIG[categorySlug] || null;
};

export const isCustomizable = (categorySlug) => {
    const config = getCustomizationConfig(categorySlug);

    return Boolean(config?.enabled);
};

export const isWhatsAppCustomization = (categorySlug) => {
    const config = getCustomizationConfig(categorySlug);
    return Boolean(config?.whatsappOnly);
};