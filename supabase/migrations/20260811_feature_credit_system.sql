-- Safe & Idempotent Migration: Add All 8 Feature Usage & Quota Columns to Profiles Table

-- 1. Safely add columns to public.profiles if they do not exist
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  ADD COLUMN IF NOT EXISTS monthly_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_limit INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS text_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pdf_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS url_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS export_pdf_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS export_md_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS export_txt_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ask_ai_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_usage INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS text_limit INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS pdf_limit INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS url_limit INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS export_pdf_limit INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS export_md_limit INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS export_txt_limit INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS ask_ai_limit INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS share_limit INTEGER DEFAULT 2,
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
  export_pdf_usage = COALESCE(export_pdf_usage, 0),
  export_md_usage = COALESCE(export_md_usage, 0),
  export_txt_usage = COALESCE(export_txt_usage, 0),
  ask_ai_usage = COALESCE(ask_ai_usage, 0),
  share_usage = COALESCE(share_usage, 0),
  text_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(text_limit, 10) END,
  pdf_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(pdf_limit, 2) END,
  url_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(url_limit, 2) END,
  export_pdf_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(export_pdf_limit, 2) END,
  export_md_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(export_md_limit, 2) END,
  export_txt_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(export_txt_limit, 2) END,
  ask_ai_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(ask_ai_limit, 2) END,
  share_limit = CASE WHEN plan = 'pro' THEN -1 ELSE COALESCE(share_limit, 2) END,
  usage_reset_at = COALESCE(usage_reset_at, created_at + interval '1 month', now() + interval '1 month')
WHERE 
  export_pdf_usage IS NULL OR 
  export_md_usage IS NULL OR 
  export_txt_usage IS NULL OR 
  ask_ai_usage IS NULL OR 
  share_usage IS NULL OR 
  usage_reset_at IS NULL;

-- 3. Ensure Row Level Security (RLS) is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
