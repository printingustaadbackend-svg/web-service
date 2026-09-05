import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * CustomizationModal
 *
 * Used for:
 * - Mug
 * - Keychain
 * - Diary
 *
 * Props:
 * - product
 * - selectedVariant
 * - selectedColor
 * - selectedSize
 * - quantity
 * - effectivePrice
 * - onClose()
 * - onAddToCart(customizationData)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Product detection
// ─────────────────────────────────────────────────────────────────────────────

const MUG_KEYWORDS = [
    'mug',
    'drinkware',
    'bottle',
    'cup',
    'tumbler',
    'sipper',
    'flask',
];

const KEYCHAIN_KEYWORDS = [
    'keychain',
    'key chain',
    'key-ring',
    'keyring',
];

const DIARY_KEYWORDS = [
    'diary',
    'notebook',
    'journal',
];

const detectProductType = (product) => {
    const text = `
        ${product?.name || ''}
        ${product?.cat || ''}
        ${product?.category || ''}
        ${product?.category_name || ''}
        ${product?.category_slug || ''}
    `.toLowerCase();

    if (MUG_KEYWORDS.some((keyword) => text.includes(keyword))) {
        return 'mug';
    }

    if (KEYCHAIN_KEYWORDS.some((keyword) => text.includes(keyword))) {
        return 'keychain';
    }

    if (DIARY_KEYWORDS.some((keyword) => text.includes(keyword))) {
        return 'diary';
    }

    return 'other';
};

