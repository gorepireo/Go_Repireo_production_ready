'use client';

import { useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplet, 
  Zap, 
  Sparkles, 
  Wrench, 
  MessageSquare, 
  Paperclip, 
  Calendar, 
  Clock, 
  ChevronDown, 
  MapPin, 
  LocateFixed, 
  CloudUpload, 
  ArrowRight, 
  Check,
  LayoutGrid,
  X,
  Map as MapIcon,
  Banknote,
  CreditCard
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { isServiceMatching } from '@/lib/serviceMatcher';
import { ServiceBookingSkeleton } from '@/components/SkeletonLoader';

const LocationMapSelector = dynamic(() => import('@/components/LocationMapSelector'), { ssr: false });

export default function ServiceBooking() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [visualFiles, setVisualFiles] = useState<File[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [formData, setFormData] = useState({
    category: 'plumbing',
    description: '',
    bookingType: 'immediately' as 'immediately' | 'scheduled',
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTime: new Date().toTimeString().slice(0, 5),
    address: '',
    lat: 0,
    lng: 0
  });
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimation, setEstimation] = useState<any>(null);

  // Helper to calculate distance in km using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  };

  const handleEstimate = async () => {
    if (!formData.description) {
      alert("Please enter a brief description of the problem first.");
      return;
    }
    setIsEstimating(true);
    try {
      // Local doorstep service radius distance (capped at 5-10 km for intra-city service)
      let distance = 5.0;
      if (formData.lat && formData.lng) {
        const calcDist = calculateDistance(26.8, 75.8, formData.lat, formData.lng);
        distance = Math.min(Math.max(2.0, calcDist), 15.0);
      }

      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemStatement: formData.description,
          category: formData.category,
          distanceKm: distance
        })
      });
      const data = await res.json();
      if (res.ok) {
        setEstimation(data);
      } else {
        alert(data.error || "Failed to generate estimate");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to calculate estimate");
    } finally {
      setIsEstimating(false);
    }
  };

  const estimatedPrice = estimation ? estimation.totalMin : 500;

  useEffect(() => {
    if (user) {
      insforge.database.from('user_addresses').select('*').eq('user_id', user.id)
        .then((res: any) => { if (res?.data) setAddresses(res.data); });
    }
  }, [user, loading, router]);

  const createOrderRecord = async (payStatus: string, payMethod: string, payId?: string) => {
    // Fetch unique OTPs from server (ensures no collision with active orders)
    let startOtp = Math.floor(1000 + Math.random() * 9000).toString();
    let completionOtp = Math.floor(1000 + Math.random() * 9000).toString();

    try {
      const otpRes = await fetch('/api/generate-otp', { method: 'POST' });
      if (otpRes.ok) {
        const otpData = await otpRes.json();
        startOtp = otpData.start_otp || startOtp;
        completionOtp = otpData.completion_otp || completionOtp;
      }
    } catch (otpErr) {
      console.warn('OTP API error, using fallback:', otpErr);
    }

    let insertPayload: any = {
      customer_id: user?.id || null,
      user_email: user?.email,
      service_name: formData.category,
      status: 'pending',
      payment_status: payStatus,
      payment_method: payMethod,
      payment_id: payId || null,
      total_price: estimatedPrice,
      details: { 
        ...formData, 
        payment_method: payMethod, 
        items: [{ type: 'service', name: formData.category }], 
        estimation,
        start_otp: startOtp,
        completion_otp: completionOtp  // Always set for both cash and online orders
      },
      lat: formData.lat || (12.9716 + (Math.random() - 0.5) * 0.1),
      lng: formData.lng || (77.5946 + (Math.random() - 0.5) * 0.1),
      order_type: 'direct_service'
    };

    let { data, error } = await insforge.database
      .from('orders')
      .insert([insertPayload])
      .select();

    if (error && (error.message?.includes('payment_method') || error.message?.includes('schema cache'))) {
      delete insertPayload.payment_method;
      delete insertPayload.payment_status;
      const res = await insforge.database
        .from('orders')
        .insert([insertPayload])
        .select();
      data = res.data;
      error = res.error;
    }

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      await insforge.database
        .from('order_tracking')
        .insert([{
          order_id: data[0].id,
          status: 'pending',
          lat: data[0].lat - (Math.random() * 0.1),
          lng: data[0].lng - (Math.random() * 0.1),
          note: payMethod === 'cash' 
            ? 'Order placed with Cash payment option. Awaiting worker dispatch...'
            : 'Order placed & prepaid online. Initialising logistic unit...'
        }]);

      await insforge.database
        .from('notifications')
        .insert([{
          user_id: user?.id,
          title: 'Service Requested',
          message: payMethod === 'cash'
            ? `Your ${formData.category} service request has been placed (Cash payment upon service completion).`
            : `Your ${formData.category} service request has been received and payment confirmed.`,
          type: 'order',
          link: `/track?id=${data[0].id}`
        }]);

      // Notify matching active workers
      try {
        const { data: activeWorkers } = await insforge.database
          .from('workers')
          .select('user_id, service')
          .eq('status', 'active');

        if (activeWorkers && (activeWorkers as any[]).length > 0) {
          const matchingWorkers = (activeWorkers as any[]).filter((w: any) => 
            isServiceMatching(w.service, formData.category)
          );

          if (matchingWorkers.length > 0) {
            const timingText = formData.bookingType === 'immediately'
              ? 'IMMEDIATE (ASAP)'
              : `SCHEDULED for ${formData.preferredDate} at ${formData.preferredTime}`;
            const payText = payMethod === 'cash' ? 'CASH ON SERVICE' : 'PREPAID ONLINE';

            const workerNotifications = matchingWorkers.map((w: any) => ({
              user_id: w.user_id,
              title: `New ${formData.category.toUpperCase()} Request`,
              message: `A new ${formData.category.toUpperCase()} request (${timingText}, ${payText}) is available in your workspace. Log in to accept.`,
              type: 'order',
              link: '/dashboard/worker'
            }));

            await insforge.database.from('notifications').insert(workerNotifications);

            // Also send REAL device push notifications to matching workers
            const timingTextPush = formData.bookingType === 'immediately' ? 'Immediate service' : `Scheduled: ${formData.preferredDate}`;
            for (const w of matchingWorkers) {
              try {
                await fetch('/api/push/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: `⚡ New ${formData.category} Request!`,
                    message: `${timingTextPush} — ₹${estimatedPrice}. Tap to accept.`,
                    url: '/dashboard/worker',
                    targetUserId: w.user_id,
                    orderId: data[0].id,
                    actions: [{ action: 'accept', title: 'Accept' }]
                  })
                });
              } catch {}
            }
          }
        }
      } catch (notifyErr) {
        console.warn('Could not notify workers:', notifyErr);
      }

      router.push(`/track?id=${data[0].id}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?redirect=/services/service');
      return;
    }
    
    setLoading(true);
    try {
      if (paymentMethod === 'cash') {
        // Direct order creation for Cash payment (payment_status: 'pending' until work completed & collected)
        await createOrderRecord('pending', 'cash');
      } else {
        // Online Payment via Razorpay
        const res = await fetch('/api/razorpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: estimatedPrice })
        });
        const orderResData = await res.json();
        
        if (!res.ok) throw new Error(orderResData.error || 'Failed to create Razorpay order');

        const options = {
          key: 'rzp_live_TNcvyWzcZlRsQY',
          amount: estimatedPrice * 100,
          currency: 'INR',
          name: 'Go_Repireo',
          description: `${formData.category.toUpperCase()} Service Base Estimation`,
          image: 'https://xipxmg4q.insforge.site/icon.png',
          order_id: orderResData.orderId,
          handler: async function (response: any) {
            try {
              await createOrderRecord('paid', 'online', response.razorpay_payment_id);
            } catch (err) {
              console.error('Database save error:', err);
              alert("Payment successful, but failed to save order details. Our team will contact you.");
            } finally {
              setLoading(false);
            }
          },
          modal: {
            handleback: true,
            backdropclose: true,
            ondismiss: function() {
              setLoading(false);
            }
          },
          prefill: {
            name: user.email?.split('@')[0] || 'User',
            email: user.email || '',
          },
          theme: {
            color: '#007AFF',
            backdrop_color: 'rgba(15, 23, 42, 0.7)'
          }
        };

        const paymentObject = new (window as any).Razorpay(options);
        paymentObject.open();
      }

    } catch (err: any) {
      console.error('Booking error:', err);
      alert(err.message || 'Error processing request');
      setLoading(false);
    }
  };

  if (loading || !user) {
    return <ServiceBookingSkeleton />;
  }

  const categories = [
    { id: 'plumbing', label: 'Plumbing', desc: 'Pipes, fittings, leaks & more', Icon: Droplet, colorClass: 'text-[#007AFF]', activeBg: 'bg-[#F0F6FF] border-[#007AFF]' },
    { id: 'electrical', label: 'Electrical', desc: 'Wiring, circuits, panels & more', Icon: Zap, colorClass: 'text-amber-500', activeBg: 'bg-[#F0F6FF] border-[#007AFF]' },
    { id: 'cleaning', label: 'Cleaning', desc: 'Deep cleaning, sanitization & more', Icon: Sparkles, colorClass: 'text-orange-500', activeBg: 'bg-[#F0F6FF] border-[#007AFF]' },
    { id: 'repair', label: 'Repair', desc: 'Appliances, fixtures & more', Icon: Wrench, colorClass: 'text-purple-600', activeBg: 'bg-[#F0F6FF] border-[#007AFF]' }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      {/* Top Hero Banner Section */}
      <div className="relative pt-6 pb-6 overflow-hidden bg-gradient-to-br from-[#EEF5FF] via-[#E2EEFF] to-[#D6E6FF] border-b border-blue-100/60 shadow-xs">
        {/* Soft Floating Decorative Circles */}
        <div className="absolute top-4 left-[48%] w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-xs flex items-center justify-center text-blue-500 text-sm z-10">
          💧
        </div>
        <div className="absolute top-10 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-xs flex items-center justify-center text-amber-500 text-sm z-10">
          ⚡
        </div>
        <div className="absolute bottom-6 left-[46%] w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-xs flex items-center justify-center text-purple-500 text-xs z-10">
          🔧
        </div>
        <div className="absolute bottom-10 right-8 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-xs flex items-center justify-center text-orange-400 text-sm z-10">
          ✨
        </div>

        <div className="max-w-4xl mx-auto px-5 relative z-10 flex justify-between items-center min-h-[160px]">
          <div className="max-w-[62%] sm:max-w-[65%] space-y-2.5 py-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[0.95] text-slate-900 uppercase">
              BOOK A<br />
              <span className="text-[#007AFF]">PROFESSIONAL</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 max-w-[260px] leading-relaxed">
              Secure assignment of elite service experts for essential maintenance.
            </p>

            {/* Feature Pills */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-blue-100/80 px-2.5 py-1 rounded-full text-[9px] font-semibold text-slate-700 shadow-2xs">
                🛡️ <span className="font-extrabold text-slate-800">Verified Experts</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-blue-100/80 px-2.5 py-1 rounded-full text-[9px] font-semibold text-slate-700 shadow-2xs">
                🕒 <span className="font-extrabold text-slate-800">On-Time Service</span>
              </span>
              <span className="inline-flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-blue-100/80 px-2.5 py-1 rounded-full text-[9px] font-semibold text-slate-700 shadow-2xs">
                🏷️ <span className="font-extrabold text-slate-800">Upfront Pricing</span>
              </span>
            </div>
          </div>
        </div>

        {/* Technician Image on Right */}
        <div className="absolute right-0 bottom-0 w-[42%] max-w-[200px] sm:max-w-[280px] h-[95%] z-10 pointer-events-none flex items-end justify-end">
          <img src="/custom_service_mechanic_3d.png" alt="Mechanic" className="w-full h-full object-contain object-bottom drop-shadow-xl" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-5 space-y-5">
        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* STEP 1: Select Service Category */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-[#007AFF] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                STEP 1
              </span>
              <h2 className="text-xs font-bold text-slate-900">Select Service Category</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat) => {
                 const isSelected = formData.category === cat.id;
                 return (
                   <button
                     key={cat.id}
                     type="button"
                     onClick={() => setFormData({ ...formData, category: cat.id })}
                     className={`relative p-4 rounded-2xl transition-all text-center flex flex-col items-center gap-2 ${
                       isSelected 
                         ? 'bg-[#F0F6FF] border-2 border-[#007AFF] shadow-sm' 
                         : 'bg-white text-slate-900 border border-slate-100 hover:border-slate-200'
                     }`}
                   >
                     {/* Blue Checkmark Badge on Top Right */}
                     {isSelected && (
                       <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-[#007AFF] rounded-full flex items-center justify-center shadow-xs">
                          <Check size={12} className="text-white" strokeWidth={3} />
                       </div>
                     )}
                     
                     {/* Category Icon */}
                     <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                        <cat.Icon size={26} className={cat.colorClass} />
                     </div>
                     
                     {/* Label & Description */}
                     <div>
                        <h3 className="text-xs font-black text-slate-900">{cat.label}</h3>
                        <p className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">{cat.desc}</p>
                     </div>
                   </button>
                 );
              })}
            </div>
          </div>

          {/* STEP 2: Describe Your Issue */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-[#007AFF] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                STEP 2
              </span>
              <h2 className="text-xs font-bold text-slate-900">Describe Your Issue</h2>
            </div>

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                 <MessageSquare size={16} />
              </div>
              <input 
                required
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-12 bg-white border border-slate-200/80 rounded-2xl pl-11 pr-4 text-xs font-medium text-slate-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all placeholder:text-slate-400"
                placeholder="E.g. Kitchen tap is leaking or bathroom drain is clogged..."
              />
            </div>
          </div>

          {/* STEP 3: Choose Service Timing */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-[#007AFF] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                STEP 3
              </span>
              <h2 className="text-xs font-bold text-slate-900">Choose Service Timing</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, bookingType: 'immediately' })}
                className={`p-4 rounded-2xl text-left transition-all flex items-center gap-3 ${
                  formData.bookingType === 'immediately'
                    ? 'bg-[#007AFF] text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-900 border border-slate-200/80'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.bookingType === 'immediately' ? 'bg-white/20' : 'bg-blue-50 text-[#007AFF]'}`}>
                  <Zap size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight">IMMEDIATELY (ASAP)</h4>
                  <p className={`text-[9px] ${formData.bookingType === 'immediately' ? 'text-blue-100' : 'text-slate-400'}`}>Get expert at your door soon</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, bookingType: 'scheduled' })}
                className={`p-4 rounded-2xl text-left transition-all flex items-center gap-3 ${
                  formData.bookingType === 'scheduled'
                    ? 'bg-[#007AFF] text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-900 border border-slate-200/80'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.bookingType === 'scheduled' ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                  <Calendar size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight">SCHEDULED</h4>
                  <p className={`text-[9px] ${formData.bookingType === 'scheduled' ? 'text-blue-100' : 'text-slate-400'}`}>Pick a convenient time</p>
                </div>
              </button>
            </div>

            {/* Date & Time Picker when Scheduled */}
            {formData.bookingType === 'scheduled' && (
               <div className="flex gap-3 pt-1">
                  <div className="flex-1 relative">
                    <input 
                      type="date"
                      value={formData.preferredDate}
                      onChange={e => setFormData({ ...formData, preferredDate: e.target.value })}
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <input 
                      type="time"
                      value={formData.preferredTime}
                      onChange={e => setFormData({ ...formData, preferredTime: e.target.value })}
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#007AFF]"
                    />
                  </div>
               </div>
            )}
          </div>

          {/* STEP 4: Service Address & Location */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-[#007AFF] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                STEP 4
              </span>
              <h2 className="text-xs font-bold text-slate-900">Service Address & Location</h2>
            </div>

            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <MapPin size={16} />
                </div>
                <input 
                  required 
                  value={formData.address}
                  onFocus={() => setShowAddressDropdown(true)}
                  onBlur={() => setTimeout(() => setShowAddressDropdown(false), 200)}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full h-12 bg-white border border-slate-200/80 rounded-2xl pl-11 pr-4 text-xs font-medium text-slate-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all placeholder:text-slate-400"
                  placeholder="Enter your address or select saved location"
                />
              </div>

              <button 
                type="button" 
                onClick={() => setShowMapModal(true)}
                className="w-12 h-12 bg-[#F0F6FF] text-[#007AFF] rounded-2xl flex items-center justify-center hover:bg-blue-100 transition-colors shrink-0"
              >
                <MapIcon size={18} />
              </button>

              <button 
                type="button" 
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      async (position) => {
                        try {
                          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json&email=info@repireo.com`);
                          const data = await res.json();
                          if (data && data.display_name) {
                            setFormData({ ...formData, address: data.display_name, lat: position.coords.latitude, lng: position.coords.longitude });
                          }
                        } catch (err) {
                          setFormData({ ...formData, address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`, lat: position.coords.latitude, lng: position.coords.longitude });
                        }
                      }
                    );
                  }
                }}
                className="w-12 h-12 bg-[#F0F6FF] text-[#007AFF] rounded-2xl flex items-center justify-center hover:bg-blue-100 transition-colors shrink-0"
              >
                <LocateFixed size={18} />
              </button>
            </div>
          </div>

          {/* OPTIONAL: Attach Photos or Videos */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-blue-50 text-blue-600 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                OPTIONAL
              </span>
              <h2 className="text-xs font-bold text-slate-900">Attach Photos or Videos</h2>
            </div>

            <label className="w-full h-28 bg-[#F8FAFC] border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-blue-50/40 transition-all cursor-pointer">
               <input 
                 type="file" 
                 className="hidden" 
                 accept="image/*,video/mp4" 
                 multiple 
                 onChange={(e) => {
                   if (e.target.files) {
                     setVisualFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
                   }
                 }}
               />
               <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#007AFF]">
                 <CloudUpload size={20} />
               </div>
               <div className="text-center">
                  <p className="text-xs font-bold text-slate-700">Drag & drop or tap to upload</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">JPG, PNG, MP4 up to 20MB</p>
               </div>
            </label>
          </div>

          {/* STEP 5: Select Payment Method */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-[#007AFF] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full">
                STEP 5
              </span>
              <h2 className="text-xs font-bold text-slate-900">Select Payment Method</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Cash on Service Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-2xl text-left transition-all flex items-center gap-3 border ${
                  paymentMethod === 'cash'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-white text-slate-900 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  paymentMethod === 'cash' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  <Banknote size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight">CASH ON SERVICE 💵</h4>
                  <p className={`text-[9.5px] ${paymentMethod === 'cash' ? 'text-emerald-100' : 'text-slate-400'}`}>
                    Pay cash directly to technician upon completion
                  </p>
                </div>
              </button>

              {/* Online Payment Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                className={`p-4 rounded-2xl text-left transition-all flex items-center gap-3 border ${
                  paymentMethod === 'online'
                    ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-900 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  paymentMethod === 'online' ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#007AFF]'
                }`}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight">ONLINE PAYMENT 💳</h4>
                  <p className={`text-[9.5px] ${paymentMethod === 'online' ? 'text-blue-100' : 'text-slate-400'}`}>
                    Pay online via UPI, Credit/Debit Card, Netbanking
                  </p>
                </div>
              </button>

            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-2">
            {!estimation ? (
              <button 
                type="button"
                onClick={handleEstimate}
                disabled={isEstimating}
                className="w-full py-4 bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-xs tracking-wider uppercase rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {isEstimating ? (
                  <span>CALCULATING ESTIMATE...</span>
                ) : (
                  <>
                    <span>CALCULATE SERVICE ESTIMATE</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-5 rounded-3xl border border-blue-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-100/60 pb-3">
                    <div>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">
                        ESTIMATED COST BREAKDOWN
                      </span>
                      <h3 className="text-xs font-bold text-slate-800">
                        {estimation.subIssue || 'Doorstep Service & Repair'}
                      </h3>
                    </div>
                    <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                      {estimation.gravityName || 'Verified Estimate'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span>Service & Labor Charge:</span>
                      <span className="font-bold text-slate-900">₹{estimation.laborPriceMin || estimation.minServiceFee || 199}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform & Safety Fee:</span>
                      <span className="font-bold text-slate-900">₹{estimation.fixedPlatformFee || estimation.platformFee || 49}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Technician Travel Charge:</span>
                      <span className="font-bold text-slate-900">{estimation.travelFee > 0 ? `₹${estimation.travelFee}` : 'FREE (₹0)'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Payable ({paymentMethod === 'cash' ? 'Cash' : 'Online'})</span>
                      <p className="text-2xl font-black text-[#007AFF] leading-tight">
                        ₹{estimation.estimateIfCustomerProceedsMin || estimation.totalMin || 248}
                      </p>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      Upfront Price Guarantee
                    </span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full py-4 text-white font-extrabold text-xs tracking-wider uppercase rounded-full shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${
                    paymentMethod === 'cash' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25' : 'bg-[#007AFF] hover:bg-blue-600 shadow-blue-500/30'
                  }`}
                >
                  {loading ? 'PROCESSING...' : `CONFIRM & PLACE ORDER (${paymentMethod === 'cash' ? 'CASH ON SERVICE' : 'ONLINE PAY'})`}
                </button>
              </motion.div>
            )}
          </div>

        </motion.form>
      </div>

      {/* Map Modal */}
      <AnimatePresence>
        {showMapModal && (
          <LocationMapSelector 
            initialLat={formData.lat || 22.5726}
            initialLng={formData.lng || 88.3639}
            onConfirm={(loc) => {
              setFormData({ ...formData, address: loc.address, lat: loc.lat, lng: loc.lng });
              setShowMapModal(false);
            }}
            onClose={() => setShowMapModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
