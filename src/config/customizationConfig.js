/**
 * Customization configuration
 *
 * This file controls which customizer is available
 * for each product/category.
 *
 * Print area coordinates are defined for a 900×900 canvas.
 * They are also expressed as 0-1 fractions so they scale to any resolution.
 */

export const CUSTOMIZATION_CONFIG = {
    't-shirts': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize T-Shirt',
        templateImage: '/templates/blank_tshirt.png',
        printArea: {
            x: 0.30,
            y: 0.22,
            width: 0.40,
            height: 0.46,
        },
    },

    'hoodies': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Hoodie',
        templateImage: '/templates/blank_tshirt_black.png',
        printArea: {
            x: 0.30,
            y: 0.25,
            width: 0.40,
            height: 0.42,
        },
    },

    'polo-shirts': {
        enabled: true,
        type: 'clothing',
        sides: ['front', 'back'],
        label: 'Customize Polo',
        templateImage: null,
        printArea: {
            x: 0.30,
            y: 0.22,
            width: 0.40,
            height: 0.46,
        },
    },

    'caps': {
        enabled: true,
        type: 'cap',
        sides: ['front'],
        label: 'Customize Cap',
        templateImage: null,
        printArea: {
            x: 0.25,
            y: 0.20,
            width: 0.50,
            height: 0.40,
        },
    },

    'mugs': {
        enabled: true,
        type: 'mug',
        sides: ['front', 'back'],
        label: 'Customize Mug',
        templateImage: '/templates/blank_mug.png',
        printArea: {
            x: 0.25,
            y: 0.25,
            width: 0.50,
            height: 0.50,
        },
    },

    'phone-cases': {
        enabled: true,
        type: 'phone-case',
        sides: ['front'],
        label: 'Customize Case',
        templateImage: null,
        printArea: {
            x: 0.15,
            y: 0.10,
            width: 0.70,
            height: 0.80,
        },
    },

    'tote-bags': {
        enabled: true,
        type: 'tote-bag',
        sides: ['front', 'back'],
        label: 'Customize Bag',
        templateImage: null,
        printArea: {
            x: 0.20,
            y: 0.15,
            width: 0.60,
            height: 0.60,
        },
    },

    'keychains': {
        enabled: true,
        type: 'keychain',
        sides: ['front'],
        label: 'Customize Keychain',
        templateImage: null,
        printArea: {
            x: 0.30,
            y: 0.30,
            width: 0.40,
            height: 0.40,
        },
    },

    'diaries': {
        enabled: true,
        type: 'diary',
        sides: ['front'],
        label: 'Customize Diary',
        templateImage: '/templates/blank_notebook.png',
        printArea: {
            x: 0.20,
            y: 0.15,
            width: 0.60,
            height: 0.70,
        },
    },

    'rings': {
        enabled: true,
        type: 'ring',
        sides: ['front'],
        label: 'Customize Ring',
        templateImage: null,
        printArea: {
            x: 0.25,
            y: 0.25,
            width: 0.50,
            height: 0.50,
        },
    },

    'mousepads': {
        enabled: true,
        type: 'mousepad',
        sides: ['front'],
        label: 'Customize Mousepad',
        templateImage: null,
        printArea: {
            x: 0.05,
            y: 0.10,
            width: 0.90,
            height: 0.80,
        },
    },

    'cushions': {
        enabled: true,
        type: 'cushion',
        sides: ['front', 'back'],
        label: 'Customize Cushion',
        templateImage: null,
        printArea: {
            x: 0.15,
            y: 0.15,
            width: 0.70,
            height: 0.70,
        },
    },

    'wall-clocks': {
        enabled: true,
        type: 'clock',
        sides: ['front'],
        label: 'Customize Clock',
        templateImage: null,
        printArea: {
            x: 0.10,
            y: 0.10,
            width: 0.80,
            height: 0.80,
        },
    },

    'coasters': {
        enabled: true,
        type: 'coaster',
        sides: ['front'],
        label: 'Customize Coaster',
        templateImage: null,
        printArea: {
            x: 0.10,
            y: 0.10,
            width: 0.80,
            height: 0.80,
        },
    },

    'aprons': {
        enabled: true,
        type: 'apron',
        sides: ['front'],
        label: 'Customize Apron',
        templateImage: null,
        printArea: {
            x: 0.25,
            y: 0.15,
            width: 0.50,
            height: 0.55,
        },
    },

    'laptop-sleeves': {
        enabled: true,
        type: 'laptop-sleeve',
        sides: ['front'],
        label: 'Customize Sleeve',
        templateImage: null,
        printArea: {
            x: 0.10,
            y: 0.15,
            width: 0.80,
            height: 0.70,
        },
    },

    'calendars': {
        enabled: true,
        type: 'calendar',
        sides: ['front'],
        label: 'Customize Calendar',
        templateImage: null,
        printArea: {
            x: 0.10,
            y: 0.05,
            width: 0.80,
            height: 0.90,
        },
    },

    'visiting-cards': {
        enabled: true,
        type: 'card',
        sides: ['front', 'back'],
        label: 'Design Card',
        templateImage: null,
        printArea: {
            x: 0.05,
            y: 0.10,
            width: 0.90,
            height: 0.80,
        },
    },

    'photo-frames': {
        enabled: true,
        type: 'frame',
        sides: ['front'],
        label: 'Customize Frame',
        templateImage: null,
        printArea: {
            x: 0.15,
            y: 0.15,
            width: 0.70,
            height: 0.70,
        },
    },

    'badges': {
        enabled: true,
        type: 'badge',
        sides: ['front'],
        label: 'Customize Badge',
        templateImage: null,
        printArea: {
            x: 0.15,
            y: 0.15,
            width: 0.70,
            height: 0.70,
        },
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