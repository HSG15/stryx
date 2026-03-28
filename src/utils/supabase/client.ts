import { createBrowserClient } from '@supabase/ssr'

declare global {
  interface Window {
    __supabaseClient?: any;
  }
}

// Create a robust client that won't crash hydration if env vars are missing or localStorage throws
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    console.warn('⚠️ Supabase URL or Anon Key is missing. Check your environment variables.');
  }

  const createSupabase = () => {
    try {
      return createBrowserClient(
        url,
        key,
        {
          auth: {
            storageKey: 'habit-tracker-auth-v3',
          }
        }
      );
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      // Return a dummy object so we don't crash the React render cycle
      return {
        auth: {
          getSession: async () => ({ data: { session: null }, error: new Error('Supabase client failed to initialize') }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithOtp: async () => ({ error: new Error('Supabase client failed to initialize') }),
          signOut: async () => ({ error: null }),
        },
        from: () => ({
          select: () => ({ eq: () => ({ single: async () => ({ data: null, error: new Error('Supabase client failed to initialize') }) }) }),
        })
      };
    }
  };

  if (typeof window === 'undefined') {
    return createSupabase();
  }

  if (!window.__supabaseClient) {
    window.__supabaseClient = createSupabase();
  }
  
  return window.__supabaseClient;
}
