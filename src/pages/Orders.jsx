import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const statusColors = {
    pending:    'bg-blue-100 text-blue-600 border-blue-200',
    processing: 'bg-amber-100 text-amber-600 border-amber-200',
    completed:  'bg-green-100 text-green-600 border-green-200',
    cancelled:  'bg-red-100 text-red-500 border-red-200',
};

// ─── Tracking modal ───────────────────────────────────────────────────────────
const TrackingModal = ({ orderId, awb, trackingUrl, onClose }) => {
    const [trackData, setTrackData] = useState(null);
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
        const fetchTracking = async () => {
            try {
                const res = await fetch(`/api/track/${orderId}`);
                const data = await res.json();
                setTrackData(data);
            } catch (err) {
                setTrackData({ tracked: false, message: 'Could not fetch tracking info.' });
            } finally {
                setLoading(false);
            }
        };
        fetchTracking();
    }, [orderId]);

    return (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500">local_shipping</span>
                        Shiprocket Tracking
                    </h2>
                    <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {awb && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Waybill Number</p>
                        <p className="font-mono text-lg font-extrabold text-blue-600">{awb}</p>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-8 gap-3">
                        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400">Fetching tracking info...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {trackData?.tracked && trackData?.status ? (
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm">
                                <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Current Status</p>
                                <p className="font-extrabold text-blue-700 text-base">{trackData.status}</p>
                                {trackData.status_desc && <p className="text-gray-500 text-xs mt-1">{trackData.status_desc}</p>}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <span className="material-symbols-outlined text-4xl text-gray-200 block mb-2">inventory</span>
                                <p className="text-sm text-gray-500">{trackData?.message || 'Tracking info will appear once the shipment is dispatched.'}</p>
                            </div>
                        )}
                    </div>
                )}

                {trackingUrl && (
                    <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3 rounded-2xl hover:opacity-90 transition-opacity shadow-lg shadow-blue-200/60"
                    >
                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                        Track on Shiprocket
                    </a>
                )}
            </div>
        </div>
    );
};

