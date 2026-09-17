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
app.set('trust proxy', 1); // Trust reverse proxy / CDN (Cloudflare, Nginx, Render)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
const PORT = process.env.PORT || 5001;

// ─── Rate Limiting (High Traffic Protection) ──────────────────────────────────
const { rateLimit } = require('express-rate-limit');

// 1. General API rate limiter (protects against high-frequency flooding)
const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per IP per 15 min window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' }
});

// 2. Auth routes limiter (brute-force protection on password reset)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts. Please wait 15 minutes before trying again.' }
});

// 3. Bulk enquiry limiter (prevents spam inquiries / bots)
const bulkEnquiryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 15, // max 15 submissions per hour per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many bulk inquiries submitted. Please wait before submitting another.' }
});

// 4. Payment / Order routes limiter (protects Razorpay order creation & payment confirmation)
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 40, // 40 payment/order requests per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many payment requests. Please wait a few moments.' }
});

// 5. Signed Upload URL limiter
const uploadSignLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 uploads per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Upload limit reached. Please wait a few minutes before uploading more designs.' }
});

// Apply general limiter to all /api/ endpoints
app.use('/api/', generalApiLimiter);

// ─── Supabase Admin Client ─────────────────────────────────────────────────────
let supabaseAdmin = null;
const supabaseUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

if (supabaseUrl && serviceRoleKey && !serviceRoleKey.startsWith('YOUR_')) {
    const { createClient } = require('@supabase/supabase-js');
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });
    console.log('✅ Supabase Admin (service role) initialized – RLS bypassed.');
} else {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is missing or unconfigured in environment.');
}

// ─── ADMIN AUTHENTICATION ─────────────────────────────────────────────────────

async function requireAdmin(req, res, next) {
    try {
        if (!supabaseAdmin) {
            return res.status(503).json({
                error: 'Supabase Admin is not configured.'
            });
        }

        // Read Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication required.'
            });
        }

        // Extract Supabase access token
        const accessToken = authHeader.substring(7).trim();

        if (!accessToken) {
            return res.status(401).json({
                error: 'Authentication token missing.'
            });
        }

        // Verify the token with Supabase Auth
        const {
            data: { user },
            error: userError
        } = await supabaseAdmin.auth.getUser(accessToken);

        if (userError || !user) {
            return res.status(401).json({
                error: 'Invalid or expired authentication token.'
            });
        }

        // Get the user's profile and role
        const {
            data: profile,
            error: profileError
        } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return res.status(403).json({
                error: 'Admin profile not found.'
            });
        }

        // ONLY admin is allowed
        if (profile.role !== 'admin') {
            return res.status(403).json({
                error: 'Admin access required.'
            });
        }

        // Attach authenticated admin to request
        req.user = user;
        req.profile = profile;

        next();

    } catch (error) {
        console.error('❌ Admin authentication error:', error);

        return res.status(500).json({
            error: 'Unable to verify admin authentication.'
        });
    }
}


// ─── USER AUTHENTICATION ──────────────────────────────────────────────────────

async function requireUser(req, res, next) {
    try {
        if (!supabaseAdmin) {
            return res.status(503).json({
                error: 'Supabase Admin is not configured.'
            });
        }

        // Read Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Authentication required.'
            });
        }

        // Extract Supabase access token
        const accessToken = authHeader.substring(7).trim();

        if (!accessToken) {
            return res.status(401).json({
                error: 'Authentication token missing.'
            });
        }

        // Verify the token with Supabase Auth
        const {
            data: { user },
            error: userError
        } = await supabaseAdmin.auth.getUser(accessToken);

        if (userError || !user) {
            return res.status(401).json({
                error: 'Invalid or expired authentication token.'
            });
        }

        // Attach authenticated user to request
        req.user = user;

        next();

    } catch (error) {
        console.error('❌ User authentication error:', error);

        return res.status(500).json({
            error: 'Unable to verify authentication.'
        });
    }
}

