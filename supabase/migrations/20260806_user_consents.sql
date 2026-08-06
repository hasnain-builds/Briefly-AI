-- Safe & Idempotent Migration: User Consents Table for Cookie, Terms & Privacy Acceptance

-- 1. Create public.user_consents table
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  terms_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  privacy_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_consents_user_id_key UNIQUE (user_id)
);

-- 2. Create index on user_id for high-performance lookups
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_consents' AND policyname = 'Users can view own consent'
  ) THEN
    CREATE POLICY "Users can view own consent" 
      ON public.user_consents FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_consents' AND policyname = 'Users can insert or update own consent'
  ) THEN
    CREATE POLICY "Users can insert or update own consent" 
      ON public.user_consents FOR ALL 
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
