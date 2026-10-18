import { createClient } from '@supabase/supabase-js';
import { generateSecureDeviceToken } from './security';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ztqmrikjwmlawifjekdy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0cW1yaWtqd21sYXdpZmpla2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzMjE1NTAsImV4cCI6MjEwNzg5NzU1MH0.dbIYeS3XdiWDQBfBBE0ePeQ_ZN1IxdO8A7nlKMDnPfs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface StudentLicense {
  id?: string;
  mobile: string;
  student_name: string;
  product_type: 'book' | 'exam';
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
 * Fetch all active licenses for a student by their mobile number.
 * Uses secure RPC first to prevent full table exposure, with scoped fallback.
 */
export async function fetchLicensesFromSupabase(mobile: string): Promise<StudentLicense[]> {
  try {
    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10);
    if (!cleanMobile || cleanMobile.length !== 10) return [];

    // Attempt secure RPC first (Prevents anonymous table dumps)
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

    // Scoped query fallback strictly filtered by exact 10-digit mobile number
    const { data, error } = await supabase
      .from('student_licenses')
      .select('mobile, student_name, product_type, order_id, is_active')
      .eq('mobile', cleanMobile)
      .eq('is_active', true);

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
 * Uses secure RPC first for atomic transaction and server-side verification.
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

    const deviceToken = generateSecureDeviceToken();

    // 1. Try secure atomic RPC first
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('record_verified_purchase', {
        p_order_id: order.order_id,
        p_mobile: cleanMobile,
        p_student_name: order.student_name,
        p_product_type: order.product_type,
        p_amount: order.amount,
        p_payment_id: order.razorpay_payment_id || 'pay_manual',
        p_licensed_items: licensedProducts,
        p_device_token: deviceToken,
        p_status: order.status
      });

      if (!rpcError && rpcResult && rpcResult.success) {
        return { success: true, deviceToken };
      }
    } catch {
      // Fall back to direct insertion if RPC isn't deployed yet
    }

    // 2. Direct insertion fallback
    const { error: orderError } = await supabase.from('orders').insert({
      order_id: order.order_id,
      mobile: cleanMobile,
      student_name: order.student_name,
      product_type: order.product_type,
      amount: order.amount,
      razorpay_payment_id: order.razorpay_payment_id || null,
      razorpay_order_id: order.razorpay_order_id || null,
      status: order.status
    });

    if (orderError) {
      console.warn('Supabase order insert note:', orderError.message);
    }

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

    // Register active device session
    await supabase.from('device_sessions').upsert(
      {
        mobile: cleanMobile,
        active_device_token: deviceToken,
        device_info: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 150) : 'Web Client',
        last_active_at: new Date().toISOString()
      },
      { onConflict: 'mobile' }
    );

    // Broadcast across local browser contexts for instant multi-tab sync
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('atheneum_single_device_sync');
        channel.postMessage({ type: 'TRANSFER_SESSION', mobile: cleanMobile, deviceToken });
        channel.close();
      }
    } catch {
      // ignore
    }

    return { success: true, deviceToken };
  } catch (err: any) {
    console.error('Error saving order to Supabase:', err);
    return { success: false, error: err?.message || 'Database error' };
  }
}

