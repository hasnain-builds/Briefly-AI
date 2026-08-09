-- Safe & Production-Grade Idempotent Migration: User Feedback System & Profile Extensions

-- 1. Create public.feedback table if it does not exist
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  app_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add columns to public.profiles if they do not exist
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS feedback_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS feedback_remind_after INTEGER DEFAULT 0;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);

-- 4. Enable Row Level Security (RLS) on public.feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for public.feedback (Idempotent policy management)
DROP POLICY IF EXISTS "Users can view own feedback" ON public.feedback;
CREATE POLICY "Users can view own feedback" 
  ON public.feedback 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own feedback" ON public.feedback;
CREATE POLICY "Users can insert own feedback" 
  ON public.feedback 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- 6. Table Grants for authenticated and service_role
GRANT SELECT, INSERT ON TABLE public.feedback TO authenticated;
GRANT ALL ON TABLE public.feedback TO service_role;
