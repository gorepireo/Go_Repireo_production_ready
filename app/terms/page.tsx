'use client';

import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24 pt-6 px-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Terms & Conditions</h1>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 text-xs text-slate-600 leading-relaxed">
        <div className="flex items-center gap-2 text-[#007AFF] bg-blue-50 px-3 py-1.5 rounded-full w-fit">
          <FileText size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Effective Date: January 2026</span>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">1. Agreement to Terms</h2>
          <p>By accessing or using Go_Repireo's website, platform, and doorstep services, you agree to be bound by these Terms and Conditions. If you do not agree to all terms, you must not access or use our services.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">2. Services Offered</h2>
          <p>Go_Repireo provides an on-demand marketplace connecting customers with independent, verified home service technicians for plumbing, electrical, cleaning, HVAC, carpentry, and general repairs.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">3. Booking & Payment Terms</h2>
          <p>Prices provided via our estimation system are indicative based on problem complexity. Final total fees include inspection charges, service labor, travel fees, and platform platform fees. Payments can be completed online via Razorpay (UPI, Credit/Debit Cards, NetBanking) or Cash on Service directly to the technician.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">4. Cancellation & Customer Responsibilities</h2>
          <p>Customers may cancel service requests prior to technician dispatch without penalty. Customers must ensure a safe and accessible environment for technicians at the designated address.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">5. Contact & Inquiries</h2>
          <p>For inquiries regarding these terms, please contact us at <a href="mailto:support@gorepireo.com" className="text-[#007AFF] font-bold underline">support@gorepireo.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
