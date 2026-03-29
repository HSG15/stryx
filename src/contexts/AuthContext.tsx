"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { UserProfile } from "@/lib/types";
import { User, Session, AuthChangeEvent, AuthError } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null | false;
  isLoading: boolean;
  signInWithEmail: (email: string) => Promise<{ error: AuthError | Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null | false>(null); // null = loading/unknown, false = confirmed no profile
  const [isLoading, setIsLoading] = useState(true);
  const [supabase] = useState(() => createClient());
  const initialized = useRef(false);
  const currentUserRef = useRef<User | null>(null);

  useEffect(() => {
    currentUserRef.current = user;
  }, [user]);

  const fetchProfile = React.useCallback(async (userObj: User) => {
    try {
      let profileData: UserProfile | null = null;

      // Try identity by auth UID first
      const { data: byId, error: byIdError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userObj.id)
        .maybeSingle();

      if (byIdError) {
        console.error("Profile fetch by ID error:", byIdError);
      } else if (byId) {
        profileData = byId;
      }

      // Fall back to email-based lookup
      if (!profileData && userObj.email) {
        const normalizedEmail = userObj.email.trim().toLowerCase();
        const { data: byEmail, error: byEmailError } = await supabase
          .from("users")
          .select("*")
          .ilike("email", normalizedEmail)
          .maybeSingle();

        if (byEmailError) {
          console.error("Profile fetch by email error:", byEmailError);
        } else if (byEmail) {
          profileData = byEmail;
        }
      }

      setProfile(profileData || false);
    } catch (err) {
      console.error("Unexpected profile error:", err);
      setProfile(false);
    }
  }, [supabase]);

  const initializeAuth = React.useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        setUser(null);
        setProfile(false);
        setIsLoading(false);
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);
      await fetchProfile(currentUser);

    } catch (err) {
      console.error("Auth init crash:", err);
      setUser(null);
      setProfile(false);
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    if (mounted) {
      initializeAuth();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" && session?.user) {
        const isNewUser = currentUserRef.current?.id !== session.user.id;
        
        if (isNewUser) {
          setIsLoading(true);
          setUser(session.user);
          await fetchProfile(session.user);
          setIsLoading(false);
        } else {
          // Token refresh or cross-tab sync for the same user
          setUser(session.user);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(false);
        initialized.current = false;
        setIsLoading(false);
      } else if ((event === "TOKEN_REFRESHED" || event === "USER_UPDATED") && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initializeAuth, supabase.auth, fetchProfile]);

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signInWithEmail,
        verifyOtp,
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