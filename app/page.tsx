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
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/Avatar';

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

export default function Home() {
  const { user } = useAuth();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [realBookings, setRealBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    async function fetchUserBookings() {
      if (!user?.email) {
        setRealBookings([]);
        setLoadingBookings(false);
        return;
      }

      try {
        const { data: userOrders } = await insforge.database
          .from('orders')
          .select('*')
          .or(`user_email.eq.${user.email},customer_email.eq.${user.email}`)
          .order('created_at', { ascending: false })
          .limit(3);

        if (userOrders) {
          setRealBookings(userOrders);
        }
      } catch (err) {
        console.error('Fetch user bookings error:', err);
      } finally {
        setLoadingBookings(false);
      }
    }

    fetchUserBookings();
  }, [user]);

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

      {/* 2. Royal Blue Hero Banner (Carousel) */}
      <section className="px-4 mt-3">
        <div className="relative bg-gradient-to-r from-[#002B66] via-[#0B3C85] to-[#062557] rounded-[24px] p-4 sm:p-6 overflow-hidden text-white min-h-[170px] sm:min-h-[220px]">
          
          <div className="relative z-10 space-y-2 max-w-[62%] sm:max-w-[58%]">
            {/* Top Left Outline Badge */}
            <div className="inline-block border border-[#FFC700] text-[#FFC700] bg-black/20 font-black text-[8px] sm:text-[10px] px-3 py-0.5 rounded-full uppercase tracking-wider">
              TRUSTED EXPERTS
            </div>

            {/* Main Headline */}
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-black leading-tight tracking-tight uppercase">
              <span className="text-[#FFC700]">EXPERT REPAIRS,</span><br />
              <span className="text-white">HOME SERVICES IN ETAWAH.</span>
            </h1>

            {/* Subtitle Bullets */}
            <div className="text-[9px] sm:text-xs text-blue-100/90 font-medium leading-tight space-y-0.5">
              <p>Verified Professionals • On-Time Service</p>
              <p>Upfront Pricing • 100% Satisfaction</p>
            </div>

            {/* Book a Service Button */}
            <div className="pt-1">
              <Link 
                href="/services" 
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-[#0B3C85] font-extrabold text-[11px] sm:text-xs px-5 py-2 rounded-full transition-all active:scale-95"
              >
                <span>Book a Service</span>
                <ArrowRight size={13} className="text-[#0B3C85]" />
              </Link>
            </div>

            {/* Bottom Left 10K+ Happy Customers Avatars */}
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              <div className="flex -space-x-1.5">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white object-cover" />
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white object-cover" />
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white object-cover" />
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-white object-cover" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-white tracking-tight">10K+ Happy Customers</span>
            </div>
          </div>

          {/* Center-Right Technician Image generated specifically for this banner */}
          <div className="absolute right-0 bottom-0 w-[48%] max-w-[240px] sm:max-w-[340px] h-[100%] pointer-events-none flex items-end justify-end">
            <img src="/hero_technician_banner.png" alt="Technician" className="w-full h-full object-cover object-center rounded-r-[24px]" />
          </div>

          {/* Right Floating Badge 1: 24/7 Support */}
          <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white text-slate-900">
            <Headphones size={15} className="text-[#007AFF]" />
            <div className="text-left">
              <span className="text-xs font-black text-[#007AFF] block leading-tight">24/7</span>
              <span className="text-[8px] text-slate-500 font-bold block leading-tight">Support</span>
            </div>
          </div>

          {/* Right Floating Badge 2: 4.8 Rating */}
          <div className="absolute bottom-4 right-4 z-20 hidden sm:block bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-white text-slate-900 min-w-[100px]">
            <div className="text-sm font-black text-slate-900 leading-tight">4.8</div>
            <div className="flex text-amber-400 my-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={10} className="fill-current" />
              ))}
            </div>
            <p className="text-[8px] text-slate-400 font-semibold">(2.3k reviews)</p>
          </div>

          {/* Bottom Center Carousel Notch & Indicator Dots */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white px-3 py-0.5 rounded-t-full z-20 flex items-center justify-center gap-1 border-t border-x border-slate-100">
            <span className="w-2 h-2 rounded-full bg-[#007AFF]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
          </div>
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

      {/* 8. Recent Bookings (Real User Orders - No Fake Faces) */}
      <section className="mt-7 px-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Recent Bookings</h3>
          {user && realBookings.length > 0 && (
            <Link href="/dashboard/user" className="text-[11px] font-bold text-[#007AFF] hover:underline">View all</Link>
          )}
        </div>

        {loadingBookings ? (
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs animate-pulse flex items-center justify-between">
            <div className="h-4 w-32 bg-slate-100 rounded"></div>
            <div className="h-4 w-16 bg-slate-100 rounded"></div>
          </div>
        ) : realBookings.length > 0 ? (
          <div className="space-y-2.5">
            {realBookings.map((item, idx) => {
              const badge = getStatusBadge(item.status);
              const iconObj = getServiceIcon(item.service_name);
              const IconComp = iconObj.icon;
              const dateText = item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently';
              const locationText = item.city || item.details?.city || 'Etawah';

              return (
                <Link 
                  href={`/track?id=${item.id}`} 
                  key={item.id || idx} 
                  className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-3 hover:border-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${iconObj.bg} flex items-center justify-center shrink-0`}>
                      <IconComp size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 truncate">{item.service_name || 'Repair Service'}</h4>
                      <p className="text-[10px] text-slate-400 font-medium truncate">{dateText} • {locationText}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`${badge.style} border text-[9px] font-extrabold px-3 py-1 rounded-full`}>
                      {badge.text}
                    </span>
                    {item.worker_avatar ? (
                      <Avatar src={item.worker_avatar} name={item.worker_name || 'Worker'} size={32} />
                    ) : null}
                    <ChevronRight size={14} className="text-slate-300" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs text-center space-y-3">
            <div className="w-12 h-12 bg-blue-50 text-[#007AFF] rounded-full mx-auto flex items-center justify-center">
              <ClipboardList size={22} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-900">No Recent Bookings</h4>
              <p className="text-[10px] text-slate-400 font-medium">Book a service now to track real-time progress!</p>
            </div>
            <Link href="/services/service" className="inline-block bg-[#007AFF] text-white text-[10px] font-black px-4 py-2 rounded-full shadow-xs active:scale-95 transition-all">
              Book Service Now
            </Link>
          </div>
        )}
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



      <Footer />
    </div>
  );
}
