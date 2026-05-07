import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testInsert() {
    console.log("Signing in (if needed) or just testing insert...");
    const { data: user } = await supabase.auth.admin?.listUsers() || { data: { users: [] } };
    
    console.log("Trying to insert order...");
    const { data, error } = await supabase
        .from('orders')
        .insert({
            user_id: 'a872cc42-b062-421b-a5d6-8488e3ad5b37', // Dummy UUID
            status: 'pending',
            subtotal: 399,
            shipping_cost: 50,
            tax_amount: 70,
            total_amount: 519,
            shipping_address: { city: 'Demo' }
        })
        .select()
        .single();
        
    console.log("Order Insert Result:");
    console.log(data, error);
}

testInsert();
