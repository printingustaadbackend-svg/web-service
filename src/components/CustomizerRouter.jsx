import React from 'react';
import FabricCustomizer from './FabricCustomizer';


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

    // All product types now use the unified Fabric.js customizer
    return (
        <FabricCustomizer
            product={product}
            config={config}
            selectedVariant={selectedVariant}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            quantity={quantity}
            effectivePrice={effectivePrice}
            onClose={onClose}
            onAddToCart={onAddToCart}
        />
    );
};

export default CustomizerRouter;