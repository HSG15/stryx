"use client";

import { ThemeProvider } from "next-themes";
import { HabitProvider } from "@/hooks/useHabits";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ToastProvider } from "@/contexts/ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ToastProvider>
        <AuthProvider>
          <AuthGuard>
            <HabitProvider>
              {children}
            </HabitProvider>
          </AuthGuard>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
