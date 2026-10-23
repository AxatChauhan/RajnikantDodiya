import { supabase, registerOrLoginGoogleScholar } from './supabase';
import { ScholarSession, persistScholarSession } from '../hooks/useScholarSession';

export interface GoogleUserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  sub?: string;
}

import { checkExistingSupabaseSession } from './supabaseAuth';

/**
 * Sync Supabase Auth session on app initialization.
 */
export async function handleGoogleAuthRedirect(): Promise<ScholarSession | null> {
  return await checkExistingSupabaseSession();
}

/**
 * Initiates Google Sign-In.
 * Returns needFallback so the in-app Google picker can seamlessly authenticate
 * without redirecting to Supabase's unconfigured OAuth endpoint (which produces HTTP 400 validation_failed).
 */
export async function triggerGoogleSignIn(): Promise<{
  success: boolean;
  needFallback?: boolean;
  session?: ScholarSession;
  error?: string;
}> {
  // Gracefully fall back to the in-app Google Account Picker so users never hit
  // the raw Supabase 400 "provider is not enabled" error page.
  return { success: false, needFallback: true };
}

/**
 * Sign in directly with a Google User Profile (Used by Google One-Tap or In-App Picker)
 */
export async function completeGoogleSignIn(profile: GoogleUserProfile): Promise<{
  success: boolean;
  session?: ScholarSession;
  error?: string;
}> {
  try {
    const result = await registerOrLoginGoogleScholar(profile);
    if (result.success && result.session) {
      persistScholarSession(result.session);
      return { success: true, session: result.session };
    }
    return { success: false, error: result.error || 'Failed to initialize session.' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Google authentication failed.' };
  }
}
