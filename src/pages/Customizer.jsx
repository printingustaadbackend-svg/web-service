import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

const Customizer = () => {
    const { addItem } = useCart();
    
    // Canvas State
    const [canvasText, setCanvasText] = useState('PRINTING USTAD');
    const [fontFamily, setFontFamily] = useState("'Manrope', sans-serif");
    const [textColor, setTextColor] = useState('#111111');
    const [activeTool, setActiveTool] = useState('layers');

    const tools = [
        { id: 'layers', icon: 'layers', label: 'Layers' },
        { id: 'elements', icon: 'category', label: 'Elements' },
        { id: 'text', icon: 'title', label: 'Text' },
        { id: 'uploads', icon: 'upload_file', label: 'Uploads' },
        { id: 'apps', icon: 'grid_view', label: 'Apps' }
    ];

    const colors = [
        { name: 'Pitch Black', value: '#111111' },
        { name: 'Slate Gray', value: '#353534' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Yellow', value: '#eab308' }
    ];

    const handleAddToCart = () => {
        addItem({
            id: 'custom-print-001',
            name: 'Custom Studio Print',
            price: 899.00,
            quantity: 1,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxLYnwORZp4VWqBG6LahXcVhkv1YnhxxNoFi4BH4Ei4hkZtThUFdoDGxN6Jjh2zPVtU2XEdA8U9Bp0SlPwmTiNKNP5iy38jO0vnJasBQnrMG-86MFcYoLgeAqdX57U6ZEzMHmA3glpGmJSmvnkvcnxdBH8bE2wSteonl2YtduYesUbz-4uOHPbyoGpLxyt8g4ajoQZ0SCmiTU0wl5fekc77FfpFYp5tvfJS6C0D7DtWLQbgn-k5IWoa-WpOrV5ZvE_iFaTwn5F7iA',
            attributes: {
                customText: canvasText,
                font: fontFamily,
                finish: 'Matte'
            }
        });
        alert('Customized print added to cart!');
    };

    return (
        <div className="bg-[#131313] text-white overflow-hidden h-screen flex flex-col">
            <main className="flex-1 flex overflow-hidden">
                {/* Left Panel: Tools */}
                <aside className="w-20 border-r border-white/5 bg-neutral-950 flex flex-col items-center py-4 gap-4 z-40">
                    <div className="mb-4">
                        <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">Tools</span>
                    </div>
                    {tools.map((tool) => (
                        <button 
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all duration-200 ${activeTool === tool.id ? 'bg-neutral-800 text-[#00F0FF]' : 'text-neutral-500 hover:bg-neutral-800/50'}`}
                        >
                            <span className="material-symbols-outlined">{tool.icon}</span>
                        </button>
                    ))}
                    <div className="mt-auto flex flex-col gap-4 pb-4">
                        <button className="w-12 h-12 flex items-center justify-center text-neutral-500 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">help</span>
                        </button>
                    </div>
                </aside>

                {/* Center: Interactive Canvas Area */}
                <section className="flex-1 bg-[#0e0e0e] relative flex items-center justify-center p-6 md:p-12">
                    <div className="relative bg-white w-full max-w-2xl aspect-[3/4] shadow-2xl rounded-sm overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        
                        {/* Simulated Editable Element */}
                        <div className="relative group cursor-move border-2 border-cyan-400 p-4 select-none">
                            <h2 
                                className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#111111] tracking-tighter transition-all"
                                style={{ fontFamily: fontFamily, color: textColor }}
                            >
                                {canvasText.toUpperCase() || ' '}
                            </h2>
                            {/* Resize Handles */}
                            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-cyan-400 rounded-sm"></div>
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-cyan-400 rounded-sm"></div>
                            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-cyan-400 rounded-sm"></div>
                            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-cyan-400 rounded-sm"></div>
                        </div>

                        <div className="absolute bottom-8 right-8">
                            <div className="bg-[#2a2a2a] px-4 py-2 rounded-full border border-white/5 flex items-center gap-3">
                                <span className="text-[10px] uppercase tracking-widest text-neutral-400">Resolution</span>
                                <span className="text-xs font-bold text-white">300 DPI • PRO</span>
                            </div>
                        </div>
                    </div>

                    {/* Canvas Floating Toolbar */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                        <button className="p-3 text-neutral-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">zoom_in</span>
                        </button>
                        <div className="h-6 w-px bg-white/10 mx-1"></div>
                        <button className="p-3 text-neutral-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">fit_screen</span>
                        </button>
                        <button className="p-3 text-neutral-400 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">grid_on</span>
                        </button>
                    </div>
                </section>

                {/* Right Panel: Properties */}
                <aside className="hidden lg:flex w-80 border-l border-white/5 bg-neutral-950 flex-col p-6 gap-6 z-40 overflow-y-auto">
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest text-neutral-500">Selection</span>
                        <h3 className="text-xl font-bold text-[#f6f6f6]">Properties</h3>
                    </div>

                    {/* Property Group: Typography */}
                    <div className="flex flex-col gap-4">
                        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Edit Text</label>
                        <input 
                            className="w-full bg-[#1c1b1b] p-3 rounded-xl border border-white/10 text-sm font-semibold text-white outline-none focus:border-cyan-400 transition-all" 
                            type="text" 
                            value={canvasText}
                            onChange={(e) => setCanvasText(e.target.value)}
                        />

                        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Typography</label>
                        <div className="space-y-3">
                            <div className="relative">
                                <select 
                                    className="w-full appearance-none bg-[#1c1b1b] p-3 rounded-xl border border-white/10 text-sm font-semibold text-cyan-400 cursor-pointer focus:outline-none focus:border-cyan-400"
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                >
                                    <option value="'Manrope', sans-serif">Manrope</option>
                                    <option value="'Inter', sans-serif">Inter</option>
                                    <option value="'Outfit', sans-serif">Outfit</option>
                                    <option value="'Roboto', sans-serif">Roboto</option>
                                    <option value="monospace">Monospace</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400">
                                    <span className="material-symbols-outlined text-sm">expand_more</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Property Group: Color */}
                    <div className="flex flex-col gap-4">
                        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Fill Color</label>
                        <div className="grid grid-cols-6 gap-2">
                            {colors.map((c) => (
                                <button 
                                    key={c.value}
                                    onClick={() => setTextColor(c.value)}
                                    className={`aspect-square rounded-full ${c.bg || ''} border border-white/20 transition-all ${textColor === c.value ? 'scale-110 ring-2 ring-cyan-400 ring-offset-2 ring-offset-neutral-900 shadow-lg shadow-cyan-400/20' : 'hover:scale-110'}`}
                                    style={{ backgroundColor: c.value }}
                                />
                            ))}
                            <button className="aspect-square rounded-full border border-dashed border-white/20 flex items-center justify-center hover:bg-white/5 transition-colors">
                                <span className="material-symbols-outlined text-xs">add</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-4">
                        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Print Specifications</label>
                        <div className="flex flex-wrap gap-2">
                            {['Matte Finish', 'Giclée', 'Archival Ink'].map((tag) => (
                                <span key={tag} className="px-3 py-1 bg-[#353534] text-white text-[10px] font-bold rounded-full uppercase tracking-tighter">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <button 
                            onClick={handleAddToCart}
                            className="w-full bg-cyan-400 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-cyan-400/10"
                        >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
                            Add to Cart • ₹899.00
                        </button>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default Customizer;
