'use client';

import { useState } from 'react';
import { 
  Menu,
  Bell,
  ArrowRight,
  ShieldCheck, 
  Clock, 
  IndianRupee, 
  ThumbsUp, 
  Star, 
  CalendarDays, 
  Phone, 
  Globe, 
  Droplet, 
  Zap, 
  Sparkles, 
  LayoutGrid, 
  MoreHorizontal 
} from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';

const categories = [
  { name: 'All Services', icon: LayoutGrid, color: 'text-[#007AFF]', bg: 'bg-[#EFF6FF]', active: true },
  { name: 'Plumbing', icon: Droplet, color: 'text-[#007AFF]', bg: 'bg-white', active: false },
  { name: 'Electrical', icon: Zap, color: 'text-[#FF6B00]', bg: 'bg-white', active: false },
  { name: 'Cleaning', icon: Sparkles, color: 'text-[#10B981]', bg: 'bg-white', active: false },
  { name: 'More', icon: MoreHorizontal, color: 'text-slate-400', bg: 'bg-white', active: false },
];

const popularServices = [
  { name: 'AC Repair & Service', rating: '4.8', reviews: '2.3k', price: '₹399', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400' },
  { name: 'Plumbing Services', rating: '4.7', reviews: '1.8k', price: '₹299', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400' },
  { name: 'Electrical Services', rating: '4.9', reviews: '1.2k', price: '₹199', image: 'https://images.unsplash.com/photo-1621905252507-b3523c44dbf4?auto=format&fit=crop&q=80&w=400' },
  { name: 'House Cleaning', rating: '4.6', reviews: '3.1k', price: '₹499', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400' },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* 1. Header Bar */}
      <header className="bg-white border-b border-slate-100 px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <button className="p-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
          <Menu size={22} />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1">
            Hi, Priithibi <span className="text-base">👋</span>
          </h1>
          <p className="text-[11px] text-slate-400">What can we help you with today?</p>
        </div>

        <button className="relative p-2 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
            3
          </span>
        </button>
      </header>

      {/* 2. Search Box & Suggestion Chips */}
      <section className="px-4 mt-3">
        <form onSubmit={(e) => { e.preventDefault(); if (searchQuery) window.location.href = `/services?q=${encodeURIComponent(searchQuery)}`; }} className="relative flex items-center bg-white rounded-2xl p-1.5 pl-4 border border-slate-200/80 shadow-xs">
          <input
            type="text"
            placeholder="What service do you need today?"
            className="w-full text-xs text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="w-9 h-9 bg-[#007AFF] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm hover:bg-blue-600 transition-all active:scale-95">
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="flex items-center gap-2 mt-2.5 overflow-x-auto hide-scrollbar text-[10px]">
          <span className="text-slate-400 shrink-0 font-medium">Try:</span>
          <button onClick={() => setSearchQuery('AC repair')} className="bg-white text-slate-600 px-3 py-1 rounded-full border border-slate-200/60 shrink-0 hover:border-blue-300 transition-colors">
            "AC repair"
          </button>
          <button onClick={() => setSearchQuery('Plumbing issue')} className="bg-white text-slate-600 px-3 py-1 rounded-full border border-slate-200/60 shrink-0 hover:border-blue-300 transition-colors">
            "Plumbing issue"
          </button>
          <button onClick={() => setSearchQuery('Install lights')} className="bg-white text-slate-600 px-3 py-1 rounded-full border border-slate-200/60 shrink-0 hover:border-blue-300 transition-colors">
            "Install lights"
          </button>
        </div>
      </section>

      {/* 3. Hero Banner Card */}
      <section className="px-4 mt-4">
        <div className="relative bg-gradient-to-r from-[#EBF3FF] to-[#D9E8FF] rounded-3xl p-5 overflow-hidden flex items-center justify-between min-h-[170px]">
          <div className="space-y-2 max-w-[62%] z-10">
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
              Trusted Experts,<br />Right at Your Doorstep
            </h2>
            <p className="text-[10px] text-slate-500 font-medium">
              Verified • Trained • Reliable
            </p>
            
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <div className="flex -space-x-2">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" className="w-6 h-6 rounded-full border-2 border-white object-cover" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" className="w-6 h-6 rounded-full border-2 border-white object-cover" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" className="w-6 h-6 rounded-full border-2 border-white object-cover" />
                <span className="w-6 h-6 rounded-full bg-[#007AFF] text-white text-[8px] font-bold flex items-center justify-center border-2 border-white">
                  10K+
                </span>
              </div>
              <span className="text-[9px] font-medium text-slate-600">10,000+ happy customers</span>
            </div>
          </div>

          <div className="absolute right-2 bottom-0 w-[42%] max-w-[170px] h-[95%] pointer-events-none flex items-end justify-end">
            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400" alt="Technician" className="w-full h-full object-cover rounded-b-2xl object-top" />
          </div>
        </div>
      </section>

      {/* 4. Category Icons */}
      <section className="px-4 mt-6">
        <div className="flex justify-between items-center gap-2 pb-3 border-b border-slate-100">
          {categories.map((cat, idx) => (
            <Link href="/services" key={idx} className="flex flex-col items-center gap-2 flex-1 group">
              <div className={`w-13 h-13 rounded-2xl flex items-center justify-center border transition-all ${cat.active ? 'bg-[#EFF6FF] border-[#007AFF]/30 text-[#007AFF] shadow-xs' : 'bg-white border-slate-100 text-slate-600'}`}>
                <cat.icon size={22} className={cat.active ? 'text-[#007AFF]' : cat.color} />
              </div>
              <span className={`text-[10px] font-semibold ${cat.active ? 'text-[#007AFF]' : 'text-slate-600'}`}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Limited Time Offer Banner */}
      <section className="px-4 mt-6">
        <div className="relative bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] rounded-2xl p-4 flex items-center justify-between overflow-hidden border border-blue-100/60">
          <div className="space-y-1 z-10 max-w-[65%]">
            <span className="bg-[#007AFF] text-white text-[8px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
              Limited Time Offer
            </span>
            <h3 className="text-xs font-black text-slate-900 leading-snug pt-1">
              Get 20% OFF on your first service
            </h3>
            <p className="text-[9px] text-slate-500">
              Use code: <span className="font-bold text-[#007AFF]">FIRST20</span>
            </p>
          </div>

          <div className="flex items-center gap-2 z-10">
            <div className="w-12 h-12 flex items-center justify-center text-3xl">
              🎁
            </div>
            <Link href="/services" className="w-8 h-8 bg-[#007AFF] text-white rounded-full flex items-center justify-center shadow-xs hover:bg-blue-600 transition-all active:scale-95">
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Why Choose Us? */}
      <section className="mt-6">
        <div className="flex justify-between items-center px-4 mb-3">
          <h3 className="text-xs font-black text-slate-900">Why Choose Us?</h3>
          <Link href="/about" className="text-[10px] font-bold text-[#007AFF]">View all</Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <h4 className="text-[11px] font-bold text-slate-900 mt-1 leading-snug">Verified Professionals</h4>
            <p className="text-[9px] text-slate-400">Background verified</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <h4 className="text-[11px] font-bold text-slate-900 mt-1 leading-snug">On-Time Service</h4>
            <p className="text-[9px] text-slate-400">Punctual & reliable</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-1">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <IndianRupee size={18} />
            </div>
            <h4 className="text-[11px] font-bold text-slate-900 mt-1 leading-snug">Transparent Pricing</h4>
            <p className="text-[9px] text-slate-400">No hidden charges</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-1">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-500 flex items-center justify-center">
              <ThumbsUp size={18} />
            </div>
            <h4 className="text-[11px] font-bold text-slate-900 mt-1 leading-snug">Satisfaction Guarantee</h4>
            <p className="text-[9px] text-slate-400">We've got your back</p>
          </div>
        </div>
      </section>

      {/* 7. Popular Services */}
      <section className="mt-6">
        <div className="flex justify-between items-center px-4 mb-3">
          <h3 className="text-xs font-black text-slate-900">Popular Services</h3>
          <Link href="/services" className="text-[10px] font-bold text-[#007AFF]">View all</Link>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-3 px-4 pb-2">
          {popularServices.map((serv, idx) => (
            <Link href="/services" key={idx} className="bg-white rounded-2xl p-2.5 min-w-[150px] max-w-[180px] border border-slate-100 shadow-xs space-y-2 group">
              <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-100">
                <img src={serv.image} alt={serv.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-900 truncate">{serv.name}</h4>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-700">{serv.rating}</span>
                  <span>({serv.reviews})</span>
                </div>
                <p className="text-[10px] text-slate-400">Starts at <span className="font-bold text-slate-900">{serv.price}</span></p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. Recent Bookings */}
      <section className="mt-6 px-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black text-slate-900">Recent Bookings</h3>
          <Link href="/track" className="text-[10px] font-bold text-[#007AFF]">View all</Link>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <CalendarDays size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">AC Servicing</h4>
              <p className="text-[10px] text-slate-400">Today, 3:00 PM • Etawah</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] font-extrabold px-2.5 py-1 rounded-full">
              Confirmed
            </span>
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
          </div>
        </div>
      </section>

      {/* 9. Subscribe & Direct Contact Banner */}
      <section className="mt-8 px-4 mb-8">
        <div className="bg-[#0A1629] rounded-3xl p-5 text-white space-y-3 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent opacity-50 pointer-events-none"></div>

          <div className="relative z-10 space-y-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-blue-400">Subscribe for Updates</h3>
            <p className="text-[10px] text-slate-300">Enter your phone number to receive instant repair status & service discounts.</p>
            
            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                const val = (e.currentTarget.querySelector('input')?.value || '').trim();
                alert('Thank you for subscribing! We will send updates to ' + (val || 'your phone number') + '.'); 
              }} 
              className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/20 mt-2"
            >
              <input 
                type="tel" 
                placeholder="Enter phone number to subscribe" 
                className="bg-transparent text-xs text-white px-3 py-1.5 focus:outline-none w-full placeholder:text-slate-400" 
                required 
              />
              <button type="submit" className="bg-[#007AFF] hover:bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-full whitespace-nowrap active:scale-95 transition-all shadow-md">
                Subscribe
              </button>
            </form>

            <div className="flex items-center gap-4 text-[10px] pt-2 text-slate-300">
              <a href="tel:+918679245568" className="flex items-center gap-1 hover:text-white font-semibold">
                <Phone size={12} className="text-emerald-400" /> +91 8679245568
              </a>
              <span>•</span>
              <a href="https://gorepireo.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white font-semibold">
                <Globe size={12} className="text-blue-400" /> gorepireo.in
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
