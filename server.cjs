const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ─── Load .env.local ───────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        if (key && !process.env[key]) process.env[key] = value;
    }
    console.log('✅ Loaded .env.local');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
const PORT = process.env.PORT || 5001;

// ─── Supabase Admin Client ─────────────────────────────────────────────────────
let supabaseAdmin = null;
const supabaseUrl    = (process.env.VITE_SUPABASE_URL        || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (supabaseUrl && serviceRoleKey && !serviceRoleKey.startsWith('YOUR_')) {
    const { createClient } = require('@supabase/supabase-js');
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    console.log('✅ Supabase Admin (service role) initialized – RLS bypassed.');
} else {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is missing or still a placeholder in .env.local.');
}

// ─── Razorpay ─────────────────────────────────────────────────────────────────
let razorpayInstance = null;
const rzpKeyId     = (process.env.VITE_RAZORPAY_KEY_ID || '').trim();
const rzpKeySecret = (process.env.RAZORPAY_KEY_SECRET   || '').trim();

if (rzpKeyId && rzpKeySecret && !rzpKeySecret.startsWith('YOUR_')) {
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({ key_id: rzpKeyId, key_secret: rzpKeySecret });
    console.log('✅ Razorpay initialized.');
} else {
    console.warn('⚠️  RAZORPAY_KEY_SECRET is missing or still a placeholder in .env.local.');
}

// ─── Shiprocket ─────────────────────────────────────────────────────────────
const SHIPROCKET_BASE = (process.env.SHIPROCKET_BASE || 'https://apiv2.shiprocket.in').trim();
const shiprocketEmail = (process.env.SHIPROCKET_EMAIL || '').trim();
const shiprocketPassword = (process.env.SHIPROCKET_PASSWORD || '').trim();
const shiprocketChannelId = (process.env.SHIPROCKET_CHANNEL_ID || '').trim();
const shiprocketPickupLocation = (process.env.SHIPROCKET_PICKUP_LOCATION || '').trim();

let shiprocketToken = null;
let shiprocketTokenExpiresAt = 0;

const isShiprocketConfigured = () =>
    !!shiprocketEmail && !!shiprocketPassword && !!shiprocketChannelId && !!shiprocketPickupLocation;

async function getShiprocketToken() {
    if (shiprocketToken && Date.now() < shiprocketTokenExpiresAt) return shiprocketToken;
    const res = await fetch(`${SHIPROCKET_BASE}/v1/external/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: shiprocketEmail, password: shiprocketPassword })
    });
    const data = await res.json();
    if (!res.ok || !data?.token) {
        throw new Error(data?.message || 'Shiprocket auth failed');
    }
    shiprocketToken = data.token;
    shiprocketTokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000;
    return shiprocketToken;
}

async function shiprocketRequest(path, { method = 'GET', body } = {}) {
    const token = await getShiprocketToken();
    const res = await fetch(`${SHIPROCKET_BASE}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data?.message || `Shiprocket request failed: ${res.status}`);
    }
    return data;
}

async function checkShiprocketServiceability({ deliveryPincode, weightKg }) {
    const pickup = pickupDetails.pin;
    const weight = Math.max(0.5, weightKg || 0.5);
    const url = `/v1/external/courier/serviceability/?pickup_postcode=${pickup}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=0`;
    const data = await shiprocketRequest(url);
    const available = Array.isArray(data?.available_courier_companies) ? data.available_courier_companies : [];
    if (available.length === 0) {
        return { serviceable: false, message: `Pincode ${deliveryPincode} is not serviceable by Shiprocket.` };
    }
    const cheapest = available.reduce((best, item) => {
        if (!best) return item;
        return (item.rate || Infinity) < (best.rate || Infinity) ? item : best;
    }, null);
    return {
        serviceable: true,
        message: `Pincode ${deliveryPincode} is serviceable.`,
        courierId: cheapest?.courier_company_id || null,
    };
}

