'use client';

import Link from 'next/link';
import { Globe, Share2, Activity } from 'lucide-react';

const footerSections = [
  {
    title: 'Company',
    links: [
      { name: 'Our Mission', href: '#' },
      { name: 'Engineering', href: '#' },
      { name: 'Careers', href: '#' }
    ]
  },
  {
    title: 'Services',
    links: [
      { name: 'Shop', href: '/shop' },
      { name: 'Services', href: '/services' },
      { name: 'Track Order', href: '/track' }
    ]
  },
  {
    title: 'Connect',
    links: [
      { name: 'Website', icon: Globe, href: '#' },
      { name: 'Social', icon: Share2, href: '#' }
    ]
  }
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#F8F9FA] text-black overflow-hidden pb-40 md:pb-20">
      {/* Tonal Background Refraction */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white to-transparent opacity-50" />
      
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
        
        {/* Scroll to Top */}
        <div className="flex justify-center mb-20 md:mb-32">
          <button 
            onClick={scrollToTop}
            className="group flex flex-col items-center gap-4 active:scale-95 transition-all"
          >
            <div className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center transition-all group-hover:shadow-[#007AFF]/20 group-hover:translate-y-[-4px]">
               <Activity className="w-5 h-5 text-black/20 group-hover:text-[#007AFF] transition-colors" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.6em] text-black/20 group-hover:text-black transition-colors">Back to Top</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-8 mb-24 md:mb-40">
          {/* Brand Pillar */}
          <div className="md:col-span-1 space-y-8">
             <Link href="/" className="flex flex-col gap-4 group">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center p-1 shadow-lg shadow-black/5 border border-black/[0.03]">
              <img src="/logo.png" alt="Repireo" className="w-full h-full object-contain" />
            </div>
                <div className="space-y-1">
                   <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Repireo</h2>
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/20">Precision Logistics</p>
                </div>
             </Link>
             <p className="text-xs font-medium text-black/40 leading-relaxed max-w-[240px]">
                Engineering high-fidelity logistical solutions with surgical precision and clarity.
             </p>
          </div>

          {/* Link Columns */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#007AFF] bg-[#007AFF]/5 py-2 px-4 rounded-xl inline-block">{section.title}</h3>
              <ul className="space-y-5">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href} 
                      className="text-xs font-bold text-black/40 hover:text-black transition-all flex items-center gap-3 uppercase tracking-widest hover:translate-x-1"
                    >
                      {'icon' in link && link.icon && <link.icon size={12} className="text-black/20" />}
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer Meta */}
        <div className="pt-12 bg-black/[0.02] rounded-[3rem] px-8 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12">
              {[
                { name: 'Privacy Policy', href: '#' },
                { name: 'Terms of Service', href: '#' },
                { name: 'Contact Us', href: '#' }
              ].map(item => (
                <Link key={item.name} href={item.href} className="text-[9px] font-black uppercase tracking-[0.4em] text-black/20 hover:text-[#007AFF] transition-colors">{item.name}</Link>
              ))}
           </div>

           <div className="flex flex-col items-center md:items-end gap-2">
              <p className="text-[9px] font-black uppercase tracking-[0.5em] text-black/10">
                © 2024 Repireo. All Rights Reserved.
              </p>
              <div className="flex items-center gap-4">
                 <div className="w-1.5 h-1.5 bg-[#34C759] rounded-full animate-pulse" />
                 <span className="text-[8px] font-black uppercase tracking-widest text-[#34C759]">All Systems Online</span>
              </div>
           </div>
        </div>
      </div>
    </footer>
  );
}