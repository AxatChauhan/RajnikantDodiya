import React, { useState, useMemo, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Users,
  DollarSign,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  Search,
  Filter,
  Layers,
  ArrowRight,
  LogOut,
  Mail,
  Copy,
  Check,
  Globe,
  Clock,
  Sparkles,
  BarChart3,
  Calendar,
  X,
  CreditCard,
  FileSpreadsheet,
  Settings,
  ChevronRight,
  TrendingUp,
  Receipt,
  GraduationCap
} from 'lucide-react';
import { useNetVidyaStore, EnrolledBuyerRecord } from '../../contexts/NetVidyaStoreContext';
import { useSiteContent } from '../../contexts/SiteContentContext';
import {
  authenticateAuthorStudio,
  getActiveAuthorStudioSession,
  clearAuthorStudioSession,
  validateMasterPasswordEntropy,
  changeAuthorMasterPassword,
  getAuthorStudioLockoutStatus,
  AuthorStudioSession
} from '../../lib/authorStudioAuth';
import { PROFESSOR_INFO } from '../../data/professorData';
import { ProfessorCrestIcon } from '../common/ProfessorCrestIcon';

export type ErpModule = 'overview' | 'buyers' | 'revenue' | 'pricing' | 'security';

interface AuthorStudioPageProps {
  onExit?: () => void;
  initialModule?: ErpModule;
}

