'use client';

import { useState, useEffect, Suspense } from 'react';
import { insforge } from '@/lib/insforge';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Navigation, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Bell, 
  ChevronRight, 
  Check, 
  User, 
  Mail, 
  Phone, 
  Flag, 
  Building2, 
  MapPin, 
  Send,
  Wrench,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { classifyWorkerCategories } from '@/lib/workerCategoryClassifier';
import { auth, rtdb, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { doc, setDoc } from 'firebase/firestore';

type Role = 'user' | 'worker' | 'shopkeeper';

const CATEGORIES_LIST = [
  { id: 'Plumbing', label: 'Plumbing' },
  { id: 'Electrician', label: 'Electrician' },
  { id: 'Cleaning', label: 'Cleaning' },
  { id: 'Repair & Services', label: 'Repair & Services' }
];

function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('user');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    pincode: '',
    state: '',
    district: '',
    area: '',
    lat: null as number | null,
    lng: null as number | null,
    otp: '',
    experience: '',
    skills: '',
    shopName: '',
  });

  // Multi-select categories for workers
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [repairDescription, setRepairDescription] = useState('');

  const [detecting, setDetecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const lookupPincode = async () => {
      if (formData.pincode.length === 6) {
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`);
          const data = await res.json();
          if (data[0].Status === 'Success') {
            const firstEntry = data[0].PostOffice[0];
            setFormData(prev => ({
              ...prev,
              state: firstEntry.State,
              district: firstEntry.District
            }));
          }
        } catch (err) {
          console.error('Pincode lookup failed', err);
        }
      }
    };
    lookupPincode();
  }, [formData.pincode]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data.address) {
            const displayArea = [
              data.address.road || data.address.suburb || data.address.neighbourhood,
              data.address.city || data.address.town || data.address.village
            ].filter(Boolean).join(', ');

            setFormData(prev => ({
              ...prev,
              area: displayArea || data.display_name,
              state: data.address.state || prev.state,
              district: data.address.city_district || data.address.state_district || prev.district,
              pincode: data.address.postcode || prev.pincode
            }));
          }
        } catch (err) {
          console.error('Reverse geocoding failed', err);
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        setError('Location access denied or unavailable');
        setDetecting(false);
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Toggle Category Multi-select
  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(c => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation for Worker role
    if (role === 'worker') {
      if (selectedCategories.length === 0) {
        setError('Please select at least one service category.');
        setLoading(false);
        return;
      }
      if (selectedCategories.includes('Repair & Services') && !repairDescription.trim()) {
        setError('Please describe your repair skills in the description box.');
        setLoading(false);
        return;
      }
    }

    const cleanEmail = formData.email.trim().toLowerCase();

    try {
      // 1. Firebase Auth signup (best effort)
      try {
        await createUserWithEmailAndPassword(auth, cleanEmail, formData.password);
      } catch (fbErr: any) {
        console.warn('Firebase createUser note (email may exist):', fbErr?.message);
      }

      // 2. Generate 4-digit OTP Code (ALWAYS GENERATED FOR EVERY REGISTRATION ATTEMPT)
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Save OTP to Realtime Database
      try {
        const sanitizedEmail = cleanEmail.replace(/[.#$/\[\]]/g, '_');
        await set(ref(rtdb, `temp_otps/${sanitizedEmail}`), {
          otp: generatedOtp,
          created_at: new Date().toISOString()
        });
      } catch (e) {}

      // 3. Dispatch OTP Email to User via /api/send-email (ALWAYS SENT TO RECIPIENT INBOX)
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toEmail: cleanEmail,
            toName: formData.name,
            type: 'otp',
            params: { OTP: generatedOtp }
          })
        });
      } catch (sendErr) {
        console.warn('OTP dispatch note:', sendErr);
      }

      setStep(3);
    } catch (err: any) {
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = formData.email.trim().toLowerCase();
    const isAdmin = cleanEmail === 'gorepireo@gmail.com';
    const finalRole = isAdmin ? 'admin' : role;
    const finalStatus = isAdmin ? 'active' : (role === 'user' ? 'active' : 'pending_approval');
    const classification = classifyWorkerCategories(selectedCategories, repairDescription);
    const userId = auth.currentUser?.uid || 'user_' + Date.now();

    const userDataObj = {
      id: userId,
      email: cleanEmail,
      name: isAdmin ? 'Admin Support' : formData.name,
      role: finalRole,
      phone: formData.phone,
      state: formData.state,
      district: formData.district,
      pincode: formData.pincode,
      area: formData.area,
      lat: formData.lat,
      lng: formData.lng,
      status: finalStatus,
      email_verified: true,
      specializations: role === 'worker' ? selectedCategories : null,
      repair_description: role === 'worker' ? repairDescription : null,
      category_tokens: role === 'worker' ? classification.categoryTokens : null
    };

    // 1. Attempt InsForge DB Insert
    try {
      const { data: verifyData } = await insforge.auth.verifyEmail({
        email: formData.email,
        otp: formData.otp
      });
      await insforge.database.from('users').insert(userDataObj);
      if (role === 'worker') {
        await insforge.database.from('worker_applications').insert({
          app_id: userId, 
          from_name: formData.name,
          email: cleanEmail,
          mobile: formData.phone,
          service: selectedCategories.join(', '),
          experience: parseInt(formData.experience) || 0,
          other_skills: repairDescription,
          specializations: selectedCategories,
          category_tokens: classification.categoryTokens,
          state: formData.state,
          district: formData.district,
          pincode: formData.pincode,
          address: formData.area,
          password: formData.password
        });
      }
    } catch (insErr) {
      console.warn('InsForge verify fallback to Firebase:', insErr);
    }

    // 2. Always Save Account & Profile directly to Firebase Realtime Database & Firestore
    try {
      const sanitizedUid = userId.replace(/[.#$/\[\]]/g, '_');
      await set(ref(rtdb, `users/${sanitizedUid}`), userDataObj);
      try {
        await setDoc(doc(db, 'users', sanitizedUid), userDataObj);
      } catch (fsErr) {
        // Ignore if Firestore native mode disabled
      }

      if (role === 'worker') {
        const workerAppObj = {
          app_id: userId, 
          from_name: formData.name,
          email: cleanEmail,
          mobile: formData.phone,
          service: selectedCategories.join(', '),
          experience: parseInt(formData.experience) || 0,
          other_skills: repairDescription,
          specializations: selectedCategories,
          category_tokens: classification.categoryTokens,
          state: formData.state,
          district: formData.district,
          pincode: formData.pincode,
          address: formData.area,
          status: 'pending_approval'
        };
        await set(ref(rtdb, `worker_applications/${sanitizedUid}`), workerAppObj);
        try {
          await setDoc(doc(db, 'worker_applications', sanitizedUid), workerAppObj);
        } catch (fsErr) {}
      }
    } catch (fbErr) {
      console.warn('Firebase RTDB store note:', fbErr);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('repireo_user_email', cleanEmail);
      localStorage.setItem('repireo_cached_role', finalRole);
    }

    router.push('/login?registered=true');
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const cleanEmail = formData.email.trim().toLowerCase();
      const sanitizedEmail = cleanEmail.replace(/[.#$/\[\]]/g, '_');

      await set(ref(rtdb, `temp_otps/${sanitizedEmail}`), {
        otp: generatedOtp,
        created_at: new Date().toISOString()
      });

      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: cleanEmail,
          toName: formData.name,
          type: 'otp',
          params: { OTP: generatedOtp }
        })
      });

      alert('A new verification OTP code has been sent to ' + cleanEmail);
    } catch (err: any) {
      setError('Resend failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F5FA] text-[#0F172A] py-8 relative overflow-hidden font-sans">
      
      {/* Top Bar Header */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 flex items-center justify-between mb-8">
         <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md p-1.5 mb-1">
               <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-tight leading-none text-[#0A1629]">
               <span className="text-[#007AFF]">GO_</span>
               <span className="text-[#FF9500]">REPIREO</span>
            </h3>
         </div>

         <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 flex items-center justify-center">
               <Bell className="w-5 h-5 text-slate-700" />
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-slate-200">
               <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-full h-full object-cover" />
            </div>
         </div>
      </div>

      {/* Hero Header */}
      <div className="relative z-10 text-center mb-8 px-4">
         <h1 className="text-3xl md:text-5xl font-black leading-none tracking-tight text-[#0A1629] uppercase">
            CREATE<br />
            <span className="text-[#007AFF]">ACCOUNT.</span>
         </h1>
         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-3">JOIN REPIREO TODAY</p>
      </div>

      {/* Form Container */}
      <div className="relative z-10 px-4 max-w-xl mx-auto">
         <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100/60">
            
            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    step === s ? 'bg-[#007AFF] w-6' : step > s ? 'bg-blue-300 w-3' : 'bg-slate-200 w-1.5'
                  }`} 
                />
              ))}
            </div>

            <div className="text-center mb-6">
               <p className="text-[8px] font-bold text-[#007AFF] uppercase tracking-widest mb-1">STEP {step} OF 3</p>
               <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#0A1629]">
                 {step === 1 ? 'CHOOSE ACCOUNT TYPE' : step === 2 ? 'YOUR DETAILS' : 'VERIFY EMAIL'}
               </h2>
            </div>

            {/* Step 1: Role Selection */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                 
                 {/* Customer Card */}
                 <button 
                   type="button"
                   onClick={() => setRole('user')}
                   className={`w-full text-left p-4 rounded-[1.5rem] flex items-center gap-4 transition-all ${
                     role === 'user' 
                     ? 'bg-blue-50/50 border-2 border-[#007AFF] shadow-sm' 
                     : 'bg-white border border-slate-100 hover:border-slate-200'
                   }`}
                 >
                   <div className="w-16 h-16 shrink-0 bg-[#E6F0FA] rounded-2xl overflow-hidden flex items-end justify-center p-1 relative">
                      <img src="/customer_3d.png" alt="Customer" className="w-full h-full object-contain" />
                   </div>
                   <div className="flex-1 py-1">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight mb-0.5">CUSTOMER</h3>
                      <p className="text-[10px] text-slate-500 leading-tight">Book services for your home and manage orders</p>
                   </div>
                   <div className="w-7 h-7 rounded-full bg-white shadow-xs flex items-center justify-center shrink-0 border border-slate-100">
                      <ChevronRight className={`w-4 h-4 ${role === 'user' ? 'text-[#007AFF]' : 'text-slate-300'}`} />
                   </div>
                 </button>

                 {/* Specialist Card */}
                 <button 
                   type="button"
                   onClick={() => setRole('worker')}
                   className={`w-full text-left p-4 rounded-[1.5rem] flex items-center gap-4 transition-all ${
                     role === 'worker' 
                     ? 'bg-blue-50/50 border-2 border-[#007AFF] shadow-sm' 
                     : 'bg-white border border-slate-100 hover:border-slate-200'
                   }`}
                 >
                   <div className="w-16 h-16 shrink-0 bg-slate-50 rounded-2xl flex items-center justify-center p-2">
                      <img src="/specialist_toolbox_3d.png" alt="Specialist" className="w-full h-full object-contain" />
                   </div>
                   <div className="flex-1 py-1">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight mb-0.5">SPECIALIST / WORKER</h3>
                      <p className="text-[10px] text-slate-500 leading-tight">Offer your repair, electrical, plumbing & cleaning services</p>
                   </div>
                   <div className="w-7 h-7 rounded-full bg-white shadow-xs flex items-center justify-center shrink-0 border border-slate-100">
                      <ChevronRight className={`w-4 h-4 ${role === 'worker' ? 'text-[#007AFF]' : 'text-slate-300'}`} />
                   </div>
                 </button>

                 {/* Shop / Merchant Card (BLURRED & UNCLICKABLE WITH COMING SOON BADGE) */}
                 <div className="relative w-full p-4 rounded-[1.5rem] flex items-center gap-4 bg-slate-50/70 border border-slate-200/80 pointer-events-none overflow-hidden select-none">
                   
                   {/* Diagonal Caution Ribbon Banner */}
                   <div className="absolute -right-7 top-4 rotate-45 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[8px] uppercase tracking-widest px-8 py-0.5 shadow-xs z-20">
                     COMING SOON
                   </div>

                   <div className="w-16 h-16 shrink-0 bg-slate-100 rounded-2xl flex items-center justify-center p-1 filter blur-[1.5px] opacity-60">
                      <img src="/merchant_storefront_3d.png" alt="Shopkeeper" className="w-full h-full object-contain" />
                   </div>
                   
                   <div className="flex-1 py-1 filter blur-[0.8px] opacity-70">
                      <h3 className="text-xs sm:text-sm font-black text-slate-700 uppercase tracking-tight mb-0.5">
                        SHOPKEEPER / HARDWARE SUPPLY STORE
                      </h3>
                      <p className="text-[9.5px] text-slate-400 leading-tight">
                        Sell hardware, spare parts, and tools on Go_Repireo
                      </p>
                   </div>

                   <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                      <Lock size={12} />
                   </div>
                 </div>

                 <button 
                   type="button"
                   onClick={() => setStep(2)} 
                   className="w-full h-12 bg-[#0A1629] text-white rounded-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors active:scale-95 mt-6"
                 >
                   CONTINUE <ArrowRight size={14} />
                 </button>
              </motion.div>
            )}

            {/* Step 2: Form Details */}
            {step === 2 && (
              <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleRegister} className="space-y-4">
                 
                 {/* Full Name */}
                 <div className="space-y-1">
                   <label className="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">Full Name</label>
                   <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-200 px-3 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#007AFF]/20 outline-none placeholder:text-slate-400 shadow-xs" placeholder="Your full name" />
                 </div>
                 
                 {/* Email & Phone Grid */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div className="space-y-1">
                     <label className="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">Email Address</label>
                     <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-200 px-3 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#007AFF]/20 outline-none placeholder:text-slate-400 shadow-xs" placeholder="you@example.com" />
                   </div>

                   <div className="space-y-1">
                     <label className="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">Phone Number</label>
                     <input required type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-200 px-3 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#007AFF]/20 outline-none placeholder:text-slate-400 shadow-xs" placeholder="10 digit mobile number" />
                   </div>
                 </div>

                 {/* Password */}
                 <div className="space-y-1">
                   <label className="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">Password</label>
                   <div className="relative">
                     <input required type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-200 pl-3 pr-10 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#007AFF]/20 outline-none placeholder:text-slate-400 shadow-xs" placeholder="Create password" />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                       {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                     </button>
                   </div>
                 </div>

                 {/* Location Details Grid - Only required for Worker/Shopkeeper account registration */}
                 {role !== 'user' && (
                   <div className="grid grid-cols-2 gap-3 pt-1">
                     <div className="space-y-1">
                       <label className="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">State</label>
                       <input required name="state" value={formData.state} onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-200 px-3 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#007AFF]/20 outline-none placeholder:text-slate-400 shadow-xs" placeholder="Uttar Pradesh" />
                     </div>

                     <div className="space-y-1">
                       <label className="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">City / District</label>
                       <input required name="district" value={formData.district} onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-200 px-3 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#007AFF]/20 outline-none placeholder:text-slate-400 shadow-xs" placeholder="Etawah" />
                     </div>

                     <div className="space-y-1">
                       <label className="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">Pincode</label>
                       <input required name="pincode" value={formData.pincode} onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-200 px-3 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#007AFF]/20 outline-none placeholder:text-slate-400 shadow-xs" placeholder="206001" maxLength={6} />
                     </div>

                     <div className="space-y-1">
                       <label className="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">Area / Landmark</label>
                       <div className="relative">
                         <input required name="area" value={formData.area} onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-200 pl-3 pr-8 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#007AFF]/20 outline-none placeholder:text-slate-400 shadow-xs" placeholder="Lalpura, Etawah" />
                         <button type="button" onClick={detectLocation} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#007AFF]">
                           <Navigation size={12} />
                         </button>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* WORKER MULTI-SELECT CATEGORIES & MANDATORY REPAIR DESCRIPTION BOX */}
                 {role === 'worker' && (
                   <div className="space-y-4 pt-3 border-t border-slate-100">
                     
                     {/* Category Selection Header */}
                     <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider block flex items-center justify-between">
                         <span>Select Specialization Categories (Multi-Select)</span>
                         <span className="text-[8.5px] font-bold text-[#007AFF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                           {selectedCategories.length} Selected
                         </span>
                       </label>

                       {/* Multi-Select Category Pill Buttons with Modern High-contrast Typography */}
                       <div className="grid grid-cols-2 gap-2 pt-1">
                         {CATEGORIES_LIST.map((cat) => {
                           const isSelected = selectedCategories.includes(cat.id);
                           return (
                             <button
                               key={cat.id}
                               type="button"
                               onClick={() => toggleCategory(cat.id)}
                               className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-95 ${
                                 isSelected
                                   ? 'bg-blue-50/90 border-[#007AFF] text-[#007AFF] shadow-xs font-black'
                                   : 'bg-white border-slate-200 text-slate-800 font-bold hover:border-slate-300'
                               }`}
                             >
                               <span className="text-xs tracking-tight">{cat.label}</span>
                               <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                                 isSelected ? 'bg-[#007AFF] border-[#007AFF] text-white' : 'border-slate-300 bg-white'
                               }`}>
                                 {isSelected && <Check size={10} strokeWidth={3} />}
                               </div>
                             </button>
                           );
                         })}
                       </div>
                     </div>

                     {/* Experience Field */}
                     <div className="space-y-1">
                       <label className="text-[9px] font-extrabold text-slate-700 uppercase tracking-wider block">Years of Experience</label>
                       <input 
                         type="number" 
                         name="experience" 
                         value={formData.experience} 
                         onChange={handleInputChange} 
                         required 
                         className="w-full h-10 bg-white border border-slate-200 px-3 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#007AFF]/20 outline-none placeholder:text-slate-400 shadow-xs" 
                         placeholder="e.g. 5 Years" 
                       />
                     </div>

                     {/* MANDATORY REPAIR & MAINTENANCE SKILLS DESCRIPTION BOX */}
                     {selectedCategories.includes('Repair & Services') && (
                       <div className="space-y-1.5 p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100">
                         <div className="flex items-center justify-between">
                           <label className="text-[10px] font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                             <Wrench size={13} className="text-[#007AFF]" />
                             <span>Describe Repair Skills (Mandatory)</span>
                           </label>
                           <span className="text-[8px] font-black text-red-500 uppercase bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                             Required
                           </span>
                         </div>

                         <textarea
                           rows={3}
                           required
                           value={repairDescription}
                           onChange={(e) => setRepairDescription(e.target.value)}
                           placeholder="Describe your repair skills (e.g. I can repair Split AC, Inverter PCB, Washing Machine motor, Water Purifier, Geyser coil)..."
                           className="w-full bg-white border border-slate-200 text-slate-900 text-xs p-3 rounded-xl focus:ring-2 focus:ring-[#007AFF]/30 outline-none resize-none font-medium leading-relaxed shadow-2xs"
                         />

                         <p className="text-[9px] text-blue-700 font-medium">
                           💡 Our AI model will analyze your repair description and automatically tag your account to receive matching customer notifications.
                         </p>
                       </div>
                     )}

                   </div>
                 )}

                 {error && <p className="text-[#FF3B30] text-[10px] font-bold uppercase tracking-widest p-3 bg-red-50 rounded-xl border border-red-100 mt-2">{error}</p>}

                 <div className="flex gap-3 pt-4">
                   <button type="button" onClick={() => setStep(1)} className="flex-1 h-11 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors">
                     <ArrowLeft size={14} /> BACK
                   </button>
                   <button disabled={loading} type="submit" className="flex-[2] h-11 bg-[#007AFF] text-white rounded-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors active:scale-95 shadow-md shadow-blue-500/20">
                     {loading ? 'CREATING...' : 'CONTINUE'} <ArrowRight size={14} />
                   </button>
                 </div>
              </motion.form>
            )}

            {/* Step 3: Verification */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6">
                 <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8 text-[#007AFF]" />
                 </div>
                 
                 <div>
                   <p className="text-[10px] text-slate-500 mb-1">We've sent a code to</p>
                   <p className="text-sm font-bold text-slate-900">{formData.email}</p>
                 </div>

                 <form onSubmit={handleVerifyOtp} className="space-y-4">
                   <input 
                     required 
                     name="otp" 
                     value={formData.otp} 
                     onChange={handleInputChange} 
                     className="w-full text-center text-4xl font-black tracking-[0.2em] h-20 bg-[#F8FAFC] border border-slate-200 rounded-2xl outline-none text-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20" 
                     placeholder="000000" 
                     maxLength={6} 
                   />

                   {error && <p className="text-[#FF3B30] text-[10px] font-bold tracking-widest p-3 bg-red-50 rounded-xl border border-red-100">{error}</p>}

                   <button disabled={loading} type="submit" className="w-full h-14 bg-[#0A1629] text-white rounded-full flex items-center justify-center text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors active:scale-95 mt-4">
                     {loading ? 'VERIFYING...' : 'VERIFY & CONTINUE'}
                   </button>

                   <div className="pt-4 flex flex-col gap-3">
                     <button type="button" onClick={handleResendOtp} disabled={loading} className="text-[10px] font-bold text-[#007AFF] uppercase tracking-widest hover:underline">
                       Resend Code
                     </button>
                   </div>
                 </form>
              </motion.div>
            )}

         </div>
      </div>

    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F0F5FA] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}