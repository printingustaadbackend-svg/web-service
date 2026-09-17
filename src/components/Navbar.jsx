import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import {
  CATEGORY_GROUPS,
  DEFAULT_SUBCAT_NAMES,
  SUBCATEGORY_META,
} from '../config/categoryNavigation';

const Navbar = () => {
  const { cartCount } = useCart();
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [navCategories, setNavCategories] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);
  const searchTimerRef = useRef(null);

  // Category navigation state
  const [activeCatDropdown, setActiveCatDropdown] = useState(null); // 'mega' | groupId | null
  const [mobileCatOpen, setMobileCatOpen] = useState(false);
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState(null);
  const categoryNavRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  // Close dropdowns on route change
  useEffect(() => {
    setActiveCatDropdown(null);
    setMobileCatOpen(false);
    setShowSearchDropdown(false);
    setDropdownOpen(false);
  }, [location.pathname, location.search]);

  // Live search: debounced query to Supabase
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2 || !supabase) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, base_price, base_image_url')
        .eq('is_active', true)
        .ilike('name', `%${query.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(6);

      if (!error && data) {
        setSearchResults(data);
        setShowSearchDropdown(data.length > 0);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounce search input
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    searchTimerRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle search submission (Enter or click)
  const handleSearch = () => {
    const query = searchInput.trim();
    if (query) {
      setShowSearchDropdown(false);
      setSearchResults([]);
      navigate(`/shop?search=${encodeURIComponent(query)}`);
      setSearchInput('');
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSearchDropdown(false);
    }
  };

  // Navigate to product from dropdown
  const handleSelectProduct = (productId) => {
    setShowSearchDropdown(false);
    setSearchResults([]);
    setSearchInput('');
    navigate(`/product/${productId}`);
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (categoryNavRef.current && !categoryNavRef.current.contains(e.target)) {
        setActiveCatDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Fetch categories from Supabase for the nav bar
  useEffect(() => {
    const decodeHtml = (value) => {
      if (!value) return '';
      if (typeof document === 'undefined') return value;
      const textarea = document.createElement('textarea');
      textarea.innerHTML = value;
      return textarea.value;
    };

    if (supabase) {
      supabase
        .from('categories')
        .select('name, slug')
        .then(({ data }) => {
          if (data && data.length > 0) {
            setNavCategories(data.map(c => ({ ...c, name: decodeHtml(c.name) })));
          }
        });
    }
  }, []);

  // Build hierarchical categories combining config and database
  const groupedCategories = useMemo(() => {
    const dbCatMap = new Map();
    navCategories.forEach(cat => {
      dbCatMap.set(cat.slug, cat.name);
    });

    const mappedSlugs = new Set();

    const groups = CATEGORY_GROUPS.map(group => {
      const subcategories = group.slugs.map(slug => {
        mappedSlugs.add(slug);
        return {
          slug,
          name: dbCatMap.get(slug) || DEFAULT_SUBCAT_NAMES[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        };
      });

      return {
        ...group,
        subcategories,
      };
    });

    // Capture any dynamically created DB categories not in default list
    const unmapped = navCategories.filter(cat => !mappedSlugs.has(cat.slug));
    if (unmapped.length > 0) {
      groups.push({
        id: 'more',
        name: 'More Categories',
        shortName: 'More',
        icon: 'more_horiz',
        description: 'Explore more custom printing items',
        slugs: unmapped.map(c => c.slug),
        subcategories: unmapped.map(c => ({
          slug: c.slug,
          name: c.name,
        })),
      });
    }

    return groups;
  }, [navCategories]);

  // Dropdown hover management with graceful debounce
  const handleCatMouseEnter = (id) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setActiveCatDropdown(id);
  };

  const handleCatMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveCatDropdown(null);
    }, 180);
  };

  const toggleCatDropdown = (id) => {
    setActiveCatDropdown(prev => (prev === id ? null : id));
  };

  const closeCategoryNav = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setActiveCatDropdown(null);
    setMobileCatOpen(false);
  };

  // Close user dropdown when clicking outside
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-purple-100 shadow-sm">
      {/* Top Bar */}
      <div className="bg-purple-950 text-purple-100 text-xs py-2 px-4 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden md:block font-medium">🇮🇳 India's Trusted Custom Printing Platform</span>
          <div className="flex items-center gap-6 text-xs">
            <a href="tel:+917011049502" className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors">
              <span className="material-symbols-outlined text-[15px]">call</span>
              <span>70110 49502</span>
            </a>
            <a href="mailto:support@printingustad.com" className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors">
              <span className="material-symbols-outlined text-[15px]">mail</span>
              <span>support@printingustad.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center flex-shrink-0">
          <img src="/logo.png" alt="Printing Ustad" className="h-13 w-auto max-h-12 object-contain" />
        </Link>

        {/* Search with Live Dropdown */}
        <div className="flex-1 max-w-xl mx-auto" ref={searchRef}>
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
              placeholder="Search for custom t-shirts, mugs, rings, phone cases..."
              className="w-full border border-gray-300 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
            />
            <button
              onClick={handleSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              aria-label="Search"
            >
              {searchLoading ? (
                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-xl">search</span>
              )}
            </button>

            {/* Search Results Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl shadow-purple-950/20 border border-purple-100 overflow-hidden z-50 animate-[fadeIn_0.15s_ease]">
                <div className="max-h-[380px] overflow-y-auto">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors text-left border-b border-gray-50 last:border-b-0"
                    >
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-purple-50 flex-shrink-0 border border-purple-100">
                        <img
                          src={product.base_image_url || 'https://placehold.co/80x80/ede9fe/7c3aed?text=P'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                        <p className="text-xs font-bold text-purple-600">₹{Number(product.base_price || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <span className="material-symbols-outlined text-gray-300 text-sm flex-shrink-0">arrow_forward</span>
                    </button>
                  ))}
                </div>
                {searchInput.trim().length >= 2 && (
                  <button
                    onClick={handleSearch}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-purple-50 transition-colors text-sm font-bold text-purple-600 border-t border-gray-100"
                  >
                    View all results for "{searchInput.trim()}"
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Nav Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/orders" className="hidden md:flex items-center gap-1.5 text-sm text-gray-600 hover:text-purple-600 transition-colors px-2 py-1 rounded-lg">
                <span className="material-symbols-outlined text-xl">receipt_long</span>
                <span className="hidden lg:block font-medium">Orders</span>
              </Link>

              {/* User Avatar Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="flex items-center gap-2 group p-1 rounded-full hover:bg-purple-50 transition-colors"
                  aria-label="User menu"
                  id="user-avatar-btn"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-white text-sm font-extrabold shadow-md group-hover:shadow-purple-300/40 transition-shadow">
                    {initials}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-bold text-gray-900 leading-tight max-w-[100px] truncate">
                      {profile?.full_name || 'My Account'}
                    </p>
                    <p className="text-[10px] text-gray-400 capitalize">{profile?.role || 'customer'}</p>
                  </div>
                  <span className={`material-symbols-outlined text-sm text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl shadow-purple-950/15 border border-purple-100 py-2 z-50 animate-[fadeIn_0.15s_ease]">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>

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
                className="flex items-center gap-1 text-sm text-gray-700 hover:text-purple-600 transition-colors px-2 py-1 font-medium"
              >
                <span className="material-symbols-outlined text-xl">person</span>
                <span className="hidden lg:block">Login</span>
              </Link>
              <Link
                to="/signup"
                className="hidden sm:inline-flex items-center bg-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Cart */}
          <Link
            to="/cart"
            className="relative flex items-center gap-1.5 text-sm text-gray-700 hover:text-purple-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-purple-50/50"
            id="cart-btn"
          >
            <span className="material-symbols-outlined text-xl">shopping_cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow">
                {cartCount}
              </span>
            )}
            <span className="hidden lg:block font-medium">Cart</span>
          </Link>
        </div>
      </div>

      {/* ─── CATEGORY NAVIGATION BAR (Dropdowns with Categories to Subcategories) ─── */}
      <nav
        ref={categoryNavRef}
        className="relative border-t border-gray-100 bg-gray-50/90 text-sm font-medium"
        aria-label="Product Categories Navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-between py-1.5">
            <div className="flex items-center gap-0.5">
              {/* "All Categories" Mega Menu Trigger */}
              <div
                className="relative"
                onMouseEnter={() => handleCatMouseEnter('mega')}
                onMouseLeave={handleCatMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => toggleCatDropdown('mega')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-bold transition-all ${
                    activeCatDropdown === 'mega'
                      ? 'bg-purple-700 text-white shadow-sm shadow-purple-200'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">grid_view</span>
                  <span>All</span>
                  <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${
                    activeCatDropdown === 'mega' ? 'rotate-180' : ''
                  }`}>
                    expand_more
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-gray-200 mx-1.5" />

              {/* Top Category Groups - compact text buttons */}
              {groupedCategories.map((group) => {
                const isOpen = activeCatDropdown === group.id;
                return (
                  <div
                    key={group.id}
                    className="relative"
                    onMouseEnter={() => handleCatMouseEnter(group.id)}
                    onMouseLeave={handleCatMouseLeave}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCatDropdown(group.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                        isOpen
                          ? 'text-purple-700 bg-purple-100/80'
                          : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/60'
                      }`}
                    >
                      {group.shortName}
                    </button>

                    {/* Single Group Dropdown Panel */}
                    {isOpen && (
                      <div
                        className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-2xl shadow-purple-950/20 border border-purple-100 p-2 z-[100] animate-[fadeIn_0.15s_ease]"
                        onMouseEnter={() => handleCatMouseEnter(group.id)}
                        onMouseLeave={handleCatMouseLeave}
                      >
                        {/* Dropdown Header */}
                        <div className="px-3 py-2 border-b border-gray-100 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-600 text-lg">{group.icon}</span>
                            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">{group.name}</p>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">{group.description}</p>
                        </div>

                        {/* Subcategories List */}
                        <div className="py-1 space-y-0.5">
                          {group.subcategories.map((subcat) => {
                            const meta = SUBCATEGORY_META[subcat.slug] || {};
                            return (
                              <Link
                                key={subcat.slug}
                                to={`/shop?category=${subcat.slug}`}
                                onClick={closeCategoryNav}
                                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors group/sub"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="material-symbols-outlined text-[17px] text-gray-400 group-hover/sub:text-purple-600 transition-colors">
                                    {meta.icon || 'circle'}
                                  </span>
                                  <span className="truncate">{subcat.name}</span>
                                </div>
                                {meta.popular && (
                                  <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    Hot
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>

                        {/* Footer Link */}
                        <div className="border-t border-gray-100 mt-1 pt-1.5">
                          <Link
                            to={`/shop?group=${group.id}`}
                            onClick={closeCategoryNav}
                            className="flex items-center justify-between px-3 py-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50/70 rounded-lg transition-colors"
                          >
                            <span>Browse all in {group.shortName}</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Divider + Quick Links on the Right */}
            <div className="flex items-center gap-3 text-xs flex-shrink-0">
              <Link
                to="/shop"
                onClick={closeCategoryNav}
                className="whitespace-nowrap text-gray-600 hover:text-purple-600 transition-colors font-semibold"
              >
                All Products
              </Link>
              <Link
                to="/bulk-order"
                onClick={closeCategoryNav}
                className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-2.5 py-1.5 rounded-lg shadow-sm hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                <span>Bulk Order</span>
                <span className="text-[8px] bg-amber-400 text-purple-950 font-extrabold px-1 rounded">40%</span>
              </Link>
              <Link
                to="/blog"
                onClick={closeCategoryNav}
                className="whitespace-nowrap text-gray-500 hover:text-purple-600 transition-colors font-medium"
              >
                Blog
              </Link>
            </div>
          </div>

          {/* ─── ALL CATEGORIES MEGA MENU PANEL (Desktop) ─── */}
          {activeCatDropdown === 'mega' && (
            <div
              className="hidden lg:block absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-2xl shadow-purple-950/20 border border-purple-100 p-6 z-[100] animate-[fadeIn_0.15s_ease]"
              onMouseEnter={() => handleCatMouseEnter('mega')}
              onMouseLeave={handleCatMouseLeave}
            >
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-purple-600 text-xl">category</span>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Browse Product Categories</h3>
                  </div>
                  <Link
                    to="/shop"
                    onClick={closeCategoryNav}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
                  >
                    <span>View Full Catalog</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>

                {/* Mega Menu Grid: 4 columns */}
                <div className="grid grid-cols-4 gap-6">
                  {groupedCategories.map((group) => (
                    <div key={group.id} className="space-y-2">
                      <Link
                        to={`/shop?group=${group.id}`}
                        onClick={closeCategoryNav}
                        className="flex items-center gap-2 text-xs font-bold text-gray-900 hover:text-purple-600 uppercase tracking-wider group/title"
                      >
                        <span className="material-symbols-outlined text-purple-600 text-lg group-hover/title:scale-110 transition-transform">
                          {group.icon}
                        </span>
                        <span>{group.name}</span>
                      </Link>

                      <ul className="space-y-1.5 pl-6 border-l-2 border-purple-50">
                        {group.subcategories.map((subcat) => {
                          const meta = SUBCATEGORY_META[subcat.slug] || {};
                          return (
                            <li key={subcat.slug}>
                              <Link
                                to={`/shop?category=${subcat.slug}`}
                                onClick={closeCategoryNav}
                                className="text-xs text-gray-600 hover:text-purple-600 hover:translate-x-1 transition-all inline-flex items-center gap-1.5"
                              >
                                <span>{subcat.name}</span>
                                {meta.popular && (
                                  <span className="text-[8px] font-extrabold bg-amber-100 text-amber-800 px-1 py-0.2 rounded uppercase">
                                    Hot
                                  </span>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Mobile / Tablet Category Navigation ─── */}
          <div className="lg:hidden py-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMobileCatOpen(prev => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200"
            >
              <span className="material-symbols-outlined text-[17px]">grid_view</span>
              <span>Categories</span>
              <span className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${mobileCatOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            <div className="flex items-center gap-2 overflow-x-auto pill-scroll text-xs font-semibold">
              <Link
                to="/shop"
                onClick={closeCategoryNav}
                className="px-2.5 py-1 rounded-md text-gray-700 hover:text-purple-600 whitespace-nowrap"
              >
                All Products
              </Link>
              <Link
                to="/bulk-order"
                onClick={closeCategoryNav}
                className="px-2.5 py-1 rounded-md bg-purple-600 text-white font-bold whitespace-nowrap"
              >
                Bulk Order
              </Link>
              <Link
                to="/blog"
                onClick={closeCategoryNav}
                className="px-2.5 py-1 rounded-md text-gray-600 hover:text-purple-600 whitespace-nowrap"
              >
                Blog
              </Link>
            </div>
          </div>

          {/* ─── Mobile Accordion Categories Drawer ─── */}
          {mobileCatOpen && (
            <div className="lg:hidden border-t border-purple-100 py-3 space-y-2 animate-[fadeIn_0.15s_ease] bg-white rounded-b-2xl shadow-xl px-2">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">
                Select a category
              </p>
              {groupedCategories.map((group) => {
                const isExpanded = mobileExpandedGroup === group.id;
                return (
                  <div key={group.id} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setMobileExpandedGroup(isExpanded ? null : group.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50/80 hover:bg-purple-50/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-600 text-lg">{group.icon}</span>
                        <span className="text-xs font-bold text-gray-800">{group.name}</span>
                      </div>
                      <span className={`material-symbols-outlined text-gray-400 text-sm transition-transform duration-200 ${
                        isExpanded ? 'rotate-180 text-purple-600' : ''
                      }`}>
                        expand_more
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="bg-white px-3 py-2 space-y-1 divide-y divide-gray-50">
                        {group.subcategories.map((subcat) => {
                          const meta = SUBCATEGORY_META[subcat.slug] || {};
                          return (
                            <Link
                              key={subcat.slug}
                              to={`/shop?category=${subcat.slug}`}
                              onClick={closeCategoryNav}
                              className="flex items-center justify-between py-2 text-xs text-gray-700 hover:text-purple-600"
                            >
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px] text-gray-400">
                                  {meta.icon || 'circle'}
                                </span>
                                <span>{subcat.name}</span>
                              </div>
                              {meta.popular && (
                                <span className="text-[8px] font-extrabold bg-amber-100 text-amber-800 px-1 py-0.5 rounded uppercase">
                                  Hot
                                </span>
                              )}
                            </Link>
                          );
                        })}
                        <div className="pt-2">
                          <Link
                            to={`/shop?group=${group.id}`}
                            onClick={closeCategoryNav}
                            className="block text-center text-xs font-bold text-purple-600 hover:text-purple-700 py-1"
                          >
                            View all {group.shortName} →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
