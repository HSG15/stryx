"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { HABIT_COLORS, getHabitGradient } from "@/lib/theme-utils";
import { cn } from "@/lib/utils";
import { FrequencyType } from "@/lib/types";

const ICONS = ["🏃‍♂️", "💧", "📖", "🧘‍♀️", "🍎", "💻", "🎸", "🏋️‍♀️", "😴", "🧠", "💊", "💸"];
const ICON_SUGGESTIONS: Record<string, string> = {
  "🏃‍♂️": "Go for a run",
  "💧": "Drink Water",
  "📖": "Read 10 pages",
  "🧘‍♀️": "Meditate",
  "🍎": "Eat a healthy meal",
  "💻": "Code for 1 hour",
  "🎸": "Practice guitar",
  "🏋️‍♀️": "Workout",
  "😴": "Sleep 8 hours",
  "🧠": "Learn something new",
  "💊": "Take vitamins",
  "💸": "Save money",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; icon: string; color: string; frequencyType: FrequencyType }) => void;
  initialData?: { name: string; icon: string; color: string; frequencyType: FrequencyType } | null;
  onDelete?: () => void;
}

export function HabitModal({ isOpen, onClose, onSave, initialData, onDelete }: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(HABIT_COLORS[3]); // Green default
  const [freq, setFreq] = useState<FrequencyType>("daily");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { theme } = useTheme();
  
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      if (initialData) {
        setName(initialData.name);
        setIcon(initialData.icon);
        setColor(initialData.color);
        setFreq(initialData.frequencyType);
      } else {
        setName("");
        setIcon(ICONS[0]);
        setColor(HABIT_COLORS[3]);
        setFreq("daily");
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon, color, frequencyType: freq });
    
    // Reset form
    setName("");
    setIcon(ICONS[0]);
    setColor(HABIT_COLORS[3]);
    setFreq("daily");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-card w-full max-w-md rounded-2xl border shadow-xl flex flex-col pt-6 px-6 pb-6 relative"
          >
            <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{initialData ? "Edit Habit" : "New Habit"}</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Name Input */}
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Habit Name
            </label>
            <input
              id="name"
              type="text"
              autoFocus
              placeholder={`e.g. ${ICON_SUGGESTIONS[icon] || "Drink Water"} (Press Tab to auto-fill)`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !name && ICON_SUGGESTIONS[icon]) {
                  e.preventDefault();
                  setName(ICON_SUGGESTIONS[icon]);
                }
              }}
              className="w-full bg-background border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-foreground focus:border-transparent transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Icon Selection */}
          <div className="flex flex-col gap-2 relative">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Icon
            </label>
            <div className="flex flex-wrap gap-2 relative">
              {!ICONS.includes(icon) && (
                <button
                  type="button"
                  className="size-10 text-xl flex items-center justify-center rounded-lg border-2 border-foreground bg-muted ring-2 ring-foreground ring-offset-2 ring-offset-background transition-transform active:scale-95"
                >
                  {icon}
                </button>
              )}
              {ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={cn(
                    "size-10 text-xl flex items-center justify-center rounded-lg border-2 transition-transform active:scale-95",
                    icon === emoji ? "border-foreground bg-muted ring-2 ring-foreground ring-offset-2 ring-offset-background" : "border-transparent bg-muted/50 hover:bg-muted"
                  )}
                >
                  {emoji}
                </button>
              ))}
              <div className="relative" ref={pickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="size-10 text-xl flex items-center justify-center rounded-lg border-2 border-dashed border-border/60 text-muted-foreground hover:bg-muted hover:border-foreground/40 hover:text-foreground transition-all active:scale-95 bg-muted/20"
                >
                  <Plus size={20} />
                </button>

                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute left-0 top-12 z-[100] shadow-2xl rounded-xl border bg-card overflow-hidden"
                    >
                      <EmojiPicker 
                        theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                        onEmojiClick={(emojiData) => {
                          setIcon(emojiData.emoji);
                          setShowEmojiPicker(false);
                        }}
                        lazyLoadEmojis={true}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Color Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Color Label
            </label>
            <div className="flex flex-wrap gap-3">
              {HABIT_COLORS.map((c) => {
                const gradient = getHabitGradient(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "size-8 rounded-full transition-transform bg-gradient-to-br border-2",
                      gradient.from, gradient.to, gradient.border,
                      color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110" : "hover:scale-110"
                    )}
                  />
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end mt-4 pt-4 border-t items-center min-h-[60px]">
            {initialData && onDelete ? (
              showDeleteConfirm ? (
                <>
                  <span className="text-sm font-medium text-destructive mr-auto">Are you sure?</span>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 rounded-lg font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="px-5 py-2.5 rounded-lg font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm"
                  >
                    Yes, Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mr-auto px-4 py-2 rounded-lg font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Delete Habit
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-lg font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    disabled={!name.trim()}
                    className="px-5 py-2.5 bg-foreground text-background rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Changes
                  </motion.button>
                </>
              )
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  disabled={!name.trim()}
                  className="px-5 py-2.5 bg-foreground text-background rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Habit
                </motion.button>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
  );
}