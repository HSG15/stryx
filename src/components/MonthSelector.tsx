"use client";
import { format, addMonths, subMonths, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  selectedDate: Date;
  onChange: (d: Date) => void;
}

export function MonthSelector({ selectedDate, onChange }: Props) {
  const today = new Date();
  const canGoForward = !isSameMonth(selectedDate, today) && selectedDate.getTime() < today.getTime();

  const prevMonth = () => onChange(subMonths(selectedDate, 1));
  const nextMonth = () => {
    if (canGoForward) onChange(addMonths(selectedDate, 1));
  };
  const goToToday = () => onChange(today);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center bg-card border rounded-lg shadow-sm">
        <button onClick={prevMonth} className="px-3 py-2 hover:bg-muted transition-colors border-r">
          <ChevronLeft size={18} />
        </button>
        <div className="px-4 py-2 font-medium min-w-[140px] text-center">
          {format(selectedDate, "MMMM yyyy")}
        </div>
        <button 
          onClick={nextMonth} 
          disabled={!canGoForward}
          className="px-3 py-2 hover:bg-muted transition-colors disabled:opacity-30 disabled:hover:bg-transparent border-l"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      
      {!isSameMonth(selectedDate, today) && (
        <button onClick={goToToday} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Today
        </button>
      )}
    </div>
  );
}
