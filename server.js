import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Razorpay from 'razorpay';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

// Initialize Razorpay
let razorpayInstance = null;
const key_id = process.env.VITE_RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (key_id && key_secret) {
    try {
        razorpayInstance = new Razorpay({
            key_id: key_id,
            key_secret: key_secret
        });
        console.log('Razorpay initialized successfully.');
    } catch (err) {
        console.error('Failed to initialize Razorpay:', err);
    }
} else {
    console.warn('Razorpay keys are missing. Please set VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local');
}

app.post('/api/create-order', async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || isNaN(amount)) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        if (!razorpayInstance) {
            return res.status(500).json({ error: 'Razorpay is not configured on the server. Please check RAZORPAY_KEY_SECRET in .env.local' });
        }

        const options = {
            amount: amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);
        
        if (!order) {
            return res.status(500).json({ error: 'Some error occurred while creating order' });
        }

        res.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
