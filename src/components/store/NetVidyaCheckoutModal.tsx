import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Layers,
  BookOpen,
  GraduationCap,
  MessageCircle,
  Check,
  Calendar,
  Clock
} from 'lucide-react';
import { useNetVidyaStore, isPackEnrolled } from '../../contexts/NetVidyaStoreContext';
import { STORE_MERCHANT, STORE_PAYMENT_DEFAULTS } from '../../config/storeConfig';
import { StorePolicyLinks, PolicyTab } from '../common/StorePolicyLinks';
import { useModalEscape } from '../../hooks/useModalEscape';

export type ExamType = 'ugc' | 'gset';
export type GsetStream = 'english' | 'education' | 'all';

export interface CheckoutProductOption {
  id: string;
  exam: ExamType;
  stream: 'english' | 'education' | 'general';
  name: string;
  shortName: string;
  price: number;
  originalPrice: number;
  badge: string;
  badgeColor: string;
  isCombo?: boolean;
  testCountDesc: string;
  description: string;
  paymentLink: string;
}

export const CHECKOUT_PRODUCTS: CheckoutProductOption[] = [
  // --- GSET COMBOS (₹249 MAX PRICE) ---
  {
    id: 'gset-english-combo',
    exam: 'gset',
    stream: 'english',
    name: 'GSET English Scholar Duo (Paper 1 + English)',
    shortName: 'English Scholar Duo (Paper 1 + 2)',
    price: 249,
    originalPrice: 799,
    paymentLink: 'https://rzp.io/rzp/oXfY4Va',
    badge: 'RECOMMENDED • BEST VALUE',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    isCombo: true,
    testCountDesc: '20 Full CBT Tests (10 Paper 1 + 10 English Paper 2)',
    description: 'Complete dual-paper preparation: Paper 1 General Aptitude combined with English Literature & ELT.'
  },
  {
    id: 'gset-education-combo',
    exam: 'gset',
    stream: 'education',
    name: 'GSET Education Scholar Duo (Paper 1 + Education)',
    shortName: 'Education Scholar Duo (Paper 1 + 2)',
    price: 249,
    originalPrice: 799,
    paymentLink: 'https://rzp.io/rzp/oXfY4Va',
    badge: 'RECOMMENDED • BEST VALUE',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    isCombo: true,
    testCountDesc: '20 Full CBT Tests (10 Paper 1 + 10 Education Paper 2)',
    description: 'Complete dual-paper preparation: Paper 1 General Aptitude combined with Teacher Education & Pedagogy.'
  },

  // --- GSET STANDALONE SINGLE PAPERS (₹149 EACH) ---
  {
    id: 'gset-paper1',
    exam: 'gset',
    stream: 'general',
    name: 'GSET Paper 1: General Aptitude Foundation Pack',
    shortName: 'Paper 1 General Aptitude Only',
    price: 149,
    originalPrice: 499,
    paymentLink: 'https://rzp.io/rzp/5RjuNNp',
    badge: 'GENERAL APTITUDE (COMMON)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    isCombo: false,
    testCountDesc: '10 Full CBT Tests (50 Questions each)',
    description: '10 general units: Teaching Aptitude, Research, ICT, Logical Reasoning, and Higher Education.'
  },
  {
    id: 'gset-paper2-english',
    exam: 'gset',
    stream: 'english',
    name: 'GSET Paper 2: English Literature Specialist Pack',
    shortName: 'Paper 2 English Literature Only',
    price: 149,
    originalPrice: 499,
    paymentLink: 'https://rzp.io/rzp/5RjuNNp',
    badge: 'ENGLISH STREAM SPECIALIST',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    isCombo: false,
    testCountDesc: '10 Specialist CBT Tests (100 Questions each)',
    description: 'British, American & Indian Literature, Literary Theory, Cultural Studies, and ELT in India.'
  },
  {
    id: 'gset-paper2-education',
    exam: 'gset',
    stream: 'education',
    name: 'GSET Paper 2: Education Discipline Master Pack',
    shortName: 'Paper 2 Education Discipline Only',
    price: 149,
    originalPrice: 499,
    paymentLink: 'https://rzp.io/rzp/5RjuNNp',
    badge: 'EDUCATION STREAM SPECIALIST',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    isCombo: false,
    testCountDesc: '10 Specialist CBT Tests (100 Questions each)',
    description: 'Philosophical & Sociological Foundations, Teacher Education, Curriculum Studies, and Pedagogy.'
  },

  // --- UGC NET COMPLETE BUNDLE (₹499) ---
  {
    id: 'ugc-net-english-bundle',
    exam: 'ugc',
    stream: 'english',
    name: 'UGC NET English Complete Preparation Bundle (2026 Edition)',
    shortName: 'UGC NET English Complete Bundle',
    price: 499,
    originalPrice: 999,
    paymentLink: 'https://rzp.io/rzp/locBUA0o',
    badge: 'COMPLETE PREPARATION BUNDLE',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    isCombo: true,
    testCountDesc: '21 NTA CBT Tests + 3 Complete Reading Dossiers (347 Pages)',
    description: '1 Grand Mock (100 Qs), 10 Unit Tests, 10 Practice Mocks, 283p e-book, 35p PYQs & 29p Revision Kit.'
  }
];

