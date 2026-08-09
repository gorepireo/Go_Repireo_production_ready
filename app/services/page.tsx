'use client';

import { 
  ChevronRight, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Wrench,
  Clock,
  Headphones,
  UserCheck,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/Header';

const avatars = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150'
];

const features = [
  { title: 'SECURE BOOKING', desc: '100% safe and reliable', icon: ShieldCheck, color: 'text-blue-500' },
  { title: 'VERIFIED EXPERTS', desc: 'Background checked professionals', icon: UserCheck, color: 'text-blue-500' },
  { title: 'LIVE SUPPORT', desc: "We're here to help anytime", icon: Headphones, color: 'text-blue-500' },
  { title: 'SERVICE GUARANTEE', desc: 'Satisfaction guaranteed', icon: ShieldCheck, color: 'text-green-500' },
];

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] pb-32 text-[#0F172A]">
      <Header />
      
      {/* 1. Hero Banner */}
      <section className="px-4 pt-4">
        <div className="relative bg-gradient-to-br from-[#e8f0fe] to-[#d6e4ff] rounded-3xl p-6 overflow-hidden min-h-[300px] flex items-center justify-between shadow-sm">
          <div className="relative z-10 space-y-3.5 max-w-[58%] sm:max-w-[62%]">
            <div className="inline-flex items-center gap-1.5 bg-blue-100/50 backdrop-blur-sm px-3 py-1 rounded-full text-[#007AFF] border border-blue-200">
              <ShieldCheck size={12} className="fill-current text-[#007AFF]" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Verified & Trusted</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[0.95] tracking-tight text-[#0A1629]">
              CHOOSE YOUR<br />
              <span className="text-[#007AFF]">SERVICE.</span>
            </h1>

            <p className="text-[11px] text-slate-600 leading-relaxed max-w-[190px]">
              Select a service category below to connect with verified doorstep technicians.
            </p>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <div className="flex -space-x-2">
                {avatars.map((src, idx) => (
                  <div key={idx} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                    <img src={src} alt="Customer" className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-[#007AFF] text-white flex items-center justify-center text-[7px] font-bold">
                  10K+
                </div>
              </div>
              <span className="text-[9px] text-slate-600 font-medium">Happy Customers</span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="absolute right-0 bottom-0 w-[42%] max-w-[240px] sm:max-w-[320px] h-[85%] z-0 pointer-events-none flex items-end justify-end">
            <img src="/hero_house_3d.png" alt="House Services" className="w-full h-full object-contain object-bottom" />
          </div>
        </div>
      </section>

      {/* 2. Service Options Selection Header */}
      <section className="mt-8 px-4">
        <div className="mb-4">
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">Select Service Category</h2>
          <p className="text-[10px] text-slate-500">Choose between Repair & Maintenance or Installation</p>
        </div>

        <div className="space-y-4">
          
          {/* OPTION 1: Repair & Maintenance / Repair & Services (ACTIVE & CLICKABLE -> LEADS TO BOOKING PAGE) */}
          <Link href="/services/service" className="block group">
            <motion.div 
              whileTap={{ scale: 0.98 }} 
              className="bg-white rounded-3xl p-5 flex gap-4 shadow-md shadow-blue-500/5 border-2 border-[#007AFF]/30 hover:border-[#007AFF] relative overflow-hidden transition-all"
            >
              <div className="w-20 h-20 rounded-2xl bg-[#e8f0fe] flex items-center justify-center shrink-0">
                <Wrench className="w-10 h-10 text-[#007AFF] drop-shadow-md" />
              </div>
              
              <div className="flex-1 space-y-1.5 min-w-0 pr-12">
                <span className="text-[8px] font-bold text-[#007AFF] uppercase tracking-widest">Available Now</span>
                <h3 className="text-sm font-black text-slate-900 uppercase leading-none tracking-tight">
                  Repair & Maintenance
                </h3>
                <p className="text-[9px] text-slate-500 leading-snug line-clamp-2">
                  Fast diagnostics, expert repairs and maintenance for plumbing, electrical, cleaning, and appliances.
                </p>
                <div className="flex flex-col gap-0.5 pt-1">
                  <span className="text-[8px] text-slate-400">Starting from</span>
                  <span className="text-sm font-black text-[#007AFF]">₹499</span>
                </div>
              </div>

              <div className="absolute top-5 right-5 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[8px] font-extrabold uppercase text-emerald-700">Active</span>
              </div>

              <div className="absolute bottom-5 right-5 w-9 h-9 bg-[#007AFF] text-white rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30">
                <ArrowRight size={18} />
              </div>
            </motion.div>
          </Link>

          {/* OPTION 2: Installation (COMING SOON TAPE + BLURRED + 100% UNCLICKABLE) */}
          <div className="relative bg-white rounded-3xl p-5 border border-slate-100 shadow-sm overflow-hidden select-none">
            
            {/* 3D Diagonal Caution Tape Overlay */}
            <div className="absolute inset-0 z-30 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center pointer-events-auto overflow-hidden rounded-3xl">
              <div className="bg-gradient-to-r from-[#FF9500] via-[#FF5500] to-[#FF9500] text-white px-10 py-2 -rotate-[10deg] shadow-xl border-y-2 border-slate-950/20 transform scale-110 w-[140%] text-center flex items-center justify-center gap-2">
                <Lock size={12} />
                <span className="text-xs font-black uppercase tracking-widest drop-shadow-sm whitespace-nowrap">
                  Installation Service • Coming Soon
                </span>
              </div>
            </div>

            {/* Blurred Unclickable Card Content */}
            <div className="flex gap-4 filter blur-[2px] opacity-60 pointer-events-none">
              <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                <Zap className="w-10 h-10 text-orange-400 drop-shadow-md fill-current" />
              </div>
              
              <div className="flex-1 space-y-1.5 min-w-0 pr-12">
                <span className="text-[8px] font-bold text-orange-500 uppercase tracking-widest">New Setup</span>
                <h3 className="text-sm font-black text-slate-900 uppercase leading-none tracking-tight">Installation Service</h3>
                <p className="text-[9px] text-slate-500 leading-snug line-clamp-2">
                  Plan and install new split ACs, geysers, TV wall mounts, or water purifiers with trained installation specialists.
                </p>
                <div className="flex flex-col gap-0.5 pt-1">
                  <span className="text-[8px] text-slate-400">Starting from</span>
                  <span className="text-sm font-black text-slate-900">₹799</span>
                </div>
              </div>

              <div className="absolute top-5 right-5 flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Coming Soon</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. Custom Service Plan CTA */}
      <section className="mt-8 px-4">
        <div className="bg-[#0A1629] rounded-3xl p-6 relative overflow-hidden min-h-[180px] flex items-center shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/50 to-transparent opacity-80 pointer-events-none"></div>
          
          <div className="relative z-10 space-y-3 max-w-[60%]">
            <h2 className="text-xl font-black text-white leading-[1.1] tracking-tight uppercase">
              NEED A CUSTOM<br/>SERVICE PLAN?
            </h2>
            <p className="text-[10px] text-slate-300 leading-relaxed max-w-[150px]">
              Talk to our experts and get a personalized doorstep solution.
            </p>
            <Link href="/services/service" className="bg-white text-slate-900 px-4 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-wider mt-2 inline-flex items-center gap-2 hover:bg-slate-100 active:scale-95 transition-all">
              <span>TALK TO AN EXPERT</span>
              <ArrowRight size={12} className="text-[#007AFF]" />
            </Link>
          </div>

          <div className="absolute -right-6 -bottom-0 w-48 h-56 z-0 pointer-events-none">
             <img src="/custom_service_mechanic_3d.png" alt="Mechanic" className="w-full h-full object-contain object-bottom drop-shadow-2xl" />
          </div>
        </div>
      </section>

      {/* 4. Features Grid */}
      <section className="mt-8 px-4 mb-8">
        <div className="grid grid-cols-4 gap-2">
          {features.map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center text-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center">
                <feature.icon className={`w-5 h-5 ${feature.color}`} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[7px] font-black uppercase tracking-tight text-slate-900 leading-none">{feature.title}</h4>
                <p className="text-[6px] text-slate-500 leading-tight mx-auto max-w-[60px]">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
