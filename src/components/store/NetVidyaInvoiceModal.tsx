import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';
import { NetVidyaBuyerSession } from '../../contexts/NetVidyaStoreContext';
import { DEFAULT_STORE_SETTINGS, STORE_MERCHANT } from '../../config/storeConfig';
import { useModalEscape } from '../../hooks/useModalEscape';

interface NetVidyaInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  buyerSession: NetVidyaBuyerSession;
  amount?: number;
}

export const NetVidyaInvoiceModal: React.FC<NetVidyaInvoiceModalProps> = ({
  isOpen,
  onClose,
  buyerSession,
  amount = DEFAULT_STORE_SETTINGS.earlyBirdPrice
}) => {
  useModalEscape(isOpen, onClose);

  if (!isOpen) return null;

  const invoiceNumber = `NV-2026-${(buyerSession.email || 'STUDENT').slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}`;
  const invoiceDate = buyerSession.enrolledAt
    ? new Date(buyerSession.enrolledAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl border border-gray-100 print:shadow-none print:border-none print:max-w-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200 print:hidden">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-700 min-w-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span className="truncate">Student Fee Receipt / Invoice</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save as PDF</span>
              <span className="sm:hidden">Print PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-5 sm:p-10 space-y-6 sm:space-y-8 font-sans text-gray-800 print:p-6" id="invoice-printable-area">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-gray-200 pb-6">
            <div>
              <span className="text-xs font-bold font-mono tracking-widest text-blue-700 uppercase">
                Payment Receipt & Enrollment Voucher
              </span>
              <h1 className="text-2xl font-black text-gray-950 mt-1">{STORE_MERCHANT.storeTitle}</h1>
              <p className="text-xs text-gray-600 mt-1">
                Sold by <strong>{STORE_MERCHANT.brandName}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Academic Direction & Mentorship: <strong>{STORE_MERCHANT.curator}</strong>
              </p>
              <p className="text-xs text-gray-500">{STORE_MERCHANT.supportEmail} • {STORE_MERCHANT.supportPhone}</p>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" /> PAID & ENROLLED
              </span>
              <p className="text-xs font-mono text-gray-500 mt-2">
                Receipt No: <strong className="text-gray-900">{invoiceNumber}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Date: <strong className="text-gray-900">{invoiceDate}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Access Till: <strong className="text-gray-900">31 Dec 2026</strong>
              </p>
            </div>
          </div>

          {/* Student & Billing Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
            <div>
              <span className="text-gray-400 font-semibold uppercase tracking-wider block mb-1">
                Student Candidate
              </span>
              <p className="text-sm font-bold text-gray-900">{buyerSession.name || 'Candidate Scholar'}</p>
              <p className="text-gray-600 mt-0.5">{buyerSession.email}</p>
              {buyerSession.mobile && <p className="text-gray-600">{buyerSession.mobile}</p>}
            </div>
            <div>
              <span className="text-gray-400 font-semibold uppercase tracking-wider block mb-1">
                Course Enrolled
              </span>
              <p className="text-sm font-bold text-gray-900">GSET + UGC NET English Final Pack 2026</p>
              <p className="text-gray-600 mt-0.5">Mode: Student Dashboard • Reading Files & Test Hall</p>
              <p className="text-emerald-700 font-semibold mt-1">Payment Channel: Razorpay Verified</p>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-700 font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4 text-center">Term</th>
                  <th className="py-3 px-4 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-4 px-4">
                    <p className="font-bold text-gray-900">GSET + UGC NET English Final Pack 2026</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      • Full Private Reading Files (PDF Downloads)
                      <br />
                      • Complete Online NTA-Style Test Hall Access
                      <br />
                      • Dedicated Student Dashboard Access through 31 Dec 2026
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-600 font-medium">Through 31 Dec 2026</td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-gray-900">₹{amount}.00</td>
                </tr>
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-300 font-bold text-gray-900">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-right text-xs">
                    Total Amount Paid (Inclusive of all services):
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-base text-blue-900">
                    ₹{amount}.00
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer & Verification Note */}
          <div className="text-[11px] text-gray-500 space-y-1.5 border-t border-gray-200 pt-4">
            <p>
              * This is a computer-generated proof of enrollment and receipt issued for online educational services provided by NET Vidya.
            </p>
            <p>
              * Academic direction, syllabus curation, and test authoring provided by Dr. Rajnikant S. Dodiya (2× UGC NET & GSET Qualified).
            </p>
            <p className="text-gray-400">
              Merchant: NET Vidya • Gujarat, India • Support: netvidyaenglish@gmail.com
            </p>
          </div>

          {/* Bottom Action Bar (Hidden when printing) */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
            <span className="text-xs text-gray-500 font-mono text-center sm:text-left">
              Official Receipt No: {invoiceNumber}
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Print / Save PDF
              </button>
              <button
                onClick={onClose}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
