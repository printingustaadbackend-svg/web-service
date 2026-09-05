import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const { resetPassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setSuccess('');

        // Check passwords
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        // Minimum password length
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        try {
            setLoading(true);

            const { error: resetError } = await resetPassword({
                email,
                newPassword
            });

            if (resetError) {
                throw resetError;
            }

            setSuccess(
                'Password updated successfully. Redirecting to login...'
            );

            // Give user a moment to see success message
            setTimeout(() => {
                navigate('/login');
            }, 1500);

        } catch (err) {

            console.error('Password reset error:', err);

            setError(
                err.message ||
                'Unable to reset password.'
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f7f5ff] via-white to-[#ede9fe] flex items-center justify-center p-6">

            <div className="max-w-[440px] w-full">

                {/* Logo */}
                <div className="text-center mb-8">
                    <img
                        src="/logo.png"
                        alt="Printing Ustad"
                        className="h-16 mx-auto mb-2"
                    />
                </div>

                <div className="bg-white rounded-3xl border border-purple-100 shadow-2xl shadow-purple-100/40 p-8 relative overflow-hidden">

                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-400/5 blur-[60px] rounded-full pointer-events-none" />

                    <div className="relative z-10">

                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 text-center mb-1">
                            Reset Password
                        </h1>

                        <p className="text-gray-400 text-sm text-center mb-8">
                            Enter your email and create a new password.
                        </p>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs mb-6 text-center font-medium">
                                {error}
                            </div>
                        )}

                        {/* Success */}
                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-xl text-xs mb-6 text-center font-medium">
                                {success}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-4"
                        >

                            {/* Email */}
                            <div>

                                <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    placeholder="you@example.com"
                                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-gray-900"
                                />

                            </div>

                            {/* New Password */}
                            <div className="relative">

                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    required
                                    minLength={8}
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    placeholder="••••••••"
                                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 pr-12 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-gray-900"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNewPassword(!showNewPassword)
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                                    aria-label={
                                        showNewPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showNewPassword ? "🙈" : "👁️"}
                                </button>

                            </div>

                            {/* Confirm Password */}
                            <div className="relative">

                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    minLength={8}
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    placeholder="••••••••"
                                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 pr-12 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-gray-900"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(!showConfirmPassword)
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                                    aria-label={
                                        showConfirmPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    {showConfirmPassword ? "🙈" : "👁️"}
                                </button>

                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-extrabold py-4 rounded-xl mt-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-200/60 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading
                                    ? 'Updating Password...'
                                    : 'Reset Password →'}
                            </button>

                        </form>

                        {/* Back to Login */}
                        <p className="text-center mt-8 text-sm text-gray-400">
                            Remember your password?{' '}

                            <Link
                                to="/login"
                                className="text-purple-600 font-bold hover:underline"
                            >
                                Login
                            </Link>
                        </p>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;