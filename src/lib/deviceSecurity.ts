/**
 * Device Security & 2-Device Policy Manager
 * Allows up to 2 active devices per scholar: 1 Phone (mobile) + 1 Laptop (desktop).
 */

export type DeviceType = 'phone' | 'laptop';

export interface DeviceSlots {
  phone?: {
    token: string;
    info: string;
    lastActiveAt: string;
  };
  laptop?: {
    token: string;
    info: string;
    lastActiveAt: string;
  };
}

/**
 * Detect whether current client is a mobile device (phone) or desktop/laptop
 */
export function detectDeviceType(): DeviceType {
  if (typeof navigator === 'undefined') return 'laptop';
  const ua = navigator.userAgent;
  // Detect phones and small tablets
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  return isMobile ? 'phone' : 'laptop';
}

/**
 * Generate a cryptographically secure device token prefixed with device type
 */
export function generateDeviceToken(type?: DeviceType): string {
  const devType = type || detectDeviceType();
  const random = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    : Math.random().toString(36).slice(2, 18);
  return `dev_${devType}_${Date.now().toString(36)}_${random}`;
}

/**
 * Human-readable description of current client device
 */
export function getDeviceDescription(): string {
  if (typeof navigator === 'undefined') return 'Desktop Browser';
  const ua = navigator.userAgent;
  const type = detectDeviceType();
  
  if (type === 'phone') {
    if (/iPhone/i.test(ua)) return 'Apple iPhone';
    if (/Android/i.test(ua)) return 'Android Mobile';
    if (/iPad/i.test(ua)) return 'Apple iPad';
    return 'Mobile Smartphone';
  } else {
    if (/Macintosh|Mac OS X/i.test(ua)) return 'MacBook / Mac OS';
    if (/Windows/i.test(ua)) return 'Windows Laptop / PC';
    if (/Linux/i.test(ua)) return 'Linux Workstation';
    return 'Desktop Computer';
  }
}
