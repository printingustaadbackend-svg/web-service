import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const CANVAS_W = 900;
const CANVAS_H = 900;

const DEFAULT_PRINT_AREAS = {
    front: {
        x: 0.25,
        y: 0.25,
        width: 0.50,
        height: 0.50,
    },
    back: {
        x: 0.25,
        y: 0.25,
        width: 0.50,
        height: 0.50,
    },
};

const clamp = (value, min, max) =>
    Math.min(max, Math.max(min, value));

const getProductImage = (product, selectedVariant) =>
    selectedVariant?.designer_front_url ||
    product?.designer_front_url ||
    selectedVariant?.image_url ||
    product?.img ||
    '';

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

        img.onerror = () =>
            reject(new Error(`Could not load image: ${src}`));

        img.src = proxyImageUrl(src);
    });

const MugCustomizer = ({
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

    const productImageRef = useRef(null);

    const designImagesRef = useRef({
        front: null,
        back: null,
    });

    const dragRef = useRef(null);

    const [activeSide, setActiveSide] = useState('front');

    const [designs, setDesigns] = useState({
        front: {
            file: null,
            previewUrl: '',
            uploadedUrl: '',
            position: {
                x: 0.50,
                y: 0.50,
            },
            scale: 0.42,
            rotation: 0,
        },

        back: {
            file: null,
            previewUrl: '',
            uploadedUrl: '',
            position: {
                x: 0.50,
                y: 0.50,
            },
            scale: 0.42,
            rotation: 0,
        },
    });

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [customDesignId] = useState(
        () =>
            `mug_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 9)}`
    );

    const rawProductUrl = useMemo(
        () => getProductImage(product, selectedVariant),
        [product, selectedVariant]
    );

    const printArea = useMemo(() => {
        const configured =
            product?.designer_config?.[activeSide]?.printArea;

        if (!configured) {
            return DEFAULT_PRINT_AREAS[activeSide];
        }

        return {
            x: clamp(
                Number(configured.x) || DEFAULT_PRINT_AREAS[activeSide].x,
                0,
                1
            ),

            y: clamp(
                Number(configured.y) || DEFAULT_PRINT_AREAS[activeSide].y,
                0,
                1
            ),

            width: clamp(
                Number(configured.width) ||
                    DEFAULT_PRINT_AREAS[activeSide].width,
                0.05,
                1
            ),

            height: clamp(
                Number(configured.height) ||
                    DEFAULT_PRINT_AREAS[activeSide].height,
                0.05,
                1
            ),
        };
    }, [product, activeSide]);

    const activeDesign = designs[activeSide];

    const designSize = useMemo(() => {
        const img = designImagesRef.current[activeSide];

        if (
            !img ||
            !img.naturalWidth ||
            !img.naturalHeight
        ) {
            return {
                width: 0,
                height: 0,
            };
        }

        const aspect =
            img.naturalWidth / img.naturalHeight;

        const maxWidth =
            printArea.width * CANVAS_W;

        const width = clamp(
            maxWidth *
                activeDesign.scale /
                0.42,
            30,
            maxWidth
        );

        const height = width / aspect;

        return {
            width,
            height,
        };
    }, [
        activeDesign.scale,
        activeSide,
        printArea,
    ]);

    /*
     * ------------------------------------------------------------
     * Draw canvas
     * ------------------------------------------------------------
     */

    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        ctx.clearRect(
            0,
            0,
            CANVAS_W,
            CANVAS_H
        );

        ctx.fillStyle = '#f3f4f6';

        ctx.fillRect(
            0,
            0,
            CANVAS_W,
            CANVAS_H
        );

        /*
         * Product image
         */

        const productImg =
            productImageRef.current;

        if (productImg) {
            const aspect =
                productImg.naturalWidth /
                productImg.naturalHeight;

            let drawW = CANVAS_W;
            let drawH = drawW / aspect;

            if (drawH < CANVAS_H) {
                drawH = CANVAS_H;
                drawW = drawH * aspect;
            }

            const x =
                (CANVAS_W - drawW) / 2;

            const y =
                (CANVAS_H - drawH) / 2;

            ctx.drawImage(
                productImg,
                x,
                y,
                drawW,
                drawH
            );
        }

        /*
         * Print area
         */

        const px =
            printArea.x * CANVAS_W;

        const py =
            printArea.y * CANVAS_H;

        const pw =
            printArea.width * CANVAS_W;

        const ph =
            printArea.height * CANVAS_H;

        ctx.save();

        ctx.fillStyle =
            'rgba(99,102,241,0.055)';

        ctx.fillRect(
            px,
            py,
            pw,
            ph
        );

        ctx.setLineDash([
            10,
            8,
        ]);

        ctx.lineWidth = 3;

        ctx.strokeStyle =
            'rgba(79,70,229,0.72)';

        ctx.strokeRect(
            px,
            py,
            pw,
            ph
        );

        ctx.restore();

        /*
         * Active design
         */

        const designImg =
            designImagesRef.current[activeSide];

        if (!designImg) {
            ctx.save();

            ctx.fillStyle =
                'rgba(31,41,55,0.65)';

            ctx.font =
                '700 20px Inter, sans-serif';

            ctx.textAlign = 'center';

            ctx.fillText(
                `${activeSide.toUpperCase()} DESIGN AREA`,
                px + pw / 2,
                py + ph / 2
            );

            ctx.restore();

            return;
        }

        const width =
            designSize.width;

        const height =
            designSize.height;

        const minX =
            px + width / 2;

        const maxX =
            px + pw - width / 2;

        const minY =
            py + height / 2;

        const maxY =
            py + ph - height / 2;

        const cx = clamp(
            activeDesign.position.x *
                CANVAS_W,
            minX,
            Math.max(minX, maxX)
        );

        const cy = clamp(
            activeDesign.position.y *
                CANVAS_H,
            minY,
            Math.max(minY, maxY)
        );

        /*
         * Draw design
         */

        ctx.save();

        ctx.translate(
            cx,
            cy
        );

        ctx.rotate(
            (activeDesign.rotation *
                Math.PI) /
                180
        );

        ctx.drawImage(
            designImg,
            -width / 2,
            -height / 2,
            width,
            height
        );

        ctx.restore();

        /*
         * Selection border
         */

        ctx.save();

        ctx.translate(
            cx,
            cy
        );

        ctx.rotate(
            (activeDesign.rotation *
                Math.PI) /
                180
        );

        ctx.setLineDash([
            6,
            5,
        ]);

        ctx.lineWidth = 2;

        ctx.strokeStyle =
            'rgba(79,70,229,0.9)';

        ctx.strokeRect(
            -width / 2 - 5,
            -height / 2 - 5,
            width + 10,
            height + 10
        );

        ctx.restore();
    }, [
        activeDesign,
        activeSide,
        designSize,
        printArea,
    ]);

    /*
     * ------------------------------------------------------------
     * Load product image
     * ------------------------------------------------------------
     */

    useEffect(() => {
        let cancelled = false;

        const loadProduct = async () => {
            productImageRef.current = null;

            if (!rawProductUrl) {
                drawCanvas();
                return;
            }

            try {
                const img =
                    await loadImage(rawProductUrl);

                if (!cancelled) {
                    productImageRef.current = img;

                    drawCanvas();
                }
            } catch (err) {
                console.error(
                    'Mug product image error:',
                    err
                );

                if (!cancelled) {
                    setError(
                        'Unable to load the mug template.'
                    );

                    drawCanvas();
                }
            }
        };

        loadProduct();

        return () => {
            cancelled = true;
        };
    }, [
        rawProductUrl,
        drawCanvas,
    ]);

    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    /*
     * ------------------------------------------------------------
     * Upload design
     * ------------------------------------------------------------
     */

    const uploadToBackend = async (
        fileOrDataUrl,
        mimeType,
        fileName
    ) => {
        let fileBase64 =
            fileOrDataUrl;

        if (
            fileOrDataUrl instanceof File
        ) {
            fileBase64 =
                await new Promise(
                    (resolve, reject) => {
                        const reader =
                            new FileReader();

                        reader.onload = () =>
                            resolve(
                                reader.result
                            );

                        reader.onerror =
                            reject;

                        reader.readAsDataURL(
                            fileOrDataUrl
                        );
                    }
                );
        }

        const accessToken =
            session?.access_token;

        if (!accessToken) {
            throw new Error(
                'Authentication session missing. Please log in again.'
            );
        }

        const response =
            await fetch(
                '/api/upload-design',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${accessToken}`,
                    },

                    body: JSON.stringify({
                        fileBase64,
                        mimeType,
                        fileName,
                    }),
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.error ||
                    'Upload failed.'
            );
        }

        if (!data.publicUrl) {
            throw new Error(
                'Upload succeeded but no public URL was returned.'
            );
        }

        return data.publicUrl;
    };

    const handleFileChange = async (
        event
    ) => {
        const file =
            event.target.files?.[0];

        event.target.value = '';

        if (!file) return;

        if (
            !file.type.startsWith(
                'image/'
            )
        ) {
            setError(
                'Please upload an image file.'
            );

            return;
        }

        if (
            file.size >
            10 * 1024 * 1024
        ) {
            setError(
                'Maximum design file size is 10MB.'
            );

            return;
        }

        setError('');

        const blobUrl =
            URL.createObjectURL(file);

        designImagesRef.current[
            activeSide
        ] = null;

        setDesigns((previous) => ({
            ...previous,

            [activeSide]: {
                ...previous[activeSide],

                file,

                previewUrl:
                    blobUrl,

                uploadedUrl: '',

                position: {
                    x: 0.50,
                    y: 0.50,
                },

                scale: 0.42,

                rotation: 0,
            },
        }));

        try {
            const img =
                await loadImage(
                    blobUrl
                );

            designImagesRef.current[
                activeSide
            ] = img;

            drawCanvas();

            setUploading(true);

            const publicUrl =
                await uploadToBackend(
                    file,
                    file.type,
                    `original_${customDesignId}_${activeSide}_${file.name}`
                );

            setDesigns(
                (previous) => ({
                    ...previous,

                    [activeSide]: {
                        ...previous[
                            activeSide
                        ],

                        uploadedUrl:
                            publicUrl,
                    },
                })
            );
        } catch (err) {
            console.error(
                'Mug design upload error:',
                err
            );

            setError(
                err.message ||
                    'Failed to upload design.'
            );
        } finally {
            setUploading(false);
        }
    };

    /*
     * ------------------------------------------------------------
     * Canvas dragging
     * ------------------------------------------------------------
     */

    const canvasPoint = (
        event
    ) => {
        const canvas =
            canvasRef.current;

        if (!canvas) return null;

        const rect =
            canvas.getBoundingClientRect();

        const clientX =
            event.clientX ??
            event.touches?.[0]
                ?.clientX;

        const clientY =
            event.clientY ??
            event.touches?.[0]
                ?.clientY;

        if (
            clientX == null ||
            clientY == null
        ) {
            return null;
        }

        return {
            x:
                (clientX -
                    rect.left) /
                rect.width,

            y:
                (clientY -
                    rect.top) /
                rect.height,
        };
    };

    const handlePointerDown = (
        event
    ) => {
        if (
            !designImagesRef.current[
                activeSide
            ]
        ) {
            return;
        }

        event.preventDefault();

        const point =
            canvasPoint(event);

        if (!point) return;

        dragRef.current = {
            offsetX:
                point.x -
                activeDesign.position.x,

            offsetY:
                point.y -
                activeDesign.position.y,
        };

        event.currentTarget.setPointerCapture?.(
            event.pointerId
        );
    };

    const handlePointerMove = (
        event
    ) => {
        if (
            !dragRef.current
        ) {
            return;
        }

        const point =
            canvasPoint(event);

        if (!point) return;

        const width =
            designSize.width /
            CANVAS_W;

        const height =
            designSize.height /
            CANVAS_H;

        const minX =
            printArea.x +
            width / 2;

        const maxX =
            printArea.x +
            printArea.width -
            width / 2;

        const minY =
            printArea.y +
            height / 2;

        const maxY =
            printArea.y +
            printArea.height -
            height / 2;

        const nextX =
            point.x -
            dragRef.current.offsetX;

        const nextY =
            point.y -
            dragRef.current.offsetY;

        setDesigns(
            (previous) => ({
                ...previous,

                [activeSide]: {
                    ...previous[
                        activeSide
                    ],

                    position: {
                        x: clamp(
                            nextX,
                            minX,
                            Math.max(
                                minX,
                                maxX
                            )
                        ),

                        y: clamp(
                            nextY,
                            minY,
                            Math.max(
                                minY,
                                maxY
                            )
                        ),
                    },
                },
            })
        );
    };

    const handlePointerUp = () => {
        dragRef.current = null;
    };

    /*
     * ------------------------------------------------------------
     * Reset active side
     * ------------------------------------------------------------
     */

    const resetDesign = () => {
        setDesigns(
            (previous) => ({
                ...previous,

                [activeSide]: {
                    ...previous[
                        activeSide
                    ],

                    position: {
                        x: 0.50,
                        y: 0.50,
                    },

                    scale: 0.42,

                    rotation: 0,
                },
            })
        );
    };

    /*
     * ------------------------------------------------------------
     * Create final preview
     * ------------------------------------------------------------
     */

    const createFinalPreview =
        async () => {
            const canvas =
                canvasRef.current;

            if (!canvas) {
                throw new Error(
                    'Designer canvas unavailable.'
                );
            }

            drawCanvas();

            await new Promise(
                (resolve) =>
                    requestAnimationFrame(
                        resolve
                    )
            );

            const dataUrl =
                canvas.toDataURL(
                    'image/jpeg',
                    0.92
                );

            return uploadToBackend(
                dataUrl,
                'image/jpeg',
                `preview_${customDesignId}_${activeSide}.jpg`
            );
        };

    /*
     * ------------------------------------------------------------
     * Add to cart
     * ------------------------------------------------------------
     */

    const handleAddToCart =
        async () => {
            const front =
                designs.front;

            const back =
                designs.back;

            if (
                !front.uploadedUrl ||
                !back.uploadedUrl
            ) {
                setError(
                    'Please upload a design for both the front and back.'
                );

                return;
            }

            setSaving(true);
            setError('');

            try {
                /*
                 * Front preview
                 */

                setActiveSide('front');

                await new Promise(
                    (resolve) =>
                        requestAnimationFrame(
                            resolve
                        )
                );

                const frontPreviewUrl =
                    await createFinalPreview();

                /*
                 * Back preview
                 */

                setActiveSide('back');

                await new Promise(
                    (resolve) =>
                        requestAnimationFrame(
                            resolve
                        )
                );

                const backPreviewUrl =
                    await createFinalPreview();

                /*
                 * Restore front
                 */

                setActiveSide('front');

                onAddToCart({
                    type: 'mug',

                    version: 1,

                    customDesignId,

                    rawProductUrl,

                    selectedColor:
                        selectedColor ||
                        null,

                    selectedSize:
                        selectedSize ||
                        null,

                    quantity,

                    front: {
                        originalUrl:
                            front.uploadedUrl,

                        previewUrl:
                            frontPreviewUrl,

                        x:
                            front.position
                                .x,

                        y:
                            front.position
                                .y,

                        scale:
                            front.scale,

                        rotation:
                            front.rotation,

                        printArea:
                            DEFAULT_PRINT_AREAS
                                .front,
                    },

                    back: {
                        originalUrl:
                            back.uploadedUrl,

                        previewUrl:
                            backPreviewUrl,

                        x:
                            back.position
                                .x,

                        y:
                            back.position
                                .y,

                        scale:
                            back.scale,

                        rotation:
                            back.rotation,

                        printArea:
                            DEFAULT_PRINT_AREAS
                                .back,
                    },
                });

                onClose();
            } catch (err) {
                console.error(
                    'Mug customization save error:',
                    err
                );

                setError(
                    err.message ||
                        'Could not save your customization.'
                );
            } finally {
                setSaving(false);
            }
        };

    /*
     * ------------------------------------------------------------
     * UI
     * ------------------------------------------------------------
     */

    return (
        <div
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-6"
            onClick={(event) => {
                if (
                    event.target ===
                        event.currentTarget &&
                    !saving
                ) {
                    onClose();
                }
            }}
        >
            <div className="w-full max-w-7xl max-h-[96vh] overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">

                {/* Header */}

                <header className="h-16 shrink-0 border-b border-gray-200 px-5 md:px-7 flex items-center justify-between">

                    <div>
                        <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">
                            Customize Your Mug
                        </h2>

                        <p className="text-xs text-gray-400">
                            {product?.name || 'Custom Mug'}

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
                        disabled={saving}
                        className="w-10 h-10 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined">
                            close
                        </span>
                    </button>
                </header>

                <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_360px]">

                    {/* Canvas */}

                    <section className="min-h-0 bg-[#f5f6f8] flex flex-col">

                        {/* Side selector */}

                        <div className="h-14 shrink-0 border-b border-gray-200 bg-white px-5 flex items-center gap-2">

                            <button
                                onClick={() =>
                                    setActiveSide(
                                        'front'
                                    )
                                }
                                className={`px-5 py-2 rounded-full text-xs font-bold ${
                                    activeSide ===
                                    'front'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                                Front
                            </button>

                            <button
                                onClick={() =>
                                    setActiveSide(
                                        'back'
                                    )
                                }
                                className={`px-5 py-2 rounded-full text-xs font-bold ${
                                    activeSide ===
                                    'back'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                                Back
                            </button>

                            <span className="text-[10px] text-gray-400 ml-2">
                                {activeSide ===
                                'front'
                                    ? 'Front print'
                                    : 'Back print'}
                            </span>
                        </div>

                        <div className="flex-1 min-h-0 overflow-auto flex items-center justify-center p-4 md:p-8">

                            <div className="relative w-full max-w-[680px] aspect-square bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">

                                <canvas
                                    ref={canvasRef}
                                    width={
                                        CANVAS_W
                                    }
                                    height={
                                        CANVAS_H
                                    }
                                    onPointerDown={
                                        handlePointerDown
                                    }
                                    onPointerMove={
                                        handlePointerMove
                                    }
                                    onPointerUp={
                                        handlePointerUp
                                    }
                                    onPointerCancel={
                                        handlePointerUp
                                    }
                                    className={`w-full h-full select-none ${
                                        designImagesRef
                                            .current[
                                            activeSide
                                        ]
                                            ? 'cursor-grab'
                                            : 'cursor-default'
                                    }`}
                                    style={{
                                        touchAction:
                                            'none',
                                    }}
                                />

                            </div>
                        </div>

                        {/* Bottom toolbar */}

                        <div className="shrink-0 border-t border-gray-200 bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-3">

                            <div className="flex items-center gap-2">

                                <button
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800"
                                >
                                    <span className="material-symbols-outlined align-middle text-base mr-1">
                                        add_photo_alternate
                                    </span>

                                    Add {activeSide}{' '}
                                    Design
                                </button>

                                <button
                                    onClick={
                                        resetDesign
                                    }
                                    disabled={
                                        !designImagesRef
                                            .current[
                                            activeSide
                                        ]
                                    }
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 disabled:opacity-40"
                                >
                                    Reset
                                </button>

                                <input
                                    ref={
                                        fileInputRef
                                    }
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                    onChange={
                                        handleFileChange
                                    }
                                    className="hidden"
                                />
                            </div>

                            <span className="text-[10px] text-gray-400">
                                Drag your design inside the highlighted area
                            </span>
                        </div>
                    </section>

                    {/* Controls */}

                    <aside className="min-h-0 overflow-y-auto border-l border-gray-200 bg-white p-5 md:p-6">

                        <div className="space-y-6">

                            {/* Front status */}

                            <div className="rounded-2xl border border-gray-200 p-4">

                                <div className="flex justify-between items-center mb-2">

                                    <span className="text-xs font-bold text-gray-700">
                                        Front Design
                                    </span>

                                    {designs.front.uploadedUrl ? (
                                        <span className="text-[10px] font-bold text-emerald-600">
                                            ✓ Uploaded
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-gray-400">
                                            Required
                                        </span>
                                    )}
                                </div>

                                {designs.front.previewUrl && (
                                    <img
                                        src={
                                            designs
                                                .front
                                                .previewUrl
                                        }
                                        alt="Front design"
                                        className="w-16 h-16 object-contain rounded-xl border"
                                    />
                                )}
                            </div>

                            {/* Back status */}

                            <div className="rounded-2xl border border-gray-200 p-4">

                                <div className="flex justify-between items-center mb-2">

                                    <span className="text-xs font-bold text-gray-700">
                                        Back Design
                                    </span>

                                    {designs.back.uploadedUrl ? (
                                        <span className="text-[10px] font-bold text-emerald-600">
                                            ✓ Uploaded
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-gray-400">
                                            Required
                                        </span>
                                    )}
                                </div>

                                {designs.back.previewUrl && (
                                    <img
                                        src={
                                            designs
                                                .back
                                                .previewUrl
                                        }
                                        alt="Back design"
                                        className="w-16 h-16 object-contain rounded-xl border"
                                    />
                                )}
                            </div>

                            {/* Size */}

                            <div>

                                <div className="flex justify-between items-center mb-2">

                                    <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400">
                                        Size
                                    </p>

                                    <span className="text-xs font-bold text-indigo-600">
                                        {Math.round(
                                            activeDesign.scale *
                                                100
                                        )}
                                        %
                                    </span>

                                </div>

                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={Math.round(
                                        activeDesign.scale *
                                            100
                                    )}
                                    disabled={
                                        !designImagesRef
                                            .current[
                                            activeSide
                                        ]
                                    }
                                    onChange={(event) =>
                                        setDesigns(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,

                                                [activeSide]:
                                                    {
                                                        ...previous[
                                                            activeSide
                                                        ],

                                                        scale:
                                                            Number(
                                                                event
                                                                    .target
                                                                    .value
                                                            ) /
                                                            100,
                                                    },
                                            })
                                        )
                                    }
                                    className="w-full accent-indigo-600"
                                />

                                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                    <span>
                                        Small
                                    </span>

                                    <span>
                                        Large
                                    </span>
                                </div>

                            </div>

                            {/* Rotation */}

                            <div>

                                <div className="flex justify-between items-center mb-2">

                                    <p className="text-[10px] uppercase tracking-widest font-extrabold text-gray-400">
                                        Rotate
                                    </p>

                                    <span className="text-xs font-bold text-indigo-600">
                                        {
                                            activeDesign.rotation
                                        }
                                        °
                                    </span>

                                </div>

                                <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    value={
                                        activeDesign.rotation
                                    }
                                    disabled={
                                        !designImagesRef
                                            .current[
                                            activeSide
                                        ]
                                    }
                                    onChange={(event) =>
                                        setDesigns(
                                            (
                                                previous
                                            ) => ({
                                                ...previous,

                                                [activeSide]:
                                                    {
                                                        ...previous[
                                                            activeSide
                                                        ],

                                                        rotation:
                                                            Number(
                                                                event
                                                                    .target
                                                                    .value
                                                            ),
                                                    },
                                            })
                                        )
                                    }
                                    className="w-full accent-indigo-600"
                                />

                            </div>

                            {/* Product summary */}

                            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 space-y-3">

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">
                                        Product
                                    </span>

                                    <span className="font-bold text-gray-800 text-right">
                                        {
                                            product?.name
                                        }
                                    </span>
                                </div>

                                {selectedColor && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">
                                            Color
                                        </span>

                                        <span className="font-semibold text-gray-800">
                                            {
                                                selectedColor
                                            }
                                        </span>
                                    </div>
                                )}

                                {selectedSize && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">
                                            Size
                                        </span>

                                        <span className="font-semibold text-gray-800">
                                            {
                                                selectedSize
                                            }
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">
                                        Quantity
                                    </span>

                                    <span className="font-semibold text-gray-800">
                                        {
                                            quantity
                                        }
                                    </span>
                                </div>

                                <div className="pt-3 border-t border-gray-200 flex justify-between">

                                    <span className="font-bold text-gray-700">
                                        Total
                                    </span>

                                    <span className="font-extrabold text-indigo-600 text-lg">
                                        ₹
                                        {(
                                            Number(
                                                effectivePrice ||
                                                    0
                                            ) *
                                            quantity
                                        ).toLocaleString(
                                            'en-IN'
                                        )}
                                    </span>

                                </div>

                            </div>

                            {/* Error */}

                            {error && (
                                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600">
                                    {error}
                                </div>
                            )}

                            {/* CTA */}

                            <button
                                onClick={
                                    handleAddToCart
                                }
                                disabled={
                                    saving ||
                                    uploading ||
                                    !designs.front
                                        .uploadedUrl ||
                                    !designs.back
                                        .uploadedUrl
                                }
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold shadow-lg shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin align-middle mr-2">
                                            progress_activity
                                        </span>

                                        Saving Designs…
                                    </>
                                ) : uploading ? (
                                    'Uploading Design…'
                                ) : (
                                    <>
                                        Add Custom Mug to Cart

                                        <span className="material-symbols-outlined align-middle ml-2 text-base">
                                            arrow_forward
                                        </span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={
                                    onClose
                                }
                                disabled={
                                    saving
                                }
                                className="w-full py-3 rounded-2xl border border-gray-200 text-gray-500 font-semibold text-sm hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                                Front and back designs
                                are saved separately
                                with your cart item.
                            </p>

                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default MugCustomizer;