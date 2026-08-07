'use client';

import Link from 'next/link';
import { Phone, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-8 pb-20 sm:pb-8 px-4 mt-8 text-slate-500 text-xs">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-900">Go_Repireo</p>
          <p className="text-[10px] text-slate-400 mt-0.5">© 2026 Go_Repireo. All rights reserved.</p>
          <div className="flex items-center gap-3 mt-2 text-[11px] font-medium">
            <a href="tel:+918679245568" className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold">
              <Phone size={12} /> +91 8679245568
            </a>
            <span className="text-slate-300">•</span>
            <a href="https://gorepireo.in" target="_blank" rel="noopener noreferrer" className="text-[#007AFF] hover:underline flex items-center gap-1 font-semibold">
              <Globe size={12} /> gorepireo.in
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] font-medium text-slate-600">
          <Link href="/privacy" className="hover:text-[#007AFF] transition-colors">Privacy Policy</Link>
          <span className="text-slate-300">•</span>
          <Link href="/terms" className="hover:text-[#007AFF] transition-colors">Terms & Conditions</Link>
          <span className="text-slate-300">•</span>
          <Link href="/refund-policy" className="hover:text-[#007AFF] transition-colors">Refund Policy</Link>
          <span className="text-slate-300">•</span>
          <Link href="/contact" className="hover:text-[#007AFF] transition-colors">Contact Us</Link>
        </div>
      </div>
    </footer>
  );
}