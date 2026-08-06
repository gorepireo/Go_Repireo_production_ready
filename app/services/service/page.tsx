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
  ShieldCheck,
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
      // Calculate distance from center of Kolkata (example base)
      const baseLat = 22.5726;
      const baseLng = 88.3639;
      const distance = calculateDistance(baseLat, baseLng, formData.lat, formData.lng);

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

  const estimatedPrice = formData.category === 'test_verify' ? 1 : (estimation ? estimation.totalMin : 500);

  useEffect(() => {
    if (user) {
      insforge.database.from('user_addresses').select('*').eq('user_id', user.id)
        .then(({ data }) => { if (data) setAddresses(data); });
    }
  }, [user, loading, router]);

  const createOrderRecord = async (payStatus: string, payMethod: string, payId?: string) => {
    const startOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const completionOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const { data, error } = await insforge.database
      .from('orders')
      .insert([{
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
          completion_otp: payMethod === 'cash' ? null : completionOtp
        },
        lat: formData.lat || (12.9716 + (Math.random() - 0.5) * 0.1),
        lng: formData.lng || (77.5946 + (Math.random() - 0.5) * 0.1),
        order_type: 'direct_service'
      }])
      .select();

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

        if (activeWorkers && activeWorkers.length > 0) {
          const matchingWorkers = activeWorkers.filter(w => 
            isServiceMatching(w.service, formData.category)
          );

          if (matchingWorkers.length > 0) {
            const timingText = formData.bookingType === 'immediately'
              ? 'IMMEDIATE (ASAP)'
              : `SCHEDULED for ${formData.preferredDate} at ${formData.preferredTime}`;
            const payText = payMethod === 'cash' ? 'CASH ON SERVICE' : 'PREPAID ONLINE';

            const workerNotifications = matchingWorkers.map(w => ({
              user_id: w.user_id,
              title: `New ${formData.category.toUpperCase()} Request`,
              message: `A new ${formData.category.toUpperCase()} request (${timingText}, ${payText}) is available in your workspace. Log in to accept.`,
              type: 'order',
              link: '/dashboard/worker'
            }));

            await insforge.database.from('notifications').insert(workerNotifications);
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
        // Direct order creation for Cash payment
        await createOrderRecord('cash_on_delivery', 'cash');
      } else {
        // Online Payment via Razorpay
        const res = await fetch('/api/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: estimatedPrice })
        });
        const orderResData = await res.json();
        
        if (!res.ok) throw new Error(orderResData.error || 'Failed to create Razorpay order');

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: estimatedPrice * 100,
          currency: 'INR',
          name: 'Go_Repireo',
          description: `${formData.category.toUpperCase()} Service Order`,
          order_id: orderResData.orderId || orderResData.order_id,
          handler: async function (response: any) {
            try {
              // Verify signature via backend endpoint
              const verifyRes = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                })
              });
              const verifyData = await verifyRes.json();
              
              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || 'Signature verification failed');
              }

              await createOrderRecord('paid', 'online', response.razorpay_payment_id);
            } catch (err: any) {
              console.error('Database/verification error:', err);
              alert(err.message || "Payment verification failed.");
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function() {
              setLoading(false);
            }
          },
          prefill: {
            name: user.email?.split('@')[0] || 'User',
            email: user.email || '',
          },
          theme: {
            color: '#007AFF'
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
    { id: 'plumbing', label: 'PLUMBING', desc: 'Pipes, fittings, leaks & more', Icon: Droplet, colorClass: 'text-blue-500' },
    { id: 'electrical', label: 'ELECTRICAL', desc: 'Wiring, circuits, panels & more', Icon: Zap, colorClass: 'text-orange-500' },
    { id: 'cleaning', label: 'CLEANING', desc: 'Deep cleaning, sanitization & more', Icon: Sparkles, colorClass: 'text-orange-500' },
    { id: 'repair', label: 'REPAIR', desc: 'Appliances, fixtures & more', Icon: Wrench, colorClass: 'text-purple-600' },
    { id: 'test_verify', label: 'TEST PAYMENT (₹1)', desc: 'Razorpay Gateway 1 Rupee Verification', Icon: ShieldCheck, colorClass: 'text-emerald-600' }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      {/* Top Banner / Header Section */}
      <div className="relative pt-6 pb-4 overflow-hidden bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-[80%] h-full bg-gradient-to-l from-blue-50/80 to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 flex justify-between items-center min-h-[140px]">
           <div className="max-w-[58%] sm:max-w-[65%] space-y-2 py-4">
             <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter leading-[0.9]">
               <span className="text-[#0A1629]">BOOK A</span><br />
               <span className="text-[#007AFF]">PROFESSIONAL.</span>
             </h1>
             <p className="text-[10px] text-slate-500 max-w-[180px] leading-relaxed">
               Secure assignment of elite service experts for essential maintenance.
             </p>
           </div>
        </div>

        {/* Mechanic Image - Properly Constrained */}
        <div className="absolute right-0 bottom-0 w-[38%] max-w-[160px] sm:max-w-[200px] h-full z-10 pointer-events-none flex items-end justify-end">
           <img src="/custom_service_mechanic_3d.png" alt="Mechanic" className="w-full h-full object-contain object-bottom drop-shadow-xl" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6 space-y-8">
        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Category Selector */}
          <div className="space-y-3">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] block pl-1">
              Step 1 <span className="mx-1.5">•</span> Select Service Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => {
                 const isSelected = formData.category === cat.id;
                 return (
                   <button
                     key={cat.id}
                     type="button"
                     onClick={() => setFormData({ ...formData, category: cat.id })}
                     className={`relative p-4 rounded-2xl transition-all text-left flex flex-col gap-3 ${
                       isSelected 
                         ? 'bg-[#001D4A] text-white shadow-lg shadow-blue-900/20' 
                         : 'bg-white text-slate-900 shadow-sm border border-slate-100 hover:shadow-md'
                     }`}
                   >
                     {/* Checkmark badge */}
                     {isSelected && (
                       <div className="absolute top-3 right-3 w-5 h-5 bg-[#007AFF] rounded-full flex items-center justify-center shadow-md">
                          <Check size={12} className="text-white" strokeWidth={3} />
                       </div>
                     )}
                     
                     {/* Icon */}
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                       isSelected ? 'bg-[#153468] border-transparent' : 'bg-white border-slate-100'
                     }`}>
                        <cat.Icon size={20} className={isSelected ? 'text-blue-300 fill-current' : `${cat.colorClass} fill-current`} />
                     </div>
                     
                     {/* Text */}
                     <div>
                        <h3 className="text-[11px] font-black uppercase tracking-tight">{cat.label}</h3>
                        <p className={`text-[8px] mt-0.5 leading-tight ${isSelected ? 'text-blue-100/70' : 'text-slate-500'}`}>{cat.desc}</p>
                     </div>
                   </button>
                 );
              })}
            </div>
          </div>

          {/* Core Problem Description */}
          <div className="space-y-3">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] block pl-1">
              Step 2 <span className="mx-1.5">•</span> Describe Your Issue
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                 <MessageSquare size={16} className="text-[#007AFF]" />
              </div>
              <input 
                required
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-12 pr-6 text-[10px] font-medium text-slate-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm placeholder:text-slate-400"
                placeholder="E.g. Kitchen tap is leaking or bathroom drain is clogged..."
              />
            </div>
          </div>

          {/* Dispatch Preference: Immediately vs Scheduled */}
          <div className="space-y-3">
             <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] block pl-1">
               Step 3 <span className="mx-1.5">•</span> Choose Service Timing
             </label>
             <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100/70 rounded-2xl border border-slate-200/50">
               <button
                 type="button"
                 onClick={() => setFormData({ ...formData, bookingType: 'immediately' })}
                 className={`py-3 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                   formData.bookingType === 'immediately'
                     ? 'bg-[#007AFF] text-white shadow-md'
                     : 'bg-transparent text-slate-600 hover:text-slate-900'
                 }`}
               >
                 <Zap size={14} /> Immediately (ASAP)
               </button>
               <button
                 type="button"
                 onClick={() => setFormData({ ...formData, bookingType: 'scheduled' })}
                 className={`py-3 px-4 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                   formData.bookingType === 'scheduled'
                     ? 'bg-[#007AFF] text-white shadow-md'
                     : 'bg-transparent text-slate-600 hover:text-slate-900'
                 }`}
               >
                 <Calendar size={14} /> Scheduled
               </button>
             </div>
          </div>

          {/* Temporal Field (Date & Time) - Shown ONLY when Scheduled */}
          {formData.bookingType === 'scheduled' && (
             <div className="space-y-3">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] block pl-1">
                  Preferred Date & Time
                </label>
                <div className="flex gap-3">
                   <div 
                     className="flex-1 relative cursor-pointer"
                     onClick={() => {
                       try { (document.getElementById('dateInput') as HTMLInputElement)?.showPicker(); } catch (e) {}
                     }}
                   >
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Calendar size={16} className="text-[#007AFF]" />
                     </div>
                     <div className="absolute left-11 top-[10px] pointer-events-none">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Preferred Date</span>
                     </div>
                     <input 
                       id="dateInput"
                       required={formData.bookingType === 'scheduled'}
                       type="date"
                       value={formData.preferredDate}
                       onChange={e => setFormData({ ...formData, preferredDate: e.target.value })}
                       className={`w-full h-14 bg-white border border-slate-100 rounded-2xl pl-11 pr-10 pt-[14px] text-[10px] font-medium outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${!formData.preferredDate ? 'text-transparent' : 'text-slate-900'}`}
                     />
                     {!formData.preferredDate && (
                       <div className="absolute left-11 top-[26px] pointer-events-none">
                         <span className="text-[10px] font-medium text-slate-400">Select date</span>
                       </div>
                     )}
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown size={14} className="text-slate-400" />
                     </div>
                   </div>
                   <div 
                     className="flex-1 relative cursor-pointer"
                     onClick={() => {
                       try { (document.getElementById('timeInput') as HTMLInputElement)?.showPicker(); } catch (e) {}
                     }}
                   >
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Clock size={16} className="text-[#007AFF]" />
                     </div>
                     <div className="absolute left-11 top-[10px] pointer-events-none">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Preferred Time</span>
                     </div>
                     <input 
                       id="timeInput"
                       required={formData.bookingType === 'scheduled'}
                       type="time"
                       value={formData.preferredTime}
                       onChange={e => setFormData({ ...formData, preferredTime: e.target.value })}
                       className={`w-full h-14 bg-white border border-slate-100 rounded-2xl pl-11 pr-10 pt-[14px] text-[10px] font-medium outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${!formData.preferredTime ? 'text-transparent' : 'text-slate-900'}`}
                     />
                     {!formData.preferredTime && (
                       <div className="absolute left-11 top-[26px] pointer-events-none">
                         <span className="text-[10px] font-medium text-slate-400">Select time</span>
                       </div>
                     )}
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown size={14} className="text-slate-400" />
                     </div>
                   </div>
                </div>
             </div>
          )}

          {/* Geographical Field */}
          <div className="space-y-3">
             <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] block pl-1">
               Step 4 <span className="mx-1.5">•</span> Service Address & Location
             </label>
             <div className="relative">
               <div className="absolute left-4 top-1/2 -translate-y-1/2">
                 <MapPin size={16} className="text-[#007AFF]" />
               </div>
               <div className="absolute left-11 top-[10px] pointer-events-none z-10">
                 <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Delivery Address</span>
               </div>
               <input 
                 required 
                 value={formData.address}
                 onFocus={() => setShowAddressDropdown(true)}
                 onBlur={() => setTimeout(() => setShowAddressDropdown(false), 200)}
                 onChange={e => setFormData({ ...formData, address: e.target.value })}
                 className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-11 pr-[90px] pt-[14px] text-[10px] font-medium text-slate-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm placeholder:text-slate-400 relative z-0"
                 placeholder="Enter your address or select saved location"
               />
               <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
                 <button 
                   type="button" 
                   onClick={() => setShowMapModal(true)}
                   className="w-10 h-10 bg-slate-50/80 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                 >
                   <MapIcon size={14} />
                 </button>
                 <button 
                   type="button" 
                   onClick={() => {
                     if (navigator.geolocation) {
                       navigator.geolocation.getCurrentPosition(
                         async (position) => {
                           try {
                             if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
                               const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
                               const data = await res.json();
                               if (data.status === 'OK' && data.results && data.results.length > 0) {
                                 setFormData({ ...formData, address: data.results[0].formatted_address, lat: position.coords.latitude, lng: position.coords.longitude });
                                 return;
                               }
                             }
                             const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json&email=info@repireo.com`);
                             const data = await res.json();
                             if (data && data.display_name) {
                               setFormData({ ...formData, address: data.display_name, lat: position.coords.latitude, lng: position.coords.longitude });
                             } else {
                               setFormData({ ...formData, address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`, lat: position.coords.latitude, lng: position.coords.longitude });
                             }
                           } catch (error) {
                             setFormData({ ...formData, address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`, lat: position.coords.latitude, lng: position.coords.longitude });
                           }
                         },
                         (err) => console.log(err)
                       );
                     }
                   }}
                   className="w-10 h-10 bg-blue-50/50 rounded-full flex items-center justify-center text-[#007AFF] hover:bg-blue-100 transition-colors"
                 >
                   <LocateFixed size={14} />
                 </button>
               </div>

               {/* Address Dropdown */}
               <AnimatePresence>
                 {showAddressDropdown && addresses.length > 0 && (
                   <motion.div 
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-20"
                   >
                     {addresses.map(addr => (
                       <div 
                         key={addr.id}
                         onClick={() => setFormData({ ...formData, address: addr.address_text })}
                         className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center gap-3 transition-colors"
                       >
                         <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-[#007AFF] shrink-0">
                           <MapPin size={14} />
                         </div>
                         <div>
                           <p className="text-[11px] font-bold text-slate-900">{addr.name}</p>
                           <p className="text-[9px] text-slate-500 line-clamp-1">{addr.address_text}</p>
                         </div>
                       </div>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          </div>

          {/* Visual Linkage */}
          <div className="space-y-3 pt-2">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] block pl-1">
              Optional <span className="mx-1.5">•</span> Attach Photos or Videos
            </label>
            <label className="w-full h-[80px] bg-white border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 hover:border-[#007AFF]/30 transition-all cursor-pointer relative overflow-hidden">
               <input 
                 type="file" 
                 className="absolute inset-0 opacity-0 cursor-pointer" 
                 accept="image/*,video/mp4" 
                 multiple 
                 onChange={(e) => {
                   if (e.target.files) {
                     setVisualFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
                   }
                 }}
               />
               <CloudUpload size={24} className="text-[#007AFF]" />
               <div className="text-center">
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Attach Images or Videos</p>
                  <p className="text-[7px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">JPG, PNG, MP4 up to 20MB</p>
               </div>
            </label>
            
            {/* Visual Previews */}
            {visualFiles.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {visualFiles.map((file, idx) => {
                  const isVideo = file.type.startsWith('video/');
                  const fileUrl = URL.createObjectURL(file);
                  return (
                    <div key={`${file.name}-${idx}`} className="relative w-16 h-16 group">
                      <div className="w-full h-full rounded-xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                        {isVideo ? (
                           <video src={fileUrl} className="w-full h-full object-cover" />
                        ) : (
                           <img src={fileUrl} alt="preview" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setVisualFiles(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-md z-10"
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Estimated Price Section */}
          <div className="space-y-3 pt-4">
            {!estimation ? (
              <button 
                type="button"
                onClick={handleEstimate}
                disabled={isEstimating}
                className="w-full h-12 bg-[#007AFF] hover:bg-blue-600 active:scale-[0.98] text-white rounded-full text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,122,255,0.25)] transition-all"
              >
                {isEstimating ? (
                  <span className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 animate-spin" /> CALCULATING ESTIMATE...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>CALCULATE SERVICE ESTIMATE</span>
                    <ArrowRight size={15} />
                  </span>
                )}
              </button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4"
              >
                 <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                        <Sparkles size={14} className="text-[#007AFF]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">AI Gravity & Problem Analysis</p>
                        <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{estimation.reasoning}</p>
                      </div>
                    </div>

                    {estimation.gravityName && (
                      <span className={`px-2.5 py-1 rounded-full text-[8px] font-extrabold uppercase tracking-wider flex-shrink-0 ${
                        estimation.gravityLevel >= 3 
                          ? 'bg-red-50 text-red-600 border border-red-200' 
                          : estimation.gravityLevel === 2
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        ⚡ {estimation.gravityName}
                      </span>
                    )}
                  </div>
                 
                 <div className="space-y-2.5">
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-slate-500">Inspection Charge</span>
                     <span className="text-[11px] font-black text-slate-900">₹{estimation.inspectionFee}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-slate-500">Service Fee (Est.)</span>
                     <span className="text-[11px] font-black text-slate-900">₹{estimation.minServiceFee} - ₹{estimation.maxServiceFee}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-slate-500">Travel Charges</span>
                     <span className="text-[11px] font-black text-slate-900">{estimation.travelFee === 0 ? 'FREE' : `₹${estimation.travelFee}`}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-slate-500">Platform Fee</span>
                     <span className="text-[11px] font-black text-slate-900">₹{estimation.platformFee}</span>
                   </div>
                   <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                     <span className="text-[10px] font-bold text-slate-500 italic">* Material Costs</span>
                     <span className="text-[10px] font-bold text-orange-500">Evaluated On-site</span>
                   </div>
                 </div>

                 <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between mt-2">
                     <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estimated Total</p>
                       <p className="text-[9px] font-medium text-slate-400 mt-0.5">Final amount based on work required</p>
                     </div>
                     <div className="text-right">
                       <p className="text-2xl font-black text-[#007AFF]">₹{estimation.totalMin}</p>
                     </div>
                  </div>

                  {/* Payment Method Option */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] block pl-1">
                      Payment Option <span className="mx-1.5">•</span> Select Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between gap-3 ${
                          paymentMethod === 'cash'
                            ? 'bg-[#001D4A] text-white border-[#001D4A] shadow-md'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Banknote size={20} className={paymentMethod === 'cash' ? 'text-[#007AFF]' : 'text-slate-500'} />
                          {paymentMethod === 'cash' && <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" />}
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-tight">Cash on Service</p>
                          <p className="text-[9px] opacity-75 mt-0.5 leading-snug">Pay worker cash after job completion</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('online')}
                        className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between gap-3 ${
                          paymentMethod === 'online'
                            ? 'bg-[#001D4A] text-white border-[#001D4A] shadow-md'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <CreditCard size={20} className={paymentMethod === 'online' ? 'text-[#007AFF]' : 'text-slate-500'} />
                          {paymentMethod === 'online' && <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" />}
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-tight">Online Payment</p>
                          <p className="text-[9px] opacity-75 mt-0.5 leading-snug">Pay online via UPI, Cards, NetBanking</p>
                        </div>
                      </button>
                    </div>
                  </div>
               </motion.div>
            )}
          </div>

          {/* High-Impact Action */}
          <AnimatePresence>
            {estimation && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-2"
              >
                <button 
                  disabled={loading}
                  type="submit" 
                  className="w-full h-12 bg-[#007AFF] text-white rounded-full text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(0,122,255,0.2)] hover:bg-blue-600 active:scale-[0.98] transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 animate-spin" /> PLACING SERVICE REQUEST...
                    </span>
                  ) : paymentMethod === 'cash' ? (
                    <span className="flex items-center gap-2">
                      <Banknote size={16} /> CONFIRM & PLACE ORDER (CASH ON SERVICE)
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CreditCard size={16} /> PAY ₹{estimation.totalMin} & PLACE ORDER
                    </span>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

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
