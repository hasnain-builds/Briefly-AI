-- Safe & Idempotent Migration: Add Monthly Usage and Plan Quota Columns to Profiles Table

-- 1. Add columns to public.profiles if they do not exist
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS monthly_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_limit INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS usage_reset_at TIMESTAMPTZ DEFAULT (now() + interval '1 month');

-- 2. Populate fallback values for any existing NULL records
UPDATE public.profiles 
SET 
  plan = COALESCE(plan, 'free'),
  monthly_usage = COALESCE(monthly_usage, 0),
  monthly_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(monthly_limit, 10) END,
  usage_reset_at = COALESCE(usage_reset_at, now() + interval '1 month')
WHERE monthly_usage IS NULL OR usage_reset_at IS NULL OR monthly_limit IS NULL;

-- 3. Ensure Row Level Security (RLS) is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create safe RLS policies if they don't already exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" 
      ON public.profiles FOR SELECT 
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" 
      ON public.profiles FOR UPDATE 
      USING (auth.uid() = id);
  END IF;
END $$;
