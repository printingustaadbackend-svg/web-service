import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
    { id: 'tshirts',   icon: 'checkroom',          label: 'T-Shirts & Hoodies',   minQty: 25,  discount: '30%' },
    { id: 'mugs',      icon: 'coffee',              label: 'Mugs & Bottles',        minQty: 50,  discount: '25%' },
    { id: 'cards',     icon: 'contacts',            label: 'Visiting Cards',        minQty: 100, discount: '40%' },
    { id: 'stickers',  icon: 'label',               label: 'Stickers & Labels',     minQty: 100, discount: '35%' },
    { id: 'notebooks', icon: 'menu_book',           label: 'Diaries & Notebooks',   minQty: 50,  discount: '28%' },
    { id: 'corporate', icon: 'business_center',     label: 'Corporate Kits',        minQty: 20,  discount: '32%' },
    { id: 'calendars', icon: 'calendar_month',      label: 'Calendars',             minQty: 50,  discount: '30%' },
    { id: 'gifts',     icon: 'redeem',              label: 'Photo Gifts',           minQty: 30,  discount: '22%' },
];

const TIERS = [
    { range: '25–99',    label: 'Starter',     color: '#7c3aed', bg: '#f5f3ff', discount: 'Up to 20% off' },
    { range: '100–499',  label: 'Business',    color: '#4f46e5', bg: '#eef2ff', discount: 'Up to 30% off' },
    { range: '500–999',  label: 'Enterprise',  color: '#0891b2', bg: '#ecfeff', discount: 'Up to 40% off' },
    { range: '1000+',    label: 'Wholesale',   color: '#059669', bg: '#ecfdf5', discount: 'Custom pricing' },
];

const WHY = [
    { icon: 'verified',        title: 'Premium Quality',      desc: 'Industry-leading DTG & screen-print technology for sharp, vibrant results every time.' },
    { icon: 'local_shipping',  title: 'Pan-India Delivery',   desc: 'Reliable, trackable shipping to all 700+ districts across India.' },
    { icon: 'speed',           title: 'Fast Turnaround',      desc: 'Bulk orders processed and dispatched within 5–7 business days.' },
    { icon: 'support_agent',   title: 'Dedicated Manager',    desc: 'Every bulk client gets a personal account manager for smooth co-ordination.' },
    { icon: 'palette',         title: 'Free Design Support',  desc: 'Our in-house design team helps you perfect your artwork at no extra cost.' },
    { icon: 'currency_rupee',  title: 'Best Price Guarantee', desc: 'Found it cheaper elsewhere? We\'ll match any verified quote — guaranteed.' },
];

