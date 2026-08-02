'use client';

import { useState, useEffect } from 'react';

import { 
  ChevronRight, 
  MapPin, 
  Star, 
  Zap, 
  Users, 
  ShieldCheck,
  Headphones,
  LayoutGrid,
  Droplet,
  Sparkles,
  Paintbrush,
  Hammer,
  Snowflake,
  ClipboardList,
  CalendarDays,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';

const categories = [
  { name: 'All Services', icon: LayoutGrid, color: 'text-blue-500', bg: 'bg-blue-50', active: true },
  { name: 'Plumbing', icon: Droplet, color: 'text-blue-400', bg: 'bg-white' },
  { name: 'Electrical', icon: Zap, color: 'text-orange-400', bg: 'bg-white' },
  { name: 'Cleaning', icon: Sparkles, color: 'text-green-400', bg: 'bg-white' },
  { name: 'Painting', icon: Paintbrush, color: 'text-red-400', bg: 'bg-white' },
  { name: 'Carpentry', icon: Hammer, color: 'text-amber-700', bg: 'bg-white' },
  { name: 'HVAC', icon: Snowflake, color: 'text-cyan-400', bg: 'bg-white' },
];

const features = [
  { title: 'Live Tracking', desc: 'Track your service in real-time', icon: Zap, iconColor: 'text-orange-500', iconBg: 'bg-orange-50' },
  { title: 'Expert Teams', desc: 'Skilled & verified professionals', icon: Users, iconColor: 'text-blue-500', iconBg: 'bg-blue-50' },
  { title: 'Secure Booking', desc: 'Safe, secure & hassle-free', icon: ShieldCheck, iconColor: 'text-green-500', iconBg: 'bg-green-50' },
  { title: '24/7 Support', desc: "We're here to help anytime", icon: Headphones, iconColor: 'text-purple-500', iconBg: 'bg-purple-50' },
];

const popularServices = [
  { name: 'Plumbing Care', rating: '4.8', reviews: '128', price: '₹750', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400' },
  { name: 'Electrical Works', rating: '4.7', reviews: '96', price: '₹1,250', image: 'https://images.unsplash.com/photo-1621905252507-b3523c44dbf4?auto=format&fit=crop&q=80&w=400' },
  { name: 'HVAC Service', rating: '4.6', reviews: '84', price: '₹1,499', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400' },
  { name: 'Cleaning Services', rating: '4.7', reviews: '112', price: '₹699', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400' },
];

export default function Home() {
  const [locationText, setLocationText] = useState('Available Near You');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      setIsLocating(true);
      try {
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const data = await res.json();
        
        if (data.city) {
          setLocationText(data.city);
        } else {
          setLocationText('Available Near You');
        }
      } catch (error) {
        console.error('IP Geolocation error', error);
        setLocationText('Available Near You');
      } finally {
        setIsLocating(false);
      }
    };

    fetchLocation();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] pb-32 pt-6">
      {/* Hero Section */}
      <section className="px-4">
        <div className="relative bg-gradient-to-br from-[#e8f0fe] to-[#d6e4ff] rounded-3xl p-6 overflow-hidden min-h-[340px] flex items-center justify-between">
          <div className="relative z-10 space-y-3.5 max-w-[58%] sm:max-w-[62%]">
            <div className="inline-flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-100">
              <ShieldCheck size={12} className="text-[#007AFF] fill-[#007AFF]/20" />
              <span className="text-[9px] font-bold text-[#007AFF] uppercase tracking-widest">Verified & Trusted</span>
            </div>
            
            <div role="heading" aria-level={2} className="text-3xl sm:text-5xl font-black leading-[0.95] tracking-tight text-slate-900">
              EXPERT<br />REPAIRS<br />
              <span className="text-[#007AFF]">ON DEMAND.</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex text-[#FFB800]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} className="fill-current" />
                  ))}
                </div>
                <span className="text-[9px] text-slate-600 font-medium">10,000+ happy clients</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed max-w-[200px]">
                Book trusted professionals for home repairs & maintenance.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1 relative z-20">
              <Link href="/services" className="bg-[#007AFF] text-white px-3.5 py-2 rounded-full text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 hover:bg-blue-600 active:scale-95 transition-all">
                Book Service <ChevronRight size={12} />
              </Link>
              <button 
                onClick={() => {
                  if (locationText === 'Available Near You' || locationText === 'Location Unavailable') {
                     navigator.geolocation.getCurrentPosition(() => window.location.reload());
                  }
                }}
                className="bg-white/80 backdrop-blur-sm text-slate-700 px-3 py-2 rounded-full text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 border border-white shadow-sm"
              >
                <MapPin size={11} className={isLocating ? "text-slate-400 animate-pulse" : "text-[#FF6B00]"} /> 
                {isLocating ? 'Detecting...' : locationText}
              </button>
            </div>
          </div>

          {/* Hero Image - Right Aligned & Constrained */}
          <div className="absolute right-0 bottom-0 w-[42%] max-w-[240px] sm:max-w-[320px] h-[85%] z-0 pointer-events-none flex items-end justify-end">
            <img src="/hero_house_3d.png" alt="House Repairs" className="w-full h-full object-contain object-bottom" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mt-8 px-4">
        <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2">
          {categories.map((category, idx) => (
            <Link href="/services" key={idx} className="flex flex-col items-center gap-2 min-w-[72px] group">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm border border-slate-100 transition-transform active:scale-95 ${category.bg} ${category.active ? 'border-blue-200 shadow-blue-100' : ''}`}>
                <category.icon className={`w-6 h-6 ${category.color}`} />
              </div>
              <span className={`text-[10px] font-semibold text-center ${category.active ? 'text-[#007AFF]' : 'text-slate-600'}`}>{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="mt-8 px-4">
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl flex items-center gap-3 shadow-sm border border-slate-100 active:scale-95 transition-transform">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${feature.iconBg}`}>
                <feature.icon className={`w-5 h-5 ${feature.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-bold text-slate-900 truncate">{feature.title}</h3>
                <p className="text-[9px] text-slate-500 leading-snug pr-2">{feature.desc}</p>
              </div>
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Stats Strip */}
      <section className="mt-8 px-4">
        <div className="bg-white rounded-2xl p-4 flex justify-between items-center shadow-sm border border-slate-100 divide-x divide-slate-100 overflow-x-auto hide-scrollbar">
          <div className="flex flex-col items-center gap-1 px-4 min-w-fit">
            <Users size={18} className="text-blue-500" />
            <span className="text-sm font-bold text-slate-900">10K+</span>
            <span className="text-[8px] text-slate-500">Happy Customers</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4 min-w-fit">
            <UserCheck size={18} className="text-orange-500" />
            <span className="text-sm font-bold text-slate-900">500+</span>
            <span className="text-[8px] text-slate-500">Expert Technicians</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4 min-w-fit">
            <Star size={18} className="text-green-500 fill-green-500" />
            <span className="text-sm font-bold text-slate-900">4.9</span>
            <span className="text-[8px] text-slate-500">Customer Rating</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4 min-w-fit">
            <MapPin size={18} className="text-purple-500" />
            <span className="text-sm font-bold text-slate-900">50+</span>
            <span className="text-[8px] text-slate-500">Cities Covered</span>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="mt-8">
        <div className="flex justify-between items-end px-4 mb-4">
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">
            Popular <span className="text-[#007AFF]">Services in Etawah</span>
          </h2>
          <Link href="/services" className="text-[10px] font-bold text-[#007AFF] flex items-center gap-1">
            View all <ChevronRight size={12} />
          </Link>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar gap-4 px-4 pb-4">
          {popularServices.map((service, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-3 min-w-[160px] max-w-[200px] shadow-sm border border-slate-100 flex flex-col gap-3">
              <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-100">
                <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-xs font-bold text-slate-900 truncate">{service.name}</h3>
                <div className="flex items-center gap-1">
                  <Star size={10} className="text-[#FFB800] fill-[#FFB800]" />
                  <span className="text-[10px] font-bold text-slate-700">{service.rating}</span>
                  <span className="text-[9px] text-slate-400">({service.reviews})</span>
                </div>
                <div className="text-sm font-black text-slate-900">{service.price}</div>
              </div>
              <button className="w-full bg-[#007AFF] text-white py-2 rounded-xl text-[10px] font-bold hover:bg-blue-600 active:scale-95 transition-all">
                Book Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mt-6 px-4">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">
            How it <span className="text-[#007AFF]">Works</span>
          </h2>
          <Link href="/services" className="text-[10px] font-bold text-[#007AFF] flex items-center gap-1">
            View all <ChevronRight size={12} />
          </Link>
        </div>

        <div className="flex items-start justify-between relative px-2">
          {/* Connecting line */}
          <div className="absolute top-4 left-6 right-6 h-[2px] border-t-2 border-dashed border-slate-200 -z-10"></div>
          
          <div className="flex flex-col items-center text-center gap-2 w-[70px]">
            <div className="w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center font-bold text-[10px] shadow-md shadow-blue-500/20">1</div>
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mt-1">
              <ClipboardList className="w-5 h-5 text-[#007AFF]" />
            </div>
            <h4 className="text-[9px] font-bold text-slate-900 mt-1">Select Service</h4>
            <p className="text-[7px] text-slate-500 leading-tight">Choose the service<br/>you need</p>
          </div>

          <div className="flex flex-col items-center text-center gap-2 w-[70px]">
            <div className="w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center font-bold text-[10px] shadow-md shadow-blue-500/20">2</div>
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mt-1">
              <CalendarDays className="w-5 h-5 text-[#007AFF]" />
            </div>
            <h4 className="text-[9px] font-bold text-slate-900 mt-1">Choose Schedule</h4>
            <p className="text-[7px] text-slate-500 leading-tight">Pick a convenient<br/>date & time</p>
          </div>

          <div className="flex flex-col items-center text-center gap-2 w-[70px]">
            <div className="w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center font-bold text-[10px] shadow-md shadow-blue-500/20">3</div>
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mt-1">
              <ShieldCheck className="w-5 h-5 text-green-500" />
            </div>
            <h4 className="text-[9px] font-bold text-slate-900 mt-1">Confirm Booking</h4>
            <p className="text-[7px] text-slate-500 leading-tight">Confirm and pay<br/>securely</p>
          </div>

          <div className="flex flex-col items-center text-center gap-2 w-[70px]">
            <div className="w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center font-bold text-[10px] shadow-md shadow-blue-500/20">4</div>
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mt-1 overflow-hidden">
               <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150" alt="Technician" className="w-full h-full object-cover" />
            </div>
            <h4 className="text-[9px] font-bold text-slate-900 mt-1">Technician Arrives</h4>
            <p className="text-[7px] text-slate-500 leading-tight">Our expert will reach<br/>your location</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="mt-10 px-4 mb-8">
        <div className="bg-[#0A1629] rounded-3xl p-6 relative overflow-hidden min-h-[160px] flex items-center shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10 space-y-3 max-w-[60%]">
            <p className="text-[8px] font-bold uppercase tracking-widest text-blue-400">PROFESSIONAL SUPPORT</p>
            <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">
              GET HELP <span className="text-[#007AFF]">FASTER.</span>
            </h2>
            <p className="text-[9px] text-slate-400 leading-relaxed max-w-[160px]">
              Fast, reliable and trusted home repair solutions. We're just a tap away!
            </p>
            <Link href="/services" className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-wider mt-2 hover:bg-slate-100 active:scale-95 transition-all">
              BOOK A SERVICE <ChevronRight size={12} />
            </Link>
          </div>

          <div className="absolute -right-6 -bottom-6 w-52 h-52 z-0 pointer-events-none">
             <img src="/bottom_toolbox_3d.png" alt="Toolbox" className="w-full h-full object-contain" />
          </div>
        </div>
      </section>

      {/* SEO Content Block (Visually subtle but accessible for search engines) */}
      <section className="mt-8 px-4 mb-4">
        <div className="bg-white/50 rounded-2xl p-6 border border-slate-100 text-left">
          <h1 className="text-xs font-bold text-slate-900 mb-2">Expert Home Repairs & Services On-Demand in Etawah</h1>
          <h2 className="text-[11px] font-semibold text-slate-800 mb-1">Trusted Local Professionals for Every Home Need</h2>
          <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
            Welcome to Go_Repireo, India's premier all-in-one home services marketplace, bringing trusted and verified professionals directly to your doorstep in Etawah. Whether you're dealing with an emergency plumbing leak, require a certified electrician, need urgent AC repair, or simply want a deep cleaning for your home, Go_Repireo connects you with top-rated local experts in seconds.
          </p>
          <h2 className="text-[11px] font-semibold text-slate-800 mb-1">How Go_Repireo Works: Instant Booking & Live Tracking</h2>
          <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
            Experience the future of home maintenance with instant online bookings, real-time technician tracking on a live map, secure online payments, and transparent pricing. From minor fixes to major installations, Go_Repireo makes managing your home repairs fast, affordable, and completely hassle-free.
          </p>
          <h2 className="text-[11px] font-semibold text-slate-800 mb-1">Why Choose Go_Repireo for Your Home Maintenance?</h2>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Our mission is to provide professional doorstep home services with transparent pricing, verified workers, secure payments, and exceptional customer satisfaction. From minor household repairs to major maintenance projects, Go_Repireo is your one-stop destination for every home service need.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
