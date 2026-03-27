export type FrequencyType = "daily" | "custom";

export interface Habit {
  id: string;
  name: string;
  icon: string;      // Emoji
  color: string;     // hex color like #ef4444
  frequencyType: FrequencyType;
  customDays?: number[]; // [0, 1, 2, 3, 4, 5, 6] where 0 is Sunday
  createdAt: string; // ISO Date String
  logs: Record<string, boolean | { completed: boolean; mood?: number }>; // Key format: 'yyyy-MM-dd'
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  completionRate: number; // Percentage
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar_url: string;
  created_at: string;
}
