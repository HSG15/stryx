import { createBrowserClient } from '@supabase/ssr'

declare global {
  interface Window {
    __supabaseClient?: ReturnType<typeof createBrowserClient>;
  }
}

export function createClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storageKey: 'habit-tracker-auth-v3',
        }
      }
    );
  }

  if (!window.__supabaseClient) {
    window.__supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storageKey: 'habit-tracker-auth-v3',
        }
      }
    );
  }
  
  return window.__supabaseClient;
}