/**
 * Register a scholar for complimentary book access after SMS OTP verification.
 * Enforces single-device license and persistent recovery across devices.
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
    const deviceToken = generateSecureDeviceToken();
    const unlockedItems = ['complimentary_book', 'book'];

    // 1. Record in Supabase orders (complimentary status)
    try {
      await supabase.from('orders').upsert({
        order_id: orderId,
        mobile: cleanMobile,
        student_name: cleanName,
        product_type: 'book',
        amount: 0,
        status: 'completed'
      }, { onConflict: 'order_id' });

      // Grant active complimentary license in student_licenses
      await supabase.from('student_licenses').upsert({
        mobile: cleanMobile,
        student_name: cleanName,
        product_type: 'book',
        order_id: orderId,
        is_active: true
      }, { onConflict: 'mobile,product_type' });

      // Register active 1-device session
      await supabase.from('device_sessions').upsert({
        mobile: cleanMobile,
        active_device_token: deviceToken,
        device_info: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 150) : 'Web Client',
        last_active_at: new Date().toISOString()
      }, { onConflict: 'mobile' });
    } catch (dbErr) {
      console.warn('Supabase complimentary registration warning (graceful offline fallback):', dbErr);
    }

    // Broadcast across local browser contexts
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('atheneum_single_device_sync');
        channel.postMessage({ type: 'TRANSFER_SESSION', mobile: cleanMobile, deviceToken });
        channel.close();
      }
    } catch {
      // ignore
    }

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
 * Sign in a scholar and transfer the 1-device active license to the current device.
 * Enforces single active device across all platforms.
 */
export async function loginAndTransferDevice(mobile: string): Promise<{
  success: boolean;
  name?: string;
  orderId?: string;
  unlockedItems?: string[];
  deviceToken?: string;
  error?: string;
}> {
  try {
    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10);
    if (!cleanMobile || cleanMobile.length !== 10) {
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    // 1. Fetch licenses
    const licenses = await fetchLicensesFromSupabase(cleanMobile);

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
          if (parsed && parsed.mobile && parsed.mobile.includes(cleanMobile)) {
            unlockedItems = parsed.unlockedItems || [];
            studentName = parsed.name || 'Scholar';
            orderId = parsed.orderId || 'HMP-LOCAL-01';
          }
        }
      } catch {
        // ignore
      }

      if (unlockedItems.length === 0) {
        return {
          success: false,
          error: `No active holdings found for mobile +91 ${cleanMobile}. Please verify your number or purchase a pass at the desk.`
        };
      }
    }

    // 2. Generate cryptographically secure device token
    const deviceToken = generateSecureDeviceToken();

    // 3. Update Supabase device_sessions table (evicts any previous device)
    try {
      await supabase.from('device_sessions').upsert(
        {
          mobile: cleanMobile,
          active_device_token: deviceToken,
          device_info: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 150) : 'Web Client',
          last_active_at: new Date().toISOString()
        },
        { onConflict: 'mobile' }
      );
    } catch (dbErr) {
      console.warn('Supabase device session update warning:', dbErr);
    }

    // 4. Broadcast across local browser contexts (logs out other tabs/browsers on same machine)
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel('atheneum_single_device_sync');
        channel.postMessage({ type: 'TRANSFER_SESSION', mobile: cleanMobile, deviceToken });
        channel.close();
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      name: studentName,
      orderId,
      unlockedItems,
      deviceToken
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Login failed.' };
  }
}

/**
 * Check if the current device token is still the active authorized session.
 */
export async function verifyDeviceSession(
  mobile: string,
  currentDeviceToken?: string
): Promise<{ isCurrentDevice: boolean; activeDeviceToken?: string }> {
  try {
    const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10);
    if (!cleanMobile || !currentDeviceToken) {
      return { isCurrentDevice: true };
    }

    // Try RPC first
    try {
      const { data: rpcResult } = await supabase.rpc('verify_device_token', {
        p_mobile: cleanMobile,
        p_device_token: currentDeviceToken
      });
      if (rpcResult && typeof rpcResult.is_current_device === 'boolean') {
        return { isCurrentDevice: rpcResult.is_current_device };
      }
    } catch {
      // Fallback to direct query
    }

    const { data, error } = await supabase
      .from('device_sessions')
      .select('active_device_token')
      .eq('mobile', cleanMobile)
      .maybeSingle();

    if (error || !data) {
      return { isCurrentDevice: true };
    }

    if (data.active_device_token && data.active_device_token !== currentDeviceToken) {
      return { isCurrentDevice: false, activeDeviceToken: data.active_device_token };
    }

    return { isCurrentDevice: true };
  } catch {
    return { isCurrentDevice: true };
  }
}
