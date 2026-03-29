"use client";

import { useHabits } from "@/hooks/useHabits";
import { getDaysForMonth, formatDateKey, isDateInFuture, isDateToday } from "@/lib/date-utils";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Habit } from "@/lib/types";
import { getHabitGradient } from "@/lib/theme-utils";
import { calculateHabitStreak, getStreakFireStyle } from "@/lib/gamification-utils";

interface Props {
  selectedMonth: Date;
  onAddHabitClick: () => void;
  onEditHabitClick: (habit: Habit) => void;
}

export function HabitGrid({ selectedMonth, onAddHabitClick, onEditHabitClick }: Props) {
  const { habits, toggleHabitLog } = useHabits();
  const days = getDaysForMonth(selectedMonth.getFullYear(), selectedMonth.getMonth());

  return (
    <div className="bg-card/80 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl shadow-xl shadow-black/5 flex flex-col overflow-hidden relative">
      <div className="w-full overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-track]:bg-transparent rounded-b-2xl">
        <div className="min-w-max flex flex-col">
          {/* Grid Header -> Days of the month */}
          <div className="flex border-b border-border/40">
            {/* Sticky Label Column */}
            <div className="sticky left-0 w-[180px] md:w-[240px] shrink-0 p-4 border-r border-border/40 bg-card/95 backdrop-blur-sm z-20 flex items-center">
              <span className="font-semibold text-muted-foreground">Habits</span>
            </div>
            
            {/* Days Row */}
            <div className="flex flex-1">
              {days.map((day) => {
                const ds = formatDateKey(day);
                const isToday = isDateToday(ds);
                const future = isDateInFuture(ds);
                return (
                  <div 
                    key={ds} 
                    className={cn(
                      "flex flex-col items-center justify-center py-2 min-w-[56px] shrink-0 border-r border-border/40 last:border-r-0 transition-colors",
                      isToday && "bg-accent/50 text-accent-foreground font-bold"
                    )}
                  >
                    <span className="text-xs text-muted-foreground font-medium">{format(day, "EEE")}</span>
                    <span className={cn("text-lg", future && "opacity-30")}>{format(day, "d")}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Grid Body */}
          <div className="flex flex-col">
            {habits.length === 0 ? (
              <div className="sticky left-0 p-12 text-center text-muted-foreground flex flex-col items-center justify-center w-[180px] md:w-[240px]">
                <p className="mb-4 whitespace-nowrap">No habits yet.</p>
                <button onClick={onAddHabitClick} className="bg-foreground text-background px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap">
                  Create your first habit
                </button>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {habits.map((habit) => (
                  <motion.div 
                    key={habit.id} 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="flex border-b border-border/40 last:border-b-0 group"
                  >
                    {/* Sticky Habit Label */}
                    <div 
                      onClick={() => onEditHabitClick(habit)}
                      className="sticky left-0 w-[180px] md:w-[240px] shrink-0 px-4 py-3 border-r border-border/40 bg-card/95 backdrop-blur-sm hover:bg-muted/80 z-20 flex items-center gap-3 cursor-pointer transition-colors"
                      role="button"
                      tabIndex={0}
                    >
                      <div className="size-8 rounded flex items-center justify-center text-lg bg-background shrink-0 shadow-sm scale-100 group-hover:scale-105 transition-transform relative">
                        {habit.icon}
                        {(() => {
                          const streak = calculateHabitStreak(habit);
                          const fireStyle = getStreakFireStyle(streak);
                          if (!fireStyle) return null;
                          return (
                            <motion.div 
                              initial={{ scale: 0 }} 
                              animate={{ scale: fireStyle.scale }}
                              className={cn("absolute -top-1 -right-1 text-[12px] z-30 drop-shadow-sm", fireStyle.color, fireStyle.glow)} 
                              style={{ opacity: fireStyle.opacity }}
                              title={`${streak} day streak!`}
                            >
                              🔥
                            </motion.div>
                          );
                        })()}
                      </div>
                      <div className="flex flex-col overflow-hidden min-w-0">
                        <span className="font-medium truncate group-hover:text-foreground/80 transition-colors" title={habit.name}>{habit.name}</span>
                        {calculateHabitStreak(habit) > 0 && <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">{calculateHabitStreak(habit)} Streak</span>}
                      </div>
                    </div>
                    
                    {/* Habit Days Cells */}
                    <div className="flex flex-1">
                      {days.map((day) => {
                        const ds = formatDateKey(day);
                        const isToday = isDateToday(ds);
                        const future = isDateInFuture(ds);
                        const isPast = !isToday && !future;
                        
                        const log = habit.logs[ds];
                        const completed = typeof log === "boolean" ? log : log?.completed;
                        
                        const gradient = getHabitGradient(habit.color);

                      return (
                        <div 
                          key={ds} 
                          className={cn(
                            "flex items-center justify-center py-2 min-w-[56px] shrink-0 border-r border-border/40 last:border-r-0 transition-colors",
                            isToday && "bg-accent/30",
                            isPast && "bg-muted/30"
                          )}
                        >
                          <motion.button
                            whileHover={(future || isPast) ? {} : { scale: 1.1, y: -1 }}
                            whileTap={(future || isPast) ? {} : { scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                            disabled={future || isPast}
                            onClick={() => toggleHabitLog(habit.id, ds)}
                            className={cn(
                              "size-10 rounded-xl border-2 transition-all duration-300 flex items-center justify-center overflow-hidden relative",
                              future && "opacity-20 cursor-not-allowed border-border/20",
                              isPast && "opacity-50 dark:opacity-40 cursor-not-allowed border-border/20",
                              !future && !isPast && "cursor-pointer group-hover:border-foreground/20",
                              completed 
                                ? cn(
                                    `${gradient.border} ${gradient.text} bg-gradient-to-br ${gradient.from} ${gradient.to}`,
                                    (!future && !isPast) && `shadow-md ${gradient.shadow}`
                                  )
                                : "border-border/60 hover:bg-muted/80 hover:shadow-sm text-transparent"
                            )}
                            aria-label={`Toggle ${habit.name} for ${ds}`}
                          >
                            <AnimatePresence>
                              {completed && (
                                <motion.div
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.5, opacity: 0 }}
                                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                  <Check size={20} strokeWidth={3.5} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        </div>
                      );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
