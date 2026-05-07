import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';
import CustomizationModal from '../components/CustomizationModal';

const DEFAULT_IMAGE = "https://lh3.googleusercontent.com/aida-public/AB6AXuBxndXr1Tiq44IXDTrYXlCcx85etOMoB5xfTz0Sl91WBBQ6zf4TwGdOy2vsFGJDHLgAW-9NEmOft__ckYYCAHkW9E2sUJMjA-hSqkU2segQjKbilRJsywoapqKX97dFSp6gY17el2VKeOHpHRpJJIof8qXoqY4lmLuH9RbKDTJ_i6_8Y_qOpwISakMZ-vVPSOWVCQ6seGWJCMv95-MEIKbjZwcGaeCHJkDuS4vHUaYPoHRQW8rYoYQiVdMR5xu_OqXOWPaDRrInIeE";

const Product = () => {
    const { id } = useParams();
    const { addItem } = useCart();

    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState(DEFAULT_IMAGE);
    const [btnState, setBtnState] = useState('default');
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [relatedLoading, setRelatedLoading] = useState(true);
    const navigate = useNavigate();
    const [showCustomizer, setShowCustomizer] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                if (!supabase) throw new Error("Supabase not initialized");

                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

                if (isUUID) {
                    const [productRes, variantRes] = await Promise.all([
                        supabase.from('products').select('*, categories(name)').eq('id', id).single(),
                        supabase.from('product_variants').select('*').eq('product_id', id).order('created_at', { ascending: true })
                    ]);

                        if (productRes.data && !productRes.error) {
                        const p = productRes.data;
                        const productImg = p.base_image_url || DEFAULT_IMAGE;
                        setProduct({
                            id: p.id,
                            name: p.name,
                            base_price: Number(p.base_price) || 0,
                            desc: p.description || 'Premium quality custom printing product.',
                            category: p.categories?.name || 'Products',
                            img: productImg,
                            minQty: p.min_order_quantity || 1,
                            gallery_images: Array.isArray(p.gallery_images) ? p.gallery_images : []
                        });
                        setMainImage(productImg);
                    }

                    if (variantRes.data && !variantRes.error && variantRes.data.length > 0) {
                        setVariants(variantRes.data);
                        const first = variantRes.data[0];
                        setSelectedVariant(first);
                        setSelectedColor(first.color || null);
                        setSelectedSize(first.size || null);
                        if (first.image_url) setMainImage(first.image_url);
                    }
                    return;
                }
                navigate('/shop', { replace: true });
            } catch (err) {
                console.error("Product fetch error:", err);
                setProduct({ id: id || 'item', name: 'Premium Studio Item', base_price: 399, desc: 'Custom premium printing product.', category: 'Apparel', img: DEFAULT_IMAGE, minQty: 1 });
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    useEffect(() => {
        const fetchRelated = async () => {
            try {
                if (!supabase) return;
                setRelatedLoading(true);
                const { data, error } = await supabase
                    .from('products')
                    .select('id, name, base_price, base_image_url')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(8);
                if (error) throw error;
                const filtered = (data || []).filter(p => p.id !== id).slice(0, 4);
                setRelatedProducts(filtered);
            } catch (err) {
                console.error('Related products fetch error:', err.message);
                setRelatedProducts([]);
            } finally {
                setRelatedLoading(false);
            }
        };
        fetchRelated();
    }, [id]);

    const uniqueColors = [...new Set(variants.map(v => v.color).filter(Boolean))];
    const uniqueSizes  = [...new Set(variants.map(v => v.size).filter(Boolean))];

    const handleColorSelect = (color) => {
        setSelectedColor(color);
        const match = variants.find(v => v.color === color && v.size === selectedSize) || variants.find(v => v.color === color);
        if (match) { setSelectedVariant(match); setSelectedSize(match.size || null); if (match.image_url) setMainImage(match.image_url); }
    };

    const handleSizeSelect = (size) => {
        setSelectedSize(size);
        const match = variants.find(v => v.size === size && v.color === selectedColor) || variants.find(v => v.size === size);
        if (match) setSelectedVariant(match);
    };

    const effectivePrice = product ? (product.base_price || 0) + (selectedVariant ? Number(selectedVariant.price_adjustment) || 0 : 0) : 0;
    const stockQty = selectedVariant?.stock_quantity ?? null;
    const isLowStock = stockQty !== null && stockQty > 0 && stockQty <= (selectedVariant?.low_stock_threshold ?? 10);
    const isOutOfStock = stockQty !== null && stockQty === 0;

    const handleAddToCart = (customizations = {}) => {
        if (isOutOfStock) return;
        const hasCustom = !!customizations.hasCustomDesign || !!customizations.previewUrl || !!customizations.uploadedImageUrl;
        addItem({
            id: product.id,
            variantId: selectedVariant?.id || null,
            name: product.name,
            price: effectivePrice,
            quantity,
            image: customizations.previewUrl || mainImage,
            customDesignUrl: customizations.uploadedImageUrl || customizations.previewUrl || null,
            attributes: {
                ...(selectedColor ? { color: selectedColor } : {}),
                ...(selectedSize ? { size: selectedSize } : {}),
                ...(hasCustom ? { customDesign: '🎨 Custom' } : {}),
                ...(hasCustom && customizations.customDesignId ? { customDesignId: customizations.customDesignId } : {})
            },
            customizations
        });
        setBtnState('added');
        setTimeout(() => setBtnState('default'), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#f7f5ff] via-white to-[#ede9fe] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Loading product...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f7f5ff] via-white to-[#ede9fe] pt-10 pb-24">
            {showCustomizer && product && (
                <CustomizationModal
                    product={product} selectedVariant={selectedVariant} selectedColor={selectedColor}
                    selectedSize={selectedSize} quantity={quantity} effectivePrice={effectivePrice}
                    onClose={() => setShowCustomizer(false)}
                    onAddToCart={(customizationData) => { handleAddToCart(customizationData); setBtnState('added'); setTimeout(() => setBtnState('default'), 2000); }}
                />
            )}
            <div className="max-w-[1440px] mx-auto px-6 md:px-12">
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
                    {/* Left: Gallery */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-white shadow-2xl shadow-purple-100/60 relative group border border-purple-100">
                            <img src={mainImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Product" />
                            <div className="absolute top-4 right-4">
                                <span className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border border-purple-100 text-purple-700 shadow">240 GSM</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                product?.img,
                                ...(product?.gallery_images || [])
                            ].filter(Boolean).map((img, idx) => (
                                <div key={idx} onClick={() => setMainImage(img)}
                                    className={`aspect-square rounded-2xl overflow-hidden bg-white cursor-pointer transition-all border-2 ${mainImage === img ? 'border-purple-500 shadow-lg shadow-purple-100' : 'border-transparent opacity-70 hover:opacity-100 hover:border-purple-200'}`}>
                                    <img src={img} className="w-full h-full object-cover" alt="Product view" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Product Info */}
                    <div className="lg:col-span-5 flex flex-col">
                        <nav className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-6 font-semibold">
                            <span>Products</span>
                            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                            <span>{product?.category || 'Apparel'}</span>
                            <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                            <span className="text-purple-600">{product?.name || 'T-Shirts'}</span>
                        </nav>

                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 leading-tight">{product?.name || 'Premium Studio Tee'}</h1>

                        <div className="flex items-center gap-6 mb-3">
                            <span className="text-3xl font-bold text-gray-900">₹{effectivePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            {selectedVariant && Number(selectedVariant.price_adjustment) !== 0 && (
                                <span className="text-xs text-gray-400">(Base ₹{product.base_price.toLocaleString('en-IN')} + ₹{Number(selectedVariant.price_adjustment).toLocaleString('en-IN')} variant)</span>
                            )}
                        </div>
                        {stockQty !== null && (
                            <p className={`text-xs font-bold mb-5 ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-green-600'}`}>
                                {isOutOfStock ? '⊘ Out of Stock' : isLowStock ? `⚠ Only ${stockQty} left` : `✓ In Stock (${stockQty} units)`}
                            </p>
                        )}

                        <div 
                            className="text-gray-500 leading-relaxed mb-8 max-w-md product-description"
                            dangerouslySetInnerHTML={{ __html: product?.desc || 'Sustainably sourced, 240GSM heavy-weight cotton. Precision-engineered for durability.' }}
                        />

                        {/* Color Selection */}
                        {uniqueColors.length > 0 && (
                            <div className="mb-7">
                                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 mb-3">Color: <span className="text-gray-800">{selectedColor || '—'}</span></p>
                                <div className="flex gap-3 flex-wrap">
                                    {uniqueColors.map(color => (
                                        <button key={color} onClick={() => handleColorSelect(color)} title={color}
                                            style={{ backgroundColor: color.toLowerCase() }}
                                            className={`w-9 h-9 rounded-full border-2 transition-all ${selectedColor === color ? 'border-purple-500 ring-2 ring-purple-400 ring-offset-2' : 'border-gray-200 hover:scale-110'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size Selection */}
                        {uniqueSizes.length > 0 && (
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-[11px] uppercase tracking-widest font-bold text-gray-400">Select Size</h3>
                                    <button className="text-[10px] uppercase tracking-wider text-purple-500 font-bold hover:underline">Size Guide</button>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    {uniqueSizes.map(size => (
                                        <button key={size} onClick={() => handleSizeSelect(size)}
                                            className={`py-3 rounded-xl border text-xs font-bold transition-all ${selectedSize === size ? 'border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-200' : 'border-gray-200 text-gray-600 hover:border-purple-400 hover:text-purple-600 bg-white'}`}>
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {uniqueSizes.length === 0 && uniqueColors.length === 0 && (
                            <div className="mb-8">
                                <h3 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3">Select Size</h3>
                                <div className="grid grid-cols-5 gap-2">
                                    {['S','M','L','XL','XXL'].map(size => (
                                        <button key={size} onClick={() => setSelectedSize(size)}
                                            className={`py-3 rounded-xl border text-xs font-bold transition-all ${selectedSize === size ? 'border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-200' : 'border-gray-200 text-gray-600 hover:border-purple-400 bg-white'}`}>
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity + Add to Cart */}
                        <div className="flex gap-4 mb-4">
                            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-2 shadow-sm">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 text-gray-400 hover:text-gray-800 transition-colors">
                                    <span className="material-symbols-outlined">remove</span>
                                </button>
                                <span className="w-10 text-center font-bold text-sm text-gray-900">{quantity}</span>
                                <button onClick={() => setQuantity(q => q + 1)} className="p-2 text-gray-400 hover:text-gray-800 transition-colors">
                                    <span className="material-symbols-outlined">add</span>
                                </button>
                            </div>
                            <button
                                onClick={() => handleAddToCart()}
                                disabled={isOutOfStock}
                                className={`flex-1 py-4 rounded-xl font-extrabold tracking-tight transition-all flex items-center justify-center gap-2 shadow-lg ${
                                    isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' :
                                    btnState === 'added' ? 'bg-green-500 text-white shadow-green-200' :
                                    'bg-gray-900 text-white hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] shadow-gray-300'
                                }`}
                            >
                                {btnState === 'added' ? (<>Added! <span className="material-symbols-outlined text-lg">check_circle</span></>) : (<>Add to Cart <span className="material-symbols-outlined text-lg">shopping_cart</span></>)}
                            </button>
                        </div>

                        {/* Customize CTA */}
                        <button
                            onClick={() => setShowCustomizer(true)}
                            disabled={isOutOfStock}
                            className={`w-full mb-10 py-4 rounded-xl font-extrabold tracking-tight transition-all flex items-center justify-center gap-2 border-2 ${
                                isOutOfStock ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                : 'border-purple-400 text-purple-600 hover:bg-purple-600 hover:text-white hover:border-purple-600 hover:scale-[1.01] active:scale-[0.99] bg-white shadow-sm'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg">brush</span>
                            Customize &amp; Add (Upload Your Design)
                        </button>

                        {/* Specs */}
                        <div className="space-y-5 pt-8 border-t border-gray-100">
                            {[
                                { title: 'Material & Production', desc: '100% Organic combed cotton, 240GSM heavyweight weave. Zero-toxicity sustainable dye process.', icon: 'check_circle' },
                                { title: 'Fit Specs', desc: 'Relaxed silhouette with dropped shoulders and reinforced crewneck collar.', icon: 'straighten' },
                                { title: 'Care Instructions', desc: 'Machine wash cold. Do not tumble dry. Iron inside out to protect custom prints.', icon: 'wash' },
                            ].map((spec, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{spec.title}</span>
                                        <span className="material-symbols-outlined text-purple-400 text-lg">{spec.icon}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">{spec.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {!!relatedProducts.length && (
                    <section className="border-t border-gray-100 pt-16">
                        <div className="flex justify-between items-end mb-10">
                            <div>
                                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">Complete the Collection</h2>
                                <p className="text-gray-400 text-sm">More products you can customize and order.</p>
                            </div>
                            <Link to="/shop">
                                <button className="text-sm font-bold text-purple-600 flex items-center gap-2 hover:gap-3 transition-all">
                                    Shop All <span className="material-symbols-outlined">arrow_right_alt</span>
                                </button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {(relatedLoading ? Array.from({ length: 4 }) : relatedProducts).map((p, idx) => (
                                <Link
                                    key={p?.id || idx}
                                    to={p ? `/product/${p.id}` : '#'}
                                    className="group bg-white rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-purple-100/60 transition-all border border-gray-100"
                                >
                                    <div className="aspect-[3/4] overflow-hidden relative bg-gray-100">
                                        {p ? (
                                            <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={p.base_image_url || DEFAULT_IMAGE} alt={p.name} />
                                        ) : (
                                            <div className="w-full h-full animate-pulse bg-gray-200" />
                                        )}
                                    </div>
                                    {p && (
                                        <div className="p-4">
                                            <h4 className="text-sm font-bold text-gray-800 mb-1">{p.name}</h4>
                                            <span className="text-sm font-bold text-purple-600">₹{Number(p.base_price || 0).toLocaleString('en-IN')}</span>
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default Product;
