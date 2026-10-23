import { useState, useEffect, useCallback } from 'react';
import { verifyDeviceSession } from '../lib/supabase';
import { computeSessionSeal } from '../lib/security';
import { detectDeviceType, DeviceType } from '../lib/deviceSecurity';

export interface ScholarSession {
  name: string;
  email?: string;
  mobile: string;
  orderId: string;
  unlockedItems: string[];
  deviceToken?: string;
  deviceType?: DeviceType;
  avatarUrl?: string;
  authProvider?: 'google' | 'supabase_otp' | 'author_pin' | 'mobile';
  role?: 'author' | 'scholar';
  securitySeal?: string;
}

export const SCHOLAR_STORAGE_KEY = 'atheneum_scholar_session';
export const SCHOLAR_EVENT_NAME = 'atheneum-session-updated';

export const getStoredScholarSession = (): ScholarSession => {
  const currentDeviceType = detectDeviceType();
  const empty: ScholarSession = {
    name: '',
    email: '',
    mobile: '',
    orderId: '',
    unlockedItems: [],
    deviceToken: '',
    deviceType: currentDeviceType
  };

  try {
    const saved = localStorage.getItem(SCHOLAR_STORAGE_KEY);
    if (!saved) return empty;

    const parsed = JSON.parse(saved);
    if (!parsed || !Array.isArray(parsed.unlockedItems)) return empty;

    // Cryptographic Anti-Tamper Check:
    if (parsed.unlockedItems.length > 0) {
      const sealIdentifier = parsed.email || parsed.mobile || '';
      const expectedSeal = computeSessionSeal(
        sealIdentifier,
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

    return {
      ...parsed,
      deviceType: parsed.deviceType || currentDeviceType
    };
  } catch {
    return empty;
  }
};

export const persistScholarSession = (session: ScholarSession) => {
  try {
    const sealIdentifier = session.email || session.mobile || '';
    const securitySeal = computeSessionSeal(
      sealIdentifier,
      session.orderId || '',
      session.unlockedItems || [],
      session.deviceToken || ''
    );

    const sealedSession: ScholarSession = {
      ...session,
      deviceType: session.deviceType || detectDeviceType(),
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
    email: '',
    mobile: '',
    orderId: '',
    unlockedItems: [],
    deviceToken: '',
    deviceType: detectDeviceType()
  };
  persistScholarSession(empty);
};

export function useScholarSession() {
  const [session, setSession] = useState<ScholarSession>(getStoredScholarSession);
  const [sessionTransferred, setSessionTransferred] = useState<boolean>(false);

  // Check if current session is still valid under 2-device policy (1 Phone + 1 Laptop)
  const checkDeviceAuth = useCallback(async () => {
    const current = getStoredScholarSession();
    const identifier = current.email || current.mobile;
    if (!identifier || current.unlockedItems.length === 0 || !current.deviceToken) {
      return true;
    }

    try {
      const { isCurrentDevice } = await verifyDeviceSession(
        identifier,
        current.deviceToken,
        current.deviceType
      );

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

    // 1. Cross-tab/window BroadcastChannel listener (2-Device Policy sync)
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel('atheneum_single_device_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'TRANSFER_SESSION') {
            const current = getStoredScholarSession();
            const curIdentifier = (current.email || current.mobile || '').toLowerCase().trim();
            const newIdentifier = String(event.data.identifier || event.data.mobile || '').toLowerCase().trim();

            // 2-Device Policy Check:
            // Only evict if:
            // 1) Identifiers match
            // 2) The transferred device has the SAME device type (phone kicks out phone, laptop kicks out laptop)
            // 3) Token is different
            if (
              curIdentifier &&
              (curIdentifier === newIdentifier || (current.mobile && current.mobile === event.data.mobile)) &&
              event.data.deviceToken !== current.deviceToken
            ) {
              const curType = current.deviceType || detectDeviceType();
              const incomingType = event.data.deviceType;

              // If incoming device is the same category (e.g. laptop replacing laptop), transfer!
              // If incoming device is the complementary category (e.g. phone while on laptop), KEEP BOTH ACTIVE!
              if (!incomingType || incomingType === curType) {
                clearStoredScholarSession();
                setSessionTransferred(true);
              }
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

  const isComplimentaryOwned = session.unlockedItems.includes('complimentary_book') || (Boolean(session.mobile || session.email) && session.unlockedItems.length > 0);
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
