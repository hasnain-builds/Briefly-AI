-- Safe & Idempotent Migration: Add Independent Feature Quota Columns to Profiles Table

-- 1. Add columns to public.profiles if they do not exist
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS text_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pdf_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS url_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS text_limit INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS pdf_limit INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS url_limit INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS usage_reset_at TIMESTAMPTZ DEFAULT (now() + interval '1 month');

-- 2. Populate fallback values for existing records
UPDATE public.profiles 
SET 
  text_usage = COALESCE(text_usage, monthly_usage, 0),
  pdf_usage = COALESCE(pdf_usage, 0),
  url_usage = COALESCE(url_usage, 0),
  text_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(text_limit, 10) END,
  pdf_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(pdf_limit, 2) END,
  url_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(url_limit, 2) END,
  usage_reset_at = COALESCE(usage_reset_at, now() + interval '1 month')
WHERE text_usage IS NULL OR pdf_usage IS NULL OR url_usage IS NULL OR usage_reset_at IS NULL;

-- 3. Ensure Row Level Security (RLS) is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
