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
                    <ul className="list-disc pl-5 text-[#b9cacb] space-y-2">
                        <li><span className="text-[#00eefc]">Email:</span> support@printingustad.com</li>
                        <li><span className="text-[#00eefc]">WhatsApp:</span> +91 98765 43210</li>
                        <li><span className="text-[#00eefc]">Business Hours:</span> Mon–Sat, 10am–7pm IST</li>
                    </ul>
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
                        <li>Disputes shall be resolved under the jurisdiction of the courts of Rajasthan, India.</li>
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
