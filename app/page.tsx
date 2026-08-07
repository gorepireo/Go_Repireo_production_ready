'use client';

import { useState } from 'react';
import { 
  Menu,
  MapPin,
  ChevronDown,
  Bell,
  Search,
  Mic,
  Snowflake,
  Droplet,
  Lightbulb,
  Sparkles,
  LayoutGrid,
  MoreHorizontal,
  Hammer,
  Zap,
  ShieldCheck, 
  Clock, 
  IndianRupee, 
  ThumbsUp, 
  Star, 
  CalendarDays, 
  Phone, 
  Globe, 
  ChevronRight,
  ArrowRight,
  Quote,
  Headphones
} from 'lucide-react';
import Link from 'next/link';
import Footer from '@/components/Footer';

const quickFilters = [
  { name: 'AC repair', icon: Snowflake, color: 'text-cyan-500' },
  { name: 'Plumbing issue', icon: Droplet, color: 'text-blue-500' },
  { name: 'Install lights', icon: Lightbulb, color: 'text-amber-500' },
  { name: 'Cleaning service', icon: Sparkles, color: 'text-emerald-500' },
  { name: 'More', icon: LayoutGrid, color: 'text-slate-400' },
];

const categories = [
  { name: 'All Services', icon: LayoutGrid, color: 'text-[#007AFF]', bg: 'bg-[#EFF6FF] border-[#007AFF]/30', active: true },
  { name: 'Plumbing', icon: Droplet, color: 'text-[#007AFF]', bg: 'bg-white border-slate-100', active: false },
  { name: 'Electrical', icon: Zap, color: 'text-[#FF6B00]', bg: 'bg-white border-slate-100', active: false },
  { name: 'Cleaning', icon: Sparkles, color: 'text-[#10B981]', bg: 'bg-white border-slate-100', active: false },
  { name: 'Carpentry', icon: Hammer, color: 'text-purple-500', bg: 'bg-white border-slate-100', active: false },
  { name: 'More', icon: MoreHorizontal, color: 'text-slate-400', bg: 'bg-white border-slate-100', active: false },
];

