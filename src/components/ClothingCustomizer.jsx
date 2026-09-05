import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * ClothingCustomizer
 *
 * Front-only clothing designer.
 *
 * Expected product/variant data:
 *   product.img
 *   selectedVariant.image_url
 *
 * Optional future designer fields:
 *   selectedVariant.designer_front_url
 *   product.designer_front_url
 *   product.designer_config = {
 *      front: {
 *          imageUrl: "...",
 *          printArea: { x, y, width, height } // 0..1
 *      }
 *   }
 *
 * The current implementation falls back to selectedVariant.image_url/product.img
 * until dedicated blank-product designer assets are configured.
 */

const CANVAS_W = 900;
const CANVAS_H = 900;

const DEFAULT_PRINT_AREA = {
    x: 0.30,
    y: 0.22,
    width: 0.40,
    height: 0.46,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getImageUrl = (product, selectedVariant) => {
    return (
        selectedVariant?.designer_front_url ||
        product?.designer_front_url ||
        selectedVariant?.image_url ||
        product?.img ||
        ''
    );
};

const getPrintArea = (product) => {
    const configured = product?.designer_config?.front?.printArea;
    if (!configured) return DEFAULT_PRINT_AREA;

    return {
        x: clamp(Number(configured.x) || DEFAULT_PRINT_AREA.x, 0, 1),
        y: clamp(Number(configured.y) || DEFAULT_PRINT_AREA.y, 0, 1),
        width: clamp(Number(configured.width) || DEFAULT_PRINT_AREA.width, 0.05, 1),
        height: clamp(Number(configured.height) || DEFAULT_PRINT_AREA.height, 0.05, 1),
    };
};

const proxyImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
};

