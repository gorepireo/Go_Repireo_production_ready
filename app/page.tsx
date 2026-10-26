'use client';

import { useState, useEffect } from 'react';
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
  Headphones,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/Avatar';
import { OrderService } from '@/lib/services/order.service';

const categories = [
  { name: 'All Services', icon: LayoutGrid, color: 'text-[#007AFF]', bg: 'bg-[#EFF6FF] border-[#007AFF]/30', active: true },
  { name: 'Plumbing', icon: Droplet, color: 'text-[#007AFF]', bg: 'bg-white border-slate-100', active: false },
  { name: 'Electrical', icon: Zap, color: 'text-[#FF6B00]', bg: 'bg-white border-slate-100', active: false },
  { name: 'Cleaning', icon: Sparkles, color: 'text-[#10B981]', bg: 'bg-white border-slate-100', active: false },
  { name: 'Carpentry', icon: Hammer, color: 'text-purple-500', bg: 'bg-white border-slate-100', active: false },
  { name: 'More', icon: MoreHorizontal, color: 'text-slate-400', bg: 'bg-white border-slate-100', active: false },
];

const popularServices = [
  { name: 'AC Repair & Service', rating: '4.8', reviews: '2.3k', price: 'Starts at ₹399', image: '/AC technician.png' },
  { name: 'Plumbing Services', rating: '4.7', reviews: '1.8k', price: 'Starts at ₹299', image: '/repairing an under-sink pipe.png' },
  { name: 'Electrical Services', rating: '4.9', reviews: '1.2k', price: 'Starts at ₹199', image: '/electrician repairing.png' },
  { name: 'House Cleaning', rating: '4.6', reviews: '1.6k', price: 'Starts at ₹249', image: '/home-cleaning.png' },
];

