/**
 * NET Vidya Author Studio • Supabase Database Synchronization Engine
 * Connects the Author Studio ERP to all remote Supabase tables:
 * 1. public.netvidya_users
 * 2. public.netvidya_buyers
 * 3. public.netvidya_reading_files
 * 4. public.netvidya_tests
 * 5. public.netvidya_store_settings
 * 6. public.site_content
 * 7. public.device_sessions
 * 8. public.author_security
 */

import { supabase, parseActiveDeviceSlots } from './supabase';
import {
  ReadingFileItem,
  TestHallItem,
  EnrolledBuyerRecord,
  RegisteredUserRecord,
  StoreSettings
} from '../contexts/NetVidyaStoreContext';

export interface SupabaseDatabaseHealth {
  connected: boolean;
  url: string;
  latencyMs: number;
  lastChecked: string;
  tables: {
    usersCount: number;
    buyersCount: number;
    filesCount: number;
    testsCount: number;
    settingsRow: boolean;
    siteContentRows: number;
    deviceSessionsCount: number;
  };
  realtimeActive: boolean;
  error?: string;
}

/**
 * Helper to filter out dummy seed accounts
 */
export function isDummyRecord(email?: string, name?: string): boolean {
  if (!email && !name) return false;
  const e = (email || '').toLowerCase().trim();
  const n = (name || '').toLowerCase().trim();
  return (
    e.includes('example.com') ||
    e.includes('example.in') ||
    e.includes('priya.gset') ||
    e.includes('aarav.ugc') ||
    e.includes('test.student') ||
    e.includes('candidate.scholar') ||
    e.includes('razorpay.test') ||
    e.includes('razorpay.candidate') ||
    e.includes('razorpay@netvidya') ||
    n === 'test student' ||
    n === 'candidate scholar' ||
    n === 'priya sharma' ||
    n === 'aarav patel' ||
    n === 'razorpay verification officer' ||
    n === 'razorpay reviewer' ||
    n === 'razorpay test candidate'
  );
}

/**
 * 1. Fetch all registered users from Supabase `netvidya_users` and join device sessions
 */
export async function fetchSupabaseUsers(): Promise<RegisteredUserRecord[]> {
  try {
    const { data: users, error } = await supabase
      .from('netvidya_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !users) {
      console.warn('[SupabaseSync] fetchSupabaseUsers warning:', error?.message);
      return [];
    }

    // Fetch device sessions in parallel to associate phone/laptop slots
    const { data: devices } = await supabase
      .from('device_sessions')
      .select('*');

    const deviceMap = new Map<string, any>();
    if (devices) {
      for (const d of devices) {
        if (d.mobile) deviceMap.set(d.mobile.toLowerCase().trim(), d);
      }
    }

    const cleanUsers: RegisteredUserRecord[] = [];
    for (const u of users) {
      if (isDummyRecord(u.email, u.name)) continue;

      const userEmail = (u.email || '').toLowerCase().trim();
      const userMobile = (u.mobile || '').trim();
      const devRecord = deviceMap.get(userEmail) || (userMobile ? deviceMap.get(userMobile.replace(/\D/g, '').slice(-10)) : null);
      
      let deviceSlots = undefined;
      if (devRecord) {
        const slots = parseActiveDeviceSlots(devRecord.active_device_token, devRecord.device_info);
        deviceSlots = {
          hasPhone: Boolean(slots.phoneToken),
          hasLaptop: Boolean(slots.laptopToken),
          phoneInfo: slots.phoneToken ? 'Authorized Mobile' : undefined,
          laptopInfo: slots.laptopToken ? 'Authorized PC/Laptop' : undefined,
          lastActiveAt: devRecord.last_active_at
        };
      }

      cleanUsers.push({
        id: u.id || `usr_${userEmail}`,
        name: u.name || 'Scholar',
        email: userEmail,
        mobile: u.mobile || '',
        isBuyer: Boolean(u.is_buyer),
        isActive: u.is_active !== false,
        enrolledAt: u.enrolled_at || (u.is_buyer ? u.created_at : null),
        lastLoginAt: u.last_login_at || null,
        createdAt: u.created_at || new Date().toISOString(),
        enrolledPacks: Array.isArray(u.enrolled_packs) ? u.enrolled_packs : [],
        orderId: u.order_id || undefined,
        amountPaid: Number(u.amount_paid) || 0,
        emailVerified: Boolean(u.email_verified),
        emailVerifiedAt: u.email_verified_at || null,
        role: u.role || 'student',
        paymentMethod: u.payment_method || 'none',
        razorpayPaymentId: u.razorpay_payment_id || null,
        expiresAt: u.expires_at || null,
        deviceSlots
      });
    }

    return cleanUsers;
  } catch (err: any) {
    console.warn('[SupabaseSync] fetchSupabaseUsers failed:', err?.message);
    return [];
  }
}

/**
 * 2. Fetch all buyers from Supabase `netvidya_buyers`
 */
export async function fetchSupabaseBuyers(): Promise<EnrolledBuyerRecord[]> {
  try {
    const { data: buyers, error } = await supabase
      .from('netvidya_buyers')
      .select('*')
      .order('enrolled_at', { ascending: false });

    if (error || !buyers) {
      console.warn('[SupabaseSync] fetchSupabaseBuyers warning:', error?.message);
      return [];
    }

    const cleanBuyers: EnrolledBuyerRecord[] = [];
    for (const b of buyers) {
      if (isDummyRecord(b.email, b.student_name)) continue;

      cleanBuyers.push({
        id: b.id || `buyer_${b.order_id}`,
        name: b.student_name || 'Scholar',
        email: (b.email || '').toLowerCase().trim(),
        mobile: b.mobile || '',
        orderId: b.order_id || 'ORD_UNKNOWN',
        amountPaid: Number(b.amount_paid) || 0,
        paymentMethod: b.payment_method || 'razorpay',
        enrolledAt: b.enrolled_at || new Date().toISOString(),
        isActive: b.is_active !== false,
        packName: b.product_id || 'UGC NET English Complete Bundle'
      });
    }

    return cleanBuyers;
  } catch (err: any) {
    console.warn('[SupabaseSync] fetchSupabaseBuyers failed:', err?.message);
    return [];
  }
}

/**
 * 3. Fetch Reading Files from Supabase `netvidya_reading_files`
 */
export async function fetchSupabaseReadingFiles(): Promise<ReadingFileItem[]> {
  try {
    const { data, error } = await supabase
      .from('netvidya_reading_files')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(f => ({
      id: f.id,
      title: f.title,
      category: f.category,
      description: f.description || '',
      fileSizeMb: Number(f.file_size_mb) || 5.0,
      downloadCount: f.download_count || 0,
      dateAdded: f.created_at ? f.created_at.split('T')[0] : '2026-11-15',
      filePath: f.file_path,
      isActive: f.is_active !== false
    }));
  } catch {
    return [];
  }
}

/**
 * 4. Fetch Test Hall Modules from Supabase `netvidya_tests`
 */
export async function fetchSupabaseTests(): Promise<TestHallItem[]> {
  try {
    const { data, error } = await supabase
      .from('netvidya_tests')
      .select('*')
      .order('release_date', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(t => ({
      id: t.id,
      title: t.title,
      category: t.category,
      totalQuestions: t.total_questions || 100,
      durationMinutes: t.duration_minutes || 180,
      releaseDate: t.release_date || new Date().toISOString(),
      description: t.description || `Official CBT test suite with automated scoring.`,
      isLocked: !t.is_active,
      filePath: t.file_path,
      isActive: t.is_active !== false
    }));
  } catch {
    return [];
  }
}

/**
 * 5. Fetch Store Settings from Supabase `netvidya_store_settings`
 */
export async function fetchSupabaseStoreSettings(): Promise<Partial<StoreSettings> | null> {
  try {
    const { data, error } = await supabase
      .from('netvidya_store_settings')
      .select('*')
      .eq('id', 'current_pack')
      .maybeSingle();

    if (error || !data) return null;

    return {
      earlyBirdPrice: Number(data.early_bird_price),
      standardPrice: Number(data.standard_price),
      earlyBirdCutoffDate: data.early_bird_cutoff,
      accessExpiryDate: data.access_expiry_date,
      supportEmail: data.support_email,
      supportPhone: data.support_phone
    };
  } catch {
    return null;
  }
}

/**
 * 6. Save Store Settings to Supabase `netvidya_store_settings`
 */
export async function saveSupabaseStoreSettings(settings: StoreSettings): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('netvidya_store_settings')
      .upsert({
        id: 'current_pack',
        product_slug: 'final-pack-2026',
        product_name: 'GSET + UGC NET English Final Pack 2026',
        early_bird_price: settings.earlyBirdPrice,
        standard_price: settings.standardPrice,
        early_bird_cutoff: settings.earlyBirdCutoffDate,
        access_expiry_date: settings.accessExpiryDate,
        is_store_active: true,
        support_email: settings.supportEmail || 'netvidyaenglish@gmail.com',
        support_phone: settings.supportPhone || '+91 98251 23456',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('[SupabaseSync] saveSupabaseStoreSettings error:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('[SupabaseSync] saveSupabaseStoreSettings exception:', err?.message);
    return false;
  }
}

/**
 * 7. Save / Update User in Supabase `netvidya_users` and `netvidya_buyers`
 */
export async function saveUserToSupabase(user: {
  name: string;
  email: string;
  mobile: string;
  isBuyer?: boolean;
  isActive?: boolean;
  amountPaid?: number;
  orderId?: string;
  paymentMethod?: string;
  enrolledPacks?: string[];
}): Promise<boolean> {
  try {
    const cleanEmail = user.email.toLowerCase().trim();
    if (isDummyRecord(cleanEmail, user.name)) return true;

    const { error: userError } = await supabase
      .from('netvidya_users')
      .upsert({
        name: user.name,
        email: cleanEmail,
        mobile: user.mobile || '9999999999',
        is_buyer: Boolean(user.isBuyer),
        is_active: user.isActive !== false,
        amount_paid: user.amountPaid || 0,
        order_id: user.orderId || null,
        payment_method: user.paymentMethod || 'none',
        enrolled_packs: user.enrolledPacks || (user.isBuyer ? ['ugc-net-english-bundle'] : []),
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

    if (userError) {
      console.warn('[SupabaseSync] saveUserToSupabase userError:', userError.message);
    }

    if (user.isBuyer && user.orderId) {
      await supabase
        .from('netvidya_buyers')
        .upsert({
          student_name: user.name,
          email: cleanEmail,
          mobile: user.mobile || '9999999999',
          order_id: user.orderId,
          amount_paid: user.amountPaid || 499,
          product_id: user.enrolledPacks?.[0] || 'ugc-net-english-bundle',
          payment_method: user.paymentMethod || 'manual_admin',
          is_active: user.isActive !== false,
          enrolled_at: new Date().toISOString()
        }, { onConflict: 'email' });
    }

    return true;
  } catch (err: any) {
    console.warn('[SupabaseSync] saveUserToSupabase exception:', err?.message);
    return false;
  }
}

/**
 * 8. Toggle Access in Supabase
 */
export async function toggleSupabaseAccess(email: string, isActive: boolean): Promise<boolean> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    await supabase
      .from('netvidya_users')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('email', cleanEmail);

    await supabase
      .from('netvidya_buyers')
      .update({ is_active: isActive })
      .eq('email', cleanEmail);

    return true;
  } catch {
    return false;
  }
}

/**
 * 9. Save / Upsert Reading File to Supabase `netvidya_reading_files`
 */
export async function saveReadingFileToSupabase(file: ReadingFileItem): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('netvidya_reading_files')
      .upsert({
        id: file.id,
        title: file.title,
        category: file.category,
        description: file.description,
        file_path: file.filePath || `/study-vault/reading/${file.id}`,
        file_size_mb: file.fileSizeMb,
        download_count: file.downloadCount,
        is_active: file.isActive !== false,
        created_at: file.dateAdded || new Date().toISOString()
      }, { onConflict: 'id' });

    return !error;
  } catch {
    return false;
  }
}

/**
 * 10. Delete Reading File from Supabase
 */
export async function deleteReadingFileFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('netvidya_reading_files')
      .delete()
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * 11. Save / Upsert CBT Test to Supabase `netvidya_tests`
 */
export async function saveTestToSupabase(test: TestHallItem): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('netvidya_tests')
      .upsert({
        id: test.id,
        title: test.title,
        category: test.category,
        release_date: test.releaseDate,
        file_path: test.filePath || `/study-vault/tests/${test.id}.html`,
        duration_minutes: test.durationMinutes,
        total_questions: test.totalQuestions,
        is_active: test.isActive !== false,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });

    return !error;
  } catch {
    return false;
  }
}

/**
 * 12. Delete Test from Supabase
 */
export async function deleteTestFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('netvidya_tests')
      .delete()
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * 13. Revoke/Reset Candidate Device Session in Supabase
 */
export async function revokeDeviceSessionInSupabase(identifier: string): Promise<boolean> {
  try {
    const clean = identifier.trim().toLowerCase();
    const isEmail = clean.includes('@');
    const queryKey = isEmail ? clean : clean.replace(/\D/g, '').slice(-10);

    const { error } = await supabase
      .from('device_sessions')
      .delete()
      .eq('mobile', queryKey);

    return !error;
  } catch {
    return false;
  }
}

/**
 * 14. Check Full Database Health and Row Counts
 */
export async function checkSupabaseDatabaseHealth(): Promise<SupabaseDatabaseHealth> {
  const startTime = Date.now();
  const url = import.meta.env.VITE_SUPABASE_URL || 'https://ztqmrikjwmlawifjekdy.supabase.co';

  try {
    const [
      { count: usersCount, error: errUsers },
      { count: buyersCount, error: errBuyers },
      { count: filesCount, error: errFiles },
      { count: testsCount, error: errTests },
      { data: settingsData, error: errSettings },
      { count: siteContentRows, error: errContent },
      { count: deviceSessionsCount, error: errDevices }
    ] = await Promise.all([
      supabase.from('netvidya_users').select('*', { count: 'exact', head: true }),
      supabase.from('netvidya_buyers').select('*', { count: 'exact', head: true }),
      supabase.from('netvidya_reading_files').select('*', { count: 'exact', head: true }),
      supabase.from('netvidya_tests').select('*', { count: 'exact', head: true }),
      supabase.from('netvidya_store_settings').select('id').eq('id', 'current_pack').maybeSingle(),
      supabase.from('site_content').select('*', { count: 'exact', head: true }),
      supabase.from('device_sessions').select('*', { count: 'exact', head: true })
    ]);

    const latencyMs = Date.now() - startTime;
    const hasAnyError = errUsers || errBuyers || errFiles || errTests || errSettings || errContent || errDevices;

    return {
      connected: !hasAnyError,
      url,
      latencyMs,
      lastChecked: new Date().toISOString(),
      tables: {
        usersCount: usersCount || 0,
        buyersCount: buyersCount || 0,
        filesCount: filesCount || 0,
        testsCount: testsCount || 0,
        settingsRow: Boolean(settingsData),
        siteContentRows: siteContentRows || 0,
        deviceSessionsCount: deviceSessionsCount || 0
      },
      realtimeActive: true,
      error: hasAnyError?.message
    };
  } catch (err: any) {
    return {
      connected: false,
      url,
      latencyMs: Date.now() - startTime,
      lastChecked: new Date().toISOString(),
      tables: {
        usersCount: 0,
        buyersCount: 0,
        filesCount: 0,
        testsCount: 0,
        settingsRow: false,
        siteContentRows: 0,
        deviceSessionsCount: 0
      },
      realtimeActive: false,
      error: err?.message || 'Database unreachable'
    };
  }
}
