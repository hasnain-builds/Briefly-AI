-- Safe & Idempotent Migration: Add All Missing Quota & Usage Columns to Profiles Table

-- 1. Safely add columns to public.profiles if they do not exist
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS monthly_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_limit INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS text_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pdf_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS url_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS text_limit INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS pdf_limit INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS url_limit INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS usage_reset_at TIMESTAMPTZ DEFAULT (now() + interval '1 month');

-- 2. Populate fallback values for existing user profiles
UPDATE public.profiles 
SET 
  plan = COALESCE(plan, 'free'),
  monthly_usage = COALESCE(monthly_usage, 0),
  monthly_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(monthly_limit, 10) END,
  text_usage = COALESCE(text_usage, monthly_usage, 0),
  pdf_usage = COALESCE(pdf_usage, 0),
  url_usage = COALESCE(url_usage, 0),
  text_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(text_limit, 10) END,
  pdf_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(pdf_limit, 2) END,
  url_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(url_limit, 2) END,
  usage_reset_at = COALESCE(usage_reset_at, created_at + interval '1 month', now() + interval '1 month')
WHERE usage_reset_at IS NULL OR text_usage IS NULL OR pdf_usage IS NULL OR url_usage IS NULL;

-- 3. Ensure Row Level Security (RLS) is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Idempotent RLS Policies
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
