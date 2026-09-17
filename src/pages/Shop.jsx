import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';
import SEOHead from '../components/SEOHead';
import { CATEGORY_GROUPS } from '../config/categoryNavigation';

const defaultCategories = [
  { name: 'All Products', value: 'All' },
  { name: 'Apparel & Clothing', value: 'apparel' },
  { name: 'Accessories', value: 'accessories' },
  { name: 'Mugs & Drinkware', value: 'mugs' },
  { name: 'Gifts and Awards', value: 'gifts-and-award' },
  { name: 'Calendars', value: 'calendars' },
  { name: 'Best Seller', value: 'best-seller' },
  { name: 'Drinkware', value: 'drinkware' },
  { name: 'Notebooks & Diaries', value: 'notebooks-diaries' },
  { name: 'Pens – Premium', value: 'pens-premium' },
  { name: 'Clocks', value: 'clocks' },
];





const Shop = () => {
  const { addItem } = useCart();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeGroup, setActiveGroup] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });
  const [sortBy, setSortBy] = useState('default');

  const [categories, setCategories] = useState(defaultCategories);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        setLoading(true);
        // Ensure Supabase client is initialized
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*');

        let categorySlugMap = {};
        const decodeHtml = (value) => {
          if (!value) return '';
          if (typeof document === 'undefined') return value;
          const textarea = document.createElement('textarea');
          textarea.innerHTML = value;
          return textarea.value;
        };

        if (!catError && catData && catData.length > 0) {
          categorySlugMap = catData.reduce((acc, c) => {
            if (c?.id && c?.slug) acc[c.id] = c.slug;
            return acc;
          }, {});
          setCategories([
            { name: 'All Products', value: 'All' },
            ...catData.map(c => ({ name: decodeHtml(c.name), value: c.slug }))
          ]);
        }

        const { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('*, categories(slug)')
          .eq('is_active', true);


        if (!prodError && prodData && prodData.length > 0) {
          const mappedProducts = prodData.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.base_price) || 0,
            minQty: p.min_order_quantity || 1,
            cat: p.categories?.slug || categorySlugMap[p.category_id] || 'all',
            img: p.base_image_url || 'https://placehold.co/400x400/131313/ffffff?text=Product'
          }));
          setAllProducts(mappedProducts);
        }
      } catch (err) {
        console.error("Error fetching shop data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchShopData();

    // Realtime sync for products - watch for any changes to products or categories
    const productsChannel = supabase
      .channel('shop-data-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchShopData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchShopData)
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
    };
  }, []);

  // ── Sync category, group and search from URL query params ──
  useEffect(() => {
    const catParam = searchParams.get('category');
    const groupParam = searchParams.get('group');
    const searchParam = searchParams.get('search');

    if (catParam) {
      setActiveCategory(catParam);
      setActiveGroup(null);
    } else if (groupParam) {
      setActiveCategory('All');
      setActiveGroup(groupParam);
    } else {
      setActiveCategory('All');
      setActiveGroup(null);
    }

    // Pre-populate search from URL
    if (searchParam) {
      setSearchQuery(searchParam);
    } else {
      setSearchQuery('');
    }
    setPriceRange({ min: 0, max: Infinity });
  }, [searchParams]);

  const targetGroupObj = useMemo(() => {
    return activeGroup ? CATEGORY_GROUPS.find(g => g.id === activeGroup) : null;
  }, [activeGroup]);

  const filteredProducts = useMemo(() => {
    let result = allProducts.filter(p => {
      let matchCat = true;
      if (activeCategory !== 'All') {
        matchCat = p.cat === activeCategory;
      } else if (targetGroupObj) {
        matchCat = targetGroupObj.slugs.includes(p.cat);
      }

      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchPrice = p.price >= priceRange.min && p.price <= priceRange.max;
      return matchCat && matchSearch && matchPrice;
    });

    if (sortBy === 'low-high') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'high-low') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'name') result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [searchQuery, activeCategory, targetGroupObj, priceRange, sortBy, allProducts]);

  const resetAll = () => {
    setSearchQuery('');
    setActiveCategory('All');
    setActiveGroup(null);
    setPriceRange({ min: 0, max: Infinity });
    setSortBy('default');
  };

  // Active category label for breadcrumb/heading
  const activeCatLabel = activeCategory !== 'All'
    ? (categories.find(c => c.value === activeCategory)?.name || activeCategory)
    : targetGroupObj
      ? targetGroupObj.name
      : 'All Custom Products';

  return (
    <div className="bg-gray-50 min-h-screen">
      <SEOHead
        title="Shop Custom Printed Products"
        description="Browse our entire range of custom printed products. T-shirts, mugs, visiting cards, corporate gifts, water bottles, diaries & more. Fast delivery across India."
        keywords="buy custom products, custom t-shirts, personalized mugs, visiting cards online, corporate gifts India"
        canonical="/shop"
      />
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <nav className="text-xs text-gray-500 flex items-center gap-1">
          <Link to="/" className="hover:text-purple-600">Home</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <Link to="/shop" className="hover:text-purple-600">All Products</Link>
          {(activeCategory !== 'All' || targetGroupObj) && (
            <>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-gray-800 font-medium">{activeCatLabel}</span>
            </>
          )}
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-6 pb-16">
        {/* Sidebar */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Categories</h3>
                {(activeCategory !== 'All' || targetGroupObj) && (
                  <Link to="/shop" className="text-xs text-purple-600 hover:underline font-semibold">
                    Show All
                  </Link>
                )}
              </div>

              {/* All Products Link */}
              <Link
                to="/shop"
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold mb-2 transition-all ${
                  activeCategory === 'All' && !targetGroupObj
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-700 border border-gray-100'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">grid_view</span>
                  <span>All Products</span>
                </span>
                <span className="text-[11px] opacity-80">{allProducts.length}</span>
              </Link>

              {/* Grouped Categories Tree */}
              <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1 pill-scroll">
                {CATEGORY_GROUPS.map((group) => {
                  const isGroupActive = activeGroup === group.id;
                  const hasActiveChild = group.slugs.includes(activeCategory);

                  return (
                    <div key={group.id} className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                      <Link
                        to={`/shop?group=${group.id}`}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-colors ${
                          isGroupActive
                            ? 'bg-purple-50 text-purple-700'
                            : 'text-gray-800 hover:bg-purple-50/50 hover:text-purple-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="material-symbols-outlined text-[16px] text-purple-600">{group.icon}</span>
                          <span className="truncate">{group.shortName}</span>
                        </div>
                        <span className="material-symbols-outlined text-xs text-gray-400">chevron_right</span>
                      </Link>

                      {/* Subcategories */}
                      <ul className="py-1 px-2 space-y-0.5 border-t border-gray-50 bg-gray-50/40">
                        {group.slugs.map((slug) => {
                          const catObj = categories.find(c => c.value === slug);
                          const name = catObj?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                          const isChildActive = activeCategory === slug;

                          return (
                            <li key={slug}>
                              <Link
                                to={`/shop?category=${slug}`}
                                className={`flex items-center justify-between px-2.5 py-1 rounded-lg text-[11px] transition-colors ${
                                  isChildActive
                                    ? 'bg-purple-100/80 text-purple-700 font-bold'
                                    : 'text-gray-600 hover:text-purple-700 hover:bg-white'
                                }`}
                              >
                                <span className="truncate">{name}</span>
                                {isChildActive && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-bold text-sm text-gray-900 mb-3 uppercase tracking-wider">Price Range</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {[
                  { label: 'Under ₹100', min: 0, max: 100 },
                  { label: '₹100 – ₹500', min: 100, max: 500 },
                  { label: '₹500 – ₹1,000', min: 500, max: 1000 },
                  { label: '₹1,000+', min: 1000, max: Infinity },
                ].map((range, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => setPriceRange({ min: range.min, max: range.max })}
                      className={`hover:text-purple-600 w-full text-left transition-colors ${priceRange.min === range.min && priceRange.max === range.max ? 'text-purple-600 font-semibold' : ''}`}
                    >
                      {range.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Grid */}
        <main className="flex-1">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{activeCatLabel}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {filteredProducts.length === 0 ? 'No products found' : `Showing ${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search in main content for mobile simplicity or keep desktop search */}
              <div className="relative lg:hidden">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-purple-500"
              >
                <option value="default">Sort by: Featured</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="product-card bg-white rounded-3xl border border-purple-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden block">
                  <div className="relative overflow-hidden aspect-square bg-purple-50">
                    <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    {p.minQty > 1 && (
                      <span className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Min. {p.minQty}</span>
                    )}
                    <div className="card-overlay absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-2 flex gap-2">
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem({ id: p.id, name: p.name, price: p.price, quantity: 1, image: p.img, attributes: { size: 'Default' } }); }}
                        className="flex-1 bg-purple-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">add_shopping_cart</span> Add
                      </button>
                      <span
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1"
                      >
                        <Link to={`/product/${p.id}`} className="block border border-purple-600 text-purple-600 text-xs font-semibold py-2 rounded-lg text-center hover:bg-purple-50 transition-colors">
                          Customize
                        </Link>
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-800 leading-tight mb-1 line-clamp-2">{p.name}</h3>
                    <p className="text-purple-700 font-bold text-sm">₹{p.price.toLocaleString('en-IN')}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Min. qty: {p.minQty}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">search_off</span>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
              <p className="text-gray-500">Try a different search or category</p>
              <button
                onClick={resetAll}
                className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Show All Products
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Shop;
