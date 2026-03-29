"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { MonthSelector } from "@/components/MonthSelector";
import { HabitGrid } from "@/components/HabitGrid";
import { HabitModal } from "@/components/HabitModal";
import { StatsOverview } from "@/components/StatsOverview";
import { AnalyticsChart } from "@/components/AnalyticsChart";
import { GamificationHeader } from "@/components/GamificationHeader";
import { TodayView } from "@/components/TodayView";
import { Plus, LayoutGrid, Target } from "lucide-react";
import { useHabits } from "@/hooks/useHabits";
import { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { AuthScreen } from "@/components/AuthScreen";
import { CompleteProfile } from "@/components/CompleteProfile";

export default function Dashboard() {
  const { user, profile, isLoading } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "today">("grid");
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const { addHabit, updateHabit, deleteHabit, isLoaded } = useHabits();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="size-12 rounded-full border-4 border-muted-foreground/20 border-t-foreground animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (profile === false) {
    return <CompleteProfile />;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="size-8 rounded-full border-4 border-foreground border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1400px] mx-auto w-full flex flex-col gap-8 animate-in fade-in duration-500">
        
        {/* Top Section: Month Selector & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <MonthSelector 
            selectedDate={selectedMonth} 
            onChange={setSelectedMonth} 
          />
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:opacity-90 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            Add Habit
          </button>
        </div>

        {/* Gamification Premium Header */}
        <GamificationHeader />

        {/* Stats Overview */}
        <StatsOverview />
        
        {/* Main Grid Widget */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight">{viewMode === "grid" ? "Consistency Grid" : "Today's Habits"}</h2>
            
            <div className="flex items-center gap-1 bg-muted p-1 rounded-xl w-fit">
              <button 
                onClick={() => setViewMode("grid")}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <LayoutGrid size={16} /> Grid View
              </button>
              <button 
                onClick={() => setViewMode("today")}
                className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", viewMode === "today" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                <Target size={16} /> Today Focus
              </button>
            </div>
          </div>
          
          {viewMode === "grid" ? (
            <div className="animate-in fade-in duration-300">
              <HabitGrid 
                selectedMonth={selectedMonth} 
                onAddHabitClick={() => setIsModalOpen(true)} 
                onEditHabitClick={(habit) => setEditingHabit(habit)}
              />
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <TodayView />
            </div>
          )}
        </section>
        
        {/* Analytics Widget */}
        <section className="mt-4">
          <AnalyticsChart selectedMonth={selectedMonth} />
        </section>
        
      </main>

      {/* Modals outside main flow */}
      <HabitModal 
        isOpen={isModalOpen || !!editingHabit} 
        initialData={editingHabit}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHabit(null);
        }} 
        onSave={async (data) => {
          if (editingHabit) {
            const res = await updateHabit(editingHabit.id, data);
            if (res?.success) toast("Habit updated successfully ✅", "success");
            else toast(res?.error?.message || "Failed to update habit", "error");
          } else {
            const res = await addHabit(data);
            if (res?.success) toast("Habit created successfully ✅", "success");
            else toast(res?.error?.message || "Failed to create habit", "error");
          }
          setIsModalOpen(false);
          setEditingHabit(null);
        }}
        onDelete={async () => {
          if (editingHabit) {
            const res = await deleteHabit(editingHabit.id);
            if (res?.success) toast("Habit deleted successfully ✅", "success");
            else toast(res?.error?.message || "Failed to delete habit", "error");
          }
          setIsModalOpen(false);
          setEditingHabit(null);
        }}
      />
    </div>
  );
}
