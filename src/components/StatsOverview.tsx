"use client";

import { useHabits } from "@/hooks/useHabits";
import { formatDateKey, isDateToday } from "@/lib/date-utils";
import { getSmartInsight } from "@/lib/gamification-utils";
import { format, subDays } from "date-fns";
import { Flame, CheckCircle2, Target, Sparkles } from "lucide-react";

export function StatsOverview() {
  const { habits } = useHabits();

  if (habits.length === 0) return null;

  // Calculate consistency, streaks, etc.
  let totalCompletions = 0;
  let allTimeLongestStreak = 0;
  let currentActiveStreaks = 0; // Habits that have today or yesterday logged
  
  const todayStr = formatDateKey(new Date());
  const yesterdayStr = formatDateKey(subDays(new Date(), 1));

  habits.forEach((habit) => {
    totalCompletions += Object.values(habit.logs).filter(Boolean).length;
    let maxHistoricalStreak = 0;
    let tempStreak = 0;
    const sortedDates = Object.entries(habit.logs)
       .filter(([_, value]) => (typeof value === 'boolean' ? value : value?.completed))
       .map(([dateKey]) => dateKey)
       .sort();

    if (sortedDates.length > 0) {
      tempStreak = 1;
      maxHistoricalStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
         const curr = new Date(sortedDates[i]);
         const prev = new Date(sortedDates[i-1]);
         const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
         if (diff === 1) {
            tempStreak++;
            if (tempStreak > maxHistoricalStreak) maxHistoricalStreak = tempStreak;
         } else if (diff > 1) {
            tempStreak = 1;
         }
      }
    }
    if (maxHistoricalStreak > allTimeLongestStreak) {
      allTimeLongestStreak = maxHistoricalStreak;
    }
    
    // Simple streak check (did they do it today or yesterday)
    let streak = 0;
    let d = new Date();
    while (true) {
      const todayLog = habit.logs[formatDateKey(d)];
      const isCompleted = typeof todayLog === 'boolean' ? todayLog : todayLog?.completed;
      if (isCompleted) {
        streak++;
        d = subDays(d, 1);
      } else if (isDateToday(formatDateKey(d))) {
        // Allow today to be missed without losing streak assuming they will do it later
        d = subDays(d, 1);
      } else {
        break;
      }
    }
    if (streak > maxHistoricalStreak) maxHistoricalStreak = streak;
    if (maxHistoricalStreak > allTimeLongestStreak) allTimeLongestStreak = maxHistoricalStreak;
    if (streak > 0) currentActiveStreaks++;
  });

  const insight = getSmartInsight(habits);

  const isLate = new Date().getHours() >= 20; // 8 PM
  let habitsToProtect = 0;
  if (isLate) {
    habits.forEach(h => {
      const todayLog = typeof h.logs[todayStr] === 'boolean' ? h.logs[todayStr] : h.logs[todayStr]?.completed;
      const yesterdayLog = typeof h.logs[yesterdayStr] === 'boolean' ? h.logs[yesterdayStr] : h.logs[yesterdayStr]?.completed;
      const todayCompleted = !!todayLog;
      const yesterdayCompleted = !!yesterdayLog;
      if (yesterdayCompleted && !todayCompleted) habitsToProtect++;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {habitsToProtect > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="animate-pulse">
              <Flame className="text-red-500" size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-0.5">Streak Protection</p>
              <p className="text-foreground text-sm font-medium">You're about to lose {habitsToProtect} active streak{habitsToProtect > 1 ? 's' : ''}. Complete them before midnight!</p>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-card/80 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-5 shadow-lg shadow-black/5 dark:shadow-none flex items-center gap-4">
        <div className="size-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
          <Flame size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Streaks</p>
          <p className="text-2xl font-bold">{currentActiveStreaks}</p>
        </div>
      </div>

      <div className="bg-card/80 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-5 shadow-lg shadow-black/5 dark:shadow-none flex items-center gap-4">
        <div className="size-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Completions</p>
          <p className="text-2xl font-bold">{totalCompletions}</p>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div className="size-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
          <Target size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Longest Streak</p>
          <p className="text-2xl font-bold">{allTimeLongestStreak}</p>
        </div>
      </div>
      </div>

      {insight && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="text-indigo-500 bg-background rounded-full p-2 shadow-sm shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-0.5">Smart Insight</p>
            <p className="text-foreground text-sm font-medium">{insight}</p>
          </div>
        </div>
      )}
    </div>
  );
}
