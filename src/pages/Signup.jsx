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

const Signup = () => {
    // Form inputs
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Flow state: 'form' | 'otp'
    const [step, setStep] = useState('form');

    // OTP state
    const [otp, setOtp] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [resendMsg, setResendMsg] = useState('');

    // CAPTCHA token and ref
    const [captchaToken, setCaptchaToken] = useState(null);
    const captchaRef = useRef(null);

    // UI feedback
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const { signUp, verifyOtp, resendOtp } = useAuth();
    const navigate = useNavigate();

    // Cooldown countdown timer for resending OTP
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    // Handle initial registration form submit
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResendMsg('');

        const cleanEmail = email.trim().toLowerCase();
        const cleanName = fullName.trim();

        if (!cleanName) {
            setError('Please enter your full name.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            setLoading(true);

            const options = {
                data: {
                    full_name: cleanName,
                },
            };

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

            if (tokenToUse) {
                options.captchaToken = tokenToUse;
            }

            const { data, error: signUpError } = await signUp({
                email: cleanEmail,
                password,
                options,
            });

            if (signUpError) {
                throw signUpError;
            }

            // Move to OTP verification step
            setStep('otp');
            setOtp('');
            setCooldown(RESEND_COOLDOWN_SECONDS);
            setCaptchaToken(null);
            captchaRef.current?.reset();
        } catch (err) {
            console.error('Signup error:', err);

            // Reset CAPTCHA widget for fresh attempt
            setCaptchaToken(null);
            captchaRef.current?.reset();

            const msg = err?.message || 'Unable to create account.';
            if (msg.toLowerCase().includes('already registered')) {
                setError('An account with this email already exists. Please log in instead.');
            } else if (msg.toLowerCase().includes('captcha')) {
                setError('CAPTCHA check failed. Ensure "localhost" is added to your Allowed Domains in hCaptcha / Turnstile dashboard, and verify that the Secret Key in Supabase Dashboard matches.');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP verification
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setResendMsg('');

        const code = otp.trim();
        if (code.length < 6 || code.length > 8) {
            setError('Please enter your complete verification code (6–8 digits).');
            return;
        }

        try {
            setLoading(true);

            const { data, error: verifyError } = await verifyOtp({
                email: email.trim().toLowerCase(),
                token: otp.trim(),
                type: 'signup',
            });

            if (verifyError) {
                throw verifyError;
            }

            // Successfully authenticated and verified!
            navigate('/profile');
        } catch (err) {
            console.error('OTP verification error:', err?.message || 'Unknown error');
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

    // Handle resending OTP code
    const handleResend = async () => {
        if (cooldown > 0 || resending) return;

        setError('');
        setResendMsg('');

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

            const { error: resendError } = await resendOtp({
                email: email.trim().toLowerCase(),
                type: 'signup',
                options,
            });

            if (resendError) {
                throw resendError;
            }

            setResendMsg('A new verification code has been sent to your email.');
            setCooldown(RESEND_COOLDOWN_SECONDS);
            setCaptchaToken(null);
            captchaRef.current?.reset();
        } catch (err) {
            console.error('Resend OTP error:', err?.message || 'Unknown error');
            setError(err?.message || 'Unable to resend code. Please try again.');
            setCaptchaToken(null);
            captchaRef.current?.reset();
        } finally {
            setResending(false);
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
                        {step === 'form' ? (
                            <>
                                {/* Heading */}
                                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 text-center mb-1">
                                    Create Account
                                </h1>
                                <p className="text-gray-400 text-sm text-center mb-6">
                                    Save your designs and track your orders.
                                </p>

                                {/* Error */}
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs mb-6 text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleFormSubmit} className="space-y-4">
                                    {/* Full Name */}
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-gray-900"
                                        />
                                    </div>

                                    {/* Email */}
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

                                    {/* Password */}
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                minLength={8}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="At least 8 characters"
                                                className="w-full bg-gray-50 border border-gray-200 px-4 py-3.5 pr-12 rounded-xl text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all text-gray-900"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? '🙈' : '👁️'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-2">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                required
                                                minLength={8}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Re-enter password"
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

                                    {/* CAPTCHA Widget */}
                                    <CaptchaWidget
                                        ref={captchaRef}
                                        onVerify={(token) => setCaptchaToken(token)}
                                        onExpire={() => setCaptchaToken(null)}
                                        onError={() => setCaptchaToken(null)}
                                    />

                                    {/* Create Account button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-extrabold py-4 rounded-xl mt-2 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-200/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Creating Account...</span>
                                            </>
                                        ) : (
                                            'Create Account →'
                                        )}
                                    </button>
                                </form>

                                {/* Login link */}
                                <p className="text-center mt-6 text-sm text-gray-400">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-purple-600 font-bold hover:underline">
                                        Login
                                    </Link>
                                </p>
                            </>
                        ) : (
                            <>
                                {/* Step 2: Email OTP Verification */}
                                <div className="text-center mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                                        <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                                    </div>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-1">
                                        Verify Your Email
                                    </h1>
                                    <p className="text-gray-500 text-xs leading-relaxed max-w-xs mx-auto">
                                        We sent a 6-digit verification code to{' '}
                                        <span className="font-bold text-gray-900 block mt-0.5 font-mono text-sm">
                                            {maskEmail(email)}
                                        </span>
                                    </p>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs mb-5 text-center font-medium">
                                        {error}
                                    </div>
                                )}

                                {resendMsg && (
                                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs mb-5 text-center font-medium">
                                        ✓ {resendMsg}
                                    </div>
                                )}

                                <form onSubmit={handleVerifyOtp} className="space-y-6">
                                    <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block mb-3 text-center">
                                            Enter Verification Code (6–8 Digits)
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

                                    {/* Optional fresh CAPTCHA for resend if required */}
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
                                                <span>Verifying Code...</span>
                                            </>
                                        ) : (
                                            'Verify & Activate Account →'
                                        )}
                                    </button>
                                </form>

                                {/* Resend & back options */}
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
                                            setStep('form');
                                            setError('');
                                            setResendMsg('');
                                        }}
                                        className="text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors"
                                    >
                                        ← Edit email address
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;