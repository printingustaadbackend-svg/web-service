import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const roleColors = {
  admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  manager: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  customer: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

const statusColors = {
  pending: 'bg-blue-500/10 text-blue-400 border-blue-400/20',
  processing: 'bg-amber-500/10 text-amber-400 border-amber-400/20',
  completed: 'bg-green-500/10 text-green-400 border-green-400/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-400/20',
};

const Profile = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [totalSpent, setTotalSpent] = useState(0);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [user, authLoading, navigate]);

  // Sync name from profile
  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile]);

  // Fetch recent orders + stats
  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*, products(name, base_image_url))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (error) throw error;
        setOrders(data || []);
        const spent = (data || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
        setTotalSpent(spent);
      } catch (err) {
        console.error('Profile orders fetch error:', err.message);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      setSaveMsg('✓ Name updated successfully!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      setSaveMsg('✗ Failed to update: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f7f5ff] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const initials = (profile?.full_name || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f5ff] via-white to-[#ede9fe] py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-8 flex items-center gap-1 uppercase tracking-widest font-bold">
          <Link to="/" className="hover:text-purple-600 transition-colors">Home</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-purple-600">My Profile</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ────────── LEFT: Profile Card ────────── */}
          <div className="lg:col-span-1 space-y-6">

            {/* Avatar + Identity */}
            <div className="bg-white rounded-3xl border border-purple-100 shadow-xl shadow-purple-100/40 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent pointer-events-none" />
              
              {/* Avatar */}
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-indigo-500 text-white text-3xl font-extrabold shadow-2xl shadow-purple-400/30 mb-4 mx-auto">
                {initials}
                <span className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 border-2 border-white rounded-full" title="Online" />
              </div>

              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {profile?.full_name || 'User'}
              </h1>
              <p className="text-sm text-gray-400 mt-1">{user.email}</p>

              {/* Role Badge */}
              <span className={`inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest border ${roleColors[profile?.role] || roleColors.customer}`}>
                <span className="material-symbols-outlined text-sm">
                  {profile?.role === 'admin' ? 'admin_panel_settings' : profile?.role === 'manager' ? 'manage_accounts' : 'person'}
                </span>
                {profile?.role || 'customer'}
              </span>

              <div className="mt-6 pt-6 border-t border-gray-100 text-left space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="material-symbols-outlined text-base text-purple-400">calendar_month</span>
                  <span>Joined <span className="text-gray-700 font-medium">{joinDate}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="material-symbols-outlined text-base text-purple-400">verified_user</span>
                  <span>Email{' '}
                    {user.email_confirmed_at
                      ? <span className="text-green-600 font-bold">Verified</span>
                      : <span className="text-amber-500 font-bold">Pending</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-purple-100 shadow-lg shadow-purple-50/50 p-5 text-center">
                <p className="text-3xl font-extrabold text-purple-600">{orders.length}</p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Orders</p>
              </div>
              <div className="bg-white rounded-2xl border border-purple-100 shadow-lg shadow-purple-50/50 p-5 text-center">
                <p className="text-3xl font-extrabold text-purple-600">₹{totalSpent.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Spent</p>
              </div>
            </div>

            {/* Edit Name */}
            <div className="bg-white rounded-3xl border border-purple-100 shadow-xl shadow-purple-100/40 p-6">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-500">edit</span>
                Edit Profile
              </h3>
              <form onSubmit={handleSaveName} className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-400 transition-all"
                    placeholder="Your full name"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-bold py-2.5 rounded-xl text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {saveMsg && (
                  <p className={`text-xs text-center font-bold ${saveMsg.startsWith('✓') ? 'text-green-500' : 'text-red-500'}`}>
                    {saveMsg}
                  </p>
                )}
              </form>
            </div>

            {/* Quick Links */}
            {(profile?.role === 'admin' || profile?.role === 'manager') && (
              <Link
                to="/admin"
                className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white rounded-2xl p-4 shadow-lg shadow-purple-200/60 hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                <div>
                  <p className="font-extrabold text-sm">Admin Dashboard</p>
                  <p className="text-xs opacity-80">Manage orders, products & users</p>
                </div>
                <span className="material-symbols-outlined ml-auto">arrow_forward</span>
              </Link>
            )}
          </div>

          {/* ────────── RIGHT: Recent Orders ────────── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-purple-100 shadow-xl shadow-purple-100/40 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-500">receipt_long</span>
                  Recent Orders
                </h2>
                <Link to="/orders" className="text-sm text-purple-600 font-bold hover:underline flex items-center gap-1">
                  View All
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              {loadingOrders ? (
                <div className="p-12 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-400">Loading your orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="material-symbols-outlined text-6xl text-gray-200 block mb-4">inbox</span>
                  <h3 className="text-lg font-bold text-gray-600 mb-2">No orders yet</h3>
                  <p className="text-sm text-gray-400 mb-6">Start designing and place your first order!</p>
                  <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 bg-purple-600 text-white font-bold px-6 py-3 rounded-full text-sm hover:bg-purple-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">store</span>
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <div key={order.id} className="p-6 hover:bg-purple-50/30 transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Order ID</p>
                          <p className="font-mono text-sm font-bold text-purple-600">#{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Date</p>
                          <p className="text-sm font-medium text-gray-700">
                            {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Total</p>
                          <p className="text-sm font-extrabold text-gray-900">₹{Number(order.total_amount).toLocaleString('en-IN')}</p>
                        </div>
                        <span className={`self-start mt-1 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${statusColors[order.status] || statusColors.pending}`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Items preview */}
                      <div className="flex gap-3 flex-wrap">
                        {order.order_items?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                            <img
                              src={item.products?.base_image_url || 'https://placehold.co/40x40/e9d5ff/7c3aed?text=P'}
                              alt={item.products?.name}
                              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                            />
                            <div>
                              <p className="text-xs font-semibold text-gray-700 leading-tight">{item.products?.name || 'Product'}</p>
                              <p className="text-[10px] text-gray-400">×{item.quantity}</p>
                            </div>
                          </div>
                        ))}
                        {(order.order_items?.length || 0) > 3 && (
                          <div className="flex items-center px-3 py-2 bg-purple-50 rounded-xl border border-purple-100">
                            <p className="text-xs text-purple-600 font-bold">+{order.order_items.length - 3} more</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
