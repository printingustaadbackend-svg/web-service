import React from 'react';
import ClothingCustomizer from './ClothingCustomizer';
import CustomizationModal from './CustomizationModal';
import MugCustomizer from './MugCustomizer';


const CustomizerRouter = ({
    config,
    product,
    selectedVariant,
    selectedColor,
    selectedSize,
    quantity,
    effectivePrice,
    onClose,
    onAddToCart,
}) => {
    if (!config?.enabled) {
        return null;
    }

    switch (config.type) {
        case 'clothing':
            return (
                <ClothingCustomizer
                    product={product}
                    selectedVariant={selectedVariant}
                    selectedColor={selectedColor}
                    selectedSize={selectedSize}
                    quantity={quantity}
                    effectivePrice={effectivePrice}
                    onClose={onClose}
                    onAddToCart={onAddToCart}
                />
            );

        case 'mug':
            return (
                <MugCustomizer
                    product={product}
                    selectedVariant={selectedVariant}
                    selectedColor={selectedColor}
                    selectedSize={selectedSize}
                    quantity={quantity}
                    effectivePrice={effectivePrice}
                    onClose={onClose}
                    onAddToCart={onAddToCart}
                />
            );

        case 'keychain':
            return (
                <CustomizationModal
                    product={product}
                    selectedVariant={selectedVariant}
                    selectedColor={selectedColor}
                    selectedSize={selectedSize}
                    quantity={quantity}
                    effectivePrice={effectivePrice}
                    onClose={onClose}
                    onAddToCart={onAddToCart}
                />
            );

        case 'diary':
            return (
                <CustomizationModal
                    product={product}
                    selectedVariant={selectedVariant}
                    selectedColor={selectedColor}
                    selectedSize={selectedSize}
                    quantity={quantity}
                    effectivePrice={effectivePrice}
                    onClose={onClose}
                    onAddToCart={onAddToCart}
                />
            );

        default:
            return null;
    }
};

export default CustomizerRouter;