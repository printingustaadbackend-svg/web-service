import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';

const Home = () => {
  const { addItem } = useCart();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('seasonal');
  const [dbProducts, setDbProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const slides = [
    {
      title: "Custom T-Shirts",
      subtitle: "Starting at ₹399 | Min. 1 piece",
      tag: "Premium Quality",
      img: "https://img-srv.arcprint.com/adpsSTG/category/1774075905173_290.jpg/full/1920,/0/default.webp",
      color: "bg-gradient-to-r from-purple-900 to-purple-700"
    },
    {
      title: "Custom Photo Mugs",
      subtitle: "Starting at ₹230 | Min. 1 piece",
      tag: "Personalized",
      img: "https://img-srv.arcprint.com/adpsSTG/category/1687877530935_150.jpg/full/1920,/0/default.webp",
      color: "bg-gradient-to-r from-orange-900 to-red-700"
    },
    {
      title: "Custom Water Bottles",
      subtitle: "Starting at ₹325 | Min. 1 piece",
      tag: "Bulk Orders Welcome",
      img: "https://img-srv.arcprint.com/adpsSTG/category/1681901382671_191.jpg/full/1920,/0/default.webp",
      color: "bg-gradient-to-r from-green-900 to-teal-700"
    },
    {
      title: "Acrylic Photo Frames",
      subtitle: "Starting at ₹450 | Min. 1 piece",
      tag: "Perfect Gift",
      img: "https://img-srv.arcprint.com/adpsSTG/category/1687872720138_892.jpg/full/1920,/0/default.webp",
      color: "bg-gradient-to-r from-purple-900 to-indigo-700"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      if (!supabase) { setProductsLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, base_price, base_image_url, min_order_quantity, categories(name)')
          .eq('is_active', true)
          .order('created_at', { ascending: true });
        if (error) throw error;
        setDbProducts(data || []);
      } catch (err) {
        console.error('Failed to load products:', err.message);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Map DB products into the tab format
  const mapProduct = (p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.base_price),
    minQty: p.min_order_quantity || 1,
    img: p.base_image_url || 'https://placehold.co/400x400/f3f0ff/6d28d9?text=Product',
    category: p.categories?.name || 'Products',
  });

  const allMapped = dbProducts.map(mapProduct);
  const products = {
    seasonal:   allMapped.slice(0, 5),
    bestseller: allMapped.slice(5, 10),
    trending:   allMapped.slice(10, 15),
  };

  return (
    <div className="bg-white">
      {/* Hero Banner Slider */}
      <section className="bg-gray-100 overflow-hidden">
        <div className="relative h-64 md:h-96 lg:h-[480px]">
          {slides.map((slide, idx) => (
            <div 
              key={idx} 
              className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'} ${slide.color} flex items-center`}
            >
              <img src={slide.img} className="absolute inset-0 w-full h-full object-cover opacity-40" alt={slide.title} />
              <div className="relative z-10 max-w-7xl mx-auto px-8 text-white">
                <p className="text-sm uppercase tracking-widest mb-2 opacity-80">{slide.tag}</p>
                <h2 className="text-4xl md:text-6xl font-bold leading-tight mb-4">{slide.title.split(' ').slice(0, 1)}<br/>{slide.title.split(' ').slice(1).join(' ')}</h2>
                <p className="text-lg opacity-80 mb-6">{slide.subtitle}</p>
                <Link to="/shop">
                  <button className="bg-white text-gray-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-400 hover:text-black transition-all">Order Now</button>
                </Link>
              </div>
            </div>
          ))}
          
          <button 
            onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)} 
            className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/60 backdrop-blur hover:bg-white rounded-xl w-12 h-12 flex items-center justify-center shadow-lg z-20 transition-all"
          >
            <span className="material-symbols-outlined text-purple-900">arrow_back</span>
          </button>
          <button 
            onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)} 
            className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/60 backdrop-blur hover:bg-white rounded-xl w-12 h-12 flex items-center justify-center shadow-lg z-20 transition-all"
          >
            <span className="material-symbols-outlined text-purple-900">arrow_forward</span>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-white scale-125' : 'bg-white/60'}`}
              ></button>
            ))}
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="bg-white py-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-4 overflow-x-auto pill-scroll pb-2">
            {[
              { name: 'Corporate Gifts', img: 'https://img-srv.arcprint.com/adpsSTG/category/1725621346185_454.jpg/full/400,400/0/default.webp' },
              { name: 'Apparels', img: 'https://img-srv.arcprint.com/adpsSTG/category/1774075905173_290.jpg/full/400,400/0/default.webp' },
              { name: 'Custom Mugs', img: 'https://img-srv.arcprint.com/adpsSTG/category/1687877530935_150.jpg/full/400,400/0/default.webp' },
              { name: 'Photo Gifts', img: 'https://img-srv.arcprint.com/adpsSTG/category/1687872720138_892.jpg/full/400,400/0/default.webp' },
              { name: 'Water Bottles', img: 'https://img-srv.arcprint.com/adpsSTG/category/1681901382671_191.jpg/full/400,400/0/default.webp' },
              { name: 'Visiting Cards', img: 'https://img-srv.arcprint.com/adpsSTG/category/1678351724818_367.jpg/full/400,400/0/default.webp' },
              { name: 'Diaries', img: 'https://img-srv.arcprint.com/adpsSTG/category/1720882534503_377.jpg/full/400,400/0/default.webp' },
              { name: 'Calendars', img: 'https://img-srv.arcprint.com/adpsSTG/category/1761832333077_818.jpg/full/400,400/0/default.webp' },
              { name: 'Wooden Frames', img: 'https://img-srv.arcprint.com/adpsSTG/category/1687874765305_638.jpg/full/400,400/0/default.webp' },
            ].map((cat, idx) => (
              <Link key={idx} to="/shop" className="flex flex-col items-center gap-2 flex-shrink-0 group">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-xl p-2 bg-purple-50 hover:bg-purple-100 border border-purple-100 group-hover:border-purple-300 transition-all">
                  <img src={cat.img} className="w-full h-full object-cover" alt={cat.name} />
                </div>
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Product Tabs */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">Curated Picks Just for You!</h2>
            <Link to="/shop" className="text-purple-600 text-sm font-medium hover:underline flex items-center gap-1">
              View all <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {['seasonal', 'bestseller', 'trending'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('bestseller', 'Best Sellers').replace('trending', 'Customer Favorites')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {productsLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : products[activeTab].length === 0 ? (
              <p className="col-span-5 text-center text-gray-400 py-8">No products found.</p>
            ) : (
              products[activeTab].map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                  <div className="relative overflow-hidden aspect-square bg-gray-50 product-card">
                    <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="card-overlay absolute bottom-0 left-0 right-0 bg-white/95 py-2 px-3 flex gap-2">
                      <button 
                        onClick={() => addItem({ id: p.id, name: p.name, price: p.price, quantity: 1, image: p.img, attributes: { size: 'Default' } })}
                        className="flex-1 bg-purple-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Add to Cart
                      </button>
                      <Link to={`/product/${p.id}`} className="flex-1 border border-purple-600 text-purple-600 text-xs font-semibold py-1.5 rounded-lg text-center hover:bg-purple-50 transition-colors">
                        Customize
                      </Link>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-800 leading-tight mb-1">{p.name}</h3>
                    <p className="text-purple-700 font-bold text-sm">₹{p.price.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-400">Min. qty: {p.minQty}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Branding Banner */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-2xl overflow-hidden h-64 md:h-96 bg-gradient-to-r from-gray-900 to-gray-700">
            <img src="https://img-srv.arcprint.com/adpsSTG/category/1720882568777_772.jpg/full/1920,/0/default.webp" className="absolute inset-0 w-full h-full object-cover opacity-30" alt="Branding" />
            <div className="absolute inset-0 flex flex-col md:flex-row items-center justify-between px-10 py-8">
              <div className="text-white text-center md:text-left">
                <p className="text-xs uppercase tracking-widest mb-3 opacity-70">Offer valid till 31st Dec, 2026</p>
                <h2 className="text-3xl md:text-5xl font-bold leading-tight">Turn Everyday<br/>Into A Branding<br/>Moment</h2>
              </div>
              <div className="text-white text-center mt-4 md:mt-0">
                <h3 className="text-4xl md:text-5xl font-bold mb-2">20% off</h3>
                <p className="text-lg font-light mb-6 opacity-80">on our Personal Diary</p>
                <Link to="/shop">
                  <button className="bg-white text-red-600 px-8 py-3 rounded-full font-semibold hover:bg-red-600 hover:text-white transition-all uppercase tracking-wide text-sm">Order Now</button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Buy More Save More */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-6">Scale Your Order, Maximize Savings</h2>
          <div className="flex flex-col lg:flex-row gap-4">
            <Link to="/shop" className="relative rounded-2xl overflow-hidden flex-1 lg:max-w-[45%] block group">
              <img src="https://img-srv.arcprint.com/adpsSTG/category/1687877530935_150.jpg/full/600,600/0/default.webp" className="w-full aspect-square object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500" alt="Buy More Save More" />
              <div className="absolute top-0 left-0 p-6 text-white">
                <h3 className="text-4xl md:text-5xl font-bold leading-tight">Buy More.<br/>Save More</h3>
                <p className="text-lg opacity-80 mt-2 hidden md:block">Volume discounts on all orders!</p>
                <span className="mt-4 inline-block bg-red-600 text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-red-700">Order Now</span>
              </div>
            </Link>
            <div className="flex flex-col flex-1 gap-4">
              <Link to="/shop" className="relative rounded-2xl overflow-hidden block group">
                <img src="https://img-srv.arcprint.com/adpsSTG/category/1725621346185_454.jpg/full/600,300/0/default.webp" className="w-full aspect-[2/1] object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500" alt="Custom Packaging" />
                <div className="absolute top-0 left-0 p-4 text-white">
                  <span className="bg-white/20 text-xs px-3 py-1 rounded-full">Corporate Kits</span>
                  <h3 className="text-xl md:text-2xl font-semibold mt-2 leading-tight">Shop Smart,<br/>Save Big!</h3>
                </div>
              </Link>
              <div className="flex gap-4 flex-1">
                <Link to="/shop" className="relative rounded-2xl overflow-hidden flex-1 block group">
                  <img src="https://img-srv.arcprint.com/adpsSTG/category/1678351724818_367.jpg/full/300,300/0/default.webp" className="w-full aspect-square object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500" alt="Visiting Cards" />
                  <div className="absolute top-0 left-0 p-3 text-gray-800">
                    <h4 className="text-base md:text-lg font-semibold leading-tight">More Cards,<br/>More Impact</h4>
                  </div>
                </Link>
                <Link to="/shop" className="relative rounded-2xl overflow-hidden flex-1 block group">
                  <img src="https://img-srv.arcprint.com/adpsSTG/category/1725621427039_318.jpg/full/300,300/0/default.webp" className="w-full aspect-square object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500" alt="Diary Gift Set" />
                  <div className="absolute top-0 left-0 p-3 text-white">
                    <h4 className="text-base md:text-lg font-semibold leading-tight">Refined.<br/>Ready. Gifted.</h4>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-10 bg-white border-t border-gray-100/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8">Experience Quality Like Never Before</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { title: 'Premium Quality', desc: 'ISO certified printing with precision guarantee', icon: 'verified', color: 'bg-purple-50', iconColor: 'text-purple-600' },
              { title: 'Fast Delivery', desc: '3-5 business day turnaround across India', icon: 'local_shipping', color: 'bg-green-50', iconColor: 'text-green-600' },
              { title: 'Best Prices', desc: 'Bulk discounts with no minimum MOQ on many products', icon: 'payments', color: 'bg-orange-50', iconColor: 'text-orange-600' },
              { title: '24/7 Support', desc: 'Dedicated support via chat, call and email', icon: 'support_agent', color: 'bg-purple-50', iconColor: 'text-purple-600' },
            ].map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3">
                <div className={`w-14 h-14 ${feature.color} rounded-full flex items-center justify-center`}>
                  <span className={`material-symbols-outlined ${feature.iconColor} text-2xl`}>{feature.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-800">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
