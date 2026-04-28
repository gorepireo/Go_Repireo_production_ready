'use client';

import { 
  ChevronRight, 
  Search, 
  MapPin, 
  Star, 
  Zap, 
  Users, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Package,
  Wrench,
  Sparkles,
  LayoutGrid,
  Activity,
  Shield,
  Navigation
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const marketFavorites = [
  { id: 1, name: 'Precision Cooling', category: 'HVAC', price: '₹7,500', rating: 4.9, icon: Zap, color: '#007AFF', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400' },
  { id: 2, name: 'Power Matrix', category: 'Electric', price: '₹5,200', rating: 4.8, icon: Zap, color: '#FF3B30', img: 'https://images.unsplash.com/photo-1621905252507-b3523c44dbf4?auto=format&fit=crop&q=80&w=400' },
  { id: 3, name: 'Crystal Flow', category: 'Plumbing', price: '₹6,400', rating: 5.0, icon: Sparkles, color: '#34C759', img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400' },
];

const bentoFeatures = [
  { id: 1, title: 'Tactical Track', detail: '3 Units in Deployment', icon: Navigation, color: '#FFB800', link: '/track', metric: '98% Signal' },
  { id: 2, title: 'Fleet Ops', detail: '2.4K Active Sector Units', icon: Activity, color: '#007AFF', link: '/services', metric: '+12.4%' },
  { id: 3, title: 'Verified', detail: 'Authorized Elite Network', icon: Shield, color: '#34C759', link: '/register', metric: 'Secured' },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA] text-[#0F172A] pb-32">
      {/* Cinematic Tactical Hero */}
      <section className="relative pt-12 md:pt-24 pb-20 px-4 md:px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 space-y-12">
          <header className="space-y-10">
            <div className="flex items-center gap-4">
              <span className="tactile-label !text-[#007AFF]">SYSTEM PROTOCOL v3.42</span>
              <div className="h-[1px] flex-1 bg-black/[0.03]" />
            </div>
            
            <h1 className="text-6xl sm:text-9xl font-bold tracking-tighter leading-[0.8] uppercase skew-title">
              STRATEGIC <br />
              <span className="text-[#007AFF]">RESPONSE.</span>
            </h1>

            <p className="tactile-label !text-slate-400 !tracking-[0.2em] max-w-lg leading-relaxed">
              High-fidelity unit deployment matrix for multi-sector infrastructure maintenance and professional restoration.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link href="/services" className="btn-primary w-full sm:w-auto px-12 h-20 group">
                DEPLOY AUTHORIZATION
                <ChevronRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
              <div className="flex items-center gap-4 px-8 h-20 bg-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] rounded-3xl w-full sm:w-auto">
                <MapPin className="text-[#FF3B30] w-5 h-5" />
                <span className="tactile-label !text-slate-400">GLOBAL GRID ACTIVE</span>
              </div>
            </div>
          </header>
        </div>
      </section>

      {/* Micro-Scaled Bento Operations */}
      <section className="px-4 md:px-6">
        <div className="max-w-4xl mx-auto space-y-20">
           <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {bentoFeatures.map(item => (
                <Link key={item.id} href={item.link}>
                  <motion.div 
                    whileTap={{ scale: 0.98 }}
                    className="king-card h-full !p-8 flex flex-col justify-between min-h-[220px] overflow-hidden group"
                  >
                    <div className="flex justify-between items-start relative z-10">
                       <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.05)] group-hover:rotate-12 transition-transform">
                          <item.icon style={{ color: item.color }} size={20} />
                       </div>
                       <span className="tactile-label !text-slate-300 !text-[8px]">{item.metric}</span>
                    </div>

                    <div className="space-y-1 relative z-10">
                       <h3 className="text-xl font-bold tracking-tighter uppercase leading-none">{item.title}</h3>
                       <p className="tactile-label !text-slate-400 !text-[8px] !tracking-widest">{item.detail}</p>
                    </div>
                  </motion.div>
                </Link>
              ))}
           </div>

           {/* Elite Unit Registry */}
           <div className="space-y-8">
              <div className="flex justify-between items-end px-2">
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-5xl font-bold uppercase tracking-tighter leading-none skew-title">UNIT <span className="text-[#007AFF]">REGISTRY.</span></h2>
                  <p className="tactile-label !text-slate-300">AUTHORIZED SECTOR ASSETS / LIVE DATABASE</p>
                </div>
                <Link href="/services" className="tactile-label !text-[#007AFF] flex items-center gap-2 hover:underline">
                  EXPLORE ALL <ArrowRight size={12} />
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-2">
                 {marketFavorites.map((item) => (
                   <Link key={item.id} href="/services">
                    <motion.div 
                      whileTap={{ scale: 0.99 }}
                      className="king-card flex items-center gap-6 !p-4 group"
                    >
                       <div className="w-20 h-20 rounded-2xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 shrink-0 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.05)]">
                          <img src={item.img} alt={item.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                       </div>
                       
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                             <h4 className="text-lg font-bold tracking-tighter uppercase truncate leading-none">{item.name}</h4>
                             <span className="text-lg font-bold tracking-tighter">{item.price}</span>
                          </div>
                          
                          <div className="flex items-center gap-6 mt-3">
                             <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
                                <span className="tactile-label !text-slate-400">{item.category}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <Star size={10} className="text-[#FFB800] fill-[#FFB800]" />
                                <span className="tactile-label !text-slate-300">{item.rating} QUALITY</span>
                             </div>
                          </div>
                       </div>
                       <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <ChevronRight size={18} />
                       </div>
                    </motion.div>
                   </Link>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* Terminal Footer Panel */}
      <section className="px-4 md:px-6 py-20">
         <div className="max-w-4xl mx-auto king-card !bg-black text-white !p-12 md:!p-24 text-center space-y-10 overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#007AFF]/20 blur-[120px] rounded-full" />
            
            <div className="space-y-4 relative z-10">
              <span className="tactile-label !text-white/40 !tracking-[0.5em]">OPERATIONAL OVERRIDE V3.4</span>
              <h2 className="text-5xl md:text-8xl font-bold uppercase tracking-tighter text-white leading-[0.85] skew-title">
                ELITE <br />
                <span className="text-[#007AFF]">RESPONSE.</span>
              </h2>
            </div>
            
            <p className="tactile-label !text-white/30 !tracking-widest max-w-sm mx-auto">
              Verified multi-sector dispatch hub for critical infrastructure maintenance.
            </p>
            
            <Link href="/register" className="inline-flex items-center justify-center bg-white text-black h-20 px-16 rounded-3xl font-bold text-[10px] uppercase tracking-[0.3em] hover:bg-[#F8F9FA] active:scale-95 transition-all relative z-10">
              AUTHORIZE ACCESS
            </Link>
         </div>
      </section>
    </div>
  );
}
