import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, RotateCcw, Truck, Mail, Phone, X } from 'lucide-react';
import { STORE_MERCHANT, STORE_POLICIES } from '../../config/storeConfig';

export type PolicyTab = 'terms' | 'privacy' | 'refund' | 'delivery' | 'contact';

interface NetVidyaPoliciesProps {
  initialTab?: PolicyTab;
  isOpen?: boolean;
  onClose?: () => void;
  asModal?: boolean;
}

const POLICY_TABS: { id: PolicyTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'terms', label: 'Terms & Conditions', icon: FileText },
  { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
  { id: 'refund', label: 'Refund Policy', icon: RotateCcw },
  { id: 'delivery', label: 'Digital Delivery', icon: Truck },
  { id: 'contact', label: 'Contact Us', icon: Mail }
];

const SECTION_HEADINGS: Record<PolicyTab, string> = {
  terms: STORE_POLICIES.terms?.heading || '1. Terms & Conditions',
  privacy: STORE_POLICIES.privacy?.heading || '2. Privacy Policy',
  refund: '3. Cancellation & Refund Policy',
  delivery: '4. Digital Delivery Policy',
  contact: '5. Merchant & Support Contact Information'
};

export const NetVidyaPolicies: React.FC<NetVidyaPoliciesProps> = ({
  initialTab = 'terms',
  isOpen = true,
  onClose,
  asModal = false
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  // Sync whenever caller clicks a different footer policy link while open
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const activePolicy = STORE_POLICIES[activeTab];

  const innerContent = (
    <div className={asModal ? 'space-y-5' : 'max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6'}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase font-bold text-blue-700 tracking-wider">
            Legal & Compliance
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            Store Policies & Commercial Disclosures
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {STORE_MERCHANT.sellerLine}
          </p>
        </div>
        {asModal && onClose && (
          <button
            onClick={onClose}
            aria-label="Close Policies"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs sm:text-sm border-b border-gray-200">
        {POLICY_TABS.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Container */}
      <div className="bg-white rounded-2xl p-5 sm:p-8 border border-gray-200 shadow-sm text-xs sm:text-sm text-gray-700 leading-relaxed space-y-4">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">{SECTION_HEADINGS[activeTab]}</h2>
          <p>{activePolicy.intro}</p>

          {activeTab !== 'contact' && activePolicy.bullets && (
            <ul className="list-disc pl-5 space-y-2">
              {activePolicy.bullets.map((bullet, idx) => (
                <li key={idx}>
                  <strong>{bullet.title}:</strong> {bullet.text}
                </li>
              ))}
            </ul>
          )}

          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
                  Commercial Merchant
                </span>
                <strong className="text-sm font-bold text-gray-900 block">
                  {STORE_MERCHANT.brandName}
                </strong>
                <p className="text-xs text-gray-600">Proprietor: {STORE_MERCHANT.proprietor}</p>
                <p className="text-xs text-gray-600">Academic Content: {STORE_MERCHANT.curator}</p>
                <p className="text-xs text-gray-600">Educational Publisher & Digital Study Services</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">
                  Contact Channels
                </span>
                <p className="text-xs text-gray-800 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>{STORE_MERCHANT.supportEmail || 'netvidyaenglish@gmail.com'}</span>
                </p>
                <p className="text-xs text-gray-800 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>{STORE_MERCHANT.supportPhone} (WhatsApp & Call)</span>
                </p>
                <p className="text-xs text-gray-500">Support Hours: {STORE_MERCHANT.supportHours}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {onClose && (
        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors"
          >
            {asModal ? 'Close' : 'Back to Store Overview'}
          </button>
        </div>
      )}
    </div>
  );

  if (asModal) {
    return (
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-fade-in"
      >
        <div className="relative w-full max-w-3xl my-auto bg-[#FAF9F5] rounded-3xl p-4 sm:p-7 shadow-2xl border border-gray-200 max-h-[calc(100dvh-2rem)] overflow-y-auto">
          {innerContent}
        </div>
      </div>
    );
  }

  return innerContent;
};
