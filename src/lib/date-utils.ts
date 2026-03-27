import { format, isFuture, isPast, isSameMonth, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDaysInMonth, parseISO } from "date-fns";

export const DATE_FORMAT = "yyyy-MM-dd";

// Format a Date object to our standard string key
export function formatDateKey(date: Date): string {
  return format(date, DATE_FORMAT);
}

// Get all days in a given month (by year and month index 0-11)
export function getDaysForMonth(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end });
}

// Check if a date string is in the future relative to today
export function isDateInFuture(dateString: string): boolean {
  // Be careful with timezone boundaries; keep it to start of day
  const dateObj = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj.getTime() > today.getTime();
}

// Check if it's today
export function isDateToday(dateString: string): boolean {
  return dateString === formatDateKey(new Date());
}
