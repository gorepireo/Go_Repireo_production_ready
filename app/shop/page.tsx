'use client';

import React from 'react';
import { 
  Lock, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Package, 
  Wrench, 
  ShoppingCart,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function ShopPage() {
  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#0F172A] overflow-hidden select-none pb-32">
      
      {/* 
        ========================================================
        1. HEAVY BLUR OVERLAY & CROSSED "COMING SOON" TAPES (Z-50)
        100% UNCLICKABLE & HEAVILY BLURRED BACKGROUND
        ========================================================
      */}
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xl flex flex-col items-center justify-center p-4 overflow-hidden pointer-events-auto">
        
        {/* Diagonal Tape 1 (Top Left to Bottom Right) */}
        <div className="absolute top-1/3 w-[160vw] bg-gradient-to-r from-[#FF9500] via-[#FFB700] to-[#FF9500] text-slate-950 font-black text-lg sm:text-2xl uppercase tracking-[0.25em] py-3.5 sm:py-4 -rotate-[14deg] shadow-2xl border-y-4 border-slate-950/20 transform flex items-center justify-center whitespace-nowrap opacity-95 pointer-events-none">
          <span>⚡ STORE COMING SOON • GOREPIREO OFFICIAL HARDWARE • COMING SOON ⚡</span>
        </div>

        {/* Diagonal Tape 2 (Bottom Left to Top Right) */}
        <div className="absolute top-1/2 w-[160vw] bg-gradient-to-r from-[#FF9500] via-[#FF8000] to-[#FF9500] text-slate-950 font-black text-lg sm:text-2xl uppercase tracking-[0.25em] py-3.5 sm:py-4 rotate-[14deg] shadow-2xl border-y-4 border-slate-950/20 transform flex items-center justify-center whitespace-nowrap opacity-95 pointer-events-none">
          <span>🛠️ GENUINE SPARE PARTS & TOOLS • COMING SOON • GOREPIREO 🛠️</span>
        </div>

        {/* Center Glassmorphic Modal Card */}
        <div className="relative z-10 bg-white/95 backdrop-blur-3xl p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-white text-center max-w-sm sm:max-w-md w-full space-y-4">
          
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <img 
              src="/logo.png" 
              alt="GoRepireo Logo" 
              className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm" 
            />
          </div>

          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
            <Lock size={24} />
          </div>

          <div>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-3 py-1 rounded-full inline-block mb-1">
              STORE LAUNCH PREVIEW
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Store Is Under Construction
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
              We are preparing genuine spare parts, electrical hardware, plumbing tools, and repair equipment directly for you.
            </p>
          </div>

          {/* Quick CTA to return to Bookings */}
          <div className="pt-2">
            <Link 
              href="/services/service" 
              className="w-full bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-xs py-3.5 px-6 rounded-full shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Book a Service Instead</span>
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </div>

      {/* 
        ========================================================
        2. DENSELY BLURRED SHOP CONTENT BACKGROUND (UNCLICKABLE)
        ========================================================
      */}
      <div className="filter blur-xl opacity-40 pointer-events-none pt-4">
        
        {/* Header Bar with Logo */}
        <header className="px-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="GoRepireo Logo" className="h-9 w-auto object-contain" />
            <div>
              <h1 className="text-base font-black text-slate-900">GoRepireo Store</h1>
              <p className="text-[10px] text-slate-400">Hardware & Spare Parts</p>
            </div>
          </div>
        </header>

        {/* Hero Card */}
        <section className="px-4 mb-6">
          <div className="bg-gradient-to-r from-[#0B409C] to-[#0052D4] rounded-3xl p-6 text-white min-h-[200px]">
            <span className="text-xs font-bold uppercase">Official Hardware Store</span>
            <h2 className="text-3xl font-black mt-2">Genuine Spare Parts</h2>
            <p className="text-xs text-blue-100 mt-1">Direct from certified manufacturers.</p>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-100">
              <Wrench size={20} className="text-[#007AFF]" />
              <h4 className="text-xs font-bold mt-2">Spare Parts</h4>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100">
              <Package size={20} className="text-[#007AFF]" />
              <h4 className="text-xs font-bold mt-2">Hardware Tools</h4>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100">
              <Truck size={20} className="text-[#007AFF]" />
              <h4 className="text-xs font-bold mt-2">Plumbing Kits</h4>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100">
              <ShoppingCart size={20} className="text-[#007AFF]" />
              <h4 className="text-xs font-bold mt-2">Electrical Items</h4>
            </div>
          </div>
        </section>

        {/* Products Matrix */}
        <section className="px-4 space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl"></div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-900">Heavy Duty Equipment #{item}</h4>
                <p className="text-sm font-black text-[#007AFF]">₹1,299</p>
              </div>
            </div>
          ))}
        </section>

      </div>

    </div>
  );
}
