'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  ShieldCheck, 
  Package, 
  LayoutGrid, 
  Activity,
  Wrench,
  Sparkles,
  Bell,
  CheckCircle2,
  ArrowRight,
  Truck,
  Headphones,
  Store
} from 'lucide-react';
import Link from 'next/link';

const categories = [
  { name: 'Spare Parts', icon: Wrench, count: '120+ Items' },
  { name: 'Hardware', icon: Package, count: '80+ Items' },
  { name: 'Professional Tools', icon: Activity, count: '45+ Items' },
  { name: 'Smart Appliances', icon: LayoutGrid, count: '30+ Items' },
];

const upcomingProducts = [
  {
    id: 'p1',
    name: 'Heavy Duty Copper AC Pipe (1/4" + 1/2")',
    category: 'Spare Parts',
    price: '₹1,850',
    tag: 'Popular',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p2',
    name: 'Universal Submersible Pump 1.0 HP',
    category: 'Hardware',
    price: '₹3,499',
    tag: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p3',
    name: 'Professional Digital Multimeter Tester',
    category: 'Professional Tools',
    price: '₹890',
    tag: 'Essential',
    image: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&q=80&w=400'
  }
];

export default function ShopPage() {
  const [notified, setNotified] = useState(false);
  const [email, setEmail] = useState('');

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setNotified(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] pb-32 pt-4 text-[#0F172A]">
      
      {/* 1. Header Bar */}
      <header className="px-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[#007AFF] text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Store size={20} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              GoRepireo Store
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Genuine Spare Parts & Hardware Equipment</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Coming Soon</span>
        </div>
      </header>

      {/* 2. Top "COMING SOON" Hero Banner Card */}
      <section className="px-4 mb-6">
        <div className="relative bg-gradient-to-br from-[#0B409C] via-[#0052D4] to-[#4364F7] rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-xl min-h-[220px] flex flex-col justify-between">
          
          {/* Diagonal Orange Ribbon */}
          <div className="absolute -right-8 top-7 rotate-45 bg-gradient-to-r from-[#FF9900] to-[#FF5500] text-white font-black text-[10px] uppercase tracking-widest px-10 py-1.5 shadow-xl z-20 pointer-events-none">
            COMING SOON
          </div>

          <div className="relative z-10 max-w-[65%] sm:max-w-[70%] space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[9px] font-extrabold uppercase tracking-widest border border-white/30">
              <Sparkles size={12} className="text-amber-300 fill-amber-300" />
              <span>Official Hardware Store</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-none pt-1">
              Store Is Opening Soon!
            </h2>

            <p className="text-[10px] sm:text-xs text-blue-100 font-medium leading-relaxed max-w-[260px] pt-1">
              Direct factory pricing on genuine spare parts, electrical items, plumbing tools, and repair equipment.
            </p>

            {/* Notification Email Form */}
            <div className="pt-3">
              {notified ? (
                <div className="bg-white/20 backdrop-blur-md border border-white/40 p-2.5 rounded-2xl inline-flex items-center gap-2 text-white text-xs font-bold shadow-md">
                  <CheckCircle2 size={16} className="text-emerald-300" />
                  <span>You're on the early access launch list!</span>
                </div>
              ) : (
                <form onSubmit={handleNotifySubmit} className="flex items-center gap-2 max-w-sm">
                  <input 
                    type="email" 
                    placeholder="Enter email for launch notification"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/15 border border-white/30 text-white placeholder-blue-200 text-xs px-4 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 flex-1 min-w-0 backdrop-blur-md"
                  />
                  <button 
                    type="submit"
                    className="bg-white text-[#007AFF] hover:bg-blue-50 text-xs font-black px-4 py-2.5 rounded-full shadow-md active:scale-95 transition-all shrink-0 flex items-center gap-1"
                  >
                    <span>Notify Me</span>
                    <Bell size={13} />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* 3D Storefront Graphic on Right */}
          <div className="absolute right-0 -bottom-2 w-40 sm:w-56 h-40 sm:h-56 pointer-events-none drop-shadow-2xl z-10 flex items-end justify-end">
            <img src="/merchant_storefront_3d.png" alt="Hardware Store" className="w-full h-full object-contain" />
          </div>

        </div>
      </section>

      {/* 3. Featured Categories Grid */}
      <section className="px-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">FEATURED CATEGORIES</h3>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Launch Preview</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <div 
              key={cat.name}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col justify-between min-h-[100px] relative overflow-hidden group hover:border-blue-200 transition-all"
            >
              <div className="w-9 h-9 bg-blue-50 text-[#007AFF] rounded-xl flex items-center justify-center shrink-0 mb-2">
                <cat.icon size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 tracking-tight">{cat.name}</h4>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">{cat.count}</p>
              </div>

              <span className="absolute top-2 right-2 text-[7px] font-extrabold uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                SOON
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Upcoming Products Showcase */}
      <section className="px-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">HARDWARE PREVIEW</h3>
          <span className="text-[10px] sm:text-xs font-bold text-slate-400">Direct From Manufacturers</span>
        </div>

        <div className="space-y-3">
          {upcomingProducts.map((prod) => (
            <div 
              key={prod.id}
              className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs flex items-center justify-between gap-4"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100 p-1">
                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover rounded-xl" />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-50 text-[#007AFF] text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                    {prod.tag}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium truncate">{prod.category}</span>
                </div>
                <h4 className="text-xs font-black text-slate-900 tracking-tight line-clamp-1">
                  {prod.name}
                </h4>
                <p className="text-sm font-black text-[#007AFF]">{prod.price}</p>
              </div>

              <button 
                disabled
                className="bg-slate-100 text-slate-400 text-[10px] font-extrabold px-3.5 py-2 rounded-full cursor-not-allowed uppercase tracking-wider shrink-0"
              >
                Notify
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Store Benefits Bar */}
      <section className="px-4 mb-6">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="space-y-1 flex flex-col items-center">
            <div className="w-9 h-9 bg-blue-50 text-[#007AFF] rounded-2xl flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <h5 className="text-[9px] font-black text-slate-900 uppercase">100% Genuine</h5>
            <p className="text-[8px] text-slate-400">Direct factory warranty</p>
          </div>

          <div className="space-y-1 flex flex-col items-center">
            <div className="w-9 h-9 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
              <Truck size={18} />
            </div>
            <h5 className="text-[9px] font-black text-slate-900 uppercase">Same-Day Delivery</h5>
            <p className="text-[8px] text-slate-400">Delivered within 60 mins</p>
          </div>

          <div className="space-y-1 flex flex-col items-center">
            <div className="w-9 h-9 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">
              <ShoppingCart size={18} />
            </div>
            <h5 className="text-[9px] font-black text-slate-900 uppercase">Wholesale Prices</h5>
            <p className="text-[8px] text-slate-400">Up to 30% savings</p>
          </div>

          <div className="space-y-1 flex flex-col items-center">
            <div className="w-9 h-9 bg-orange-50 text-amber-500 rounded-2xl flex items-center justify-center">
              <Headphones size={18} />
            </div>
            <h5 className="text-[9px] font-black text-slate-900 uppercase">Expert Assistance</h5>
            <p className="text-[8px] text-slate-400">Tool recommendations</p>
          </div>
        </div>
      </section>

      {/* 6. Back to Services CTA */}
      <section className="px-4 mb-4">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-5 text-white flex items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1 max-w-[65%]">
            <h4 className="text-sm font-black tracking-tight">Need Urgent Maintenance Service?</h4>
            <p className="text-[10px] text-slate-300 font-medium">Book certified technicians for immediate on-site repair.</p>
          </div>

          <Link 
            href="/services/service" 
            className="bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-full shadow-md flex items-center gap-1 active:scale-95 transition-all shrink-0"
          >
            <span>Book Service</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>

    </div>
  );
}
