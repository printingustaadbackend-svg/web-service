import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('printing_ustad_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [toast, setToast] = useState(null);

    useEffect(() => {
        localStorage.setItem('printing_ustad_cart', JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
    }, [cart]);

    const addItem = (item) => {
        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(i => 
                i.id === item.id &&
                JSON.stringify(i.attributes) === JSON.stringify(item.attributes) &&
                JSON.stringify(i.customizations || null) === JSON.stringify(item.customizations || null)
            );

            if (existingIndex > -1) {
                const newCart = [...prevCart];
                newCart[existingIndex].quantity += item.quantity;
                return newCart;
            } else {
                return [...prevCart, {
                    ...item,
                    uniqueId: Date.now() + Math.random().toString(36).substr(2, 9)
                }];
            }
        });
        showToast(`Added ${item.name} to cart!`);
    };

    const removeItem = (uniqueId) => {
        setCart(prevCart => prevCart.filter(i => i.uniqueId !== uniqueId));
    };

    const updateQuantity = (uniqueId, delta) => {
        setCart(prevCart => prevCart.map(item => {
            if (item.uniqueId === uniqueId) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCart([]);
    };

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ 
            cart, 
            addItem, 
            removeItem, 
            updateQuantity, 
            clearCart,
            cartCount,
            toast 
        }}>
            {children}
            {toast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl transition-all duration-300 transform text-sm flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                    {toast}
                </div>
            )}
        </CartContext.Provider>
    );
};
