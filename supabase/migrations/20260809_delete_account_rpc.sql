-- Safe & Production-Grade Migration: RPC function to allow authenticated users to delete their own account & data
-- Handles optional/unmigrated tables using dynamic SQL so account deletion never fails due to missing optional tables.

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Retrieve authenticated user ID strictly from Supabase session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User is not authenticated';
  END IF;

  -- 2. Delete user-owned records from public.summaries if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'summaries'
  ) THEN
    EXECUTE 'DELETE FROM public.summaries WHERE user_id = $1' USING v_user_id;
  END IF;

  -- 3. Delete user-owned records from public.user_consents if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_consents'
  ) THEN
    EXECUTE 'DELETE FROM public.user_consents WHERE user_id = $1' USING v_user_id;
  END IF;

  -- 4. Delete user-owned records from public.feedback if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'feedback'
  ) THEN
    EXECUTE 'DELETE FROM public.feedback WHERE user_id = $1' USING v_user_id;
  END IF;

  -- 5. Delete user-owned records from public.profiles if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    EXECUTE 'DELETE FROM public.profiles WHERE id = $1' USING v_user_id;
  END IF;

  -- 6. Delete user account from auth.users
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- Security Hardening: Revoke execute permissions from PUBLIC & anon, grant strictly to authenticated role
REVOKE EXECUTE ON FUNCTION delete_user_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION delete_user_account() FROM anon;
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
