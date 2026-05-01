'use client';

import { motion } from 'framer-motion';
import { 
  Zap,
  Wrench,
  ArrowRight,
  LayoutGrid,
  ShieldCheck,
  Activity
} from 'lucide-react';
import Link from 'next/link';

const PATHS = [
  { 
    id: 'service', 
    name: 'Repair & Maintenance', 
    desc: 'Get fast diagnostics, expert repairs, and ongoing care for systems you already use.', 
    link: '/services/service',
    icon: Wrench,
    color: '#007AFF',
    tag: 'FAST SUPPORT'
  },
  { 
    id: 'installation', 
    name: 'New Installation', 
    desc: 'Plan and install new equipment with trained specialists and end-to-end coordination.', 
    link: '/services/installation',
    icon: Zap,
    color: '#FFB800',
    tag: 'SETUP'
  }
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-12 space-y-12">
        
        {/* Header Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] skew-title">
              CHOOSE YOUR <br />
              <span className="text-[#007AFF]">SERVICE.</span>
            </h1>
             <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-black/5 rotate-3">
                <LayoutGrid className="w-8 h-8 text-[#007AFF]" />
             </div>
          </div>
          <p className="tactile-label !text-slate-400 max-w-sm tracking-[0.2em]">
            Tell us what you need and we will connect you with the right verified expert.
          </p>
        </div>

        {/* Selection Paths */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PATHS.map((path, idx) => (
            <Link href={path.link} key={path.id} className="block group">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="king-card flex flex-col items-center text-center !p-12 h-full hover:shadow-2xl hover:shadow-black/5 transition-all duration-700 relative overflow-hidden"
              >
                 {/* Decorative background depth */}
                 <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/[0.01] to-black/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />
                 
                 <div className="mb-10 w-24 h-24 bg-black/[0.01] rounded-[2.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-all duration-700">
                    <path.icon size={48} style={{ color: path.color }} className="opacity-20 group-hover:opacity-100 transition-all" />
                 </div>
                 
                 <div className="space-y-4 relative z-10">
                    <span className="tactile-label !text-slate-300 group-hover:!text-black transition-colors">{path.tag}</span>
                    <h3 className="text-3xl font-black uppercase tracking-tighter group-hover:italic transition-all">{path.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium px-4">{path.desc}</p>
                 </div>

                 <div className="mt-12 w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center group-hover:bg-[#007AFF] group-hover:shadow-xl group-hover:shadow-[#007AFF]/30 transition-all group-hover:translate-y-[-4px]">
                    <ArrowRight size={24} />
                 </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Global Support Callout */}
        <div className="king-card bg-[#007AFF] text-white p-12 text-center mt-12 space-y-6">
           <h4 className="text-2xl font-black uppercase tracking-tighter">Need a custom service plan?</h4>
           <div className="flex justify-center gap-8 py-4">
              <div className="flex items-center gap-2">
                 <ShieldCheck size={14} className="opacity-50" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Secure Booking</span>
              </div>
              <div className="flex items-center gap-2">
                 <Activity size={14} className="opacity-50" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Live Support</span>
              </div>
           </div>
           <button className="bg-white text-black px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all active:scale-95 hover:bg-slate-100">Talk to an Expert</button>
        </div>

      </div>
    </div>
  );
}
