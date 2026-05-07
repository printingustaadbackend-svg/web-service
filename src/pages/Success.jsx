import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Success = () => {
    const [orderId, setOrderId] = useState('');

    useEffect(() => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let id1 = '', id2 = '';
        for (let i = 0; i < 4; i++) {
            id1 += chars.charAt(Math.floor(Math.random() * chars.length));
            id2 += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setOrderId(`PU-${id1}-${id2}`);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f7f5ff] via-white to-[#ede9fe] flex items-center justify-center p-6">
            <div className="max-w-[560px] w-full bg-white rounded-3xl border border-purple-100 shadow-2xl shadow-purple-100/50 p-12 text-center relative overflow-hidden">
                {/* Subtle glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-green-300/10 blur-[80px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                    {/* Success Icon */}
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white mb-8 shadow-2xl shadow-green-200/60">
                        <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </div>

                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-3">Order Confirmed!</h1>
                    <p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-[380px]">
                        Your custom prints are heading to the studio. We've sent an email with your order details.
                    </p>

                    {/* Order ID box */}
                    <div className="bg-purple-50 border border-purple-200 p-5 rounded-2xl mb-8 w-full">
                        <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-1">Order Number</p>
                        <p className="font-mono text-2xl font-bold text-purple-600 tracking-widest">{orderId}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Link to="/orders" className="flex-1 bg-white border border-purple-200 text-purple-600 font-extrabold py-4 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">receipt_long</span>
                            View Orders
                        </Link>
                        <Link to="/" className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-extrabold py-4 rounded-xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-200/60 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">home</span>
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Success;