const loadImage = (src) =>
    new Promise((resolve, reject) => {
        if (!src) {
            reject(new Error('Image URL is empty.'));
            return;
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Could not load image: ${src}`));
        img.src = proxyImageUrl(src);
    });

const ClothingCustomizer = ({
    product,
    selectedVariant,
    selectedColor,
    selectedSize,
    quantity,
    effectivePrice,
    onClose,
    onAddToCart,
}) => {
    const { user, session } = useAuth();

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const designImageRef = useRef(null);
    const rawProductImageRef = useRef(null);
    const dragRef = useRef(null);

    const [designFile, setDesignFile] = useState(null);
    const [designPreviewUrl, setDesignPreviewUrl] = useState('');
    const [uploadedDesignUrl, setUploadedDesignUrl] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [customDesignId] = useState(
        () => `clothing_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    );

    const [designPosition, setDesignPosition] = useState({ x: 0.50, y: 0.44 });
    const [designScale, setDesignScale] = useState(0.45);
    const [designRotation, setDesignRotation] = useState(0);

    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const printArea = useMemo(() => getPrintArea(product), [product]);

    const rawProductUrl = useMemo(
        () => getImageUrl(product, selectedVariant),
        [product, selectedVariant]
    );

    const rawProductLabel = selectedVariant?.designer_front_url || product?.designer_front_url
        ? 'Designer product template'
        : 'Product image fallback';

    const designSize = useMemo(() => {
        const img = designImageRef.current;
        if (!img || !img.naturalWidth || !img.naturalHeight) {
            return { width: 0, height: 0 };
        }

        const aspect = img.naturalWidth / img.naturalHeight;
        const maxWidth = printArea.width * CANVAS_W;
        const width = clamp(
            maxWidth * designScale / 0.45,
            30,
            maxWidth
        );
        const height = width / aspect;

        return { width, height };
    }, [designScale, printArea]);

    const drawCanvas = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        const rawImg = rawProductImageRef.current;

        if (rawImg) {
            const aspect = rawImg.naturalWidth / rawImg.naturalHeight;
            let drawW = CANVAS_W;
            let drawH = drawW / aspect;

            if (drawH < CANVAS_H) {
                drawH = CANVAS_H;
                drawW = drawH * aspect;
            }

            const x = (CANVAS_W - drawW) / 2;
            const y = (CANVAS_H - drawH) / 2;

            ctx.drawImage(rawImg, x, y, drawW, drawH);
        }

        // Printable area guide.
        const px = printArea.x * CANVAS_W;
        const py = printArea.y * CANVAS_H;
        const pw = printArea.width * CANVAS_W;
        const ph = printArea.height * CANVAS_H;

        ctx.save();
        ctx.fillStyle = 'rgba(99,102,241,0.055)';
        ctx.fillRect(px, py, pw, ph);
        ctx.setLineDash([10, 8]);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(79,70,229,0.72)';
        ctx.strokeRect(px, py, pw, ph);
        ctx.restore();

        const designImg = designImageRef.current;
        if (!designImg) {
            ctx.save();
            ctx.fillStyle = 'rgba(31,41,55,0.65)';
            ctx.font = '700 20px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('YOUR DESIGN AREA', px + pw / 2, py + ph / 2);
            ctx.restore();
            return;
        }

        const width = designSize.width;
        const height = designSize.height;

        // Clamp center so the entire design remains inside the print area.
        const minX = px + width / 2;
        const maxX = px + pw - width / 2;
        const minY = py + height / 2;
        const maxY = py + ph - height / 2;

        const cx = clamp(
            designPosition.x * CANVAS_W,
            minX,
            Math.max(minX, maxX)
        );
        const cy = clamp(
            designPosition.y * CANVAS_H,
            minY,
            Math.max(minY, maxY)
        );

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((designRotation * Math.PI) / 180);
        ctx.drawImage(designImg, -width / 2, -height / 2, width, height);
        ctx.restore();

        // Selection box.
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((designRotation * Math.PI) / 180);
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(79,70,229,0.9)';
        ctx.strokeRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10);
        ctx.restore();
    }, [designPosition, designRotation, designScale, designSize, printArea]);

    useEffect(() => {
        let cancelled = false;

        const loadProduct = async () => {
            rawProductImageRef.current = null;

            if (!rawProductUrl) {
                drawCanvas();
                return;
            }

            try {
                const img = await loadImage(rawProductUrl);
                if (!cancelled) {
                    rawProductImageRef.current = img;
                    drawCanvas();
                }
            } catch (err) {
                console.error('Designer product image error:', err);
                if (!cancelled) {
                    setError('Unable to load the product template.');
                    drawCanvas();
                }
            }
        };

        loadProduct();

        return () => {
            cancelled = true;
        };
    }, [rawProductUrl, drawCanvas]);

    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    useEffect(() => {
        return () => {
            if (designPreviewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(designPreviewUrl);
            }
        };
    }, [designPreviewUrl]);

    const uploadToBackend = async (fileOrDataUrl, mimeType, fileName) => {
        let fileBase64 = fileOrDataUrl;

        if (fileOrDataUrl instanceof File) {
            fileBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;

                reader.readAsDataURL(fileOrDataUrl);
            });
        }

        // Supabase access token is required by /api/upload-design
        const accessToken = session?.access_token;

        if (!accessToken) {
            throw new Error(
                'Authentication session missing. Please log in again and try uploading.'
            );
        }

        const response = await fetch('/api/upload-design', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                fileBase64,
                mimeType,
                fileName,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed.');
        }

        if (!data.publicUrl) {
            throw new Error('Upload succeeded but no public URL was returned.');
        }

        return data.publicUrl;
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError('Maximum design file size is 10MB.');
            return;
        }

        setError('');
        setDesignFile(file);

        const blobUrl = URL.createObjectURL(file);
        setDesignPreviewUrl(blobUrl);

        try {
            const img = await loadImage(blobUrl);
            designImageRef.current = img;

            setDesignPosition({ x: 0.50, y: 0.44 });
            setDesignScale(0.45);
            setDesignRotation(0);

            setUploading(true);

            const publicUrl = await uploadToBackend(
                file,
                file.type,
                `original_${customDesignId}_${file.name}`
            );

            setUploadedDesignUrl(publicUrl);
        } catch (err) {
            console.error('Design upload error:', err);
            setError(err.message || 'Failed to upload design.');
            setUploadedDesignUrl('');
        } finally {
            setUploading(false);
        }
    };

    const canvasPoint = (event) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const clientX = event.clientX ?? event.touches?.[0]?.clientX;
        const clientY = event.clientY ?? event.touches?.[0]?.clientY;

        if (clientX == null || clientY == null) return null;

        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height,
        };
    };

    const handlePointerDown = (event) => {
        if (!designImageRef.current) return;

        event.preventDefault();

        const point = canvasPoint(event);
        if (!point) return;

        dragRef.current = {
            offsetX: point.x - designPosition.x,
            offsetY: point.y - designPosition.y,
        };

        setDragging(true);
    };

    const handlePointerMove = useCallback((event) => {
        if (!dragging || !dragRef.current) return;

        event.preventDefault();

        const point = canvasPoint(event);
        if (!point) return;

        const width = designSize.width / CANVAS_W;
        const height = designSize.height / CANVAS_H;

        const minX = printArea.x + width / 2;
        const maxX = printArea.x + printArea.width - width / 2;
        const minY = printArea.y + height / 2;
        const maxY = printArea.y + printArea.height - height / 2;

        const nextX = point.x - dragRef.current.offsetX;
        const nextY = point.y - dragRef.current.offsetY;

        setDesignPosition({
            x: clamp(nextX, minX, Math.max(minX, maxX)),
            y: clamp(nextY, minY, Math.max(minY, maxY)),
        });
    }, [dragging, designSize, printArea, designPosition]);

    const handlePointerUp = useCallback(() => {
        setDragging(false);
        dragRef.current = null;
    }, []);

    useEffect(() => {
        if (!dragging) return;

        window.addEventListener('pointermove', handlePointerMove, { passive: false });
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [dragging, handlePointerMove, handlePointerUp]);

    const resetDesign = () => {
        setDesignPosition({ x: 0.50, y: 0.44 });
        setDesignScale(0.45);
        setDesignRotation(0);
    };

    const createFinalPreview = async () => {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error('Designer canvas is unavailable.');

        await drawCanvas();

        // Give React/canvas one frame to finish.
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        return uploadToBackend(
            dataUrl,
            'image/jpeg',
            `preview_${customDesignId}.jpg`
        );
    };

    const handleAddToCart = async () => {
        if (!designImageRef.current || !uploadedDesignUrl) {
            setError('Please upload a design and wait until it finishes uploading.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const finalPreviewUrl = await createFinalPreview();

            setPreviewUrl(finalPreviewUrl);

            onAddToCart({
                type: 'clothing',
                version: 1,
                customDesignId,

                uploadedImageUrl: uploadedDesignUrl,
                previewUrl: finalPreviewUrl,

                rawProductUrl,
                selectedColor: selectedColor || null,
                selectedSize: selectedSize || null,
                quantity,

                front: {
                    originalUrl: uploadedDesignUrl,
                    previewUrl: finalPreviewUrl,
                    x: designPosition.x,
                    y: designPosition.y,
                    scale: designScale,
                    rotation: designRotation,
                    printArea,
                },
            });

            onClose();
        } catch (err) {
            console.error('Designer save error:', err);
            setError(err.message || 'Could not save your customization.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-6"
            onClick={(event) => {
                if (event.target === event.currentTarget && !saving) onClose();
            }}
        >
            <div className="w-full max-w-7xl max-h-[96vh] overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
                {/* Header */}
                <header className="h-16 shrink-0 border-b border-gray-200 px-5 md:px-7 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">
                            Customize Your Product
                        </h2>
                        <p className="text-xs text-gray-400">
                            {product?.name || 'Custom Clothing'}
                            {selectedColor ? ` · ${selectedColor}` : ''}
                            {selectedSize ? ` · ${selectedSize}` : ''}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="w-10 h-10 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_360px]">
                    {/* Designer */}
                    <section className="min-h-0 bg-[#f5f6f8] flex flex-col">
                        <div className="h-14 shrink-0 border-b border-gray-200 bg-white px-5 flex items-center gap-2">
                            <button className="px-5 py-2 rounded-full bg-indigo-600 text-white text-xs font-bold">
                                Front
                            </button>

                            <span className="text-[10px] text-gray-400 ml-2">
                                Front print only
                            </span>
                        </div>

                        <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-4 md:p-8">
                            <div className="relative w-full max-w-[680px] aspect-square bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                                <canvas
                                    ref={canvasRef}
                                    width={CANVAS_W}
                                    height={CANVAS_H}
                                    onPointerDown={handlePointerDown}
                                    className={`w-full h-full select-none ${designImageRef.current
                                        ? dragging
                                            ? 'cursor-grabbing'
                                            : 'cursor-grab'
                                        : 'cursor-default'
                                        }`}
                                    style={{ touchAction: 'none' }}
                                />
                            </div>
                        </div>

                        <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800"
                                >
                                    <span className="material-symbols-outlined align-middle text-base mr-1">
                                        add_photo_alternate
                                    </span>
                                    Add Image
                                </button>

                                <button
                                    onClick={resetDesign}
                                    disabled={!designImageRef.current}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 disabled:opacity-40"
                                >
                                    Reset
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            <span className="text-[10px] text-gray-400">
                                Drag your design inside the highlighted print area
                            </span>
                        </div>
                    </section>

                    {/* Controls */}
                    <aside className="min-h-0 overflow-y-auto border-l border-gray-200 bg-white p-5 md:p-6">
                        <div className="space-y-6">
                            {/* Design */}
                            <div>
                                <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400 mb-3">
                                    Your Design
                                </p>

                                {designPreviewUrl ? (
                                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-3 flex gap-3">
                                        <img
                                            src={designPreviewUrl}
                                            alt="Design"
                                            className="w-16 h-16 rounded-xl object-contain bg-white border border-gray-200"
                                        />

                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-sm text-gray-800 truncate">
                                                {designFile?.name}
                                            </p>

                                            <p className={`text-xs mt-1 ${uploading ? 'text-indigo-600' : 'text-emerald-600'
                                                }`}>
                                                {uploading ? 'Uploading design…' : 'Design uploaded'}
                                            </p>

                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-[10px] font-bold text-indigo-600 mt-2 hover:underline"
                                            >
                                                Change image
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/30 p-7 text-center"
                                    >
                                        <span className="material-symbols-outlined text-4xl text-gray-300">
                                            cloud_upload
                                        </span>
                                        <p className="text-sm font-bold text-gray-700 mt-2">
                                            Upload your design
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            PNG, JPG, WebP or SVG · Max 10MB
                                        </p>
                                    </button>
                                )}
                            </div>

                            {/* Resize */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400">
                                        Size
                                    </p>
                                    <span className="text-xs font-bold text-indigo-600">
                                        {Math.round(designScale * 100)}%
                                    </span>
                                </div>

                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    step="1"
                                    value={Math.round(designScale * 100)}
                                    disabled={!designImageRef.current}
                                    onChange={(event) =>
                                        setDesignScale(Number(event.target.value) / 100)
                                    }
                                    className="w-full accent-indigo-600"
                                />

                                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                    <span>Small</span>
                                    <span>Large</span>
                                </div>
                            </div>

                            {/* Rotation */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400">
                                        Rotate
                                    </p>
                                    <span className="text-xs font-bold text-indigo-600">
                                        {designRotation}°
                                    </span>
                                </div>

                                <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    step="1"
                                    value={designRotation}
                                    disabled={!designImageRef.current}
                                    onChange={(event) =>
                                        setDesignRotation(Number(event.target.value))
                                    }
                                    className="w-full accent-indigo-600"
                                />
                            </div>

                            {/* Product summary */}
                            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Product</span>
                                    <span className="font-bold text-gray-800 text-right">
                                        {product?.name}
                                    </span>
                                </div>

                                {selectedColor && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Color</span>
                                        <span className="font-semibold text-gray-800">
                                            {selectedColor}
                                        </span>
                                    </div>
                                )}

                                {selectedSize && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Size</span>
                                        <span className="font-semibold text-gray-800">
                                            {selectedSize}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Quantity</span>
                                    <span className="font-semibold text-gray-800">
                                        {quantity}
                                    </span>
                                </div>

                                <div className="pt-3 border-t border-gray-200 flex justify-between">
                                    <span className="font-bold text-gray-700">Total</span>
                                    <span className="font-extrabold text-indigo-600 text-lg">
                                        ₹{(Number(effectivePrice || 0) * quantity).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            {/* Asset notice */}
                            {!(
                                selectedVariant?.designer_front_url ||
                                product?.designer_front_url
                            ) && (
                                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
                                        <strong>Designer template not configured.</strong>
                                        <br />
                                        The current product/variant image is being used as the
                                        design canvas. For production-quality placement, configure
                                        a blank front T-shirt image and print-area coordinates for
                                        this product.
                                    </div>
                                )}

                            {error && (
                                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleAddToCart}
                                disabled={
                                    saving ||
                                    uploading ||
                                    !designImageRef.current ||
                                    !uploadedDesignUrl
                                }
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold shadow-lg shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] transition-all"
                            >
                                {saving ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin align-middle mr-2">
                                            progress_activity
                                        </span>
                                        Saving Design…
                                    </>
                                ) : uploading ? (
                                    'Uploading Design…'
                                ) : (
                                    <>
                                        Add Custom Design to Cart
                                        <span className="material-symbols-outlined align-middle ml-2 text-base">
                                            arrow_forward
                                        </span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="w-full py-3 rounded-2xl border border-gray-200 text-gray-500 font-semibold text-sm hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                                Your original design and the final product preview are saved
                                with the cart item so the design can be reviewed with the order.
                            </p>

                            {/* Prevent unused-variable warning for previewUrl in strict setups */}
                            {previewUrl && null}
                            <span className="hidden">{rawProductLabel}</span>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default ClothingCustomizer;