export default function BulkOrder() {
    const [selected, setSelected]   = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm]           = useState({
        name: '', company: '', email: '', phone: '',
        qty: '', deadline: '', notes: '',
    });
    const [errors, setErrors] = useState({});

    const toggleCat = (id) =>
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const [submitting, setSubmitting] = useState(false);
    const [apiError,   setApiError]   = useState('');

    const validate = () => {
        const e = {};
        if (!form.name.trim())  e.name  = 'Name is required';
        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
        if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) e.phone = 'Valid 10-digit phone required';
        if (!form.qty.trim() || isNaN(form.qty) || Number(form.qty) < 1) e.qty = 'Enter a valid quantity';
        if (selected.length === 0) e.cat = 'Select at least one product category';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setApiError('');
        const errs = validate();
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/bulk-enquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name:       form.name,
                    company:    form.company,
                    email:      form.email,
                    phone:      form.phone,
                    qty:        form.qty,
                    deadline:   form.deadline,
                    notes:      form.notes,
                    categories: selected,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Submission failed. Please try again.');
            setSubmitted(true);
        } catch (err) {
            setApiError(err.message || 'Network error. Please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const field = (key, label, type = 'text', placeholder = '', extra = {}) => (
        <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition ${errors[key] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-purple-300'}`}
                {...extra}
            />
            {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f7f5ff] via-white to-[#ede9fe]">

            {/* ── HERO ── */}
            <section className="relative overflow-hidden px-6 py-20 text-center"
                style={{ background: 'linear-gradient(135deg,#3b0764 0%,#4f46e5 60%,#0891b2 100%)' }}>
                {/* decorative blobs */}
                <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle,#e879f9,transparent)' }} />
                <div className="absolute -bottom-16 -right-10 w-72 h-72 rounded-full opacity-15"
                    style={{ background: 'radial-gradient(circle,#34d399,transparent)' }} />

                <p className="relative text-purple-200 text-xs uppercase tracking-[0.3em] font-semibold mb-4">
                    Printing Ustad — Bulk &amp; Corporate
                </p>
                <h1 className="relative text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
                    Print More.<br className="hidden md:block" /> Save More.
                </h1>
                <p className="relative text-purple-100 text-lg max-w-2xl mx-auto mb-8">
                    Premium custom printing at scale — T‑shirts, corporate kits, packaging, and more.
                    Unlock up to <span className="text-yellow-300 font-bold">40% off</span> on bulk orders starting from just 25 pieces.
                </p>
                <a href="#enquiry"
                    className="inline-flex items-center gap-2 bg-white text-purple-700 font-extrabold px-8 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-sm">
                    <span className="material-symbols-outlined text-lg">edit_note</span>
                    Get a Free Quote
                </a>
            </section>

            {/* ── DISCOUNT TIERS ── */}
            <section className="max-w-5xl mx-auto px-6 py-14">
                <p className="text-center text-xs uppercase tracking-[0.3em] text-purple-500 font-semibold mb-2">Volume Discounts</p>
                <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-10">The More You Order, The More You Save</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {TIERS.map(t => (
                        <div key={t.range}
                            className="rounded-2xl p-5 text-center border shadow-sm hover:shadow-md transition-shadow"
                            style={{ background: t.bg, borderColor: t.color + '33' }}>
                            <p className="text-2xl font-extrabold mb-1" style={{ color: t.color }}>{t.range}</p>
                            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: t.color }}>{t.label}</p>
                            <p className="text-sm text-gray-600 font-semibold">{t.discount}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── WHY US ── */}
            <section className="bg-white border-y border-gray-100 py-14 px-6">
                <div className="max-w-5xl mx-auto">
                    <p className="text-center text-xs uppercase tracking-[0.3em] text-purple-500 font-semibold mb-2">Why Choose Us</p>
                    <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-10">Trusted by 1,200+ Businesses Across India</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {WHY.map(w => (
                            <div key={w.title} className="flex gap-4 items-start p-5 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-sm transition-all bg-gray-50">
                                <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-purple-600 text-2xl">{w.icon}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm mb-1">{w.title}</p>
                                    <p className="text-xs text-gray-500 leading-relaxed">{w.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── ENQUIRY FORM ── */}
            <section id="enquiry" className="max-w-3xl mx-auto px-6 py-16">
                <p className="text-center text-xs uppercase tracking-[0.3em] text-purple-500 font-semibold mb-2">Get a Quote</p>
                <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">Tell Us About Your Order</h2>
                <p className="text-center text-gray-400 text-sm mb-10">Fill in the form below — we'll get back to you within 4 business hours with a custom quote.</p>

                {submitted ? (
                    /* ── SUCCESS STATE ── */
                    <div className="text-center py-16 rounded-3xl shadow-xl border border-green-100"
                        style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)' }}>
                        <div className="w-20 h-20 mx-auto rounded-full bg-green-500 flex items-center justify-center mb-5 shadow-lg">
                            <span className="material-symbols-outlined text-white text-4xl">check_circle</span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-green-800 mb-2">Enquiry Submitted! 🎉</h3>
                        <p className="text-green-700 mb-1">Thanks, <strong>{form.name}</strong>! We've received your bulk order enquiry.</p>
                        <p className="text-green-600 text-sm mb-8">Our team will reach you at <strong>{form.email}</strong> or <strong>{form.phone}</strong> within 4 business hours.</p>
                        <div className="flex justify-center gap-4 flex-wrap">
                            <Link to="/shop"
                                className="bg-green-600 text-white font-bold px-7 py-3 rounded-full hover:bg-green-700 transition-colors text-sm">
                                Browse Products
                            </Link>
                            <button onClick={() => { setSubmitted(false); setForm({ name:'',company:'',email:'',phone:'',qty:'',deadline:'',notes:'' }); setSelected([]); }}
                                className="border border-green-400 text-green-700 font-bold px-7 py-3 rounded-full hover:bg-green-50 transition-colors text-sm">
                                Submit Another
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} noValidate
                        className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6">

                        {/* ── Product Categories ── */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                Product Categories <span className="text-red-400">*</span>
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {CATEGORIES.map(cat => {
                                    const active = selected.includes(cat.id);
                                    return (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => toggleCat(cat.id)}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-center transition-all text-xs font-semibold ${
                                                active
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm'
                                                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-purple-300'
                                            }`}>
                                            <span className={`material-symbols-outlined text-2xl ${active ? 'text-purple-600' : 'text-gray-400'}`}>
                                                {cat.icon}
                                            </span>
                                            <span className="leading-tight">{cat.label}</span>
                                            {active && (
                                                <span className="text-[10px] text-purple-500 font-bold">
                                                    Min {cat.minQty} pcs · {cat.discount} off
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.cat && <p className="text-red-500 text-xs mt-2">{errors.cat}</p>}
                        </div>

                        {/* ── Contact Details ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {field('name',    'Full Name *',    'text', 'Your name')}
                            {field('company', 'Company / Brand', 'text', 'Optional')}
                            {field('email',   'Email Address *', 'email','you@company.com')}
                            {field('phone',   'WhatsApp / Phone *', 'tel', '+91 98765 43210')}
                        </div>

                        {/* ── Order Details ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {field('qty',      'Estimated Quantity *', 'number', 'e.g. 200', { min: 1 })}
                            {field('deadline', 'Required By (Date)',   'date',  '')}
                        </div>

                        {/* ── Notes ── */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Additional Notes</label>
                            <textarea
                                rows={3}
                                placeholder="Tell us about your design, colour preferences, special requirements…"
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition hover:border-purple-300 resize-none"
                            />
                        </div>

                        {/* ── API Error ── */}
                        {apiError && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                                <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">error</span>
                                {apiError}
                            </div>
                        )}

                        {/* ── CTA ── */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 rounded-2xl font-extrabold text-white text-base flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                            style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)', boxShadow: '0 6px 24px rgba(99,102,241,0.4)' }}>
                            {submitting ? (
                                <><span className="material-symbols-outlined text-xl animate-spin">progress_activity</span> Submitting…</>
                            ) : (
                                <><span className="material-symbols-outlined text-xl">send</span> Submit Bulk Order Enquiry</>
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-400">
                            By submitting, you agree to our{' '}
                            <Link to="/info#terms" className="text-purple-500 hover:underline">Terms of Service</Link>.
                            We'll never spam you.
                        </p>
                    </form>
                )}
            </section>

            {/* ── TRUST BAR ── */}
            <section className="bg-purple-950 text-white py-10 px-6 text-center">
                <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                        { icon: 'groups',           stat: '1,200+', label: 'Happy Businesses' },
                        { icon: 'inventory_2',      stat: '50L+',   label: 'Units Printed' },
                        { icon: 'star',             stat: '4.9★',   label: 'Average Rating' },
                        { icon: 'calendar_month',   stat: '5–7 Days', label: 'Avg. Turnaround' },
                    ].map(t => (
                        <div key={t.stat} className="flex flex-col items-center gap-1">
                            <span className="material-symbols-outlined text-purple-300 text-3xl mb-1">{t.icon}</span>
                            <p className="text-2xl font-extrabold">{t.stat}</p>
                            <p className="text-purple-300 text-xs">{t.label}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
