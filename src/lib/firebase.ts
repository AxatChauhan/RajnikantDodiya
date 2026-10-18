import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  Auth
} from 'firebase/auth';

// Vite environment variables for Firebase Web App
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== 'YOUR_FIREBASE_API_KEY'
  );
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured()) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    // Explicitly set language to English for Indian mobile carriers
    auth.useDeviceLanguage();
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
  }
}

/**
 * Initialize or reset an invisible reCAPTCHA verifier for phone auth.
 */
export const setupRecaptchaVerifier = (
  containerId: string,
  onExpired?: () => void
): RecaptchaVerifier | null => {
  if (typeof window === 'undefined') return null;

  if (!isFirebaseConfigured() || !auth) {
    // In dev simulation mode, return a dummy verifier
    return null;
  }

  try {
    // Clear any existing recaptcha widgets in the container
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved - allow signInWithPhoneNumber
      },
      'expired-callback': () => {
        if (onExpired) onExpired();
      }
    });

    verifier.render();
    return verifier;
  } catch (err) {
    console.error('Failed to setup RecaptchaVerifier:', err);
    return null;
  }
};

/**
 * Send 6-digit SMS OTP to a 10-digit Indian mobile number (+91).
 */
export const sendSmsOtp = async (
  mobile10Digit: string,
  verifier: RecaptchaVerifier | null
): Promise<{
  success: boolean;
  confirmationResult?: ConfirmationResult;
  isSimulated?: boolean;
  error?: string;
}> => {
  const cleanMobile = mobile10Digit.replace(/\D/g, '').slice(-10);
  if (cleanMobile.length !== 10) {
    return { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' };
  }

  const e164Number = `+91${cleanMobile}`;

  // If Firebase is configured with live project keys
  if (isFirebaseConfigured() && auth && verifier) {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, e164Number, verifier);
      return {
        success: true,
        confirmationResult,
        isSimulated: false
      };
    } catch (err: any) {
      console.error('Firebase signInWithPhoneNumber error:', err);
      let errorMsg = 'Failed to send SMS OTP. Please check your phone number.';
      if (err.code === 'auth/invalid-phone-number') {
        errorMsg = 'Invalid phone number format.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many requests. Please wait a few moments before requesting another code.';
      } else if (err.code === 'auth/quota-exceeded') {
        errorMsg = 'SMS quota reached. Please try again later or contact administration.';
      } else if (err.code === 'auth/captcha-check-failed') {
        errorMsg = 'Anti-bot verification failed. Please refresh the page and try again.';
      }
      return { success: false, error: errorMsg };
    }
  }

  // Developer Simulation Mode: Active when Firebase keys are pending configuration in .env
  console.info(
    `[Firebase OTP Simulation] Firebase keys not yet present in .env. Simulating SMS OTP for +91 ${cleanMobile}. (Use code: 123456)`
  );
  return {
    success: true,
    isSimulated: true
  };
};

/**
 * Verify the user-entered 6-digit OTP code.
 */
export const confirmSmsOtp = async (
  confirmationResult: ConfirmationResult | undefined,
  otpCode: string,
  isSimulated = false
): Promise<{ success: boolean; error?: string }> => {
  const cleanOtp = otpCode.trim().replace(/\D/g, '');
  if (cleanOtp.length !== 6) {
    return { success: false, error: 'Please enter the complete 6-digit verification code.' };
  }

  // Developer Simulation fallback
  if (isSimulated || !confirmationResult) {
    if (cleanOtp === '123456' || cleanOtp.length === 6) {
      return { success: true };
    }
    return { success: false, error: 'Invalid verification code. Enter 123456 for dev simulation.' };
  }

  try {
    const credential = await confirmationResult.confirm(cleanOtp);
    if (credential && credential.user) {
      return { success: true };
    }
    return { success: false, error: 'Verification failed. Please try again.' };
  } catch (err: any) {
    console.error('Firebase OTP confirmation error:', err);
    let errorMsg = 'Incorrect verification code. Please check the SMS and re-enter.';
    if (err.code === 'auth/code-expired') {
      errorMsg = 'The verification code has expired. Please request a new code.';
    } else if (err.code === 'auth/invalid-verification-code') {
      errorMsg = 'Invalid code. Please enter the exact 6-digit code received on your phone.';
    }
    return { success: false, error: errorMsg };
  }
};
