"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { UserProfile } from "@/lib/types";
import { User, Session, AuthChangeEvent, AuthError } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signInWithEmail: (email: string) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(() => createClient());

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

    const initSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
        }

        if (!mounted) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (err) {
        console.error("Init crash:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initSession();

    // 🔥 Fallback: never stay stuck
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn("Auth timeout fallback triggered");
        setIsLoading(false);
      }
    }, 3000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;

      try {
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth change error:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
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