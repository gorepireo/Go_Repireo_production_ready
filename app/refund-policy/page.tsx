'use client';

import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24 pt-6 px-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Refund & Cancellation Policy</h1>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 text-xs text-slate-600 leading-relaxed">
        <div className="flex items-center gap-2 text-[#007AFF] bg-blue-50 px-3 py-1.5 rounded-full w-fit">
          <RefreshCw size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Effective Date: January 2026</span>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">1. Order Cancellation Policy</h2>
          <p>Customers can cancel their service booking free of charge anytime before a service technician has been assigned and dispatched to their address. If cancelled after dispatch, a nominal inspection/travel fee may apply.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">2. Refund Eligibility</h2>
          <p>Refunds for online payments are processed under the following circumstances:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Service was paid online but cancelled prior to technician arrival.</li>
            <li>Duplicate payment deduction caused by network or payment gateway glitch.</li>
            <li>Unsatisfactory service resolution verified and approved by customer support audit.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">3. Refund Processing Timeline</h2>
          <p>Approved refunds are credited back to the original payment source (Bank Account, UPI, Credit/Debit Card) within <strong>5 to 7 working days</strong> from the date of refund approval.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">4. Help & Support</h2>
          <p>To request a refund or raise a billing discrepancy, reach out to us at <a href="mailto:support@gorepireo.com" className="text-[#007AFF] font-bold underline">support@gorepireo.com</a> or call our support line at <a href="tel:+919800615892" className="text-[#007AFF] font-bold underline">+91 9800615892</a>.</p>
        </section>
      </div>
    </div>
  );
}
