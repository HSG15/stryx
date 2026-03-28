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

  // 🔄 LOADING SCREEN
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="size-12 rounded-full border-4 border-muted-foreground/20 border-t-foreground animate-spin" />
      </div>
    );
  }

  // ✉️ EMAIL SIGN-IN
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSending(true);
    setError("");

    const { error } = await signInWithEmail(email);

    if (error) {
      setError(error.message || "Failed to send magic link.");
    } else {
      setEmailSent(true);
    }

    setIsSending(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div className="w-full max-w-[360px] flex flex-col items-center">
          <div className="size-12 bg-foreground text-background rounded-xl flex items-center justify-center mb-8">
            <Sparkles size={24} />
          </div>

          <AnimatePresence mode="wait">
            {emailSent ? (
              <motion.div key="sent" className="text-center">
                <Mail className="mx-auto mb-4" />
                <h2 className="text-xl font-bold">Check your email</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Magic link sent to <b>{email}</b>
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleEmailSignIn}
                className="w-full flex flex-col gap-3"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="border rounded-xl px-4 py-3 text-sm"
                />

                {error && <p className="text-red-500 text-xs">{error}</p>}

                <button
                  disabled={isSending}
                  className="bg-foreground text-background rounded-xl py-3"
                >
                  {isSending ? "Sending..." : "Continue with Email"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // 👤 CREATE PROFILE
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setError("");

    const supabase = createClient();

    const { error } = await supabase.from("users").insert({
      id: user.id,
      name,
      username,
    });

    if (error) {
      if (error.code === "23505") {
        setError("Username already taken or profile exists.");
        await refreshProfile();
      } else {
        setError(error.message);
      }
    } else {
      await refreshProfile();
    }

    setIsSaving(false);
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <form
          onSubmit={handleProfileSubmit}
          className="w-full max-w-[360px] flex flex-col gap-4"
        >
          <h2 className="text-xl font-bold text-center">Complete Profile</h2>

          <input
            required
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-xl px-4 py-3"
          />

          <input
            required
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            className="border rounded-xl px-4 py-3"
          />

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            disabled={isSaving}
            className="bg-indigo-500 text-white rounded-xl py-3"
          >
            {isSaving ? "Saving..." : "Start"}
          </button>
        </form>
      </div>
    );
  }

  // ✅ APP
  return <>{children}</>;
}