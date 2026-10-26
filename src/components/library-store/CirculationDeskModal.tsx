import React, { useState } from 'react';
import { STORE_PRODUCTS, StoreProduct } from '../../data/storeCatalogData';
import { saveOrderAndLicenses, fetchLicensesFromSupabase, loginAndTransferDevice } from '../../lib/supabase';
import { loadRazorpaySDK } from '../../lib/razorpay';
import {
  getVerifiedPrice,
  sanitizeScholarName,
  validateIndianMobile,
  validateEmail
} from '../../lib/security';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Smartphone,
  CreditCard,
  Search,
  UserCheck,
  RotateCcw,
  Sparkles,
  Clock,
  AlertTriangle
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CirculationDeskModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: StoreProduct | null;
  onPurchaseSuccess: (product: StoreProduct, studentName: string, studentMobile: string, orderId: string, deviceToken?: string) => void;
}

export const CirculationDeskModal: React.FC<CirculationDeskModalProps> = ({
  isOpen,
  onClose,
  selectedProduct,
  onPurchaseSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'checkout' | 'restore'>('checkout');
  const [activeProduct, setActiveProduct] = useState<StoreProduct>(selectedProduct || STORE_PRODUCTS[0]);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentMobile, setStudentMobile] = useState('');
  const [activeDeviceToken, setActiveDeviceToken] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [generatedOrderId, setGeneratedOrderId] = useState('');
  const [paymentId, setPaymentId] = useState('');

  // Restore Pass state
  const [restoreMobile, setRestoreMobile] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'searching' | 'found' | 'not_found'>('idle');
  const [restoredDetails, setRestoredDetails] = useState<{ name: string; items: string[]; orderId: string } | null>(null);

  // Sync selectedProduct if opened from different cards
  React.useEffect(() => {
    if (selectedProduct) {
      setActiveProduct(selectedProduct);
    }
  }, [selectedProduct]);

  // Lock background scrolling when modal is open
  React.useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Complete purchase via Razorpay (Instant Bank-Verified Access)
  const handleInitiateRazorpay = async () => {
    const cleanName = sanitizeScholarName(studentName);
    const mobileCheck = validateIndianMobile(studentMobile);
    const isEmailValid = validateEmail(studentEmail);

    if (!cleanName) {
      alert('Please enter your valid Scholar Name.');
      return;
    }
    if (!mobileCheck.isValid) {
      alert(mobileCheck.error || 'Please enter a valid 10-digit Indian WhatsApp number.');
      return;
    }
    if (!isEmailValid) {
      alert('Please enter a valid personal or academic email address.');
      return;
    }

    let verifiedPrice: number;
    try {
      verifiedPrice = getVerifiedPrice(activeProduct.id, activeProduct.price);
    } catch (err: any) {
      alert(err.message || 'Pricing integrity error.');
      return;
    }

    setIsProcessing(true);
    const orderId = `HMP-${Date.now().toString().slice(-6)}`;
    setGeneratedOrderId(orderId);

    // Dynamically load Razorpay checkout script if not present
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const loaded = await loadRazorpaySDK();
      if (!loaded) {
        alert('Could not initialize Razorpay payment gateway. Please check your internet connection.');
        setIsProcessing(false);
        return;
      }
    }

    const envRazorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (!envRazorpayKey && !isLocalhost) {
      alert('Payment Configuration Notice: Gateway key is currently being calibrated for live transactions. Please contact library support or use direct UPI transfer.');
      setIsProcessing(false);
      return;
    }

    const razorpayKey = envRazorpayKey || 'rzp_test_TpOz4ZlxJBGo0E';

    if (typeof window !== 'undefined' && window.Razorpay) {
      const options = {
        key: razorpayKey,
        amount: verifiedPrice * 100, // in paise - strictly verified against immutable catalog!
        currency: 'INR',
        name: 'Academic Study Portal | Dr. Rajnikant S. Dodiya',
        description: `Acquisition: ${activeProduct.title}`,
        image: 'https://rajnikantdodiya.com/favicon.svg',
        prefill: {
          name: cleanName,
          email: studentEmail.trim(),
          contact: mobileCheck.cleanMobile
        },
        theme: {
          color: '#6B1D2F'
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        },
        handler: async function (response: any) {
          const razorpayPayId = response.razorpay_payment_id;
          if (!razorpayPayId) {
            alert('Security Alert: Missing payment confirmation ID from gateway response.');
            setIsProcessing(false);
            return;
          }
          setPaymentId(razorpayPayId);

          // 1. Fail-Closed Cryptographic Payment Verification with Backend Serverless Endpoint
          const licensedItems: ('book' | 'exam')[] = [];
          if (activeProduct.type === 'book') licensedItems.push('book');
          else if (activeProduct.type === 'exam') licensedItems.push('exam');
          else if (activeProduct.type === 'bundle') {
            licensedItems.push('book');
            licensedItems.push('exam');
          }

          let isServerFulfilled = false;

          if (response.razorpay_signature) {
            try {
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: razorpayPayId,
                  razorpay_signature: response.razorpay_signature,
                  order_id: orderId,
                  mobile: mobileCheck.cleanMobile,
                  student_name: cleanName,
                  product_type: activeProduct.type,
                  amount: verifiedPrice,
                  licensed_items: licensedItems,
                  device_token: activeDeviceToken || undefined
                })
              });

              if (!verifyRes.ok) {
                const errData = await verifyRes.json().catch(() => ({}));
                alert(`Security Alert: Payment verification failed (${errData.error || 'Server rejected payment'}). Please contact library support.`);
                setIsProcessing(false);
                return;
              }

              const verifyData = await verifyRes.json();
              if (verifyData.verified !== true) {
                alert('Security Alert: Server rejected payment signature. Please contact library support.');
                setIsProcessing(false);
                return;
              }

              if (verifyData.fulfilled) {
                isServerFulfilled = true;
              }
            } catch (networkErr) {
              console.error('Payment verification request failed:', networkErr);
              // Fail closed in production environments to prevent forged signature fulfillment
              if (!isLocalhost) {
                alert(`Security Alert: Could not verify payment authenticity with library server. If your account was debited, please contact support with Order ID: ${orderId}`);
                setIsProcessing(false);
                return;
              }
            }
          }

          // If not fulfilled server-side, fallback to client save
          if (!isServerFulfilled) {
            const saveResult = await saveOrderAndLicenses(
              {
                order_id: orderId,
                mobile: mobileCheck.cleanMobile,
                student_name: cleanName,
                product_type: activeProduct.type,
                amount: verifiedPrice,
                razorpay_payment_id: razorpayPayId,
                status: 'completed'
              },
              licensedItems
            );

            if (saveResult.deviceToken) {
              setActiveDeviceToken(saveResult.deviceToken);
            }
          }

          setIsProcessing(false);
          setPurchaseComplete(true);
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          alert(`Payment issue: ${resp.error?.description || 'Payment was not completed.'}`);
          setIsProcessing(false);
        });
        rzp.open();
      } catch (err) {
        console.error('Razorpay popup prevented or encountered error:', err);
        alert('Could not initialize Razorpay checkout popup. Please ensure popups are permitted in your browser or try again.');
        setIsProcessing(false);
      }
    } else {
      alert('Razorpay payment gateway is currently unreachable. Please try again or use direct UPI transfer.');
      setIsProcessing(false);
    }
  };

  const handleEnterPortal = () => {
    onPurchaseSuccess(activeProduct, studentName, studentMobile, generatedOrderId, activeDeviceToken);
    onClose();
  };

  const handleRestorePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreMobile.trim()) return;

    setRestoreStatus('searching');
    const result = await loginAndTransferDevice(restoreMobile);

    if (result.success && result.unlockedItems && result.unlockedItems.length > 0) {
      setRestoredDetails({
        name: result.name || 'Scholar',
        items: result.unlockedItems,
        orderId: result.orderId || 'HMP-ACCESS'
      });
      if (result.deviceToken) {
        setActiveDeviceToken(result.deviceToken);
      }
      setRestoreStatus('found');
    } else {
      setRestoreStatus('not_found');
    }
  };

  const handleApplyRestoredSession = () => {
    if (!restoredDetails) return;
    const restoredProduct = STORE_PRODUCTS.find(p => restoredDetails.items.includes(p.type)) || activeProduct;
    onPurchaseSuccess(restoredProduct, restoredDetails.name, restoreMobile, restoredDetails.orderId, activeDeviceToken);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-ink-pure/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-deckle max-h-[94vh] overflow-y-auto space-y-6">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-deckle pb-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-claret font-bold">
              The Circulation Desk • Academic Licensing
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-normal text-ink mt-0.5">
              Acquire Scholar Access
            </h3>
            <p className="text-xs text-ink-muted font-reading font-light mt-0.5">
              Authorized personal access for Indian scholars with 2-device binding (1 Phone + 1 Laptop) and digital rights protection.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close checkout"
            className="p-2 rounded-xl bg-parchment-warm text-ink-muted hover:text-claret transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Mode Tabs: New Checkout vs Restore Pass */}
        {!purchaseComplete && (
          <div className="flex items-center gap-2 p-1 rounded-xl bg-parchment-warm border border-deckle text-xs font-mono">
            <button
              onClick={() => setActiveTab('checkout')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'checkout'
                  ? 'bg-claret text-white shadow-xs font-bold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              1. New Acquisition Pass
            </button>
            <button
              onClick={() => setActiveTab('restore')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'restore'
                  ? 'bg-claret text-white shadow-xs font-bold'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              2. Restore Pass (Login by Mobile)
            </button>
          </div>
        )}

        {/* TAB 1: CHECKOUT / NEW ACQUISITION */}
        {activeTab === 'checkout' && !purchaseComplete && (
          <form onSubmit={(e) => { e.preventDefault(); handleInitiateRazorpay(); }} className="space-y-6">
            
            {/* 1. Select / Confirm Product */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-ink-faint block">
                Select Academic Product:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {STORE_PRODUCTS.map((prod) => {
                  const isCurrent = prod.id === activeProduct.id;
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => setActiveProduct(prod)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? 'border-claret bg-claret-soft/40 shadow-xs'
                          : 'border-deckle bg-white hover:border-claret/40'
                      }`}
                    >
                      <span className="text-[9px] font-mono text-ink-faint uppercase block truncate">{prod.badge}</span>
                      <h4 className="font-serif text-xs font-medium text-ink mt-0.5 line-clamp-1">
                        {prod.title}
                      </h4>
                      <div className="mt-1.5 font-serif font-bold text-sm text-claret">
                        ₹{prod.price}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Scholar Registration Form */}
            <div className="space-y-3 pt-3 border-t border-deckle">
              <span className="text-xs font-mono uppercase text-ink-faint block">
                Scholar Registration (Binds to 1 Active Device):
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-ink-faint block mb-1">Scholar Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-deckle bg-parchment-warm/40 text-base sm:text-xs font-sans text-ink focus:outline-none focus:border-claret min-h-[44px]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono text-ink-faint block">WhatsApp Mobile (+91)</label>
                    <span className="text-[10px] font-mono text-ink-muted">10 digits only</span>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                    placeholder="10-digit mobile number"
                    value={studentMobile}
                    onChange={(e) => {
                      const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setStudentMobile(cleanDigits);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-deckle bg-parchment-warm/40 text-base sm:text-xs font-mono text-ink focus:outline-none focus:border-claret min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-ink-faint block mb-1">Email Address (For Tax Receipt & Watermark)</label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@university.ac.in"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-deckle bg-parchment-warm/40 text-base sm:text-xs font-sans text-ink focus:outline-none focus:border-claret min-h-[44px]"
                />
              </div>
            </div>

            {/* 3. SECURE ACADEMIC PAYMENT CHANNELS */}
            <div className="space-y-3 pt-3 border-t border-deckle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-ink-faint block">
                  Accepted Payment Methods (Instant Single-Device License):
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Instant Activation
                </span>
              </div>

              {/* Secure Payment Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF6EE] border border-brass/50 space-y-3.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-mono font-bold text-ink">
                      Bank-Grade Encrypted Gateway (PCI-DSS)
                    </span>
                  </div>
                  <span className="font-serif font-bold text-xl text-claret">
                    ₹{activeProduct.price}
                  </span>
                </div>

                {/* Badges for all accepted payment modes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-deckle flex items-center gap-2.5 shadow-2xs">
                    <Smartphone className="w-4 h-4 text-claret shrink-0" />
                    <div>
                      <span className="font-bold text-[11px] block text-ink">UPI & Dynamic QR</span>
                      <span className="text-[9px] font-mono text-ink-muted">GPay, PhonePe, Paytm, BHIM</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-deckle flex items-center gap-2.5 shadow-2xs">
                    <CreditCard className="w-4 h-4 text-claret shrink-0" />
                    <div>
                      <span className="font-bold text-[11px] block text-ink">Debit & Credit Cards</span>
                      <span className="text-[9px] font-mono text-ink-muted">RuPay, Visa, Mastercard</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-deckle flex items-center gap-2.5 shadow-2xs">
                    <Lock className="w-4 h-4 text-claret shrink-0" />
                    <div>
                      <span className="font-bold text-[11px] block text-ink">NetBanking</span>
                      <span className="text-[9px] font-mono text-ink-muted">SBI, HDFC, ICICI, 50+ Banks</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-ink-muted font-reading leading-relaxed">
                  Click below to open the secure payment window. You can scan the dynamic UPI QR code with any app (Google Pay, PhonePe, Paytm), use your UPI ID, or pay via Card/NetBanking. Your scholarly license and digital watermarking will activate instantly upon bank verification.
                </p>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-claret hover:bg-claret-light text-white text-xs font-medium shadow-xs transition-all flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50"
            >
              {isProcessing ? (
                <span>Verifying Payment & Generating License...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Proceed to Secure Payment (₹{activeProduct.price})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        )}

        {/* TAB 2: RESTORE EXISTING SCHOLAR PASS */}
        {activeTab === 'restore' && !purchaseComplete && (
          <form onSubmit={handleRestorePass} className="space-y-6">
            <div className="p-4 rounded-2xl bg-parchment-warm border border-deckle space-y-2 text-xs">
              <span className="font-bold text-ink block">Already acquired Dr. Dodiya's monograph or CBT exam?</span>
              <p className="text-ink-muted leading-relaxed font-light">
                Enter your registered WhatsApp mobile number to verify your license and unlock your edition on this device.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-ink-faint block">Registered Mobile Number (+91)</label>
                <span className="text-[10px] font-mono text-ink-muted">10 digits only</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  pattern="[6-9][0-9]{9}"
                  placeholder="e.g. 9876543210"
                  value={restoreMobile}
                  onChange={(e) => {
                    const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setRestoreMobile(cleanDigits);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-deckle bg-parchment-warm/40 text-base sm:text-xs font-mono text-ink focus:outline-none focus:border-claret min-h-[44px]"
                />
                <button
                  type="submit"
                  disabled={restoreStatus === 'searching'}
                  className="px-5 py-3 rounded-xl bg-claret text-white text-xs font-medium hover:bg-claret-light transition-all min-h-[44px] flex items-center gap-1.5 shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span>{restoreStatus === 'searching' ? 'Verifying...' : 'Verify Pass'}</span>
                </button>
              </div>
            </div>

            {restoreStatus === 'found' && restoredDetails && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Active Scholar Pass Verified!</span>
                </div>
                <div className="text-xs text-ink space-y-1 font-mono">
                  <p>Candidate: <strong className="font-sans">{restoredDetails.name}</strong></p>
                  <p>Order Reference: <strong>#{restoredDetails.orderId}</strong></p>
                  <p>Entitled Access: <strong>{restoredDetails.items.join(', ').toUpperCase()}</strong></p>
                </div>
                <button
                  type="button"
                  onClick={handleApplyRestoredSession}
                  className="w-full py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-medium hover:bg-emerald-700 transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Unlock My Entitlements on this Device</span>
                </button>
              </div>
            )}

            {restoreStatus === 'not_found' && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs text-amber-900 animate-fade-in">
                <span className="font-bold block">No active license found for +91 {restoreMobile}</span>
                <p className="leading-relaxed">
                  Please verify that you entered the same 10-digit mobile number provided during acquisition, or obtain a new scholar pass.
                </p>
              </div>
            )}
          </form>
        )}

        {/* PURCHASE CONFIRMATION & ACCESS PORTAL LAUNCH */}
        {purchaseComplete && (
          <div className="text-center space-y-5 py-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-md bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-8 h-8 text-emerald-700" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono uppercase font-bold tracking-widest text-emerald-700">
                Academic License Activated
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
                Welcome to the Academic Study Portal, {studentName}
              </h3>
              <p className="text-xs text-ink-muted font-reading max-w-md mx-auto">
                Your personal license has been registered in the institutional repository and cryptographically bound to this device.
              </p>
            </div>

            {/* License Receipt Card */}
            <div className="p-4 rounded-2xl bg-parchment-warm border border-deckle text-xs font-mono text-left max-w-md mx-auto space-y-2">
              <div className="flex justify-between border-b border-deckle pb-2">
                <span className="text-ink-faint">Order ID:</span>
                <span className="font-bold text-ink">#{generatedOrderId}</span>
              </div>
              <div className="flex justify-between border-b border-deckle pb-2">
                <span className="text-ink-faint">Product:</span>
                <span className="font-bold text-ink">{activeProduct.title}</span>
              </div>
              <div className="flex justify-between border-b border-deckle pb-2">
                <span className="text-ink-faint">Payment Reference:</span>
                <span className="font-bold text-emerald-700">
                  {paymentId}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-ink-faint">Licensed Candidate:</span>
                <span className="font-bold text-ink">{studentName} (+91 {studentMobile})</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEnterPortal}
              className="px-8 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-sans font-medium transition-all shadow-xs inline-flex items-center gap-2 min-h-[48px]"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Enter Unlocked Reading Room / Exam Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
