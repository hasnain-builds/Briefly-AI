import { createClient } from "@/lib/supabase/client";
import { UserConsent } from "@/types";

export const CURRENT_CONSENT_VERSION = "1.0";
const LOCAL_CONSENT_KEY = "briefly_user_consent_v1";

/**
 * Fetch consent record from Supabase for authenticated user
 */
export async function fetchUserConsentFromSupabase(userId: string): Promise<UserConsent | null> {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("user_consents")
      .select("id, user_id, consent_version, terms_accepted, privacy_accepted, accepted_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      // 42P01 table does not exist yet
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.warn("⚠️ DATABASE MIGRATION REQUIRED: Missing user_consents table. Please run 20260806_user_consents.sql in Supabase.");
      } else {
        console.error("Error fetching user consent:", error);
      }
      return null;
    }

    return data as UserConsent | null;
  } catch (err) {
    console.warn("Failed to fetch user consent from Supabase:", err);
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
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.warn("⚠️ DATABASE MIGRATION REQUIRED: user_consents table does not exist.");
      } else {
        console.error("Error upserting user consent:", error);
      }
      return false;
    }

    return true;
  } catch (err) {
    console.warn("Failed to upsert user consent to Supabase:", err);
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
