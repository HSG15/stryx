"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export function useSocialMotivation() {
  const [message, setMessage] = useState("Join thousands of others tracking today!");
  
  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      try {
        const { data, error } = await supabase.rpc('get_global_habit_stats');
        if (!error && data && data.length > 0) {
          const stats = data[0];
          if (stats.active_today > 10) {
             setMessage(`${stats.active_today} high performers are crushing their habits today!`);
          } else if (stats.total_logs > 50) {
             setMessage(`Over ${stats.total_logs} habits completed worldwide. You're in good company.`);
          } else if (stats.total_users > 1) {
             setMessage(`${stats.total_users} users have committed to their goals. Let's go!`);
          }
        }
      } catch (e) {
          // graceful fallback
      }
    }
    fetchStats();
  }, []);

  return message;
}
