"use client";

import { useHabits } from "@/hooks/useHabits";
import { getHabitGradient } from "@/lib/theme-utils";
import { formatDateKey } from "@/lib/date-utils";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { MoodSelector } from "./MoodSelector";

export function TodayView() {
  const { habits, toggleHabitLog, updateMoodLog } = useHabits();
  const todayKey = formatDateKey(new Date());

  if (habits.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground bg-card border rounded-2xl">
        No habits tracked yet. Create one to get started!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {habits.map((habit) => {
          const log = habit.logs[todayKey];
          let completed = false;
          let currentMood: number | undefined;
          if (typeof log === "boolean") {
            completed = log;
          } else if (log) {
            completed = log.completed;
            currentMood = log.mood;
          }

          const gradient = getHabitGradient(habit.color);
          
          return (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              key={habit.id}
              className={cn(
                "w-full p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-start justify-between group overflow-hidden relative shadow-sm cursor-pointer",
                completed 
                  ? `${gradient.border} bg-gradient-to-br ${gradient.from} ${gradient.to} shadow-lg ${gradient.shadow}`
                  : "bg-card/80 backdrop-blur-md border-white/20 dark:border-white/10 hover:bg-card/95 hover:shadow-md hover:border-foreground/20"
              )}
              onClick={() => toggleHabitLog(habit.id, todayKey)}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4 z-10 relative">
                  <div className={cn(
                    "size-12 rounded-xl flex items-center justify-center text-2xl transition-transform duration-300",
                    completed ? `${gradient.bg} ${gradient.text} scale-110` : "bg-muted scale-100 group-hover:scale-105"
                  )}>
                    {habit.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className={cn("font-semibold text-lg", completed ? gradient.text : "")}>{habit.name}</span>
                    <span className={cn("text-sm", completed ? gradient.text : "text-muted-foreground", completed ? "opacity-80" : "")}>
                      {completed ? "Completed" : "Pending"}
                    </span>
                  </div>
                </div>

                <div className={cn(
                  "size-8 rounded-full border-2 flex items-center justify-center transition-all z-10 relative",
                  completed ? `border-transparent ${gradient.bg} ${gradient.text}` : "border-muted-foreground/30 text-transparent group-hover:border-foreground/30"
                )}>
                  <Check size={16} strokeWidth={completed ? 3 : 2} className={cn(completed ? "opacity-100" : "opacity-0 group-hover:opacity-20")} />
                </div>
              </div>

              <AnimatePresence>
                {completed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    className="w-full overflow-hidden"
                  >
                    <MoodSelector
                      habitId={habit.id}
                      dateKey={todayKey}
                      currentMood={currentMood}
                      onUpdateMood={updateMoodLog}
                      gradientParams={gradient}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