// ─── Razorpay ─────────────────────────────────────────────────────────────────
let razorpayInstance = null;
const rzpKeyId = (process.env.VITE_RAZORPAY_KEY_ID || '').trim();
const rzpKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

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
    name: (process.env.PICKUP_NAME || 'Printing Ustad').trim(),
    add: (process.env.PICKUP_ADDRESS || 'Your Warehouse Address').trim(),
    city: (process.env.PICKUP_CITY || 'Delhi').trim(),
    state: (process.env.PICKUP_STATE || 'Delhi').trim(),
    country: 'India',
    pin: (process.env.PICKUP_PINCODE || '110001').trim(),
    phone: (process.env.PICKUP_PHONE || '9999999999').trim(),
};

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        razorpayReady: !!razorpayInstance,
        supabaseAdminReady: !!supabaseAdmin,
        shiprocketReady: isShiprocketConfigured(),
    });
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
// Development password reset:
// Email + New Password → Supabase Admin → Password Updateds
//
// IMPORTANT:
// This endpoint uses the service-role client, so it must remain
// on the backend. Never expose SUPABASE_SERVICE_ROLE_KEY to React.

app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(503).json({
                error: 'Supabase Admin is not configured on the server.'
            });
        }

        const {
            email,
            newPassword
        } = req.body || {};

        // Validate email
        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                error: 'Email is required.'
            });
        }

        // Validate password
        if (!newPassword || typeof newPassword !== 'string') {
            return res.status(400).json({
                error: 'New password is required.'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters long.'
            });
        }

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        /*
         * Supabase Admin API does not provide a direct
         * "get user by email" method.
         *
         * We therefore paginate through users and find
         * the matching email.
         */
        let matchingUser = null;
        let page = 1;

        while (!matchingUser) {
            const {
                data,
                error
            } = await supabaseAdmin.auth.admin.listUsers({
                page,
                perPage: 1000
            });

            if (error) {
                console.error(
                    '❌ Error searching Supabase users:',
                    error.message
                );

                return res.status(500).json({
                    error: 'Unable to verify account.'
                });
            }

            const users = data?.users || [];

            matchingUser = users.find(
                user =>
                    user.email?.trim().toLowerCase() ===
                    normalizedEmail
            );

            /*
             * Stop if there are no more users.
             */
            if (
                users.length < 1000 ||
                matchingUser
            ) {
                break;
            }

            page++;
        }

        /*
         * Don't expose whether the email exists.
         */
        if (!matchingUser) {
            return res.status(400).json({
                error: 'Unable to reset password for this account.'
            });
        }

        /*
         * Update password using Supabase Admin API.
         */
        const {
            data: updatedUser,
            error: updateError
        } = await supabaseAdmin.auth.admin.updateUserById(
            matchingUser.id,
            {
                password: newPassword
            }
        );

        if (updateError) {
            console.error(
                '❌ Supabase password update error:',
                updateError.message
            );

            return res.status(500).json({
                error: 'Unable to update password.'
            });
        }

        console.log(
            `✅ Password updated for user: ${matchingUser.id}`
        );

        return res.json({
            success: true,
            message: 'Password updated successfully.'
        });

    } catch (error) {

        console.error(
            '❌ Error in /api/auth/reset-password:',
            error
        );

        return res.status(500).json({
            error:
                error.message ||
                'Internal Server Error'
        });
    }
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
app.post('/api/create-order', paymentLimiter, async (req, res) => {
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
                    user_id: userId,
                    status: 'pending',
                    subtotal: subtotal || 0,
                    shipping_cost: shipping || 0,
                    tax_amount: tax || 0,
                    total_amount: total || 0,
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
                    order_id: supabaseOrderId,
                    product_id: uuidRe.test(item.id) ? item.id : null,
                    variant_id: item.variantId || null,
                    quantity: item.quantity,
                    unit_price: item.price,
                    customizations: item.customizations || item.attributes || {}
                }));
                const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(items);
                if (itemsErr) console.error('⚠️  Order items insert error:', itemsErr.message);
            }
        }

        // 3. Create Razorpay order
        const rzpOrder = await razorpayInstance.orders.create({
            amount: Math.round(amount),
            currency: 'INR',
            receipt: `receipt_${Date.now()}`
        });

        res.json({
            razorpayOrderId: rzpOrder.id,
            supabaseOrderId,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency
        });

    } catch (error) {
        console.error('❌ Error in /api/create-order:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

// ─── POST /api/confirm-payment ────────────────────────────────────────────────
// Called after Razorpay success: updates order status + creates Delhivery shipment.
app.post('/api/confirm-payment', paymentLimiter, async (req, res) => {
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
                    customerName: customerName || 'Customer',
                    customerEmail: customerEmail || '',
                    cartItems: cartItems || []
                });

                if (shipmentResult) {
                    await supabaseAdmin
                        .from('orders')
                        .update({
                            shipping_address: {
                                ...(shippingAddress || {}),
                                awb_code: shipmentResult.awb_code || null,
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

        const waybill = order.shipping_address?.awb_code;
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

// ─── POST /api/storage/signed-upload-url ──────────────────────────────────────
// Direct Upload: issues a short-lived signed upload URL for Supabase Storage.
// The browser uploads directly to Supabase, bypassing Node.js server memory and bandwidth entirely.
app.post('/api/storage/signed-upload-url', uploadSignLimiter, requireUser, async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(503).json({ error: 'Supabase storage is not configured.' });
        }

        const { fileName, mimeType, folder = 'designs' } = req.body || {};
        if (!mimeType) {
            return res.status(400).json({ error: 'Missing mimeType.' });
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
        if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid file type. Allowed: JPEG, PNG, WEBP, SVG, GIF.' });
        }

        const userId = req.user.id.replace(/[^a-zA-Z0-9-]/g, '');
        const ext = (fileName || 'upload').split('.').pop().replace(/[^a-z0-9]/gi, '') || 'png';
        const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'designs';
        const storagePath = `users/${userId}/${cleanFolder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { data, error } = await supabaseAdmin.storage
            .from('design-uploads')
            .createSignedUploadUrl(storagePath, { upsert: true });

        if (error) {
            console.error('❌ Error generating signed upload URL:', error.message);
            return res.status(500).json({ error: error.message });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('design-uploads')
            .getPublicUrl(storagePath);

        res.json({
            success: true,
            path: data.path,
            token: data.token,
            signedUrl: data.signedUrl,
            publicUrl,
        });
    } catch (err) {
        console.error('❌ Error in /api/storage/signed-upload-url:', err);
        res.status(500).json({ error: err.message || 'Internal server error.' });
    }
});

// ─── POST /api/upload-design ──────────────────────────────────────────────────
// Fallback / legacy base64 upload route
app.post('/api/upload-design', uploadSignLimiter, requireUser, async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(500).json({
                error: 'Supabase admin not configured.'
            });
        }

        const {
            fileBase64,
            mimeType,
            fileName
        } = req.body || {};

        // User ID comes from authenticated Supabase user
        const userId = req.user.id;

        if (!fileBase64 || !mimeType) {
            return res.status(400).json({
                error: 'Missing fileBase64 or mimeType.'
            });
        }

        const base64Data = fileBase64.replace(
            /^data:[^;]+;base64,/,
            ''
        );

        const fileBuffer = Buffer.from(
            base64Data,
            'base64'
        );

        const ext = (
            fileName || 'upload'
        )
            .split('.')
            .pop()
            .replace(/[^a-z0-9]/gi, '') || 'png';

        const safeUserId = userId.replace(
            /[^a-zA-Z0-9-]/g,
            ''
        );

        const storagePath =
            `users/${safeUserId}/${Date.now()}_design.${ext}`;

        const {
            error: uploadErr
        } = await supabaseAdmin.storage
            .from('design-uploads')
            .upload(
                storagePath,
                fileBuffer,
                {
                    contentType: mimeType,
                    upsert: true
                }
            );

        if (uploadErr) {
            console.error(
                '❌ Storage upload error:',
                uploadErr.message
            );

            return res.status(500).json({
                error: uploadErr.message
            });
        }

        const {
            data: { publicUrl }
        } = supabaseAdmin.storage
            .from('design-uploads')
            .getPublicUrl(storagePath);

        console.log(
            `✅ Design uploaded for user ${userId}:`,
            publicUrl
        );

        return res.json({
            success: true,
            publicUrl,
            path: storagePath
        });

    } catch (error) {
        console.error(
            '❌ Error in /api/upload-design:',
            error
        );

        return res.status(500).json({
            error: error.message || 'Internal Server Error'
        });
    }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
// Fetch all user profiles (bypasses RLS via service-role)
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured.' });

        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching admin users:', error.message);
            return res.status(500).json({ error: error.message });
        }

        res.json(data || []);
    } catch (err) {
        console.error('❌ Error in /api/admin/users:', err);
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
});

// ─── GET /api/admin/orders ────────────────────────────────────────────────────
// Fetch all orders with profile joins (bypasses RLS via service-role)
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured.' });

        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('*, profiles(full_name), order_items(*, products(name))')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching admin orders:', error.message);
            return res.status(500).json({ error: error.message });
        }

        res.json(data || []);
    } catch (err) {
        console.error('❌ Error in /api/admin/orders:', err);
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
});

// ─── Admin Products (service-role) ───────────────────────────────────────────
app.post('/api/admin/products', requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured.' });
        const payload = req.body || {};

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



// ─── POST /api/bulk-enquiry ───────────────────────────────────────────────────
app.post('/api/bulk-enquiry', bulkEnquiryLimiter, async (req, res) => {
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
                    name: name.trim(),
                    company: company?.trim() || null,
                    email: email.trim().toLowerCase(),
                    phone: phone.trim(),
                    quantity: parseInt(qty, 10),
                    deadline: deadline || null,
                    notes: notes?.trim() || null,
                    categories: categories || [],
                    status: 'new',
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

// ─── GET /api/admin/bulk-enquiries ──────────────────────────────────────────
// Securely fetch all bulk enquiries for admin (bypasses client-side RLS)
app.get('/api/admin/bulk-enquiries', requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(503).json({ error: 'Supabase admin not configured.' });
        }

        const { data, error } = await supabaseAdmin
            .from('bulk_order_enquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching bulk enquiries:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data || []);
    } catch (err) {
        console.error('❌ Error in /api/admin/bulk-enquiries:', err);
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
});

// ─── PATCH /api/admin/bulk-enquiries/:id ────────────────────────────────────
// Update status for a bulk enquiry (new, contacted, quoted, closed)
app.patch('/api/admin/bulk-enquiries/:id', requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(503).json({ error: 'Supabase admin not configured.' });
        }

        const { id } = req.params;
        const { status } = req.body || {};

        if (!status) {
            return res.status(400).json({ error: 'Status is required.' });
        }

        const { data, error } = await supabaseAdmin
            .from('bulk_order_enquiries')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('❌ Error updating bulk enquiry status:', error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ success: true, enquiry: data });
    } catch (err) {
        console.error('❌ Error in PATCH /api/admin/bulk-enquiries/:id:', err);
        res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
});

// ─── UPDATE /api/admin/products/:id ──────────────────────────────────────────
// ─── UPDATE /api/admin/products/:id ──────────────────────────────────────────
app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) {
            return res.status(503).json({
                error: 'Supabase admin not configured.'
            });
        }

        const { id } = req.params;
        const payload = req.body || {};

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({
                error: 'No product data provided.'
            });
        }

        const allowedFields = [
            'category_id',
            'name',
            'description',
            'base_price',
            'min_order_quantity',
            'base_image_url',
            'is_active',
            'gallery_images'
        ];

        const updateData = {};

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(payload, field)) {
                updateData[field] = payload[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                error: 'No valid product fields provided.'
            });
        }

        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(
                '❌ Product update error:',
                error.message
            );

            return res.status(500).json({
                error: error.message
            });
        }

        res.json({
            success: true,
            product: data
        });

    } catch (err) {
        console.error(
            '❌ Product PUT error:',
            err
        );

        res.status(500).json({
            error: err.message || 'Internal Server Error'
        });
    }
});

// ─── DELETE /api/admin/products/:id ──────────────────────────────────────────
app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured.' });
        const { id } = req.params;

        // Delete variants first (foreign key constraint)
        await supabaseAdmin.from('product_variants').delete().eq('product_id', id);

        const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/admin/signed-upload-url ────────────────────────────────────────
// Direct Upload for Admin (product image uploads direct to Supabase Storage)
app.post('/api/admin/signed-upload-url', uploadSignLimiter, requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase storage not configured.' });
        const { fileName, mimeType } = req.body || {};
        if (!mimeType) return res.status(400).json({ error: 'Missing mimeType.' });

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
        if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
            return res.status(400).json({ error: 'Invalid file type. Allowed: JPEG, PNG, WEBP, SVG, GIF.' });
        }

        const ext = (fileName || 'upload').split('.').pop().replace(/[^a-z0-9]/gi, '') || 'png';
        const storagePath = `products/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { data, error } = await supabaseAdmin.storage
            .from('design-uploads')
            .createSignedUploadUrl(storagePath, { upsert: true });

        if (error) {
            console.error('❌ Error generating admin signed upload URL:', error.message);
            return res.status(500).json({ error: error.message });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('design-uploads')
            .getPublicUrl(storagePath);

        res.json({
            success: true,
            path: data.path,
            token: data.token,
            signedUrl: data.signedUrl,
            publicUrl,
        });
    } catch (err) {
        console.error('❌ Error in /api/admin/signed-upload-url:', err);
        res.status(500).json({ error: err.message || 'Internal server error.' });
    }
});

// ─── POST /api/admin/upload-image ────────────────────────────────────────────
// Fallback / legacy base64 image upload route
app.post('/api/admin/upload-image', uploadSignLimiter, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured.' });
        const { fileBase64, mimeType, fileName } = req.body;
        if (!fileBase64 || !mimeType) return res.status(400).json({ error: 'Missing fileBase64 or mimeType.' });

        const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, '');
        const fileBuffer = Buffer.from(base64Data, 'base64');
        const ext = (fileName || 'upload').split('.').pop().replace(/[^a-z0-9]/gi, '') || 'png';
        const storagePath = `products/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: uploadErr } = await supabaseAdmin.storage
            .from('design-uploads')
            .upload(storagePath, fileBuffer, { contentType: mimeType, upsert: true });

        if (uploadErr) return res.status(500).json({ error: uploadErr.message });

        const { data: { publicUrl } } = supabaseAdmin.storage.from('design-uploads').getPublicUrl(storagePath);
        res.json({ publicUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Variant CRUD ────────────────────────────────────────────────────────────
app.post('/api/admin/variants', requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured.' });
        const payload = req.body || {};
        if (!payload.product_id) return res.status(400).json({ error: 'product_id is required.' });

        const { data, error } = await supabaseAdmin
            .from('product_variants')
            .insert({ ...payload, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .select()
            .single();
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true, variant: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/variants/:id', requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured.' });
        const { id } = req.params;
        const payload = req.body || {};

        const { data, error } = await supabaseAdmin
            .from('product_variants')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true, variant: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/variants/:id', requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase admin not configured.' });
        const { error } = await supabaseAdmin.from('product_variants').delete().eq('id', req.params.id);
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Blog CRUD ───────────────────────────────────────────────────────────────
// Public: fetch published blogs
app.get('/api/blogs', async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured.' });
        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .select('*')
            .eq('is_published', true)
            .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Public: fetch a single published blog post by slug
app.get('/api/blogs/:slug', async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured.' });
        const { slug } = req.params;

        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .single();

        if (error || !data) return res.status(404).json({ error: 'Post not found.' });

        // Also fetch related posts from the same category
        let related = [];
        if (data.category) {
            const { data: relData } = await supabaseAdmin
                .from('blog_posts')
                .select('id, title, slug, excerpt, featured_image, category, created_at')
                .eq('is_published', true)
                .eq('category', data.category)
                .neq('id', data.id)
                .order('created_at', { ascending: false })
                .limit(3);
            related = relData || [];
        }

        res.json({ post: data, related });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: fetch all blogs (including drafts)
app.get('/api/admin/blogs', requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured.' });
        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: create blog post
app.post('/api/admin/blogs', requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured.' });
        const payload = req.body || {};
        if (!payload.title || !payload.content) {
            return res.status(400).json({ error: 'title and content are required.' });
        }

        // Auto-generate slug if not provided (or empty string)
        const baseSlug = (payload.slug && payload.slug.trim())
            ? payload.slug.trim()
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
            : payload.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

        // Always append a unique suffix to prevent collisions
        payload.slug = baseSlug + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                ...payload,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true, post: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: update blog post
app.put('/api/admin/blogs/:id', requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured.' });
        const { id } = req.params;
        const payload = req.body || {};

        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .update({
                ...payload,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true, post: data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: delete blog post
app.delete('/api/admin/blogs/:id', requireAdmin, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured.' });
        const { error } = await supabaseAdmin.from('blog_posts').delete().eq('id', req.params.id);
        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─── Order Cancellation ──────────────────────────────────────────────────────

// POST /api/cancel-order — Authenticated: cancel own order
app.post('/api/cancel-order', requireUser, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured.' });

        const { orderId } = req.body || {};
        const userId = req.user.id;

        if (!orderId) return res.status(400).json({ error: 'orderId is required.' });

        // Fetch order and verify ownership
        const { data: order, error: fetchErr } = await supabaseAdmin
            .from('orders')
            .select('id, user_id, status')
            .eq('id', orderId)
            .single();

        if (fetchErr || !order) return res.status(404).json({ error: 'Order not found.' });
        if (order.user_id !== userId) return res.status(403).json({ error: 'You can only cancel your own orders.' });

        // Only allow cancellation of pending or processing orders
        if (!['pending', 'processing'].includes(order.status)) {
            return res.status(400).json({
                error: `Cannot cancel an order with status "${order.status}". Only pending or processing orders can be cancelled.`
            });
        }

        // Update status to cancelled
        const { error: updateErr } = await supabaseAdmin
            .from('orders')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', orderId);

        if (updateErr) return res.status(500).json({ error: updateErr.message });

        console.log(`✅ Order ${orderId} cancelled by user ${userId}`);
        res.json({ success: true, message: 'Order cancelled successfully.' });
    } catch (err) {
        console.error('❌ POST /api/cancel-order error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── Product Reviews ─────────────────────────────────────────────────────────

// GET /api/reviews/:productId — Public: fetch all reviews for a product
app.get('/api/reviews/:productId', async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured.' });

        const { productId } = req.params;

        const { data, error } = await supabaseAdmin
            .from('product_reviews')
            .select('*')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });

        const reviews = data || [];
        const totalCount = reviews.length;
        const averageRating = totalCount > 0
            ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1))
            : 0;

        // Rating distribution (how many 5★, 4★, etc.)
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => { if (distribution[r.rating] !== undefined) distribution[r.rating]++; });

        res.json({ reviews, averageRating, totalCount, distribution });
    } catch (err) {
        console.error('❌ GET /api/reviews error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/reviews — Authenticated: submit a review
app.post('/api/reviews', requireUser, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured.' });

        const { productId, rating, comment } = req.body || {};
        const userId = req.user.id;

        // Validate
        if (!productId) return res.status(400).json({ error: 'productId is required.' });
        if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
        }
        if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
            return res.status(400).json({ error: 'Comment is required.' });
        }
        if (comment.trim().length > 1000) {
            return res.status(400).json({ error: 'Comment must be 1000 characters or less.' });
        }

        // Get user display name from profile
        let userName = 'User';
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .maybeSingle();
        if (profile?.full_name) userName = profile.full_name;

        // Check for existing review (one per user per product)
        const { data: existing } = await supabaseAdmin
            .from('product_reviews')
            .select('id')
            .eq('product_id', productId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existing) {
            return res.status(409).json({ error: 'You have already reviewed this product. Delete your existing review first.' });
        }

        // Insert
        const { data, error } = await supabaseAdmin
            .from('product_reviews')
            .insert({
                product_id: productId,
                user_id: userId,
                user_name: userName,
                rating,
                comment: comment.trim(),
            })
            .select()
            .single();

        if (error) {
            // Handle unique constraint violation gracefully
            if (error.code === '23505') {
                return res.status(409).json({ error: 'You have already reviewed this product.' });
            }
            return res.status(500).json({ error: error.message });
        }

        console.log(`✅ Review submitted by ${userId} for product ${productId}`);
        res.json({ success: true, review: data });
    } catch (err) {
        console.error('❌ POST /api/reviews error:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/reviews/:reviewId — Authenticated: delete own review
app.delete('/api/reviews/:reviewId', requireUser, async (req, res) => {
    try {
        if (!supabaseAdmin) return res.status(503).json({ error: 'Supabase not configured.' });

        const { reviewId } = req.params;
        const userId = req.user.id;

        // Verify ownership
        const { data: review, error: fetchErr } = await supabaseAdmin
            .from('product_reviews')
            .select('id, user_id')
            .eq('id', reviewId)
            .single();

        if (fetchErr || !review) return res.status(404).json({ error: 'Review not found.' });
        if (review.user_id !== userId) return res.status(403).json({ error: 'You can only delete your own reviews.' });

        const { error } = await supabaseAdmin
            .from('product_reviews')
            .delete()
            .eq('id', reviewId);

        if (error) return res.status(500).json({ error: error.message });

        console.log(`✅ Review ${reviewId} deleted by user ${userId}`);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ DELETE /api/reviews error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── Start ────────────────────────────────────────────────────────────────────
// ─── Serve built frontend (if present) ───────────────────────────────────────
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    app.use((req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        if (req.method !== 'GET') return next();
        res.sendFile(path.join(distPath, 'index.html'), (err) => {
            if (err) return next(err);
        });
    });

    console.log('✅ Serving built frontend from /dist');
} else {
    console.log('ℹ️  No /dist folder found — frontend not being served by Express');
}

app.listen(PORT, () => {
    console.log(`\n🚀 Backend server running at http://localhost:${PORT}`);
    console.log(`   Health check → http://localhost:${PORT}/api/health\n`);
});
