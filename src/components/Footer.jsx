import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-50 pt-12 pb-6 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-10">
          {/* Brand Col */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Printing Ustad" className="h-10 w-auto object-contain" />
              <span className="font-bold text-lg text-gray-900">Printing Ustad</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">India's trusted custom printing platform for businesses, creators and individuals.</p>
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all">
                <span className="text-xs font-bold">f</span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all">
                <span className="text-xs font-bold">in</span>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-purple-400 hover:text-white transition-all">
                <span className="text-xs font-bold">tw</span>
              </a>
            </div>
          </div>
          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4 text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/shop" className="hover:text-gray-900">T-Shirts & Hoodies</Link></li>
              <li><Link to="/shop" className="hover:text-gray-900">Custom Mugs</Link></li>
              <li><Link to="/shop" className="hover:text-gray-900">Visiting Cards</Link></li>
              <li><Link to="/shop" className="hover:text-gray-900">Photo Frames</Link></li>
              <li><Link to="/shop" className="hover:text-gray-900">Water Bottles</Link></li>
            </ul>
          </div>
          {/* Categories */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4 text-sm">Categories</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/shop" className="hover:text-gray-900">Corporate Gifts</Link></li>
              <li><Link to="/shop" className="hover:text-gray-900">Caps & Accessories</Link></li>
              <li><Link to="/shop" className="hover:text-gray-900">Stationery</Link></li>
              <li><Link to="/shop" className="hover:text-gray-900">Photo Gifts</Link></li>
              <li><Link to="/shop" className="hover:text-gray-900">Calendars 2026</Link></li>
            </ul>
          </div>
          {/* Products */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4 text-sm">Products</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/shop" className="hover:text-gray-900">All Products</Link></li>
              <li><Link to="/shop" className="hover:text-gray-900">Best Sellers</Link></li>
              <li><Link to="/shop" className="hover:text-gray-900">New Arrivals</Link></li>
              <li><Link to="/customizer" className="hover:text-gray-900">Design Studio</Link></li>
              <li><Link to="/shop" className="hover:text-gray-900">Bulk Orders</Link></li>
            </ul>
          </div>
          {/* Company */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4 text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/info" className="hover:text-gray-900">About Us</Link></li>
              <li><Link to="/info" className="hover:text-gray-900">Contact Us</Link></li>
              <li><Link to="/info" className="hover:text-gray-900">Shipping Policy</Link></li>
              <li><Link to="/info" className="hover:text-gray-900">Returns & Refund</Link></li>
              <li><Link to="/info" className="hover:text-gray-900">Privacy Policy</Link></li>
              <li><Link to="/info" className="hover:text-gray-900">Terms of Use</Link></li>
            </ul>
          </div>
        </div>

        {/* Location Strip */}
        <div className="py-4 border-t border-gray-200 border-b border-gray-200 mb-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="font-medium text-gray-700 mr-2">We deliver to:</span>
            <span>Mumbai</span><span className="text-gray-300">|</span>
            <span>Delhi</span><span className="text-gray-300">|</span>
            <span>Bengaluru</span><span className="text-gray-300">|</span>
            <span>Hyderabad</span><span className="text-gray-300">|</span>
            <span>Chennai</span><span className="text-gray-300">|</span>
            <span>Kolkata</span><span className="text-gray-300">|</span>
            <span>Pune</span><span className="text-gray-300">|</span>
            <span>Jaipur</span><span className="text-gray-300">|</span>
            <span>Ahmedabad</span><span className="text-gray-300">|</span>
            <span>+ All India</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 Printing Ustad. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/info" className="hover:text-gray-900">Privacy Policy</Link>
            <Link to="/info" className="hover:text-gray-900">Terms of Use</Link>
            <Link to="/info" className="hover:text-gray-900">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
