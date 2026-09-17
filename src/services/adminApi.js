import { supabase } from '../supabaseClient';

const rawApiBase = import.meta.env.VITE_API_URL || '';
const API_BASE = rawApiBase.replace(/\/$/, '');

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

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = API_BASE ? `${API_BASE}${cleanEndpoint}` : cleanEndpoint;

    const response = await fetch(
        url,
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