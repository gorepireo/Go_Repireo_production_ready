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

        {/* Official Google My Map Coverage & Headquarters Embed */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Service Coverage &amp; Office Location</h3>
            <span className="text-[10px] text-[#007AFF] font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">Etawah, UP</span>
          </div>
          <div className="w-full aspect-[4/3] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-100">
            <iframe
              src="https://www.google.com/maps/d/u/0/embed?mid=1h8jNUpcrqrUd_ndQ92GpFEICwL0PD74&ehbc=2E312F"
              width="100%"
              height="100%"
              className="w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              title="Go_Repireo Official Service Area Map"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
