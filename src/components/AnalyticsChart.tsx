"use client";

import { useHabits } from "@/hooks/useHabits";
import { getDaysForMonth, formatDateKey } from "@/lib/date-utils";
import { format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props {
  selectedMonth: Date;
}

export function AnalyticsChart({ selectedMonth }: Props) {
  const { habits } = useHabits();
  const days = getDaysForMonth(selectedMonth.getFullYear(), selectedMonth.getMonth());

  // Data processing
  const data = days.map((day) => {
    const ds = formatDateKey(day);
    let completed = 0;
    const total = habits.length;

    if (total > 0) {
      habits.forEach(h => {
        if (h.logs[ds]) completed++;
      });
    }

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      date: format(day, "MMM d"),
      percentage,
      fullDate: ds
    };
  });

  if (habits.length === 0) {
    return (
      <div className="h-full w-full min-h-[300px] flex items-center justify-center text-muted-foreground border border-dashed rounded-2xl bg-card">
        Add habits to see your completion trends natively graphed over time.
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full p-6 bg-card border rounded-2xl shadow-sm flex flex-col">
      <h3 className="text-xl tracking-tight font-bold mb-6">Completion Trend</h3>
      <div className="flex-1 w-full relative min-h-0">
        <div className="absolute inset-0 w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--foreground)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--foreground)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} 
                minTickGap={30}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ borderRadius: "12px", border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--foreground)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                itemStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                formatter={(value: any) => [`${value}%`, "Completed"]}
                labelStyle={{ color: "var(--muted-foreground)", marginBottom: "4px" }}
              />
              <Area 
                type="monotone" 
                dataKey="percentage" 
                stroke="var(--foreground)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPercentage)" 
                activeDot={{ r: 6, fill: "var(--background)", stroke: "var(--foreground)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
