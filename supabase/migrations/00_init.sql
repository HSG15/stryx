-- 1. Create tables
CREATE TABLE users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE TABLE habits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  frequency_type TEXT NOT NULL, -- 'daily', 'custom'
  custom_days JSONB, -- array of integers [0, 1, 2]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE TABLE habit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date TEXT NOT NULL, -- Format: yyyy-MM-dd
  completed BOOLEAN NOT NULL DEFAULT false,
  mood INTEGER, -- 1, 2, 3
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(habit_id, date)
);

-- 2. Setup Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- 2A. Users table policies
CREATE POLICY "Users can view their own profile." ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile." ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON users FOR UPDATE
  USING (auth.uid() = id);

-- Allow public read access to users table for aggregated motivation stats (safe since we don't expose private info freely, but let's be strict just in case)
-- Actually, the prompt states: "Smart Social Motivation (anonymous, aggregated motivation)". 
-- We can create an RPC function for this later, so no need to expose the whole table via RLS right now.

-- 2B. Habits table policies
CREATE POLICY "Users can view their own habits." ON habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits." ON habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits." ON habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits." ON habits FOR DELETE
  USING (auth.uid() = user_id);

-- 2C. Habit Logs table policies
CREATE POLICY "Users can view their own habit logs." ON habit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit logs." ON habit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit logs." ON habit_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit logs." ON habit_logs FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Create aggregated function for Smart Social Motivation
CREATE OR REPLACE FUNCTION get_global_habit_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_logs BIGINT,
  active_today BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM habit_logs) as total_logs,
    (SELECT COUNT(DISTINCT user_id) FROM habit_logs WHERE date = to_char(CURRENT_DATE, 'YYYY-MM-DD')) as active_today;
END;
$$;
