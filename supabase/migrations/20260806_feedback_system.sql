-- Safe & Idempotent Migration: User Feedback System & Profile Extensions

-- 1. Create public.feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  app_version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns to public.profiles if they do not exist
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS feedback_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS feedback_remind_after INTEGER DEFAULT 0;

-- 3. Create index on user_id for fast feedback queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);

-- 4. Enable Row Level Security (RLS) on public.feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for feedback table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'feedback' AND policyname = 'Users can view own feedback'
  ) THEN
    CREATE POLICY "Users can view own feedback" 
      ON public.feedback FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'feedback' AND policyname = 'Users can insert own feedback'
  ) THEN
    CREATE POLICY "Users can insert own feedback" 
      ON public.feedback FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
