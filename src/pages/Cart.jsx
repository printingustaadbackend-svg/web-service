import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

// ─── Input helper ─────────────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
    <div>
        <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-1.5">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);
const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all placeholder:text-gray-300";

// ─── Cart Page ────────────────────────────────────────────────────────────────
const Cart = () => {
    const { cart, updateQuantity, removeItem, clearCart } = useCart();
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [step, setStep] = useState('cart'); // 'cart' | 'address'
    const [serviceability, setServiceability] = useState(null); // null | { serviceable, message }

    // ── Saved addresses ──
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [selectedSavedId, setSelectedSavedId] = useState(null); // null = manual form
    const [showManualForm, setShowManualForm] = useState(false);
    const [saveNewAddress, setSaveNewAddress] = useState(false); // "save this address" checkbox

    // ── Shipping address state ──
    const [addr, setAddr] = useState({
        firstName: profile?.full_name?.split(' ')[0] || '',
        lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
        email: user?.email || '',
        phone: '',
        address: '',
        address2: '',
        city: '',
        state: '',
        pincode: '',
    });
    const setField = (key) => (e) => setAddr(prev => ({ ...prev, [key]: e.target.value }));

    // Fetch saved addresses when entering address step
    useEffect(() => {
        if (step !== 'address' || !user || !supabase) return;
        const fetchSaved = async () => {
            setLoadingSaved(true);
            try {
                const { data, error } = await supabase
                    .from('user_addresses')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('is_default', { ascending: false })
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setSavedAddresses(data || []);
                // Auto-select default address
                const defaultAddr = (data || []).find(a => a.is_default);
                if (defaultAddr) {
                    setSelectedSavedId(defaultAddr.id);
                    applyAddress(defaultAddr);
                    setShowManualForm(false);
                } else if (data && data.length > 0) {
                    setSelectedSavedId(data[0].id);
                    applyAddress(data[0]);
                    setShowManualForm(false);
                } else {
                    setShowManualForm(true);
                }
            } catch (err) {
                console.error('Fetch saved addresses:', err);
                setShowManualForm(true);
            } finally {
                setLoadingSaved(false);
            }
        };
        fetchSaved();
    }, [step, user]);

    // Apply a saved address to the addr state
    const applyAddress = (a) => {
        setAddr({
            firstName: a.first_name || '',
            lastName: a.last_name || '',
            email: a.email || user?.email || '',
            phone: a.phone || '',
            address: a.address || '',
            address2: a.address2 || '',
            city: a.city || '',
            state: a.state || '',
            pincode: a.pincode || '',
        });
    };

    const selectSavedAddress = (a) => {
        setSelectedSavedId(a.id);
        applyAddress(a);
        setShowManualForm(false);
    };

    const switchToManualForm = () => {
        setSelectedSavedId(null);
        setShowManualForm(true);
        // Reset to profile defaults for manual entry
        setAddr({
            firstName: profile?.full_name?.split(' ')[0] || '',
            lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
            email: user?.email || '',
            phone: '',
            address: '',
            address2: '',
            city: '',
            state: '',
            pincode: '',
        });
    };

    // Pincode serviceability check
    const checkServiceability = useCallback(async (pincode) => {
        if (!/^\d{6}$/.test(pincode)) return;
        setServiceability({ checking: true });
        try {
            const res = await fetch(`/api/check-serviceability/${pincode}`);
            const data = await res.json();
            setServiceability(data);
        } catch {
            setServiceability({ serviceable: true, message: 'Could not verify serviceability.' });
        }
    }, []);

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 50 : 0;
    const tax = subtotal * 0.18;
    const total = subtotal + shipping + tax;

    // ── Address validation ──
    const validateAddress = () => {
        if (!addr.firstName.trim()) return 'First name is required.';
        if (!addr.phone.trim() || !/^\d{10}$/.test(addr.phone.trim())) return 'A valid 10-digit phone number is required.';
        if (!addr.address.trim()) return 'Address is required.';
        if (!addr.city.trim()) return 'City is required.';
        if (!addr.state.trim()) return 'State is required.';
        if (!addr.pincode.trim() || !/^\d{6}$/.test(addr.pincode.trim())) return 'A valid 6-digit pincode is required.';
        return null;
    };

    // ── Checkout handler ──
    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!user) { alert("Please login to proceed with checkout."); navigate('/login'); return; }

        const validationErr = validateAddress();
        if (validationErr) { alert(validationErr); return; }

        // Save address if "Save this address" is checked and using manual form
        if (saveNewAddress && showManualForm && supabase) {
            try {
                await supabase.from('user_addresses').insert({
                    user_id: user.id,
                    label: 'Home',
                    first_name: addr.firstName.trim(),
                    last_name: addr.lastName.trim(),
                    phone: addr.phone.trim(),
                    email: addr.email.trim(),
                    address: addr.address.trim(),
                    address2: addr.address2.trim(),
                    city: addr.city.trim(),
                    state: addr.state.trim(),
                    pincode: addr.pincode.trim(),
                    is_default: savedAddresses.length === 0,
                });
            } catch (e) {
                console.error('Save address during checkout:', e);
            }
        }

        const razorpayKey = (import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim();
        if (!razorpayKey || razorpayKey === "YOUR_RAZORPAY_KEY_HERE") {
            alert("Payment Gateway Error: VITE_RAZORPAY_KEY_ID is missing in .env.local."); return;
        }

        setIsCheckingOut(true);
        try {
            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Math.round(total * 100),
                    userId: user.id,
                    userEmail: user.email,
                    cartItems: cart,
                    subtotal, shipping, tax, total,
                    shippingAddress: addr,
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create order.');

            const { razorpayOrderId, supabaseOrderId } = data;

            // Developer bypass
            if (razorpayKey === 'test_bypass') {
                await fetch('/api/confirm-payment', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ supabaseOrderId, razorpayPaymentId: 'pay_demo_' + Date.now(), cartItems: cart, shippingAddress: addr, customerEmail: user.email, customerName: `${addr.firstName} ${addr.lastName}`.trim() })
                });
                clearCart(); navigate('/success'); return;
            }

            // Razorpay modal
            const options = {
                key: razorpayKey, amount: Math.round(total * 100), currency: "INR",
                name: "Printing Ustad",
                description: supabaseOrderId ? `Order #${supabaseOrderId.slice(0, 8)}` : 'Custom Printing Order',
                image: "/logo.png", order_id: razorpayOrderId,
                prefill: { name: `${addr.firstName} ${addr.lastName}`.trim(), email: addr.email || user.email, contact: addr.phone },
                theme: { color: "#7c3aed" },
                modal: { ondismiss: () => setIsCheckingOut(false) },
                handler: async function (paymentResponse) {
                    try {
                        await fetch('/api/confirm-payment', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                supabaseOrderId,
                                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                                razorpayOrderId: paymentResponse.razorpay_order_id,
                                razorpaySignature: paymentResponse.razorpay_signature,
                                cartItems: cart,
                                shippingAddress: addr,
                                customerEmail: user.email,
                                customerName: `${addr.firstName} ${addr.lastName}`.trim(),
                            })
                        });
                    } catch (_) { }
                    clearCart(); navigate('/success');
                },
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (resp) => { alert(`Payment failed: ${resp.error.description}`); setIsCheckingOut(false); });
            rzp.open();
        } catch (error) {
            console.error("Checkout Error:", error);
            alert(`Error during checkout: ${error.message || 'Unknown error.'}`);
            setIsCheckingOut(false);
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f7f5ff] via-white to-[#ede9fe] pt-10 pb-24">
            <div className="max-w-[1200px] mx-auto px-6">
                {/* Breadcrumb */}
                <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1 uppercase tracking-widest font-bold">
                    <Link to="/" className="hover:text-purple-600 transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <button onClick={() => setStep('cart')} className={step === 'cart' ? 'text-purple-600' : 'hover:text-purple-600 transition-colors'}>Cart</button>
                    {step === 'address' && (
                        <>
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                            <span className="text-purple-600">Delivery Address</span>
                        </>
                    )}
                </nav>

                {/* Step indicator */}
                <div className="flex items-center gap-3 mb-8">
                    <div className={`flex items-center gap-2 text-sm font-bold ${step === 'cart' ? 'text-purple-600' : 'text-green-500'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${step === 'cart' ? 'bg-purple-600 text-white' : 'bg-green-500 text-white'}`}>
                            {step === 'address' ? <span className="material-symbols-outlined text-sm">check</span> : '1'}
                        </div>
                        Cart
                    </div>
                    <div className={`flex-1 h-0.5 rounded-full max-w-[60px] ${step === 'address' ? 'bg-purple-400' : 'bg-gray-200'}`} />
                    <div className={`flex items-center gap-2 text-sm font-bold ${step === 'address' ? 'text-purple-600' : 'text-gray-300'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${step === 'address' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</div>
                        Delivery Address
                    </div>
                    <div className="flex-1 h-0.5 rounded-full max-w-[60px] bg-gray-200" />
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-300">
                        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-extrabold text-gray-400">3</div>
                        Payment
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* ── STEP 1: Cart Items ─────────────────────────────── */}
                    {step === 'cart' && (
                        <div className="lg:col-span-8 space-y-5">
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Your Cart</h1>
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 text-gray-300 bg-white rounded-3xl border border-purple-100">
                                    <span className="material-symbols-outlined text-7xl mb-4">shopping_basket</span>
                                    <p className="text-xl font-bold text-gray-400">Your cart is empty</p>
                                    <Link to="/shop" className="mt-6 bg-purple-600 text-white font-bold px-6 py-3 rounded-full hover:bg-purple-700 transition-colors text-sm">Browse Products</Link>
                                </div>
                            ) : cart.map((item) => (
                                <div key={item.uniqueId} className="flex gap-5 p-5 bg-white rounded-2xl border border-purple-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all">
                                    <Link to={`/product/${item.id}`} className="relative w-24 h-24 rounded-xl overflow-hidden bg-purple-50 flex-shrink-0 border border-purple-100 block hover:ring-2 hover:ring-purple-300 transition-all">
                                        <img
                                            src={
                                                item.previewUrl ||
                                                item.customizations?.previewUrl ||
                                                item.customization?.previewUrl ||
                                                item.image
                                            }
                                            className="w-full h-full object-cover"
                                            alt={item.name}
                                        />

                                        {/* Custom Design Badge */}
                                        {(item.previewUrl ||
                                            item.customizations?.previewUrl ||
                                            item.customization?.previewUrl ||
                                            item.uploadedImageUrl ||
                                            item.customizations?.uploadedImageUrl ||
                                            item.customization?.uploadedImageUrl) && (
                                                <div className="absolute bottom-1 left-1 right-1">
                                                    <span className="inline-flex items-center gap-1 bg-purple-600 text-white text-[8px] font-bold px-2 py-1 rounded-md shadow">
                                                        <span className="material-symbols-outlined text-[10px]">
                                                            brush
                                                        </span>
                                                        Custom Design
                                                    </span>
                                                </div>
                                            )}

                                    </Link>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Link to={`/product/${item.id}`} className="font-bold text-lg text-gray-900 hover:text-purple-600 transition-colors">{item.name}</Link>
                                                    {(
                                                        item.previewUrl ||
                                                        item.customizations?.previewUrl ||
                                                        item.customization?.previewUrl ||
                                                        item.uploadedImageUrl ||
                                                        item.customizations?.uploadedImageUrl ||
                                                        item.customization?.uploadedImageUrl
                                                    ) && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] bg-purple-100 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full font-bold mt-1">
                                                                <span className="material-symbols-outlined text-[11px]">
                                                                    brush
                                                                </span>
                                                                Custom Design
                                                            </span>
                                                        )}
                                                </div>
                                                <button onClick={() => removeItem(item.uniqueId)} className="text-gray-300 hover:text-red-400 transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {item.attributes && Object.entries(item.attributes).filter(([key]) => key !== 'customDesign' && key !== 'customDesignId').map(([key, val]) => (
                                                    <span key={key} className="text-[10px] uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-lg text-gray-500 font-bold">{key}: {val}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end mt-4">
                                            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-2 py-1">
                                                <button onClick={() => updateQuantity(item.uniqueId, -1)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                                                    <span className="material-symbols-outlined text-sm">remove</span>
                                                </button>
                                                <span className="w-8 text-center text-sm font-bold text-gray-900">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.uniqueId, 1)} className="p-1 text-gray-400 hover:text-gray-800 transition-colors">
                                                    <span className="material-symbols-outlined text-sm">add</span>
                                                </button>
                                            </div>
                                            <span className="font-extrabold text-purple-600 text-xl">₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── STEP 2: Delivery Address ─────────────────── */}
                    {step === 'address' && (
                        <div className="lg:col-span-8">
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-6">Delivery Address</h1>
                            <div className="bg-white rounded-3xl border border-purple-100 shadow-lg p-7 space-y-5">
                                {/* Delivery info badge */}
                                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                                    <span className="material-symbols-outlined text-blue-500 text-2xl">local_shipping</span>
                                    <div>
                                        <p className="text-sm font-bold text-blue-700">Shipped via Shiprocket</p>
                                        <p className="text-xs text-blue-500">Pan-India delivery with real-time tracking.</p>
                                    </div>
                                </div>

                                {/* ── Saved Addresses Picker ── */}
                                {loadingSaved ? (
                                    <div className="py-6 flex justify-center">
                                        <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : savedAddresses.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-xs font-extrabold uppercase tracking-widest text-gray-400">
                                            Your Saved Addresses
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {savedAddresses.map((a) => {
                                                const isSelected = selectedSavedId === a.id && !showManualForm;
                                                const labelIcons = { Home: 'home', Office: 'apartment', Other: 'location_on' };
                                                return (
                                                    <button
                                                        key={a.id}
                                                        type="button"
                                                        onClick={() => selectSavedAddress(a)}
                                                        className={`text-left border-2 rounded-2xl p-4 transition-all ${
                                                            isSelected
                                                                ? 'border-purple-500 bg-purple-50/60 shadow-md shadow-purple-100/50'
                                                                : 'border-gray-100 bg-gray-50/40 hover:border-purple-200 hover:bg-purple-50/20'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-2">
                                                            {isSelected && (
                                                                <span className="material-symbols-outlined text-purple-600 text-lg">check_circle</span>
                                                            )}
                                                            <span className="material-symbols-outlined text-purple-500 text-base">
                                                                {labelIcons[a.label] || 'location_on'}
                                                            </span>
                                                            <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">{a.label || 'Address'}</span>
                                                            {a.is_default && (
                                                                <span className="text-[8px] font-extrabold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                                                                    Default
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-semibold text-gray-700">{a.first_name} {a.last_name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                                                            {[a.address, a.city, a.state, a.pincode].filter(Boolean).join(', ')}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-1">+91 {a.phone}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Toggle to manual form */}
                                        {!showManualForm ? (
                                            <button
                                                type="button"
                                                onClick={switchToManualForm}
                                                className="flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors pt-1"
                                            >
                                                <span className="material-symbols-outlined text-lg">add</span>
                                                Use a different address
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-3 pt-1">
                                                <div className="flex-1 h-px bg-gray-100" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Or enter a new address</span>
                                                <div className="flex-1 h-px bg-gray-100" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Manual Address Form (shown if no saved or toggled) ── */}
                                {showManualForm && (
                                    <div className="space-y-5">
                                        {/* Name row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="First Name" required>
                                                <input type="text" value={addr.firstName} onChange={setField('firstName')} placeholder="Rahul" className={inputCls} />
                                            </Field>
                                            <Field label="Last Name">
                                                <input type="text" value={addr.lastName} onChange={setField('lastName')} placeholder="Sharma" className={inputCls} />
                                            </Field>
                                        </div>

                                        {/* Contact row */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Email" required>
                                                <input type="email" value={addr.email} onChange={setField('email')} placeholder="you@example.com" className={inputCls} />
                                            </Field>
                                            <Field label="Phone Number" required>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">+91</span>
                                                    <input type="tel" value={addr.phone} onChange={setField('phone')} maxLength={10} placeholder="9876543210" className={`${inputCls} pl-12`} />
                                                </div>
                                            </Field>
                                        </div>

                                        {/* Address */}
                                        <Field label="Address Line 1" required>
                                            <input type="text" value={addr.address} onChange={setField('address')} placeholder="House/Flat no., Street, Locality" className={inputCls} />
                                        </Field>
                                        <Field label="Address Line 2 (Optional)">
                                            <input type="text" value={addr.address2} onChange={setField('address2')} placeholder="Landmark, Area (optional)" className={inputCls} />
                                        </Field>

                                        {/* City / State / Pincode */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <Field label="City" required>
                                                <input type="text" value={addr.city} onChange={setField('city')} placeholder="New Delhi" className={inputCls} />
                                            </Field>
                                            <Field label="State" required>
                                                <select value={addr.state} onChange={setField('state')} className={inputCls}>
                                                    <option value="">Select State</option>
                                                    {['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Puducherry'].map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </Field>
                                            <Field label="Pincode" required>
                                                <input
                                                    type="text"
                                                    value={addr.pincode}
                                                    onChange={setField('pincode')}
                                                    onBlur={(e) => checkServiceability(e.target.value)}
                                                    maxLength={6}
                                                    placeholder="110001"
                                                    className={inputCls}
                                                />
                                                {serviceability && !serviceability.checking && (
                                                    <p className={`text-xs mt-1 font-bold flex items-center gap-1 ${serviceability.serviceable ? 'text-green-600' : 'text-red-500'}`}>
                                                        <span className="material-symbols-outlined text-sm">{serviceability.serviceable ? 'check_circle' : 'cancel'}</span>
                                                        {serviceability.message}
                                                    </p>
                                                )}
                                                {serviceability?.checking && (
                                                    <p className="text-xs mt-1 text-gray-400 flex items-center gap-1">
                                                        <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                                                        Checking serviceability...
                                                    </p>
                                                )}
                                            </Field>
                                        </div>

                                        {/* Save this address checkbox */}
                                        {user && supabase && (
                                            <label className="flex items-center gap-2.5 cursor-pointer bg-purple-50/50 border border-purple-100 rounded-xl px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={saveNewAddress}
                                                    onChange={e => setSaveNewAddress(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <div>
                                                    <span className="text-sm font-semibold text-gray-700">Save this address for future orders</span>
                                                    <p className="text-[10px] text-gray-400">You can manage saved addresses in your Profile</p>
                                                </div>
                                            </label>
                                        )}
                                    </div>
                                )}

                                {/* Back button */}
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setStep('cart')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 font-bold text-sm transition-colors">
                                        <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Order Summary Sidebar ─────────────────────────── */}
                    <div className="lg:col-span-4">
                        <div className="bg-white p-7 rounded-3xl border border-purple-100 shadow-xl shadow-purple-50/60 sticky top-24">
                            <h2 className="text-lg font-extrabold text-gray-900 mb-5">Order Summary</h2>

                            {/* Item count */}
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Subtotal</span>
                                    <span className="text-gray-800 font-semibold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm text-purple-400">local_shipping</span>
                                        Shipping
                                    </span>
                                    <span className="text-gray-800 font-semibold">₹{shipping.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Tax (GST 18%)</span>
                                    <span className="text-gray-800 font-semibold">₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="w-full h-px bg-gray-100" />
                                <div className="flex justify-between items-center font-extrabold text-xl text-gray-900">
                                    <span>Total</span>
                                    <span className="text-purple-600">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {/* CTA: Cart → Address step, Address → Payment */}
                            {step === 'cart' ? (
                                <button
                                    disabled={cart.length === 0}
                                    onClick={() => {
                                        if (!user) { navigate('/login'); return; }
                                        setStep('address');
                                    }}
                                    className={`w-full py-4 rounded-2xl font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg text-base ${cart.length === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-purple-200/60'}`}
                                >
                                    Continue to Delivery
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut}
                                    className={`w-full py-4 rounded-2xl font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg text-base ${isCheckingOut ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white hover:scale-[1.02] active:scale-[0.98] shadow-purple-200/60'}`}
                                >
                                    {isCheckingOut ? (
                                        <><span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>Processing...</>
                                    ) : (
                                        <>Pay ₹{total.toLocaleString('en-IN')} <span className="material-symbols-outlined">lock</span></>
                                    )}
                                </button>
                            )}

                            <div className="mt-4 flex items-center justify-center gap-4 opacity-30">
                                <span className="material-symbols-outlined">payments</span>
                                <span className="material-symbols-outlined">credit_card</span>
                                <span className="material-symbols-outlined">account_balance</span>
                            </div>
                            <p className="text-center text-xs text-gray-400 mt-2">🔒 Secured by Razorpay · Shipped via Shiprocket</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
