'use client';

import Link from 'next/link';
import { Globe, Share2, MapPin, Shield, Activity } from 'lucide-react';

const footerSections = [
  {
    title: 'Core Identity',
    links: [
      { name: 'Mission Spec', href: '#' },
      { name: 'Elite Engineering', href: '#' },
      { name: 'Unit Careers', href: '#' }
    ]
  },
  {
    title: 'Deployment',
    links: [
      { name: 'Asset Market', href: '/shop' },
      { name: 'Provision Hub', href: '/services' },
      { name: 'Signal Track', href: '/track' }
    ]
  },
  {
    title: 'Connect',
    links: [
      { name: 'Global Node', icon: Globe, href: '#' },
      { name: 'Tactical Feed', icon: Share2, href: '#' }
    ]
  }
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    /* 1. THE BIG CUSHION: Added 'pb-48' for mobile to clear the BottomNav 
       and 'md:pb-12' for desktop where the BottomNav is hidden. */
    <footer className="relative bg-[#F8F9FA] text-black overflow-hidden pb-48 md:pb-12">

      {/* Tonal Background Refraction */}
      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white to-transparent opacity-50" />

      {/* 2. CENTER STAGE: Using max-width and mx-auto to keep everything tidy. */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">

        {/* Signal Top Reset */}
        <div className="flex justify-center mb-20 md:mb-32">
          <button
            onClick={scrollToTop}
            className="group flex flex-col items-center gap-4 active:scale-95 transition-all"
          >
            <div className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center transition-all group-hover:shadow-[#007AFF]/20 group-hover:translate-y-[-4px]">
              <Activity className="w-5 h-5 text-black/20 group-hover:text-[#007AFF] transition-colors" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.6em] text-black/20 group-hover:text-black transition-colors">Reset Node</span>
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
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/20">Tactile Observatory</p>
              </div>
            </Link>
            <p className="text-xs font-medium text-black/40 leading-relaxed max-w-[240px]">
              Engineering high-fidelity logistical solutions with surgical precision and ethereal clarity.
            </p>
          </div>

          {/* Links Pillars */}
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

        {/* Global Footer Meta */}
        <div className="pt-12 bg-black/[0.02] rounded-[3rem] px-8 md:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-wrap justify-center md:justify-start gap-8 md:gap-12">
            {[
              { name: 'Legal Protocol', href: '#' },
              { name: 'Security Architecture', href: '#' },
              { name: 'Access Node', href: '#' }
            ].map(item => (
              <Link key={item.name} href={item.href} className="text-[9px] font-black uppercase tracking-[0.4em] text-black/20 hover:text-[#007AFF] transition-colors">{item.name}</Link>
            ))}
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-black/10">
              © 2024 REPIREO. ALL RIGHTS RESERVED.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-1.5 bg-[#34C759] rounded-full animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest text-[#34C759]">Global Sync Active</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}