interface NetVidyaCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (buyer: { name: string; email: string; mobile: string; orderId: string; productId?: string }) => void;
  onOpenPolicy?: (tab: PolicyTab) => void;
  initialExam?: ExamType;
  initialProductId?: string;
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
  onOpenPolicy,
  initialExam = 'gset',
  initialProductId
}) => {
  const {
    currentServerPrice,
    buyerSession,
    loginBuyer,
    signup,
    login,
    paymentMode,
    paymentLinkUrl: contextPaymentLinkUrl
  } = useNetVidyaStore();

  // Automatically resolve the exam context from product ID, explicit prop, or URL route
  const resolvedExam: ExamType = useMemo(() => {
    if (initialProductId?.startsWith('gset-')) return 'gset';
    if (initialProductId?.startsWith('ugc-')) return 'ugc';
    if (initialExam === 'gset' || initialExam === 'ugc') return initialExam;
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      if (hash.includes('gset') || pathname.includes('gset')) return 'gset';
    }
    return 'ugc';
  }, [initialProductId, initialExam]);

  // Exam and Pack selection state
  const [selectedExam, setSelectedExam] = useState<ExamType>(resolvedExam);
  const [selectedProductId, setSelectedProductId] = useState<string>(() => {
    if (initialProductId) return initialProductId;
    if (resolvedExam === 'gset') return 'gset-english-combo';
    return 'ugc-net-english-bundle';
  });

  // Modal scroll container ref
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Background body and root scroll lock
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen]);

  // Candidate input fields
  const [studentName, setStudentName] = useState(buyerSession.name || '');
  const [email, setEmail] = useState(buyerSession.email || '');
  const [mobile, setMobile] = useState(buyerSession.mobile || '');
  const [password, setPassword] = useState('');
  const [isExistingAccount, setIsExistingAccount] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [redirectingUrl, setRedirectingUrl] = useState<string | null>(null);
  const [manualWhatsAppInfo, setManualWhatsAppInfo] = useState<{ url: string; number: string; message: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

  // Universal Escape key listener to close modal safely
  useModalEscape(isOpen, onClose, !redirectingUrl && !isProcessing);

  // Sync state when props change
  useEffect(() => {
    if (isOpen) {
      setSelectedExam(resolvedExam);
      if (initialProductId) {
        setSelectedProductId(initialProductId);
      } else if (resolvedExam === 'gset') {
        setSelectedProductId('gset-english-combo');
      } else {
        setSelectedProductId('ugc-net-english-bundle');
      }
    }
  }, [isOpen, resolvedExam, initialProductId]);

  // Pre-fill user session if logged in
  useEffect(() => {
    if (isOpen && buyerSession.isLoggedIn) {
      if (buyerSession.name && !studentName) setStudentName(buyerSession.name);
      if (buyerSession.email && !email) setEmail(buyerSession.email);
      if (buyerSession.mobile && !mobile) setMobile(buyerSession.mobile);
    }
  }, [isOpen, buyerSession.isLoggedIn, buyerSession.name, buyerSession.email, buyerSession.mobile]);

  // Get current active product object
  const activeProduct = useMemo(() => {
    const found = CHECKOUT_PRODUCTS.find(p => p.id === selectedProductId);
    if (found) return found;
    return selectedExam === 'gset'
      ? CHECKOUT_PRODUCTS[0] // gset-english-combo (₹249)
      : CHECKOUT_PRODUCTS.find(p => p.id === 'ugc-net-english-bundle')!;
  }, [selectedProductId, selectedExam]);

  // GSET products (Duos vs Single Papers)
  const gsetProducts = useMemo(() => {
    return CHECKOUT_PRODUCTS.filter(p => p.exam === 'gset');
  }, []);
  const gsetDuos = useMemo(() => gsetProducts.filter(p => p.isCombo), [gsetProducts]);
  const gsetSingles = useMemo(() => gsetProducts.filter(p => !p.isCombo), [gsetProducts]);

  // Check if candidate already owns the selected product
  const isAlreadyOwned = useMemo(() => {
    return isPackEnrolled(activeProduct.id, buyerSession);
  }, [activeProduct.id, buyerSession]);

  // Base price and final payable calculation
  // Strict rule: GSET max combo is ₹249, singles are ₹149. UGC bundle is ₹499.
  const basePrice = activeProduct.price;
  const finalPayablePrice = Math.max(0, basePrice - (appliedDiscount?.amount || 0));

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

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handleInitiatePayment = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setErrorMessage(null);

    // If candidate already owns this pack, bypass checkout completely and open materials
    if (isAlreadyOwned) {
      handleCompleteSuccess();
      return;
    }

    const isSimulated = appliedDiscount?.code === 'SIMULATE' || finalPayablePrice === 0;

    let cleanName = studentName.trim();
    let cleanEmail = email.trim().toLowerCase();
    let cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    let candidatePassword = password;

    if (isSimulated) {
      if (!cleanName) {
        cleanName = 'Scholar Tester';
        setStudentName('Scholar Tester');
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        cleanEmail = 'scholar.test@example.com';
        setEmail('scholar.test@example.com');
      }
      if (!cleanMobile || cleanMobile.length !== 10) {
        cleanMobile = '9876543210';
        setMobile('9876543210');
      }
      if (!candidatePassword || candidatePassword.length < 6) {
        candidatePassword = 'testpass123';
        setPassword('testpass123');
      }
    }

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

    if (!buyerSession.isLoggedIn && !isSimulated) {
      if (!candidatePassword || candidatePassword.length < 6) {
        setErrorMessage('Please create a portal password of at least 6 characters.');
        return;
      }
    }

    setIsProcessing(true);

    try {
      // 1. Ensure user is authenticated before creating payment order
      if (!buyerSession.isLoggedIn) {
        if (isSimulated) {
          // In simulation mode, attempt login or signup, but gracefully bypass on account collisions
          try {
            const authRes = isExistingAccount
              ? await login(cleanEmail, candidatePassword)
              : await signup(cleanName, cleanEmail, cleanMobile, candidatePassword);

            if (authRes?.isBuyer) {
              setIsPaymentSuccess(true);
              setIsProcessing(false);
              return;
            }
          } catch (authErr) {
            console.warn('Simulation pre-auth non-fatal notice:', authErr);
          }
        } else {
          const authRes = isExistingAccount
            ? await login(cleanEmail, candidatePassword)
            : await signup(cleanName, cleanEmail, cleanMobile, candidatePassword);

          if (!authRes.success) {
            if (!isExistingAccount && authRes.error?.toLowerCase().includes('already exists')) {
              setIsExistingAccount(true);
              setErrorMessage('An account with this email already exists. Please enter your existing password to continue.');
              setIsProcessing(false);
              return;
            }
            throw new Error(authRes.error || 'Account setup failed. Please check your credentials.');
          }

          if (authRes.isBuyer) {
            setIsPaymentSuccess(true);
            setIsProcessing(false);
            return;
          }
        }
      }

      // 2. Call server endpoint to create order with authoritative server price for selected pack
      const orderRes = await fetch('/api/store/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: cleanName,
          email: cleanEmail,
          mobile: cleanMobile,
          couponCode: isSimulated ? 'SIMULATE' : (appliedDiscount?.code || ''),
          productId: activeProduct.id,
          examStore: selectedExam
        })
      });

      const orderData = await orderRes.json().catch(() => ({}));

      if (!orderRes.ok || !orderData.success) {
        if (!isSimulated) {
          throw new Error(orderData.error || 'Failed to initiate order. Please try again.');
        }
      }

      // PRIORITY 1: Test Simulation Mode (Instant ₹0 bypass - NEVER redirect to Razorpay)
      const isSimulatedOrder = isSimulated || orderData.isTestMode || orderData.paymentMode === 'test_simulation';
      if (isSimulatedOrder) {
        const simOrderId = orderData.orderId || `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let receivedToken = '';
        try {
          const verifyRes = await fetch('/api/store/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: simOrderId,
              studentName: cleanName,
              email: cleanEmail,
              mobile: cleanMobile,
              productId: activeProduct.id,
              amount: 0,
              couponCode: 'SIMULATE'
            })
          });
          const verifyData = await verifyRes.json().catch(() => ({}));
          if (verifyData.token) {
            receivedToken = verifyData.token;
            try {
              localStorage.setItem('netvidya_auth_token_v1', verifyData.token);
            } catch {}
          }
        } catch (simVerifyErr) {
          console.warn('Simulation server verification non-fatal:', simVerifyErr);
        }

        const enrolledPacksList = activeProduct.id === 'ugc-net-english-bundle'
          ? ['ugc-net-english-bundle', 'ugc-bundle']
          : [activeProduct.id, 'gset-all'];

        loginBuyer({
          name: cleanName,
          email: cleanEmail,
          mobile: cleanMobile,
          orderId: simOrderId,
          token: receivedToken || undefined,
          isBuyer: true,
          enrolledPacks: enrolledPacksList
        });

        setIsProcessing(false);
        setIsPaymentSuccess(true);
        return;
      }

      // 3. Handle GSET WhatsApp Manual Direct Link Flow (if dedicated link isn't configured yet)
      if (orderData.paymentMode === 'gset_manual_contact') {
        setIsProcessing(false);
        setManualWhatsAppInfo({
          url: orderData.whatsappUrl,
          number: orderData.whatsappNumber || '+91 96387 16634',
          message: orderData.message || `Your GSET enrollment request for ₹${finalPayablePrice} has been registered.`
        });
        return;
      }

      // 4. Handle Direct Payment Link Flow (e.g. ₹149 singles, ₹249 combos, or ₹499 UGC NET) - REAL NON-SIMULATED ORDERS ONLY
      const targetPaymentLink = (orderData.paymentMode === 'payment_link' && orderData.paymentLinkUrl)
        ? orderData.paymentLinkUrl
        : (activeProduct.paymentLink && orderData.paymentMode !== 'api_checkout' ? activeProduct.paymentLink : null);

      if (targetPaymentLink) {
        let finalLinkUrl = targetPaymentLink;
        try {
          const u = new URL(targetPaymentLink);
          if (cleanName && !u.searchParams.has('name')) u.searchParams.set('name', cleanName);
          if (cleanEmail && !u.searchParams.has('email')) u.searchParams.set('email', cleanEmail);
          if (cleanMobile && !u.searchParams.has('contact')) u.searchParams.set('contact', cleanMobile);
          if (!u.searchParams.has('notes[product_id]')) u.searchParams.set('notes[product_id]', activeProduct.id);
          if (!u.searchParams.has('notes[product_name]')) u.searchParams.set('notes[product_name]', activeProduct.name);
          finalLinkUrl = u.toString();
        } catch {
          finalLinkUrl = targetPaymentLink;
        }

        setRedirectingUrl(finalLinkUrl);
        try {
          localStorage.setItem('netvidya_pending_checkout', JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            mobile: cleanMobile,
            productId: activeProduct.id,
            productName: activeProduct.name,
            amount: finalPayablePrice,
            orderId: orderData.orderId || `NV_${Date.now()}`
          }));
        } catch {}

        window.location.href = finalLinkUrl;
        return;
      }

      // 5. In-App Razorpay Checkout Popup (Native API Key Mode)
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
          name: 'NET Vidya',
          description: activeProduct.name,
          order_id: orderData.orderId,
          prefill: {
            name: cleanName,
            email: cleanEmail,
            contact: cleanMobile
          },
          theme: {
            color: selectedExam === 'gset' ? '#047857' : '#1E3A8A'
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
                  orderId: orderData.orderId,
                  productId: activeProduct.id,
                  amount: finalPayablePrice
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
                  isBuyer: true,
                  enrolledPacks: activeProduct.id === 'ugc-net-english-bundle'
                    ? ['ugc-net-english-bundle', 'ugc-bundle']
                    : [activeProduct.id, 'gset-all']
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
              setErrorMessage('Payment window was closed. Your selected package and details are preserved—click "Pay & Enroll" below whenever you are ready to complete your enrollment.');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          const desc = resp.error?.description || 'Transaction was declined by your bank or UPI provider.';
          setErrorMessage(`Payment not completed: ${desc}. Your form details are saved—you can retry with Google Pay, PhonePe, UPI QR code, or a different card.`);
          setIsProcessing(false);
        });
        rzp.open();
        return;
      }

      throw new Error('Online payment gateway is temporarily unreachable. Please contact student support.');
    } catch (err: any) {
      if (isSimulated) {
        console.warn('Simulation checkout error, using local fallback:', err);
        loginBuyer({
          name: cleanName,
          email: cleanEmail,
          mobile: cleanMobile,
          orderId: `order_sim_${Date.now()}`,
          isBuyer: true,
          enrolledPacks: activeProduct.id === 'ugc-net-english-bundle'
            ? ['ugc-net-english-bundle', 'ugc-bundle']
            : [activeProduct.id, 'gset-all']
        });
        setIsProcessing(false);
        setIsPaymentSuccess(true);
        return;
      }

      if (activeProduct?.paymentLink) {
        let fallbackUrl = activeProduct.paymentLink;
        try {
          const u = new URL(activeProduct.paymentLink);
          if (cleanName && !u.searchParams.has('name')) u.searchParams.set('name', cleanName);
          if (cleanEmail && !u.searchParams.has('email')) u.searchParams.set('email', cleanEmail);
          if (cleanMobile && !u.searchParams.has('contact')) u.searchParams.set('contact', cleanMobile);
          u.searchParams.set('notes[product_id]', activeProduct.id);
          u.searchParams.set('notes[product_name]', activeProduct.name);
          fallbackUrl = u.toString();
        } catch {}
        setRedirectingUrl(fallbackUrl);
        try {
          localStorage.setItem('netvidya_pending_checkout', JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            mobile: cleanMobile,
            productId: activeProduct.id,
            productName: activeProduct.name,
            amount: finalPayablePrice,
            orderId: `NV_${Date.now()}`
          }));
        } catch {}
        window.location.href = fallbackUrl;
        return;
      }
      setErrorMessage(err.message || 'Unable to connect to payment gateway.');
      setIsProcessing(false);
    }
  };

  const handleCompleteSuccess = () => {
    onSuccess({
      name: studentName || 'Candidate',
      email: email || '',
      mobile: mobile || '',
      orderId: `NV_${Date.now()}`,
      productId: activeProduct.id
    });
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !redirectingUrl && !isProcessing) onClose();
      }}
      onWheel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      className="fixed inset-0 z-50 overflow-hidden bg-black/65 backdrop-blur-sm p-2 sm:p-4 md:p-6 flex flex-col justify-center items-center overscroll-contain select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
    >
      <div
        onWheel={(e) => {
          if (modalBodyRef.current && !modalBodyRef.current.contains(e.target as Node)) {
            modalBodyRef.current.scrollTop += e.deltaY;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="relative w-full max-w-xl my-auto bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden animate-scale-up overscroll-contain select-text"
      >
        
        {/* Unclippable Top-Right Close Button with absolute anchoring */}
        {!redirectingUrl && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-50 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 shadow-xs border border-gray-200 transition-all cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px]"
            title="Close Checkout (Esc)"
            aria-label="Close Checkout"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Sticky Header with Context Badge */}
        <div className="p-3.5 sm:p-5 border-b border-gray-100 shrink-0 bg-white space-y-1.5">
          <div className="space-y-1 min-w-0 pr-12">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full">
                Official NET Vidya Store
              </span>
              <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                resolvedExam === 'gset' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {resolvedExam === 'gset' ? 'GSET 2026 Examination Pass' : 'UGC NET National Pass'}
              </span>
            </div>
            <h2 id="checkout-modal-title" className="text-sm sm:text-lg font-bold text-gray-900 leading-snug">
              {resolvedExam === 'gset' ? 'GSET 2026 Examination Enrollment' : 'UGC NET English Bundle Enrollment'}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">
              Sold by {STORE_MERCHANT.brandName} • Curated by {STORE_MERCHANT.curatorShort}
            </p>
          </div>
        </div>

        {/* Scrollable Content Body with overscroll containment */}
        <div
          ref={modalBodyRef}
          className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain"
        >

          {/* GSET PACK SELECTION SECTION (Compact 2-Column Duo Grid + Single Paper Row) */}
          {selectedExam === 'gset' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Select Flagship Duo (₹249) or Single Paper (₹149)</span>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                  MAX ₹249
                </span>
              </div>

              {/* 2-Column Grid for Flagship Duos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {gsetDuos.map((pack) => {
                  const isSelected = selectedProductId === pack.id;
                  const isOwned = isPackEnrolled(pack.id, buyerSession);
                  return (
                    <div
                      key={pack.id}
                      onClick={() => setSelectedProductId(pack.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <input
                            type="radio"
                            name="gset-pack-radio"
                            checked={isSelected}
                            onChange={() => setSelectedProductId(pack.id)}
                            className="text-emerald-600 focus:ring-emerald-500 shrink-0"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {pack.stream === 'english' ? 'ENGLISH DUO' : 'EDUCATION DUO'}
                            </span>
                            {isOwned && (
                              <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                                ✓ ACTIVE
                              </span>
                            )}
                          </div>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                          {pack.shortName}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] text-gray-600 font-medium mt-1">
                          <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{pack.testCountDesc}</span>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-baseline gap-1">
                          <span className="text-base sm:text-lg font-black text-gray-950 font-mono">
                            ₹{pack.price}
                          </span>
                          <span className="text-[10px] text-gray-400 line-through">
                            ₹{pack.originalPrice}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                          SAVE 69%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Single Papers Row */}
              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                  Or Single Paper Specialist Pack (₹149 each)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {gsetSingles.map((pack) => {
                    const isSelected = selectedProductId === pack.id;
                    const isOwned = isPackEnrolled(pack.id, buyerSession);
                    return (
                      <div
                        key={pack.id}
                        onClick={() => setSelectedProductId(pack.id)}
                        className={`p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <input
                              type="radio"
                              name="gset-pack-radio"
                              checked={isSelected}
                              onChange={() => setSelectedProductId(pack.id)}
                              className="text-blue-600 focus:ring-blue-500 shrink-0"
                            />
                            <span className="text-[11px] font-bold text-gray-900 truncate">
                              {pack.stream === 'general' ? 'Paper 1 (General)' : pack.stream === 'english' ? 'P2 English' : 'P2 Education'}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold font-mono text-gray-950">₹149</span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5 ml-4">
                          {pack.testCountDesc}
                        </p>
                        {isOwned && (
                          <span className="text-[8px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded ml-4 inline-block mt-0.5">
                            ✓ ACTIVE PASS
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* UGC NET SELECTION SECTION */}
          {selectedExam === 'ugc' && (
            <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[9px] font-mono uppercase bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded border border-blue-200">
                    NATIONAL PASS
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-blue-950 leading-snug">
                    UGC NET English Complete Preparation Bundle (2026 Edition)
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-blue-800 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" /> 21 CBT Tests
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-indigo-600" /> 3 Dossiers (347 Pages)
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-lg sm:text-xl font-extrabold text-blue-950 font-serif">
                      ₹499
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 line-through block">₹999</span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                    50% OFF
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC PRICE SUMMARY BANNER */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-gray-900 to-slate-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 pr-3">
              <span className="text-[10px] uppercase font-bold text-blue-300 tracking-wider block truncate">
                Selected: {activeProduct.shortName}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
                  ₹{isAlreadyOwned ? 0 : finalPayablePrice}
                </span>
                <span className="text-xs text-gray-300">INR (Net Payable)</span>
                {isAlreadyOwned ? (
                  <span className="text-xs text-emerald-400 font-bold">
                    (Already Active Pass)
                  </span>
                ) : appliedDiscount && (
                  <span className="text-xs text-emerald-400 font-bold">
                    (₹{appliedDiscount.amount} Off)
                  </span>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right text-xs shrink-0 flex items-center justify-between sm:flex-col sm:items-end gap-2">
              <div>
                <span className="text-[10px] text-gray-400 block">Digital Access Validity</span>
                <strong className="text-white font-semibold">Through 31 Dec 2026</strong>
              </div>
              {isAlreadyOwned ? (
                <button
                  type="button"
                  onClick={handleCompleteSuccess}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open Materials</span>
                </button>
              ) : (finalPayablePrice === 0 || appliedDiscount?.code === 'SIMULATE') && !redirectingUrl && !isPaymentSuccess && (
                <button
                  type="button"
                  onClick={() => handleInitiatePayment()}
                  disabled={isProcessing}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 transition-transform active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Unlocking Pass...' : '⚡ Instant Unlock (₹0)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {/* REDIRECTING URL VIEW */}
          {redirectingUrl ? (
            <div className="py-8 text-center space-y-4 animate-scale-up">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">
                  Connecting to Razorpay Checkout...
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Navigating to secure payment for <strong>₹{finalPayablePrice}</strong> ({activeProduct.shortName}). Once confirmed, you will be redirected to your active student portal.
                </p>
              </div>
              <div className="pt-2">
                <a
                  href={redirectingUrl}
                  className="inline-block px-5 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 transition-colors shadow-sm"
                >
                  Pay ₹{finalPayablePrice} Now →
                </a>
              </div>
            </div>
          ) : manualWhatsAppInfo ? (
            /* GSET MANUAL DIRECT LINK RESOLUTION (WhatsApp Link View) */
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-scale-up">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-emerald-950">
                  GSET Registration Confirmed (₹{finalPayablePrice})
                </h3>
                <p className="text-xs text-emerald-900 leading-relaxed max-w-sm mx-auto">
                  Your seat for <strong>{activeProduct.name}</strong> has been registered. Connect directly on WhatsApp with Dr. Rajnikant Dodiya for instant GSET payment link generation &amp; immediate CBT test activation.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                <a
                  href={manualWhatsAppInfo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Receive Payment Link on WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    loginBuyer({
                      name: studentName,
                      email,
                      mobile,
                      orderId: `NV_GSET_${Date.now()}`,
                      isBuyer: true
                    });
                    setIsPaymentSuccess(true);
                  }}
                  className="text-[11px] text-emerald-800 hover:text-emerald-950 underline font-medium"
                >
                  Already paid? Open My Dashboard
                </button>
              </div>
            </div>
          ) : isPaymentSuccess ? (
            /* PAYMENT SUCCESS CELEBRATION */
            <div className="py-4 text-center space-y-3 animate-scale-up">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-gray-900">
                  Enrollment Active &amp; Verified!
                </h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  Congratulations! Your digital pass for <strong>{activeProduct.name}</strong> is unlocked through 31 Dec 2026.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-left space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Candidate:</span>
                  <strong className="text-gray-900">{studentName}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Registered Email:</span>
                  <strong className="text-gray-900 font-mono">{email}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Enrolled Pack:</span>
                  <strong className="text-gray-900">{activeProduct.shortName}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Amount Paid:</span>
                  <strong className="text-emerald-700 font-bold">₹{finalPayablePrice} INR</strong>
                </div>
                <div className="flex justify-between text-gray-600 items-center">
                  <span>Enrollment Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> VERIFIED &amp; UNLOCKED
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCompleteSuccess}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Open Student Dashboard &amp; Tests</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors cursor-pointer text-center block"
                >
                  Close Receipt
                </button>
                <p className="text-[11px] text-gray-500">
                  A purchase confirmation email with your dashboard link has also been dispatched to your email.
                </p>
              </div>
            </div>
          ) : isAlreadyOwned ? (
            /* ENROLLMENT ALREADY ACTIVE VIEW (REPAYMENT SHIELD) */
            <div className="py-4 text-center space-y-4 animate-scale-up">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full inline-block">
                  ALREADY ENROLLED &amp; ACTIVE
                </span>
                <h3 className="text-lg font-extrabold text-gray-900">
                  You Already Own This Pack!
                </h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                  You already have an active student pass for <strong>{activeProduct.name}</strong> unlocked through <strong>31 Dec 2026</strong>. You do not need to pay again.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-left space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Candidate:</span>
                  <strong className="text-gray-900">{buyerSession.name || studentName || 'Scholar Candidate'}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Registered Email:</span>
                  <strong className="text-gray-900 font-mono">{buyerSession.email || email}</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Enrolled Pack:</span>
                  <strong className="text-gray-900">{activeProduct.shortName}</strong>
                </div>
                <div className="flex justify-between text-gray-600 items-center">
                  <span>Access Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> ACTIVE &amp; UNLOCKED
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCompleteSuccess}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Open Student Dashboard &amp; Tests</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors cursor-pointer text-center block"
                >
                  ← Return to Store
                </button>
              </div>
            </div>
          ) : (
            /* CANDIDATE REGISTRATION & PAYMENT FORM */
            <form id="candidate-checkout-form" onSubmit={handleInitiatePayment} className="space-y-3.5">
              {buyerSession.isLoggedIn ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">Signed in as: <strong className="text-emerald-950">{buyerSession.email}</strong></span>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded shrink-0">
                    Verified Candidate
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Candidate Account Required</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed text-[11px]">
                    Create your portal password below or sign in to link your study materials and CBT test access directly to your student account.
                  </p>
                </div>
              )}
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
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
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
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                />
                <span className="text-[10px] text-gray-500 mt-0.5 block">
                  Official enrollment receipt and student pass will be dispatched here.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  WhatsApp / Mobile Number *
                </label>
                <div className="flex">
                  <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-xs font-semibold text-gray-600 flex items-center">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2 rounded-r-xl border border-gray-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none font-mono"
                  />
                </div>
              </div>

              {/* Password Setup for seamless Student Portal sign-in */}
              {!buyerSession.isLoggedIn && (
                <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200 space-y-1.5">
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
                      className="text-[10px] text-blue-700 hover:text-blue-900 font-semibold underline"
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
                    placeholder={isExistingAccount ? 'Enter existing password' : 'Set a password (min 6 characters)'}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>
              )}

              {/* Scholarship / Referral Code & Simulation Mode */}
              <div className="bg-gray-50 p-2.5 sm:p-3 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">Scholarship / Referral Code</span>
                  <span className="text-[10px] text-gray-400 font-mono">Optional</span>
                </div>

                {appliedDiscount ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>{appliedDiscount.code}</strong>: {appliedDiscount.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] text-rose-600 hover:text-rose-800 underline font-medium cursor-pointer shrink-0 ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                        placeholder="e.g. GSET50 or NET100"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-600 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Method A: Dedicated 1-Click Payment Simulation Button (STRICTLY LOCALHOST ONLY) */}
                    {typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <strong className="text-amber-950 font-bold block text-[11px]">Local Dev Testing:</strong>
                            <span className="text-[10px] text-amber-800 leading-tight block">Simulate paying ₹0 on localhost</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!studentName.trim()) setStudentName('Scholar Tester');
                            if (!email.trim()) setEmail('scholar.test@example.com');
                            if (!mobile.trim()) setMobile('9876543210');
                            if (!password) setPassword('testpass123');
                            setCouponCode('SIMULATE');
                            setCouponError(null);
                            const sim = STORE_PAYMENT_DEFAULTS.validCoupons['SIMULATE'];
                            if (sim) {
                              setAppliedDiscount({ code: 'SIMULATE', ...sim });
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-all shadow-2xs shrink-0 cursor-pointer"
                        >
                          ⚡ 1-Click Simulate (₹0)
                        </button>
                      </div>
                    )}
                  </>
                )}
                {couponError && (
                  <p className="text-[10px] text-rose-600 font-medium">
                    {couponError}
                  </p>
                )}
              </div>

              {/* Pay Trigger Button */}
              <div className="pt-1 space-y-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${
                    appliedDiscount?.code === 'SIMULATE'
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white'
                      : selectedExam === 'gset'
                      ? 'bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white'
                      : 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{appliedDiscount?.code === 'SIMULATE' ? 'Simulating ₹0 Payment...' : 'Connecting to Payment Gateway...'}</span>
                    </>
                  ) : appliedDiscount?.code === 'SIMULATE' ? (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Simulate ₹0 Payment &amp; Unlock Dashboard Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-white/80" />
                      <span>
                        Pay ₹{finalPayablePrice} INR • Enroll in {activeProduct.shortName}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2 text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors cursor-pointer text-center block"
                >
                  ← Cancel and Return to Store
                </button>
              </div>
            </form>
          )}

        </div>

        {/* PERSISTENT STICKY E-COMMERCE ACTION BAR */}
        {!redirectingUrl && !manualWhatsAppInfo && !isPaymentSuccess && (
          <div className="p-3 sm:p-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 border-t border-slate-800 shrink-0 shadow-lg">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-blue-300 tracking-wider uppercase block truncate">
                {activeProduct.shortName}
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-black font-mono text-white">
                  ₹{isAlreadyOwned ? 0 : finalPayablePrice}
                </span>
                <span className="text-[10px] text-gray-400">
                  {isAlreadyOwned ? '(Active)' : 'Net Payable'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isAlreadyOwned ? (
                <button
                  type="button"
                  onClick={handleCompleteSuccess}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Materials</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  form="candidate-checkout-form"
                  disabled={isProcessing}
                  className="py-2.5 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all hover:scale-[1.01]"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : appliedDiscount?.code === 'SIMULATE' || finalPayablePrice === 0 ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>⚡ Instant Unlock (₹0)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Pay ₹{finalPayablePrice} &amp; Enroll</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Sticky Pinned Footer with Trust Badges & Policies */}
        <div className="p-3 sm:p-3.5 bg-gray-50 border-t border-gray-100 shrink-0 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-500">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Razorpay Verified</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span>Valid Through 31 Dec 2026</span>
            </div>
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
