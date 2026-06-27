'use client';

import { useState, useEffect, Suspense } from 'react';
import { insforge } from '@/lib/insforge';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Navigation, Lock, ShieldCheck, ArrowRight, Eye, EyeOff, ArrowLeft, Bell, ChevronRight, Check, User, Mail, Phone, Flag, Building2, MapPin, Send } from 'lucide-react';
import Link from 'next/link';

type Role = 'user' | 'worker' | 'shopkeeper';

function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('user');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    category: '',
    experience: '',
    skills: '',
    shopName: '',
  });

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (role === 'shopkeeper') {
        const { error: shopError } = await insforge.database.from('shop_applications').insert({
          shop_name: formData.shopName,
          owner_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.area,
          password: formData.password,
          status: 'pending',
          pincode: formData.pincode,
          state: formData.state,
          district: formData.district,
          area: formData.area,
          lat: formData.lat,
          lng: formData.lng
        });
        if (shopError) throw shopError;
        
        alert('Shop application submitted successfully! We will contact you soon.');
        router.push('/login');
        return;
      }

      const { data, error: signUpError } = await insforge.auth.signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (signUpError) {
        if (signUpError.message?.toLowerCase().includes('already registered')) {
          setStep(3);
          return;
        }
        throw signUpError;
      }

      if (data?.requireEmailVerification || data?.user) {
        setStep(3);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: verifyData, error: verifyError } = await insforge.auth.verifyEmail({
        email: formData.email,
        otp: formData.otp
      });

      if (verifyError) throw verifyError;

      if (verifyData?.user) {
        const userId = verifyData.user.id;

        const isAdmin = formData.email === 'gorepireo@gmail.com';
        const finalRole = isAdmin ? 'admin' : role;
        const finalStatus = isAdmin ? 'active' : (role === 'user' ? 'active' : 'pending_approval');

        const { error: userTableError } = await insforge.database.from('users').insert({
          id: userId,
          email: formData.email,
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
          email_verified: true
        });

        if (userTableError) throw userTableError;

        if (isAdmin) {
            // Skip further worker/shop application logic for admin
        } else if (role === 'worker') {
          const { error: workerError } = await insforge.database.from('worker_applications').insert({
            app_id: userId, 
            from_name: formData.name,
            email: formData.email,
            mobile: formData.phone,
            service: formData.category,
            experience: parseInt(formData.experience) || 0,
            other_skills: formData.skills,
            state: formData.state,
            district: formData.district,
            pincode: formData.pincode,
            address: formData.area,
            password: formData.password
          });
          if (workerError) throw workerError;
        } else if (role === 'shopkeeper') {
          const { error: shopError } = await insforge.database.from('shop_applications').insert({
            shop_name: formData.shopName,
            owner_name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.area,
            password: formData.password,
            status: 'pending'
          });
          if (shopError) throw shopError;
        }

        const profileData: any = {
          role,
          status: role === 'user' ? 'active' : 'pending_approval',
          phone: formData.phone,
          address: {
            state: formData.state,
            district: formData.district,
            area: formData.area,
            pincode: formData.pincode,
            lat: formData.lat,
            lng: formData.lng
          }
        };

        if (role === 'worker') {
          profileData.worker_data = {
            category: formData.category,
            experience: formData.experience,
            skills: formData.skills,
          };
        } else if (role === 'shopkeeper') {
          profileData.shop_data = {
            shop_name: formData.shopName,
            category: formData.category,
          };
        }

        const { error: profileError } = await insforge.auth.setProfile(profileData);
        if (profileError) throw profileError;

        router.push('/login?registered=true');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: resendError } = await insforge.auth.resendVerificationEmail({
        email: formData.email
      });
      if (resendError) throw resendError;
      alert('Verification code resent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F5FA] pb-24 relative overflow-hidden">
      {/* Background soft gradients */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#E6F0FA] to-[#F0F5FA] z-0 pointer-events-none">
         <div className="absolute top-40 -left-20 w-96 h-96 bg-white/40 rounded-full blur-3xl"></div>
         <div className="absolute top-20 -right-20 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl"></div>
      </div>

      {/* Navbar Area */}
      <div className="relative z-10 px-4 pt-6 flex justify-between items-center mb-6">
         <Link href="/login" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700" />
         </Link>
         
         <div className="flex flex-col items-center">
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
               <div className="absolute top-1 right-2 w-3.5 h-3.5 bg-[#FF9500] border-2 border-[#F0F5FA] rounded-full flex items-center justify-center">
                 <span className="text-[6px] text-white font-bold">3</span>
               </div>
            </div>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-slate-200">
               {/* Dummy Avatar */}
               <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="w-full h-full object-cover" />
            </div>
         </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center mb-10 px-4">
         <h1 className="text-4xl md:text-5xl font-black leading-none tracking-tight text-[#0A1629] uppercase">
            CREATE<br />
            <span className="text-[#007AFF]">ACCOUNT.</span>
         </h1>
         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-3">JOIN REPIREO TODAY</p>
      </div>

      {/* Main Registration Card */}
      <div className="relative z-10 px-4 max-w-2xl mx-auto">
         <div className="bg-white rounded-[2rem] p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100/50">
            
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

            <div className="text-center mb-8">
               <p className="text-[8px] font-bold text-[#007AFF] uppercase tracking-widest mb-1">STEP {step} OF 3</p>
               <h2 className="text-lg font-black uppercase tracking-tight text-[#0A1629]">
                 {step === 1 ? 'CHOOSE ACCOUNT TYPE' : step === 2 ? 'YOUR DETAILS' : 'VERIFY EMAIL'}
               </h2>
               {step === 2 && (
                 <p className="text-[9px] text-slate-500 mt-1">Please fill in your details to continue</p>
               )}
            </div>

            {/* Step 1: Role Selection */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                 
                 {/* Customer Card */}
                 <button 
                   onClick={() => setRole('user')}
                   className={`w-full text-left p-4 rounded-[1.5rem] flex items-center gap-4 transition-all ${
                     role === 'user' 
                     ? 'bg-blue-50/50 border border-[#007AFF]/20 shadow-sm' 
                     : 'bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:border-slate-200'
                   }`}
                 >
                   <div className="w-20 h-20 shrink-0 bg-[#E6F0FA] rounded-2xl overflow-hidden flex items-end justify-center pt-2 px-1 relative">
                      <img src="/customer_3d.png" alt="Customer" className="w-[120%] h-[120%] object-cover object-bottom translate-y-1" />
                   </div>
                   <div className="flex-1 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">CUSTOMER</h3>
                      <p className="text-[10px] text-slate-500 leading-tight mb-2 pr-2">Book services for your home and manage your orders</p>
                      {role === 'user' && (
                         <div className="inline-flex items-center gap-1 bg-blue-100 text-[#007AFF] px-2 py-0.5 rounded-full">
                           <CheckCircle2 className="w-3 h-3 fill-current text-blue-100" />
                           <span className="text-[8px] font-bold">Recommended</span>
                         </div>
                      )}
                   </div>
                   <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-50">
                      <ChevronRight className={`w-4 h-4 ${role === 'user' ? 'text-[#007AFF]' : 'text-slate-300'}`} />
                   </div>
                 </button>

                 {/* Specialist Card */}
                 <button 
                   onClick={() => setRole('worker')}
                   className={`w-full text-left p-4 rounded-[1.5rem] flex items-center gap-4 transition-all ${
                     role === 'worker' 
                     ? 'bg-blue-50/50 border border-[#007AFF]/20 shadow-sm' 
                     : 'bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:border-slate-200'
                   }`}
                 >
                   <div className="w-20 h-20 shrink-0 bg-slate-50 rounded-2xl flex items-center justify-center p-2">
                      <img src="/specialist_toolbox_3d.png" alt="Specialist" className="w-full h-full object-contain" />
                   </div>
                   <div className="flex-1 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">SPECIALIST</h3>
                      <p className="text-[10px] text-slate-500 leading-tight pr-2">Offer your services and connect with customers</p>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-50">
                      <ChevronRight className={`w-4 h-4 ${role === 'worker' ? 'text-[#007AFF]' : 'text-slate-300'}`} />
                   </div>
                 </button>

                 {/* Merchant Card */}
                 <button 
                   disabled
                   className="w-full text-left p-4 rounded-[1.5rem] flex items-center gap-4 transition-all bg-white border border-slate-100 opacity-60 cursor-not-allowed"
                 >
                   <div className="w-20 h-20 shrink-0 bg-slate-50 rounded-2xl flex items-center justify-center p-1 grayscale">
                      <img src="/merchant_storefront_3d.png" alt="Merchant" className="w-full h-full object-contain" />
                   </div>
                   <div className="flex-1 py-1">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">MERCHANT</h3>
                      <p className="text-[10px] text-slate-500 leading-tight pr-2 mb-2">Sell products and equipment on Repireo platform</p>
                      <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        <span className="text-[8px] font-bold uppercase tracking-widest">Coming Soon</span>
                      </div>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-50">
                      <Lock className="w-3 h-3 text-slate-300" />
                   </div>
                 </button>

                 <button 
                   onClick={() => setStep(2)} 
                   className="w-full h-14 bg-[#0A1629] text-white rounded-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors active:scale-95 mt-6"
                 >
                   CONTINUE <ArrowRight size={14} />
                 </button>
              </motion.div>
            )}

            {/* Step 2: Form Details */}
            {step === 2 && (
              <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleRegister} className="space-y-4">
                 
                 <div className="flex items-start gap-3">
                   <div className="w-10 h-10 bg-blue-50/80 rounded-xl flex items-center justify-center shrink-0 mt-1">
                      <User className="w-5 h-5 text-[#007AFF]" />
                   </div>
                   <div className="flex-1 space-y-1">
                     <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                     <input required name="name" onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-100 px-3 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400 placeholder:text-xs shadow-sm" placeholder="Your full name" />
                   </div>
                 </div>
                 
                 <div className="flex items-start gap-3">
                   <div className="w-10 h-10 bg-blue-50/80 rounded-xl flex items-center justify-center shrink-0 mt-1">
                      <Mail className="w-5 h-5 text-[#007AFF]" />
                   </div>
                   <div className="flex-1 space-y-1">
                     <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                     <input required type="email" name="email" onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-100 px-3 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400 placeholder:text-xs shadow-sm" placeholder="you@example.com" />
                   </div>
                 </div>

                 <div className="flex items-start gap-3">
                   <div className="w-10 h-10 bg-blue-50/80 rounded-xl flex items-center justify-center shrink-0 mt-1">
                      <Phone className="w-5 h-5 text-[#007AFF]" />
                   </div>
                   <div className="flex-1 space-y-1">
                     <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                     <input required type="text" name="phone" onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-100 px-3 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400 placeholder:text-xs shadow-sm" placeholder="Enter 10 digit mobile number" />
                   </div>
                 </div>

                 <div className="flex items-start gap-3">
                   <div className="w-10 h-10 bg-blue-50/80 rounded-xl flex items-center justify-center shrink-0 mt-1">
                      <Lock className="w-5 h-5 text-[#007AFF]" />
                   </div>
                   <div className="flex-1 space-y-1">
                     <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                     <div className="relative">
                       <input required type={showPassword ? 'text' : 'password'} name="password" onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-100 pl-3 pr-10 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400 placeholder:text-xs shadow-sm" placeholder="Create a strong password" />
                       <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                         {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                       </button>
                     </div>
                   </div>
                 </div>

                 {/* Location Details Grid */}
                 <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-2">
                   
                   {/* State */}
                   <div className="flex items-start gap-2">
                     <div className="w-8 h-8 bg-blue-50/80 rounded-xl flex items-center justify-center shrink-0 mt-1">
                        <Flag className="w-4 h-4 text-[#007AFF]" />
                     </div>
                     <div className="flex-1 min-w-0 space-y-1">
                       <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">State</label>
                       <input required name="state" value={formData.state} onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-100 px-3 rounded-xl text-xs font-medium text-slate-900 focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400 shadow-sm" placeholder="Select state" />
                     </div>
                   </div>

                   {/* District / City */}
                   <div className="flex items-start gap-2">
                     <div className="w-8 h-8 bg-blue-50/80 rounded-xl flex items-center justify-center shrink-0 mt-1">
                        <Building2 className="w-4 h-4 text-[#007AFF]" />
                     </div>
                     <div className="flex-1 min-w-0 space-y-1">
                       <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">City</label>
                       <input required name="district" value={formData.district} onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-100 px-3 rounded-xl text-xs font-medium text-slate-900 focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400 shadow-sm" placeholder="Select city" />
                     </div>
                   </div>

                   {/* Pincode */}
                   <div className="flex items-start gap-2">
                     <div className="w-8 h-8 bg-blue-50/80 rounded-xl flex items-center justify-center shrink-0 mt-1">
                        <MapPin className="w-4 h-4 text-[#007AFF]" />
                     </div>
                     <div className="flex-1 min-w-0 space-y-1">
                       <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">Pincode</label>
                       <input required name="pincode" value={formData.pincode} onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-100 px-3 rounded-xl text-xs font-medium text-slate-900 focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400 shadow-sm" placeholder="6 digit pincode" maxLength={6} />
                     </div>
                   </div>

                   {/* Area */}
                   <div className="flex items-start gap-2">
                     <div className="w-8 h-8 bg-blue-50/80 rounded-xl flex items-center justify-center shrink-0 mt-1">
                        <Send className="w-4 h-4 text-[#007AFF]" />
                     </div>
                     <div className="flex-1 min-w-0 space-y-1">
                       <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">Area</label>
                       <div className="relative">
                         <input required name="area" value={formData.area} onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-100 pl-3 pr-8 rounded-xl text-xs font-medium text-slate-900 focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400 shadow-sm" placeholder="Enter your area" />
                         <button type="button" onClick={detectLocation} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#007AFF]">
                           <Navigation size={12} />
                         </button>
                       </div>
                     </div>
                   </div>

                 </div>

                 {/* Conditional Fields based on role */}
                 {role === 'shopkeeper' && (
                   <div className="flex items-start gap-3 pt-2">
                     <div className="w-10 h-10 bg-blue-50/80 rounded-xl flex items-center justify-center shrink-0 mt-1">
                        <Building2 className="w-5 h-5 text-[#007AFF]" />
                     </div>
                     <div className="flex-1 space-y-1">
                       <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">Shop Name</label>
                       <input required type="text" name="shopName" onChange={handleInputChange} className="w-full h-10 bg-white border border-slate-100 px-3 rounded-xl text-sm font-medium text-slate-900 focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400 placeholder:text-xs shadow-sm" placeholder="Your shop name" />
                     </div>
                   </div>
                 )}

                 {role === 'worker' && (
                   <div className="grid grid-cols-2 gap-x-4 gap-y-4 pt-2">
                     <div className="flex items-start gap-2">
                       <div className="w-8 h-8 bg-blue-50/80 rounded-xl flex items-center justify-center shrink-0 mt-1">
                          <CheckCircle2 className="w-4 h-4 text-[#007AFF]" />
                       </div>
                       <div className="flex-1 min-w-0 space-y-1">
                         <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">Category</label>
                         <select name="category" onChange={handleInputChange} required className="w-full h-10 bg-white border border-slate-100 px-2 rounded-xl text-xs font-medium text-slate-900 focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none shadow-sm">
                           <option value="">Select</option>
                           <option value="Plumbing">Plumbing</option>
                           <option value="Electrical">Electrical</option>
                           <option value="HVAC">HVAC / AC</option>
                         </select>
                       </div>
                     </div>
                     <div className="flex items-start gap-2">
                       <div className="w-8 h-8 bg-blue-50/80 rounded-xl flex items-center justify-center shrink-0 mt-1">
                          <ShieldCheck className="w-4 h-4 text-[#007AFF]" />
                       </div>
                       <div className="flex-1 min-w-0 space-y-1">
                         <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">Experience</label>
                         <input type="number" name="experience" onChange={handleInputChange} required className="w-full h-10 bg-white border border-slate-100 px-3 rounded-xl text-xs font-medium text-slate-900 focus:ring-1 focus:ring-[#007AFF]/30 transition-all outline-none placeholder:text-slate-400 shadow-sm" placeholder="Years" />
                       </div>
                     </div>
                   </div>
                 )}

                 {error && <p className="text-[#FF3B30] text-[10px] font-bold uppercase tracking-widest p-3 bg-red-50 rounded-xl border border-red-100 mt-2">{error}</p>}

                 <div className="flex gap-4 pt-6">
                   <button type="button" onClick={() => setStep(1)} className="flex-1 h-12 bg-blue-50 text-[#007AFF] rounded-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-colors">
                     <ArrowLeft size={14} /> BACK
                   </button>
                   <button disabled={loading} type="submit" className="flex-[2] h-12 bg-[#007AFF] text-white rounded-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-colors active:scale-95 shadow-md shadow-blue-500/20">
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
                     className="w-full text-center text-4xl font-black tracking-[0.2em] h-20 bg-[#F8FAFC] border border-slate-100 rounded-2xl outline-none text-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20" 
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