import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) return setError("Passwords do not match");
        try {
            setError('');
            setLoading(true);
            const { error: signUpError } = await signUp({ email, password, options: { data: { full_name: fullName } } });
            if (signUpError) throw signUpError;
            alert("Signup successful! Please check your email for verification.");
            navigate('/login');
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
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 text-center mb-1">Create Account</h1>
                        <p className="text-gray-400 text-sm text-center mb-8">Save your designs and track your orders.</p>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs mb-6 text-center font-medium">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {[
                                { label: 'Full Name', type: 'text', value: fullName, onChange: setFullName, placeholder: 'John Doe' },
                                { label: 'Email Address', type: 'email', value: email, onChange: setEmail, placeholder: 'you@example.com' },
                                { label: 'Password', type: 'password', value: password, onChange: setPassword, placeholder: '••••••••' },
                                { label: 'Confirm Password', type: 'password', value: confirmPassword, onChange: setConfirmPassword, placeholder: '••••••••' },
                            ].map(field => (
                                <div key={field.label}>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">{field.label}</label>
                                    <input
                                        type={field.type} required
                                        className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-gray-900"
                                        value={field.value} onChange={(e) => field.onChange(e.target.value)}
                                        placeholder={field.placeholder}
                                    />
                                </div>
                            ))}

                            <button
                                type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-extrabold py-4 rounded-xl mt-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-200/60 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Creating Account..." : "Create Account →"}
                            </button>
                        </form>

                        <p className="text-center mt-8 text-sm text-gray-400">
                            Already have an account? <Link to="/login" className="text-purple-600 font-bold hover:underline">Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
