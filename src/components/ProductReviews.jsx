import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

/* ─── Star Icon (filled / outlined) ────────────────────────────────────────── */
const StarIcon = ({ filled, half, size = 20, onClick, onMouseEnter, onMouseLeave, interactive }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? '#facc15' : half ? 'url(#halfGrad)' : 'none'}
        stroke={filled || half ? '#facc15' : '#d1d5db'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={interactive ? 'cursor-pointer transition-transform hover:scale-125' : ''}
        style={{ flexShrink: 0 }}
    >
        {half && (
            <defs>
                <linearGradient id="halfGrad">
                    <stop offset="50%" stopColor="#facc15" />
                    <stop offset="50%" stopColor="transparent" />
                </linearGradient>
            </defs>
        )}
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

/* ─── Star Rating Display ──────────────────────────────────────────────────── */
const StarRating = ({ rating, size = 18 }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) {
            stars.push(<StarIcon key={i} filled size={size} />);
        } else if (rating >= i - 0.5) {
            stars.push(<StarIcon key={i} half size={size} />);
        } else {
            stars.push(<StarIcon key={i} filled={false} size={size} />);
        }
    }
    return <div className="flex items-center gap-0.5">{stars}</div>;
};

/* ─── Interactive Star Selector ────────────────────────────────────────────── */
const StarSelector = ({ value, onChange }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
                <StarIcon
                    key={star}
                    filled={star <= (hover || value)}
                    size={28}
                    interactive
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                />
            ))}
            {value > 0 && (
                <span className="ml-2 text-sm font-semibold text-gray-600">
                    {value === 1 && 'Poor'}
                    {value === 2 && 'Fair'}
                    {value === 3 && 'Good'}
                    {value === 4 && 'Great'}
                    {value === 5 && 'Excellent'}
                </span>
            )}
        </div>
    );
};

/* ─── Rating Distribution Bar ──────────────────────────────────────────────── */
const RatingBar = ({ star, count, total }) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-4 text-right font-semibold text-gray-500">{star}</span>
            <StarIcon filled size={12} />
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="w-6 text-right text-gray-400 font-medium">{count}</span>
        </div>
    );
};

