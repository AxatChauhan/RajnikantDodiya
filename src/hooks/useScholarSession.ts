import { useState, useEffect, useCallback } from 'react';
import { verifyDeviceSession } from '../lib/supabase';
import { computeSessionSeal } from '../lib/security';

export interface ScholarSession {
  name: string;
  mobile: string;
  orderId: string;
  unlockedItems: string[];
  deviceToken?: string;
  securitySeal?: string;
}

export const SCHOLAR_STORAGE_KEY = 'atheneum_scholar_session';
export const SCHOLAR_EVENT_NAME = 'atheneum-session-updated';

export const getStoredScholarSession = (): ScholarSession => {
  const empty: ScholarSession = {
    name: '',
    mobile: '',
    orderId: '',
    unlockedItems: [],
    deviceToken: ''
  };

  try {
    const saved = localStorage.getItem(SCHOLAR_STORAGE_KEY);
    if (!saved) return empty;

    const parsed = JSON.parse(saved);
    if (!parsed || !Array.isArray(parsed.unlockedItems)) return empty;

    // Cryptographic Anti-Tamper Check:
    // If session claims to hold unlocked items, verify its digital integrity seal
    if (parsed.unlockedItems.length > 0) {
      const expectedSeal = computeSessionSeal(
        parsed.mobile || '',
        parsed.orderId || '',
        parsed.unlockedItems,
        parsed.deviceToken || ''
      );

      // If seal is missing or does not match payload, tampering occurred!
      if (!parsed.securitySeal || parsed.securitySeal !== expectedSeal) {
        console.warn('Security Alert: Local session signature mismatch. Purging unverified state.');
        localStorage.removeItem(SCHOLAR_STORAGE_KEY);
        return empty;
      }
    }

    return parsed;
  } catch {
    return empty;
  }
};

export const persistScholarSession = (session: ScholarSession) => {
  try {
    const securitySeal = computeSessionSeal(
      session.mobile || '',
      session.orderId || '',
      session.unlockedItems || [],
      session.deviceToken || ''
    );

    const sealedSession: ScholarSession = {
      ...session,
      securitySeal
    };

    localStorage.setItem(SCHOLAR_STORAGE_KEY, JSON.stringify(sealedSession));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(SCHOLAR_EVENT_NAME));
    }
  } catch {
    // ignore
  }
};

export const clearStoredScholarSession = () => {
  const empty: ScholarSession = {
    name: '',
    mobile: '',
    orderId: '',
    unlockedItems: [],
    deviceToken: ''
  };
  persistScholarSession(empty);
};

export function useScholarSession() {
  const [session, setSession] = useState<ScholarSession>(getStoredScholarSession);
  const [sessionTransferred, setSessionTransferred] = useState<boolean>(false);

  // Check if current session is still valid on this device
  const checkDeviceAuth = useCallback(async () => {
    const current = getStoredScholarSession();
    if (!current.mobile || current.unlockedItems.length === 0 || !current.deviceToken) {
      return true;
    }

    try {
      const { isCurrentDevice } = await verifyDeviceSession(current.mobile, current.deviceToken);
      if (!isCurrentDevice) {
        clearStoredScholarSession();
        setSessionTransferred(true);
        return false;
      }
    } catch {
      // offline fallback
    }
    return true;
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setSession(getStoredScholarSession());
    };

    window.addEventListener(SCHOLAR_EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // 1. Cross-tab/window BroadcastChannel listener (instant local eviction)
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('atheneum_single_device_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'TRANSFER_SESSION') {
            const current = getStoredScholarSession();
            const cleanCurMobile = current.mobile.replace(/\D/g, '').slice(-10);
            const cleanNewMobile = String(event.data.mobile).replace(/\D/g, '').slice(-10);

            if (
              cleanCurMobile &&
              cleanCurMobile === cleanNewMobile &&
              event.data.deviceToken !== current.deviceToken
            ) {
              clearStoredScholarSession();
              setSessionTransferred(true);
            }
          }
        };
      }
    } catch {
      // ignore
    }

    // 2. Periodic cross-device verification heartbeat (every 25 seconds)
    const intervalId = setInterval(() => {
      checkDeviceAuth();
    }, 25000);

    // 3. Tab visibility/focus check
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkDeviceAuth();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      window.removeEventListener(SCHOLAR_EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      clearInterval(intervalId);
      if (channel) channel.close();
    };
  }, [checkDeviceAuth]);

  const isComplimentaryOwned = session.unlockedItems.includes('complimentary_book') || (Boolean(session.mobile) && session.unlockedItems.length > 0);
  const isBookOwned = session.unlockedItems.includes('book');
  const isExamOwned = session.unlockedItems.includes('exam');
  const isBundleOwned = isBookOwned && isExamOwned;

  return {
    session,
    isComplimentaryOwned,
    isBookOwned,
    isExamOwned,
    isBundleOwned,
    saveSession: persistScholarSession,
    clearSession: clearStoredScholarSession,
    sessionTransferred,
    setSessionTransferred,
    checkDeviceAuth
  };
}
