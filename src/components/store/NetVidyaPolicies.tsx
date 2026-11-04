import React, { useState } from 'react';
import { ShieldCheck, FileText, RotateCcw, Truck, Mail, Phone, ChevronRight } from 'lucide-react';

export type PolicyTab = 'terms' | 'privacy' | 'refund' | 'delivery' | 'contact';

interface NetVidyaPoliciesProps {
  initialTab?: PolicyTab;
  isOpen?: boolean;
  onClose?: () => void;
}

export const NetVidyaPolicies: React.FC<NetVidyaPoliciesProps> = ({
  initialTab = 'terms',
  isOpen = true,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <span className="text-xs font-mono uppercase font-bold text-blue-700 tracking-wider">
          Legal & Compliance
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
          Store Policies & Commercial Disclosures
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Sold by NET Vidya (Proprietor: Nilam Dodiya) • Academic Direction by Dr. Rajnikant S. Dodiya
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs sm:text-sm border-b border-gray-200">
        {[
          { id: 'terms', label: 'Terms & Conditions', icon: FileText },
          { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
          { id: 'refund', label: 'Refund Policy', icon: RotateCcw },
          { id: 'delivery', label: 'Digital Delivery', icon: Truck },
          { id: 'contact', label: 'Contact Us', icon: Mail }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as PolicyTab)}
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
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm text-xs sm:text-sm text-gray-700 leading-relaxed space-y-4">
        
        {/* TAB 1: Terms & Conditions */}
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">1. Terms of Enrollment & Digital Access</h2>
            <p>
              Welcome to <strong>NET Vidya English</strong>. By purchasing or accessing the <em>"GSET + UGC NET English Final Pack 2026"</em>, you agree to be bound by the terms outlined below:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Single Candidate License:</strong> Each purchase entitles one individual student to access the Test Hall and download reading materials for personal study. Sharing credentials, redistributing PDFs, or publicizing test keys is strictly prohibited.
              </li>
              <li>
                <strong>Access Duration:</strong> All enrolled students receive uninterrupted access to the Test Hall and reading materials through <strong>31 December 2026</strong>.
              </li>
              <li>
                <strong>Intellectual Property:</strong> All pedagogical content, test questions, rationales, and study materials are the copyrighted intellectual property of NET Vidya and Dr. Rajnikant S. Dodiya.
              </li>
              <li>
                <strong>Technical Requirements:</strong> Online mock exams require a modern web browser (Chrome, Edge, Safari, Firefox) on mobile, tablet, or desktop devices with internet connectivity.
              </li>
            </ul>
          </div>
        )}

        {/* TAB 2: Privacy Policy */}
        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">2. Privacy & Data Protection Policy</h2>
            <p>
              NET Vidya respects candidate privacy and is committed to protecting your personal information:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Information Collected:</strong> We collect your full name, email address, and mobile number solely for account authentication, purchase verification, and delivering your access pass.
              </li>
              <li>
                <strong>Payment Security:</strong> Payment transactions are handled directly through Razorpay’s PCI-DSS compliant secure infrastructure. NET Vidya never stores your credit/debit card numbers, CVVs, or UPI PINs on our servers.
              </li>
              <li>
                <strong>Zero Commercial Selling:</strong> We do not sell, rent, or trade student telephone numbers or email addresses to third-party telemarketers or advertisers.
              </li>
            </ul>
          </div>
        )}

        {/* TAB 3: Refund Policy */}
        {activeTab === 'refund' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">3. Cancellation & Refund Policy</h2>
            <p>
              We believe in transparent and student-friendly policies for our academic preparation packages:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Technical Malfunction Guarantee:</strong> If a technical failure prevents you from accessing your Test Hall or reading files within 48 hours of purchase, and our support team is unable to resolve it, you are entitled to a 100% refund.
              </li>
              <li>
                <strong>Refund Requests:</strong> To request a refund, email <strong>netvidyaenglish@gmail.com</strong> with your Razorpay Payment ID and registered email within 48 hours of enrollment.
              </li>
              <li>
                <strong>Processing Time:</strong> Approved refunds are credited back to the original source account (UPI / bank card) within 5–7 business days per banking standards.
              </li>
            </ul>
          </div>
        )}

        {/* TAB 4: Digital Delivery Policy */}
        {activeTab === 'delivery' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">4. Digital Delivery & Access Policy</h2>
            <p>
              Because the <em>"GSET + UGC NET English Final Pack 2026"</em> is a 100% digital educational service, there are no physical courier shipments:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Instant Electronic Activation:</strong> Upon successful payment completion, your account is activated instantly, and your browser redirects to <strong>My Dashboard</strong>.
              </li>
              <li>
                <strong>Confirmation Email:</strong> A confirmation email containing your direct dashboard login link is dispatched immediately to your registered email address.
              </li>
              <li>
                <strong>Shipping Costs:</strong> ₹0.00 (Zero shipping fees for all digital deliverables).
              </li>
            </ul>
          </div>
        )}

        {/* TAB 5: Contact Us */}
        {activeTab === 'contact' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">5. Merchant & Support Contact Information</h2>
            <p>
              For enrollment assistance, UPI verification, or academic store inquiries, reach out directly to NET Vidya:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Commercial Merchant</span>
                <strong className="text-sm font-bold text-gray-900 block">NET Vidya</strong>
                <p className="text-xs text-gray-600">Proprietor: Nilam Dodiya</p>
                <p className="text-xs text-gray-600">Educational Publisher & Study Services</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Contact Channels</span>
                <p className="text-xs text-gray-800 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-700" />
                  <span>netvidyaenglish@gmail.com</span>
                </p>
                <p className="text-xs text-gray-800 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-700" />
                  <span>+91 98251 23456 (WhatsApp & Call)</span>
                </p>
                <p className="text-xs text-gray-500">Support Hours: 9:00 AM – 8:00 PM IST</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {onClose && (
        <div className="text-center pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors"
          >
            Close Policies
          </button>
        </div>
      )}
    </div>
  );
};