/* ─── Single Review Card ───────────────────────────────────────────────────── */
const ReviewCard = ({ review, isOwn, onDelete, deleting }) => {
    const date = new Date(review.created_at).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    // Generate consistent avatar color from user name
    const hue = review.user_name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

    return (
        <div className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-gray-100 hover:border-purple-100 hover:shadow-lg hover:shadow-purple-50/50 transition-all duration-300">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: `hsl(${hue}, 55%, 55%)` }}
                >
                    {review.user_name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-gray-800">{review.user_name}</span>
                            <span className="text-[10px] text-gray-300 font-medium">•</span>
                            <span className="text-[11px] text-gray-400">{date}</span>
                        </div>
                        {isOwn && (
                            <button
                                onClick={() => onDelete(review.id)}
                                disabled={deleting}
                                className="opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-600 font-semibold uppercase tracking-wider transition-all flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        )}
                    </div>

                    {/* Stars */}
                    <div className="mb-2">
                        <StarRating rating={review.rating} size={14} />
                    </div>

                    {/* Comment */}
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{review.comment}</p>
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

const ProductReviews = ({ productId }) => {
    const { user, session } = useAuth();

    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [distribution, setDistribution] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state
    const [formRating, setFormRating] = useState(0);
    const [formComment, setFormComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    // Check if user has already reviewed
    const userHasReviewed = user && reviews.some(r => r.user_id === user.id);

    /* ── Fetch Reviews ─────────────────────────────────────────────────────── */
    const fetchReviews = useCallback(async () => {
        if (!productId) return;
        try {
            setError(null);
            const res = await fetch(`/api/reviews/${productId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch reviews');
            setReviews(data.reviews || []);
            setAverageRating(data.averageRating || 0);
            setTotalCount(data.totalCount || 0);
            setDistribution(data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
        } catch (err) {
            console.error('Reviews fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    /* ── Submit Review ─────────────────────────────────────────────────────── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!session?.access_token) return;
        if (formRating === 0) { setSubmitError('Please select a star rating.'); return; }
        if (!formComment.trim()) { setSubmitError('Please write a comment.'); return; }

        setSubmitting(true);
        setSubmitError(null);

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    productId,
                    rating: formRating,
                    comment: formComment.trim()
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to submit review');

            // Success
            setSubmitSuccess(true);
            setFormRating(0);
            setFormComment('');
            await fetchReviews();

            setTimeout(() => setSubmitSuccess(false), 3000);
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    /* ── Delete Review ─────────────────────────────────────────────────────── */
    const handleDelete = async (reviewId) => {
        if (!session?.access_token) return;
        setDeletingId(reviewId);
        try {
            const res = await fetch(`/api/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete review');
            await fetchReviews();
        } catch (err) {
            console.error('Delete review error:', err);
        } finally {
            setDeletingId(null);
        }
    };

    /* ── Render ─────────────────────────────────────────────────────────────── */
    return (
        <section className="border-t border-gray-100 pt-16 mt-16">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-10">
                <span className="material-symbols-outlined text-purple-500 text-3xl">rate_review</span>
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
                        Customer Reviews
                    </h2>
                    <p className="text-gray-400 text-sm mt-0.5">
                        {totalCount > 0
                            ? `${totalCount} review${totalCount !== 1 ? 's' : ''} · ${averageRating} average`
                            : 'Be the first to review this product'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* ── Left: Summary + Write Form ───────────────────────────── */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Rating Summary Card */}
                    {totalCount > 0 && (
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="text-center">
                                    <p className="text-5xl font-black text-gray-900 leading-none">{averageRating}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">out of 5</p>
                                </div>
                                <div>
                                    <StarRating rating={averageRating} size={20} />
                                    <p className="text-xs text-gray-400 mt-1">{totalCount} review{totalCount !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                {[5, 4, 3, 2, 1].map(star => (
                                    <RatingBar key={star} star={star} count={distribution[star]} total={totalCount} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Write a Review Form */}
                    {user && !userHasReviewed ? (
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-400 text-lg">edit_note</span>
                                Write a Review
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                        Your Rating
                                    </label>
                                    <StarSelector value={formRating} onChange={setFormRating} />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                        Your Review
                                    </label>
                                    <textarea
                                        value={formComment}
                                        onChange={(e) => setFormComment(e.target.value)}
                                        placeholder="Share your experience with this product..."
                                        maxLength={1000}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none transition-all"
                                    />
                                    <p className="text-[10px] text-gray-300 text-right mt-1">
                                        {formComment.length}/1000
                                    </p>
                                </div>

                                {submitError && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                                        <span className="material-symbols-outlined text-red-400 text-lg">error</span>
                                        <p className="text-xs text-red-500 font-medium">{submitError}</p>
                                    </div>
                                )}

                                {submitSuccess && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100">
                                        <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                        <p className="text-xs text-green-600 font-medium">Review submitted successfully!</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting || formRating === 0}
                                    className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-tight transition-all flex items-center justify-center gap-2 shadow-md ${
                                        submitting || formRating === 0
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'
                                            : 'bg-gray-900 text-white hover:bg-gray-800 hover:scale-[1.01] active:scale-[0.99] shadow-gray-300'
                                    }`}
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit Review
                                            <span className="material-symbols-outlined text-lg">send</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : user && userHasReviewed ? (
                        <div className="bg-purple-50/50 backdrop-blur-sm rounded-2xl p-5 border border-purple-100">
                            <div className="flex items-center gap-2 text-purple-600">
                                <span className="material-symbols-outlined">verified</span>
                                <p className="text-sm font-semibold">You've reviewed this product</p>
                            </div>
                            <p className="text-xs text-purple-400 mt-1">Delete your review to submit a new one.</p>
                        </div>
                    ) : (
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                            <span className="material-symbols-outlined text-gray-300 text-4xl mb-3 block">lock</span>
                            <p className="text-sm font-bold text-gray-700 mb-1">Sign in to Review</p>
                            <p className="text-xs text-gray-400 mb-4">Share your experience with other buyers</p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-gray-300"
                            >
                                Sign In
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* ── Right: Reviews List ──────────────────────────────────── */}
                <div className="lg:col-span-8">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-white/50 rounded-2xl p-5 border border-gray-100 animate-pulse">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                                        <div className="flex-1 space-y-3">
                                            <div className="h-3 w-24 bg-gray-200 rounded" />
                                            <div className="h-2 w-20 bg-gray-100 rounded" />
                                            <div className="h-3 w-full bg-gray-100 rounded" />
                                            <div className="h-3 w-3/4 bg-gray-100 rounded" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <span className="material-symbols-outlined text-red-300 text-4xl mb-2 block">cloud_off</span>
                            <p className="text-sm text-gray-500">{error}</p>
                            <button onClick={fetchReviews} className="mt-3 text-xs font-bold text-purple-500 hover:underline">
                                Try Again
                            </button>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-50 mb-4">
                                <span className="material-symbols-outlined text-purple-300 text-4xl">forum</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-700 mb-1">No Reviews Yet</h3>
                            <p className="text-sm text-gray-400 max-w-xs mx-auto">
                                This product hasn't been reviewed yet. Be the first to share your thoughts!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map(review => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    isOwn={user?.id === review.user_id}
                                    onDelete={handleDelete}
                                    deleting={deletingId === review.id}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ProductReviews;
