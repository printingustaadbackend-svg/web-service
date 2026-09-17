import React, {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react';

import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);

    // Store the complete Supabase session.
    // This is required so components can access:
    // session.access_token
    const [session, setSession] = useState(null);

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);


    /*
     * ---------------------------------------------------------
     * FETCH USER PROFILE
     * ---------------------------------------------------------
     */

    const fetchProfile = async (userId) => {

        if (!supabase || !userId) {
            setProfile(null);
            return;
        }

        try {

            const {
                data,
                error
            } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) {

                console.error(
                    'Error fetching profile:',
                    error.message
                );

                return;
            }

            setProfile(data);

        } catch (err) {

            console.error(
                'Unexpected profile error:',
                err
            );

        }
    };


    /*
     * ---------------------------------------------------------
     * INITIAL SESSION + AUTH LISTENER
     * ---------------------------------------------------------
     */

    useEffect(() => {

        if (!supabase) {
            setLoading(false);
            return;
        }

        let mounted = true;


        /*
         * Listen for login/logout/session changes.
         */

        const {
            data: {
                subscription
            }
        } = supabase.auth.onAuthStateChange(
            (_event, currentSession) => {

                if (!mounted) return;

                // Save complete Supabase session
                setSession(currentSession);

                // Extract user from session
                const currentUser =
                    currentSession?.user ?? null;

                setUser(currentUser);

                // Clear profile when logged out
                if (!currentUser) {
                    setProfile(null);
                }
            }
        );


        /*
         * Get existing session when application starts.
         */

        const initializeSession = async () => {

            try {

                const {
                    data: {
                        session: currentSession
                    },
                    error
                } = await supabase.auth.getSession();

                if (error) {
                    throw error;
                }

                if (!mounted) return;

                // Save complete session
                setSession(currentSession);

                // Save user
                const currentUser =
                    currentSession?.user ?? null;

                setUser(currentUser);

            } catch (err) {

                console.error(
                    'Session initialization error:',
                    err
                );

                if (mounted) {
                    setSession(null);
                    setUser(null);
                }

            } finally {

                if (mounted) {
                    setLoading(false);
                }

            }
        };

        initializeSession();


        /*
         * Cleanup
         */

        return () => {

            mounted = false;

            subscription.unsubscribe();

        };

    }, []);


    /*
     * ---------------------------------------------------------
     * FETCH PROFILE WHEN USER CHANGES
     * ---------------------------------------------------------
     */

    useEffect(() => {

        if (!user) {

            setProfile(null);

            return;
        }

        fetchProfile(user.id);

    }, [user]);


    /*
     * ---------------------------------------------------------
     * SIGN UP
     * ---------------------------------------------------------
     */

    const signUp = async ({
        email,
        password,
        options
    }) => {

        if (!supabase) {

            return {
                data: null,
                error: new Error(
                    'Supabase is not configured.'
                )
            };
        }

        return await supabase.auth.signUp({
            email,
            password,
            options
        });
    };


    /*
     * ---------------------------------------------------------
     * SIGN IN
     * ---------------------------------------------------------
     */

    const signIn = async ({
        email,
        password
    }) => {

        if (!supabase) {

            return {
                data: null,
                error: new Error(
                    'Supabase is not configured.'
                )
            };
        }

        return await supabase.auth.signInWithPassword({
            email,
            password
        });
    };


    /*
     * ---------------------------------------------------------
     * RESET PASSWORD
     * ---------------------------------------------------------
     */

    const resetPassword = async ({
        email,
        newPassword
    }) => {

        try {

            const response = await fetch(
                'http://localhost:5001/api/auth/reset-password',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        email: email.trim().toLowerCase(),
                        newPassword
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {

                return {
                    data: null,
                    error: new Error(
                        result.error ||
                        'Unable to reset password.'
                    )
                };
            }

            return {
                data: result,
                error: null
            };

        } catch (err) {

            console.error(
                'Password reset request error:',
                err
            );

            return {
                data: null,
                error: new Error(
                    'Unable to connect to the backend server.'
                )
            };
        }
    };


    /*
     * ---------------------------------------------------------
     * SIGN OUT
     * ---------------------------------------------------------
     */

    const signOut = async () => {

        try {

            if (!supabase) {
                setSession(null);
                setUser(null);
                setProfile(null);
                return;
            }

            const {
                error
            } = await supabase.auth.signOut();

            if (error) {
                throw error;
            }

            // Clear complete authentication state
            setSession(null);
            setUser(null);
            setProfile(null);

        } catch (err) {

            console.error(
                'Sign out error:',
                err
            );

        }
    };


    /*
     * ---------------------------------------------------------
     * AUTH CONTEXT VALUE
     * ---------------------------------------------------------
     */

    const value = {

        // Authentication
        signUp,
        signIn,
        resetPassword,
        signOut,

        // User
        user,

        // Complete Supabase session
        // Components can use session.access_token
        session,

        // Profile
        profile,

        // Loading
        loading,

        // Authorization
        isAdmin:
            profile?.role === 'admin' ||
            profile?.role === 'manager',

        // Configuration
        isConfigured: !!supabase
    };


    /*
     * ---------------------------------------------------------
     * SUPABASE CONFIGURATION ERROR
     * ---------------------------------------------------------
     */

    if (!supabase && !loading) {

        return (
            <div className="bg-[#131313] min-h-screen text-white flex items-center justify-center p-6 text-center">

                <div className="max-w-md w-full bg-[#201f1f] rounded-3xl border border-white/5 p-8 shadow-2xl">

                    <span className="material-symbols-outlined text-cyan-400 text-5xl mb-4">
                        settings_suggest
                    </span>

                    <h1 className="text-2xl font-bold mb-4">
                        Configuration Required
                    </h1>

                    <p className="text-[#b9cacb] mb-6 leading-relaxed">
                        To enable login and order history,
                        you need to add your Supabase
                        credentials to the .env.local file.
                    </p>

                    <div className="text-left bg-black/40 p-4 rounded-xl text-xs font-mono space-y-2 mb-6">

                        <p className="text-neutral-500">
                            # In .env.local
                        </p>

                        <p>
                            VITE_SUPABASE_URL=
                            <span className="text-cyan-400">
                                your_url
                            </span>
                        </p>

                        <p>
                            VITE_SUPABASE_ANON_KEY=
                            <span className="text-cyan-400">
                                your_key
                            </span>
                        </p>

                    </div>

                    <p className="text-xs text-neutral-500">
                        Restart the development server
                        after saving the file.
                    </p>

                </div>
            </div>
        );
    }


    /*
     * ---------------------------------------------------------
     * PROVIDER
     * ---------------------------------------------------------
     */

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};


/*
 * ---------------------------------------------------------
 * USE AUTH HOOK
 * ---------------------------------------------------------
 */

export const useAuth = () => {

    return useContext(AuthContext);

};