// ─────────────────────────────────────────────────────────────────────────────
// Templates
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCT_TEMPLATES = {
    mug: '/templates/blank_mug.png',
    keychain: '/templates/blank_keychain.png',
    diary: '/templates/blank_diary.png',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const proxyImageUrl = (url) => {
    if (!url) return '';

    if (url.startsWith('http://') || url.startsWith('https://')) {
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }

    return url;
};

const CustomizationModal = ({
    product,
    selectedVariant,
    selectedColor,
    selectedSize,
    quantity,
    effectivePrice,
    onClose,
    onAddToCart,
}) => {
    const { session } = useAuth();

    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const productImgRef = useRef(null);
    const userImgRef = useRef(null);

    const dragStartRef = useRef(null);

    // ─────────────────────────────────────────────────────────────────────────
    // Product type
    // ─────────────────────────────────────────────────────────────────────────

    const productType = detectProductType(product);

    const templateSrc = PRODUCT_TEMPLATES[productType] || null;

    const [useTemplate, setUseTemplate] = useState(Boolean(templateSrc));

    const activeProductSrc =
        useTemplate && templateSrc
            ? templateSrc
            : selectedVariant?.image_url ||
              product?.img ||
              '';

    // ─────────────────────────────────────────────────────────────────────────
    // Design state
    // ─────────────────────────────────────────────────────────────────────────

    const [uploadedFile, setUploadedFile] = useState(null);

    const [uploadedImageUrl, setUploadedImageUrl] = useState('');

    const [previewSrc, setPreviewSrc] = useState('');

    const [customDesignId, setCustomDesignId] = useState('');

    const [uploading, setUploading] = useState(false);

    const [uploadError, setUploadError] = useState('');

    const [addingToCart, setAddingToCart] = useState(false);

    // ─────────────────────────────────────────────────────────────────────────
    // Canvas
    // ─────────────────────────────────────────────────────────────────────────

    const CANVAS_W = 600;
    const CANVAS_H = 700;

    // Different default positions depending on product
    const getDefaultPosition = () => {
        switch (productType) {
            case 'mug':
                return {
                    x: 0.50,
                    y: 0.46,
                };

            case 'keychain':
                return {
                    x: 0.50,
                    y: 0.50,
                };

            case 'diary':
                return {
                    x: 0.50,
                    y: 0.46,
                };

            default:
                return {
                    x: 0.50,
                    y: 0.42,
                };
        }
    };

    const getDefaultScale = () => {
        switch (productType) {
            case 'mug':
                return 0.30;

            case 'keychain':
                return 0.35;

            case 'diary':
                return 0.38;

            default:
                return 0.35;
        }
    };

    const [printPos, setPrintPos] = useState(getDefaultPosition);

    const [printScale, setPrintScale] = useState(getDefaultScale);

    const [isDragging, setIsDragging] = useState(false);

    // ─────────────────────────────────────────────────────────────────────────
    // Canvas render
    // ─────────────────────────────────────────────────────────────────────────

    const render = useCallback(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // ─────────────────────────────────────────────────────────────────────
        // Product
        // ─────────────────────────────────────────────────────────────────────

        const productImg = productImgRef.current;

        if (productImg && productImg.complete && productImg.naturalWidth) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;

            const aspect =
                productImg.naturalWidth / productImg.naturalHeight;

            let drawW = CANVAS_W;
            let drawH = drawW / aspect;

            const padding = 25;

            const maxW = CANVAS_W - padding * 2;
            const maxH = CANVAS_H - padding * 2;

            drawW = maxW;
            drawH = drawW / aspect;

            if (drawH > maxH) {
                drawH = maxH;
                drawW = drawH * aspect;
            }

            const drawX = (CANVAS_W - drawW) / 2;
            const drawY = (CANVAS_H - drawH) / 2;

            ctx.drawImage(
                productImg,
                drawX,
                drawY,
                drawW,
                drawH
            );
        } else {
            ctx.fillStyle = '#f3f4f6';
            ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        }

        // ─────────────────────────────────────────────────────────────────────
        // Design
        // ─────────────────────────────────────────────────────────────────────

        const userImg = userImgRef.current;

        const centerX = CANVAS_W * printPos.x;
        const centerY = CANVAS_H * printPos.y;

        if (
            userImg &&
            userImg.complete &&
            userImg.naturalWidth &&
            previewSrc
        ) {
            const designWidth = CANVAS_W * printScale;

            const aspect =
                userImg.naturalWidth / userImg.naturalHeight;

            const designHeight = designWidth / aspect;

            const dx = centerX - designWidth / 2;
            const dy = centerY - designHeight / 2;

            ctx.save();

            if (useTemplate && templateSrc) {
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 0.96;
            } else {
                ctx.globalCompositeOperation = 'multiply';
                ctx.globalAlpha = 0.92;
            }

            ctx.drawImage(
                userImg,
                dx,
                dy,
                designWidth,
                designHeight
            );

            ctx.restore();

            // Selection box
            ctx.save();

            ctx.setLineDash([6, 5]);

            ctx.strokeStyle = 'rgba(99,102,241,0.65)';

            ctx.lineWidth = 2;

            ctx.strokeRect(
                dx - 4,
                dy - 4,
                designWidth + 8,
                designHeight + 8
            );

            ctx.restore();
        } else {
            // ─────────────────────────────────────────────────────────────────
            // Print area guide
            // ─────────────────────────────────────────────────────────────────

            let zoneWidth = CANVAS_W * 0.40;
            let zoneHeight = CANVAS_H * 0.30;

            if (productType === 'keychain') {
                zoneWidth = CANVAS_W * 0.35;
                zoneHeight = CANVAS_H * 0.25;
            }

            if (productType === 'diary') {
                zoneWidth = CANVAS_W * 0.45;
                zoneHeight = CANVAS_H * 0.40;
            }

            const zoneX = centerX - zoneWidth / 2;
            const zoneY = centerY - zoneHeight / 2;

            ctx.save();

            ctx.setLineDash([8, 6]);

            ctx.strokeStyle = 'rgba(99,102,241,0.55)';

            ctx.lineWidth = 2;

            ctx.strokeRect(
                zoneX,
                zoneY,
                zoneWidth,
                zoneHeight
            );

            ctx.fillStyle = 'rgba(99,102,241,0.30)';

            ctx.font = 'bold 15px Inter, sans-serif';

            ctx.textAlign = 'center';

            ctx.fillText(
                'Upload your design',
                centerX,
                centerY - 8
            );

            ctx.fillText(
                'to preview here',
                centerX,
                centerY + 16
            );

            ctx.restore();
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }, [
        previewSrc,
        printPos,
        printScale,
        useTemplate,
        templateSrc,
        productType,
    ]);

    // ─────────────────────────────────────────────────────────────────────────
    // Load product image
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!activeProductSrc) {
            productImgRef.current = null;
            render();
            return;
        }

        let cancelled = false;

        const img = new Image();

        img.crossOrigin = 'anonymous';

        const src = proxyImageUrl(activeProductSrc);

        img.onload = () => {
            if (cancelled) return;

            productImgRef.current = img;

            render();
        };

        img.onerror = () => {
            if (cancelled) return;

            console.error(
                'Unable to load product image:',
                activeProductSrc
            );

            productImgRef.current = null;

            render();
        };

        img.src = src;

        return () => {
            cancelled = true;
        };
    }, [activeProductSrc, render]);

    // ─────────────────────────────────────────────────────────────────────────
    // Load user design
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!previewSrc) {
            userImgRef.current = null;
            render();
            return;
        }

        let cancelled = false;

        const img = new Image();

        img.crossOrigin = 'anonymous';

        img.onload = () => {
            if (cancelled) return;

            userImgRef.current = img;

            render();
        };

        img.onerror = () => {
            if (cancelled) return;

            console.error(
                'Unable to load uploaded design.'
            );

            userImgRef.current = null;
        };

        img.src = previewSrc;

        return () => {
            cancelled = true;
        };
    }, [previewSrc, render]);

    // ─────────────────────────────────────────────────────────────────────────
    // Re-render
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        render();
    }, [render]);

    // ─────────────────────────────────────────────────────────────────────────
    // Cleanup blob
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        return () => {
            if (previewSrc?.startsWith('blob:')) {
                URL.revokeObjectURL(previewSrc);
            }
        };
    }, [previewSrc]);

    // ─────────────────────────────────────────────────────────────────────────
    // File selection
    // ─────────────────────────────────────────────────────────────────────────

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        event.target.value = '';

        if (!file) return;

        // Image validation
        if (!file.type.startsWith('image/')) {
            setUploadError(
                'Please upload an image file.'
            );
            return;
        }

        // Maximum 10 MB
        if (file.size > 10 * 1024 * 1024) {
            setUploadError(
                'File too large. Maximum 10MB allowed.'
            );
            return;
        }

        // Revoke previous blob
        if (
            previewSrc &&
            previewSrc.startsWith('blob:')
        ) {
            URL.revokeObjectURL(previewSrc);
        }

        const blobUrl = URL.createObjectURL(file);

        setUploadError('');

        setUploadedFile(file);

        setUploadedImageUrl('');

        setCustomDesignId(
            `design_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 9)}`
        );

        setPreviewSrc(blobUrl);

        // Reset position
        setPrintPos(getDefaultPosition());

        setPrintScale(getDefaultScale());
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Convert file to Base64
    // ─────────────────────────────────────────────────────────────────────────

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);

            reader.onerror = reject;

            reader.readAsDataURL(file);
        });
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Upload design
    // ─────────────────────────────────────────────────────────────────────────

    const uploadFileToBackend = async (
        fileOrDataUrl,
        mimeType,
        fileName
    ) => {
        let base64 = fileOrDataUrl;

        if (fileOrDataUrl instanceof File) {
            base64 = await fileToBase64(fileOrDataUrl);
        }

        if (!session?.access_token) {
            throw new Error(
                'Please login again before uploading your design.'
            );
        }

        const response = await fetch(
            '/api/upload-design',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },

                body: JSON.stringify({
                    fileBase64: base64,
                    mimeType,
                    fileName,
                }),
            }
        );

        let data = {};

        try {
            data = await response.json();
        } catch {
            throw new Error(
                'Invalid response from upload server.'
            );
        }

        if (!response.ok) {
            throw new Error(
                data.error || 'Design upload failed.'
            );
        }

        if (!data.publicUrl) {
            throw new Error(
                'Upload completed but no public URL was returned.'
            );
        }

        return data.publicUrl;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Upload selected design
    // ─────────────────────────────────────────────────────────────────────────

    const handleUpload = async (file = uploadedFile) => {
        if (!file) return null;

        setUploading(true);

        setUploadError('');

        try {
            const publicUrl =
                await uploadFileToBackend(
                    file,
                    file.type,
                    `${customDesignId || `design_${Date.now()}`}_${file.name}`
                );

            setUploadedImageUrl(publicUrl);

            return publicUrl;
        } catch (error) {
            console.error(
                'Design upload error:',
                error
            );

            setUploadedImageUrl('');

            setUploadError(
                error.message ||
                'Failed to upload design.'
            );

            return null;
        } finally {
            setUploading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Automatically upload after selecting file
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!uploadedFile) return;

        handleUpload(uploadedFile);

        // Intentionally run when uploadedFile changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadedFile]);

    // ─────────────────────────────────────────────────────────────────────────
    // Canvas coordinates
    // ─────────────────────────────────────────────────────────────────────────

    const getCanvasPosition = (event) => {
        const canvas = canvasRef.current;

        if (!canvas) return null;

        const rect =
            canvas.getBoundingClientRect();

        const clientX =
            event.touches?.[0]?.clientX ??
            event.clientX;

        const clientY =
            event.touches?.[0]?.clientY ??
            event.clientY;

        if (
            clientX === undefined ||
            clientY === undefined
        ) {
            return null;
        }

        return {
            x:
                (clientX - rect.left) /
                rect.width,

            y:
                (clientY - rect.top) /
                rect.height,
        };
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Drag start
    // ─────────────────────────────────────────────────────────────────────────

    const handlePointerDown = (event) => {
        if (!previewSrc) return;

        const canvas = canvasRef.current;

        if (!canvas) return;

        event.preventDefault();

        const position =
            getCanvasPosition(event);

        if (!position) return;

        dragStartRef.current = {
            offsetX:
                position.x - printPos.x,

            offsetY:
                position.y - printPos.y,
        };

        setIsDragging(true);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Drag move
    // ─────────────────────────────────────────────────────────────────────────

    const handlePointerMove = useCallback(
        (event) => {
            if (
                !isDragging ||
                !dragStartRef.current
            ) {
                return;
            }

            event.preventDefault();

            const position =
                getCanvasPosition(event);

            if (!position) return;

            const nextX =
                position.x -
                dragStartRef.current.offsetX;

            const nextY =
                position.y -
                dragStartRef.current.offsetY;

            setPrintPos({
                x: Math.max(
                    0.05,
                    Math.min(0.95, nextX)
                ),

                y: Math.max(
                    0.05,
                    Math.min(0.95, nextY)
                ),
            });
        },
        [isDragging]
    );

    // ─────────────────────────────────────────────────────────────────────────
    // Drag end
    // ─────────────────────────────────────────────────────────────────────────

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);

        dragStartRef.current = null;
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        window.addEventListener(
            'mousemove',
            handlePointerMove
        );

        window.addEventListener(
            'mouseup',
            handlePointerUp
        );

        window.addEventListener(
            'touchmove',
            handlePointerMove,
            { passive: false }
        );

        window.addEventListener(
            'touchend',
            handlePointerUp
        );

        return () => {
            window.removeEventListener(
                'mousemove',
                handlePointerMove
            );

            window.removeEventListener(
                'mouseup',
                handlePointerUp
            );

            window.removeEventListener(
                'touchmove',
                handlePointerMove
            );

            window.removeEventListener(
                'touchend',
                handlePointerUp
            );
        };
    }, [
        isDragging,
        handlePointerMove,
        handlePointerUp,
    ]);

    // ─────────────────────────────────────────────────────────────────────────
    // Create final preview
    // ─────────────────────────────────────────────────────────────────────────

    const createFinalPreview = async () => {
        const canvas = canvasRef.current;

        if (!canvas) {
            throw new Error(
                'Customization canvas is unavailable.'
            );
        }

        // Render latest state
        render();

        // Wait for browser paint
        await new Promise((resolve) =>
            requestAnimationFrame(resolve)
        );

        const dataUrl =
            canvas.toDataURL(
                'image/jpeg',
                0.92
            );

        const previewUrl =
            await uploadFileToBackend(
                dataUrl,
                'image/jpeg',
                `preview_${customDesignId || Date.now()}.jpg`
            );

        return previewUrl;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Add to cart
    // ─────────────────────────────────────────────────────────────────────────

    const handleAddToCart = async () => {
        setAddingToCart(true);

        setUploadError('');

        try {
            let finalUploadUrl =
                uploadedImageUrl;

            // Make sure raw design exists on server
            if (
                uploadedFile &&
                !finalUploadUrl
            ) {
                finalUploadUrl =
                    await handleUpload(
                        uploadedFile
                    );
            }

            if (
                uploadedFile &&
                !finalUploadUrl
            ) {
                throw new Error(
                    'Design upload failed. Please try again.'
                );
            }

            let finalPreviewUrl = null;

            // Generate product + design preview
            if (previewSrc) {
                finalPreviewUrl =
                    await createFinalPreview();
            }

            const customizationData = {
                type: productType,
                version: 1,

                customDesignId:
                    customDesignId || null,

                uploadedImageUrl:
                    finalUploadUrl || null,

                previewUrl:
                    finalPreviewUrl || null,

                rawProductUrl:
                    activeProductSrc || null,

                selectedColor:
                    selectedColor || null,

                selectedSize:
                    selectedSize || null,

                quantity,

                hasCustomDesign:
                    Boolean(previewSrc),

                printPosition: {
                    x: printPos.x,
                    y: printPos.y,
                },

                printScale,

                customization: {
                    productType,

                    designUrl:
                        finalUploadUrl || null,

                    previewUrl:
                        finalPreviewUrl || null,

                    position: {
                        x: printPos.x,
                        y: printPos.y,
                    },

                    scale: printScale,
                },
            };

            onAddToCart(
                customizationData
            );

            onClose();
        } catch (error) {
            console.error(
                'Customization save error:',
                error
            );

            setUploadError(
                error.message ||
                'Could not save your customization.'
            );
        } finally {
            setAddingToCart(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Reset
    // ─────────────────────────────────────────────────────────────────────────

    const resetDesign = () => {
        setPrintPos(getDefaultPosition());

        setPrintScale(getDefaultScale());
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Product display name
    // ─────────────────────────────────────────────────────────────────────────

    const productTypeLabel = {
        mug: 'Mug',
        keychain: 'Keychain',
        diary: 'Diary',
        other: 'Product',
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div
            className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-6"
            style={{
                background:
                    'rgba(15,23,42,0.55)',

                backdropFilter:
                    'blur(6px)',
            }}
            onClick={(event) => {
                if (
                    event.target ===
                        event.currentTarget &&
                    !addingToCart
                ) {
                    onClose();
                }
            }}
        >
            {/* Modal */}
            <div
                className="w-full max-w-5xl rounded-t-3xl md:rounded-3xl overflow-hidden max-h-[95vh] overflow-y-auto"
                style={{
                    background: '#ffffff',

                    boxShadow:
                        '0 32px 80px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.07)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 md:px-8 py-5"
                    style={{
                        borderBottom:
                            '1.5px solid #f1f1f1',
                    }}
                >
                    <div>
                        <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
                            🎨 Customize Your{' '}
                            {productTypeLabel[
                                productType
                            ] || 'Product'}
                        </h2>

                        <p className="text-xs text-gray-400 mt-1 font-medium">
                            {product?.name ||
                                'Custom Product'}

                            {selectedColor
                                ? ` · ${selectedColor}`
                                : ''}

                            {selectedSize
                                ? ` · ${selectedSize}`
                                : ''}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        disabled={addingToCart}
                        className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-40"
                    >
                        <span className="material-symbols-outlined text-xl">
                            close
                        </span>
                    </button>
                </div>

                {/* Main */}
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* ─────────────────────────────────────────────────────────
                        LEFT — Preview
                    ───────────────────────────────────────────────────────── */}

                    <div
                        className="flex flex-col items-center justify-center p-5 md:p-7 gap-4"
                        style={{
                            background:
                                '#f8f9fb',

                            borderRight:
                                '1.5px solid #f1f1f1',
                        }}
                    >
                        <div className="flex items-center justify-between w-full">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                                {previewSrc
                                    ? '⟵ Drag to reposition'
                                    : 'Live Preview'}
                            </p>

                            {templateSrc && (
                                <button
                                    onClick={() =>
                                        setUseTemplate(
                                            (value) =>
                                                !value
                                        )
                                    }
                                    className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                                        useTemplate
                                            ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                                            : 'bg-gray-100 border-gray-200 text-gray-500 hover:border-indigo-300'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">
                                        {useTemplate
                                            ? 'layers'
                                            : 'image'}
                                    </span>

                                    {useTemplate
                                        ? 'Clean Template'
                                        : 'Product Photo'}
                                </button>
                            )}
                        </div>

                        <div className="w-full flex justify-center">
                            <canvas
                                ref={canvasRef}
                                width={CANVAS_W}
                                height={CANVAS_H}
                                className="rounded-2xl max-w-full"
                                style={{
                                    width:
                                        '100%',

                                    maxWidth:
                                        '430px',

                                    maxHeight:
                                        '500px',

                                    objectFit:
                                        'contain',

                                    touchAction:
                                        'none',

                                    border:
                                        '1.5px solid #e5e7eb',

                                    boxShadow:
                                        '0 4px 24px rgba(0,0,0,0.07)',

                                    cursor:
                                        previewSrc
                                            ? isDragging
                                                ? 'grabbing'
                                                : 'grab'
                                            : 'default',
                                }}
                                onMouseDown={
                                    handlePointerDown
                                }
                                onTouchStart={
                                    handlePointerDown
                                }
                            />
                        </div>

                        {previewSrc && (
                            <p className="text-[10px] text-indigo-500/80 text-center font-medium">
                                Drag the design to
                                reposition it · use
                                the slider to resize
                            </p>
                        )}
                    </div>

                    {/* ─────────────────────────────────────────────────────────
                        RIGHT — Controls
                    ───────────────────────────────────────────────────────── */}

                    <div className="flex flex-col p-6 md:p-8 gap-6 bg-white">
                        {/* Upload */}
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">
                                Step 1 — Upload Your
                                Design
                            </p>

                            <div
                                onClick={() =>
                                    fileInputRef.current?.click()
                                }
                                className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                                    previewSrc
                                        ? 'border-indigo-400 bg-indigo-50/60'
                                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 bg-gray-50'
                                }`}
                            >
                                {previewSrc ? (
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={
                                                previewSrc
                                            }
                                            className="w-16 h-16 object-contain rounded-xl border border-gray-200 shadow-sm bg-white"
                                            alt="Design preview"
                                        />

                                        <div className="text-left flex-1 min-w-0">
                                            {uploading ? (
                                                <p className="text-indigo-500 text-sm font-bold flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-base animate-spin">
                                                        progress_activity
                                                    </span>
                                                    Uploading…
                                                </p>
                                            ) : uploadedImageUrl ? (
                                                <p className="text-emerald-600 text-sm font-bold flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-base">
                                                        check_circle
                                                    </span>
                                                    Design uploaded!
                                                </p>
                                            ) : (
                                                <p className="text-gray-500 text-sm">
                                                    Processing…
                                                </p>
                                            )}

                                            <p className="text-gray-400 text-xs mt-1 truncate">
                                                {
                                                    uploadedFile?.name
                                                }
                                            </p>

                                            <button
                                                onClick={(
                                                    event
                                                ) => {
                                                    event.stopPropagation();

                                                    fileInputRef.current?.click();
                                                }}
                                                className="text-[10px] text-indigo-500 hover:underline mt-1 font-semibold"
                                            >
                                                Change image
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">
                                            cloud_upload
                                        </span>

                                        <p className="text-sm font-bold text-gray-700 mb-1">
                                            Click to upload
                                            your design
                                        </p>

                                        <p className="text-xs text-gray-400">
                                            PNG, JPG, SVG,
                                            WebP — Max
                                            10MB
                                        </p>
                                    </>
                                )}

                                <input
                                    ref={
                                        fileInputRef
                                    }
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                                    className="hidden"
                                    onChange={
                                        handleFileChange
                                    }
                                />
                            </div>

                            {uploadError && (
                                <p className="text-red-500 text-xs mt-2 flex items-start gap-1">
                                    <span className="material-symbols-outlined text-sm">
                                        error
                                    </span>

                                    <span>
                                        {
                                            uploadError
                                        }
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Resize */}
                        {previewSrc && (
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                                        Step 2 — Resize
                                        Design
                                    </p>

                                    <span className="text-xs font-extrabold text-indigo-600">
                                        {Math.round(
                                            printScale *
                                                100
                                        )}
                                        %
                                    </span>
                                </div>

                                <input
                                    type="range"
                                    min="10"
                                    max="80"
                                    step="1"
                                    value={Math.round(
                                        printScale *
                                            100
                                    )}
                                    onChange={(event) =>
                                        setPrintScale(
                                            Number(
                                                event
                                                    .target
                                                    .value
                                            ) / 100
                                        )
                                    }
                                    className="w-full accent-indigo-500"
                                />

                                <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                                    <span>
                                        Smaller
                                    </span>

                                    <span>
                                        Larger
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Reset */}
                        {previewSrc && (
                            <button
                                onClick={resetDesign}
                                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-all"
                            >
                                Reset Position &
                                Size
                            </button>
                        )}

                        {/* Product Summary */}
                        <div
                            className="rounded-2xl p-4 space-y-2"
                            style={{
                                background:
                                    '#f8f9fb',

                                border:
                                    '1.5px solid #f1f1f1',
                            }}
                        >
                            <div className="flex justify-between gap-4 text-sm">
                                <span className="text-gray-400 font-medium">
                                    Product
                                </span>

                                <span className="text-gray-800 font-semibold text-right">
                                    {product?.name}
                                </span>
                            </div>

                            {selectedColor && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 font-medium">
                                        Color
                                    </span>

                                    <span className="text-gray-800 font-semibold">
                                        {
                                            selectedColor
                                        }
                                    </span>
                                </div>
                            )}

                            {selectedSize && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400 font-medium">
                                        Size
                                    </span>

                                    <span className="text-gray-800 font-semibold">
                                        {
                                            selectedSize
                                        }
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400 font-medium">
                                    Quantity
                                </span>

                                <span className="text-gray-800 font-semibold">
                                    {quantity}
                                </span>
                            </div>

                            <div
                                className="flex justify-between font-bold pt-2"
                                style={{
                                    borderTop:
                                        '1.5px solid #e5e7eb',
                                }}
                            >
                                <span className="text-gray-700">
                                    Total
                                </span>

                                <span className="text-indigo-600 text-base">
                                    ₹
                                    {(
                                        Number(
                                            effectivePrice ||
                                                0
                                        ) *
                                        Number(
                                            quantity ||
                                                1
                                        )
                                    ).toLocaleString(
                                        'en-IN',
                                        {
                                            minimumFractionDigits:
                                                2,
                                        }
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* No design message */}
                        {!previewSrc && (
                            <p
                                className="text-xs text-gray-500 rounded-xl p-3 leading-relaxed"
                                style={{
                                    background:
                                        '#f8f9fb',

                                    border:
                                        '1.5px solid #f1f1f1',
                                }}
                            >
                                💡{' '}
                                <strong className="text-gray-700">
                                    No design?
                                </strong>{' '}
                                You can still add the
                                product to cart
                                without uploading a
                                design.
                            </p>
                        )}

                        {/* Buttons */}
                        <div className="flex flex-col gap-3 mt-auto">
                            <button
                                onClick={
                                    handleAddToCart
                                }
                                disabled={
                                    addingToCart ||
                                    uploading
                                }
                                className="w-full py-4 rounded-2xl font-extrabold tracking-tight text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                style={{
                                    background:
                                        addingToCart ||
                                        uploading
                                            ? '#a5b4fc'
                                            : 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)',

                                    boxShadow:
                                        '0 4px 20px rgba(99,102,241,0.35)',
                                }}
                            >
                                {addingToCart ||
                                uploading ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin text-lg">
                                            progress_activity
                                        </span>

                                        Please wait…
                                    </>
                                ) : previewSrc ? (
                                    <>
                                        <span className="material-symbols-outlined text-lg">
                                            shopping_cart
                                        </span>

                                        Add Custom Design
                                        to Cart
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">
                                            shopping_cart
                                        </span>

                                        Add to Cart
                                    </>
                                )}
                            </button>

                            <button
                                onClick={onClose}
                                disabled={
                                    addingToCart
                                }
                                className="w-full py-3 rounded-2xl font-semibold text-sm text-gray-500 hover:text-gray-800 transition-all hover:bg-gray-100 disabled:opacity-40"
                                style={{
                                    border:
                                        '1.5px solid #e5e7eb',
                                }}
                            >
                                Cancel
                            </button>
                        </div>

                        <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                            Your original design and
                            final product preview are
                            saved with the cart item so
                            the design can be reviewed
                            with the order.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomizationModal;