import { createClient } from '@supabase/supabase-js';
import {
  detectDeviceType,
  generateDeviceToken,
  getDeviceDescription,
  DeviceType
} from './deviceSecurity';
import { ScholarSession } from '../hooks/useScholarSession';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ztqmrikjwmlawifjekdy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0cW1yaWtqd21sYXdpZmpla2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMjE1NTAsImV4cCI6MjEwNzg5NzU1MH0.dbIYeS3XdiWDQBfBBE0ePeQ_ZN1IxdO8A7nlKMDnPfs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface StudentLicense {
  id?: string;
  mobile: string;
  student_name: string;
  product_type: 'book' | 'exam' | 'complimentary_book';
  order_id: string;
  is_active: boolean;
  granted_at?: string;
}

export interface OrderRecord {
  order_id: string;
  mobile: string;
  student_name: string;
  product_type: 'book' | 'exam' | 'bundle';
  amount: number;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  status: 'completed' | 'pending_verification';
}

/**
 * Parse dual device tokens (Phone + Laptop) from device_sessions row.
 */
export function parseActiveDeviceSlots(
  activeDeviceToken?: string | null,
  deviceInfo?: string | null
): { phoneToken?: string; laptopToken?: string } {
  let phoneToken: string | undefined = undefined;
  let laptopToken: string | undefined = undefined;

  // 1. Try parsing JSON in device_info first
  if (deviceInfo) {
    try {
      const parsed = JSON.parse(deviceInfo);
      if (parsed && typeof parsed === 'object') {
        if (parsed.phone?.token) phoneToken = parsed.phone.token;
        if (parsed.laptop?.token) laptopToken = parsed.laptop.token;
      }
    } catch {
      // not JSON
    }
  }

  // 2. Parse from active_device_token string (format: "dev_phone_...|dev_laptop_...")
  if (activeDeviceToken) {
    const parts = activeDeviceToken.split('|');
    for (const p of parts) {
      if (p.includes('dev_phone_')) {
        phoneToken = p;
      } else if (p.includes('dev_laptop_')) {
        laptopToken = p;
      } else if (!phoneToken && !laptopToken) {
        // legacy single device token
        laptopToken = p;
      }
    }
  }

  return { phoneToken, laptopToken };
}

/**
 * Compute the updated active_device_token string and device_info JSON
 * preserving the OTHER device slot intact (allowing 1 phone + 1 laptop).
 */
export function buildUpdatedDeviceSlots(
  currentType: DeviceType,
  newToken: string,
  existingActiveToken?: string | null,
  existingDeviceInfo?: string | null
): { updatedActiveToken: string; updatedDeviceInfo: string } {
  const existing = parseActiveDeviceSlots(existingActiveToken, existingDeviceInfo);

  const phoneToken = currentType === 'phone' ? newToken : existing.phoneToken;
  const laptopToken = currentType === 'laptop' ? newToken : existing.laptopToken;

  const tokenList: string[] = [];
  if (phoneToken) tokenList.push(phoneToken);
  if (laptopToken) tokenList.push(laptopToken);
  const updatedActiveToken = tokenList.join('|') || newToken;

  const updatedDeviceInfo = JSON.stringify({
    phone: phoneToken ? {
      token: phoneToken,
      info: currentType === 'phone' ? getDeviceDescription() : (existing.phoneToken ? 'Authorized Phone' : 'Phone Slot'),
      lastActive: new Date().toISOString()
    } : null,
    laptop: laptopToken ? {
      token: laptopToken,
      info: currentType === 'laptop' ? getDeviceDescription() : (existing.laptopToken ? 'Authorized Laptop' : 'Laptop Slot'),
      lastActive: new Date().toISOString()
    } : null,
    lastUpdatedType: currentType
  });

  return { updatedActiveToken, updatedDeviceInfo };
}

/**
 * Broadcast session transfer event to cross-tab / window listeners
 */
function broadcastSessionTransfer(identifier: string, deviceType: DeviceType, deviceToken: string) {
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('atheneum_single_device_sync');
      channel.postMessage({
        type: 'TRANSFER_SESSION',
        identifier,
        mobile: identifier,
        deviceType,
        deviceToken
      });
      channel.close();
    }
  } catch {
    // ignore
  }
}

/**
 * Fetch all active licenses for a student by their mobile or email identifier.
 */
