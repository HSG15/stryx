export const HABIT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", 
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"
];

export const COLOR_GRADIENTS: Record<string, { from: string, to: string, shadow: string, border: string, bg: string, text: string }> = {
  "#ef4444": { from: "from-red-500/15", to: "to-red-500/5", shadow: "shadow-red-500/10", border: "border-red-500/30", bg: "bg-red-500/10", text: "text-red-500 dark:text-red-400" }, // Red
  "#f97316": { from: "from-orange-500/15", to: "to-orange-500/5", shadow: "shadow-orange-500/10", border: "border-orange-500/30", bg: "bg-orange-500/10", text: "text-orange-500 dark:text-orange-400" }, // Orange
  "#eab308": { from: "from-amber-500/15", to: "to-amber-500/5", shadow: "shadow-amber-500/10", border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-500 dark:text-amber-400" }, // Yellow
  "#22c55e": { from: "from-emerald-500/15", to: "to-emerald-500/5", shadow: "shadow-emerald-500/10", border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-500 dark:text-emerald-400" }, // Green
  "#06b6d4": { from: "from-cyan-500/15", to: "to-cyan-500/5", shadow: "shadow-cyan-500/10", border: "border-cyan-500/30", bg: "bg-cyan-500/10", text: "text-cyan-500 dark:text-cyan-400" }, // Cyan
  "#3b82f6": { from: "from-blue-500/15", to: "to-blue-500/5", shadow: "shadow-blue-500/10", border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-500 dark:text-blue-400" }, // Blue
  "#8b5cf6": { from: "from-purple-500/15", to: "to-purple-500/5", shadow: "shadow-purple-500/10", border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-500 dark:text-purple-400" }, // Purple
  "#ec4899": { from: "from-pink-500/15", to: "to-pink-500/5", shadow: "shadow-pink-500/10", border: "border-pink-500/30", bg: "bg-pink-500/10", text: "text-pink-500 dark:text-pink-400" }, // Pink
};

export function getHabitGradient(colorStr: string) {
  return COLOR_GRADIENTS[colorStr] || { 
    from: "from-zinc-400", to: "to-zinc-500", shadow: "shadow-zinc-500/25", border: "border-zinc-500/30", bg: "bg-zinc-500/10", text: "text-zinc-500"
  };
}
