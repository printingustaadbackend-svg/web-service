import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

// ─── Status badge helpers ────────────────────────────────────────
const orderStatusColors = {
  pending: 'bg-blue-500/10 text-blue-400 border-blue-400/20',
  processing: 'bg-amber-500/10 text-amber-400 border-amber-400/20',
  completed: 'bg-green-500/10 text-green-400 border-green-400/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-400/20',
};
const roleColors = {
  admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  manager: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  customer: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

// ─── Stat Card ───────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = 'cyan' }) => {
  const colors = {
    cyan: { icon: 'text-cyan-400', glow: 'shadow-cyan-400/10', border: 'border-cyan-400/10' },
    purple: { icon: 'text-purple-400', glow: 'shadow-purple-400/10', border: 'border-purple-400/10' },
    amber: { icon: 'text-amber-400', glow: 'shadow-amber-400/10', border: 'border-amber-400/10' },
    green: { icon: 'text-green-400', glow: 'shadow-green-400/10', border: 'border-green-400/10' },
  };
  const c = colors[color];
  return (
    <div className={`bg-[#1a1a1a] rounded-2xl border ${c.border} p-6 shadow-xl ${c.glow} hover:scale-[1.02] transition-transform`}>
      <span className={`material-symbols-outlined text-3xl ${c.icon} mb-3 block`}>{icon}</span>
      <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
      <p className="text-sm font-bold text-white/60 mt-1">{label}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  );
};

// ─── TABS ────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Overview',       icon: 'dashboard' },
  { id: 'orders',    label: 'Orders',          icon: 'receipt_long' },
  { id: 'products',  label: 'Products',        icon: 'inventory_2' },
  { id: 'inventory', label: 'Inventory',       icon: 'warehouse' },
  { id: 'users',     label: 'Users',           icon: 'group' },
  { id: 'bulk',      label: 'Bulk Enquiries',  icon: 'inventory_2' },
];