export async function fetchLicensesFromSupabase(identifier: string): Promise<StudentLicense[]> {
  try {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return [];

    const isEmail = clean.includes('@');
    const cleanMobile = clean.replace(/\D/g, '').slice(-10);

    // Attempt secure RPC first if mobile
    if (!isEmail && cleanMobile.length === 10) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('restore_scholar_licenses', {
          p_mobile: cleanMobile
        });

        if (!rpcError && rpcData && rpcData.found) {
          const studentName = rpcData.student_name || 'Scholar';
          const orderId = rpcData.order_id || 'HMP-VERIFIED';
          const unlocked: ('book' | 'exam')[] = rpcData.unlocked_items || [];

          return unlocked.map(type => ({
            mobile: cleanMobile,
            student_name: studentName,
            order_id: orderId,
            product_type: type,
            is_active: true
          }));
        }
      } catch {
        // Fallback to scoped query
      }
    }

    // Scoped query fallback
    let query = supabase.from('student_licenses').select('mobile, student_name, product_type, order_id, is_active').eq('is_active', true);
    if (isEmail) {
      query = query.eq('mobile', clean);
    } else {
      query = query.eq('mobile', cleanMobile);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase fetch notice:', error.message);
      return [];
    }

    return (data as StudentLicense[]) || [];
  } catch (err) {
    console.warn('Unable to query Supabase directly:', err);
    return [];
  }
}

/**
 * Record an order and grant licenses in Supabase.
 * Enforces the 2-device policy (1 Phone + 1 Laptop).
 */