const popularServices = [
  { name: 'AC Repair & Service', rating: '4.8', reviews: '2.3k', price: 'Starts at ₹399', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400' },
  { name: 'Plumbing Services', rating: '4.7', reviews: '1.8k', price: 'Starts at ₹299', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400' },
  { name: 'Electrical Services', rating: '4.9', reviews: '1.2k', price: 'Starts at ₹199', image: 'https://images.unsplash.com/photo-1621905252507-b3523c44dbf4?auto=format&fit=crop&q=80&w=400' },
  { name: 'House Cleaning', rating: '4.6', reviews: '1.6k', price: 'Starts at ₹249', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400' },
];

const recentBookings = [
  {
    title: 'AC Servicing',
    dateLoc: 'Today, 3:00 PM • Etawah',
    status: 'Confirmed',
    statusStyle: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    icon: CalendarDays,
    iconBg: 'bg-emerald-50 text-emerald-600',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
  },
  {
    title: 'Electrical Repair',
    dateLoc: 'Tomorrow, 11:00 AM • Etawah',
    status: 'Pending',
    statusStyle: 'bg-amber-50 text-amber-600 border-amber-100',
    icon: Zap,
    iconBg: 'bg-amber-50 text-amber-500',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
  },
  {
    title: 'Plumbing Issue',
    dateLoc: 'May 25, 2026 • Etawah',
    status: 'Completed',
    statusStyle: 'bg-blue-50 text-blue-600 border-blue-100',
    icon: Droplet,
    iconBg: 'bg-blue-50 text-blue-500',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'
  }
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    { text: "Great service! The expert arrived on time and fixed the issue quickly.", author: "- Neha S." },
    { text: "Very polite technician and affordable pricing. Highly recommended!", author: "- Rajesh K." },
    { text: "Instant booking and live map tracking made the experience effortless.", author: "- Ananya P." }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      
      {/* 1. Header Bar */}
      <header className="bg-white border-b border-slate-100 px-4 py-2.5 sticky top-0 z-40 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
            <Menu size={22} />
          </button>
          
          <button className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-200/60 transition-colors">
            <MapPin size={13} className="text-[#007AFF]" />
            <span>Etawah</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>
        </div>

        <div className="text-center">
          <h1 className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1">
            Hi, Priithibi <span className="text-base">👋</span>
          </h1>
          <p className="text-[10px] text-slate-400">What can we help you with today?</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="relative p-1.5 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
              3
            </span>
          </button>
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" className="w-8 h-8 rounded-full object-cover border-2 border-emerald-500 shadow-xs" />
        </div>
      </header>

      {/* 2. Royal Blue Hero Banner (Carousel) */}
      <section className="px-4 mt-3">
        <div className="relative bg-gradient-to-r from-[#002255] via-[#002B66] to-[#0A3B82] rounded-3xl p-5 sm:p-7 overflow-hidden text-white shadow-md">
          
          <div className="relative z-10 space-y-2.5 max-w-[62%]">
            <span className="inline-block border border-amber-400/50 text-amber-300 text-[9px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full bg-amber-400/10">
              TRUSTED EXPERTS
            </span>

            <h2 className="text-xl sm:text-3xl font-black leading-tight tracking-tight uppercase">
              EXPERT REPAIRS,<br />
              <span className="text-amber-400">RIGHT ON TIME.</span>
            </h2>

            <p className="text-[10px] text-blue-100/90 font-medium leading-relaxed">
              Verified Professionals • On-Time Service<br />
              Upfront Pricing • 100% Satisfaction
            </p>

            <div className="pt-1">
              <Link 
                href="/services" 
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs px-4 py-2.5 rounded-full shadow-md transition-all active:scale-95"
              >
                <span>Book a Service</span>
                <ArrowRight size={14} className="text-[#007AFF]" />
              </Link>
            </div>

            {/* Avatars row */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <div className="flex -space-x-2">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" className="w-5 h-5 rounded-full border border-white object-cover" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" className="w-5 h-5 rounded-full border border-white object-cover" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" className="w-5 h-5 rounded-full border border-white object-cover" />
              </div>
              <span className="text-[9px] font-bold text-blue-100">10K+ Happy Customers</span>
            </div>
          </div>

          {/* Technician Image on Right */}
          <div className="absolute right-0 bottom-0 w-[45%] max-w-[200px] sm:max-w-[280px] h-[98%] pointer-events-none flex items-end justify-end">
            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400" alt="Technician" className="w-full h-full object-cover object-top rounded-b-3xl" />
          </div>

          {/* Floating Badges on Hero */}
          <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-white text-[10px] font-bold shadow-sm">
            <Headphones size={12} className="text-cyan-300" />
            <span>24/7 Support</span>
          </div>

          <div className="absolute bottom-4 right-4 z-20 hidden sm:block bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white text-slate-900 text-[10px] shadow-sm">
            <div className="font-extrabold flex items-center gap-1">
              <span>4.8</span>
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={10} className="fill-current" />
                ))}
              </div>
            </div>
            <p className="text-[8px] text-slate-500 font-semibold">(2.3k reviews)</p>
          </div>

          {/* Carousel Dots */}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            <span className="w-2.5 h-1 rounded-full bg-white"></span>
            <span className="w-1.5 h-1 rounded-full bg-white/40"></span>
            <span className="w-1.5 h-1 rounded-full bg-white/40"></span>
            <span className="w-1.5 h-1 rounded-full bg-white/40"></span>
          </div>
        </div>
      </section>

      {/* 3. Search Bar & Quick Filter Chips */}
      <section className="px-4 mt-4 space-y-2.5">
        <form onSubmit={(e) => { e.preventDefault(); if (searchQuery) window.location.href = `/services?q=${encodeURIComponent(searchQuery)}`; }} className="relative flex items-center bg-white rounded-2xl p-1.5 pl-4 border border-slate-200/80 shadow-xs">
          <Search size={16} className="text-slate-400 shrink-0 mr-2" />
          <input
            type="text"
            placeholder='Search for a service, e.g. "AC repair"'
            className="w-full text-xs text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="button" className="w-9 h-9 bg-[#007AFF] text-white rounded-full flex items-center justify-center shrink-0 shadow-sm hover:bg-blue-600 transition-all active:scale-95">
            <Mic size={16} />
          </button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar text-[10px] pb-1">
          {quickFilters.map((filter, idx) => (
            <button 
              key={idx}
              onClick={() => setSearchQuery(filter.name)}
              className="bg-white text-slate-700 font-semibold px-3 py-1.5 rounded-full border border-slate-200/70 flex items-center gap-1.5 shrink-0 hover:border-blue-300 transition-colors shadow-xs"
            >
              <filter.icon size={13} className={filter.color} />
              <span>{filter.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 4. Category Icons */}
      <section className="px-4 mt-5">
        <div className="flex overflow-x-auto hide-scrollbar justify-between items-center gap-2 pb-3 border-b border-slate-100">
          {categories.map((cat, idx) => (
            <Link href="/services" key={idx} className="flex flex-col items-center gap-1.5 flex-1 min-w-[62px] group">
              <div className={`w-13 h-13 rounded-2xl flex items-center justify-center border shadow-xs transition-transform active:scale-95 ${cat.bg}`}>
                <cat.icon size={22} className={cat.color} />
              </div>
              <span className={`text-[10px] font-bold text-center ${cat.active ? 'text-[#007AFF]' : 'text-slate-600'}`}>{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. Limited Time Offer Banner */}
      <section className="px-4 mt-5">
        <div className="relative bg-gradient-to-r from-[#EBF3FF] to-[#D9E8FF] rounded-3xl p-5 flex items-center justify-between overflow-hidden border border-blue-100/60 shadow-xs">
          <div className="space-y-1.5 z-10 max-w-[62%]">
            <span className="bg-[#007AFF] text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-xs inline-block">
              Limited Time Offer
            </span>
            <h3 className="text-base sm:text-xl font-black text-slate-900 leading-snug pt-1">
              Get 20% OFF <span className="font-extrabold text-slate-700 block text-xs sm:text-sm">on your first service</span>
            </h3>
            <div className="pt-1">
              <span className="bg-white/80 backdrop-blur-sm text-[#007AFF] border border-blue-200 text-[10px] font-bold px-3 py-1 rounded-lg inline-block">
                Use code: <strong className="text-slate-900 font-black">FIRST20</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 z-10 shrink-0">
            <div className="w-14 h-14 flex items-center justify-center text-4xl drop-shadow-md">
              🎁
            </div>
            <Link href="/services" className="w-9 h-9 bg-[#007AFF] hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/30 transition-all active:scale-95">
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Why Choose Us? */}
      <section className="mt-7">
        <div className="flex justify-between items-center px-4 mb-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Why Choose Us?</h3>
          <Link href="/about" className="text-[11px] font-bold text-[#007AFF] hover:underline">View all</Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-1">
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
              <ShieldCheck size={18} />
            </div>
            <h4 className="text-[11px] font-black text-slate-900 mt-1">Verified Pros</h4>
            <p className="text-[9px] text-slate-400 font-medium leading-tight">Background verified & trained experts</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-1">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100">
              <Clock size={18} />
            </div>
            <h4 className="text-[11px] font-black text-slate-900 mt-1">On-Time Service</h4>
            <p className="text-[9px] text-slate-400 font-medium leading-tight">Punctual & reliable service</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-1">
            <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
              <IndianRupee size={18} />
            </div>
            <h4 className="text-[11px] font-black text-slate-900 mt-1">Transparent Pricing</h4>
            <p className="text-[9px] text-slate-400 font-medium leading-tight">Upfront prices, no hidden charges</p>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col gap-1">
            <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center border border-teal-100">
              <ThumbsUp size={18} />
            </div>
            <h4 className="text-[11px] font-black text-slate-900 mt-1">Satisfaction Guaranteed</h4>
            <p className="text-[9px] text-slate-400 font-medium leading-tight">We've got your back</p>
          </div>
        </div>
      </section>

      {/* 7. Popular Services */}
      <section className="mt-7">
        <div className="flex justify-between items-center px-4 mb-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Popular Services</h3>
          <Link href="/services" className="text-[11px] font-bold text-[#007AFF] hover:underline">View all</Link>
        </div>

        <div className="flex overflow-x-auto hide-scrollbar gap-3 px-4 pb-2">
          {popularServices.map((serv, idx) => (
            <Link href="/services" key={idx} className="bg-white rounded-2xl p-3 min-w-[155px] max-w-[185px] border border-slate-100 shadow-xs flex flex-col justify-between gap-2.5 group">
              <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-100">
                <img src={serv.image} alt={serv.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-900 truncate">{serv.name}</h4>
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Star size={10} className="fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-800">{serv.rating}</span>
                  <span className="text-slate-400">({serv.reviews})</span>
                </div>
              </div>
              <div className="w-full bg-[#EFF6FF] text-[#007AFF] font-extrabold text-[10px] py-1.5 px-3 rounded-full text-center border border-blue-100">
                {serv.price}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. Recent Bookings */}
      <section className="mt-7 px-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Recent Bookings</h3>
          <Link href="/track" className="text-[11px] font-bold text-[#007AFF] hover:underline">View all</Link>
        </div>

        <div className="space-y-2.5">
          {recentBookings.map((item, idx) => (
            <Link href="/track" key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-3 hover:border-blue-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                  <item.icon size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{item.dateLoc}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className={`${item.statusStyle} border text-[9px] font-extrabold px-3 py-1 rounded-full`}>
                  {item.status}
                </span>
                <img src={item.avatar} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 9. Testimonials & Social Proof Card */}
      <section className="px-4 mt-7">
        <div className="bg-gradient-to-r from-[#EFF6FF] to-[#E0EDFF] rounded-3xl p-5 border border-blue-100/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start -space-x-2">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
              <span className="w-7 h-7 rounded-full bg-[#007AFF] text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                10K+
              </span>
            </div>
            
            <h4 className="text-xs font-black text-slate-900">
              Trusted by 10,000+ happy customers
            </h4>
            
            <div className="flex items-center justify-center sm:justify-start gap-1 text-[#FFB800]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={11} className="fill-current" />
              ))}
              <span className="text-[10px] font-bold text-slate-700 ml-1">4.8 average rating</span>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-blue-100 shadow-xs max-w-xs space-y-1.5 text-left">
            <Quote size={14} className="text-[#007AFF] fill-[#007AFF]/20" />
            <p className="text-[10px] text-slate-700 font-medium leading-relaxed">
              "{testimonials[activeTestimonial].text}"
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[9px] font-bold text-slate-500">{testimonials[activeTestimonial].author}</span>
              <div className="flex gap-1">
                {testimonials.map((_, i) => (
                  <button key={i} onClick={() => setActiveTestimonial(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${activeTestimonial === i ? 'bg-[#007AFF] w-3' : 'bg-slate-300'}`} />
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 10. Subscribe & Direct Contact Banner */}
      <section className="mt-7 px-4 mb-8">
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
