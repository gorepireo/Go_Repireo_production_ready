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
  LayoutGrid
} from 'lucide-react';

export default function ServiceBooking() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [formData, setFormData] = useState({
    category: 'plumbing',
    description: '',
    preferredDate: '',
    preferredTime: '',
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

  const estimatedPrice = estimation ? estimation.totalMin : 500;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/services/service');
    } else if (user) {
      insforge.database.from('user_addresses').select('*').eq('user_id', user.id)
        .then(({ data }) => { if (data) setAddresses(data); });
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?redirect=/services/service');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Create order on backend for Razorpay
      const res = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount: estimatedPrice })
      });
      const orderResData = await res.json();
      
      if (!res.ok) throw new Error(orderResData.error || 'Failed to create order');

      // 2. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: estimatedPrice * 100,
        currency: 'INR',
        name: 'Repireo',
        description: `${formData.category.toUpperCase()} Service Base Estimation`,
        order_id: orderResData.orderId,
        handler: async function (response: any) {
          // 3. Save order on success
          try {
            const { data, error } = await insforge.database
              .from('orders')
              .insert([{
                user_email: user.email,
                service_name: formData.category,
                status: 'pending',
                payment_status: 'paid',
                payment_id: response.razorpay_payment_id,
                total_price: estimatedPrice,
                details: { ...formData, items: [{ type: 'service', name: formData.category }], estimation },
                lat: formData.lat || (12.9716 + (Math.random() - 0.5) * 0.1),
                lng: formData.lng || (77.5946 + (Math.random() - 0.5) * 0.1),
                order_type: 'direct_service'
              }])
              .select();

            if (data) {
              await insforge.database
                .from('order_tracking')
                .insert([{
                  order_id: data[0].id,
                  status: 'pending',
                  lat: data[0].lat - (Math.random() * 0.1),
                  lng: data[0].lng - (Math.random() * 0.1),
                  note: 'Logistic unit assigned. Initialising signal...'
                }]);

              await insforge.database
                .from('notifications')
                .insert([{
                  user_id: user.id,
                  title: 'Service Requested',
                  message: `Your ${formData.category} service request has been received and payment confirmed. Our team is reviewing the details.`,
                  type: 'order',
                  link: `/track?id=${data[0].id}`
                }]);

              router.push(`/track?id=${data[0].id}`);
            }
          } catch (err) {
            console.error('Database save error:', err);
            alert("Payment successful, but failed to save order details. Our team will contact you.");
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

    } catch (err) {
      console.error('Booking error:', err);
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl relative overflow-hidden">
           <motion.div 
             animate={{ rotate: 360 }} 
             transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
             className="absolute inset-0 bg-gradient-to-br from-[#007AFF]/10 to-transparent" 
           />
           <LayoutGrid className="w-10 h-10 text-[#007AFF] animate-pulse" />
        </div>
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-black/10">Establishing Protocol</p>
          <p className="text-sm font-bold uppercase tracking-widest text-[#007AFF] animate-pulse">Initialising Secure Gateway</p>
        </div>
      </div>
    );
  }

  const categories = [
    { id: 'plumbing', label: 'PLUMBING', desc: 'Pipes, fittings, leaks & more', Icon: Droplet, colorClass: 'text-blue-500' },
    { id: 'electrical', label: 'ELECTRICAL', desc: 'Wiring, circuits, panels & more', Icon: Zap, colorClass: 'text-orange-500' },
    { id: 'cleaning', label: 'CLEANING', desc: 'Deep cleaning, sanitization & more', Icon: Sparkles, colorClass: 'text-orange-500' },
    { id: 'repair', label: 'REPAIR', desc: 'Appliances, fixtures & more', Icon: Wrench, colorClass: 'text-purple-600' }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      {/* Top Banner / Header Section */}
      <div className="relative pt-6 pb-4 overflow-hidden bg-white shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-[80%] h-full bg-gradient-to-l from-blue-50/80 to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 flex justify-between items-center">
           <div className="w-[65%] space-y-3 py-6">
             <h1 className="text-4xl font-black italic tracking-tighter leading-[0.9]">
               <span className="text-[#0A1629]">BOOK A</span><br />
               <span className="text-[#007AFF]">PROFESSIONAL.</span>
             </h1>
             <p className="text-[10px] text-slate-500 max-w-[180px] leading-relaxed">
               Secure assignment of elite service experts for essential maintenance.
             </p>
           </div>
        </div>

        {/* Mechanic Image */}
        <div className="absolute -right-2 bottom-0 w-[55%] max-w-[200px] h-[130%] z-20 pointer-events-none flex items-end">
           <img src="/custom_service_mechanic_3d.png" alt="Mechanic" className="w-full h-[90%] object-contain object-bottom drop-shadow-2xl" />
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
              Section 01 <span className="mx-1.5">•</span> Select Discipline
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
              Section 02 <span className="mx-1.5">•</span> Brief Entry
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
                placeholder="E.g. System breach in plumbing cluster A-4..."
              />
            </div>
          </div>

          {/* Temporal Field */}
          <div className="space-y-3">
             <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] block pl-1">
               Section 03 <span className="mx-1.5">•</span> Temporal Sync
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
                    required
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
                    required
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

          {/* Geographical Field */}
          <div className="space-y-3">
             <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] block pl-1">
               Section 04 <span className="mx-1.5">•</span> Geo Lock
             </label>
             <div className="relative">
               <div className="absolute left-4 top-1/2 -translate-y-1/2">
                 <MapPin size={16} className="text-[#007AFF]" />
               </div>
               <div className="absolute left-11 top-[10px] pointer-events-none z-10">
                 <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Destination Coordinates</span>
               </div>
               <input 
                 required 
                 value={formData.address}
                 onFocus={() => setShowAddressDropdown(true)}
                 onBlur={() => setTimeout(() => setShowAddressDropdown(false), 200)}
                 onChange={e => setFormData({ ...formData, address: e.target.value })}
                 className="w-full h-14 bg-white border border-slate-100 rounded-2xl pl-11 pr-12 pt-[14px] text-[10px] font-medium text-slate-900 outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] transition-all shadow-sm placeholder:text-slate-400 relative z-0"
                 placeholder="Auto-detect or select saved location"
               />
               <button 
                 type="button" 
                 onClick={() => {
                   if (navigator.geolocation) {
                     navigator.geolocation.getCurrentPosition(
                       async (position) => {
                         try {
                           const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`);
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
                 className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-50/50 rounded-full flex items-center justify-center text-[#007AFF] hover:bg-blue-100 transition-colors z-10"
               >
                 <LocateFixed size={14} />
               </button>

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
              Optional <span className="mx-1.5">•</span> Visual Log
            </label>
            <label className="w-full h-[80px] bg-white border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 hover:border-[#007AFF]/30 transition-all cursor-pointer relative overflow-hidden">
               <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,video/mp4" multiple />
               <CloudUpload size={24} className="text-[#007AFF]" />
               <div className="text-center">
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Attach Images or Videos</p>
                  <p className="text-[7px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">JPG, PNG, MP4 up to 20MB</p>
               </div>
            </label>
          </div>

          {/* Estimated Price Section */}
          <div className="space-y-3 pt-4">
            {!estimation ? (
              <button 
                type="button"
                onClick={handleEstimate}
                disabled={isEstimating}
                className="w-full h-12 bg-white border border-[#007AFF] text-[#007AFF] rounded-full text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-50 active:scale-[0.98] transition-all"
              >
                {isEstimating ? (
                  <span className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 animate-spin" /> ANALYZING REQUIREMENTS...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> GENERATE ESTIMATE
                  </span>
                )}
              </button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4"
              >
                 <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                   <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                     <Sparkles size={14} className="text-[#007AFF]" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">AI Analysis</p>
                     <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{estimation.reasoning}</p>
                   </div>
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
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Deposit</p>
                      <p className="text-[9px] font-medium text-slate-400 mt-0.5">Final amount may vary</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-[#007AFF]">₹{estimation.totalMin}</p>
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
                  <span>{loading ? 'INITIALISING...' : 'CONFIRM & DEPOSIT'}</span>
                  {!loading && <ArrowRight size={16} />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.form>
      </div>
    </div>
  );
}