async function createShiprocketShipment({ supabaseOrderId, shippingAddress, customerEmail, customerName, cartItems }) {
    const totalWeight = Math.max(0.5, cartItems.reduce((s, i) => s + (i.quantity * 0.5), 0));
    const orderTotal = cartItems.reduce((s, i) => s + (i.price * i.quantity), 0);

    const orderPayload = {
        order_id: supabaseOrderId,
        order_date: new Date().toISOString().replace('T', ' ').split('.')[0],
        pickup_location: shiprocketPickupLocation,
        channel_id: Number(shiprocketChannelId),
        billing_customer_name: shippingAddress.firstName || customerName || 'Customer',
        billing_last_name: shippingAddress.lastName || '',
        billing_address: shippingAddress.address || '',
        billing_address_2: shippingAddress.address2 || '',
        billing_city: shippingAddress.city || '',
        billing_state: shippingAddress.state || '',
        billing_country: 'India',
        billing_pincode: shippingAddress.pincode || '',
        billing_email: shippingAddress.email || customerEmail || '',
        billing_phone: shippingAddress.phone || '',
        shipping_is_billing: true,
        order_items: cartItems.map(item => ({
            name: item.name || 'Custom Print',
            sku: item.variantId || item.id || 'custom',
            units: item.quantity || 1,
            selling_price: Number(item.price || 0),
        })),
        payment_method: 'Prepaid',
        sub_total: Number(orderTotal.toFixed(2)),
        length: 15,
        breadth: 15,
        height: 5,
        weight: Number(totalWeight.toFixed(2)),
    };

    const orderRes = await shiprocketRequest('/v1/external/orders/create/adhoc', {
        method: 'POST',
        body: orderPayload,
    });

    const shipmentId = orderRes?.shipment_id;
    const shiprocketOrderId = orderRes?.order_id || null;
    if (!shipmentId) {
        throw new Error('Shiprocket did not return shipment_id');
    }

    let courierId = null;
    try {
        const svc = await checkShiprocketServiceability({
            deliveryPincode: shippingAddress.pincode,
            weightKg: totalWeight,
        });
        courierId = svc.courierId || null;
    } catch (_) {
        courierId = null;
    }

    let awbCode = null;
    let courierName = 'Shiprocket';
    if (courierId) {
        const awbRes = await shiprocketRequest('/v1/external/courier/assign/awb', {
            method: 'POST',
            body: { shipment_id: shipmentId, courier_id: courierId },
        });
        awbCode = awbRes?.awb_code || null;
        courierName = awbRes?.courier_name || courierName;
    }

    if (awbCode) {
        try {
            await shiprocketRequest('/v1/external/courier/generate/pickup', {
                method: 'POST',
                body: { shipment_id: [shipmentId] },
            });
        } catch (err) {
            console.warn('⚠️  Shiprocket pickup request failed (non-fatal):', err.message);
        }
    }

    const trackingUrl = awbCode ? `https://shiprocket.co/tracking/${awbCode}` : null;
    return {
        awb_code: awbCode,
        courier_name: courierName,
        tracking_url: trackingUrl,
        shiprocket_order_id: shiprocketOrderId,
        shiprocket_shipment_id: shipmentId,
    };
}

// Shared pickup warehouse details (used by Shiprocket serviceability)
const pickupDetails = {
    name:    (process.env.PICKUP_NAME || 'Printing Ustad').trim(),
    add:     (process.env.PICKUP_ADDRESS || 'Your Warehouse Address').trim(),
    city:    (process.env.PICKUP_CITY    || 'Delhi').trim(),
    state:   (process.env.PICKUP_STATE   || 'Delhi').trim(),
    country: 'India',
    pin:     (process.env.PICKUP_PINCODE || '110001').trim(),
    phone:   (process.env.PICKUP_PHONE   || '9999999999').trim(),
};

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status:             'ok',
        razorpayReady:      !!razorpayInstance,
        supabaseAdminReady: !!supabaseAdmin,
        shiprocketReady:    isShiprocketConfigured(),
    });
});

// ─── GET /api/check-serviceability/:pincode ───────────────────────────────────
// Lets the frontend verify a pincode is deliverable before checkout.
// Proxy endpoint to bypass CORS for third-party images (allows Canvas toDataURL to work)
app.get('/api/proxy-image', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) return res.status(400).send('URL required');
        
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        
        const contentType = response.headers.get('content-type');
        const arrayBuffer = await response.arrayBuffer();
        
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        res.send(Buffer.from(arrayBuffer));
    } catch (err) {
        console.error("Proxy Image Error:", err.message);
        res.status(500).send('Failed to proxy image');
    }
});

