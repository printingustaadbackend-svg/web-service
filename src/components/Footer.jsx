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
            
            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <a href="tel:+917011049502" className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors">
                <span className="material-symbols-outlined text-base text-purple-500">call</span>
                +91 70110 49502
              </a>
              <a href="https://wa.me/917011049502" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                <span className="material-symbols-outlined text-base text-green-500">chat</span>
                WhatsApp Us
              </a>
              <a href="mailto:support@printingustad.com" className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition-colors">
                <span className="material-symbols-outlined text-base text-purple-500">mail</span>
                support@printingustad.com
              </a>
            </div>

            <div className="flex gap-3">
              <a href="https://www.facebook.com/share/1EEf7EGPP7/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-purple-600 hover:text-white transition-all">
                <span className="text-xs font-bold">f</span>
              </a>
              <a href="https://www.instagram.com/printingustad.official" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all">
                <span className="text-xs font-bold">in</span>
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
              <li><Link to="/blog" className="hover:text-gray-900">Blog</Link></li>
              <li><Link to="/bulk-order" className="hover:text-gray-900">Bulk Orders</Link></li>
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

        {/* Google Maps Embed & Address */}
        <div className="py-6 border-t border-gray-200 border-b border-gray-200 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-purple-500">location_on</span>
                Our Locations
              </h4>
              <p className="text-sm text-gray-500 leading-relaxed mb-2">
                <span className="font-medium text-gray-700">HQ — Ghaziabad</span><br />
                Printing Ustad, Ghaziabad, Uttar Pradesh, India
              </p>
              <div className="text-xs text-gray-400 space-y-1 mb-2">
                <p>📍 <a href="https://share.google/etX79TlUEVNMV23XM" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors">Noida Branch</a></p>
                <p>📍 <a href="https://share.google/gT2Z5nkUCRhyAOUKW" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors">Gurugram Branch</a></p>
                <p>📍 <a href="https://maps.app.goo.gl/Nt7cmMpyQa1nD9UM8" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors">Greater Noida Branch</a></p>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                <span className="font-medium text-gray-600">Business Hours:</span> Mon–Sat, 10am–7pm IST
              </p>
            </div>
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <iframe
                title="Printing Ustad — Ghaziabad"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224346.48048835956!2d77.23701269453125!3d28.669856299999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cf1bced49bbb5%3A0x45e82fc8ceaborad!2sGhaziabad%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="180"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>

        {/* Location Strip */}
        <div className="py-4 border-b border-gray-200 mb-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="font-medium text-gray-700 mr-2">We deliver to:</span>
            <span>Ghaziabad</span><span className="text-gray-300">|</span>
            <span>Noida</span><span className="text-gray-300">|</span>
            <span>Greater Noida</span><span className="text-gray-300">|</span>
            <span>Gurugram</span><span className="text-gray-300">|</span>
            <span>Delhi NCR</span><span className="text-gray-300">|</span>
            <span>Mumbai</span><span className="text-gray-300">|</span>
            <span>Bengaluru</span><span className="text-gray-300">|</span>
            <span>Hyderabad</span><span className="text-gray-300">|</span>
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
