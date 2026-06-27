import Link from 'next/link';
import { Building2, Briefcase, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-8 mb-20 px-4 space-y-6">
      
      {/* Top section: Logo and Links */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 px-2">
        {/* Logo and Description */}
        <div className="space-y-4 max-w-[200px]">
          <div className="flex flex-col gap-2">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <img src="/logo.png" alt="Repireo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight leading-none">
                <span className="text-[#007AFF]">GO_</span>
                <span className="text-[#FF9500]">REPIREO</span>
              </h3>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1">PRECISION LOGISTICS</p>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 leading-relaxed pt-2">
            Engineering high-fidelity logistical solutions with surgical precision and clarity.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Link href="#" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-[#007AFF] hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </Link>
            <Link href="#" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-black hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="4" x2="20" y2="20"></line><line x1="4" y1="20" x2="20" y2="4"></line></svg>
            </Link>
            <Link href="#" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-[#E1306C] hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </Link>
            <Link href="#" className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-600 hover:bg-[#FF0000] hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </Link>
          </div>
        </div>

        {/* Link Columns */}
        <div className="flex gap-8 w-full md:w-auto">
          {/* Company */}
          <div className="space-y-4">
            <div className="bg-blue-50 text-blue-500 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"><Building2 size={10} /> COMPANY</div>
            <ul className="space-y-3">
              <li><Link href="#" className="text-[10px] text-slate-500 hover:text-slate-900 transition-colors">Our Mission</Link></li>
              <li><Link href="#" className="text-[10px] text-slate-500 hover:text-slate-900 transition-colors">Engineering</Link></li>
              <li><Link href="#" className="text-[10px] text-slate-500 hover:text-slate-900 transition-colors">Careers</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <div className="bg-blue-50 text-blue-500 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"><Briefcase size={10} /> SERVICES</div>
            <ul className="space-y-3">
              <li><Link href="/shop" className="text-[10px] text-slate-500 hover:text-slate-900 transition-colors">Shop</Link></li>
              <li><Link href="/services" className="text-[10px] text-slate-500 hover:text-slate-900 transition-colors">Services</Link></li>
              <li><Link href="/track" className="text-[10px] text-slate-500 hover:text-slate-900 transition-colors">Track Order</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <div className="bg-blue-50 text-blue-500 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"><Globe size={10} /> CONNECT</div>
            <ul className="space-y-3">
              <li><Link href="#" className="text-[10px] text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5"><Globe size={10} className="text-slate-400" /> Website</Link></li>
              <li><Link href="#" className="text-[10px] text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5"><span className="text-[8px]">🔗</span> Social</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="bg-slate-50 rounded-3xl p-6 flex flex-col items-center text-center space-y-4 border border-slate-100">
        <div className="flex items-center gap-4 text-[9px] text-slate-500 font-medium">
          <Link href="#" className="hover:text-slate-900">Privacy Policy</Link>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <Link href="#" className="hover:text-slate-900">Terms of Service</Link>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <Link href="#" className="hover:text-slate-900">Contact Us</Link>
        </div>
        
        <div className="flex items-center justify-between w-full pt-4 border-t border-slate-200/50">
          <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">
            © 2024 REPIREO. ALL RIGHTS RESERVED.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            <span className="text-[7px] text-green-600 font-bold uppercase tracking-widest">ALL SYSTEMS ONLINE</span>
          </div>
        </div>
      </div>

    </footer>
  );
}