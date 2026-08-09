import { createClient } from "@/lib/supabase/client";
import { UserConsent } from "@/types";

export const CURRENT_CONSENT_VERSION = "1.0";
const LOCAL_CONSENT_KEY = "briefly_user_consent_v1";

/**
 * Helper to safely format Supabase/Postgrest error objects for diagnostic logging
 */
function formatSupabaseDiagnosticError(error: Record<string, unknown> | null | undefined) {
  if (!error) return "Unknown error";
  return {
    message: String(error.message || error),
    code: String(error.code || "UNKNOWN_CODE"),
    details: error.details || null,
    hint: error.hint || null,
  };
}

/**
 * Helper to check if a Postgrest error is due to a missing table
 */
function isMissingTableError(error: Record<string, unknown> | null | undefined): boolean {
  if (!error) return false;
  const code = String(error.code || "");
  const message = String(error.message || "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST204" ||
    code === "PGRST301" ||
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("user_consents")
  );
}

/**
 * Fetch consent record from Supabase for authenticated user
 */
export async function fetchUserConsentFromSupabase(userId: string): Promise<UserConsent | null> {
  if (!userId) return null;
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("user_consents")
      .select("id, user_id, consent_version, terms_accepted, privacy_accepted, accepted_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error as unknown as Record<string, unknown>)) {
        console.warn("⚠️ DATABASE MIGRATION REQUIRED: Missing user_consents table. Please run 20260806_user_consents.sql in Supabase SQL Editor.");
      } else if (error.code !== "PGRST116") {
        console.error("Error fetching user consent from Supabase:", formatSupabaseDiagnosticError(error as unknown as Record<string, unknown>));
      }
      return null;
    }

    return data as UserConsent | null;
  } catch (err: unknown) {
    if (isMissingTableError(err as Record<string, unknown>)) {
      console.warn("⚠️ DATABASE MIGRATION REQUIRED: Missing user_consents table. Please run 20260806_user_consents.sql in Supabase SQL Editor.");
    } else {
      console.warn("Failed to fetch user consent from Supabase:", (err as Error)?.message || err);
    }
    return null;
  }
}

/**
 * Upsert consent record to Supabase for authenticated user
 */
export async function upsertUserConsentToSupabase(
  userId: string,
  termsAccepted: boolean = true,
  privacyAccepted: boolean = true,
  version: string = CURRENT_CONSENT_VERSION
): Promise<boolean> {
  if (!userId) return false;
  const supabase = createClient();
  try {
    const { error } = await supabase
      .from("user_consents")
      .upsert(
        {
          user_id: userId,
          consent_version: version,
          terms_accepted: termsAccepted,
          privacy_accepted: privacyAccepted,
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      if (isMissingTableError(error as unknown as Record<string, unknown>)) {
        console.warn("⚠️ DATABASE MIGRATION REQUIRED: user_consents table does not exist in Supabase. Run 20260806_user_consents.sql.");
      } else {
        console.error("Error upserting user consent to Supabase:", formatSupabaseDiagnosticError(error as unknown as Record<string, unknown>));
      }
      return false;
    }

    return true;
  } catch (err: unknown) {
    if (isMissingTableError(err as Record<string, unknown>)) {
      console.warn("⚠️ DATABASE MIGRATION REQUIRED: user_consents table does not exist in Supabase.");
    } else {
      console.warn("Failed to upsert user consent to Supabase:", (err as Error)?.message || err);
    }
    return false;
  }
}

/**
 * Helper to manage guest consent in localStorage
 */
export function getGuestConsentFromLocalStorage(): UserConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserConsent;
  } catch {
    return null;
  }
}

export function saveGuestConsentToLocalStorage(
  termsAccepted: boolean = true,
  privacyAccepted: boolean = true,
  version: string = CURRENT_CONSENT_VERSION
) {
  if (typeof window === "undefined") return;
  try {
    const data: UserConsent = {
      consent_version: version,
      terms_accepted: termsAccepted,
      privacy_accepted: privacyAccepted,
      accepted_at: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_CONSENT_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn("Could not save guest consent to localStorage:", err);
  }
}

/**
 * Auto sync guest consent from localStorage to Supabase upon user login
 */
export async function syncGuestConsentToSupabase(userId: string): Promise<boolean> {
  if (!userId) return false;
  const localConsent = getGuestConsentFromLocalStorage();
  if (localConsent && localConsent.terms_accepted && localConsent.consent_version === CURRENT_CONSENT_VERSION) {
    const success = await upsertUserConsentToSupabase(
      userId,
      localConsent.terms_accepted,
      localConsent.privacy_accepted,
      localConsent.consent_version
    );
    return success;
  }
  return false;
}

