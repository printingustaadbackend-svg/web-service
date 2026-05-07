import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            const { error: signInError } = await signIn({ email, password });
            if (signInError) throw signInError;
            navigate('/profile');
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f7f5ff] via-white to-[#ede9fe] flex items-center justify-center p-6">
            <div className="max-w-[440px] w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="Printing Ustad" className="h-16 mx-auto mb-2" />
                </div>

                <div className="bg-white rounded-3xl border border-purple-100 shadow-2xl shadow-purple-100/40 p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-400/5 blur-[60px] rounded-full pointer-events-none" />

                    <div className="relative z-10">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 text-center mb-1">Welcome Back</h1>
                        <p className="text-gray-400 text-sm text-center mb-8">Login to access your dashboard and orders.</p>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs mb-6 text-center font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">Email Address</label>
                                <input
                                    type="email" required
                                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-gray-900"
                                    value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Password</label>
                                    <button type="button" className="text-[10px] text-purple-500 font-bold hover:underline">Forgot Password?</button>
                                </div>
                                <input
                                    type="password" required
                                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-gray-900"
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-extrabold py-4 rounded-xl mt-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-200/60 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Signing In..." : "Login →"}
                            </button>
                        </form>

                        <p className="text-center mt-8 text-sm text-gray-400">
                            New to Printing Ustad? <Link to="/signup" className="text-purple-600 font-bold hover:underline">Create Account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
