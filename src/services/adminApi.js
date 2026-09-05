import { supabase } from '../supabaseClient';

const API_BASE = 'http://localhost:5001';

export const adminFetch = async (endpoint, options = {}) => {
    if (!supabase) {
        throw new Error('Supabase is not configured.');
    }

    const {
        data: { session },
        error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
        throw sessionError;
    }

    if (!session?.access_token) {
        throw new Error('You are not logged in.');
    }

    const headers = {
        ...(options.headers || {}),
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
    };

    const response = await fetch(
        `${API_BASE}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        throw new Error(
            data?.error ||
            data?.message ||
            `Request failed with status ${response.status}`
        );
    }

    return data;
};