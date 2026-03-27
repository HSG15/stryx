"use client";

import { useHabits } from "@/hooks/useHabits";
import { calculateTotalXP, getCurrentLevel, getDailyMotivation } from "@/lib/gamification-utils";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSocialMotivation } from "@/hooks/useSocialMotivation";
import { Sparkles } from "lucide-react";

export function GamificationHeader() {
  const { habits } = useHabits();
  const socialMotivation = useSocialMotivation();

  if (habits.length === 0) return null;

  const xp = calculateTotalXP(habits);
  const { current, next, progress } = getCurrentLevel(xp);
  const leveledUp = progress === 100 && next;
  const motivation = getDailyMotivation(habits, xp);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="bg-gradient-to-br from-card/80 to-card border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative backdrop-blur-md"
    >
      <div className="flex flex-col gap-1 z-10 w-full md:w-1/2">
        <h2 className="text-2xl font-bold tracking-tight">Today's Focus</h2>
        <p className="text-muted-foreground">{motivation}</p>
        <p className="text-xs text-indigo-500 flex items-center gap-1 font-semibold mt-1">
          <Sparkles size={12} /> {socialMotivation}
        </p>
      </div>

      <div className="flex flex-col gap-2 min-w-[200px] z-10 w-full md:w-auto">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="flex items-center gap-1">{current.icon} {current.name}</span>
          <span className="text-muted-foreground">{xp} XP</span>
        </div>
        <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-white/10 relative shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className={cn("h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full", leveledUp && "animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.8)]")}
          />
          <AnimatePresence>
            {leveledUp && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-white/40"
              />
            )}
          </AnimatePresence>
        </div>
        {next && (
          <p className="text-xs text-muted-foreground text-right">{next.minXp - xp} XP to {next.name}</p>
        )}
      </div>
    </motion.div>
  );
}