export default function Home() {
  const { user, profile } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [realBookings, setRealBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    async function fetchUserBookings() {
      try {
        if (!user?.uid) return setRealBookings([]);
        setRealBookings((await OrderService.getUserOrders(user.uid, 'customer')).slice(0, 3));
      } catch (err) {
        console.error('Fetch user bookings error:', err);
      } finally {
        setLoadingBookings(false);
      }
    }

    fetchUserBookings();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUserBookings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', fetchUserBookings);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', fetchUserBookings);
    };
  }, [user?.uid]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: 'Pending', style: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'in_progress':
      case 'assigned':
      case 'on_the_way':
        return { text: 'Confirmed', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'work_in_progress':
      case 'working':
        return { text: 'In Progress', style: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'completed':
        return { text: 'Completed', style: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
      case 'cancelled':
        return { text: 'Cancelled', style: 'bg-rose-50 text-rose-600 border-rose-100' };
      default:
        return { text: 'Confirmed', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
    }
  };

  const getServiceIcon = (name?: string) => {
    const sName = (name || '').toLowerCase();
    if (sName.includes('plumb')) return { icon: Droplet, bg: 'bg-blue-50 text-blue-500' };
    if (sName.includes('electr')) return { icon: Zap, bg: 'bg-amber-50 text-amber-500' };
    if (sName.includes('clean')) return { icon: Sparkles, bg: 'bg-emerald-50 text-emerald-500' };
    if (sName.includes('carpent')) return { icon: Hammer, bg: 'bg-purple-50 text-purple-500' };
    return { icon: CalendarDays, bg: 'bg-emerald-50 text-emerald-600' };
  };

  const testimonials = [
    { text: "Great service! The expert arrived on time and fixed the issue quickly.", author: "- Neha S." },
    { text: "Very polite technician and affordable pricing. Highly recommended!", author: "- Rajesh K." },
    { text: "Instant booking and live map tracking made the experience effortless.", author: "- Ananya P." }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      
      {/* 1. Universal Global Header */}
      <Header />

      {/* Main Content Area Container for Desktop & Mobile */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4 pb-8">
        
        {/* 2. Hero Banner */}
        <section className="w-full">
          <Link href="/services" className="block group focus:outline-none">
            <div className="relative w-full aspect-[4/2] rounded-[20px] sm:rounded-[28px] overflow-hidden shadow-md bg-slate-900">
              <img
                src="/hero_plumbing_banner.jpg"
                alt="Expert Plumbing Solutions At Your Home"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </div>
          </Link>
        </section>

        {/* 3. Category Icons Grid */}
        <section className="w-full">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
            {categories.map((cat, idx) => (
              <Link href="/services" key={idx} className="flex flex-col items-center gap-1.5 group p-2 rounded-2xl hover:bg-slate-100/60 transition-colors">
                <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-transform active:scale-95 ${cat.bg}`}>
                  <cat.icon size={22} className={cat.color} />
                </div>
                <span className={`text-[10px] sm:text-xs font-bold text-center ${cat.active ? 'text-[#007AFF]' : 'text-slate-600'}`}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. Limited Time Offer Banner */}
        <section className="w-full">
          <div className="relative bg-gradient-to-r from-[#EBF3FF] to-[#D9E8FF] rounded-3xl p-5 sm:p-6 flex items-center justify-between overflow-hidden border border-blue-100/60 shadow-xs">
            <div className="space-y-1.5 z-10 max-w-[62%]">
              <span className="bg-[#007AFF] text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full inline-block">
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
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-4xl sm:text-5xl">
                🎁
              </div>
              <Link href="/services" className="w-9 h-9 sm:w-11 sm:h-11 bg-[#007AFF] hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all active:scale-95 shadow-md">
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>

        {/* 5. Why Choose Us? */}
        <section className="w-full space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">Why Choose Us?</h3>
            <Link href="/about" className="text-[11px] font-bold text-[#007AFF] hover:underline">View all</Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-1.5 shadow-xs">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                <ShieldCheck size={18} />
              </div>
              <h4 className="text-xs font-black text-slate-900 mt-1">Verified Pros</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">Background verified & trained experts</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-1.5 shadow-xs">
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100">
                <Clock size={18} />
              </div>
              <h4 className="text-xs font-black text-slate-900 mt-1">On-Time Service</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">Punctual & reliable service</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-1.5 shadow-xs">
              <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                <IndianRupee size={18} />
              </div>
              <h4 className="text-xs font-black text-slate-900 mt-1">Transparent Pricing</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">Upfront prices, no hidden charges</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-1.5 shadow-xs">
              <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center border border-teal-100">
                <ThumbsUp size={18} />
              </div>
              <h4 className="text-xs font-black text-slate-900 mt-1">Satisfaction Guaranteed</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">We've got your back</p>
            </div>
          </div>
        </section>

        {/* 6. Popular Services */}
        <section className="w-full space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">Popular Services</h3>
            <Link href="/services" className="text-[11px] font-bold text-[#007AFF] hover:underline">View all</Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {popularServices.map((serv, idx) => (
              <Link href="/services" key={idx} className="bg-white rounded-2xl p-3.5 border border-slate-100 flex flex-col justify-between gap-2.5 group shadow-xs hover:border-blue-200 transition-all">
                <div className="w-full h-28 sm:h-32 rounded-xl overflow-hidden bg-slate-100">
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
                <div className="w-full bg-[#EFF6FF] text-[#007AFF] font-extrabold text-[10px] sm:text-xs py-1.5 px-3 rounded-full text-center border border-blue-100">
                  {serv.price}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 7. Recent Bookings & Testimonials Grid on Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-2">
          
          {/* Recent Bookings */}
          <section className="w-full space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">Recent Bookings</h3>
              {user && realBookings.length > 0 && (
                <Link href="/dashboard/user" className="text-[11px] font-bold text-[#007AFF] hover:underline">View all</Link>
              )}
            </div>

            {loadingBookings ? (
              <div className="bg-white p-4 rounded-2xl border border-slate-100 animate-pulse flex items-center justify-between">
                <div className="h-4 w-32 bg-slate-100 rounded"></div>
                <div className="h-4 w-16 bg-slate-100 rounded"></div>
              </div>
            ) : realBookings.length > 0 ? (
              <div className="space-y-2.5">
                {realBookings.map((item, idx) => {
                  const badge = getStatusBadge(item.status);
                  const iconObj = getServiceIcon(item.serviceName);
                  const IconComp = iconObj.icon;
                  const createdDate = item.createdAt?.toDate?.() || (item.createdAt ? new Date(item.createdAt) : null);
                  const dateText = createdDate ? createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently';
                  const locationText = item.addressSnapshot?.city || 'Your address';

                  return (
                    <Link 
                      href={`/track?orderId=${item.id}`}
                      key={item.id || idx} 
                      className="bg-white p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 hover:border-blue-100 transition-colors shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-xl ${iconObj.bg} flex items-center justify-center shrink-0`}>
                          <IconComp size={20} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate">{item.serviceName || 'Repair Service'}</h4>
                          <p className="text-[10px] text-slate-400 font-medium truncate">{dateText} • {locationText}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className={`${badge.style} border text-[9px] font-extrabold px-3 py-1 rounded-full`}>
                          {badge.text}
                        </span>
                        <ChevronRight size={14} className="text-slate-300" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center space-y-3 shadow-xs h-full flex flex-col justify-center items-center">
                <div className="w-12 h-12 bg-blue-50 text-[#007AFF] rounded-full flex items-center justify-center">
                  <ClipboardList size={22} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-slate-900">No Recent Bookings</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Book a service now to track real-time progress!</p>
                </div>
                <Link href="/services/service" className="inline-block bg-[#007AFF] text-white text-[10px] font-black px-5 py-2 rounded-full active:scale-95 transition-all shadow-md">
                  Book Service Now
                </Link>
              </div>
            )}
          </section>

          {/* Testimonials */}
          <section className="w-full">
            <div className="bg-gradient-to-r from-[#EFF6FF] to-[#E0EDFF] rounded-3xl p-5 sm:p-6 border border-blue-100/60 flex flex-col justify-between gap-4 h-full shadow-xs">
              <div className="space-y-2">
                <div className="flex items-center -space-x-2">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                  <span className="w-7 h-7 rounded-full bg-[#007AFF] text-white text-[9px] font-black flex items-center justify-center border-2 border-white">
                    10K+
                  </span>
                </div>
                
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  Trusted by 10,000+ happy customers
                </h4>
                
                <div className="flex items-center gap-1 text-[#FFB800]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} className="fill-current" />
                  ))}
                  <span className="text-[10px] font-bold text-slate-700 ml-1">4.8 average rating</span>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-blue-100 space-y-2">
                <Quote size={14} className="text-[#007AFF] fill-[#007AFF]/20" />
                <p className="text-[10px] sm:text-xs text-slate-700 font-medium leading-relaxed">
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

        </div>

      </div>

      <Footer />
    </div>
  );
}
