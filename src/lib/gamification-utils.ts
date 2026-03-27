import { Habit } from "./types";
import { subDays } from "date-fns";
import { formatDateKey, isDateToday } from "./date-utils";
import quotes from "./quotes.json";

export const LEVELS = [
  { minXp: 0, name: "Beginner", icon: "🌱" },
  { minXp: 50, name: "Consistent", icon: "⭐" },
  { minXp: 200, name: "Pro", icon: "🚀" },
  { minXp: 500, name: "Elite", icon: "👑" },
  { minXp: 1000, name: "Master", icon: "⚡" },
];

export function calculateHabitStreak(habit: Habit): number {
  let streak = 0;
  let d = new Date();
  
  while (true) {
    if (habit.logs[formatDateKey(d)]) {
      streak++;
      d = subDays(d, 1);
    } else if (isDateToday(formatDateKey(d))) {
      // Allow today to be missed without losing streak assuming they will do it later
      d = subDays(d, 1);
    } else {
      break;
    }
  }

  return streak;
}

export function calculateTotalXP(habits: Habit[]): number {
  return habits.reduce((acc, habit) => acc + Object.keys(habit.logs).length * 10, 0);
}

export function getCurrentLevel(xp: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    }
  }

  const progress = next ? ((xp - current.minXp) / (next.minXp - current.minXp)) * 100 : 100;

  return { current, next, progress };
}

export function getDailyMotivation(habits: Habit[], xp: number): string {
  if (habits.length === 0) return "Start building your first habit today.";
  
  let maxStreak = 0;
  habits.forEach(h => {
    const s = calculateHabitStreak(h);
    if (s > maxStreak) maxStreak = s;
  });

  const dayOfYear = Math.floor(
    (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );

  let category = "zero";
  if (maxStreak > 21) category = "elite";
  else if (maxStreak > 2) category = "building";

  const list = quotes[category as keyof typeof quotes];
  return list[dayOfYear % list.length];
}

export function getStreakFireStyle(streak: number) {
  if (streak < 3) return null;
  if (streak < 7) return { scale: 1, color: "text-orange-400", opacity: 0.8, glow: "" };
  if (streak < 14) return { scale: 1.1, color: "text-orange-500", opacity: 0.9, glow: "drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" };
  if (streak < 30) return { scale: 1.25, color: "text-red-500", opacity: 1, glow: "drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]" };
  return { scale: 1.4, color: "text-rose-500", opacity: 1, glow: "drop-shadow-[0_0_16px_rgba(244,63,94,1)] animate-pulse" };
}

export function getSmartInsight(habits: Habit[]): string | null {
  if (habits.length === 0) return null;
  
  const dayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  let totalLogs = 0;
  let totalMoodLogs = 0;
  let greatMoodDays = 0;
  
  habits.forEach(h => {
    Object.entries(h.logs).forEach(([dateStr, log]) => {
      // dateStr is 'v1-yyyy-mm-dd' or 'yyyy-MM-dd' natively from date-utils
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        dayCounts[date.getDay()]++;
        totalLogs++;
      }
      if (typeof log === "object" && log.mood) {
        totalMoodLogs++;
        if (log.mood === 3) greatMoodDays++;
      }
    });
  });

  if (totalLogs < 3) return "Keep tracking to unlock personalized insights!";

  const maxCompletions = Math.max(...dayCounts);
  const bestDayIndex = dayCounts.indexOf(maxCompletions);
  const minCompletions = Math.min(...dayCounts);
  const worstDayIndex = dayCounts.indexOf(minCompletions);

  const weekendDrops = dayCounts[0] + dayCounts[6] < (totalLogs / 7) * 1.5;
  
  const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

  const insights = [];
  if (weekendDrops && totalLogs > 10) {
    insights.push("You miss most habits on weekends. Try setting a specific weekend routine!");
  }
  insights.push(`You are most consistent on ${days[bestDayIndex]}! (${maxCompletions} completions)`);
  if (worstDayIndex !== bestDayIndex && totalLogs > 5) {
    insights.push(`${days[worstDayIndex]}s are your toughest days. Keep pushing!`);
  }
  if (totalMoodLogs >= 3 && greatMoodDays >= totalMoodLogs * 0.5) {
    insights.push("You're feeling Great on over 50% of your completed habits! Keep riding this positive wave.");
  }

  return insights[Math.floor(new Date().getTime() / 86400000) % insights.length];
}
