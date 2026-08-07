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
  UserCheck,
  Phone,
  Globe,
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

const features = [
  { title: 'Live Tracking', desc: 'Track your service in real-time', icon: Zap, iconColor: 'text-[#FF6B00]', iconBg: 'bg-amber-50' },
  { title: 'Expert Teams', desc: 'Skilled & verified professionals', icon: Users, iconColor: 'text-[#007AFF]', iconBg: 'bg-blue-50' },
  { title: 'Secure Booking', desc: 'Safe, secure & hassle-free', icon: ShieldCheck, iconColor: 'text-[#10B981]', iconBg: 'bg-emerald-50' },
  { title: '24/7 Support', desc: "We're here to help anytime", icon: Headphones, iconColor: 'text-purple-500', iconBg: 'bg-purple-50' },
];

const popularServices = [
  { name: 'Plumbing Care', rating: '4.8', reviews: '128', price: '₹750', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400' },
  { name: 'Electrical Works', rating: '4.7', reviews: '96', price: '₹1,250', image: 'https://images.unsplash.com/photo-1621905252507-b3523c44dbf4?auto=format&fit=crop&q=80&w=400' },
  { name: 'HVAC Service', rating: '4.6', reviews: '84', price: '₹1,499', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400' },
  { name: 'Cleaning Services', rating: '4.7', reviews: '112', price: '₹699', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400' },
];

export default function Home() {
  const [locationText, setLocationText] = useState('ETAWAH');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      setIsLocating(true);
      try {
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const data = await res.json();
        
        if (data.city) {
          setLocationText(data.city.toUpperCase());
        } else {
          setLocationText('ETAWAH');
        }
      } catch (error) {
        console.error('IP Geolocation error', error);
        setLocationText('ETAWAH');
      } finally {
        setIsLocating(false);
      }
    };

    fetchLocation();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] pt-4">
      {/* Hero Section Card */}
      <section className="px-4">
        <div className="relative bg-gradient-to-b from-[#EBF3FF] to-[#D9E8FF] rounded-[28px] p-6 sm:p-8 overflow-hidden min-h-[420px] flex flex-col justify-between shadow-sm border border-blue-100/50">
          
          <div className="relative z-10 space-y-4 max-w-[60%] sm:max-w-[55%]">
            {/* Top Verified Badge */}
            <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-xs border border-blue-100/60">
              <ShieldCheck size={14} className="text-[#007AFF] fill-[#007AFF]/10" />
              <span className="text-[10px] font-extrabold text-[#007AFF] uppercase tracking-wider">VERIFIED & TRUSTED</span>
            </div>
            
            {/* Main Headline */}
            <div role="heading" aria-level={2} className="text-3xl sm:text-5xl font-black leading-[0.92] tracking-tight text-slate-900 uppercase">
              EXPERT<br />
              REPAIRS<br />
              <span className="text-[#007AFF]">ON</span><br />
              <span className="text-[#007AFF]">DEMAND.</span>
            </div>

            {/* Ratings & Subtitle */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <div className="flex text-[#FFB800]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="fill-current" />
                  ))}
                </div>
                <span className="text-[10px] text-slate-600 font-semibold">10,000+ happy clients</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed max-w-[210px]">
                Book trusted professionals for home repairs & maintenance.
              </p>
            </div>

            {/* Action Buttons Column */}
            <div className="flex flex-col gap-2.5 pt-2 max-w-[210px] relative z-20">
              <Link 
                href="/services" 
                className="w-full bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-5 rounded-full shadow-md shadow-blue-500/25 flex items-center justify-between active:scale-95 transition-all"
              >
                <span>BOOK SERVICE</span>
                <ChevronRight size={14} />
              </Link>
              
              <a 
                href="tel:+918679245568" 
                className="w-full bg-[#00A86B] hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider py-3 px-5 rounded-full shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Phone size={14} />
                <span>+91 8679245568</span>
              </a>

              <button 
                onClick={() => {
                  if (locationText === 'ETAWAH' || locationText === 'AVAILABLE NEAR YOU') {
                     navigator.geolocation.getCurrentPosition(() => window.location.reload());
                  }
                }}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs uppercase tracking-wider py-3 px-5 rounded-full shadow-xs border border-slate-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <MapPin size={14} className={isLocating ? "text-slate-400 animate-pulse" : "text-[#FF6B00]"} /> 
                <span>{isLocating ? 'DETECTING...' : locationText}</span>
              </button>
            </div>
          </div>

          {/* Hero 3D House Image on Right */}
          <div className="absolute right-0 bottom-0 w-[48%] max-w-[260px] sm:max-w-[340px] h-[90%] z-0 pointer-events-none flex items-end justify-end p-2">
            <img src="/hero_house_3d.png" alt="House Repairs" className="w-full h-full object-contain object-bottom drop-shadow-md" />
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="mt-7 px-4">
        <div className="flex overflow-x-auto hide-scrollbar justify-between items-center gap-2 pb-3 border-b-2 border-slate-100/80">
          {categories.map((category, idx) => (
            <Link href="/services" key={idx} className="flex flex-col items-center gap-1.5 flex-1 min-w-[68px] group">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xs border border-slate-100 transition-transform active:scale-95 ${category.bg} ${category.active ? 'ring-2 ring-[#007AFF]/20 border-[#007AFF]' : ''}`}>
                <category.icon className={`w-6 h-6 ${category.color}`} />
              </div>
              <span className={`text-[10px] font-bold text-center ${category.active ? 'text-[#007AFF]' : 'text-slate-600'}`}>{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Grid 2x2 */}
      <section className="mt-6 px-4">
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white p-3.5 rounded-2xl flex items-center justify-between gap-2 shadow-xs border border-slate-100/80 active:scale-95 transition-transform">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${feature.iconBg}`}>
                  <feature.icon className={`w-4 h-4 ${feature.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{feature.title}</h3>
                  <p className="text-[9px] text-slate-500 leading-tight truncate">{feature.desc}</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-300 shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* Stats Strip */}
      <section className="mt-6 px-4">
        <div className="bg-white rounded-2xl p-4 flex justify-between items-center shadow-xs border border-slate-100 divide-x divide-slate-100 overflow-x-auto hide-scrollbar">
          <div className="flex flex-col items-center gap-1 px-4 min-w-fit">
            <Users size={18} className="text-blue-500" />
            <span className="text-sm font-bold text-slate-900">10K+</span>
            <span className="text-[8px] text-slate-500 font-semibold">Happy Customers</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4 min-w-fit">
            <UserCheck size={18} className="text-orange-500" />
            <span className="text-sm font-bold text-slate-900">500+</span>
            <span className="text-[8px] text-slate-500 font-semibold">Expert Technicians</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4 min-w-fit">
            <Star size={18} className="text-green-500 fill-green-500" />
            <span className="text-sm font-bold text-slate-900">4.9</span>
            <span className="text-[8px] text-slate-500 font-semibold">Customer Rating</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4 min-w-fit">
            <MapPin size={18} className="text-purple-500" />
            <span className="text-sm font-bold text-slate-900">50+</span>
            <span className="text-[8px] text-slate-500 font-semibold">Cities Covered</span>
          </div>
        </div>
      </section>

      {/* Popular Services */}
      <section className="mt-8">
        <div className="flex justify-between items-end px-4 mb-3">
          <h2 className="text-sm font-black uppercase tracking-tight text-slate-900">
            Popular <span className="text-[#007AFF]">Services in Etawah</span>
          </h2>
          <Link href="/services" className="text-[10px] font-bold text-[#007AFF] flex items-center gap-1">
            View all <ChevronRight size={12} />
          </Link>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar gap-3 px-4 pb-4">
          {popularServices.map((service, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-3 min-w-[160px] max-w-[200px] shadow-xs border border-slate-100 flex flex-col gap-3">
              <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-100">
                <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-xs font-bold text-slate-900 truncate">{service.name}</h3>
                <div className="flex items-center gap-1">
                  <Star size={10} className="text-[#FFB800] fill-[#FFB800]" />
                  <span className="text-[10px] font-bold text-slate-700">{service.rating}</span>
                  <span className="text-[9px] text-slate-400">({service.reviews})</span>
                </div>
                <div className="text-sm font-black text-slate-900">{service.price}</div>
              </div>
              <Link href="/services" className="w-full bg-[#007AFF] text-white py-2 rounded-xl text-[10px] font-bold text-center block hover:bg-blue-600 active:scale-95 transition-all">
                Book Now
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mt-6 px-4">
        <div className="flex justify-between items-end mb-5">
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
            <div className="w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center font-bold text-[10px] shadow-xs">1</div>
            <div className="w-10 h-10 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center mt-1">
              <ClipboardList className="w-5 h-5 text-[#007AFF]" />
            </div>
            <h4 className="text-[9px] font-bold text-slate-900 mt-1">Select Service</h4>
            <p className="text-[7px] text-slate-500 leading-tight">Choose the service<br/>you need</p>
          </div>

          <div className="flex flex-col items-center text-center gap-2 w-[70px]">
            <div className="w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center font-bold text-[10px] shadow-xs">2</div>
            <div className="w-10 h-10 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center mt-1">
              <CalendarDays className="w-5 h-5 text-[#007AFF]" />
            </div>
            <h4 className="text-[9px] font-bold text-slate-900 mt-1">Choose Schedule</h4>
            <p className="text-[7px] text-slate-500 leading-tight">Pick a convenient<br/>date & time</p>
          </div>

          <div className="flex flex-col items-center text-center gap-2 w-[70px]">
            <div className="w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center font-bold text-[10px] shadow-xs">3</div>
            <div className="w-10 h-10 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center mt-1">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <h4 className="text-[9px] font-bold text-slate-900 mt-1">Confirm Booking</h4>
            <p className="text-[7px] text-slate-500 leading-tight">Confirm and pay<br/>securely</p>
          </div>

          <div className="flex flex-col items-center text-center gap-2 w-[70px]">
            <div className="w-6 h-6 rounded-full bg-[#007AFF] text-white flex items-center justify-center font-bold text-[10px] shadow-xs">4</div>
            <div className="w-10 h-10 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center mt-1 overflow-hidden">
               <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150" alt="Technician" className="w-full h-full object-cover" />
            </div>
            <h4 className="text-[9px] font-bold text-slate-900 mt-1">Technician Arrives</h4>
            <p className="text-[7px] text-slate-500 leading-tight">Our expert will reach<br/>your location</p>
          </div>
        </div>
      </section>

      {/* Subscribe & Direct Contact Banner */}
      <section className="mt-8 px-4 mb-6">
        <div className="bg-[#0A1629] rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-transparent to-transparent opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10 space-y-3 max-w-xl text-left w-full">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-blue-400">Subscribe & Stay Connected</p>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight uppercase tracking-tight">
              Get Exclusive Offers & <span className="text-[#007AFF]">Instant Support</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md">
              Subscribe with your phone number to receive instant repair updates, or reach us directly via our hotline or website.
            </p>

            {/* Subscribe Form & Contact Buttons */}
            <div className="pt-2 space-y-3">
              <form 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  const val = (e.currentTarget.querySelector('input')?.value || '').trim();
                  alert('Thank you for subscribing! We will send updates to ' + (val || 'your phone number') + '.'); 
                }} 
                className="flex items-center gap-2 max-w-md bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/20"
              >
                <input 
                  type="tel" 
                  placeholder="Enter phone number to subscribe" 
                  className="bg-transparent text-white text-xs px-4 py-2 focus:outline-none w-full placeholder:text-slate-400" 
                  required 
                />
                <button type="submit" className="bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-full whitespace-nowrap active:scale-95 transition-all shadow-md">
                  Subscribe
                </button>
              </form>

              {/* Direct Action Pills with Phone Number & Website Link */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a 
                  href="tel:+918679245568" 
                  className="inline-flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95"
                >
                  <Phone size={14} className="text-emerald-400" />
                  <span>Call: +91 8679245568</span>
                </a>

                <a 
                  href="https://gorepireo.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95"
                >
                  <Globe size={14} className="text-blue-400" />
                  <span>gorepireo.in</span>
                </a>
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full md:w-auto flex justify-end shrink-0 pointer-events-none">
             <img src="/bottom_toolbox_3d.png" alt="Toolbox" className="w-44 h-44 sm:w-52 sm:h-52 object-contain" />
          </div>
        </div>
      </section>

      {/* SEO Content Block */}
      <section className="mt-6 px-4 mb-4">
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