app.get('/api/check-serviceability/:pincode', async (req, res) => {
    try {
        const pincode = req.params.pincode;
        if (!isShiprocketConfigured()) {
            return res.status(503).json({ serviceable: false, message: 'Shiprocket not configured.' });
        }
        const result = await checkShiprocketServiceability({ deliveryPincode: pincode, weightKg: 0.5 });
        return res.json({ serviceable: result.serviceable, message: result.message });
    } catch (err) {
        res.status(500).json({ serviceable: false, message: err.message });
    }
});

// ─── POST /api/create-order ───────────────────────────────────────────────────
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount, userId, userEmail, cartItems, subtotal, shipping, tax, total, shippingAddress } = req.body;

        if (!amount || isNaN(amount)) {
            return res.status(400).json({ error: 'A valid amount (in paise) is required.' });
        }
        if (!razorpayInstance) {
            return res.status(503).json({
                error: 'Razorpay is not configured on the server.',
                hint: 'Add your real RAZORPAY_KEY_SECRET to .env.local and restart.'
            });
        }

        // Validate shipping address
        if (!shippingAddress || !shippingAddress.phone || !shippingAddress.pincode) {
            return res.status(400).json({ error: 'Shipping address with phone and pincode is required.' });
        }

        // 1. Ensure profile exists
        if (supabaseAdmin && userId) {
            await supabaseAdmin.from('profiles')
                .upsert({ id: userId, full_name: shippingAddress.firstName || userEmail?.split('@')[0] || 'User' }, { onConflict: 'id' });
        }

        // 2. Create Supabase order
        let supabaseOrderId = null;
        if (supabaseAdmin && userId) {
            const { data: order, error: orderErr } = await supabaseAdmin
                .from('orders')
                .insert({
                    user_id:          userId,
                    status:           'pending',
                    subtotal:         subtotal || 0,
                    shipping_cost:    shipping || 0,
                    tax_amount:       tax      || 0,
                    total_amount:     total    || 0,
                    shipping_address: shippingAddress || {}
                })
                .select()
                .single();

            if (orderErr) {
                console.error('❌ Supabase order insert error:', orderErr.message);
                return res.status(500).json({ error: 'Database Error: Could not save order.', hint: orderErr.message });
            }
            supabaseOrderId = order.id;

            // Create order items
            if (cartItems && cartItems.length > 0) {
                const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                const items = cartItems.map(item => ({
                    order_id:       supabaseOrderId,
                    product_id:     uuidRe.test(item.id) ? item.id : null,
                    variant_id:     item.variantId || null,
                    quantity:       item.quantity,
                    unit_price:     item.price,
                    customizations: item.customizations || item.attributes || {}
                }));
                const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(items);
                if (itemsErr) console.error('⚠️  Order items insert error:', itemsErr.message);
            }
        }

        // 3. Create Razorpay order
        const rzpOrder = await razorpayInstance.orders.create({
            amount:   Math.round(amount),
            currency: 'INR',
            receipt:  `receipt_${Date.now()}`
        });

        res.json({
            razorpayOrderId: rzpOrder.id,
            supabaseOrderId,
            amount:   rzpOrder.amount,
            currency: rzpOrder.currency
        });

    } catch (error) {
        console.error('❌ Error in /api/create-order:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

// ─── POST /api/confirm-payment ────────────────────────────────────────────────
// Called after Razorpay success: updates order status + creates Delhivery shipment.
app.post('/api/confirm-payment', async (req, res) => {
    try {
        const { supabaseOrderId, razorpayPaymentId, cartItems, shippingAddress, customerEmail, customerName } = req.body;

        if (!supabaseAdmin || !supabaseOrderId) {
            return res.json({ success: true, delhivery: null });
        }

        // 1. Mark order as 'processing'
        const { error: updateErr } = await supabaseAdmin
            .from('orders')
            .update({ status: 'processing', updated_at: new Date().toISOString() })
            .eq('id', supabaseOrderId);

        if (updateErr) console.error('⚠️  Error updating order status:', updateErr.message);

        // 2. Create shipment (non-fatal – never blocks payment success)
        let shipmentResult = null;
        if (shippingAddress) {
            try {
                if (!isShiprocketConfigured()) {
                    throw new Error('Shiprocket not configured');
                }
                shipmentResult = await createShiprocketShipment({
                    supabaseOrderId,
                    shippingAddress,
                    customerName:  customerName  || 'Customer',
                    customerEmail: customerEmail || '',
                    cartItems:     cartItems     || []
                });

                if (shipmentResult) {
                    await supabaseAdmin
                        .from('orders')
                        .update({
                            shipping_address: {
                                ...(shippingAddress || {}),
                                awb_code:     shipmentResult.awb_code || null,
                                courier_name: shipmentResult.courier_name || null,
                                tracking_url: shipmentResult.tracking_url || null,
                                shiprocket_order_id: shipmentResult.shiprocket_order_id || null,
                                shiprocket_shipment_id: shipmentResult.shiprocket_shipment_id || null,
                            },
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', supabaseOrderId);
                }
            } catch (shipErr) {
                // Log but DO NOT fail — payment already captured
                console.error('⚠️  Shipment creation failed (non-fatal):', shipErr.message);
            }
        }

        res.json({ success: true, shipment: shipmentResult });

    } catch (error) {
        console.error('❌ Error in /api/confirm-payment:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

// ─── GET /api/track/:orderId ──────────────────────────────────────────────────
// Returns live tracking data from Delhivery for a given Supabase order ID.
app.get('/api/track/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured.' });

        // Fetch waybill from Supabase
        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('shipping_address')
            .eq('id', orderId)
            .single();

        if (error || !order) return res.status(404).json({ error: 'Order not found.' });

        const waybill     = order.shipping_address?.awb_code;
        const trackingUrl = waybill ? `https://shiprocket.co/tracking/${waybill}` : null;

        if (!waybill) {
            return res.json({ tracked: false, message: 'No waybill assigned yet. Shipment may still be processing.' });
        }

        // Shiprocket tracking if configured
        if (!isShiprocketConfigured()) {
            return res.status(503).json({ tracked: false, waybill, tracking_url: trackingUrl, message: 'Shiprocket not configured for live tracking.' });
        }

        const srData = await shiprocketRequest(`/v1/external/courier/track/awb/${waybill}`);
        const srTrack = srData?.tracking_data || {};
        return res.json({
            tracked: true,
            waybill,
            tracking_url: order.shipping_address?.tracking_url || `https://shiprocket.co/tracking/${waybill}`,
            status: srTrack?.shipment_status || null,
            status_desc: srTrack?.track_status || null,
            data: srData,
        });
    } catch (err) {
        console.error('❌ /api/track error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── Shiprocket Docs: Label / Manifest / Invoice ─────────────────────────────
app.get('/api/shiprocket/label/:orderId', async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured.' });
        if (!isShiprocketConfigured()) return res.status(503).json({ error: 'Shiprocket not configured.' });

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('shipping_address')
            .eq('id', req.params.orderId)
            .single();
        if (error || !order) return res.status(404).json({ error: 'Order not found.' });

        const shipmentId = order.shipping_address?.shiprocket_shipment_id;
        if (!shipmentId) return res.status(400).json({ error: 'Shiprocket shipment_id missing.' });

        const labelRes = await shiprocketRequest('/v1/external/courier/generate/label', {
            method: 'POST',
            body: { shipment_id: [shipmentId] },
        });
        res.json(labelRes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/shiprocket/manifest/:orderId', async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured.' });
        if (!isShiprocketConfigured()) return res.status(503).json({ error: 'Shiprocket not configured.' });

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('shipping_address')
            .eq('id', req.params.orderId)
            .single();
        if (error || !order) return res.status(404).json({ error: 'Order not found.' });

        const shipmentId = order.shipping_address?.shiprocket_shipment_id;
        if (!shipmentId) return res.status(400).json({ error: 'Shiprocket shipment_id missing.' });

        const generateRes = await shiprocketRequest('/v1/external/manifests/generate', {
            method: 'POST',
            body: { shipment_id: [shipmentId] },
        });

        const manifestId = generateRes?.manifest_id || generateRes?.data?.manifest_id || null;
        if (!manifestId) {
            return res.json(generateRes);
        }

        const printRes = await shiprocketRequest('/v1/external/manifests/print', {
            method: 'POST',
            body: { manifest_id: manifestId },
        });
        res.json({ generate: generateRes, print: printRes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/shiprocket/invoice/:orderId', async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured.' });
        if (!isShiprocketConfigured()) return res.status(503).json({ error: 'Shiprocket not configured.' });

        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('shipping_address')
            .eq('id', req.params.orderId)
            .single();
        if (error || !order) return res.status(404).json({ error: 'Order not found.' });

        const shiprocketOrderId = order.shipping_address?.shiprocket_order_id;
        if (!shiprocketOrderId) return res.status(400).json({ error: 'Shiprocket order_id missing.' });

        const invoiceRes = await shiprocketRequest('/v1/external/orders/print/invoice', {
            method: 'POST',
            body: { order_id: shiprocketOrderId },
        });
        res.json(invoiceRes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/upload-design ──────────────────────────────────────────────────
app.post('/api/upload-design', async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase admin not configured.' });

        const { fileBase64, mimeType, fileName, userId } = req.body;
        if (!fileBase64 || !mimeType) return res.status(400).json({ error: 'Missing fileBase64 or mimeType.' });

        const base64Data  = fileBase64.replace(/^data:[^;]+;base64,/, '');
        const fileBuffer  = Buffer.from(base64Data, 'base64');
        const ext         = (fileName || 'upload').split('.').pop().replace(/[^a-z0-9]/gi, '') || 'png';
        const safeUserId  = (userId || 'anonymous').replace(/[^a-zA-Z0-9-]/g, '');
        const storagePath = `users/${safeUserId}/${Date.now()}_design.${ext}`;

        const { error: uploadErr } = await supabaseAdmin.storage
            .from('design-uploads')
            .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: true });

        if (uploadErr) {
            console.error('❌ Storage upload error:', uploadErr.message);
            return res.status(500).json({ error: uploadErr.message });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage.from('design-uploads').getPublicUrl(storagePath);
        console.log('✅ Design uploaded:', publicUrl);
        res.json({ publicUrl });

    } catch (error) {
        console.error('❌ Error in /api/upload-design:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

// ─── Admin Products (service-role) ───────────────────────────────────────────
app.post('/api/admin/products', async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured.' });
        const payload = req.body || {};

        if (!payload.name || !payload.base_price) {
            return res.status(400).json({ error: 'name and base_price are required.' });
        }

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert({
                ...payload,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true, product: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/products/:id', async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured.' });
        const { id } = req.params;
        const payload = req.body || {};

        if (!payload.name || !payload.base_price) {
            return res.status(400).json({ error: 'name and base_price are required.' });
        }

        const { data, error } = await supabaseAdmin
            .from('products')
            .update({
                ...payload,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true, product: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/bulk-enquiry ───────────────────────────────────────────────────
app.post('/api/bulk-enquiry', async (req, res) => {
    try {
        const { name, company, email, phone, qty, deadline, notes, categories } = req.body;

        if (!name || !email || !phone || !qty) {
            return res.status(400).json({ error: 'Missing required fields: name, email, phone, qty.' });
        }

        let savedId = null;
        if (supabaseAdmin) {
            const { data, error: dbErr } = await supabaseAdmin
                .from('bulk_order_enquiries')
                .insert({
                    name:       name.trim(),
                    company:    company?.trim() || null,
                    email:      email.trim().toLowerCase(),
                    phone:      phone.trim(),
                    quantity:   parseInt(qty, 10),
                    deadline:   deadline || null,
                    notes:      notes?.trim() || null,
                    categories: categories || [],
                    status:     'new',
                })
                .select('id')
                .single();

            if (dbErr) {
                console.error('❌ bulk_order_enquiries insert error:', dbErr.message);
            } else {
                savedId = data?.id;
                console.log(`✅ Bulk enquiry saved: ${savedId} from ${email}`);
            }
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'support@printingustad.com';
        const emailBody = `
New Bulk Order Enquiry

From:      ${name}${company ? ` (${company})` : ''}
Email:     ${email}
Phone:     ${phone}
Quantity:  ${qty} units
Deadline:  ${deadline || 'Not specified'}
Products:  ${(categories || []).join(', ') || 'Not selected'}
Notes:     ${notes || '—'}

View in Admin Dashboard → https://your-site.com/admin
        `.trim();

        console.log(`\n📧 ADMIN NOTIFICATION to ${adminEmail}:\n${emailBody}\n`);

        res.json({ success: true, id: savedId, message: 'Enquiry received! We will contact you within 4 business hours.' });

    } catch (error) {
        console.error('❌ Error in /api/bulk-enquiry:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 Backend server running at http://localhost:${PORT}`);
    console.log(`   Health check → http://localhost:${PORT}/api/health\n`);
});
