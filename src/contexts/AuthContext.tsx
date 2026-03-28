"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { UserProfile } from "@/lib/types";
import { User, Session, AuthChangeEvent, AuthError } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  authError: string | null;
  signInWithEmail: (email: string) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());
  const hasInitialized = useRef(false);

  const fetchProfile = React.useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error:", error);
        setProfile(null);
        return;
      }

      setProfile(data ?? null);
    } catch (err) {
      console.error("Unexpected profile error:", err);
      setProfile(null);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      // Clean URL logic: run once on mount
      if (typeof window !== "undefined" && !hasInitialized.current) {
        hasInitialized.current = true;
        
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        const errDesc = searchParams.get('error_description') || hashParams.get('error_description');
        const errCode = searchParams.get('error_code') || hashParams.get('error_code');
        const hasToken = hashParams.get('access_token') || hashParams.get('type') === 'magiclink';

        if (errDesc || errCode) {
          if (errDesc?.includes('expired') || errCode?.includes('expired')) {
            setAuthError("Session expired. Please request a new login link.");
          } else {
            setAuthError(errDesc || "Authentication error. Please try again.");
          }
        }

        // Clean the URL safely removing hash and query params
        if (errDesc || errCode || hasToken) {
           window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      try {
        // Fetch session safely
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
        }

        if (!mounted) return;

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth init crash:", err);
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === "INITIAL_SESSION") return; // Let initialization handler cover this
      if (!mounted) return;

      try {
        const currentUser = session?.user ?? null;
        
        // Prevent unnecessary state updates if user is same
        setUser((prev) => (prev?.id === currentUser?.id ? prev : currentUser));

        if (event === "SIGNED_IN" && currentUser) {
          setIsLoading(true);
          await fetchProfile(currentUser.id);
          setIsLoading(false);
          // Optional: clear authError when successfully signed in
          setAuthError(null);
        } else if (event === "SIGNED_OUT") {
          setProfile(null);
          setUser(null);
        } else if (event === "TOKEN_REFRESHED") {
          // Just update the user if needed, no need to refetch profile
        }
      } catch (err) {
        console.error("Auth change error:", err);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, supabase.auth]);

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        authError,
        signInWithEmail,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}