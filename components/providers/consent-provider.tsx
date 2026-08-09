"use client";

import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CURRENT_CONSENT_VERSION,
  fetchUserConsentFromSupabase,
  upsertUserConsentToSupabase,
  getGuestConsentFromLocalStorage,
  saveGuestConsentToLocalStorage,
  syncGuestConsentToSupabase,
} from "@/services/consent";
import { CookieConsentPopup } from "@/components/shared/cookie-consent-popup";
import { AccessRestrictedScreen } from "@/components/shared/access-restricted-screen";

interface ConsentContextType {
  hasAcceptedConsent: boolean;
  isDeclined: boolean;
  isLoadingConsent: boolean;
  acceptConsent: () => Promise<void>;
  declineConsent: () => void;
}

const ConsentContext = createContext<ConsentContextType>({
  hasAcceptedConsent: false,
  isDeclined: false,
  isLoadingConsent: true,
  acceptConsent: async () => {},
  declineConsent: () => {},
});

export const useConsent = () => useContext(ConsentContext);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState<boolean>(false);
  const [isDeclined, setIsDeclined] = useState<boolean>(false);
  const [isLoadingConsent, setIsLoadingConsent] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Load consent state on mount and monitor auth state changes
  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;
    let lastCheckedUserId: string | null | undefined = undefined;

    const checkConsentState = async (user: any) => {
      const currentId = user?.id || null;

      // Skip duplicate processing if already checked for this user ID
      if (lastCheckedUserId === currentId && currentId !== null) {
        return;
      }
      lastCheckedUserId = currentId;

      if (!isMounted) return;
      setIsLoadingConsent(true);

      if (user && user.id) {
        setUserId(user.id);
        // Attempt to sync guest consent if available in localStorage
        await syncGuestConsentToSupabase(user.id);

        // Fetch authoritative consent record from Supabase
        const remoteConsent = await fetchUserConsentFromSupabase(user.id);

        if (!isMounted) return;

        if (
          remoteConsent &&
          remoteConsent.terms_accepted &&
          remoteConsent.consent_version === CURRENT_CONSENT_VERSION
        ) {
          setHasAcceptedConsent(true);
          setIsDeclined(false);
        } else {
          // If remote consent missing or outdated, check local fallback
          const localConsent = getGuestConsentFromLocalStorage();
          if (
            localConsent &&
            localConsent.terms_accepted &&
            localConsent.consent_version === CURRENT_CONSENT_VERSION
          ) {
            await upsertUserConsentToSupabase(user.id);
            setHasAcceptedConsent(true);
            setIsDeclined(false);
          } else {
            setHasAcceptedConsent(false);
          }
        }
      } else {
        setUserId(null);
        // Guest mode - strictly check localStorage without remote calls
        const localConsent = getGuestConsentFromLocalStorage();
        if (
          localConsent &&
          localConsent.terms_accepted &&
          localConsent.consent_version === CURRENT_CONSENT_VERSION
        ) {
          setHasAcceptedConsent(true);
          setIsDeclined(false);
        } else {
          setHasAcceptedConsent(false);
        }
      }

      if (isMounted) {
        setIsLoadingConsent(false);
      }
    };

    // Auth state change listener handles both initial session and real-time login/logout sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkConsentState(session?.user || null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const acceptConsent = async () => {
    saveGuestConsentToLocalStorage(true, true, CURRENT_CONSENT_VERSION);
    setHasAcceptedConsent(true);
    setIsDeclined(false);

    if (userId) {
      startTransition(async () => {
        await upsertUserConsentToSupabase(userId, true, true, CURRENT_CONSENT_VERSION);
      });
    }
  };

  const declineConsent = () => {
    setIsDeclined(true);
    setHasAcceptedConsent(false);
  };

  return (
    <ConsentContext.Provider
      value={{
        hasAcceptedConsent,
        isDeclined,
        isLoadingConsent,
        acceptConsent,
        declineConsent,
      }}
    >
      {/* 1. Full-screen access restriction if user declines terms */}
      {isDeclined ? (
        <AccessRestrictedScreen onAccept={acceptConsent} />
      ) : (
        <>
          {children}

          {/* 2. Show bottom-left consent popup if consent has not been accepted */}
          {!isLoadingConsent && !hasAcceptedConsent && (
            <CookieConsentPopup onAccept={acceptConsent} onDecline={declineConsent} />
          )}
        </>
      )}
    </ConsentContext.Provider>
  );
}
