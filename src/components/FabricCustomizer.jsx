import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import './FabricCustomizer.css';

// Helper to convert base64/dataUrl to binary Blob (runs in browser)
function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const binary = atob(parts[1]);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
}

/**
 * FabricCustomizer — Unified Fabric.js product customizer
 *
 * Replaces ClothingCustomizer, MugCustomizer, and CustomizationModal with a
 * single component powered by Fabric.js v6.
 *
 * Features:
 *  - Interactive drag / scale / rotate handles (built into Fabric.js)
 *  - Multi-layer support (images + text)
 *  - Print area clipping
 *  - Front / back side toggle
 *  - Exports exact print coordinates for production
 */

const CANVAS_W = 900;
const CANVAS_H = 900;

const FONTS = [
    'Inter',
    'Roboto',
    'Poppins',
    'Montserrat',
    'Oswald',
    'Playfair Display',
    'Bebas Neue',
    'Lobster',
    'Pacifico',
    'Dancing Script',
];

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

const proxyImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }
    return url;
};

// ─── Side state shape ──────────────────────────────────────────────────────
const makeEmptySideState = () => ({
    canvasJSON: null,
    objects: [],
});

// ─── Component ─────────────────────────────────────────────────────────────
const FabricCustomizer = ({
    product,
    config,
    selectedVariant,
    selectedColor,
    selectedSize,
    quantity,
    effectivePrice,
    onClose,
    onAddToCart,
}) => {
    const { session } = useAuth();

    // ── Refs ───────────────────────────────────────────────────────────────
    const canvasElRef = useRef(null);
    const frameRef = useRef(null);
    const fabricRef = useRef(null);
    const fileInputRef = useRef(null);
    const bgImageRef = useRef(null);
    const printRectRef = useRef(null);
    const clipRectRef = useRef(null);
    const historyRef = useRef([]);
    const historyIndexRef = useRef(-1);
    const skipHistoryRef = useRef(false);

    // ── State ──────────────────────────────────────────────────────────────
    const sides = config?.sides || ['front'];
    const [activeSide, setActiveSide] = useState(sides[0] || 'front');
    const [sideStates, setSideStates] = useState(() => {
        const obj = {};
        sides.forEach(s => { obj[s] = makeEmptySideState(); });
        return obj;
    });

    const [layers, setLayers] = useState([]);
    const [selectedLayerId, setSelectedLayerId] = useState(null);
    const [fabricLoaded, setFabricLoaded] = useState(false);
    const [fabricModule, setFabricModule] = useState(null);

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Text editing state
    const [textInput, setTextInput] = useState('');
    const [textFont, setTextFont] = useState('Inter');
    const [textSize, setTextSize] = useState(40);
    const [textColor, setTextColor] = useState('#000000');

    const customDesignId = useRef(
        `design_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    ).current;

    // ── Derived values ─────────────────────────────────────────────────────
    const printArea = useMemo(() => {
        const pa = config?.printArea || { x: 0.25, y: 0.25, width: 0.50, height: 0.50 };
        return {
            x: clamp(pa.x, 0, 1),
            y: clamp(pa.y, 0, 1),
            width: clamp(pa.width, 0.05, 1),
            height: clamp(pa.height, 0.05, 1),
        };
    }, [config]);

    const templateSrc = useMemo(() => {
        return (
            config?.templateImage ||
            selectedVariant?.designer_front_url ||
            product?.designer_front_url ||
            selectedVariant?.image_url ||
            product?.img ||
            ''
        );
    }, [config, product, selectedVariant]);

    // ── Load Fabric.js dynamically ─────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        import('fabric').then((mod) => {
            if (!cancelled) {
                setFabricModule(mod);
                setFabricLoaded(true);
            }
        }).catch(err => {
            console.error('Failed to load Fabric.js:', err);
            setError('Failed to load the design editor. Please refresh and try again.');
        });
        return () => { cancelled = true; };
    }, []);

    // ── Initialize Canvas ──────────────────────────────────────────────────
    useEffect(() => {
        if (!fabricLoaded || !fabricModule || !canvasElRef.current) return;
        if (fabricRef.current) return; // already initialized

        const { Canvas, Rect, FabricImage } = fabricModule;

        const canvas = new Canvas(canvasElRef.current, {
            width: CANVAS_W,
            height: CANVAS_H,
            backgroundColor: '#f3f4f6',
            selection: true,
            preserveObjectStacking: true,
            controlsAboveOverlay: true,
        });

        fabricRef.current = canvas;

        // ── Print area clip rect (invisible, used for clipping) ────────────
        const clipRect = new Rect({
            left: printArea.x * CANVAS_W,
            top: printArea.y * CANVAS_H,
            width: printArea.width * CANVAS_W,
            height: printArea.height * CANVAS_H,
            absolutePositioned: true,
            selectable: false,
            evented: false,
        });
        clipRectRef.current = clipRect;

        // ── Print area visible dashed border ───────────────────────────────
        const printRect = new Rect({
            left: printArea.x * CANVAS_W,
            top: printArea.y * CANVAS_H,
            width: printArea.width * CANVAS_W,
            height: printArea.height * CANVAS_H,
            fill: 'rgba(99,102,241,0.04)',
            stroke: 'rgba(79,70,229,0.55)',
            strokeWidth: 2.5,
            strokeDashArray: [10, 7],
            selectable: false,
            evented: false,
            excludeFromExport: true,
        });
        printRectRef.current = printRect;
        canvas.add(printRect);

        // ── Load background product image ──────────────────────────────────
        if (templateSrc) {
            const url = proxyImageUrl(templateSrc);
            FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then((img) => {
                if (!img || !fabricRef.current) return;

                const aspect = img.width / img.height;
                let drawW = CANVAS_W;
                let drawH = drawW / aspect;
                if (drawH < CANVAS_H) {
                    drawH = CANVAS_H;
                    drawW = drawH * aspect;
                }
                img.set({
                    left: (CANVAS_W - drawW) / 2,
                    top: (CANVAS_H - drawH) / 2,
                    scaleX: drawW / img.width,
                    scaleY: drawH / img.height,
                    selectable: false,
                    evented: false,
                    excludeFromExport: false,
                    _isBackground: true,
                });
                bgImageRef.current = img;

                // Insert behind everything
                canvas.insertAt(0, img);
                // Ensure print rect is above bg but below user objects
                canvas.bringObjectToFront(printRect);
                canvas.requestRenderAll();
            }).catch(err => {
                console.error('Could not load product template:', err);
            });
        }

        // ── Canvas events ──────────────────────────────────────────────────
        canvas.on('selection:created', (e) => {
            const sel = e.selected?.[0];
            if (sel?._layerId) {
                setSelectedLayerId(sel._layerId);
            }
        });

        canvas.on('selection:updated', (e) => {
            const sel = e.selected?.[0];
            if (sel?._layerId) {
                setSelectedLayerId(sel._layerId);
            }
        });

        canvas.on('selection:cleared', () => {
            setSelectedLayerId(null);
        });

        canvas.on('object:modified', () => {
            syncLayers();
            pushHistory();
        });

        canvas.on('object:added', () => {
            if (!skipHistoryRef.current) {
                syncLayers();
                pushHistory();
            }
        });

        canvas.on('object:removed', () => {
            if (!skipHistoryRef.current) {
                syncLayers();
                pushHistory();
            }
        });

        // Constrain objects to print area on move
        canvas.on('object:moving', (e) => {
            const obj = e.target;
            if (!obj || obj._isBackground || !obj._layerId) return;

            const pa = clipRectRef.current;
            if (!pa) return;

            const bound = obj.getBoundingRect();
            const areaLeft = pa.left;
            const areaTop = pa.top;
            const areaRight = pa.left + pa.width;
            const areaBottom = pa.top + pa.height;

            // Keep at least 20% of the object inside the print area
            const minVisible = 0.2;
            const minX = areaLeft - bound.width * (1 - minVisible);
            const maxX = areaRight - bound.width * minVisible;
            const minY = areaTop - bound.height * (1 - minVisible);
            const maxY = areaBottom - bound.height * minVisible;

            if (obj.left < minX) obj.set('left', minX);
            if (obj.left > maxX) obj.set('left', maxX);
            if (obj.top < minY) obj.set('top', minY);
            if (obj.top > maxY) obj.set('top', maxY);
        });

        pushHistory();

        // ── Responsive scaling ──────────────────────────────────────────────
        // Fabric.js creates a wrapper div at 900×900px with inline styles.
        // We use a ResizeObserver to scale it down to fit the fc-canvas-frame.
        const scaleFabricCanvas = () => {
            const frame = frameRef.current;
            const canvasEl = canvasElRef.current;
            if (!frame || !canvasEl) return;

            // Fabric.js wrapper is the parent of our original canvas element
            const wrapper = canvasEl.parentElement;
            if (!wrapper) return;

            const frameW = frame.clientWidth;
            const frameH = frame.clientHeight;

            // Override inline styles on the Fabric.js wrapper
            wrapper.style.width = frameW + 'px';
            wrapper.style.height = frameH + 'px';

            // Scale both canvas layers (lower-canvas + upper-canvas)
            const canvases = wrapper.querySelectorAll('canvas');
            canvases.forEach(c => {
                c.style.width = frameW + 'px';
                c.style.height = frameH + 'px';
            });
        };

        // Initial scale
        scaleFabricCanvas();

        // Re-scale on resize
        const ro = new ResizeObserver(() => scaleFabricCanvas());
        if (frameRef.current) ro.observe(frameRef.current);

        return () => {
            ro.disconnect();
            canvas.dispose();
            fabricRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fabricLoaded, fabricModule]);

    // ── Sync layers from canvas ────────────────────────────────────────────
    const syncLayers = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const objs = canvas.getObjects().filter(o => o._layerId);
        const layerList = objs.map(o => ({
            id: o._layerId,
            type: o._layerType || 'unknown',
            name: o._layerName || 'Layer',
        }));

        setLayers(layerList);
    }, []);

    // ── History (undo) ─────────────────────────────────────────────────────
    const pushHistory = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas || skipHistoryRef.current) return;

        const json = JSON.stringify(canvas.toJSON(['_layerId', '_layerType', '_layerName', '_isBackground', 'excludeFromExport']));
        const idx = historyIndexRef.current;
        historyRef.current = historyRef.current.slice(0, idx + 1);
        historyRef.current.push(json);
        historyIndexRef.current = historyRef.current.length - 1;
    }, []);

    const undo = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas || !fabricModule) return;
        if (historyIndexRef.current <= 0) return;

        historyIndexRef.current -= 1;
        const json = historyRef.current[historyIndexRef.current];

        skipHistoryRef.current = true;
        canvas.loadFromJSON(JSON.parse(json)).then(() => {
            // Restore refs
            const objs = canvas.getObjects();
            bgImageRef.current = objs.find(o => o._isBackground) || null;
            printRectRef.current = objs.find(o => o.strokeDashArray && !o._layerId && !o._isBackground) || null;

            canvas.requestRenderAll();
            syncLayers();
            skipHistoryRef.current = false;
        });
    }, [fabricModule, syncLayers]);

    // ── Save/restore side state ────────────────────────────────────────────
    const saveSideState = useCallback((side) => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const json = canvas.toJSON(['_layerId', '_layerType', '_layerName', '_isBackground', 'excludeFromExport']);
        setSideStates(prev => ({
            ...prev,
            [side]: {
                canvasJSON: json,
                objects: canvas.getObjects().filter(o => o._layerId).map(o => ({
                    id: o._layerId,
                    type: o._layerType,
                    name: o._layerName,
                })),
            },
        }));
    }, []);

    const restoreSideState = useCallback((side) => {
        const canvas = fabricRef.current;
        if (!canvas || !fabricModule) return;

        const state = sideStates[side];
        if (!state?.canvasJSON) {
            // Clear user objects, keep bg + print area
            const toRemove = canvas.getObjects().filter(o => o._layerId);
            toRemove.forEach(o => canvas.remove(o));
            canvas.requestRenderAll();
            syncLayers();
            return;
        }

        skipHistoryRef.current = true;
        canvas.loadFromJSON(state.canvasJSON).then(() => {
            const objs = canvas.getObjects();
            bgImageRef.current = objs.find(o => o._isBackground) || null;
            printRectRef.current = objs.find(o => o.strokeDashArray && !o._layerId && !o._isBackground) || null;
            canvas.requestRenderAll();
            syncLayers();
            skipHistoryRef.current = false;
        });
    }, [fabricModule, sideStates, syncLayers]);

    // ── Switch side ────────────────────────────────────────────────────────
    const handleSideChange = useCallback((newSide) => {
        if (newSide === activeSide) return;

        saveSideState(activeSide);

        setActiveSide(newSide);

        // defer restore to next tick so state has committed
        setTimeout(() => {
            restoreSideState(newSide);
        }, 0);
    }, [activeSide, saveSideState, restoreSideState]);

    // ── Direct Upload to Supabase Storage via Signed URLs ──────────────────
    // Bypasses Node.js server memory and bandwidth entirely.
    const uploadToBackend = useCallback(async (fileOrDataUrl, mimeType, fileName) => {
        let blob = fileOrDataUrl;
        let finalMime = mimeType;

        if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
            blob = dataUrlToBlob(fileOrDataUrl);
            finalMime = blob.type || mimeType || 'image/png';
        } else if (fileOrDataUrl instanceof File) {
            blob = fileOrDataUrl;
            finalMime = fileOrDataUrl.type || mimeType || 'image/png';
        }

        const accessToken = session?.access_token;
        if (!accessToken) {
            throw new Error('Authentication session missing. Please log in again.');
        }

        // 1. Request short-lived signed upload URL from backend (fast, lightweight JSON)
        const signRes = await fetch('/api/storage/signed-upload-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                fileName: fileName || 'design.png',
                mimeType: finalMime,
                folder: 'designs',
            }),
        });

        const signData = await signRes.json();
        if (!signRes.ok) throw new Error(signData.error || 'Failed to initialize secure upload.');

        const { path, token, publicUrl } = signData;

        // 2. Upload file directly to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('design-uploads')
            .uploadToSignedUrl(path, token, blob, {
                contentType: finalMime,
                upsert: true,
            });

        if (uploadError) {
            console.error('Direct upload failed:', uploadError);
            throw new Error(uploadError.message || 'Direct upload to storage failed.');
        }

        return publicUrl;
    }, [session]);

    // ── Add image to canvas ────────────────────────────────────────────────
    const handleFileChange = useCallback(async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Maximum file size is 10MB.');
            return;
        }

        const canvas = fabricRef.current;
        if (!canvas || !fabricModule) return;

        setError('');
        setUploading(true);

        try {
            // Convert file to data URL (Fabric.js v6 handles data URLs more reliably than blob URLs)
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const { FabricImage } = fabricModule;

            const img = await FabricImage.fromURL(dataUrl);
            if (!img) throw new Error('Could not load image.');

            // Scale to fit 70% of print area
            const maxW = printArea.width * CANVAS_W * 0.70;
            const maxH = printArea.height * CANVAS_H * 0.70;
            const aspect = img.width / img.height;
            let w = maxW;
            let h = w / aspect;
            if (h > maxH) { h = maxH; w = h * aspect; }

            const layerId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

            img.set({
                left: (printArea.x + printArea.width / 2) * CANVAS_W - w / 2,
                top: (printArea.y + printArea.height / 2) * CANVAS_H - h / 2,
                scaleX: w / img.width,
                scaleY: h / img.height,
                _layerId: layerId,
                _layerType: 'image',
                _layerName: file.name.length > 20 ? file.name.slice(0, 17) + '...' : file.name,
                clipPath: clipRectRef.current,
                // Store upload info
                _uploadFile: file,
                _uploadedUrl: '',
            });

            // Custom control styling
            img.set({
                cornerColor: '#4f46e5',
                cornerStrokeColor: '#ffffff',
                cornerSize: 12,
                cornerStyle: 'circle',
                transparentCorners: false,
                borderColor: '#818cf8',
                borderScaleFactor: 2,
                padding: 8,
            });

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.requestRenderAll();

            setSelectedLayerId(layerId);

            // Upload in background
            const publicUrl = await uploadToBackend(
                file,
                file.type,
                `original_${customDesignId}_${activeSide}_${file.name}`
            );

            img._uploadedUrl = publicUrl;
        } catch (err) {
            console.error('Design image error:', err);
            setError(err.message || 'Failed to add design image.');
        } finally {
            setUploading(false);
        }
    }, [fabricModule, printArea, uploadToBackend, customDesignId, activeSide]);

    // ── Add text ───────────────────────────────────────────────────────────
    const handleAddText = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas || !fabricModule) return;

        const { IText } = fabricModule;
        const content = textInput.trim() || 'Your Text';

        const layerId = `txt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

        const text = new IText(content, {
            left: (printArea.x + printArea.width / 2) * CANVAS_W,
            top: (printArea.y + printArea.height / 2) * CANVAS_H,
            originX: 'center',
            originY: 'center',
            fontFamily: textFont,
            fontSize: textSize,
            fill: textColor,
            _layerId: layerId,
            _layerType: 'text',
            _layerName: content.length > 20 ? content.slice(0, 17) + '...' : content,
            clipPath: clipRectRef.current,
            // Control styling
            cornerColor: '#4f46e5',
            cornerStrokeColor: '#ffffff',
            cornerSize: 12,
            cornerStyle: 'circle',
            transparentCorners: false,
            borderColor: '#818cf8',
            borderScaleFactor: 2,
            padding: 8,
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.requestRenderAll();

        setSelectedLayerId(layerId);
        setTextInput('');
    }, [fabricModule, textInput, textFont, textSize, textColor, printArea]);

    // ── Delete selected ────────────────────────────────────────────────────
    const handleDeleteSelected = useCallback(() => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const active = canvas.getActiveObject();
        if (active && active._layerId) {
            canvas.remove(active);
            canvas.discardActiveObject();
            canvas.requestRenderAll();
            setSelectedLayerId(null);
        }
    }, []);

    // ── Select layer ───────────────────────────────────────────────────────
    const handleSelectLayer = useCallback((layerId) => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const obj = canvas.getObjects().find(o => o._layerId === layerId);
        if (obj) {
            canvas.setActiveObject(obj);
            canvas.requestRenderAll();
            setSelectedLayerId(layerId);
        }
    }, []);

    // ── Delete layer ───────────────────────────────────────────────────────
    const handleDeleteLayer = useCallback((layerId) => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const obj = canvas.getObjects().find(o => o._layerId === layerId);
        if (obj) {
            canvas.remove(obj);
            if (selectedLayerId === layerId) {
                canvas.discardActiveObject();
                setSelectedLayerId(null);
            }
            canvas.requestRenderAll();
        }
    }, [selectedLayerId]);

    // ── Create preview and export print data ───────────────────────────────
    const exportDesignData = useCallback(async (canvas, side) => {
        if (!canvas) throw new Error('Canvas unavailable.');

        // Hide print area rect & selection for clean export
        const printRect = printRectRef.current;
        if (printRect) printRect.set('visible', false);
        canvas.discardActiveObject();
        canvas.requestRenderAll();

        await new Promise(resolve => requestAnimationFrame(resolve));

        const dataUrl = canvas.toDataURL({ format: 'jpeg', quality: 0.92 });

        // Restore print rect
        if (printRect) printRect.set('visible', true);
        canvas.requestRenderAll();

        // Upload preview
        const previewUrl = await uploadToBackend(
            dataUrl,
            'image/jpeg',
            `preview_${customDesignId}_${side}.jpg`
        );

        // Collect object data for print
        const userObjects = canvas.getObjects().filter(o => o._layerId);
        const objectsData = userObjects.map(o => {
            const bound = o.getBoundingRect();
            const base = {
                type: o._layerType,
                left: Math.round(o.left),
                top: Math.round(o.top),
                width: Math.round(bound.width),
                height: Math.round(bound.height),
                scaleX: o.scaleX,
                scaleY: o.scaleY,
                angle: Math.round(o.angle || 0),
                relativeToArea: {
                    xPercent: +((o.left - printArea.x * CANVAS_W) / (printArea.width * CANVAS_W)).toFixed(4),
                    yPercent: +((o.top - printArea.y * CANVAS_H) / (printArea.height * CANVAS_H)).toFixed(4),
                    widthPercent: +(bound.width / (printArea.width * CANVAS_W)).toFixed(4),
                    heightPercent: +(bound.height / (printArea.height * CANVAS_H)).toFixed(4),
                },
            };

            if (o._layerType === 'image') {
                base.originalUrl = o._uploadedUrl || '';
            } else if (o._layerType === 'text') {
                base.text = o.text;
                base.fontFamily = o.fontFamily;
                base.fontSize = o.fontSize;
                base.fill = o.fill;
                base.fontWeight = o.fontWeight;
                base.fontStyle = o.fontStyle;
                base.underline = o.underline;
            }

            return base;
        });

        return {
            previewUrl,
            printArea: {
                x: Math.round(printArea.x * CANVAS_W),
                y: Math.round(printArea.y * CANVAS_H),
                width: Math.round(printArea.width * CANVAS_W),
                height: Math.round(printArea.height * CANVAS_H),
            },
            objects: objectsData,
        };
    }, [uploadToBackend, customDesignId, printArea]);

    // ── Add to cart ────────────────────────────────────────────────────────
    const handleAddToCart = useCallback(async () => {
        const canvas = fabricRef.current;
        if (!canvas) return;

        const userObjects = canvas.getObjects().filter(o => o._layerId);
        if (userObjects.length === 0) {
            setError('Please add at least one design or text to your product.');
            return;
        }

        // Check if images are uploaded
        const pendingImages = userObjects.filter(o => o._layerType === 'image' && !o._uploadedUrl);
        if (pendingImages.length > 0) {
            setError('Some images are still uploading. Please wait.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            // Save current side
            saveSideState(activeSide);

            const sideResults = {};
            let mainPreviewUrl = '';

            // Export current active side first
            const currentSideData = await exportDesignData(canvas, activeSide);
            sideResults[activeSide] = currentSideData;
            mainPreviewUrl = currentSideData.previewUrl;

            // For multi-side products, export other sides
            if (sides.length > 1) {
                for (const side of sides) {
                    if (side === activeSide) continue;

                    const state = sideStates[side];
                    if (state?.canvasJSON) {
                        // Load the side
                        skipHistoryRef.current = true;
                        await canvas.loadFromJSON(state.canvasJSON);
                        canvas.requestRenderAll();

                        const sideData = await exportDesignData(canvas, side);
                        sideResults[side] = sideData;

                        skipHistoryRef.current = false;
                    }
                }

                // Restore active side
                skipHistoryRef.current = true;
                const currentState = sideStates[activeSide];
                if (currentState?.canvasJSON) {
                    await canvas.loadFromJSON(currentState.canvasJSON);
                } else {
                    // Re-export won't work but the data was already captured
                }
                canvas.requestRenderAll();
                skipHistoryRef.current = false;
            }

            // Build cart customization data
            const customizationData = {
                type: config?.type || 'other',
                version: 2,
                customDesignId,

                uploadedImageUrl: mainPreviewUrl,
                previewUrl: mainPreviewUrl,

                rawProductUrl: templateSrc,
                selectedColor: selectedColor || null,
                selectedSize: selectedSize || null,
                quantity,

                hasCustomDesign: true,

                printData: {
                    productType: config?.type || 'other',
                    canvasWidth: CANVAS_W,
                    canvasHeight: CANVAS_H,
                    sides: sideResults,
                },

                // Legacy compat fields
                front: sideResults.front ? {
                    originalUrl: sideResults.front.objects?.[0]?.originalUrl || mainPreviewUrl,
                    previewUrl: sideResults.front.previewUrl,
                    printArea: sideResults.front.printArea,
                    objects: sideResults.front.objects,
                } : undefined,

                back: sideResults.back ? {
                    originalUrl: sideResults.back.objects?.[0]?.originalUrl || '',
                    previewUrl: sideResults.back.previewUrl,
                    printArea: sideResults.back.printArea,
                    objects: sideResults.back.objects,
                } : undefined,
            };

            onAddToCart(customizationData);
            onClose();
        } catch (err) {
            console.error('Customizer save error:', err);
            setError(err.message || 'Could not save your customization.');
        } finally {
            setSaving(false);
        }
    }, [
        activeSide, sides, sideStates, saveSideState, exportDesignData,
        customDesignId, templateSrc, selectedColor, selectedSize,
        quantity, config, onAddToCart, onClose,
    ]);

    // ── Loading state ──────────────────────────────────────────────────────
    if (!fabricLoaded) {
        return (
            <div className="fc-overlay">
                <div className="fc-modal" style={{ maxWidth: 400, padding: 60, textAlign: 'center' }}>
                    <span className="material-symbols-outlined fc-spin" style={{ fontSize: 36, color: '#6366f1' }}>
                        progress_activity
                    </span>
                    <p style={{ marginTop: 16, fontWeight: 700, color: '#374151' }}>
                        Loading Design Editor...
                    </p>
                </div>
            </div>
        );
    }

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div
            className="fc-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget && !saving) onClose();
            }}
        >
            <div className="fc-modal">
                {/* ── Header ────────────────────────────────────────────── */}
                <header className="fc-header">
                    <div>
                        <h2 className="fc-header-title">
                            Customize Your Product
                        </h2>
                        <p className="fc-header-sub">
                            {product?.name || 'Custom Product'}
                            {selectedColor ? ` · ${selectedColor}` : ''}
                            {selectedSize ? ` · ${selectedSize}` : ''}
                        </p>
                    </div>
                    <button
                        className="fc-close-btn"
                        onClick={onClose}
                        disabled={saving}
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </header>

                {/* ── Body ──────────────────────────────────────────────── */}
                <div className="fc-body">
                    {/* ── Canvas Section ────────────────────────────────── */}
                    <section className="fc-canvas-section">
                        {/* Side tabs */}
                        {sides.length > 1 && (
                            <div className="fc-side-tabs">
                                {sides.map(side => (
                                    <button
                                        key={side}
                                        className={`fc-side-tab ${activeSide === side ? 'fc-side-tab--active' : 'fc-side-tab--inactive'}`}
                                        onClick={() => handleSideChange(side)}
                                    >
                                        {side.charAt(0).toUpperCase() + side.slice(1)}
                                    </button>
                                ))}
                                <span className="fc-side-hint">
                                    {activeSide.charAt(0).toUpperCase() + activeSide.slice(1)} design
                                </span>
                            </div>
                        )}

                        {/* Canvas */}
                        <div className="fc-canvas-wrapper">
                            <div className="fc-canvas-frame" ref={frameRef}>
                                <canvas ref={canvasElRef} />
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="fc-toolbar">
                            <button
                                className="fc-toolbar-btn fc-toolbar-btn--primary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                <span className="material-symbols-outlined fc-toolbar-icon">
                                    add_photo_alternate
                                </span>
                                Add Image
                            </button>

                            <button
                                className="fc-toolbar-btn fc-toolbar-btn--secondary"
                                onClick={handleAddText}
                            >
                                <span className="material-symbols-outlined fc-toolbar-icon">
                                    text_fields
                                </span>
                                Add Text
                            </button>

                            <div className="fc-toolbar-sep" />

                            <button
                                className="fc-toolbar-btn fc-toolbar-btn--secondary"
                                onClick={undo}
                                title="Undo"
                            >
                                <span className="material-symbols-outlined fc-toolbar-icon">
                                    undo
                                </span>
                            </button>

                            <button
                                className="fc-toolbar-btn fc-toolbar-btn--danger"
                                onClick={handleDeleteSelected}
                                disabled={!selectedLayerId}
                                title="Delete selected"
                            >
                                <span className="material-symbols-outlined fc-toolbar-icon">
                                    delete
                                </span>
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                onChange={handleFileChange}
                                className="fc-file-input"
                            />

                            <span className="fc-toolbar-hint">
                                {uploading ? 'Uploading image...' : 'Drag to move · Corners to resize/rotate'}
                            </span>
                        </div>
                    </section>

                    {/* ── Sidebar ───────────────────────────────────────── */}
                    <aside className="fc-sidebar">
                        {/* Text controls */}
                        <div>
                            <p className="fc-section-label">Add Text</p>
                            <div className="fc-text-controls">
                                <div className="fc-text-row">
                                    <input
                                        type="text"
                                        className="fc-text-input"
                                        placeholder="Enter your text..."
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddText();
                                        }}
                                    />
                                </div>
                                <div className="fc-text-row">
                                    <select
                                        className="fc-text-select"
                                        value={textFont}
                                        onChange={(e) => setTextFont(e.target.value)}
                                        style={{ flex: 1, fontFamily: textFont }}
                                    >
                                        {FONTS.map(f => (
                                            <option key={f} value={f} style={{ fontFamily: f }}>
                                                {f}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        className="fc-font-size-input"
                                        value={textSize}
                                        min={8}
                                        max={200}
                                        onChange={(e) => setTextSize(Number(e.target.value) || 40)}
                                    />
                                    <input
                                        type="color"
                                        className="fc-color-input"
                                        value={textColor}
                                        onChange={(e) => setTextColor(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Layers */}
                        <div>
                            <p className="fc-section-label">
                                Layers ({layers.length})
                            </p>
                            {layers.length > 0 ? (
                                <div className="fc-layers">
                                    {[...layers].reverse().map(layer => (
                                        <div
                                            key={layer.id}
                                            className={`fc-layer-item ${selectedLayerId === layer.id ? 'fc-layer-item--active' : ''}`}
                                            onClick={() => handleSelectLayer(layer.id)}
                                        >
                                            <span className="material-symbols-outlined fc-layer-icon">
                                                {layer.type === 'image' ? 'image' : 'text_fields'}
                                            </span>
                                            <span className="fc-layer-name">
                                                {layer.name}
                                            </span>
                                            <button
                                                className="fc-layer-delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteLayer(layer.id);
                                                }}
                                                title="Remove"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                                                    close
                                                </span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="fc-no-layers">
                                    Add images or text to start designing
                                </p>
                            )}
                        </div>

                        {/* Product summary */}
                        <div className="fc-summary">
                            <div className="fc-summary-row">
                                <span className="fc-summary-label">Product</span>
                                <span className="fc-summary-value">{product?.name}</span>
                            </div>
                            {selectedColor && (
                                <div className="fc-summary-row">
                                    <span className="fc-summary-label">Color</span>
                                    <span className="fc-summary-value">{selectedColor}</span>
                                </div>
                            )}
                            {selectedSize && (
                                <div className="fc-summary-row">
                                    <span className="fc-summary-label">Size</span>
                                    <span className="fc-summary-value">{selectedSize}</span>
                                </div>
                            )}
                            <div className="fc-summary-row">
                                <span className="fc-summary-label">Quantity</span>
                                <span className="fc-summary-value">{quantity}</span>
                            </div>
                            <div className="fc-summary-total">
                                <span className="fc-summary-total-label">Total</span>
                                <span className="fc-summary-total-value">
                                    ₹{(Number(effectivePrice || 0) * quantity).toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="fc-error">
                                <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0 }}>
                                    error
                                </span>
                                {error}
                            </div>
                        )}

                        {/* CTA */}
                        <button
                            className="fc-cta-primary"
                            onClick={handleAddToCart}
                            disabled={saving || uploading || layers.length === 0}
                        >
                            {saving ? (
                                <>
                                    <span className="material-symbols-outlined fc-spin" style={{ fontSize: 18 }}>
                                        progress_activity
                                    </span>
                                    Saving Design...
                                </>
                            ) : uploading ? (
                                'Uploading Design...'
                            ) : (
                                <>
                                    Add Custom Design to Cart
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                        arrow_forward
                                    </span>
                                </>
                            )}
                        </button>

                        <button
                            className="fc-cta-cancel"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancel
                        </button>

                        <p className="fc-footer-hint">
                            Your original designs and final product preview are saved
                            with exact print coordinates for production accuracy.
                        </p>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default FabricCustomizer;
