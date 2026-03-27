"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Mail } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, signInWithEmail, refreshProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setError("");

    const supabase = createClient();
    const avatar_url = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(username)}`;

    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      name,
      username,
      email: user.email || "",
      avatar_url,
    });

    if (insertError) {
      console.error("Supabase Insert Error Object:", insertError);
      if (insertError.code === "23505") {
         if (insertError.message.includes("users_pkey")) {
            // Profile actually exists!
            setError("Profile already exists! Trying to load...");
            await refreshProfile();
         } else {
            setError("Username is already taken.");
         }
      } else {
        setError(`Failed to create: ${insertError.message} (${insertError.code})`);
      }
      setIsSaving(false);
    } else {
      try {
        await refreshProfile();
      } catch (err) {
        console.error("Refresh Error:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-12 rounded-full border-4 border-muted-foreground/20 border-t-foreground animate-spin" />
      </div>
    );
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSending(true);
    setError("");

    const { error: signInError } = await signInWithEmail(email);
    if (signInError) {
      setError(signInError.message || "Failed to send magic link.");
      setIsSending(false);
    } else {
      setEmailSent(true);
      setIsSending(false);
    }
  };

  // Not logged in -> Show Email Sign In
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 selection:bg-indigo-500/30">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px] flex flex-col items-center"
        >
          <div className="size-12 bg-foreground text-background rounded-xl flex items-center justify-center mb-8 shadow-sm">
            <Sparkles size={24} />
          </div>

          <AnimatePresence mode="wait">
            {emailSent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full flex flex-col items-center text-center"
              >
                <div className="size-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
                  <Mail size={24} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Check your email</h2>
                <p className="text-muted-foreground text-sm">
                  We sent a magic link to <b className="text-foreground font-medium">{email}</b>.<br />Click it to securely sign in.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="w-full flex flex-col items-center text-center"
              >
                <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome</h1>
                <p className="text-muted-foreground text-sm mb-8">We'll send you a magic link to sign in.</p>

                <form onSubmit={handleEmailSignIn} className="w-full flex flex-col gap-3">
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full bg-transparent border border-border/60 hover:border-border/80 focus:border-foreground rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs font-medium text-left">{error}</p>}
                  <button
                    disabled={isSending || !email}
                    type="submit"
                    className="w-full bg-foreground text-background font-medium rounded-xl py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {isSending ? (
                      <div className="size-4 rounded-full border-[2px] border-background/20 border-t-background animate-spin" />
                    ) : (
                      "Continue with Email"
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // Logged in but no profile (first time)
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 selection:bg-indigo-500/30">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[360px] flex flex-col"
        >
          <div className="text-center mb-8 flex flex-col items-center">
            <div className="size-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center mb-6 shadow-sm">
              <Sparkles size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Complete profile</h2>
            <p className="text-muted-foreground text-sm">Choose how you appear on leaderboards.</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block px-1">Full Name</label>
              <input
                autoFocus
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent border border-border/60 hover:border-border/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500 transition-all"
                placeholder="Steve Jobs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block px-1">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input
                  type="text"
                  required
                  pattern="^[a-zA-Z0-9_]{3,15}$"
                  title="3-15 characters, letters, numbers, underscores only."
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full bg-transparent border border-border/60 hover:border-border/80 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500 transition-all lowercase"
                  placeholder="steve_j"
                />
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-red-500 text-xs font-medium text-center">
                {error}
              </motion.p>
            )}

            <button
              disabled={isSaving || !username || !name}
              type="submit"
              className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSaving ? (
                <div className="size-4 rounded-full border-[2px] border-white/20 border-t-white animate-spin" />
              ) : (
                <>
                  Start Tracking
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Profile exists -> render app
  return <>{children}</>;
}
