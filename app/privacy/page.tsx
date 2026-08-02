'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24 pt-6 px-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Privacy Policy</h1>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 text-xs text-slate-600 leading-relaxed">
        <div className="flex items-center gap-2 text-[#007AFF] bg-blue-50 px-3 py-1.5 rounded-full w-fit">
          <ShieldCheck size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Effective Date: January 2026</span>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">1. Introduction</h2>
          <p>Go_Repireo ("we", "our", or "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy governs the manner in which Go_Repireo collects, uses, maintains, and discloses information collected from users ("Users") of our website and mobile application platform.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">2. Information We Collect</h2>
          <p>We collect personal information that you voluntarily provide to us when registering on the site, placing a service request, or contacting support. This includes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Name, email address, phone number, and delivery/service location address.</li>
            <li>Payment details processed securely through authorized payment gateway partners (Razorpay). We do not store raw credit/debit card credentials on our servers.</li>
            <li>Location data necessary to match you with nearby service technicians.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>To process, fulfill, and track your doorstep service bookings.</li>
            <li>To facilitate communications between customers, assigned technicians, and customer support.</li>
            <li>To improve customer experience, website performance, and platform security.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">4. Data Security & Third Party Sharing</h2>
          <p>We implement strict security measures to maintain the safety of your personal information. We do not sell, trade, or rent Users' personal identification information to third parties. Data is only shared with verified service professionals for order fulfillment and payment processors for transaction execution.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">5. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact our support team at <a href="mailto:support@gorepireo.com" className="text-[#007AFF] font-bold underline">support@gorepireo.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
