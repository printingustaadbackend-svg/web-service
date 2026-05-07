import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * CustomizationModal
 * Props:
 *  - product: { id, name, img, base_price, ... }
 *  - selectedVariant, selectedColor, selectedSize, quantity, effectivePrice
 *  - onClose()
 *  - onAddToCart(customizationData)
 */
// ── Product-type helpers ───────────────────────────────────────────────────────
const MUG_KEYWORDS    = ['mug', 'drinkware', 'bottle', 'cup', 'tumbler', 'sipper', 'flask'];
const APPAREL_KEYWORDS = ['shirt', 'tee', 't-shirt', 'tshirt', 'hoodie', 'polo', 'cap', 'jacket'];

function detectProductType(product) {
    const text = `${product?.name || ''} ${product?.cat || ''} ${product?.category || ''}`.toLowerCase();
    if (MUG_KEYWORDS.some(k => text.includes(k)))    return 'mug';
    if (APPAREL_KEYWORDS.some(k => text.includes(k))) return 'apparel';
    return 'other';
}

// Template images for clean product previews
const PRODUCT_TEMPLATES = {
    mug:    '/templates/blank_mug.png',
    apparel: '/templates/blank_tshirt.png',
};

const CustomizationModal = ({ product, selectedVariant, selectedColor, selectedSize, quantity, effectivePrice, onClose, onAddToCart }) => {
    const { user } = useAuth();
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // Detect product type to pick the right template
    const productType = detectProductType(product);
    const templateSrc = PRODUCT_TEMPLATES[productType] || null;

    // ── Cached image refs (avoid reloading on every render) ────────────────────
    const productImgRef = useRef(null);
    const userImgRef    = useRef(null);
    const productImgLoadedRef = useRef(false);

    const [uploadedFile,     setUploadedFile]     = useState(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState('');
    const [previewSrc,       setPreviewSrc]       = useState('');
    const [customDesignId,   setCustomDesignId]   = useState('');
    const [uploading,        setUploading]        = useState(false);
    const [uploadError,      setUploadError]      = useState('');
    const [addingToCart,     setAddingToCart]     = useState(false);
    // Whether to show clean template or original product photo
    const [useTemplate,     setUseTemplate]      = useState(!!templateSrc);

    // Print-zone state (0–1 relative to canvas) — tuned per product type
    const defaultPrintPos   = productType === 'mug' ? { x: 0.37, y: 0.42 } : { x: 0.5, y: 0.35 };
    const defaultPrintScale = productType === 'mug' ? 0.32 : 0.38;

    const [printPos,   setPrintPos]   = useState(defaultPrintPos);
    const [printScale, setPrintScale] = useState(defaultPrintScale);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef(null);

    const CANVAS_W = 420;
    const CANVAS_H = 520;

    // Active background: template (if mug) or original product photo
    const activeProductSrc = (useTemplate && templateSrc) ? templateSrc : product.img;

    // ── Core draw (runs synchronously once both images are ready) ──────────────
    const render = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // 1. Clear with white background
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // 2. Draw product/template background
        const pImg = productImgRef.current;
        if (pImg && productImgLoadedRef.current) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;

            if (useTemplate && templateSrc) {
                // For templates: contain image with padding so whole product is visible
                const aspect = pImg.naturalWidth / pImg.naturalHeight;
                const padX = 20, padY = 20;
                const maxW = CANVAS_W - padX * 2;
                const maxH = CANVAS_H - padY * 2;
                let drawW = maxW;
                let drawH = drawW / aspect;
                if (drawH > maxH) { drawH = maxH; drawW = drawH * aspect; }
                const drawX = (CANVAS_W - drawW) / 2;
                const drawY = (CANVAS_H - drawH) / 2;
                ctx.drawImage(pImg, drawX, drawY, drawW, drawH);
            } else {
                ctx.drawImage(pImg, 0, 0, CANVAS_W, CANVAS_H);
            }
        } else {
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        }

        const cx = CANVAS_W * printPos.x;
        const cy = CANVAS_H * printPos.y;

        const uImg = userImgRef.current;
        if (uImg && previewSrc) {
            const scaledW = CANVAS_W * printScale;
            const scaledH = (uImg.naturalHeight / uImg.naturalWidth) * scaledW;
            const dx = cx - scaledW / 2;
            const dy = cy - scaledH / 2;

            if (useTemplate && templateSrc) {
                // ── Clean template: source-over so design shows crisp on white ──
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 0.95;
                ctx.drawImage(uImg, dx, dy, scaledW, scaledH);
                ctx.globalAlpha = 1;
            } else {
                // ── Original photo: multiply blend to merge with fabric/product colour ──
                ctx.globalCompositeOperation = 'multiply';
                ctx.globalAlpha = 0.92;
                ctx.drawImage(uImg, dx, dy, scaledW, scaledH);
                ctx.globalCompositeOperation = 'darken';
                ctx.globalAlpha = 0.18;
                ctx.drawImage(uImg, dx, dy, scaledW, scaledH);
            }

            // Reset
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;

            // Dashed selection border
            ctx.save();
            ctx.setLineDash([5, 4]);
            ctx.strokeStyle = 'rgba(99,102,241,0.55)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(dx - 2, dy - 2, scaledW + 4, scaledH + 4);
            ctx.restore();
        } else {
            // No design yet — print-zone guide
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;

            const zoneW = CANVAS_W * (productType === 'mug' ? 0.36 : 0.4);
            const zoneH = CANVAS_H * (productType === 'mug' ? 0.30 : 0.42);
            ctx.save();
            ctx.setLineDash([6, 4]);
            ctx.strokeStyle = 'rgba(99,102,241,0.45)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(cx - zoneW / 2, cy - zoneH / 2, zoneW, zoneH);

            ctx.fillStyle = 'rgba(99,102,241,0.25)';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Upload your design', cx, cy - 6);
            ctx.fillText('to preview here', cx, cy + 14);
            ctx.restore();
        }
    }, [previewSrc, printPos, printScale, useTemplate]);

    // ── Load product/template image when source changes ───────────────────────
    useEffect(() => {
        productImgLoadedRef.current = false;
        const rawSrc = (useTemplate && templateSrc) ? templateSrc : product.img;
        if (!rawSrc) { productImgRef.current = null; render(); return; }
        
        // Proxy external images to prevent canvas tainting (CORS)
        const src = rawSrc.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(rawSrc)}` : rawSrc;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        img.onload = () => {
            productImgRef.current = img;
            productImgLoadedRef.current = true;
            render();
        };
        img.onerror = () => {
            productImgRef.current = null;
            render();
        };
        productImgRef.current = img;
    }, [product.img, useTemplate, templateSrc]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Load user design image when previewSrc changes ─────────────────────────
    useEffect(() => {
        if (!previewSrc) {
            userImgRef.current = null;
            render();
            return;
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = previewSrc;
        img.onload = () => {
            userImgRef.current = img;
            render();
        };
        img.onerror = () => {
            userImgRef.current = null;
        };
    }, [previewSrc]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Re-render when position / scale changes ────────────────────────────────
    useEffect(() => {
        render();
    }, [render]);

    // ── File selection → local preview ────────────────────────────────────────
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('File too large. Max 5MB allowed.');
            return;
        }
        setUploadError('');
        setUploadedFile(file);
        setUploadedImageUrl('');
        setCustomDesignId(`design_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
        // Revoke old object URL to avoid memory leaks
        if (previewSrc && previewSrc.startsWith('blob:')) URL.revokeObjectURL(previewSrc);
        const blobUrl = URL.createObjectURL(file);
        setPreviewSrc(blobUrl);
    };

    // ── Upload via backend (bypasses Storage RLS) ──────────────────────────────
    const handleUpload = async () => {
        if (!uploadedFile) return null;
        setUploading(true);
        setUploadError('');
        try {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload  = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(uploadedFile);
            });

            const response = await fetch('/api/upload-design', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileBase64: base64,
                    mimeType:   uploadedFile.type,
                    fileName:   uploadedFile.name,
                    userId:     user?.id || 'anonymous',
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Upload failed');
            setUploadedImageUrl(data.publicUrl);
            return data.publicUrl;
        } catch (err) {
            setUploadError(`Upload failed: ${err.message}`);
            return null;
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (uploadedFile) handleUpload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadedFile]);

    // ── Drag to reposition design ──────────────────────────────────────────────
    const getCanvasXY = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top)  / rect.height,
        };
    };

    const handleMouseDown = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        e.preventDefault();
        const pos = getCanvasXY(e, canvas);
        dragStartRef.current = { startX: pos.x - printPos.x, startY: pos.y - printPos.y };
        setIsDragging(true);
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging || !dragStartRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        e.preventDefault();
        const pos = getCanvasXY(e, canvas);
        setPrintPos({
            x: Math.max(0.05, Math.min(0.95, pos.x - dragStartRef.current.startX)),
            y: Math.max(0.05, Math.min(0.95, pos.y - dragStartRef.current.startY)),
        });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        dragStartRef.current = null;
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup',   handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove, { passive: false });
            window.addEventListener('touchend',  handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup',   handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend',  handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    // ── Add to cart ───────────────────────────────────────────────────────────
    const handleAddToCart = async () => {
        setAddingToCart(true);
        let finalUploadUrl = uploadedImageUrl;

        // Upload raw user design if not done yet
        if (uploadedFile && !uploadedImageUrl && !uploading) {
            finalUploadUrl = await handleUpload();
        }

        // Upload canvas snapshot (the "live preview" of product + design)
        let previewUrl = null;
        const canvas = canvasRef.current;
        if (canvas) {
            try {
                // Wait briefly to ensure canvas is fully rendered before capturing
                await new Promise(r => setTimeout(r, 100));
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                const response = await fetch('/api/upload-design', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileBase64: dataUrl,
                        mimeType: 'image/jpeg',
                        fileName: `preview_${Date.now()}.jpg`,
                        userId: user?.id || 'anonymous',
                    }),
                });
                const data = await response.json();
                if (response.ok) {
                    previewUrl = data.publicUrl;
                } else {
                    previewUrl = dataUrl; // fallback to data URL when upload fails
                }
            } catch (err) {
                console.error("Failed to upload preview snapshot", err);
            }
        }

        onAddToCart({
            uploadedImageUrl:  finalUploadUrl || null,
            previewUrl:        previewUrl || null,
            printPosition:     printPos,
            printScale,
            hasCustomDesign:   !!previewSrc,
            customDesignId:    customDesignId || null,
        });
        setAddingToCart(false);
        onClose();
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div
            className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-6"
            style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Modal shell */}
            <div
                className="w-full max-w-4xl rounded-t-3xl md:rounded-3xl overflow-hidden max-h-[95vh] overflow-y-auto"
                style={{
                    background:  '#ffffff',
                    boxShadow:   '0 32px 80px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.07)',
                }}
            >
                {/* ── Header ── */}
                <div
                    className="flex items-center justify-between px-8 py-5"
                    style={{ borderBottom: '1.5px solid #f1f1f1' }}
                >
                    <div>
                        <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
                            🎨 Customize Your Design
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">{product.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                    >
                        <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

                    {/* ── Left: Canvas Preview ── */}
                    <div
                        className="flex flex-col items-center justify-center p-6 gap-4"
                        style={{ background: '#f8f9fb', borderRight: '1.5px solid #f1f1f1' }}
                    >
                        <div className="flex items-center justify-between w-full">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                                {previewSrc ? '⟵ Drag to reposition' : 'Live Preview'}
                            </p>
                            {/* Template / Photo toggle — only shown when a template exists */}
                            {templateSrc && (
                                <button
                                    onClick={() => setUseTemplate(p => !p)}
                                    className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                                        useTemplate
                                            ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                                            : 'bg-gray-100 border-gray-200 text-gray-500 hover:border-indigo-300'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        {useTemplate ? 'layers' : 'image'}
                                    </span>
                                    {useTemplate ? 'Clean Template' : 'Product Photo'}
                                </button>
                            )}
                        </div>
                        <canvas
                            ref={canvasRef}
                            width={CANVAS_W}
                            height={CANVAS_H}
                            className="rounded-2xl max-w-full"
                            style={{
                                touchAction: 'none',
                                maxHeight:   '380px',
                                objectFit:   'contain',
                                border:      '1.5px solid #e5e7eb',
                                boxShadow:   '0 4px 24px rgba(0,0,0,0.07)',
                                cursor:      previewSrc ? 'move' : 'default',
                            }}
                            onMouseDown={handleMouseDown}
                            onTouchStart={handleMouseDown}
                        />
                        {previewSrc && (
                            <p className="text-[10px] text-indigo-500/80 text-center font-medium">
                                Drag on the canvas to reposition · use the slider to resize
                            </p>
                        )}
                    </div>

                    {/* ── Right: Controls ── */}
                    <div className="flex flex-col p-8 gap-6 bg-white">

                        {/* Upload Area */}
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">
                                Step 1 — Upload Your Design
                            </p>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                                    previewSrc
                                        ? 'border-indigo-400 bg-indigo-50/60'
                                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 bg-gray-50'
                                }`}
                            >
                                {previewSrc ? (
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={previewSrc}
                                            className="w-16 h-16 object-contain rounded-xl border border-gray-200 shadow-sm"
                                            alt="Upload preview"
                                        />
                                        <div className="text-left flex-1 min-w-0">
                                            {uploading ? (
                                                <p className="text-indigo-500 text-sm font-bold flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                                                    Uploading…
                                                </p>
                                            ) : uploadedImageUrl ? (
                                                <p className="text-emerald-600 text-sm font-bold flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                                    Design uploaded!
                                                </p>
                                            ) : (
                                                <p className="text-gray-500 text-sm">Processing…</p>
                                            )}
                                            <p className="text-gray-400 text-xs mt-1 truncate">{uploadedFile?.name}</p>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                                className="text-[10px] text-indigo-500 hover:underline mt-1 font-semibold"
                                            >
                                                Change image
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">cloud_upload</span>
                                        <p className="text-sm font-bold text-gray-700 mb-1">Click to upload your design</p>
                                        <p className="text-xs text-gray-400">PNG, JPG, SVG, WebP — Max 5MB</p>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                            {uploadError && (
                                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">error</span>
                                    {uploadError}
                                </p>
                            )}
                        </div>

                        {/* Scale Slider */}
                        {previewSrc && (
                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">
                                    Step 2 — Resize Design
                                    <span className="text-indigo-600 ml-2 font-extrabold">{Math.round(printScale * 100)}%</span>
                                </p>
                                <input
                                    type="range"
                                    min="10"
                                    max="80"
                                    value={Math.round(printScale * 100)}
                                    onChange={(e) => setPrintScale(Number(e.target.value) / 100)}
                                    className="w-full accent-indigo-500"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                                    <span>Smaller</span><span>Larger</span>
                                </div>
                            </div>
                        )}

                        {/* Order Summary */}
                        <div
                            className="rounded-2xl p-4 space-y-2"
                            style={{ background: '#f8f9fb', border: '1.5px solid #f1f1f1' }}
                        >
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400 font-medium">Product</span>
                                <span className="text-gray-800 font-semibold">{product.name}</span>
                            </div>
                            {selectedColor && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 font-medium">Color</span>
                                    <span className="text-gray-800 font-semibold">{selectedColor}</span>
                                </div>
                            )}
                            {selectedSize && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 font-medium">Size</span>
                                    <span className="text-gray-800 font-semibold">{selectedSize}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400 font-medium">Quantity</span>
                                <span className="text-gray-800 font-semibold">{quantity}</span>
                            </div>
                            <div
                                className="flex justify-between font-bold pt-2"
                                style={{ borderTop: '1.5px solid #e5e7eb' }}
                            >
                                <span className="text-gray-700">Total</span>
                                <span className="text-indigo-600 text-base">
                                    ₹{(effectivePrice * quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {!previewSrc && (
                            <p
                                className="text-xs text-gray-500 rounded-xl p-3 leading-relaxed"
                                style={{ background: '#f8f9fb', border: '1.5px solid #f1f1f1' }}
                            >
                                💡 <strong className="text-gray-700">No design?</strong> You can still add to cart without uploading — we'll contact you to collect your design.
                            </p>
                        )}

                        {/* CTA Buttons */}
                        <div className="flex flex-col gap-3 mt-auto">
                            <button
                                onClick={handleAddToCart}
                                disabled={addingToCart || uploading}
                                className="w-full py-4 rounded-2xl font-extrabold tracking-tight text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{
                                    background:  (addingToCart || uploading) ? '#a5b4fc' : 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)',
                                    boxShadow:   '0 4px 20px rgba(99,102,241,0.35)',
                                }}
                            >
                                {addingToCart || uploading ? (
                                    <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> Please wait…</>
                                ) : uploadedImageUrl ? (
                                    <><span className="material-symbols-outlined text-lg">shopping_cart</span> Add Custom Design to Cart</>
                                ) : (
                                    <><span className="material-symbols-outlined text-lg">shopping_cart</span> Add to Cart</>
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-2xl font-semibold text-sm text-gray-500 hover:text-gray-800 transition-all hover:bg-gray-100"
                                style={{ border: '1.5px solid #e5e7eb' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomizationModal;
