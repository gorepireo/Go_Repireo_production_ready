'use client';

import Link from 'next/link';
import { Phone, Globe, Mail, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-10 pb-24 sm:pb-10 px-4 mt-12 text-slate-500 text-xs">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Main Grid: 4 Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand & Contact */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-black text-slate-900 tracking-tight">Go_Repireo (GoRepireo)</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Go_Repireo (gorepireo.in / gorepireo) is Etawah&apos;s trusted on-demand home repair and appliance services platform. Doorstep service with live technician tracking and 30-day warranty.
              </p>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px] font-medium text-slate-600">
              <a href="tel:+918679245568" className="text-emerald-600 hover:underline flex items-center gap-1.5 font-semibold">
                <Phone size={13} /> +91 8679245568
              </a>
              <a href="mailto:support@gorepireo.com" className="hover:text-[#007AFF] flex items-center gap-1.5">
                <Mail size={13} /> support@gorepireo.com
              </a>
              <div className="flex items-center gap-1.5 text-slate-500">
                <MapPin size={13} className="shrink-0 text-slate-400" /> Etawah, UP 206001, India
              </div>
            </div>

            <div className="pt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#007AFF]">
              <ShieldCheck size={14} /> 30-Day Service Guarantee
            </div>
          </div>

          {/* Column 2: Popular Services */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Services</p>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link href="/services/plumbing" className="hover:text-[#007AFF] transition-colors">
                  Plumbing Services
                </Link>
              </li>
              <li>
                <Link href="/services/electrical" className="hover:text-[#007AFF] transition-colors">
                  Electrician & Wiring
                </Link>
              </li>
              <li>
                <Link href="/services/ac-repair" className="hover:text-[#007AFF] transition-colors">
                  AC Repair & Servicing
                </Link>
              </li>
              <li>
                <Link href="/services/appliance" className="hover:text-[#007AFF] transition-colors">
                  Appliance Repair
                </Link>
              </li>
              <li>
                <Link href="/services/cleaning" className="hover:text-[#007AFF] transition-colors">
                  Home & Bathroom Cleaning
                </Link>
              </li>
              <li>
                <Link href="/services/carpentry" className="hover:text-[#007AFF] transition-colors">
                  Carpentry & Furniture
                </Link>
              </li>
              <li>
                <Link href="/services/ro-service" className="hover:text-[#007AFF] transition-colors">
                  RO Water Purifier
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Local Hubs (Etawah & Near Me) */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Local Hubs</p>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link href="/services/plumbing/etawah" className="hover:text-[#007AFF] transition-colors">
                  Plumber in Etawah
                </Link>
              </li>
              <li>
                <Link href="/services/electrical/etawah" className="hover:text-[#007AFF] transition-colors">
                  Electrician in Etawah
                </Link>
              </li>
              <li>
                <Link href="/services/ac-repair/etawah" className="hover:text-[#007AFF] transition-colors">
                  AC Repair in Etawah
                </Link>
              </li>
              <li>
                <Link href="/near-me/plumber-near-me" className="hover:text-[#007AFF] transition-colors">
                  Plumber Near Me
                </Link>
              </li>
              <li>
                <Link href="/near-me/electrician-near-me" className="hover:text-[#007AFF] transition-colors">
                  Electrician Near Me
                </Link>
              </li>
              <li>
                <Link href="/near-me/ac-repair-near-me" className="hover:text-[#007AFF] transition-colors">
                  AC Service Near Me
                </Link>
              </li>
              <li>
                <Link href="/near-me/washing-machine-repair-near-me" className="hover:text-[#007AFF] transition-colors">
                  Washing Machine Repair Near Me
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Quick Links & Legal */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Company & Legal</p>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link href="/about" className="hover:text-[#007AFF] transition-colors">About Go_Repireo</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#007AFF] transition-colors">Contact Support</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#007AFF] transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#007AFF] transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-[#007AFF] transition-colors">Refund & Cancellation</Link>
              </li>
              <li>
                <Link href="/services/service" className="hover:text-[#007AFF] font-semibold text-blue-600 transition-colors">Book a Service Now →</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <p>© 2026 Go_Repireo Technologies. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Service Operations: Etawah, UP</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
