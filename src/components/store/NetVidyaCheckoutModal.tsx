import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { useNetVidyaStore } from '../../contexts/NetVidyaStoreContext';

interface NetVidyaCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (buyer: { name: string; email: string; mobile: string; orderId: string }) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const NetVidyaCheckoutModal: React.FC<NetVidyaCheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentServerPrice, isEarlyBirdActive, loginBuyer } = useNetVidyaStore();

  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const finalPayablePrice = Math.max(1, currentServerPrice - (appliedDiscount?.amount || 0));

  const handleApplyCoupon = () => {
    setCouponError(null);
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    const coupons: Record<string, { amount: number; message: string }> = {
      'GSET50': { amount: 50, message: '₹50 GSET Aspirant discount applied!' },
      'NET100': { amount: 100, message: '₹100 NET Candidate scholarship discount applied!' },
      'SCHOLAR150': { amount: 150, message: '₹150 Special Scholar discount applied!' },
      'EARLYBIRD': { amount: 50, message: '₹50 Early Bird discount applied!' }
    };
    if (coupons[code]) {
      setAppliedDiscount({ code, ...coupons[code] });
      setCouponError(null);
    } else {
      setCouponError('Invalid or expired coupon code.');
    }
  };

  if (!isOpen) return null;

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = studentName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter your full candidate name.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address for receiving your pass.');
      return;
    }

    if (!cleanMobile || cleanMobile.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Call server endpoint to create order with authoritative server price
      const orderRes = await fetch('/api/store/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: cleanName,
          email: cleanEmail,
          mobile: cleanMobile,
          couponCode: appliedDiscount?.code || ''
        })
      });

      const orderData = await orderRes.json().catch(() => ({}));

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initiate order. Please try again.');
      }

      // Ensure Razorpay SDK script is loaded
      if (typeof window !== 'undefined' && !window.Razorpay) {
        await new Promise<void>(resolve => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => resolve();
          document.body.appendChild(script);
        });
      }

      // 2. Launch Razorpay Standard Checkout Popup
      if (typeof window !== 'undefined' && window.Razorpay && orderData.keyId && !orderData.isTestMode) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amountInPaisa,
          currency: 'INR',
          name: 'NET Vidya English',
          description: 'GSET + UGC NET English Final Pack 2026',
          order_id: orderData.orderId,
          prefill: {
            name: cleanName,
            email: cleanEmail,
            contact: cleanMobile
          },
          theme: {
            color: '#1E3A8A'
          },
          handler: async function (response: any) {
            try {
              // 3. Cryptographic Signature Verification on Server
              const verifyRes = await fetch('/api/store/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  studentName: cleanName,
                  email: cleanEmail,
                  mobile: cleanMobile,
                  orderId: orderData.orderId
                })
              });

              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                if (verifyData.token) {
                  try {
                    localStorage.setItem('netvidya_auth_token_v1', verifyData.token);
                  } catch {}
                }
                loginBuyer({
                  name: cleanName,
                  email: cleanEmail,
                  mobile: cleanMobile,
                  orderId: orderData.orderId,
                  token: verifyData.token,
                  isBuyer: true
                });
                setIsProcessing(false);
                onSuccess({
                  name: cleanName,
                  email: cleanEmail,
                  mobile: cleanMobile,
                  orderId: orderData.orderId
                });
              } else {
                throw new Error(verifyData.error || 'Payment signature verification failed.');
              }
            } catch (err: any) {
              setErrorMessage(err.message || 'Payment verification encountered an issue.');
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setErrorMessage(`Payment declined: ${resp.error?.description || 'Transaction incomplete.'}`);
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        // Fallback Simulation (Development / Test Mode when Razorpay script is mocked or live keys pending)
        setTimeout(async () => {
          loginBuyer({
            name: cleanName,
            email: cleanEmail,
            mobile: cleanMobile,
            orderId: orderData.orderId || `NV_DEV_${Date.now()}`,
            isBuyer: true
          });
          setIsProcessing(false);
          onSuccess({
            name: cleanName,
            email: cleanEmail,
            mobile: cleanMobile,
            orderId: orderData.orderId || `NV_DEV_${Date.now()}`
          });
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to payment gateway.');
      setIsProcessing(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg my-auto bg-white rounded-3xl p-5 sm:p-7 md:p-8 shadow-2xl border border-gray-200 space-y-5 animate-scale-up max-h-[calc(100dvh-2rem)] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors z-10"
          title="Close Checkout"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
              Single Final Pack 2026
            </span>
            {isEarlyBirdActive && (
              <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Early-Bird Active
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            GSET + UGC NET English Final Pack 2026
          </h2>
          <p className="text-xs text-gray-500">
            Sold by NET Vidya (Nilam Dodiya) • Content by Dr. Rajnikant Dodiya
          </p>
        </div>

        {/* Price Box */}
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-blue-800 font-medium block">Payable Enrollment Fee</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-extrabold text-blue-950">₹{finalPayablePrice}</span>
              {appliedDiscount && (
                <span className="text-xs text-gray-400 line-through font-medium">
                  ₹{currentServerPrice}
                </span>
              )}
              <span className="text-xs text-blue-700 font-medium">INR (All Inclusive)</span>
            </div>
            {appliedDiscount && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved ₹{appliedDiscount.amount} with code {appliedDiscount.code}</span>
              </span>
            )}
          </div>
          <div className="text-right text-xs text-blue-800">
            <span className="font-semibold block">Valid through</span>
            <strong className="text-blue-950 font-bold">31 Dec 2026</strong>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleInitiatePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Candidate Name *
            </label>
            <input
              type="text"
              required
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              placeholder="e.g. Aarav Patel"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Registered Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. aarav@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
            />
            <span className="text-[11px] text-gray-500 mt-0.5 block">
              Your pass and dashboard login link will be sent here.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              WhatsApp / Mobile Number *
            </label>
            <div className="flex">
              <span className="px-3.5 py-2.5 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-xs font-semibold text-gray-600 flex items-center">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full px-4 py-2.5 rounded-r-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none font-mono"
              />
            </div>
          </div>

          {/* Optional Coupon Code Input */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">Have a Scholarship / Referral Code?</span>
              <span className="text-[11px] text-gray-400 font-mono">Optional</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder="e.g. GSET50 or NET100"
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-600 outline-none"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors"
              >
                Apply
              </button>
            </div>
            {appliedDiscount && (
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{appliedDiscount.message} (Code: {appliedDiscount.code})</span>
              </p>
            )}
            {couponError && (
              <p className="text-[11px] text-rose-600 font-medium">
                {couponError}
              </p>
            )}
          </div>

          {/* Secure Payment Trigger Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Securing Order with Razorpay...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Proceed to Pay ₹{currentServerPrice}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Trust Badges */}
        <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <span>Razorpay Verified</span>
          <span>Instant Digital Access</span>
        </div>

      </div>
    </div>
  );
};
