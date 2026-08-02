'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Headphones } from 'lucide-react';

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-24 pt-6 px-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="w-10 h-10 bg-white rounded-full shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Contact Us</h1>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6 text-xs text-slate-600">
        <div className="flex items-center gap-2 text-[#007AFF] bg-blue-50 px-3 py-1.5 rounded-full w-fit">
          <Headphones size={14} />
          <span className="text-[10px] font-bold uppercase tracking-wider">24/7 Customer Support</span>
        </div>

        <p className="leading-relaxed">Have a question about your service booking, pricing estimation, or technical support? Our customer support team is available 24/7 to assist you.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            <div className="w-8 h-8 bg-blue-100 text-[#007AFF] rounded-xl flex items-center justify-center">
              <Mail size={18} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Email Support</h3>
            <p className="text-[10px] text-slate-500">support@gorepireo.com</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            <div className="w-8 h-8 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
              <Phone size={18} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Phone Support</h3>
            <p className="text-[10px] text-slate-500">+91 8679245568</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
              <MapPin size={18} />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Headquarters</h3>
            <p className="text-[10px] text-slate-500">Etawah, Uttar Pradesh, India</p>
          </div>
        </div>
      </div>
    </div>
  );
}
