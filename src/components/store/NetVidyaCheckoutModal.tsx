import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Copy,
  RefreshCw
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
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Payment Link + Webhook State
  const [paymentLinkState, setPaymentLinkState] = useState<{
    url: string;
    orderId: string;
    amount: number;
    name: string;
    email: string;
    mobile: string;
  } | null>(null);
  const [activationPassword, setActivationPassword] = useState('');
  const [activationMode, setActivationMode] = useState<'signup' | 'login'>('signup');
  const [activationStatusMsg, setActivationStatusMsg] = useState<string | null>(null);
  const [isCheckingWebhook, setIsCheckingWebhook] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  useEffect(() => {
    if (isOpen && buyerSession.isLoggedIn) {
      if (buyerSession.name && !studentName) setStudentName(buyerSession.name);
      if (buyerSession.email && !email) setEmail(buyerSession.email);
      if (buyerSession.mobile && !mobile) setMobile(buyerSession.mobile);
    }
  }, [isOpen, buyerSession.isLoggedIn, buyerSession.name, buyerSession.email, buyerSession.mobile]);

  const finalPayablePrice =
    paymentMode === 'payment_link'
      ? currentServerPrice
      : Math.max(1, currentServerPrice - (appliedDiscount?.amount || 0));

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
        setActivationStatusMsg(null);
        setIsProcessing(false);
        try {
          window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
        } catch {}
        return;
      }

      // Branch B: Razorpay Standard Checkout Popup (Native API Key + Secret)
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
      } else if (import.meta.env.DEV && import.meta.env.VITE_ALLOW_LOCAL_DEV_CHECKOUT === 'true') {
        // Strictly opt-in local development sandbox flag only
        setTimeout(() => {
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
        }, 500);
      } else {
        throw new Error(`Online payment checkout is awaiting Razorpay link/key configuration. Please contact support on WhatsApp (${STORE_MERCHANT.supportPhone}) for instant activation.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to payment gateway.');
      setIsProcessing(false);
    }
  };

  const handleCopyCheckoutEmail = async () => {
    if (!paymentLinkState?.email) return;
    try {
      await navigator.clipboard.writeText(paymentLinkState.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch {}
  };

  const handleCheckLoggedInWebhook = async () => {
    if (!paymentLinkState) return;
    setErrorMessage(null);
    setActivationStatusMsg(null);
    setIsCheckingWebhook(true);
    const result = await refreshSession();
    setIsCheckingWebhook(false);

    if (result.isBuyer) {
      onSuccess({
        name: paymentLinkState.name,
        email: paymentLinkState.email,
        mobile: paymentLinkState.mobile,
        orderId: paymentLinkState.orderId
      });
    } else {
      setActivationStatusMsg(
        'Payment confirmation from Razorpay is not detected yet for this account. If you just paid, wait 5–10 seconds and tap Check Again, or make sure you paid with this exact email.'
      );
    }
  };

  const handleActivateLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentLinkState) return;
    setErrorMessage(null);
    setActivationStatusMsg(null);

    if (!activationPassword || activationPassword.length < 6) {
      setErrorMessage('Please enter a password of at least 6 characters.');
      return;
    }

    setIsCheckingWebhook(true);
    const res =
      activationMode === 'signup'
        ? await signup(paymentLinkState.name, paymentLinkState.email, paymentLinkState.mobile, activationPassword)
        : await login(paymentLinkState.email, activationPassword);
    setIsCheckingWebhook(false);

    if (!res.success) {
      if (activationMode === 'signup' && res.error?.toLowerCase().includes('already exists')) {
        setActivationMode('login');
        setErrorMessage('This email already has a website account. Please enter your existing password to sign in and unlock.');
        return;
      }
      setErrorMessage(res.error || 'Could not sign in or verify account.');
      return;
    }

    if (res.isBuyer) {
      onSuccess({
        name: paymentLinkState.name,
        email: paymentLinkState.email,
        mobile: paymentLinkState.mobile,
        orderId: paymentLinkState.orderId
      });
    } else {
      setActivationStatusMsg(
        `Your account is signed in! Once your ₹${paymentLinkState.amount} Razorpay payment finishes, wait 5–10 seconds and tap "Check Webhook & Unlock" below.`
      );
    }
  };

  const displayedPrice = paymentLinkState ? paymentLinkState.amount : finalPayablePrice;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg my-auto bg-white rounded-3xl p-4 sm:p-7 md:p-8 shadow-2xl border border-gray-200 space-y-5 animate-scale-up max-h-[calc(100dvh-2rem)] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors z-10"
          title="Close Checkout"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Header */}
        <div className="space-y-1 pr-8">
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
            Sold by {STORE_MERCHANT.brandName} ({STORE_MERCHANT.proprietor}) • Content by {STORE_MERCHANT.curatorShort}
          </p>
        </div>

        {/* Price Box */}
        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-blue-800 font-medium block">Payable Enrollment Fee</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-extrabold text-blue-950">₹{displayedPrice}</span>
              <span className="text-xs text-blue-700 font-medium">INR (All Inclusive)</span>
            </div>
            {!paymentLinkState && appliedDiscount && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved ₹{appliedDiscount.amount} with code {appliedDiscount.code}</span>
              </span>
            )}
          </div>
          <div className="text-left sm:text-right text-xs text-blue-800">
            <span className="font-semibold block">Valid through</span>
            <strong className="text-blue-950 font-bold">{STORE_MERCHANT.accessExpiryLabel}</strong>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {activationStatusMsg && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <p className="leading-relaxed">{activationStatusMsg}</p>
          </div>
        )}

        {paymentLinkState ? (
          /* PAYMENT LINK + WEBHOOK VERIFICATION STEP */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2.5">
              <p className="text-xs font-bold text-emerald-950">
                Step 1: Pay ₹{paymentLinkState.amount} on Official Razorpay Page
              </p>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Enter this <strong>exact email</strong> during payment on Razorpay so our server unlocks your Test Hall automatically via webhook:
              </p>
              <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200">
                <span className="text-xs font-mono font-bold text-gray-900 truncate">{paymentLinkState.email}</span>
                <button
                  type="button"
                  onClick={handleCopyCheckoutEmail}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1 shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedEmail ? 'Copied!' : 'Copy'}</span>
                </button>
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

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <p className="text-xs font-bold text-gray-900">
                Step 2: After Payment, Activate Your Portal Pass
              </p>

              {buyerSession.isLoggedIn && buyerSession.email.toLowerCase() === paymentLinkState.email ? (
                <button
                  type="button"
                  onClick={handleCheckLoggedInWebhook}
                  disabled={isCheckingWebhook}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingWebhook ? 'animate-spin' : ''}`} />
                  <span>{isCheckingWebhook ? 'Checking Razorpay Confirmation...' : 'Check Webhook & Unlock Portal'}</span>
                </button>
              ) : (
                <form onSubmit={handleActivateLinkAccount} className="space-y-2.5">
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => { setActivationMode('signup'); setErrorMessage(null); }}
                      className={`flex-1 py-1.5 rounded-lg font-bold border transition-colors ${
                        activationMode === 'signup'
                          ? 'bg-blue-50 border-blue-300 text-blue-800'
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      New Account (Set Password)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActivationMode('login'); setErrorMessage(null); }}
                      className={`flex-1 py-1.5 rounded-lg font-bold border transition-colors ${
                        activationMode === 'login'
                          ? 'bg-blue-50 border-blue-300 text-blue-800'
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      Already Registered? Sign In
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={activationPassword}
                    onChange={e => setActivationPassword(e.target.value)}
                    placeholder={
                      activationMode === 'signup'
                        ? 'Create portal password (min 6 chars)'
                        : 'Enter your existing portal password'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isCheckingWebhook}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isCheckingWebhook
                        ? 'Verifying Payment & Account...'
                        : activationMode === 'signup'
                          ? 'Create Account & Unlock Portal'
                          : 'Sign In & Unlock Portal'}
                    </span>
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => {
                  setPaymentLinkState(null);
                  setErrorMessage(null);
                  setActivationStatusMsg(null);
                }}
                className="text-[11px] font-semibold text-gray-500 hover:text-gray-800 underline"
              >
                ← Change email or mobile number
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD CANDIDATE FORM INPUTS */
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

            {/* Optional Coupon Code Input (available in API Checkout Mode) */}
            {paymentMode === 'api_checkout' && (
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
            )}

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
                    <span>Preparing Secure Checkout...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Proceed to Pay ₹{finalPayablePrice}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Trust Badges */}
        <div className="pt-2 border-t border-gray-200 space-y-2">
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
