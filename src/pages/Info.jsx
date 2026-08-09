import React from 'react';
import { Link } from 'react-router-dom';

const Info = () => {
    return (
        <div className="bg-[#131313] text-white font-body selection:bg-cyan-400/30 selection:text-white">
            {/* Hero */}
            <section className="py-20 px-6 text-center border-b border-white/5 bg-[#0e0e0e]">
                <p className="text-xs uppercase tracking-[0.3em] text-[#00eefc] mb-4">Printing Ustad</p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">About & Support</h1>
                <p className="text-[#b9cacb] max-w-xl mx-auto text-lg">Everything you need to know about us, our policies, and how to get help.</p>
            </section>

            <main className="max-w-3xl mx-auto px-6 py-16">
                {/* About */}
                <div id="about" className="bg-[#1c1b1b] border border-white/5 rounded-2xl p-8 mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-cyan-400/20 pb-4">
                        <span className="material-symbols-outlined text-[#00eefc]">info</span>
                        About Printing Ustad
                    </h2>
                    <p className="text-[#b9cacb] leading-relaxed mb-4">
                        Printing Ustad is a premium custom printing studio built for brands, creators, and businesses who refuse to settle for ordinary. We combine cutting-edge digital printing technology with sustainably sourced materials to produce high-fidelity prints that look as good as they feel.
                    </p>
                    <p className="text-[#b9cacb] leading-relaxed mb-4">
                        Founded in India, our mission is simple: make world-class custom printing accessible to everyone — from solo creators to enterprise brands.
                    </p>
                    <ul className="list-disc pl-5 text-[#b9cacb] space-y-2">
                        <li>12,000+ satisfied customers worldwide</li>
                        <li>Precision DTG, screen-print, and sublimation techniques</li>
                        <li>100% sustainably sourced blanks</li>
                        <li>Typical turnaround: 3–5 business days</li>
                    </ul>
                </div>

                {/* Shipping */}
                <div id="shipping" className="bg-[#1c1b1b] border border-white/5 rounded-2xl p-8 mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-cyan-400/20 pb-4">
                        <span className="material-symbols-outlined text-[#00eefc]">local_shipping</span>
                        Shipping Policy
                    </h2>
                    <p className="text-[#b9cacb] mb-4">
                        We ship across India and internationally. All orders are processed within <span className="text-[#00eefc]">1–2 business days</span> of placement.
                    </p>
                    <ul className="list-disc pl-5 text-[#b9cacb] space-y-2">
                        <li><span className="text-[#00eefc]">Standard Delivery (India):</span> 3–5 business days — ₹49</li>
                        <li><span className="text-[#00eefc]">Express Delivery (India):</span> 1–2 business days — ₹129</li>
                        <li><span className="text-[#00eefc]">International:</span> 7–14 business days — rates at checkout</li>
                        <li>Free shipping on orders over ₹999</li>
                        <li>All orders come with tracking via email confirmation</li>
                    </ul>
                </div>

                {/* Returns */}
                <div id="returns" className="bg-[#1c1b1b] border border-white/5 rounded-2xl p-8 mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-cyan-400/20 pb-4">
                        <span className="material-symbols-outlined text-[#00eefc]">undo</span>
                        Returns & Refunds
                    </h2>
                    <p className="text-[#b9cacb] mb-4">
                        Since each product is <span className="text-[#00eefc]">custom-printed on demand</span>, we do not accept returns or exchanges for change-of-mind. However, we proudly stand behind our print quality.
                    </p>
                    <ul className="list-disc pl-5 text-[#b9cacb] space-y-2">
                        <li>If your product arrives damaged or with a printing defect, contact us within <span className="text-[#00eefc]">7 days</span> of delivery.</li>
                        <li>Send a photo of the issue to <span className="text-[#00eefc]">support@printingustad.com</span></li>
                        <li>We will reprint and reship at no extra cost, or issue a full refund.</li>
                        <li>Size/color issues due to user error at checkout are not eligible for return.</li>
                    </ul>
                </div>

                {/* Contact */}
                <div id="contact" className="bg-[#1c1b1b] border border-white/5 rounded-2xl p-8 mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-cyan-400/20 pb-4">
                        <span className="material-symbols-outlined text-[#00eefc]">mail</span>
                        Contact Us
                    </h2>
                    <p className="text-[#b9cacb] mb-4">We're a small, passionate team and we genuinely love hearing from our customers.</p>
                    
                    {/* Phone Numbers */}
                    <h3 className="text-sm font-semibold text-[#00eefc] mb-2 mt-4">📞 Call / WhatsApp</h3>
                    <ul className="list-disc pl-5 text-[#b9cacb] space-y-2 mb-4">
                        <li><a href="tel:+917011049502" className="hover:text-white transition-colors">+91 70110 49502</a> <span className="text-xs text-[#00eefc]">(Primary)</span></li>
                        <li><a href="tel:+917206117534" className="hover:text-white transition-colors">+91 72061 17534</a></li>
                        <li><a href="tel:+919992448375" className="hover:text-white transition-colors">+91 99924 48375</a></li>
                        <li><a href="tel:+919306140590" className="hover:text-white transition-colors">+91 93061 40590</a></li>
                        <li><a href="tel:+919485919176" className="hover:text-white transition-colors">+91 94859 19176</a></li>
                    </ul>

                    {/* Other Contact */}
                    <ul className="list-disc pl-5 text-[#b9cacb] space-y-2 mb-4">
                        <li><span className="text-[#00eefc]">Email:</span> <a href="mailto:support@printingustad.com" className="hover:text-white transition-colors">support@printingustad.com</a></li>
                        <li><span className="text-[#00eefc]">WhatsApp:</span> <a href="https://wa.me/917011049502" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">+91 70110 49502</a></li>
                        <li><span className="text-[#00eefc]">Business Hours:</span> Mon–Sat, 10am–7pm IST</li>
                    </ul>

                    {/* Social Links */}
                    <h3 className="text-sm font-semibold text-[#00eefc] mb-2 mt-4">🔗 Follow Us</h3>
                    <div className="flex gap-4 mb-6">
                        <a href="https://www.instagram.com/printingustad.official" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-lg text-white text-sm hover:scale-105 transition-transform">
                            Instagram
                        </a>
                        <a href="https://www.facebook.com/share/1EEf7EGPP7/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white text-sm hover:scale-105 transition-transform">
                            Facebook
                        </a>
                    </div>

                    {/* Branch Locations */}
                    <h3 className="text-sm font-semibold text-[#00eefc] mb-2 mt-4">📍 Our Locations</h3>
                    <ul className="list-disc pl-5 text-[#b9cacb] space-y-2 mb-6">
                        <li><span className="text-[#00eefc]">Ghaziabad (HQ):</span> <a href="https://share.google/FzAKNxrKSa1kAeQfs" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">View on Maps →</a></li>
                        <li><span className="text-[#00eefc]">Noida:</span> <a href="https://share.google/etX79TlUEVNMV23XM" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">View on Maps →</a></li>
                        <li><span className="text-[#00eefc]">Gurugram:</span> <a href="https://share.google/gT2Z5nkUCRhyAOUKW" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">View on Maps →</a></li>
                        <li><span className="text-[#00eefc]">Greater Noida:</span> <a href="https://maps.app.goo.gl/Nt7cmMpyQa1nD9UM8" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">View on Maps →</a></li>
                    </ul>
                    
                    {/* Google Maps Embed - Ghaziabad HQ */}
                    <div className="rounded-xl overflow-hidden border border-white/10">
                        <iframe
                            title="Printing Ustad — Ghaziabad HQ"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d224346.48048835956!2d77.23701269453125!3d28.669856299999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cf1bced49bbb5%3A0x45e82fc8ceaborad!2sGhaziabad%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                            width="100%"
                            height="250"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                </div>

                {/* Careers */}
                <div id="careers" className="bg-[#1c1b1b] border border-white/5 rounded-2xl p-8 mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-cyan-400/20 pb-4">
                        <span className="material-symbols-outlined text-[#00eefc]">work</span>
                        Careers
                    </h2>
                    <p className="text-[#b9cacb] mb-4">We're always looking for passionate people who care about craftsmanship, design, and building something meaningful. We are currently hiring for:</p>
                    <ul className="list-disc pl-5 text-[#b9cacb] space-y-2">
                        <li>Production Technician (DTG/Screen Print)</li>
                        <li>Full-Stack Developer (Node.js / React)</li>
                        <li>Customer Experience Lead</li>
                    </ul>
                    <p className="text-[#b9cacb] mt-4">Send your résumé to <span className="text-[#00eefc]">careers@printingustad.com</span></p>
                </div>

                {/* Privacy */}
                <div id="privacy" className="bg-[#1c1b1b] border border-white/5 rounded-2xl p-8 mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-cyan-400/20 pb-4">
                        <span className="material-symbols-outlined text-[#00eefc]">shield</span>
                        Privacy Policy
                    </h2>
                    <p className="text-[#b9cacb] mb-4">Your privacy matters. We collect only the information necessary to process your orders and improve your experience. We never sell your data to third parties.</p>
                    <ul className="list-disc pl-5 text-[#b9cacb] space-y-2">
                        <li>Personal data (name, address, email) is used only for order processing and communication.</li>
                        <li>We use cookies to maintain your cart session and improve site performance.</li>
                        <li>Payment information is processed via PCI-compliant gateways — we never store card details.</li>
                        <li>You may request deletion of your account data at any time by emailing us.</li>
                    </ul>
                </div>

                {/* Terms */}
                <div id="terms" className="bg-[#1c1b1b] border border-white/5 rounded-2xl p-8 mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-cyan-400/20 pb-4">
                        <span className="material-symbols-outlined text-[#00eefc]">gavel</span>
                        Terms of Service
                    </h2>
                    <p className="text-[#b9cacb] mb-4">By placing an order with Printing Ustad, you agree to the following terms:</p>
                    <ul className="list-disc pl-5 text-[#b9cacb] space-y-2">
                        <li>All custom designs must be original or properly licensed. We reserve the right to cancel orders containing copyrighted content.</li>
                        <li>Printing Ustad is not liable for typographical errors made by the customer in their submitted designs.</li>
                        <li>Prices are subject to change. The price shown at checkout is final at time of order.</li>
                        <li>Disputes shall be resolved under the jurisdiction of the courts of Uttar Pradesh, India.</li>
                    </ul>
                </div>
            </main>

            {/* Footer CTA */}
            <section className="border-t border-white/5 py-20 text-center bg-[#0e0e0e]">
                <h2 className="text-3xl font-extrabold mb-4">Ready to start creating?</h2>
                <p className="text-[#b9cacb] mb-8">Premium prints, fast turnaround, no minimums.</p>
                <div className="flex justify-center gap-4 flex-wrap">
                    <Link to="/shop">
                        <button className="bg-[#00eefc] text-black font-bold px-8 py-3 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-cyan-400/10">Browse Products</button>
                    </Link>
                    <Link to="/customizer">
                        <button className="border border-white/10 font-bold px-8 py-3 rounded-xl hover:bg-white/5 transition-all">Open Studio</button>
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Info;
