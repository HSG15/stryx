"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, KeyRound } from "lucide-react";

export function AuthScreen() {
  const { signInWithEmail, verifyOtp } = useAuth();
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setError("");

    const { error: resError } = await signInWithEmail(email);

    if (resError) {
      setError(resError.message || "Failed to send code.");
    } else {
      setStep("otp");
    }

    setIsSubmitting(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) return;

    setIsSubmitting(true);
    setError("");

    const { error: resError } = await verifyOtp(email, otp);

    if (resError) {
      setError(resError.message || "Invalid or expired code.");
      setIsSubmitting(false);
    }
    // On success, AuthContext listener handles the state change automatically
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div className="w-full max-w-[360px] flex flex-col items-center">
        <div className="size-12 bg-foreground text-background rounded-xl flex items-center justify-center mb-8 shadow-sm">
          <Sparkles size={24} />
        </div>

        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.form
              key="email-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleEmailSubmit}
              className="w-full flex flex-col gap-4 text-center"
            >
              <div>
                <h2 className="text-xl font-bold">Welcome Back</h2>
                <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="border border-border/50 bg-muted/30 focus-visible:ring-1 focus-visible:ring-foreground rounded-xl px-4 py-3 text-sm transition-all text-center"
                />

                {error && <p className="text-red-500 text-xs text-balance">{error}</p>}
              </div>

              <button
                disabled={isSubmitting || !email}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-xl py-3 font-medium transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {isSubmitting ? "Sending code..." : "Continue with Email"}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="otp-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleOtpSubmit}
              className="w-full flex flex-col gap-4 text-center"
            >
              <div>
                <KeyRound className="mx-auto mb-4 text-muted-foreground size-8" />
                <h2 className="text-xl font-bold">Enter Code</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a secure code to <b>{email}</b>
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                 <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="Code"
                  className="border border-border/50 bg-muted/30 focus-visible:ring-1 focus-visible:ring-foreground rounded-xl text-center tracking-widest text-2xl font-mono px-4 py-3 transition-all"
                />
                
                {error && <p className="text-red-500 text-xs text-balance mt-1">{error}</p>}
              </div>

              <button
                disabled={isSubmitting || otp.length < 4}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-xl py-3 font-medium transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
              >
                {isSubmitting ? "Verifying..." : "Verify Code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtp("");
                  setError("");
                }}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors mt-2"
              >
                Use a different email
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
