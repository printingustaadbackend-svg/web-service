import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if variables are set and the URL is valid
const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

export const supabase = (supabaseUrl && isValidUrl(supabaseUrl) && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!supabase) {
    console.warn("Supabase client not initialized. Check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local");
}
