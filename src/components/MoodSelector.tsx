"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  habitId: string;
  dateKey: string;
  currentMood?: number;
  onUpdateMood: (habitId: string, dateKey: string, mood: number) => void;
  gradientParams: { bg: string, text: string };
}

const MOODS = [
  { value: 1, emoji: "😞", label: "Hard" },
  { value: 2, emoji: "😐", label: "Okay" },
  { value: 3, emoji: "😊", label: "Great" }
];

export function MoodSelector({ habitId, dateKey, currentMood, onUpdateMood, gradientParams }: Props) {
  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/40 w-full z-20 relative">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2">How did it feel?</span>
      {MOODS.map(m => (
        <motion.button
          key={m.value}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onUpdateMood(habitId, dateKey, m.value);
          }}
          className={cn(
            "size-8 md:size-10 rounded-full flex items-center justify-center text-lg md:text-xl transition-all",
            currentMood === m.value 
              ? `${gradientParams.bg} ring-2 ring-offset-2 ring-offset-card ring-foreground/20 shadow-md scale-110` 
              : "bg-muted/50 hover:bg-muted grayscale group-hover:grayscale-0 opacity-60 hover:opacity-100"
          )}
          title={m.label}
        >
          {m.emoji}
        </motion.button>
      ))}
    </div>
  );
}
