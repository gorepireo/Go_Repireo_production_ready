'use client';

import { useState, useEffect } from 'react';
import { insforge } from '@/lib/insforge';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, Store, CheckCircle2, MapPin, Navigation, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type Role = 'user' | 'worker' | 'shopkeeper';

export default function Register() {
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
      setError(err.message || 'Registration failed');
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

        const isAdmin = formData.email === 'Ansh123456789' || formData.email === 'Ansh123456789@neafer.pro';
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
      setError(err.message || 'Verification failed');
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
      alert('Verification code resent to your email');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4 md:p-10 pb-20 md:pb-32">
      <div className="max-w-4xl w-full space-y-10">
        
        {/* Branding & Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center p-2 shadow-2xl shadow-black/5 mx-auto group-hover:rotate-12 transition-transform border border-black/[0.03]">
               <img src="/logo.png" alt="Repireo" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-7xl font-bold uppercase tracking-tighter skew-title">
              PROVISION <br />
              <span className="text-[#007AFF]">PORTAL.</span>
            </h1>
            <p className="tactile-label tracking-[0.4em] text-slate-400">INITIALIZE NEAFER OPERATIONAL UNIT</p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="king-card bg-white shadow-2xl !p-6 md:!p-12 space-y-10"
        >
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full transition-all duration-500 ${step >= s ? 'bg-[#007AFF] w-6' : 'bg-slate-200'}`} />
              </div>
            ))}
          </div>

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
              <div className="text-center">
                 <h2 className="tactile-label !text-slate-400 text-sm">Step 01</h2>
                 <p className="text-xl font-bold uppercase tracking-tight text-slate-800">IDENTITY SELECTION</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'user', title: 'CUSTOMER', icon: User, desc: 'Operational Client' },
                  { id: 'worker', title: 'SPECIALIST', icon: Briefcase, desc: 'Field Protocol Unit' },
                  { id: 'shopkeeper', title: 'MERCHANT', icon: Store, desc: 'Strategic Hub' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRole(r.id as Role)}
                    className={`p-8 rounded-2xl transition-all text-center flex flex-col items-center gap-4 group relative ${
                      role === r.id 
                      ? 'bg-white shadow-xl' 
                      : 'bg-black/[0.02] hover:bg-black/[0.04]'
                    }`}
                  >
                    <div className={`p-4 rounded-xl ${role === r.id ? 'bg-[#007AFF] text-white' : 'bg-black/5 text-slate-300'} group-hover:scale-110 transition-transform`}>
                      <r.icon size={24} />
                    </div>
                    <div>
                       <h3 className="font-bold uppercase tracking-tight text-sm text-slate-800">{r.title}</h3>
                       <p className={`tactile-label !lowercase !tracking-normal mt-1 ${role === r.id ? 'text-[#007AFF]' : 'text-slate-400'}`}>{r.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setStep(2)} 
                className="btn-primary w-full h-14 !text-[10px]"
              >
                CONTINUE INITIALIZATION
              </button>
            </motion.div>
          )}

          {/* Step 2: Form */}
          {step === 2 && (
            <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleRegister} className="space-y-8">
              <div className="text-center">
                 <h2 className="tactile-label !text-slate-400 text-sm">Step 02</h2>
                 <p className="text-xl font-bold uppercase tracking-tight text-slate-800">PROTOCOL PARAMETERS</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Full Identity', name: 'name', type: 'text', placeholder: 'Unit Designation' },
                  { label: 'Uplink Email', name: 'email', type: 'email', placeholder: 'unit@network.com' },
                  { label: 'Signal Link', name: 'phone', type: 'text', placeholder: '+91 00000 00000' },
                  { label: 'Secure Key', name: 'password', type: 'password', placeholder: '••••••••' }
                ].map((field) => (
                  <div key={field.name} className="space-y-2">
                    <label className="tactile-label ml-2">{field.label}</label>
                    <input 
                      required 
                      type={field.type} 
                      name={field.name} 
                      onChange={handleInputChange} 
                      className="w-full h-14 bg-black/[0.02] px-5 rounded-2xl text-sm font-medium focus:bg-white transition-all outline-none" 
                      placeholder={field.placeholder} 
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">
                <div className="space-y-2">
                  <label className="tactile-label ml-2">Grid</label>
                  <input required name="pincode" value={formData.pincode} onChange={handleInputChange} className="w-full h-12 bg-black/[0.02] px-3 rounded-xl text-xs outline-none" placeholder="Pincode" maxLength={6} />
                </div>
                <div className="space-y-2">
                  <label className="tactile-label ml-2">Sector</label>
                  <input required name="state" value={formData.state} onChange={handleInputChange} className="w-full h-12 bg-black/[0.02] px-3 rounded-xl text-xs outline-none" placeholder="State" />
                </div>
                <div className="space-y-2">
                  <label className="tactile-label ml-2">Zone</label>
                  <input required name="district" value={formData.district} onChange={handleInputChange} className="w-full h-12 bg-black/[0.02] px-3 rounded-xl text-xs outline-none" placeholder="District" />
                </div>
                <div className="space-y-2">
                  <label className="tactile-label ml-2">Precision</label>
                  <div className="relative">
                    <input required name="area" value={formData.area} onChange={handleInputChange} className="w-full h-12 bg-black/[0.02] pl-3 pr-8 rounded-xl text-xs outline-none" placeholder="Area" />
                    <button type="button" onClick={detectLocation} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#007AFF] transition-colors">
                      <Navigation size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {error && <p className="text-[#FF3B30] text-[10px] font-bold uppercase tracking-widest p-4 bg-red-50 rounded-2xl">{error}</p>}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 h-14 !text-[10px] bg-slate-100 border-none text-slate-400">
                  BACK
                </button>
                <button disabled={loading} type="submit" className="btn-primary flex-[2] h-14 !text-[10px]">
                  {loading ? 'INITIALIZING...' : 'AUTHORIZE UNIT'}
                </button>
              </div>
            </motion.form>
          )}

          {/* Step 3: OTP */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm mx-auto space-y-10">
              <div className="w-20 h-20 bg-[#007AFF]/5 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck className="w-8 h-8 text-[#007AFF]" />
              </div>
              <div className="space-y-2">
                 <h2 className="text-3xl font-bold tracking-tight uppercase leading-none">SIGNAL CHECK</h2>
                 <p className="tactile-label !tracking-normal text-slate-400">Sent to {formData.email}</p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-8">
                <input 
                  required 
                  name="otp" 
                  value={formData.otp} 
                  onChange={handleInputChange} 
                  className="w-full text-center text-5xl font-bold tracking-[0.3em] py-8 bg-black/[0.02] border-none rounded-3xl outline-none text-[#007AFF]" 
                  placeholder="000000" 
                  maxLength={6} 
                />

                {error && <p className="text-[#FF3B30] text-[10px] font-bold tracking-widest p-4 bg-red-50 rounded-2xl">{error}</p>}

                <button disabled={loading} type="submit" className="btn-primary w-full h-14 text-[10px]">
                  {loading ? 'VALIDATING...' : 'FINALIZE UPLINK'}
                </button>

                <div className="flex flex-col gap-4 text-center">
                  <button type="button" onClick={handleResendOtp} disabled={loading} className="tactile-label !text-[#007AFF] font-bold hover:underline">
                    RESEND SIGNAL KEY
                  </button>
                  <Link href="/login" className="tactile-label !text-slate-300 hover:text-slate-600 transition-colors">Return to Identity Login</Link>
                </div>
              </form>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
