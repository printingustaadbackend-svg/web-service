import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const Navbar = () => {
  const { cartCount } = useCart();
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [navCategories, setNavCategories] = useState([]);

  // Fetch categories from Supabase for the nav bar
  useEffect(() => {
    const decodeHtml = (value) => {
      if (!value) return '';
      if (typeof document === 'undefined') return value;
      const textarea = document.createElement('textarea');
      textarea.innerHTML = value;
      return textarea.value;
    };

    supabase
      .from('categories')
      .select('name, slug')
      .then(({ data }) => {
        if (data) {
          setNavCategories(data.map(c => ({ ...c, name: decodeHtml(c.name) })));
        }
      });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    navigate('/login');
    signOut();
  };

  const initials = (profile?.full_name || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-purple-100 shadow-sm">
      {/* Top Bar */}
      <div className="bg-purple-950 text-purple-100 text-xs py-2 px-4 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden md:block">🇮🇳 India's Trusted Custom Printing Platform</span>
          <div className="flex items-center gap-6">
            <a href="tel:9876543210" className="flex items-center gap-1 hover:text-yellow-400 transition-colors">
              <span className="material-symbols-outlined text-sm">call</span> 98765 43210
            </a>
            <a href="mailto:support@printingustad.com" className="flex items-center gap-1 hover:text-yellow-400 transition-colors">
              <span className="material-symbols-outlined text-sm">mail</span> support@printingustad.com
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0">
          <img src="/logo.png" alt="Printing Ustad" className="h-14 w-auto object-contain" />
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for products..."
              className="w-full border border-gray-300 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600">
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
          </div>
        </div>

        {/* Nav Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Orders link */}
              <Link to="/orders" className="hidden md:flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                <span className="material-symbols-outlined text-xl">receipt_long</span>
                <span className="hidden lg:block">Orders</span>
              </Link>

              {/* User Avatar Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="flex items-center gap-2 group"
                  aria-label="User menu"
                  id="user-avatar-btn"
                >
                  {/* Avatar circle */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-white text-sm font-extrabold shadow-md group-hover:shadow-purple-300/40 transition-shadow">
                    {initials}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-gray-900 leading-tight max-w-[100px] truncate">
                      {profile?.full_name || 'My Account'}
                    </p>
                    <p className="text-[10px] text-gray-400 capitalize">{profile?.role || 'customer'}</p>
                  </div>
                  <span className={`material-symbols-outlined text-sm text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl shadow-purple-100/60 border border-purple-100 py-2 z-50 animate-[fadeIn_0.15s_ease]">
                    {/* Profile header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>

                    {/* Links */}
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-purple-500">person</span>
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-purple-500">receipt_long</span>
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-600 font-bold hover:bg-purple-50 hover:text-purple-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                        Admin Dashboard
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                      >
                        <span className="material-symbols-outlined text-base">logout</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">person</span>
                <span className="hidden lg:block">Login</span>
              </Link>
              <Link
                to="/signup"
                className="hidden sm:block bg-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-purple-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Cart */}
          <Link to="/cart" className="relative flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors" id="cart-btn">
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
            <span className="hidden lg:block">Cart</span>
          </Link>
        </div>
      </div>

      {/* Category Nav — dynamic from Supabase */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-6 overflow-x-auto py-2 text-sm font-medium text-gray-700 pill-scroll">
            {/* All Products always first */}
            <Link to="/shop" className="whitespace-nowrap hover:text-purple-600 transition-colors flex-shrink-0">All Products</Link>

            {/* Dynamic categories from DB */}
            {navCategories.map(cat => (
              <Link
                key={cat.slug}
                to={`/shop?category=${cat.slug}`}
                className="whitespace-nowrap hover:text-purple-600 transition-colors flex-shrink-0"
              >
                {cat.name}
              </Link>
            ))}

            {/* Bulk Order always last */}
            <Link
              to="/bulk-order"
              className="whitespace-nowrap text-purple-600 font-semibold hover:underline transition-colors flex items-center gap-1 flex-shrink-0"
            >
              <span className="material-symbols-outlined text-base" style={{fontSize:'15px'}}>inventory_2</span>
              Bulk Order
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
