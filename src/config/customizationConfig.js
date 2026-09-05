/**
 * Customization configuration
 *
 * This file controls which customizer is available
 * for each product/category.
 */

export const CUSTOMIZATION_CONFIG = {
    't-shirts': {
        enabled: true,
        type: 'clothing',
        sides: ['front'],
        label: 'Customize T-Shirt',
    },

    'mugs': {
        enabled: true,
        type: 'mug',
        sides: ['front', 'back'],
        label: 'Customize Mug',
    },

    'keychains': {
        enabled: true,
        type: 'keychain',
        sides: ['front'],
        label: 'Customize Keychain',
    },

    'diaries': {
        enabled: true,
        type: 'diary',
        sides: ['front'],
        label: 'Customize Diary',
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