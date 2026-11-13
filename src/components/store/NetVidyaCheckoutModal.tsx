import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useNetVidyaStore } from '../../contexts/NetVidyaStoreContext';
import { STORE_MERCHANT, STORE_PAYMENT_DEFAULTS } from '../../config/storeConfig';
import { StorePolicyLinks, PolicyTab } from '../common/StorePolicyLinks';

interface NetVidyaCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (buyer: { name: string; email: string; mobile: string; orderId: string }) => void;
  onOpenPolicy?: (tab: PolicyTab) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const NetVidyaCheckoutModal: React.FC<NetVidyaCheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenPolicy
}) => {
  const {
    currentServerPrice,
    isEarlyBirdActive,
    buyerSession,
    loginBuyer,
    signup,
    login,
    refreshSession,
    paymentMode,
    paymentLinkUrl: contextPaymentLinkUrl
  } = useNetVidyaStore();

  const [studentName, setStudentName] = useState(buyerSession.name || '');
  const [email, setEmail] = useState(buyerSession.email || '');
  const [mobile, setMobile] = useState(buyerSession.mobile || '');
  const [password, setPassword] = useState('');
  const [isExistingAccount, setIsExistingAccount] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Payment Link & Webhook Polling State
  const [paymentLinkState, setPaymentLinkState] = useState<{
    url: string;
    orderId: string;
    amount: number;
    name: string;
    email: string;
    mobile: string;
  } | null>(null);
  const [isCheckingWebhook, setIsCheckingWebhook] = useState(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && buyerSession.isLoggedIn) {
      if (buyerSession.name && !studentName) setStudentName(buyerSession.name);
      if (buyerSession.email && !email) setEmail(buyerSession.email);
      if (buyerSession.mobile && !mobile) setMobile(buyerSession.mobile);
    }
  }, [isOpen, buyerSession.isLoggedIn, buyerSession.name, buyerSession.email, buyerSession.mobile]);

  // Automated background polling for webhook payment verification
  useEffect(() => {
    if (!isOpen || !paymentLinkState || isPaymentSuccess) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const res = await refreshSession();
        if (isMounted && res.isBuyer) {
          setIsPaymentSuccess(true);
        }
      } catch {}
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, paymentLinkState, isPaymentSuccess, refreshSession]);

  const finalPayablePrice =
    paymentMode === 'payment_link'
      ? currentServerPrice
      : Math.max(1, currentServerPrice - (appliedDiscount?.amount || 0));

  const displayedPrice = paymentLinkState ? paymentLinkState.amount : finalPayablePrice;

  const handleApplyCoupon = () => {
    setCouponError(null);
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    const coupons = STORE_PAYMENT_DEFAULTS.validCoupons;
    if (coupons[code]) {
      setAppliedDiscount({ code, ...coupons[code] });
      setCouponError(null);
    } else {
      setCouponError('Invalid or expired coupon code.');
    }
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusNotice(null);

    const cleanName = studentName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter your full candidate name.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address for receiving your pass.');
      return;
    }

    if (!cleanMobile || cleanMobile.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    // Require password if student is not logged in yet
    if (!buyerSession.isLoggedIn) {
      if (!password || password.length < 6) {
        setErrorMessage('Please enter a password of at least 6 characters.');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // 1. Ensure user is authenticated before opening payment
      if (!buyerSession.isLoggedIn) {
        const authRes = isExistingAccount
          ? await login(cleanEmail, password)
          : await signup(cleanName, cleanEmail, cleanMobile, password);

        if (!authRes.success) {
          if (!isExistingAccount && authRes.error?.toLowerCase().includes('already exists')) {
            setIsExistingAccount(true);
            setErrorMessage('An account with this email already exists. Please enter your existing password to continue.');
            setIsProcessing(false);
            return;
          }
          throw new Error(authRes.error || 'Account setup failed. Please check your credentials.');
        }

        // If they already bought previously and are just logging in
        if (authRes.isBuyer) {
          setIsPaymentSuccess(true);
          setIsProcessing(false);
          return;
        }
      }

      // 2. Call server endpoint to create order with authoritative server price
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

      const fallbackLink = (contextPaymentLinkUrl || import.meta.env.VITE_RAZORPAY_PAYMENT_LINK || STORE_PAYMENT_DEFAULTS.defaultPaymentLink).trim();
      const paymentLinkUrl = orderData.paymentLinkUrl || (orderData.paymentMode === 'payment_link' ? fallbackLink : '');

      // Branch A: Verified Payment Link + Webhook Mode
      if (orderData.paymentMode === 'payment_link' || (!orderData.keyId && !orderData.isTestMode && fallbackLink)) {
        const resolvedUrl = paymentLinkUrl || fallbackLink;
        setPaymentLinkState({
          url: resolvedUrl,
          orderId: orderData.orderId || `NV_LINK_${Date.now()}`,
          amount: orderData.amount || finalPayablePrice,
          name: cleanName,
          email: cleanEmail,
          mobile: cleanMobile
        });
        setIsProcessing(false);
        try {
          window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
        } catch {}
        return;
      }

      // Branch B: Razorpay Standard Checkout Popup (Native API Key Mode)
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
                setIsPaymentSuccess(true);
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
        throw new Error('Online payment gateway is temporarily unreachable. Please contact student support.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to payment gateway.');
      setIsProcessing(false);
    }
  };

  const handleManualCheck = async () => {
    setIsCheckingWebhook(true);
    setErrorMessage(null);
    setStatusNotice(null);
    try {
      const res = await refreshSession();
      if (res.isBuyer) {
        setIsPaymentSuccess(true);
      } else {
        setStatusNotice('Payment not detected yet. If you just completed the payment, please allow 5–10 seconds for Razorpay to sync.');
      }
    } catch {
      setStatusNotice('Network error while checking status. Please try again in a few moments.');
    } finally {
      setIsCheckingWebhook(false);
    }
  };

  const handleCompleteSuccess = () => {
    onSuccess({
      name: paymentLinkState?.name || studentName || 'Candidate',
      email: paymentLinkState?.email || email || '',
      mobile: paymentLinkState?.mobile || mobile || '',
      orderId: paymentLinkState?.orderId || `NV_${Date.now()}`
    });
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-3 sm:p-6 flex flex-col justify-start sm:justify-center items-center min-h-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div className="relative w-full max-w-lg my-auto bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden animate-scale-up">
        
        {/* Sticky Pinned Header (Never cut off or scrolled out of view) */}
        <div className="p-5 sm:p-6 pb-4 border-b border-gray-100 flex items-start justify-between shrink-0 bg-white">
          <div className="space-y-1 pr-6">
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
            <h2 id="checkout-modal-title" className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
              GSET + UGC NET English Final Pack 2026
            </h2>
            <p className="text-xs text-gray-500">
              Sold by {STORE_MERCHANT.brandName} ({STORE_MERCHANT.proprietor}) • Content by {STORE_MERCHANT.curatorShort}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
            title="Close Checkout"
            aria-label="Close Checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">

          {/* Price Summary Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 to-indigo-50/50 border border-blue-200/80 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">Payable Enrollment Fee</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold text-blue-950 font-serif">₹{displayedPrice}</span>
                <span className="text-xs text-blue-700 font-medium">INR (All Inclusive)</span>
              </div>
              {!paymentLinkState && appliedDiscount && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved ₹{appliedDiscount.amount} with code {appliedDiscount.code}</span>
                </span>
              )}
            </div>
            <div className="text-right text-xs text-blue-900">
              <span className="text-[11px] text-blue-700 block font-medium">Access Validity</span>
              <strong className="text-blue-950 font-bold">{STORE_MERCHANT.accessExpiryLabel}</strong>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* Status Notice */}
          {statusNotice && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <p className="leading-relaxed">{statusNotice}</p>
            </div>
          )}

          {/* VIEW STATE 1: PAYMENT SUCCESS CELEBRATION */}
          {isPaymentSuccess ? (
            <div className="py-4 text-center space-y-4 animate-scale-up">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-gray-900">
                  Payment Verified! Access Active
                </h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  Congratulations! Your digital pass for the GSET + UGC NET English Final Pack 2026 is unlocked through {STORE_MERCHANT.accessExpiryLabel}.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-left space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Candidate:</span>
                  <strong className="text-gray-900">{paymentLinkState?.name || studentName}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Registered Email:</span>
                  <strong className="text-gray-900 font-mono">{paymentLinkState?.email || email}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Amount Paid:</span>
                  <strong className="text-emerald-700 font-bold">₹{displayedPrice} INR</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCompleteSuccess}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Student Dashboard & Test Hall</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : paymentLinkState ? (
            /* VIEW STATE 2: AWAITING PAYMENT (Clean, Automatic, Zero-Jargon) */
            <div className="space-y-4 animate-scale-up">
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3.5 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  <span>Awaiting Razorpay Payment</span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-gray-900">
                    Complete Your Payment in the Razorpay Tab
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                    We opened your secure payment window in a new tab. Please complete your payment of <strong>₹{paymentLinkState.amount}</strong> to continue.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-blue-200/80 text-left space-y-1 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Enrolling as:</span>
                    <strong className="text-gray-900 truncate max-w-[200px]">{paymentLinkState.name}</strong>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Pass will unlock for:</span>
                    <strong className="text-gray-900 font-mono truncate max-w-[200px]">{paymentLinkState.email}</strong>
                  </div>
                </div>

                <a
                  href={paymentLinkState.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Open Razorpay Payment Page</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Automatic detection notice & manual refresh option */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center space-y-2.5">
                <p className="text-xs text-gray-600">
                  This window will <strong>automatically detect</strong> your confirmation and unlock your dashboard as soon as you finish paying.
                </p>
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={isCheckingWebhook}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-all inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingWebhook ? 'animate-spin' : ''}`} />
                  <span>{isCheckingWebhook ? 'Verifying with Gateway...' : 'Already Paid? Check Confirmation Now'}</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentLinkState(null);
                    setErrorMessage(null);
                    setStatusNotice(null);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-800 underline font-medium"
                >
                  ← Change candidate details or phone number
                </button>
              </div>
            </div>
          ) : (
            /* VIEW STATE 3: CLEAN CANDIDATE DETAILS FORM */
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
                  Your official digital student pass and confirmation will be sent here.
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

              {/* Seamless Password Entry if candidate is not signed in yet */}
              {!buyerSession.isLoggedIn && (
                <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      {isExistingAccount ? 'Portal Password *' : 'Create Portal Password *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsExistingAccount(!isExistingAccount);
                        setErrorMessage(null);
                      }}
                      className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold underline"
                    >
                      {isExistingAccount ? 'New student? Create account' : 'Already have account? Sign in'}
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={isExistingAccount ? 'Enter your portal password' : 'Create a password (min 6 chars)'}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                  <p className="text-[11px] text-gray-500">
                    {isExistingAccount
                      ? 'Sign in to link this purchase to your existing student profile.'
                      : 'Used to log into your Test Hall & Dossiers from any phone or laptop.'}
                  </p>
                </div>
              )}

              {/* Optional Coupon Code (Available in API Checkout mode) */}
              {paymentMode === 'api_checkout' && (
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Scholarship / Referral Code</span>
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
              )}

              {/* Secure Payment Trigger Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Opening Secure Checkout...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-blue-200" />
                      <span>Proceed to Secure Payment — ₹{finalPayablePrice}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Sticky Pinned Footer with Trust Badges & Compliance Links */}
        <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 shrink-0 space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2.5 text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>256-Bit SSL Encrypted</span>
            </div>
            <span>Razorpay Verified</span>
            <span>Instant Digital Access</span>
          </div>
          {onOpenPolicy && (
            <StorePolicyLinks
              variant="compact"
              onSelectPolicy={(tab) => {
                onClose();
                onOpenPolicy(tab);
              }}
            />
          )}
        </div>

      </div>
    </div>
  );
};
