"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { Habit } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/utils/supabase/client";

interface HabitContextType {
  habits: Habit[];
  addHabit: (habit: Omit<Habit, "id" | "createdAt" | "logs">) => Promise<{ success: boolean; error?: any }>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<{ success: boolean; error?: any }>;
  deleteHabit: (id: string) => Promise<{ success: boolean; error?: any }>;
  toggleHabitLog: (habitId: string, dateKey: string) => void;
  updateMoodLog: (habitId: string, dateKey: string, mood: number) => void;
  isLoaded: boolean;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export function HabitProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [supabase] = useState(() => createClient());
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch habits from Supabase
  const loadHabits = useCallback(async () => {
    if (!user) {
      setHabits([]);
      setIsLoaded(true);
      return;
    }
    
    // Fetch Habits + Logs linked to user
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id);

    if (habitsError) {
      console.error(habitsError);
      setIsLoaded(true);
      return;
    }

    const { data: logsData, error: logsError } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id);

    if (logsError) console.error(logsError);

    const formattedHabits: Habit[] = (habitsData || []).map((h: any) => {
      const logsMap: Record<string, { completed: boolean; mood?: number }> = {};
      const relevantLogs = (logsData || []).filter((l: any) => l.habit_id === h.id);
      relevantLogs.forEach((l: any) => {
        logsMap[l.date] = { completed: l.completed, mood: l.mood || undefined };
      });

      return {
        id: h.id,
        name: h.name,
        icon: h.icon,
        color: h.color,
        frequencyType: h.frequency_type as any,
        customDays: h.custom_days,
        createdAt: h.created_at,
        logs: logsMap
      };
    });

    setHabits(formattedHabits);
    setIsLoaded(true);
  }, [user, supabase]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const addHabit = useCallback(async (habitData: Omit<Habit, "id" | "createdAt" | "logs">) => {
    if (!user) return { success: false, error: "Not authenticated" };

    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const newHabit: Habit = {
      id: tempId,
      name: habitData.name,
      icon: habitData.icon,
      color: habitData.color,
      frequencyType: habitData.frequencyType,
      customDays: habitData.customDays,
      createdAt: new Date().toISOString(),
      logs: {},
    };
    
    setHabits((prev) => [...prev, newHabit]);

    const { data, error } = await supabase.from('habits').insert({
      user_id: user.id,
      name: habitData.name,
      icon: habitData.icon,
      color: habitData.color,
      frequency_type: habitData.frequencyType,
      custom_days: habitData.customDays,
    }).select().single();

    if (error) {
      console.error(error);
      setHabits((prev) => prev.filter(h => h.id !== tempId)); // Revert
      return { success: false, error };
    }

    setHabits((prev) => prev.map(h => h.id === tempId ? { ...newHabit, id: data.id, createdAt: data.created_at } : h));
    return { success: true };
  }, [user, supabase]);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    if (!user) return { success: false, error: "Not logged in" };
    
    // Optimistic UI
    setHabits((prev) => prev.map((habit) => (habit.id === id ? { ...habit, ...updates } : habit)));

    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.icon) dbUpdates.icon = updates.icon;
    if (updates.color) dbUpdates.color = updates.color;
    if (updates.frequencyType) dbUpdates.frequency_type = updates.frequencyType;
    if (updates.customDays !== undefined) dbUpdates.custom_days = updates.customDays;

    const { error } = await supabase.from('habits').update(dbUpdates).eq('id', id).eq('user_id', user.id);
    if (error) {
      console.error(error);
      return { success: false, error };
    }
    return { success: true };
  }, [user, supabase]);

  const deleteHabit = useCallback(async (id: string) => {
    if (!user) return { success: false, error: "Not logged in" };
    
    // Optimistic UI
    setHabits((prev) => prev.filter((habit) => habit.id !== id));
    
    const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      console.error(error);
      return { success: false, error };
    }
    return { success: true };
  }, [user, supabase]);

  const toggleHabitLog = useCallback(async (habitId: string, dateKey: string) => {
    if (!user) return;
    
    // Optimistic UI
    let currentlyCompleted = false;
    let oldMood: number | undefined;

    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const newLogs = { ...habit.logs };
        const current = newLogs[dateKey];
        if (typeof current === "boolean") currentlyCompleted = current;
        else if (current) { currentlyCompleted = current.completed; oldMood = current.mood; }

        if (currentlyCompleted) {
          if (oldMood !== undefined) newLogs[dateKey] = { completed: false, mood: oldMood };
          else delete newLogs[dateKey];
        } else {
          newLogs[dateKey] = { completed: true, mood: oldMood };
        }
        return { ...habit, logs: newLogs };
      })
    );

    // Backend Upsert
    if (currentlyCompleted) {
       // It was true, we set to false -> just delete the row if mood is empty, else set completed = false
       if (oldMood === undefined) {
         await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('date', dateKey);
       } else {
         await supabase.from('habit_logs').update({ completed: false }).eq('habit_id', habitId).eq('date', dateKey);
       }
    } else {
       // Set true -> upsert
       await supabase.from('habit_logs').upsert({
         habit_id: habitId,
         user_id: user.id,
         date: dateKey,
         completed: true,
         mood: oldMood || null
       }, { onConflict: 'habit_id, date' });
    }

  }, [user, supabase]);

  const updateMoodLog = useCallback(async (habitId: string, dateKey: string, mood: number) => {
    if (!user) return;

    // Optimistic UI
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const newLogs = { ...habit.logs };
        const current = newLogs[dateKey];
        const completed = (typeof current === "boolean" ? current : current?.completed) || false;
        newLogs[dateKey] = { completed, mood };
        return { ...habit, logs: newLogs };
      })
    );

    // Backend Upsert
    await supabase.from('habit_logs').upsert({
      habit_id: habitId,
      user_id: user.id,
      date: dateKey,
      completed: true, // Assuming you only set mood on completions
      mood,
    }, { onConflict: 'habit_id, date' });

  }, [user, supabase]);

  const value = useMemo(
    () => ({ habits, addHabit, updateHabit, deleteHabit, toggleHabitLog, updateMoodLog, isLoaded }),
    [habits, addHabit, updateHabit, deleteHabit, toggleHabitLog, updateMoodLog, isLoaded]
  );

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
}

export function useHabits() {
  const context = useContext(HabitContext);
  if (context === undefined) throw new Error("useHabits must be used within a HabitProvider");
  return context;
}