export async function saveOrderAndLicenses(
  order: OrderRecord,
  licensedProducts: ('book' | 'exam')[]
): Promise<{ success: boolean; deviceToken?: string; error?: string }> {
  try {
    const cleanMobile = order.mobile.trim().replace(/\D/g, '').slice(-10);
    if (!cleanMobile || cleanMobile.length !== 10) {
      return { success: false, error: 'Invalid 10-digit mobile number.' };
    }

    const currentDeviceType = detectDeviceType();
    const deviceToken = generateDeviceToken(currentDeviceType);

    // Fetch existing device session for this user to preserve the other device slot
    const { data: existingSession } = await supabase
      .from('device_sessions')
      .select('active_device_token, device_info')
      .eq('mobile', cleanMobile)
      .maybeSingle();

    const { updatedActiveToken, updatedDeviceInfo } = buildUpdatedDeviceSlots(
      currentDeviceType,
      deviceToken,
      existingSession?.active_device_token,
      existingSession?.device_info
    );

    // Direct insertion into orders
    await supabase.from('orders').insert({
      order_id: order.order_id,
      mobile: cleanMobile,
      student_name: order.student_name,
      product_type: order.product_type,
      amount: order.amount,
      razorpay_payment_id: order.razorpay_payment_id || null,
      razorpay_order_id: order.razorpay_order_id || null,
      status: order.status
    });

    // Only grant active licenses if order is completed
    if (order.status === 'completed') {
      for (const prod of licensedProducts) {
        await supabase.from('student_licenses').upsert(
          {
            mobile: cleanMobile,
            student_name: order.student_name,
            product_type: prod,
            order_id: order.order_id,
            is_active: true
          },
          { onConflict: 'mobile,product_type' }
        );
      }
    }

    // Register active device session under 2-device policy
    await supabase.from('device_sessions').upsert(
      {
        mobile: cleanMobile,
        active_device_token: updatedActiveToken,
        device_info: updatedDeviceInfo,
        last_active_at: new Date().toISOString()
      },
      { onConflict: 'mobile' }
    );

    broadcastSessionTransfer(cleanMobile, currentDeviceType, deviceToken);

    return { success: true, deviceToken };
  } catch (err: any) {
    console.error('Error saving order to Supabase:', err);
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Register or Log In a Google Scholar (1-Click Google Sign-In, No Firebase).
 * Automatically unlocks the complimentary monograph and checks for any paid holdings.
 * Enforces the 2-device policy (1 Phone + 1 Laptop).
 */
export async function registerOrLoginGoogleScholar(googleUser: {
  name: string;
  email: string;
  avatarUrl?: string;
}): Promise<{
  success: boolean;
  session?: ScholarSession;
  error?: string;
}> {
  try {
    const email = googleUser.email.trim().toLowerCase();
    const name = googleUser.name.trim() || 'Scholar';
    if (!email || !email.includes('@')) {
      return { success: false, error: 'A valid Google email address is required.' };
    }

    const currentDeviceType = detectDeviceType();
    const deviceToken = generateDeviceToken(currentDeviceType);

    // 1. Check for any existing licenses linked to this email
    const existingLicenses = await fetchLicensesFromSupabase(email);
    let unlockedItems: string[] = ['complimentary_book', 'book'];
    let orderId = `GOOGLE-SCHOLAR-${Date.now().toString().slice(-6)}`;

    if (existingLicenses && existingLicenses.length > 0) {
      const extraItems = existingLicenses.map(l => l.product_type);
      unlockedItems = Array.from(new Set([...unlockedItems, ...extraItems]));
      orderId = existingLicenses[0].order_id || orderId;
    }

    // 2. Query existing device session in Supabase to preserve the other device slot
    try {
      const { data: existingSession } = await supabase
        .from('device_sessions')
        .select('active_device_token, device_info')
        .eq('mobile', email)
        .maybeSingle();

      const { updatedActiveToken, updatedDeviceInfo } = buildUpdatedDeviceSlots(
        currentDeviceType,
        deviceToken,
        existingSession?.active_device_token,
        existingSession?.device_info
      );

      // Register or update orders
      await supabase.from('orders').upsert({
        order_id: orderId,
        mobile: email,
        student_name: name,
        product_type: 'book',
        amount: 0,
        status: 'completed'
      }, { onConflict: 'order_id' });

      // Grant complimentary license
      await supabase.from('student_licenses').upsert({
        mobile: email,
        student_name: name,
        product_type: 'book',
        order_id: orderId,
        is_active: true
      }, { onConflict: 'mobile,product_type' });

      // Save 2-device session
      await supabase.from('device_sessions').upsert({
        mobile: email,
        active_device_token: updatedActiveToken,
        device_info: updatedDeviceInfo,
        last_active_at: new Date().toISOString()
      }, { onConflict: 'mobile' });
    } catch (dbErr) {
      console.warn('Supabase Google registration notice (graceful offline fallback):', dbErr);
    }

    broadcastSessionTransfer(email, currentDeviceType, deviceToken);

    const session: ScholarSession = {
      name,
      email,
      mobile: email,
      orderId,
      unlockedItems,
      deviceToken,
      deviceType: currentDeviceType,
      avatarUrl: googleUser.avatarUrl,
      authProvider: 'google'
    };

    return {
      success: true,
      session
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Google registration failed.' };
  }
}

/**
 * Register a scholar for complimentary book access.
 * Enforces 2-device policy (1 Phone + 1 Laptop).
 */
export async function registerComplimentaryScholar(
  name: string,
  mobile: string
): Promise<{
  success: boolean;
  orderId?: string;
  deviceToken?: string;
  unlockedItems?: string[];
  error?: string;
}> {
  try {
    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10);
    const cleanName = name.trim().slice(0, 50) || 'Scholar';
    if (!cleanMobile || cleanMobile.length !== 10) {
      return { success: false, error: 'Invalid 10-digit mobile number.' };
    }

    const orderId = `FREE-COMP-${Date.now().toString().slice(-6)}`;
    const currentDeviceType = detectDeviceType();
    const deviceToken = generateDeviceToken(currentDeviceType);
    const unlockedItems = ['complimentary_book', 'book'];

    try {
      const { data: existingSession } = await supabase
        .from('device_sessions')
        .select('active_device_token, device_info')
        .eq('mobile', cleanMobile)
        .maybeSingle();

      const { updatedActiveToken, updatedDeviceInfo } = buildUpdatedDeviceSlots(
        currentDeviceType,
        deviceToken,
        existingSession?.active_device_token,
        existingSession?.device_info
      );

      await supabase.from('orders').upsert({
        order_id: orderId,
        mobile: cleanMobile,
        student_name: cleanName,
        product_type: 'book',
        amount: 0,
        status: 'completed'
      }, { onConflict: 'order_id' });

      await supabase.from('student_licenses').upsert({
        mobile: cleanMobile,
        student_name: cleanName,
        product_type: 'book',
        order_id: orderId,
        is_active: true
      }, { onConflict: 'mobile,product_type' });

      await supabase.from('device_sessions').upsert({
        mobile: cleanMobile,
        active_device_token: updatedActiveToken,
        device_info: updatedDeviceInfo,
        last_active_at: new Date().toISOString()
      }, { onConflict: 'mobile' });
    } catch (dbErr) {
      console.warn('Supabase complimentary registration warning:', dbErr);
    }

    broadcastSessionTransfer(cleanMobile, currentDeviceType, deviceToken);

    return {
      success: true,
      orderId,
      deviceToken,
      unlockedItems
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Registration failed.' };
  }
}

/**
 * Sign in a scholar and transfer the device slot to the current device.
 * Enforces 2-device policy (1 Phone + 1 Laptop).
 */
export async function loginAndTransferDevice(identifier: string): Promise<{
  success: boolean;
  name?: string;
  orderId?: string;
  unlockedItems?: string[];
  deviceToken?: string;
  deviceType?: DeviceType;
  error?: string;
}> {
  try {
    const clean = identifier.trim().toLowerCase();
    if (!clean) {
      return { success: false, error: 'Please enter a valid phone number or email.' };
    }

    const isEmail = clean.includes('@');
    const cleanMobile = clean.replace(/\D/g, '').slice(-10);
    const queryKey = isEmail ? clean : cleanMobile;

    if (!isEmail && cleanMobile.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    // 1. Fetch licenses
    const licenses = await fetchLicensesFromSupabase(queryKey);

    let unlockedItems: string[] = [];
    let studentName = 'Scholar';
    let orderId = `HMP-${Date.now().toString().slice(-6)}`;

    if (licenses && licenses.length > 0) {
      unlockedItems = licenses.map(l => l.product_type);
      studentName = licenses[0].student_name;
      orderId = licenses[0].order_id;
    } else {
      // Fallback: Check local storage records
      try {
        const saved = localStorage.getItem('atheneum_scholar_session');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.mobile === queryKey || parsed.email === queryKey)) {
            unlockedItems = parsed.unlockedItems || [];
            studentName = parsed.name || 'Scholar';
            orderId = parsed.orderId || 'HMP-LOCAL-01';
          }
        }
      } catch {
        // ignore
      }

      if (unlockedItems.length === 0) {
        // Automatically provide complimentary book access if user signed in
        unlockedItems = ['complimentary_book', 'book'];
      }
    }

    const currentDeviceType = detectDeviceType();
    const deviceToken = generateDeviceToken(currentDeviceType);

    // Update Supabase device_sessions under 2-device policy
    try {
      const { data: existingSession } = await supabase
        .from('device_sessions')
        .select('active_device_token, device_info')
        .eq('mobile', queryKey)
        .maybeSingle();

      const { updatedActiveToken, updatedDeviceInfo } = buildUpdatedDeviceSlots(
        currentDeviceType,
        deviceToken,
        existingSession?.active_device_token,
        existingSession?.device_info
      );

      await supabase.from('device_sessions').upsert(
        {
          mobile: queryKey,
          active_device_token: updatedActiveToken,
          device_info: updatedDeviceInfo,
          last_active_at: new Date().toISOString()
        },
        { onConflict: 'mobile' }
      );
    } catch (dbErr) {
      console.warn('Supabase device session update warning:', dbErr);
    }

    broadcastSessionTransfer(queryKey, currentDeviceType, deviceToken);

    return {
      success: true,
      name: studentName,
      orderId,
      unlockedItems,
      deviceToken,
      deviceType: currentDeviceType
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Login failed.' };
  }
}

/**
 * Check if the current device token is still authorized under the 2-device policy.
 */
export async function verifyDeviceSession(
  identifier: string,
  currentDeviceToken?: string,
  deviceType?: DeviceType
): Promise<{ isCurrentDevice: boolean; activeDeviceToken?: string }> {
  try {
    const clean = identifier.trim().toLowerCase();
    if (!clean || !currentDeviceToken) {
      return { isCurrentDevice: true };
    }

    const isEmail = clean.includes('@');
    const queryKey = isEmail ? clean : clean.replace(/\D/g, '').slice(-10);
    const currentType = deviceType || (currentDeviceToken.includes('dev_phone_') ? 'phone' : 'laptop');

    const { data, error } = await supabase
      .from('device_sessions')
      .select('active_device_token, device_info')
      .eq('mobile', queryKey)
      .maybeSingle();

    if (error || !data) {
      return { isCurrentDevice: true };
    }

    const { phoneToken, laptopToken } = parseActiveDeviceSlots(
      data.active_device_token,
      data.device_info
    );

    // Check specific device slot
    if (currentType === 'phone') {
      if (phoneToken && phoneToken !== currentDeviceToken) {
        return { isCurrentDevice: false, activeDeviceToken: phoneToken };
      }
      return { isCurrentDevice: true };
    } else {
      if (laptopToken && laptopToken !== currentDeviceToken) {
        return { isCurrentDevice: false, activeDeviceToken: laptopToken };
      }
      return { isCurrentDevice: true };
    }
  } catch {
    return { isCurrentDevice: true };
  }
}
