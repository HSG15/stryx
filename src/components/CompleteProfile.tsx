"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

export function CompleteProfile() {
  const { user, refreshProfile } = useAuth();
  
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;

    setIsSaving(true);
    setError("");

    const supabase = createClient();

    if (user.email) {
      const normalizedEmail = user.email.trim().toLowerCase();
      const { data: existingUser, error: existingError } = await supabase
        .from("users")
        .select("*")
        .ilike("email", normalizedEmail)
        .maybeSingle();

      if (existingError) {
        console.error("Profile existence check error:", existingError);
        setError("Something went wrong. Please try again.");
        setIsSaving(false);
        return;
      }

      if (existingUser) {
        if (existingUser.id === user.id) {
          await refreshProfile();
          setIsSaving(false);
          return;
        }

        await refreshProfile();
        setIsSaving(false);
        return;
      }
    }

    const { error } = await supabase.from("users").upsert({
      id: user.id,
      name,
      username,
      email: user.email,
    }, { onConflict: "id" });

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

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleProfileSubmit}
        className="w-full max-w-[360px] flex flex-col gap-4"
      >
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold">Complete Profile</h2>
          <p className="text-sm text-muted-foreground mt-2">Just a few details to get started</p>
        </div>

        <input
          required
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-border/50 bg-muted/30 focus-visible:ring-1 focus-visible:ring-foreground rounded-xl px-4 py-3 text-sm transition-all"
        />

        <input
          required
          placeholder="Username"
          value={username}
          onChange={(e) =>
            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
          }
          className="border border-border/50 bg-muted/30 focus-visible:ring-1 focus-visible:ring-foreground rounded-xl px-4 py-3 text-sm transition-all"
        />

        {error && <p className="text-red-500 text-xs text-balance text-center">{error}</p>}

        <button
          disabled={isSaving || !name || !username}
          className="bg-foreground text-background hover:bg-foreground/90 rounded-xl py-3 font-medium transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
        >
          {isSaving ? "Saving..." : "Start Using App"}
        </button>
      </motion.form>
    </div>
  );
}