// ─── Main Orders Page ─────────────────────────────────────────────────────────
const Orders = () => {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders]           = useState([]);
    const [loading, setLoading]         = useState(true);
    const [fetchError, setFetchError]   = useState('');
    const [trackingOrder, setTrackingOrder] = useState(null); // { id, awb, trackingUrl }

    useEffect(() => {
        if (authLoading) return;
        if (!user) { setLoading(false); return; }

        const fetchOrders = async () => {
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, order_items(*, products(name, base_image_url))')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setOrders(data || []);
                setFetchError('');
            } catch (err) {
                console.error('Error fetching orders:', err.message);
                setFetchError(err.message);
                setOrders([]);
            } finally { setLoading(false); }
        };

        fetchOrders();

        const channel = supabase.channel(`user-orders-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, fetchOrders)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [user, authLoading]);

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#f7f5ff] via-white to-[#ede9fe] flex items-center justify-center p-6">
                <div className="text-center bg-white rounded-3xl border border-purple-100 shadow-xl p-12">
                    <span className="material-symbols-outlined text-6xl text-gray-200 block mb-4">receipt_long</span>
                    <h1 className="text-2xl font-extrabold text-gray-800 mb-3">Please log in to view orders</h1>
                    <Link to="/login" className="inline-block bg-purple-600 text-white font-bold px-6 py-3 rounded-full hover:bg-purple-700 transition-colors">Login Here</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f7f5ff] via-white to-[#ede9fe] pt-10 pb-24">
            {/* Tracking Modal */}
            {trackingOrder && (
                <TrackingModal
                    orderId={trackingOrder.id}
                    awb={trackingOrder.awb}
                    trackingUrl={trackingOrder.trackingUrl}
                    onClose={() => setTrackingOrder(null)}
                />
            )}

            <div className="max-w-[1000px] mx-auto px-6">
                <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1 uppercase tracking-widest font-bold">
                    <Link to="/" className="hover:text-purple-600 transition-colors">Home</Link>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <span className="text-purple-600">My Orders</span>
                </nav>

                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-10">My Orders</h1>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400">Fetching your orders...</p>
                    </div>
                ) : fetchError ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center">
                        <span className="material-symbols-outlined text-5xl text-red-400 block mb-4">error</span>
                        <h2 className="text-xl font-bold text-red-500 mb-2">Failed to load orders</h2>
                        <p className="text-gray-500 text-sm">{fetchError}</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-purple-100 shadow-xl p-14 text-center">
                        <span className="material-symbols-outlined text-7xl text-gray-200 block mb-5">inbox</span>
                        <h2 className="text-2xl font-extrabold text-gray-700 mb-2">No orders yet</h2>
                        <p className="text-gray-400 mb-8">Your order history will appear here once you place your first order.</p>
                        <Link to="/shop" className="inline-block bg-purple-600 text-white font-bold px-8 py-3 rounded-full hover:bg-purple-700 transition-colors">Start Shopping</Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => {
                            const addr = order.shipping_address || {};
                            const hasTracking = !!addr.awb_code;
                            return (
                                <div key={order.id} className="bg-white rounded-3xl border border-purple-100 shadow-lg shadow-purple-50/50 overflow-hidden hover:border-purple-200 hover:shadow-xl transition-all">
                                    {/* Order Header */}
                                    <div className="p-6 border-b border-gray-50 flex flex-wrap justify-between items-center gap-4 bg-gradient-to-r from-purple-50/50 to-transparent">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Order Number</p>
                                            <p className="font-mono text-sm font-bold text-purple-600">#{order.id.slice(0, 8).toUpperCase()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Date</p>
                                            <p className="text-sm font-semibold text-gray-700">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Total Amount</p>
                                            <p className="text-xl font-extrabold text-gray-900">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${statusColors[order.status] || statusColors.pending}`}>
                                                {order.status}
                                            </span>
                                            {/* Track button */}
                                            {hasTracking ? (
                                                <button
                                                    onClick={() => setTrackingOrder({ id: order.id, awb: addr.awb_code, trackingUrl: addr.tracking_url })}
                                                    className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-sm">local_shipping</span>
                                                    Track Shipment
                                                </button>
                                            ) : order.status === 'processing' ? (
                                                <span className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                                    AWB being assigned...
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Delivery Address */}
                                    {(addr.firstName || addr.address) && (
                                        <div className="px-6 pt-4 pb-1">
                                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs">location_on</span>
                                                Delivery To
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {[`${addr.firstName || ''} ${addr.lastName || ''}`.trim(), addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                                            </p>
                                            {addr.courier_name && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Courier: <span className="font-bold text-gray-600">{addr.courier_name}</span>
                                                    {addr.awb_code && <> · AWB: <span className="font-mono text-purple-600">{addr.awb_code}</span></>}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Order Items */}
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            {order.order_items?.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-purple-50 flex-shrink-0 border border-purple-100">
                                                            <img src={item.products?.base_image_url || 'https://placehold.co/100x100/ede9fe/7c3aed?text=P'} className="w-full h-full object-cover" alt={item.products?.name} />
                                                            {item.customizations?.uploadedImageUrl && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                                    <img src={item.customizations.uploadedImageUrl} className="w-8 h-8 object-contain drop-shadow" alt="Design" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800">{item.products?.name || 'Custom Product'}</p>
                                                            {item.customizations?.uploadedImageUrl && (
                                                                <span className="inline-flex items-center gap-1 text-[10px] bg-purple-100 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full font-bold">
                                                                    <span className="material-symbols-outlined text-[10px]">brush</span>Custom
                                                                </span>
                                                            )}
                                                            <p className="text-[11px] text-gray-400">{item.quantity} unit{item.quantity !== 1 ? 's' : ''}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-extrabold text-purple-600">₹{Number(item.unit_price).toLocaleString('en-IN')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
