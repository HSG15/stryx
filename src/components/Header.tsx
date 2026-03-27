"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { UserProfile } from "./UserProfile";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = (e: React.MouseEvent) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    
    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      setTheme(nextTheme);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Use flushSync so React flushes the DOM update synchronously
    // before the transition takes the new snapshot
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme);
      });
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: theme === "dark" ? clipPath.reverse() : clipPath,
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: theme === "dark" ? "::view-transition-old(root)" : "::view-transition-new(root)",
        }
      );
    });
  };

  return (
    <header className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-foreground text-background flex items-center justify-center font-bold shadow-sm">
          H
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight leading-tight">Habits</h1>
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground opacity-70">
            Build. Track. Grow.
          </span>
        </div>
      </div>
      
      {mounted ? (
        <div className="flex items-center gap-4">
          <UserProfile />
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      ) : (
        <div className="size-9" /> /* Placeholder to prevent layout shift */
      )}
    </header>
  );
}
