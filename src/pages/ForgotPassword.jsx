import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OtpInput from '../components/OtpInput';
import CaptchaWidget from '../components/CaptchaWidget';

const RESEND_COOLDOWN_SECONDS = 60;

const maskEmail = (str) => {
    if (!str || !str.includes('@')) return str;
    const [user, domain] = str.split('@');
    if (user.length <= 2) return `${user[0]}*@${domain}`;
    return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
};

const ForgotPassword = () => {
    // Flow steps: 'request' | 'otp' | 'reset'
    const [step, setStep] = useState('request');

    // Step 1: Request recovery
    const [email, setEmail] = useState('');

    // Step 2: OTP verification
    const [otp, setOtp] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [hasVerifiedRecovery, setHasVerifiedRecovery] = useState(false);

    // Step 3: New password
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Feedback states
    const [error, setError] = useState('');
    const [infoMsg, setInfoMsg] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    // CAPTCHA
    const [captchaToken, setCaptchaToken] = useState(null);
    const captchaRef = useRef(null);

    const { sendPasswordRecoveryOtp, verifyOtp, updateUserPassword, signOut } = useAuth();
    const navigate = useNavigate();

    // Cooldown countdown timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    // Step 1: Request Recovery OTP
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError('');
        setInfoMsg('');

        const cleanEmail = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            setError('Please enter a valid email address.');
            return;
        }

        try {
            setLoading(true);

            const tokenToUse = captchaToken || captchaRef.current?.getResponse();
            const siteKey =
                import.meta.env.VITE_CAPTCHA_SITE_KEY ||
                import.meta.env.VITE_TURNSTILE_SITE_KEY ||
                import.meta.env.VITE_HCAPTCHA_SITE_KEY;

            if (siteKey && !tokenToUse) {
                setError('Please complete the CAPTCHA check before submitting.');
                setLoading(false);
                return;
            }

            const options = {};
            if (tokenToUse) {
                options.captchaToken = tokenToUse;
            }

            const { error: resetError } = await sendPasswordRecoveryOtp(cleanEmail, options);

            if (resetError) {
                if (resetError.message?.toLowerCase().includes('captcha')) {
                    throw resetError;
                }
                console.warn('Note: Password recovery request message:', resetError.message);
            }

            // Always display generic security message
            setInfoMsg('If an account exists for this email, a verification code has been sent.');
            setStep('otp');
            setOtp('');
            setCooldown(RESEND_COOLDOWN_SECONDS);
            setCaptchaToken(null);
            captchaRef.current?.reset();
        } catch (err) {
            console.error('Password recovery request error:', err);
            setCaptchaToken(null);
            captchaRef.current?.reset();
            const msg = err?.message || 'Unable to request verification code.';
            if (msg.toLowerCase().includes('captcha')) {
                setError('CAPTCHA check failed. Ensure "localhost" is added to your Allowed Domains in hCaptcha / Turnstile dashboard, and verify that the Secret Key in Supabase Dashboard matches.');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify Recovery OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setInfoMsg('');

        const code = otp.trim();
        if (code.length < 6 || code.length > 8) {
            setError('Please enter your complete recovery code (6–8 digits).');
            return;
        }

        try {
            setLoading(true);

            const { data, error: verifyError } = await verifyOtp({
                email: email.trim().toLowerCase(),
                token: otp.trim(),
                type: 'recovery',
            });

            if (verifyError) {
                throw verifyError;
            }

            // Recovery verified: Supabase now has an authenticated recovery session
            setHasVerifiedRecovery(true);
            setStep('reset');
            setError('');
        } catch (err) {
            console.error('Recovery OTP verification error:', err?.message || 'Unknown error');
            const msg = err?.message || 'Verification failed.';
            if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
                setError('Invalid or expired verification code. Please check your email or request a new code.');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    // Resend Recovery OTP
    const handleResend = async () => {
        if (cooldown > 0 || resending) return;

        setError('');
        setInfoMsg('');

        try {
            setResending(true);

            const tokenToUse = captchaToken || captchaRef.current?.getResponse();
            const siteKey =
                import.meta.env.VITE_CAPTCHA_SITE_KEY ||
                import.meta.env.VITE_TURNSTILE_SITE_KEY ||
                import.meta.env.VITE_HCAPTCHA_SITE_KEY;

            if (siteKey && !tokenToUse) {
                setError('Please complete the CAPTCHA check before requesting a new code.');
                setResending(false);
                return;
            }

            const options = {};
            if (tokenToUse) {
                options.captchaToken = tokenToUse;
            }

            await sendPasswordRecoveryOtp(email.trim().toLowerCase(), options);

            setInfoMsg('If an account exists for this email, a new 6-digit code has been sent.');
            setCooldown(RESEND_COOLDOWN_SECONDS);
            setCaptchaToken(null);
            captchaRef.current?.reset();
        } catch (err) {
            console.error('Resend recovery code error:', err?.message || 'Unknown error');
            setError(err?.message || 'Unable to resend code. Please try again.');
            setCaptchaToken(null);
            captchaRef.current?.reset();
        } finally {
            setResending(false);
        }
    };

    // Step 3: Set New Password
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Ensure user verified recovery
        if (!hasVerifiedRecovery) {
            setError('You must verify your email recovery code before updating password.');
            setStep('request');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            setLoading(true);

            const { error: updateError } = await updateUserPassword(newPassword);

            if (updateError) {
                throw updateError;
            }

            setSuccess('Password updated successfully! Redirecting to login...');

            // Sign out the recovery session for a clean login state
            try {
                await signOut();
            } catch { }

            setTimeout(() => {
                navigate('/login');
            }, 1800);
        } catch (err) {
            console.error('Password update error:', err?.message || 'Unknown error');
            setError(err?.message || 'Unable to update password. Please try the recovery process again.');
        } finally {
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
                    {/* Background glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-400/5 blur-[60px] rounded-full pointer-events-none" />

                    <div className="relative z-10">
                        {/* ================= STEP 1: REQUEST OTP ================= */}
                        {step === 'request' && (
                            <>
                                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 text-center mb-1">
                                    Forgot Password
                                </h1>
                                <p className="text-gray-400 text-sm text-center mb-6">
                                    Enter your registered email to receive a 6-digit recovery code.
                                </p>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs mb-6 text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleRequestOtp} className="space-y-4">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-gray-900"
                                        />
                                    </div>

                                    {/* CAPTCHA Widget */}
                                    <CaptchaWidget
                                        ref={captchaRef}
                                        onVerify={(token) => setCaptchaToken(token)}
                                        onExpire={() => setCaptchaToken(null)}
                                        onError={() => setCaptchaToken(null)}
                                    />

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-extrabold py-4 rounded-xl mt-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-200/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Sending Code...</span>
                                            </>
                                        ) : (
                                            'Send Recovery Code →'
                                        )}
                                    </button>
                                </form>

                                <p className="text-center mt-6 text-sm text-gray-400">
                                    Remember your password?{' '}
                                    <Link to="/login" className="text-purple-600 font-bold hover:underline">
                                        Back to Login
                                    </Link>
                                </p>
                            </>
                        )}

                        {/* ================= STEP 2: VERIFY OTP ================= */}
                        {step === 'otp' && (
                            <>
                                <div className="text-center mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                                        <span className="material-symbols-outlined text-3xl">key</span>
                                    </div>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1">
                                        Enter Recovery Code
                                    </h1>
                                    <p className="text-gray-500 text-xs leading-relaxed max-w-xs mx-auto">
                                        Enter the 6-digit verification code sent to{' '}
                                        <span className="font-bold text-gray-900 block mt-0.5 font-mono text-sm">
                                            {maskEmail(email)}
                                        </span>
                                    </p>
                                </div>

                                {infoMsg && (
                                    <div className="bg-purple-50 border border-purple-200 text-purple-800 p-3 rounded-xl text-xs mb-5 text-center font-medium">
                                        {infoMsg}
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs mb-5 text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleVerifyOtp} className="space-y-6">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3 text-center">
                                            Enter Recovery Code (6–8 Digits)
                                        </label>
                                        <OtpInput
                                            length={8}
                                            value={otp}
                                            onChange={(val) => {
                                                setOtp(val);
                                                if (error) setError('');
                                            }}
                                            disabled={loading}
                                            error={Boolean(error)}
                                        />
                                    </div>

                                    {/* Fresh CAPTCHA for resend if required */}
                                    <CaptchaWidget
                                        ref={captchaRef}
                                        onVerify={(token) => setCaptchaToken(token)}
                                        onExpire={() => setCaptchaToken(null)}
                                        onError={() => setCaptchaToken(null)}
                                    />

                                    <button
                                        type="submit"
                                        disabled={loading || otp.trim().length < 6 || otp.trim().length > 8}
                                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-extrabold py-4 rounded-xl hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-200/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Verifying...</span>
                                            </>
                                        ) : (
                                            'Verify Code →'
                                        )}
                                    </button>
                                </form>

                                <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col items-center gap-3">
                                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                        <span>Didn't receive the code?</span>
                                        {cooldown > 0 ? (
                                            <span className="text-gray-400 font-semibold font-mono">
                                                Resend in {cooldown}s
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResend}
                                                disabled={resending}
                                                className="text-purple-600 font-bold hover:underline disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {resending && (
                                                    <span className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                                )}
                                                Resend Code
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('request');
                                            setError('');
                                            setInfoMsg('');
                                        }}
                                        className="text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors"
                                    >
                                        ← Try a different email
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ================= STEP 3: SET NEW PASSWORD ================= */}
                        {step === 'reset' && (
                            <>
                                <div className="text-center mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                                        <span className="material-symbols-outlined text-3xl">lock_reset</span>
                                    </div>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1">
                                        Set New Password
                                    </h1>
                                    <p className="text-gray-400 text-xs">
                                        Choose a strong password with at least 8 characters.
                                    </p>
                                </div>

                                {success && (
                                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs mb-6 text-center font-medium">
                                        ✓ {success}
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs mb-6 text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleUpdatePassword} className="space-y-4">
                                    {/* New Password */}
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                required
                                                minLength={8}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="At least 8 characters"
                                                className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 pr-12 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-gray-900"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                                                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showNewPassword ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                                            Confirm New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                required
                                                minLength={8}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Re-enter new password"
                                                className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 pr-12 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-gray-900"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                                                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showConfirmPassword ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || Boolean(success)}
                                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-extrabold py-4 rounded-xl mt-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-200/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Updating Password...</span>
                                            </>
                                        ) : (
                                            'Save New Password →'
                                        )}
                                    </button>
                                </form>

                                <p className="text-center mt-6 text-sm text-gray-400">
                                    <Link to="/login" className="text-purple-600 font-bold hover:underline">
                                        Cancel & Return to Login
                                    </Link>
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;