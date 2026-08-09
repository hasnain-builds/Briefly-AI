-- Production-Grade Atomic Migration: Delete user account & all application data
-- This function executes atomically inside a single PL/pgSQL transaction block.
-- If any required table is missing or its DELETE fails, the entire transaction rolls back
-- and auth.users is NOT deleted.

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

  -- 2. Delete user-owned records from all 4 application tables (Atomic PL/pgSQL transaction)
  DELETE FROM public.summaries WHERE user_id = v_user_id;
  DELETE FROM public.user_consents WHERE user_id = v_user_id;
  DELETE FROM public.feedback WHERE user_id = v_user_id;
  DELETE FROM public.profiles WHERE id = v_user_id;

  -- 3. Delete user account from auth.users
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- Security Hardening: Revoke execute from PUBLIC and grant strictly to authenticated role
REVOKE EXECUTE ON FUNCTION delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;
