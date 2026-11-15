'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, 
  ChevronRight, 
  ArrowRight, 
  CalendarDays, 
  CheckCircle2, 
  Zap, 
  Hammer, 
  Copy
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { OrderService } from '@/lib/services/order.service';
import NotServiceableYet from '@/components/NotServiceableYet';
import { HomePageSkeleton } from '@/components/SkeletonLoader';

// Custom icons matching the user's reference mockup
const FaucetIcon = ({ size = 26, className = "text-[#007AFF]" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5 10h11a4 4 0 0 0 4-4V5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.5 8h4v4h-4z" fill="currentColor"/>
    <path d="M13 10v4h-3v-4" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.5 17.5a1.5 1.5 0 1 1-3 0c0-1.2 1.5-2.5 1.5-2.5s1.5 1.3 1.5 2.5z" fill="currentColor"/>
  </svg>
);

const BroomIcon = ({ size = 24, className = "text-[#007AFF]" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="m15 4-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M6 13l4 4-2.5 4-5-1.5 3.5-6.5Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M18 7l1-1m2 3l-1-1m-3 7l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const WashingMachineIcon = ({ size = 24, className = "text-[#007AFF]" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="2.2"/>
    <circle cx="8" cy="6" r="1.2" fill="currentColor"/>
    <path d="M12 6h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="14" r="4.5" stroke="currentColor" strokeWidth="2.2"/>
    <path d="M10 14a2 2 0 0 1 2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const mainServices = [
  {
    title: 'Plumbing',
    href: '/services/plumbing',
    icon: FaucetIcon,
    bg: 'bg-[#EEF5FF]',
    border: 'border-blue-100/60',
    color: 'text-[#007AFF]',
  },
  {
    title: 'Electrical',
    href: '/services/electrical',
    icon: Zap,
    bg: 'bg-[#FFF5ED]',
    border: 'border-orange-100/60',
    color: 'text-[#FF9900] fill-[#FF9900]',
  },
  {
    title: 'Cleaning',
    href: '/services/cleaning',
    icon: BroomIcon,
    bg: 'bg-[#EEF5FF]',
    border: 'border-blue-100/60',
    color: 'text-[#007AFF]',
  },
  {
    title: 'Carpentry',
    href: '/services/carpentry',
    icon: Hammer,
    bg: 'bg-[#FFF5ED]',
    border: 'border-orange-100/60',
    color: 'text-[#FF9900]',
  },
  {
    title: 'Appliance Repair',
    href: '/services/appliance',
    icon: WashingMachineIcon,
    bg: 'bg-[#EEF5FF]',
    border: 'border-blue-100/60',
    color: 'text-[#007AFF]',
  },
];

export default function Home() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [realBookings, setRealBookings] = useState<any[]>([]);

  // Tri-state Serviceability: 'checking' | 'serviceable' | 'unserviceable'
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'serviceable' | 'unserviceable'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('preview_unserviceable') === '1') return 'unserviceable';
      const cached = localStorage.getItem('repireo_is_serviceable');
      if (cached === 'true') return 'serviceable';
      if (cached === 'false') return 'unserviceable';
    }
    return 'serviceable';
  });

  const [isCheckingServiceability, setIsCheckingServiceability] = useState<boolean>(false);
  const [detectedLocationName, setDetectedLocationName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('repireo_detected_location') || '';
    }
    return '';
  });

  const checkServiceability = async (lat: number, lng: number, addressName?: string) => {
    setIsCheckingServiceability(true);
    if (addressName) {
      setDetectedLocationName(addressName);
      if (typeof window !== 'undefined') {
        localStorage.setItem('repireo_detected_location', addressName);
      }
    }
    try {
      const res = await fetch(`/api/serviceability?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        const ok = data.serviceable !== false;
        setServiceStatus(ok ? 'serviceable' : 'unserviceable');
        if (typeof window !== 'undefined') {
          localStorage.setItem('repireo_is_serviceable', ok ? 'true' : 'false');
          localStorage.setItem('repireo_customer_lat', String(lat));
          localStorage.setItem('repireo_customer_lng', String(lng));
        }
      } else {
        setServiceStatus('serviceable');
      }
    } catch (err) {
      console.warn('Error checking serviceability:', err);
      setServiceStatus('serviceable');
    } finally {
      setIsCheckingServiceability(false);
    }
  };

  const handleRecheckGps = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsCheckingServiceability(true);
      setServiceStatus('checking');
      localStorage.removeItem('repireo_location_source');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          checkServiceability(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setIsCheckingServiceability(false);
          setServiceStatus('serviceable');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('preview_unserviceable') === '1') {
        setServiceStatus('unserviceable');
        setDetectedLocationName('Mumbai, Maharashtra');
        return;
      }

      const qLat = urlParams.get('lat');
      const qLng = urlParams.get('lng');
      if (qLat && qLng) {
        checkServiceability(parseFloat(qLat), parseFloat(qLng), urlParams.get('area') || 'Selected Area');
        return;
      }

      const isManual = localStorage.getItem('repireo_location_source') === 'manual';
      const cachedLoc = localStorage.getItem('repireo_detected_location');
      const cachedLat = localStorage.getItem('repireo_customer_lat');
      const cachedLng = localStorage.getItem('repireo_customer_lng');
      if (cachedLoc) setDetectedLocationName(cachedLoc);

      if (isManual && cachedLat && cachedLng) {
        checkServiceability(parseFloat(cachedLat), parseFloat(cachedLng), cachedLoc || undefined);
      } else {
        if (cachedLat && cachedLng) {
          checkServiceability(parseFloat(cachedLat), parseFloat(cachedLng), cachedLoc || undefined);
        }

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              checkServiceability(pos.coords.latitude, pos.coords.longitude);
            },
            (err) => {
              console.warn('Real device GPS prompt or error:', err.message);
              if (!cachedLat || !cachedLng) {
                setServiceStatus('serviceable');
              }
            },
            { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 }
          );
        } else {
          if (!cachedLat || !cachedLng) {
            setServiceStatus('serviceable');
          }
        }
      }

      const handleLocationChange = (e: Event) => {
        const customEvent = e as CustomEvent<{ lat: number; lng: number; address: string }>;
        if (customEvent.detail?.lat && customEvent.detail?.lng) {
          setServiceStatus('checking');
          checkServiceability(customEvent.detail.lat, customEvent.detail.lng, customEvent.detail.address);
        }
      };

      window.addEventListener('repireo_location_updated', handleLocationChange);
      return () => window.removeEventListener('repireo_location_updated', handleLocationChange);
    }
  }, []);

  useEffect(() => {
    async function fetchUserBookings() {
      try {
        if (!user?.uid) return setRealBookings([]);
        setRealBookings((await OrderService.getUserOrders(user.uid, 'customer')).slice(0, 3));
      } catch (err) {
        console.error('Fetch user bookings error:', err);
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

  // Compute greeting and user name
  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getCleanUserName = () => {
    const rawName = (profile as any)?.full_name || (profile as any)?.name;
    if (rawName && typeof rawName === 'string' && rawName.trim() && !rawName.includes('@')) {
      return rawName.trim().split(' ')[0];
    }
    const storedName = typeof window !== 'undefined' ? localStorage.getItem('repireo_user_name') : null;
    if (storedName && typeof storedName === 'string' && storedName.trim() && !storedName.includes('@')) {
      return storedName.trim().split(' ')[0];
    }
    const dispName = profile?.display_name;
    if (dispName && typeof dispName === 'string' && dispName.trim() && !dispName.includes('@')) {
      return dispName.trim().split(' ')[0];
    }
    if (user?.email) {
      const alphaOnly = user.email.split('@')[0].replace(/[0-9]/g, '');
      if (alphaOnly.length >= 3) {
        return alphaOnly.charAt(0).toUpperCase() + alphaOnly.slice(1);
      }
    }
    return 'Prithibi';
  };

  const handleCopyPromo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText('GET20');
      showToast('Promo code GET20 copied to clipboard!', 'success');
    }
  };

  const greetingTime = getGreetingTime();
  const displayName = getCleanUserName();

  const activeBooking = realBookings.length > 0 ? realBookings[0] : null;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      
      {/* 1. Universal Top Header (Location Pill & Notification Bell) */}
      <Header showGreeting={false} />

      {/* Main Content Container */}
      {serviceStatus === 'checking' ? (
        <HomePageSkeleton />
      ) : serviceStatus === 'unserviceable' ? (
        <div className="flex-1 flex flex-col justify-center py-4 sm:py-8">
          <NotServiceableYet
            currentLocationName={detectedLocationName}
            isChecking={isCheckingServiceability}
            onOpenLocationPicker={() => {
              window.dispatchEvent(new Event('repireo_open_location_modal'));
            }}
            onRefresh={handleRecheckGps}
          />
        </div>
      ) : (
        <div className="w-full max-w-xl mx-auto px-4 sm:px-6 space-y-4 pt-3 pb-24">
        
          {/* Accessible SEO Heading */}
          <h1 className="sr-only">Go_Repireo: Doorstep Home &amp; Appliance Repair Services in Etawah</h1>

          {/* 1. Hero Greeting + Technician Graphic */}
          <section className="relative w-full rounded-[24px] sm:rounded-[30px] overflow-hidden bg-white shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)] border border-slate-100 min-h-[175px] sm:min-h-[210px] flex items-center">
            {/* Technician Graphic pinned to right */}
            <div className="absolute inset-0 w-full h-full pointer-events-none">
              <img 
                src="/hero-technician.jpg" 
                alt="Professional Technician"
                className="w-full h-full object-cover object-right"
              />
            </div>

            {/* Greeting Text on Left with subtle blend */}
            <div className="relative z-10 max-w-[62%] sm:max-w-[52%] p-4 sm:p-6 space-y-1 bg-gradient-to-r from-white via-white/90 to-transparent rounded-r-3xl">
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                {greetingTime},
              </p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-1">
                <span>{displayName}!</span>
                <span className="text-xl sm:text-2xl">👋</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-relaxed pt-0.5">
                Book trusted home services at your doorstep.
              </p>
            </div>
          </section>

          {/* 2. Book a Service Banner (with 3D Calendar) */}
          <section className="relative w-full rounded-[22px] sm:rounded-[26px] overflow-hidden shadow-[0_8px_25px_-8px_rgba(0,102,255,0.28)] min-h-[145px] sm:min-h-[170px] flex items-center">
            <img 
              src="/banner-book-service.jpg" 
              alt="Book a Service"
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="relative z-10 p-5 sm:p-6 max-w-[65%] sm:max-w-[60%] space-y-1 text-white">
              <h3 className="text-lg sm:text-2xl font-black tracking-tight leading-tight">
                Book a <span className="text-[#FF9900]">Service</span>
              </h3>
              <p className="text-[10px] sm:text-xs text-blue-100/90 font-medium leading-relaxed max-w-[240px]">
                Get professional home services quickly and hassle-free.
              </p>
              <div className="pt-2">
                <Link 
                  href="/services/service"
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-900 font-bold text-[11px] sm:text-xs px-4 py-2 rounded-full shadow-md active:scale-95 transition-all"
                >
                  <span>Book Now</span>
                  <ArrowRight size={13} className="text-slate-900" />
                </Link>
              </div>
            </div>
          </section>

          {/* 3. Our Services Section */}
          <section className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Our Services</h3>
              <Link href="/services" className="text-xs font-bold text-[#FF6B00] flex items-center gap-0.5 hover:underline">
                <span>View All</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {mainServices.map((srv, idx) => {
                const Icon = srv.icon;
                return (
                  <Link 
                    key={idx}
                    href={srv.href}
                    className={`${srv.bg} ${srv.border} rounded-2xl p-2 sm:p-3 flex flex-col items-center justify-center text-center shadow-2xs hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all group`}
                  >
                    <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center">
                      <Icon size={24} className={srv.color} />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-slate-800 mt-1 line-clamp-2 leading-tight">
                      {srv.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* 4. Upcoming Booking Section */}
          <section className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Upcoming Booking</h3>
              <Link href="/track" className="text-xs font-bold text-[#FF6B00] flex items-center gap-0.5 hover:underline">
                <span>View All</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <Link 
              href={activeBooking ? `/track?orderId=${activeBooking.id}` : '/track'}
              className="block relative bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] hover:border-blue-200 transition-all overflow-hidden group"
            >
              {/* Orange left border curve accent */}
              <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#FF9900] rounded-r-full" />

              <div className="flex items-center justify-between gap-3 pl-1.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#EEF5FF] flex items-center justify-center shrink-0">
                    <FaucetIcon size={24} className="text-[#007AFF]" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      {activeBooking?.serviceName || 'Plumbing Service'}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-400">
                      {activeBooking ? `#GR-${activeBooking.id.slice(0, 5).toUpperCase()}` : '#GRP43867'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[9.5px] sm:text-[10px] text-slate-500 font-medium pt-0.5">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={12} className="text-slate-400" />
                        Nov 3, 3:00 PM
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        Home
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 bg-[#ECFDF5] text-[#059669] text-[9.5px] sm:text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100">
                    <CheckCircle2 size={12} className="text-[#059669]" />
                    <span>Confirmed</span>
                  </span>
                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          </section>

          {/* 5. Special Offer Banner (with 3D Gift Box) */}
          <section className="relative w-full rounded-[22px] sm:rounded-[26px] overflow-hidden shadow-[0_8px_25px_-8px_rgba(255,153,0,0.28)] min-h-[145px] sm:min-h-[170px] flex items-center">
            <img 
              src="/banner-promo-discount.jpg" 
              alt="Special Offer - 20% OFF"
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="relative z-10 p-5 sm:p-6 max-w-[65%] sm:max-w-[60%] space-y-1">
              <span className="bg-[#FF9900] text-white text-[9px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full inline-block shadow-xs">
                Special Offer
              </span>
              <h3 className="text-base sm:text-2xl font-black text-slate-900 leading-tight pt-1">
                Get <span className="text-[#FF6B00]">20% OFF</span>
                <span className="font-extrabold text-slate-700 block text-xs sm:text-sm mt-0.5">on your first service</span>
              </h3>
              <div className="pt-2">
                <button 
                  type="button"
                  onClick={handleCopyPromo}
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 font-bold text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full shadow-xs border border-orange-100 active:scale-95 transition-all"
                >
                  <span>Use Code:</span>
                  <span className="font-black text-[#FF6B00]">GET20</span>
                  <Copy size={12} className="text-slate-400" />
                </button>
              </div>
            </div>
          </section>

        </div>
      )}
    </div>
  );
}
