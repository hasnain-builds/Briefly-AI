-- Migration: Automatic Profile Creation & Backfill for auth.users
-- Location: supabase/migrations/20260810_sync_auth_users_to_profiles.sql

-- 1. Create SECURITY DEFINER trigger function to insert public.profiles row on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    created_at,
    updated_at,
    plan,
    monthly_usage,
    monthly_limit,
    text_usage,
    pdf_usage,
    url_usage,
    export_pdf_usage,
    export_md_usage,
    export_txt_usage,
    ask_ai_usage,
    share_usage,
    text_limit,
    pdf_limit,
    url_limit,
    export_pdf_limit,
    export_md_limit,
    export_txt_limit,
    ask_ai_limit,
    share_limit,
    usage_reset_at,
    feedback_completed,
    feedback_remind_after
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'User'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      NULL
    ),
    COALESCE(NEW.created_at, now()),
    now(),
    'free',
    0,
    10,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    10,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    now() + interval '1 month',
    false,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Drop trigger if it exists, then create AFTER INSERT trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Idempotent Backfill: Create public.profiles rows for any existing users in auth.users missing a profile
INSERT INTO public.profiles (
  id,
  full_name,
  avatar_url,
  created_at,
  updated_at,
  plan,
  monthly_usage,
  monthly_limit,
  text_usage,
  pdf_usage,
  url_usage,
  export_pdf_usage,
  export_md_usage,
  export_txt_usage,
  ask_ai_usage,
  share_usage,
  text_limit,
  pdf_limit,
  url_limit,
  export_pdf_limit,
  export_md_limit,
  export_txt_limit,
  ask_ai_limit,
  share_limit,
  usage_reset_at,
  feedback_completed,
  feedback_remind_after
)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1),
    'User'
  ) AS full_name,
  COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture',
    NULL
  ) AS avatar_url,
  COALESCE(u.created_at, now()) AS created_at,
  now() AS updated_at,
  'free' AS plan,
  0 AS monthly_usage,
  10 AS monthly_limit,
  0 AS text_usage,
  0 AS pdf_usage,
  0 AS url_usage,
  0 AS export_pdf_usage,
  0 AS export_md_usage,
  0 AS export_txt_usage,
  0 AS ask_ai_usage,
  0 AS share_usage,
  10 AS text_limit,
  2 AS pdf_limit,
  2 AS url_limit,
  2 AS export_pdf_limit,
  2 AS export_md_limit,
  2 AS export_txt_limit,
  2 AS ask_ai_limit,
  2 AS share_limit,
  now() + interval '1 month' AS usage_reset_at,
  false AS feedback_completed,
  0 AS feedback_remind_after
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
