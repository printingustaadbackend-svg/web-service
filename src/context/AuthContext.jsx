import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();
// eslint-disable-next-line react-refresh/only-export-components
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle(); // Use maybeSingle to avoid 406 errors if no profile exists
            
            if (error) {
                // If it's the recursion error, we log it but don't crash
                if (error.message.includes('infinite recursion')) {
                    console.warn('Supabase RLS recursion detected on profiles table. Please check your DB policies.');
                } else {
                    console.error('Error fetching profile:', error.message);
                }
                return;
            }
            setProfile(data);
        } catch (err) {
            console.error('Unexpected error fetching profile:', err);
        }
    };

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        let authSub;

        // Step 1: Check active session FIRST - loading stays true until this resolves
        const getSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                if (currentUser) {
                    await fetchProfile(currentUser.id);
                }
            } catch (err) {
                console.error("Session error:", err.message);
            } finally {
                // Only turn off loading after the initial session check is DONE
                setLoading(false);
            }

            // Step 2: THEN start listening for future auth changes (login, logout)
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                if (currentUser) {
                    await fetchProfile(currentUser.id);
                } else {
                    setProfile(null);
                }
                // Don't touch loading here - it's already false from getSession
            });
            authSub = subscription;
        };

        getSession();

        return () => {
            authSub?.unsubscribe();
        };
    }, []);

    const value = {
        signUp: (data) => supabase?.auth.signUp(data),
        signIn: (data) => supabase?.auth.signInWithPassword(data),
        signOut: async () => {
            // 1. Instantly clear everything locally FIRST
            for (let key in localStorage) {
                if (key.startsWith('sb-') && key.includes('-auth-token')) {
                    localStorage.removeItem(key);
                }
            }
            setUser(null);
            setProfile(null);

            // 2. Then attempt the API call in the background
            try {
                await supabase?.auth.signOut();
            } catch (err) {
                console.warn('Silent signout error:', err.message);
            }
        },
        user,
        profile,
        loading,
        isAdmin: profile?.role === 'admin' || profile?.role === 'manager',
        isConfigured: !!supabase
    };

    if (!supabase && !loading) {
        return (
            <div className="bg-[#131313] min-h-screen text-white flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-[#201f1f] rounded-3xl border border-white/5 p-8 shadow-2xl">
                    <span className="material-symbols-outlined text-cyan-400 text-5xl mb-4">settings_suggest</span>
                    <h1 className="text-2xl font-bold mb-4">Configuration Required</h1>
                    <p className="text-[#b9cacb] mb-6 leading-relaxed">
                        To enable login and order history, you need to add your Supabase credentials to the <code className="text-cyan-400 bg-black/30 px-2 py-0.5 rounded">.env.local</code> file.
                    </p>
                    <div className="text-left bg-black/40 p-4 rounded-xl text-xs font-mono space-y-2 mb-6">
                        <p className="text-neutral-500"># In .env.local</p>
                        <p>VITE_SUPABASE_URL=<span className="text-cyan-400">your_url</span></p>
                        <p>VITE_SUPABASE_ANON_KEY=<span className="text-cyan-400">your_key</span></p>
                    </div>
                    <p className="text-xs text-neutral-500">Restart the terminal after saving the file.</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