// ════════════════════════════════════════════════════════════════
const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('overview');

  // ── Shared data states ──
  const [orders, setOrders]       = useState([]);
  const [products, setProducts]   = useState([]);
  const [variants, setVariants]   = useState([]);
  const [users, setUsers]         = useState([]);
  const [invTx, setInvTx]         = useState([]);
  const [bulkEnquiries, setBulkEnquiries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [updatingBulkId, setUpdatingBulkId] = useState(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    base_price: '',
    min_order_quantity: 1,
    base_image_url: '',
    gallery_images: '',
    category_id: '',
    is_active: true,
  });
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState('');

  // ── Fetch all data ──
  const fetchAll = useCallback(async () => {
    if (!supabase || !isAdmin) return;
    setLoading(true);
    try {
      const [ordersRes, productsRes, variantsRes, usersRes, txRes, bulkRes, categoriesRes] = await Promise.all([
        supabase.from('orders')
          .select('*, profiles(full_name), order_items(*, products(name))')
          .order('created_at', { ascending: false }),
        supabase.from('products')
          .select('*, categories(name)')
          .order('created_at', { ascending: false }),
        supabase.from('product_variants')
          .select('*, products(name)')
          .order('stock_quantity', { ascending: true }),
        supabase.from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('inventory_transactions')
          .select('*, product_variants(sku, products(name))')
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('bulk_order_enquiries')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('categories')
          .select('*')
          .order('name', { ascending: true }),
      ]);
      if (ordersRes.data)   setOrders(ordersRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (variantsRes.data) setVariants(variantsRes.data);
      if (usersRes.data)    setUsers(usersRes.data);
      if (txRes.data)       setInvTx(txRes.data);
      if (bulkRes.data)     setBulkEnquiries(bulkRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchAll();
    // Realtime subscription
    const channel = supabase?.channel('admin-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, fetchAll)
      .subscribe();
    return () => supabase?.removeChannel(channel);
  }, [fetchAll]);

  // ── Update order status ──
  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert('Failed to update: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Toggle product active ──
  const toggleProductActive = async (productId, current) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', productId);
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_active: !current } : p));
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      base_price: '',
      min_order_quantity: 1,
      base_image_url: '',
      gallery_images: '',
      category_id: '',
      is_active: true,
    });
    setEditingProductId(null);
    setProductError('');
  };

  const openNewProduct = () => {
    resetProductForm();
    setIsProductModalOpen(true);
  };

  const openEditProduct = (product) => {
    const galleryList = Array.isArray(product.gallery_images)
      ? product.gallery_images.filter(Boolean).join('\n')
      : '';
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      base_price: product.base_price ?? '',
      min_order_quantity: product.min_order_quantity ?? 1,
      base_image_url: product.base_image_url || '',
      gallery_images: galleryList,
      category_id: product.category_id || '',
      is_active: product.is_active ?? true,
    });
    setEditingProductId(product.id);
    setProductError('');
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name.trim()) {
      setProductError('Product name is required.');
      return;
    }
    if (!productForm.base_price || Number(productForm.base_price) <= 0) {
      setProductError('Base price must be greater than 0.');
      return;
    }

    setProductSaving(true);
    setProductError('');
    try {
      const galleryImages = productForm.gallery_images
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim() || null,
        base_price: Number(productForm.base_price),
        min_order_quantity: Number(productForm.min_order_quantity) || 1,
        base_image_url: productForm.base_image_url.trim() || null,
        gallery_images: galleryImages,
        category_id: productForm.category_id || null,
        is_active: !!productForm.is_active,
        updated_at: new Date().toISOString(),
      };

      const request = async (url, method) => {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await res.text();
          if (text.trim().startsWith('<!DOCTYPE')) {
            throw new Error('Backend not running or API proxy not active. Start `npm run dev:all`.');
          }
          throw new Error('Unexpected response from server.');
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save product.');
      };

      if (editingProductId) {
        await request(`/api/admin/products/${editingProductId}`, 'PUT');
      } else {
        await request('/api/admin/products', 'POST');
      }

      setIsProductModalOpen(false);
      resetProductForm();
      fetchAll();
    } catch (err) {
      setProductError(err.message || 'Failed to save product.');
    } finally {
      setProductSaving(false);
    }
  };

  // ── Derived stats ──
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const lowStockCount = variants.filter(v => v.stock_quantity <= (v.low_stock_threshold || 10)).length;

  // ── Access guard ──
  if (!isAdmin) {
    return (
      <div className="bg-[#131313] min-h-screen text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#1a1a1a] rounded-3xl border border-red-500/20 p-10 shadow-2xl">
          <span className="material-symbols-outlined text-red-400 text-6xl mb-4 block">gpp_maybe</span>
          <h1 className="text-2xl font-extrabold mb-3">Access Denied</h1>
          <p className="text-white/50 mb-6">You need administrator privileges to view this page.</p>
          <Link to="/" className="bg-white/10 hover:bg-white/15 text-white px-6 py-3 rounded-xl font-bold transition-colors">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#131313] text-white min-h-screen">
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-extrabold">
                {editingProductId ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={() => { setIsProductModalOpen(false); resetProductForm(); }}
                className="text-white/50 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40">Name</label>
                <input
                  value={productForm.name}
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-2 w-full rounded-lg bg-[#131313] border border-white/10 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40">Base Price</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.base_price}
                  onChange={(e) => setProductForm(prev => ({ ...prev, base_price: e.target.value }))}
                  className="mt-2 w-full rounded-lg bg-[#131313] border border-white/10 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40">Min Order Qty</label>
                <input
                  type="number"
                  min="1"
                  value={productForm.min_order_quantity}
                  onChange={(e) => setProductForm(prev => ({ ...prev, min_order_quantity: e.target.value }))}
                  className="mt-2 w-full rounded-lg bg-[#131313] border border-white/10 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40">Category</label>
                <select
                  value={productForm.category_id}
                  onChange={(e) => setProductForm(prev => ({ ...prev, category_id: e.target.value }))}
                  className="mt-2 w-full rounded-lg bg-[#131313] border border-white/10 px-3 py-2 text-sm"
                >
                  <option value="">Uncategorized</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Image URL</label>
                <input
                  value={productForm.base_image_url}
                  onChange={(e) => setProductForm(prev => ({ ...prev, base_image_url: e.target.value }))}
                  className="mt-2 w-full rounded-lg bg-[#131313] border border-white/10 px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Gallery Images (one per line)</label>
                <textarea
                  rows={3}
                  value={productForm.gallery_images}
                  onChange={(e) => setProductForm(prev => ({ ...prev, gallery_images: e.target.value }))}
                  className="mt-2 w-full rounded-lg bg-[#131313] border border-white/10 px-3 py-2 text-sm"
                  placeholder="https://...\nhttps://..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Description</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-2 w-full rounded-lg bg-[#131313] border border-white/10 px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="product-active"
                  type="checkbox"
                  checked={productForm.is_active}
                  onChange={(e) => setProductForm(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <label htmlFor="product-active" className="text-sm text-white/60">Listed (active)</label>
              </div>
            </div>

            {productError && (
              <div className="mt-4 text-xs text-red-400">{productError}</div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => { setIsProductModalOpen(false); resetProductForm(); }}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={productSaving}
                className="px-5 py-2 rounded-lg bg-cyan-500 text-black text-sm font-bold disabled:opacity-50"
              >
                {productSaving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Header ── */}
      <div className="bg-[#1a1a1a] border-b border-white/5 px-6 py-5">
        <div className="max-w-[1300px] mx-auto">
          <nav className="text-xs text-white/30 mb-2 flex items-center gap-1 uppercase tracking-widest">
            <Link to="/" className="hover:text-white/60 transition-colors">Home</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-cyan-400 font-bold">Admin Dashboard</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Admin Panel</h1>
              <p className="text-white/40 text-sm mt-1">Manage your entire platform in one place</p>
            </div>
            <button onClick={fetchAll} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="bg-[#1a1a1a] border-b border-white/5 px-6">
        <div className="max-w-[1300px] mx-auto flex overflow-x-auto gap-1 pb-0 pill-scroll">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-all -mb-px ${
                tab === t.id
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[1300px] mx-auto px-6 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white/40 text-sm">Loading dashboard data...</p>
          </div>
        ) : (
          <>
            {/* ══ OVERVIEW ══════════════════════════════════════════ */}
            {tab === 'overview' && (
              <div className="space-y-10">
                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon="payments" label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} sub="Excluding cancelled" color="green" />
                  <StatCard icon="receipt_long" label="Total Orders" value={orders.length} sub={`${orders.filter(o=>o.status==='pending').length} pending`} color="cyan" />
                  <StatCard icon="inventory_2" label="Products" value={products.length} sub={`${products.filter(p=>p.is_active).length} active`} color="purple" />
                  <StatCard icon="group" label="Users" value={users.length} sub={`${users.filter(u=>u.role==='admin'||u.role==='manager').length} admins`} color="amber" />
                </div>

                {/* Low Stock Alert */}
                {lowStockCount > 0 && (
                  <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-5 flex items-center gap-4">
                    <span className="material-symbols-outlined text-amber-400 text-3xl">warning</span>
                    <div>
                      <p className="font-bold text-amber-300">{lowStockCount} variant{lowStockCount !== 1 ? 's' : ''} running low on stock</p>
                      <p className="text-sm text-amber-300/60">Check the Inventory tab to review low stock items.</p>
                    </div>
                    <button onClick={() => setTab('inventory')} className="ml-auto bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-sm font-bold px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
                      View Inventory
                    </button>
                  </div>
                )}

                {/* Recent Orders briefly */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-extrabold flex items-center gap-2">
                      <span className="material-symbols-outlined text-cyan-400">receipt_long</span>
                      Latest Orders
                    </h2>
                    <button onClick={() => setTab('orders')} className="text-sm text-cyan-400 font-bold hover:underline">View All →</button>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead>
                        <tr className="bg-black/30 text-[10px] uppercase tracking-widest text-white/30 border-b border-white/5">
                          <th className="p-4">Order</th><th className="p-4">Customer</th><th className="p-4">Amount</th><th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map(order => (
                          <tr key={order.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                            <td className="p-4 font-mono text-xs text-cyan-400">#{order.id.slice(0,8)}</td>
                            <td className="p-4 text-sm">{order.profiles?.full_name || 'Guest'}</td>
                            <td className="p-4 font-bold">₹{Number(order.total_amount).toLocaleString('en-IN')}</td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${orderStatusColors[order.status] || orderStatusColors.pending}`}>
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Order Status Breakdown */}
                <div>
                  <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-400">bar_chart</span>
                    Order Breakdown
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['pending','processing','completed','cancelled'].map(s => {
                      const count = orders.filter(o=>o.status===s).length;
                      const pct = orders.length ? Math.round((count/orders.length)*100) : 0;
                      return (
                        <div key={s} className={`bg-[#1a1a1a] border rounded-2xl p-5 border-white/5`}>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${orderStatusColors[s]}`}>{s}</span>
                          <p className="text-3xl font-extrabold mt-3">{count}</p>
                          <div className="w-full bg-white/5 rounded-full h-1.5 mt-2">
                            <div className="h-1.5 rounded-full bg-cyan-400" style={{width:`${pct}%`}} />
                          </div>
                          <p className="text-xs text-white/30 mt-1">{pct}% of all orders</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ══ ORDERS ══════════════════════════════════════════ */}
            {tab === 'orders' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-400">receipt_long</span>
                    All Orders <span className="text-white/30 font-normal text-sm ml-2">({orders.length})</span>
                  </h2>
                </div>
                {orders.length === 0 ? (
                  <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-20 text-center">
                    <span className="material-symbols-outlined text-6xl text-white/10 block mb-4">inbox</span>
                    <h3 className="text-xl font-bold text-white/40">No orders yet</h3>
                  </div>
                ) : (
                  <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                      <thead>
                        <tr className="bg-black/40 text-[10px] uppercase tracking-widest text-white/30 border-b border-white/5">
                          <th className="p-4">Order ID</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Items</th>
                          <th className="p-4">Design</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">AWB / Tracking</th>
                          <th className="p-4">Docs</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-center">Update</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 font-mono text-xs text-cyan-400">#{order.id.slice(0,8)}</td>
                            <td className="p-4 text-sm text-white/60">
                              {new Date(order.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'2-digit'})}
                            </td>
                            <td className="p-4 text-sm font-medium">{order.profiles?.full_name || 'Guest'}</td>
                            <td className="p-4 text-sm text-white/50">{order.order_items?.length || 0} item{order.order_items?.length !== 1 ? 's' : ''}</td>
                            <td className="p-4">
                              {(() => {
                                const itemWithDesign = order.order_items?.find(i => i.customizations?.previewUrl || i.customizations?.uploadedImageUrl);
                                const designUrl = itemWithDesign?.customizations?.previewUrl || itemWithDesign?.customizations?.uploadedImageUrl || null;
                                if (!designUrl) {
                                  return <span className="text-[10px] text-white/20">—</span>;
                                }
                                return (
                                  <a
                                    href={designUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-[10px] text-cyan-400 hover:underline"
                                  >
                                    <img
                                      src={designUrl}
                                      alt="Custom design"
                                      className="w-8 h-8 rounded-lg object-cover border border-white/10"
                                    />
                                    View
                                  </a>
                                );
                              })()}
                            </td>
                            <td className="p-4 font-extrabold">₹{Number(order.total_amount).toLocaleString('en-IN')}</td>
                            <td className="p-4">
                              {order.shipping_address?.awb_code ? (
                                <div>
                                  <p className="font-mono text-xs text-cyan-400">{order.shipping_address.awb_code}</p>
                                  {order.shipping_address.courier_name && <p className="text-[10px] text-white/30 mt-0.5">{order.shipping_address.courier_name}</p>}
                                  {order.shipping_address.tracking_url && (
                                    <a href={order.shipping_address.tracking_url} target="_blank" rel="noreferrer" className="text-[10px] text-purple-400 underline">Track →</a>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-white/20">—</span>
                              )}
                            </td>
                            <td className="p-4">
                              {order.shipping_address?.awb_code ? (
                                <div className="flex flex-col gap-1 text-[10px]">
                                  <a
                                    href={`/api/shiprocket/label/${order.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-cyan-400 hover:underline"
                                  >
                                    Label
                                  </a>
                                  <a
                                    href={`/api/shiprocket/manifest/${order.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-cyan-400 hover:underline"
                                  >
                                    Manifest
                                  </a>
                                  <a
                                    href={`/api/shiprocket/invoice/${order.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-cyan-400 hover:underline"
                                  >
                                    Invoice
                                  </a>
                                </div>
                              ) : (
                                <span className="text-[10px] text-white/20">—</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${orderStatusColors[order.status] || orderStatusColors.pending}`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <select
                                disabled={updatingId === order.id}
                                value={order.status}
                                onChange={e => updateOrderStatus(order.id, e.target.value)}
                                className="bg-[#131313] border border-white/10 rounded-lg text-xs py-1.5 px-2 outline-none focus:border-cyan-400 cursor-pointer disabled:opacity-50 transition-all"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══ PRODUCTS ══════════════════════════════════════════ */}
            {tab === 'products' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-400">inventory_2</span>
                    Products <span className="text-white/30 font-normal text-sm ml-2">({products.length})</span>
                  </h2>
                  <button
                    onClick={openNewProduct}
                    className="flex items-center gap-2 bg-cyan-500 text-black px-4 py-2 rounded-xl text-sm font-bold hover:bg-cyan-400 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Product
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {products.map(product => {
                    const productVariants = variants.filter(v => v.product_id === product.id);
                    const totalStock = productVariants.reduce((s,v) => s + (v.stock_quantity||0), 0);
                    return (
                      <div key={product.id} className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all">
                        <div className="relative h-40 bg-black/40 overflow-hidden">
                          <img
                            src={product.base_image_url || 'https://placehold.co/400x200/1a1a1a/ffffff?text=No+Image'}
                            alt={product.name}
                            className="w-full h-full object-cover opacity-70"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
                          <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${product.is_active ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'}`}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="p-5">
                          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{product.categories?.name || 'Uncategorized'}</p>
                          <h3 className="font-extrabold text-base leading-tight">{product.name}</h3>
                          <div className="flex items-center justify-between mt-4">
                            <div>
                              <p className="text-xl font-extrabold text-cyan-400">₹{Number(product.base_price).toLocaleString('en-IN')}</p>
                              <p className="text-xs text-white/30">{productVariants.length} variant{productVariants.length!==1?'s':''} · {totalStock} in stock</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditProduct(product)}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-white/20"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => toggleProductActive(product.id, product.is_active)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                                  product.is_active
                                    ? 'bg-red-400/10 text-red-400 border-red-400/20 hover:bg-red-400/20'
                                    : 'bg-green-400/10 text-green-400 border-green-400/20 hover:bg-green-400/20'
                                }`}
                              >
                                {product.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ INVENTORY ══════════════════════════════════════════ */}
            {tab === 'inventory' && (
              <div className="space-y-8">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400">warehouse</span>
                  Inventory & Stock
                </h2>

                {/* Low stock highlighted */}
                {variants.filter(v => v.stock_quantity <= (v.low_stock_threshold || 10)).length > 0 && (
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">warning</span>
                      Low Stock Alerts
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {variants.filter(v => v.stock_quantity <= (v.low_stock_threshold || 10)).map(v => (
                        <div key={v.id} className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-4">
                          <p className="font-bold text-sm">{v.products?.name}</p>
                          <p className="text-xs text-white/40 mt-0.5">SKU: {v.sku || '—'} {v.color && `· ${v.color}`} {v.size && `· ${v.size}`}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div>
                              <p className="text-2xl font-extrabold text-amber-400">{v.stock_quantity}</p>
                              <p className="text-[10px] text-white/30">in stock (threshold: {v.low_stock_threshold || 10})</p>
                            </div>
                            <span className="material-symbols-outlined text-amber-400 text-3xl">warning_amber</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All variants table */}
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-white/40 mb-3">All Variants</h3>
                  <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                      <thead>
                        <tr className="bg-black/40 text-[10px] uppercase tracking-widest text-white/30 border-b border-white/5">
                          <th className="p-4">Product</th>
                          <th className="p-4">SKU</th>
                          <th className="p-4">Color</th>
                          <th className="p-4">Size</th>
                          <th className="p-4">Stock</th>
                          <th className="p-4">Threshold</th>
                          <th className="p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map(v => {
                          const isLow = v.stock_quantity <= (v.low_stock_threshold || 10);
                          const isOut = v.stock_quantity === 0;
                          return (
                            <tr key={v.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${isOut ? 'opacity-60' : ''}`}>
                              <td className="p-4 text-sm font-medium">{v.products?.name || '—'}</td>
                              <td className="p-4 font-mono text-xs text-white/50">{v.sku || '—'}</td>
                              <td className="p-4 text-sm">{v.color || '—'}</td>
                              <td className="p-4 text-sm">{v.size || '—'}</td>
                              <td className={`p-4 font-extrabold text-lg ${isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-green-400'}`}>
                                {v.stock_quantity}
                              </td>
                              <td className="p-4 text-sm text-white/40">{v.low_stock_threshold || 10}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                                  isOut ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                                  isLow ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                                  'bg-green-400/10 text-green-400 border-green-400/20'
                                }`}>
                                  {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Transaction Log */}
                {invTx.length > 0 && (
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-white/40 mb-3">Recent Transactions</h3>
                    <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden overflow-x-auto">
                      <table className="w-full text-left min-w-[600px]">
                        <thead>
                          <tr className="bg-black/40 text-[10px] uppercase tracking-widest text-white/30 border-b border-white/5">
                            <th className="p-4">Date</th><th className="p-4">Product</th><th className="p-4">SKU</th><th className="p-4">Type</th><th className="p-4">Qty</th><th className="p-4">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invTx.map(tx => (
                            <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                              <td className="p-4 text-xs text-white/40">{new Date(tx.created_at).toLocaleDateString('en-IN')}</td>
                              <td className="p-4 text-sm">{tx.product_variants?.products?.name || '—'}</td>
                              <td className="p-4 font-mono text-xs text-white/40">{tx.product_variants?.sku || '—'}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${
                                  tx.transaction_type === 'RESTOCK' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
                                  tx.transaction_type === 'SALE' ? 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20' :
                                  tx.transaction_type === 'RETURN' ? 'bg-purple-400/10 text-purple-400 border-purple-400/20' :
                                  'bg-white/5 text-white/40 border-white/10'
                                }`}>{tx.transaction_type}</span>
                              </td>
                              <td className={`p-4 font-extrabold ${tx.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {tx.quantity > 0 ? '+' : ''}{tx.quantity}
                              </td>
                              <td className="p-4 text-xs text-white/30 max-w-[160px] truncate">{tx.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ BULK ENQUIRIES ══════════════════════════════════════════ */}
            {tab === 'bulk' && (() => {
              const statusColors = {
                new:       'bg-blue-400/10 text-blue-400 border-blue-400/20',
                contacted: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
                quoted:    'bg-purple-400/10 text-purple-400 border-purple-400/20',
                closed:    'bg-green-400/10 text-green-400 border-green-400/20',
              };
              const updateBulkStatus = async (id, status) => {
                setUpdatingBulkId(id);
                try {
                  const { error } = await supabase.from('bulk_order_enquiries').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
                  if (error) throw error;
                  setBulkEnquiries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
                } catch (err) {
                  alert('Failed: ' + err.message);
                } finally {
                  setUpdatingBulkId(null);
                }
              };
              return (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-extrabold flex items-center gap-2">
                      <span className="material-symbols-outlined text-purple-400">inventory_2</span>
                      Bulk Order Enquiries <span className="text-white/30 font-normal text-sm ml-2">({bulkEnquiries.length})</span>
                    </h2>
                    <span className="text-xs text-white/30 bg-blue-400/10 border border-blue-400/20 text-blue-400 font-bold px-3 py-1 rounded-full">
                      {bulkEnquiries.filter(e => e.status === 'new').length} new
                    </span>
                  </div>
                  {bulkEnquiries.length === 0 ? (
                    <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-20 text-center">
                      <span className="material-symbols-outlined text-6xl text-white/10 block mb-4">inbox</span>
                      <h3 className="text-xl font-bold text-white/40">No enquiries yet</h3>
                    </div>
                  ) : (
                    <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden overflow-x-auto">
                      <table className="w-full text-left min-w-[900px]">
                        <thead>
                          <tr className="bg-black/40 text-[10px] uppercase tracking-widest text-white/30 border-b border-white/5">
                            <th className="p-4">Date</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Contact</th>
                            <th className="p-4">Qty</th>
                            <th className="p-4">Categories</th>
                            <th className="p-4">Deadline</th>
                            <th className="p-4">Notes</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Update</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkEnquiries.map(enq => (
                            <tr key={enq.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${enq.status === 'new' ? 'bg-blue-400/[0.02]' : ''}`}>
                              <td className="p-4 text-xs text-white/40">{new Date(enq.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'2-digit'})}</td>
                              <td className="p-4">
                                <p className="text-sm font-bold">{enq.name}</p>
                                {enq.company && <p className="text-xs text-white/40">{enq.company}</p>}
                              </td>
                              <td className="p-4">
                                <a href={`mailto:${enq.email}`} className="text-xs text-cyan-400 hover:underline block">{enq.email}</a>
                                <a href={`tel:${enq.phone}`} className="text-xs text-white/40 hover:text-white block mt-0.5">{enq.phone}</a>
                              </td>
                              <td className="p-4 font-extrabold text-purple-400">{enq.quantity?.toLocaleString('en-IN')}</td>
                              <td className="p-4">
                                <div className="flex flex-wrap gap-1">
                                  {(enq.categories || []).map(c => (
                                    <span key={c} className="px-2 py-0.5 text-[9px] font-bold bg-white/5 border border-white/10 rounded-full uppercase tracking-wide">{c}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-4 text-xs text-white/50">{enq.deadline || '—'}</td>
                              <td className="p-4 text-xs text-white/40 max-w-[140px] truncate" title={enq.notes}>{enq.notes || '—'}</td>
                              <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${statusColors[enq.status] || statusColors.new}`}>
                                  {enq.status || 'new'}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <select
                                  disabled={updatingBulkId === enq.id}
                                  value={enq.status || 'new'}
                                  onChange={e => updateBulkStatus(enq.id, e.target.value)}
                                  className="bg-[#131313] border border-white/10 rounded-lg text-xs py-1.5 px-2 outline-none focus:border-purple-400 cursor-pointer disabled:opacity-50 transition-all"
                                >
                                  <option value="new">New</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="quoted">Quoted</option>
                                  <option value="closed">Closed</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ══ USERS ══════════════════════════════════════════ */}
            {tab === 'users' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-extrabold flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400">group</span>
                    Registered Users <span className="text-white/30 font-normal text-sm ml-2">({users.length})</span>
                  </h2>
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="bg-black/40 text-[10px] uppercase tracking-widest text-white/30 border-b border-white/5">
                        <th className="p-4">User</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Joined</th>
                        <th className="p-4">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => {
                        const initials = (u.full_name || 'U').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
                        const userOrderCount = orders.filter(o => o.user_id === u.id).length;
                        return (
                          <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <p className="text-sm font-bold">{u.full_name || <span className="text-white/30 italic">No name</span>}</p>
                                  <p className="text-xs text-white/30 font-mono">{u.id.slice(0,12)}…</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${roleColors[u.role] || roleColors.customer}`}>
                                {u.role || 'customer'}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-white/40">
                              {new Date(u.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}
                            </td>
                            <td className="p-4">
                              <span className="text-sm font-bold text-cyan-400">{userOrderCount}</span>
                              <span className="text-xs text-white/30 ml-1">order{userOrderCount!==1?'s':''}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