export const AuthorStudioPage: React.FC<AuthorStudioPageProps> = ({
  onExit,
  initialModule = 'overview'
}) => {
  const {
    settings: storeSettings,
    updateSettings: updateStoreSettings,
    buyersRegistry,
    registeredUsers,
    addManualBuyer,
    toggleBuyerAccess,
    exportBuyersToExcel,
    resendConfirmationEmail,
    currentServerPrice,
    isEarlyBirdActive
  } = useNetVidyaStore();

  const { saveAllToProduction, isSyncing, lastSavedAt } = useSiteContent();

  const handleDownloadBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      curator: PROFESSOR_INFO.name,
      storeSettings,
      buyersRegistry,
      version: '2.4.0-erp'
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netvidya_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('ERP system backup downloaded as JSON.');
  };

  // Authentication State
  const [activeSession, setActiveSession] = useState<AuthorStudioSession | null>(() => getActiveAuthorStudioSession());
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);

  // Active ERP Module
  const [activeModule, setActiveModule] = useState<ErpModule>(initialModule);

  // UI Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check Lockout on mount
  useEffect(() => {
    const status = getAuthorStudioLockoutStatus();
    if (status.isLocked) {
      setLockoutMinutes(Math.ceil(status.remainingMs / 60000));
    }
  }, []);

  // 1. AUTHENTICATION HANDLERS
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim() || isAuthenticating) return;

    setIsAuthenticating(true);
    setAuthError(null);

    const result = await authenticateAuthorStudio(passwordInput.trim());
    setIsAuthenticating(false);

    if (result.success && result.session) {
      setActiveSession(result.session);
      setPasswordInput('');
      triggerToast('Welcome Dr. Rajnikant Dodiya. ERP session authenticated.');
    } else {
      setAuthError(result.error || 'Invalid credentials.');
      const status = getAuthorStudioLockoutStatus();
      if (status.isLocked) {
        setLockoutMinutes(Math.ceil(status.remainingMs / 60000));
      }
    }
  };

  const handleLogout = () => {
    clearAuthorStudioSession();
    setActiveSession(null);
    setPasswordInput('');
    triggerToast('ERP session locked.');
  };

  // 2. CANDIDATE REGISTRY FILTERS & SEARCH
  const [buyerSearchQuery, setBuyerSearchQuery] = useState('');
  const [selectedUserTypeFilter, setSelectedUserTypeFilter] = useState<'all' | 'buyers' | 'non_buyers'>('all');
  const [selectedPackFilter, setSelectedPackFilter] = useState<string>('all');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Unified Site Scholars List (Combines Registered Users + Buyers Registry)
  const allScholars = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Registered Users (both bought and not bought)
    registeredUsers.forEach(u => {
      const emailKey = u.email.toLowerCase().trim();
      map.set(emailKey, {
        id: u.id,
        name: u.name || emailKey.split('@')[0],
        email: u.email,
        mobile: u.mobile || '',
        orderId: u.orderId || (u.isBuyer ? 'NV_STUDENT' : '—'),
        amountPaid: u.amountPaid || (u.isBuyer ? 499 : 0),
        paymentMethod: u.isBuyer ? 'Online / Paid Pass' : 'Free Registration',
        enrolledAt: u.enrolledAt,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        isActive: u.isActive !== false,
        isBuyer: Boolean(u.isBuyer),
        enrolledPacks: u.enrolledPacks || (u.isBuyer ? ['ugc-net-english-bundle'] : []),
        packName: u.isBuyer ? 'UGC NET English Bundle' : 'Free Candidate (Not Bought)'
      });
    });

    // 2. Verified Buyers Registry
    buyersRegistry.forEach(b => {
      const emailKey = b.email.toLowerCase().trim();
      const existing = map.get(emailKey);
      map.set(emailKey, {
        id: b.id || existing?.id,
        name: b.name || existing?.name,
        email: b.email,
        mobile: b.mobile || existing?.mobile || '',
        orderId: b.orderId || existing?.orderId || 'NV_ORD',
        amountPaid: b.amountPaid ?? existing?.amountPaid ?? 499,
        paymentMethod: b.paymentMethod || existing?.paymentMethod || 'Razorpay',
        enrolledAt: b.enrolledAt || existing?.enrolledAt || new Date().toISOString(),
        createdAt: existing?.createdAt || b.enrolledAt || new Date().toISOString(),
        lastLoginAt: existing?.lastLoginAt || new Date().toISOString(),
        isActive: b.isActive !== false,
        isBuyer: true,
        enrolledPacks: b.enrolledPacks || existing?.enrolledPacks || ['ugc-net-english-bundle'],
        packName: b.packName || existing?.packName || 'UGC NET English Bundle'
      });
    });

    return Array.from(map.values());
  }, [registeredUsers, buyersRegistry]);

  const totalUsersCount = allScholars.length;
  const buyersCount = allScholars.filter(s => s.isBuyer).length;
  const nonBuyersCount = allScholars.filter(s => !s.isBuyer).length;

  // Filtered Scholars List
  const filteredBuyers = useMemo(() => {
    return allScholars.filter(scholar => {
      // User Type Filter
      if (selectedUserTypeFilter === 'buyers' && !scholar.isBuyer) return false;
      if (selectedUserTypeFilter === 'non_buyers' && scholar.isBuyer) return false;

      // Search Query
      const q = buyerSearchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        (scholar.name && scholar.name.toLowerCase().includes(q)) ||
        (scholar.email && scholar.email.toLowerCase().includes(q)) ||
        (scholar.mobile && scholar.mobile.includes(q)) ||
        (scholar.orderId && scholar.orderId.toLowerCase().includes(q));

      // Pack Filter
      let matchesPack = true;
      if (selectedPackFilter !== 'all') {
        if (!scholar.isBuyer) {
          matchesPack = false;
        } else if (selectedPackFilter === 'ugc') {
          matchesPack = !scholar.enrolledPacks || scholar.enrolledPacks.includes('ugc-net-english-bundle') || scholar.packName?.includes('UGC');
        } else if (selectedPackFilter === 'gset-combo') {
          matchesPack = Boolean(scholar.enrolledPacks?.includes('gset-english-combo') || scholar.packName?.includes('Combo') || scholar.packName?.includes('Duo'));
        } else if (selectedPackFilter === 'gset-p1') {
          matchesPack = Boolean(scholar.enrolledPacks?.includes('gset-paper1') || scholar.packName?.includes('Paper 1'));
        } else if (selectedPackFilter === 'gset-p2-eng') {
          matchesPack = Boolean(scholar.enrolledPacks?.includes('gset-paper2-english') || scholar.packName?.includes('Paper 2 English'));
        } else if (selectedPackFilter === 'gset-p2-edu') {
          matchesPack = Boolean(scholar.enrolledPacks?.includes('gset-paper2-education') || scholar.packName?.includes('Education'));
        }
      }

      // Payment Filter
      let matchesPayment = true;
      if (selectedPaymentFilter !== 'all') {
        const mode = (scholar.paymentMethod || '').toLowerCase();
        if (selectedPaymentFilter === 'razorpay') {
          matchesPayment = mode.includes('razorpay') || mode.includes('online');
        } else if (selectedPaymentFilter === 'upi') {
          matchesPayment = mode.includes('upi') || mode.includes('manual');
        } else if (selectedPaymentFilter === 'simulation') {
          matchesPayment = mode.includes('sim') || mode.includes('test');
        }
      }

      // Status Filter
      let matchesStatus = true;
      if (selectedStatusFilter === 'active') matchesStatus = scholar.isActive;
      if (selectedStatusFilter === 'revoked') matchesStatus = !scholar.isActive;

      return matchesSearch && matchesPack && matchesPayment && matchesStatus;
    });
  }, [allScholars, selectedUserTypeFilter, buyerSearchQuery, selectedPackFilter, selectedPaymentFilter, selectedStatusFilter]);

  // 3. FINANCIAL CALCULATIONS
  const financialSummary = useMemo(() => {
    let grossRevenue = 0;
    let netActiveRevenue = 0;
    let ugcRevenue = 0;
    let ugcCount = 0;
    let gsetComboRevenue = 0;
    let gsetComboCount = 0;
    let gsetP1Revenue = 0;
    let gsetP1Count = 0;
    let gsetOtherRevenue = 0;
    let gsetOtherCount = 0;
    let upiCount = 0;
    let razorpayCount = 0;
    let simCount = 0;

    buyersRegistry.forEach(b => {
      const amount = Number(b.amountPaid) || 0;
      grossRevenue += amount;
      if (b.isActive) netActiveRevenue += amount;

      const pMethod = (b.paymentMethod || '').toLowerCase();
      if (pMethod.includes('upi') || pMethod.includes('manual')) upiCount++;
      else if (pMethod.includes('sim') || pMethod.includes('test')) simCount++;
      else razorpayCount++;

      const pack = (b.packName || '').toLowerCase();
      const packs = b.enrolledPacks || [];

      if (packs.includes('gset-english-combo') || pack.includes('combo') || pack.includes('duo')) {
        gsetComboRevenue += amount;
        gsetComboCount++;
      } else if (packs.includes('gset-paper1') || pack.includes('paper 1')) {
        gsetP1Revenue += amount;
        gsetP1Count++;
      } else if (packs.includes('gset-paper2-education') || pack.includes('education')) {
        gsetOtherRevenue += amount;
        gsetOtherCount++;
      } else {
        ugcRevenue += amount;
        ugcCount++;
      }
    });

    const averageOrderValue = buyersRegistry.length > 0 ? Math.round(grossRevenue / buyersRegistry.length) : 0;
    const estimatedGatewayFees = Math.round(grossRevenue * 0.02); // ~2% standard Razorpay rate
    const estimatedNetProfit = grossRevenue - estimatedGatewayFees;

    return {
      grossRevenue,
      netActiveRevenue,
      averageOrderValue,
      estimatedGatewayFees,
      estimatedNetProfit,
      totalCount: buyersRegistry.length,
      activeCount: buyersRegistry.filter(b => b.isActive).length,
      revokedCount: buyersRegistry.filter(b => !b.isActive).length,
      ugc: { count: ugcCount, revenue: ugcRevenue },
      gsetCombo: { count: gsetComboCount, revenue: gsetComboRevenue },
      gsetP1: { count: gsetP1Count, revenue: gsetP1Revenue },
      gsetOther: { count: gsetOtherCount, revenue: gsetOtherRevenue },
      modes: { upi: upiCount, razorpay: razorpayCount, sim: simCount }
    };
  }, [buyersRegistry]);

  // Copy Order ID
  const handleCopyOrderId = (orderId: string) => {
    navigator.clipboard?.writeText(orderId);
    setCopiedOrderId(orderId);
    setTimeout(() => setCopiedOrderId(null), 2000);
    triggerToast(`Order ID copied: ${orderId}`);
  };

  // Manual Candidate Form State
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    mobile: '',
    amountPaid: currentServerPrice,
    packType: 'ugc-net-english-bundle',
    paymentMethod: 'manual_upi'
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name.trim() || !manualForm.email.trim()) {
      triggerToast('Please provide student name and email.');
      return;
    }

    let packName = 'UGC NET English Complete Bundle';
    let enrolledPacks = ['ugc-net-english-bundle'];

    if (manualForm.packType === 'gset-english-combo') {
      packName = 'GSET English Scholar Duo (Paper 1 + English)';
      enrolledPacks = ['gset-english-combo', 'gset-paper1', 'gset-paper2-english'];
    } else if (manualForm.packType === 'gset-paper1') {
      packName = 'GSET Paper 1: General Aptitude';
      enrolledPacks = ['gset-paper1'];
    } else if (manualForm.packType === 'gset-paper2-education') {
      packName = 'GSET Paper 2: Education Discipline';
      enrolledPacks = ['gset-paper2-education'];
    }

    addManualBuyer({
      name: manualForm.name,
      email: manualForm.email,
      mobile: manualForm.mobile,
      amountPaid: Number(manualForm.amountPaid) || currentServerPrice,
      packName,
      enrolledPacks,
      paymentMethod: manualForm.paymentMethod
    });

    setIsManualModalOpen(false);
    setManualForm({
      name: '',
      email: '',
      mobile: '',
      amountPaid: currentServerPrice,
      packType: 'ugc-net-english-bundle',
      paymentMethod: 'manual_upi'
    });
    triggerToast(`Scholar ${manualForm.name} enrolled successfully!`);
  };

  // Pricing Form State
  const [pricingForm, setPricingForm] = useState({
    earlyBirdPrice: storeSettings?.earlyBirdPrice || 499,
    standardPrice: storeSettings?.standardPrice || 999,
    gsetSinglePrice: 149,
    gsetComboPrice: 249,
    earlyBirdCutoff: storeSettings?.earlyBirdCutoff || '2026-11-20T23:59:59+05:30'
  });

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    if (updateStoreSettings) {
      updateStoreSettings({
        earlyBirdPrice: Number(pricingForm.earlyBirdPrice),
        standardPrice: Number(pricingForm.standardPrice),
        earlyBirdCutoff: pricingForm.earlyBirdCutoff
      });
    }
    triggerToast('Pricing rules and cutoff dates saved.');
  };

  // Security Master Password Form
  const [currentPwInput, setCurrentPwInput] = useState('');
  const [newPwInput, setNewPwInput] = useState('');
  const [confirmPwInput, setConfirmPwInput] = useState('');
  const [pwChangeFeedback, setPwChangeFeedback] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPwInput || !newPwInput || !confirmPwInput) {
      setPwChangeFeedback('All password fields are required.');
      return;
    }
    if (newPwInput !== confirmPwInput) {
      setPwChangeFeedback('New passwords do not match.');
      return;
    }

    const entropy = validateMasterPasswordEntropy(newPwInput);
    if (!entropy.isValid) {
      setPwChangeFeedback(entropy.errors[0] || 'Password does not meet enterprise complexity requirements.');
      return;
    }

    const email = PROFESSOR_INFO.email;
    const res = await changeAuthorMasterPassword(email, currentPwInput, newPwInput);
    if (res.success) {
      setPwChangeFeedback('Master Studio password updated successfully.');
      setCurrentPwInput('');
      setNewPwInput('');
      setConfirmPwInput('');
      triggerToast('Master password updated.');
    } else {
      setPwChangeFeedback(res.error || 'Failed to update password.');
    }
  };

  // Exit back to website
  const handleExit = () => {
    if (onExit) {
      onExit();
    } else if (typeof window !== 'undefined') {
      window.location.hash = '#home';
    }
  };

  const handleExitToStore = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '#store';
    }
  };

  // =========================================================================
  // SCREEN 1: AIR-GAPPED MASTER SECURITY LOGIN GATE
  // =========================================================================
  if (!activeSession) {
    return (
      <div className="min-h-screen bg-[#070B19] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans">
        {/* Top Minimal Branding */}
        <header className="p-4 sm:p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center font-serif text-white font-bold shadow-md border border-blue-500/30">
              RD
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>NET Vidya Studio ERP</span>
                <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">
                  v2.4 Enterprise
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">
                Author &amp; Commercial Operations Command Center
              </p>
            </div>
          </div>

          <button
            onClick={handleExit}
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Exit to Website</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </header>

        {/* Center Auth Card */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                <Shield className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Master Administrator Gate
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Authorized access exclusively for Dr. Rajnikant S. Dodiya to manage student enrollment, revenue, and store operations.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            {lockoutMinutes > 0 ? (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-xs space-y-2 text-center">
                <Lock className="w-6 h-6 mx-auto text-amber-400" />
                <p className="font-bold">Security Lockout Active</p>
                <p>Too many failed attempts. Please retry in {lockoutMinutes} minutes.</p>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Master Password / Studio PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter studio master password..."
                      autoFocus
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating || !passwordInput.trim()}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isAuthenticating ? 'Verifying Credentials...' : 'Unlock ERP Dashboard'}</span>
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-slate-800/80 text-center">
              <span className="text-[11px] font-mono text-slate-500">
                Encrypted Session • Air-Gapped Master Hash
              </span>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center text-xs text-slate-500 border-t border-slate-800/80">
          <span>Dr. Rajnikant Dodiya • Official ERP Administration</span>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 2: FULL-PAGE ENTERPRISE ERP DASHBOARD WORKSPACE
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#070B19] text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-blue-600 selection:text-white">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fade-in border border-blue-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 1. ENTERPRISE ERP LEFT SIDEBAR                                    */}
      {/* ----------------------------------------------------------------- */}
      <aside className="w-full lg:w-64 bg-[#0D1326] border-r border-slate-800 shrink-0 flex flex-col justify-between">
        
        {/* Sidebar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center font-serif text-white font-bold shadow-md border border-blue-500/30">
              RD
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate">
                Dr. Rajnikant Dodiya
              </h2>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-semibold">
                ERP Admin
              </span>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Live Revenue:</span>
            <strong className="text-emerald-400 font-bold">₹{financialSummary.grossRevenue.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="p-3 sm:p-4 space-y-1 flex-1 overflow-y-auto">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold px-3 py-1">
            Executive ERP Modules
          </div>

          <button
            onClick={() => setActiveModule('overview')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'overview'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>Overview &amp; KPIs</span>
            </span>
          </button>

          <button
            onClick={() => setActiveModule('buyers')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'buyers'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>All Scholars &amp; Users</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
              activeModule === 'buyers' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
              {totalUsersCount}
            </span>
          </button>

          <button
            onClick={() => setActiveModule('revenue')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'revenue'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Revenue &amp; Analytics</span>
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
              activeModule === 'revenue' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
              ₹{financialSummary.grossRevenue.toLocaleString('en-IN')}
            </span>
          </button>

          <button
            onClick={() => setActiveModule('pricing')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'pricing'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <span>Pricing &amp; Early-Bird</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
              ₹{currentServerPrice}
            </span>
          </button>

          <button
            onClick={() => setActiveModule('security')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeModule === 'security'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-teal-400" />
              <span>Security &amp; Backups</span>
            </span>
          </button>
        </nav>

        {/* Sidebar Bottom Exits */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <button
            onClick={handleExitToStore}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors flex items-center justify-between cursor-pointer border border-slate-800"
          >
            <span className="flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
              <span>Open Storefront</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExit}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors flex items-center justify-between cursor-pointer border border-slate-800"
          >
            <span className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Academic Site</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-xs text-red-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer border border-red-900/50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Studio</span>
          </button>
        </div>
      </aside>

      {/* ----------------------------------------------------------------- */}
      {/* 2. MAIN ERP CONTENT WORKSPACE                                     */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Executive Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#0B1020]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">NET Vidya ERP</span>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <h1 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider font-mono">
              {activeModule === 'overview' && 'Executive Overview & KPIs'}
              {activeModule === 'buyers' && 'Candidate Sales Ledger & Buyers'}
              {activeModule === 'revenue' && 'Revenue & Financial Analytics'}
              {activeModule === 'pricing' && 'Course Pricing & Early-Bird Engine'}
              {activeModule === 'security' && 'Security & System Backups'}
            </h1>
          </div>

          {/* Quick Header CTAs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Enroll Student</span>
            </button>

            <button
              onClick={exportBuyersToExcel}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download OpenXML .xlsx of all buyers"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            <button
              onClick={() => {
                saveAllToProduction();
                triggerToast('ERP state synced to production.');
              }}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-blue-400" />
              <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">

          {/* ============================================================= */}
          {/* MODULE 1: EXECUTIVE OVERVIEW & KPIS                           */}
          {/* ============================================================= */}
          {activeModule === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Row 1: Top 4 KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Metric 1: Total Gross Revenue */}
                <div className="bg-[#0E1528] rounded-2xl p-5 border border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>GROSS REVENUE</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                    ₹{financialSummary.grossRevenue.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Net Active: ₹{financialSummary.netActiveRevenue.toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Metric 2: Total Scholars */}
                <div className="bg-[#0E1528] rounded-2xl p-5 border border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>TOTAL LOGGED-IN USERS</span>
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
                    {totalUsersCount}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    <span className="text-emerald-400 font-bold">{buyersCount} Enrolled (Paid)</span> • <span className="text-blue-300 font-bold">{nonBuyersCount} Free (Not Bought)</span>
                  </p>
                </div>

                {/* Metric 3: Average Order Value */}
                <div className="bg-[#0E1528] rounded-2xl p-5 border border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>AVG ORDER VALUE</span>
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tracking-tight">
                    ₹{financialSummary.averageOrderValue.toLocaleString('en-IN')}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Current Live Fee: ₹{currentServerPrice}
                  </p>
                </div>

                {/* Metric 4: Active Course Packs */}
                <div className="bg-[#0E1528] rounded-2xl p-5 border border-slate-800 shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                    <span>LIVE COURSE PACKS</span>
                    <Layers className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-purple-300 font-mono tracking-tight">
                    4 Packs
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    UGC NET + 3 GSET 2026 Tiers
                  </p>
                </div>

              </div>

              {/* Row 2: Course Pack Sales & Revenue Contribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Pack Revenue Matrix */}
                <div className="bg-[#0E1528] rounded-2xl p-6 border border-slate-800 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      <span>Revenue by Course Pack</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">Collections</span>
                  </div>

                  <div className="space-y-4 text-xs font-medium">
                    {/* UGC NET English */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">UGC NET English Complete Bundle (₹499)</span>
                        <span className="text-white font-mono font-bold">
                          ₹{financialSummary.ugc.revenue.toLocaleString('en-IN')} ({financialSummary.ugc.count} sold)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${financialSummary.grossRevenue > 0 ? (financialSummary.ugc.revenue / financialSummary.grossRevenue) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* GSET English Duo */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">GSET English Scholar Duo Combo (₹249)</span>
                        <span className="text-white font-mono font-bold">
                          ₹{financialSummary.gsetCombo.revenue.toLocaleString('en-IN')} ({financialSummary.gsetCombo.count} sold)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${financialSummary.grossRevenue > 0 ? (financialSummary.gsetCombo.revenue / financialSummary.grossRevenue) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* GSET Paper 1 Foundation */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">GSET Paper 1 General Aptitude (₹149)</span>
                        <span className="text-white font-mono font-bold">
                          ₹{financialSummary.gsetP1.revenue.toLocaleString('en-IN')} ({financialSummary.gsetP1.count} sold)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full"
                          style={{
                            width: `${financialSummary.grossRevenue > 0 ? (financialSummary.gsetP1.revenue / financialSummary.grossRevenue) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* GSET Education Specialist */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-semibold">GSET Paper 2 Education (₹149/₹249)</span>
                        <span className="text-white font-mono font-bold">
                          ₹{financialSummary.gsetOther.revenue.toLocaleString('en-IN')} ({financialSummary.gsetOther.count} sold)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{
                            width: `${financialSummary.grossRevenue > 0 ? (financialSummary.gsetOther.revenue / financialSummary.grossRevenue) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Channels & Gateways */}
                <div className="bg-[#0E1528] rounded-2xl p-6 border border-slate-800 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      <span>Payment Channels &amp; Settlements</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">Channels</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-center">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Razorpay Online</span>
                      <strong className="text-xl font-bold text-blue-400 font-mono">{financialSummary.modes.razorpay}</strong>
                      <span className="text-[10px] text-slate-500 block">Gateway Orders</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-center">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Direct UPI / Cash</span>
                      <strong className="text-xl font-bold text-emerald-400 font-mono">{financialSummary.modes.upi}</strong>
                      <span className="text-[10px] text-slate-500 block">Manual Passes</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-center">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Demo / Testing</span>
                      <strong className="text-xl font-bold text-slate-400 font-mono">{financialSummary.modes.sim}</strong>
                      <span className="text-[10px] text-slate-500 block">Simulation Passes</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Estimated Razorpay Fee (~2%):</span>
                      <span className="text-slate-300 font-mono">₹{financialSummary.estimatedGatewayFees.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Estimated Net Settlement:</span>
                      <span className="text-emerald-400 font-mono font-bold">₹{financialSummary.estimatedNetProfit.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Row 3: Recent Enrollments Activity */}
              <div className="bg-[#0E1528] rounded-2xl p-6 border border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span>Recent Student Purchases</span>
                  </h3>
                  <button
                    onClick={() => setActiveModule('buyers')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All {buyersRegistry.length} Scholars</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {buyersRegistry.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    No buyers recorded yet. Manual enrollments or online purchases will appear here live.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Scholar Candidate</th>
                          <th className="p-3">Enrolled Pack</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Order ID</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {buyersRegistry.slice(0, 5).map((b) => (
                          <tr key={b.id} className="hover:bg-slate-800/40">
                            <td className="p-3 font-semibold text-white">
                              <div>{b.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{b.email}</div>
                            </td>
                            <td className="p-3">
                              <span className="text-[11px] text-slate-300">
                                {b.packName || 'UGC NET English Bundle'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-emerald-400 font-bold">
                              ₹{b.amountPaid || currentServerPrice}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-400">
                              {b.orderId}
                            </td>
                            <td className="p-3 text-[11px] text-slate-400 font-mono">
                              {new Date(b.enrolledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="p-3">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                b.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                              }`}>
                                {b.isActive ? 'Active' : 'Revoked'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ============================================================= */}
          {/* MODULE 2: ALL SCHOLARS & REGISTERED USERS (SALES & LOGGED-IN USERS) */}
          {/* ============================================================= */}
          {activeModule === 'buyers' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Header & Controls Card */}
              <div className="bg-[#0E1528] rounded-2xl p-5 border border-slate-800 shadow-xs space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      <span>All Scholars &amp; Candidate Registry</span>
                      <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-500/30">
                        {totalUsersCount} Total ({buyersCount} Paid • {nonBuyersCount} Free)
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Complete list of students who have logged in or signed up on the site, both verified buyers and registered candidates.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setIsManualModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Grant Manual Pass</span>
                    </button>

                    <button
                      onClick={exportBuyersToExcel}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Export (.xlsx)</span>
                    </button>
                  </div>
                </div>

                {/* Candidate Classification Tabs */}
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => setSelectedUserTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedUserTypeFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    <span>All Logged-in Scholars</span>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">{totalUsersCount}</span>
                  </button>
                  <button
                    onClick={() => setSelectedUserTypeFilter('buyers')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedUserTypeFilter === 'buyers'
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    <span>Enrolled Buyers (Paid)</span>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">{buyersCount}</span>
                  </button>
                  <button
                    onClick={() => setSelectedUserTypeFilter('non_buyers')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                      selectedUserTypeFilter === 'non_buyers'
                        ? 'bg-purple-600 text-white shadow-xs font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    <span>Registered Candidates (Not Bought)</span>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">{nonBuyersCount}</span>
                  </button>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={buyerSearchQuery}
                      onChange={(e) => setBuyerSearchQuery(e.target.value)}
                      placeholder="Search name, email, phone, order ID..."
                      className="w-full pl-8 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                    {buyerSearchQuery && (
                      <button
                        onClick={() => setBuyerSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Course Pack Filter */}
                  <div>
                    <select
                      value={selectedPackFilter}
                      onChange={(e) => setSelectedPackFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    >
                      <option value="all">All Course Packs</option>
                      <option value="ugc">UGC NET English Bundle</option>
                      <option value="gset-combo">GSET English Scholar Duo</option>
                      <option value="gset-p1">GSET Paper 1 General Aptitude</option>
                      <option value="gset-p2-eng">GSET Paper 2 English Specialist</option>
                      <option value="gset-p2-edu">GSET Paper 2 Education Master</option>
                    </select>
                  </div>

                  {/* Payment Mode Filter */}
                  <div>
                    <select
                      value={selectedPaymentFilter}
                      onChange={(e) => setSelectedPaymentFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    >
                      <option value="all">All Payment Modes</option>
                      <option value="razorpay">Razorpay Online Gateway</option>
                      <option value="upi">Direct UPI / Cash Offline</option>
                      <option value="simulation">Testing / Simulation</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    >
                      <option value="all">All Statuses (Active &amp; Revoked)</option>
                      <option value="active">Active Passes Only</option>
                      <option value="revoked">Revoked Passes Only</option>
                    </select>
                  </div>

                </div>

              </div>

              {/* Data Table Card */}
              <div className="bg-[#0E1528] rounded-2xl border border-slate-800 shadow-xs overflow-hidden">
                {filteredBuyers.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <Users className="w-10 h-10 text-slate-600 mx-auto" />
                    <h4 className="text-sm font-bold text-white">No candidate records match your filter</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try clearing search terms or selecting "All Course Packs".
                    </p>
                    <button
                      onClick={() => {
                        setBuyerSearchQuery('');
                        setSelectedPackFilter('all');
                        setSelectedPaymentFilter('all');
                        setSelectedStatusFilter('all');
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-[#121B33] text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="p-3.5">Candidate Name</th>
                          <th className="p-3.5">Contact Details</th>
                          <th className="p-3.5">Enrolled Pack</th>
                          <th className="p-3.5">Paid (₹)</th>
                          <th className="p-3.5">Mode</th>
                          <th className="p-3.5">Order ID</th>
                          <th className="p-3.5">Enrolled At</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-medium">
                        {filteredBuyers.map((b) => (
                          <tr key={b.id || b.email} className="hover:bg-slate-800/30 transition-colors">
                            {/* Candidate Name */}
                            <td className="p-3.5 font-bold text-white whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-lg font-mono font-bold flex items-center justify-center text-[11px] shrink-0 ${
                                  b.isBuyer ? 'bg-blue-600/20 text-blue-300' : 'bg-purple-600/20 text-purple-300'
                                }`}>
                                  {b.name ? b.name.charAt(0).toUpperCase() : 'C'}
                                </div>
                                <div>
                                  <div>{b.name}</div>
                                  {!b.isBuyer && (
                                    <span className="text-[9px] uppercase tracking-wider font-mono text-purple-300 bg-purple-950/60 border border-purple-800/50 px-1.5 py-0.2 rounded">
                                      Free Account
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Contact Details */}
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="font-mono text-slate-300">{b.email}</div>
                              <div className="font-mono text-[11px] text-slate-500">{b.mobile || '—'}</div>
                            </td>

                            {/* Enrolled Pack */}
                            <td className="p-3.5 whitespace-nowrap">
                              <span className={`font-medium ${b.isBuyer ? 'text-slate-200' : 'text-slate-400 italic'}`}>
                                {b.isBuyer ? (b.packName || 'UGC NET English Bundle') : '— (Free Candidate)'}
                              </span>
                            </td>

                            {/* Amount Paid */}
                            <td className="p-3.5 font-mono whitespace-nowrap">
                              {b.isBuyer ? (
                                <span className="text-emerald-400 font-bold">₹{b.amountPaid || currentServerPrice}</span>
                              ) : (
                                <span className="text-slate-500 font-bold">₹0</span>
                              )}
                            </td>

                            {/* Payment Mode */}
                            <td className="p-3.5 whitespace-nowrap">
                              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                                !b.isBuyer
                                  ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                  : (b.paymentMethod || '').includes('upi') || (b.paymentMethod || '').includes('manual')
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : (b.paymentMethod || '').includes('sim')
                                  ? 'bg-slate-700 text-slate-300 border border-slate-600'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {b.isBuyer ? (b.paymentMethod || 'razorpay').replace('_', ' ') : 'Free Candidate'}
                              </span>
                            </td>

                            {/* Order ID */}
                            <td className="p-3.5 font-mono text-[11px] whitespace-nowrap text-slate-400">
                              {b.isBuyer && b.orderId && b.orderId !== '—' ? (
                                <button
                                  onClick={() => handleCopyOrderId(b.orderId)}
                                  className="hover:text-white flex items-center gap-1 group cursor-pointer"
                                  title="Click to copy Order ID"
                                >
                                  <span>{b.orderId}</span>
                                  {copiedOrderId === b.orderId ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </button>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>

                            {/* Enrolled Timestamp */}
                            <td className="p-3.5 font-mono text-[11px] whitespace-nowrap text-slate-400">
                              {b.enrolledAt ? new Date(b.enrolledAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) : (b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) : '—')}
                            </td>

                            {/* Status */}
                            <td className="p-3.5 whitespace-nowrap">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                                !b.isBuyer
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : b.isActive
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}>
                                {!b.isBuyer ? 'Logged In • Free' : (b.isActive ? 'Active Pass' : 'Revoked')}
                              </span>
                            </td>

                            {/* Actions Menu */}
                            <td className="p-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {b.isBuyer ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        toggleBuyerAccess(b.id);
                                        triggerToast(`Candidate access ${b.isActive ? 'revoked' : 'restored'}.`);
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
                                        b.isActive
                                          ? 'border-amber-700/60 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40'
                                          : 'border-emerald-700/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40'
                                      }`}
                                      title={b.isActive ? 'Revoke Pass Access' : 'Restore Pass Access'}
                                    >
                                      {b.isActive ? 'Revoke' : 'Restore'}
                                    </button>

                                    <button
                                      onClick={() => {
                                        resendConfirmationEmail(b.id);
                                        triggerToast(`Receipt resent to ${b.email}`);
                                      }}
                                      className="p-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                      title="Resend Confirmation Receipt Email"
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setManualForm({
                                        name: b.name || '',
                                        email: b.email,
                                        mobile: b.mobile || '',
                                        amountPaid: currentServerPrice,
                                        packType: 'ugc-net-english-bundle',
                                        paymentMethod: 'manual_upi'
                                      });
                                      setIsManualModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-emerald-700/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 flex items-center gap-1"
                                    title="Grant manual access pass to this registered candidate"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Grant Pass</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Table Footer Summary */}
                <div className="p-4 bg-[#121B33] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
                  <div>
                    Showing <strong className="text-white">{filteredBuyers.length}</strong> of {totalUsersCount} total registered scholars ({buyersCount} Enrolled Buyers • {nonBuyersCount} Free Candidates)
                  </div>
                  <div className="flex items-center gap-4">
                    <span>Enrolled: <strong className="text-emerald-400">{buyersCount}</strong></span>
                    <span>Free: <strong className="text-purple-400">{nonBuyersCount}</strong></span>
                    <span>Filtered Active: <strong className="text-emerald-400">{filteredBuyers.filter(b => b.isActive).length}</strong></span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================= */}
          {/* MODULE 3: REVENUE & FINANCIAL ANALYTICS                      */}
          {/* ============================================================= */}
          {activeModule === 'revenue' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Financial KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0E1528] rounded-2xl p-5 border border-slate-800 shadow-xs space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Total Gross Collections</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                    ₹{financialSummary.grossRevenue.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">100% Student Registrations</span>
                </div>

                <div className="bg-[#0E1528] rounded-2xl p-5 border border-slate-800 shadow-xs space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Net Active Value</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono">
                    ₹{financialSummary.netActiveRevenue.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Active Scholar Passes</span>
                </div>

                <div className="bg-[#0E1528] rounded-2xl p-5 border border-slate-800 shadow-xs space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Gateway Processing Fees (~2%)</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                    ₹{financialSummary.estimatedGatewayFees.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Standard Razorpay Take</span>
                </div>

                <div className="bg-[#0E1528] rounded-2xl p-5 border border-slate-800 shadow-xs space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">Net Retained Profit</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-400 font-mono">
                    ₹{financialSummary.estimatedNetProfit.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Gross Collections − Fees</span>
                </div>
              </div>

              {/* Product Revenue Breakdown Table */}
              <div className="bg-[#0E1528] rounded-2xl p-6 border border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>Course Pack Revenue Breakdown</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono font-bold">
                    Total: ₹{financialSummary.grossRevenue.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#121B33] text-slate-400 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Course Pack Title</th>
                        <th className="p-3">Standard Price</th>
                        <th className="p-3">Units Sold</th>
                        <th className="p-3">Gross Revenue</th>
                        <th className="p-3 text-right">Revenue Share (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-medium">
                      <tr>
                        <td className="p-3 text-white font-bold">UGC NET English Complete Bundle (2026)</td>
                        <td className="p-3 font-mono">₹499</td>
                        <td className="p-3 font-mono font-bold text-blue-400">{financialSummary.ugc.count}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">₹{financialSummary.ugc.revenue.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          {financialSummary.grossRevenue > 0 ? ((financialSummary.ugc.revenue / financialSummary.grossRevenue) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 text-white font-bold">GSET English Scholar Duo (Paper 1 + English)</td>
                        <td className="p-3 font-mono">₹249</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">{financialSummary.gsetCombo.count}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">₹{financialSummary.gsetCombo.revenue.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          {financialSummary.grossRevenue > 0 ? ((financialSummary.gsetCombo.revenue / financialSummary.grossRevenue) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 text-white font-bold">GSET Paper 1 General Aptitude Foundation</td>
                        <td className="p-3 font-mono">₹149</td>
                        <td className="p-3 font-mono font-bold text-teal-400">{financialSummary.gsetP1.count}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">₹{financialSummary.gsetP1.revenue.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          {financialSummary.grossRevenue > 0 ? ((financialSummary.gsetP1.revenue / financialSummary.grossRevenue) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 text-white font-bold">GSET Paper 2 Education Specialist</td>
                        <td className="p-3 font-mono">₹149 / ₹249</td>
                        <td className="p-3 font-mono font-bold text-purple-400">{financialSummary.gsetOther.count}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">₹{financialSummary.gsetOther.revenue.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-mono text-slate-400">
                          {financialSummary.grossRevenue > 0 ? ((financialSummary.gsetOther.revenue / financialSummary.grossRevenue) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================= */}
          {/* MODULE 4: COURSE PRICING & EARLY-BIRD ENGINE                 */}
          {/* ============================================================= */}
          {activeModule === 'pricing' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="bg-[#0E1528] rounded-2xl p-6 border border-slate-800 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    <span>Course Pricing &amp; Early-Bird Configuration</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage the live price charged at checkout, early-bird cutoff timer, and GSET pack pricing tiers.
                  </p>
                </div>

                <form onSubmit={handleSavePricing} className="space-y-5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Live Server Price */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300 block">
                        UGC NET English Live Early-Bird Fee (₹)
                      </label>
                      <input
                        type="number"
                        value={pricingForm.earlyBirdPrice}
                        onChange={(e) => setPricingForm({ ...pricingForm, earlyBirdPrice: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[11px] text-slate-500">Currently displayed on storefront: ₹{currentServerPrice}</span>
                    </div>

                    {/* Standard Price */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300 block">
                        Full Catalog Strikethrough Price (₹)
                      </label>
                      <input
                        type="number"
                        value={pricingForm.standardPrice}
                        onChange={(e) => setPricingForm({ ...pricingForm, standardPrice: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[11px] text-slate-500">Original standard price before discount</span>
                    </div>

                    {/* GSET Single Pack Price */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300 block">
                        GSET Single Subject Pack Price (₹)
                      </label>
                      <input
                        type="number"
                        value={pricingForm.gsetSinglePrice}
                        onChange={(e) => setPricingForm({ ...pricingForm, gsetSinglePrice: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[11px] text-slate-500">Fixed rate for Paper 1 or Paper 2 Single (₹149)</span>
                    </div>

                    {/* GSET Combo Duo Price */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300 block">
                        GSET Duo Combo Pack Price (₹)
                      </label>
                      <input
                        type="number"
                        value={pricingForm.gsetComboPrice}
                        onChange={(e) => setPricingForm({ ...pricingForm, gsetComboPrice: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[11px] text-slate-500">Fixed rate for Paper 1 + English Duo (₹249)</span>
                    </div>

                  </div>

                  {/* Early Bird Cutoff Schedule */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <div>
                      <strong className="text-white block">Early-Bird Cutoff Schedule</strong>
                      <span className="text-slate-400 text-[11px]">Enforces early-bird discount banner before this date</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300 block text-xs">
                        Cutoff ISO Timestamp
                      </label>
                      <input
                        type="text"
                        value={pricingForm.earlyBirdCutoff}
                        onChange={(e) => setPricingForm({ ...pricingForm, earlyBirdCutoff: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                      />
                      <span className="text-[11px] text-slate-500">Current status: {isEarlyBirdActive ? 'Active' : 'Expired'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Pricing Rules</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* MODULE 5: SECURITY & SYSTEM BACKUPS                          */}
          {/* ============================================================= */}
          {activeModule === 'security' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              
              {/* Change Master Password */}
              <div className="bg-[#0E1528] rounded-2xl p-6 border border-slate-800 shadow-xs space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-teal-400" />
                    <span>Master Studio Credentials</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Update your air-gapped master studio PIN. This password is never transmitted to students.
                  </p>
                </div>

                {pwChangeFeedback && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    pwChangeFeedback.includes('successfully')
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800'
                      : 'bg-red-950/40 text-red-300 border border-red-800'
                  }`}>
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{pwChangeFeedback}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 block">Current Master Password</label>
                    <input
                      type="password"
                      value={currentPwInput}
                      onChange={(e) => setCurrentPwInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 block">New Master Password</label>
                    <input
                      type="password"
                      value={newPwInput}
                      onChange={(e) => setNewPwInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 block">Confirm New Master Password</label>
                    <input
                      type="password"
                      value={confirmPwInput}
                      onChange={(e) => setConfirmPwInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    Update Master Password
                  </button>
                </form>
              </div>

              {/* 1-Click JSON System Snapshot Backup */}
              <div className="bg-[#0E1528] rounded-2xl p-6 border border-slate-800 shadow-xs space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Download className="w-5 h-5 text-blue-400" />
                    <span>System Backup &amp; JSON Snapshot</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Download an air-gapped cryptographic JSON backup containing all candidate records, settings, and store states.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadBackup}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Complete ERP Snapshot (.json)</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </main>

      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. INLINE MODAL: MANUAL CANDIDATE ENROLLMENT DESK                 */}
      {/* ----------------------------------------------------------------- */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-xs text-slate-300">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Grant Manual Student Pass</span>
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Mobile Number (WhatsApp)</label>
                  <input
                    type="text"
                    value={manualForm.mobile}
                    onChange={(e) => setManualForm({ ...manualForm, mobile: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Enrolled Course Pack</label>
                  <select
                    value={manualForm.packType}
                    onChange={(e) => setManualForm({ ...manualForm, packType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  >
                    <option value="ugc-net-english-bundle">UGC NET English Bundle (₹499)</option>
                    <option value="gset-english-combo">GSET English Scholar Duo (₹249)</option>
                    <option value="gset-paper1">GSET Paper 1 General Aptitude (₹149)</option>
                    <option value="gset-paper2-education">GSET Paper 2 Education (₹149)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Amount Collected (₹)</label>
                  <input
                    type="number"
                    value={manualForm.amountPaid}
                    onChange={(e) => setManualForm({ ...manualForm, amountPaid: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">Payment Method</label>
                <select
                  value={manualForm.paymentMethod}
                  onChange={(e) => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                >
                  <option value="manual_upi">Direct UPI / QR Code</option>
                  <option value="cash_offline">Cash / In-Person</option>
                  <option value="bank_transfer">NEFT / Bank Transfer</option>
                  <option value="scholarship">Scholarship / Free Pass</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Grant Pass Immediately
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
