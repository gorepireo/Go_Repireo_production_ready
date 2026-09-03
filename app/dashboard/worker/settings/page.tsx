'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { Save, Camera, Loader2, User, Phone, Mail, CreditCard, LogOut, Pencil, Lock, Landmark, Banknote } from 'lucide-react';
import Avatar from '@/components/Avatar';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';

export default function WorkerSettings() {
  const { user, profile, refresh, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bank_details: '',
    upi_id: ''
  });

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.display_name || '',
        phone: profile.phone || '',
        bank_details: (profile as any).bank_details || '',
        upi_id: (profile as any).upi_id || ''
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    await db.database
      .from('users')
      .update({
        name: formData.name,
        display_name: formData.name,
        phone: formData.phone,
        bank_details: formData.bank_details,
        upi_id: formData.upi_id
      })
      .eq('id', user.id);
      
    await refresh();
    setLoading(false);
    alert('Profile updated successfully!');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setIsCropping(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropDone = async () => {
    if (!cropImageSrc || !croppedAreaPixels || !user) return;
    setLoading(true);
    setIsCropping(false);
    
    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Failed to crop image");
      
      const fileExt = 'jpeg';
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { data, error } = await db.storage
        .from('avatars')
        .upload(fileName, croppedBlob);

      if (data) {
        const publicUrl = db.storage.from('avatars').getPublicUrl(fileName);
        if (publicUrl) {
          await db.database
            .from('users')
            .update({ avatar_url: publicUrl as string })
            .eq('id', user.id);
          await refresh();
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to crop and upload image.");
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-32">
        <div className="h-48 bg-slate-900 w-full animate-pulse"></div>
        <div className="max-w-xl mx-auto px-6 -mt-16 relative z-10 space-y-6">
          <div className="w-32 h-32 bg-white rounded-full mx-auto border-4 border-white shadow-xl animate-pulse"></div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      {/* Cropper Modal */}
      {isCropping && cropImageSrc && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6">
          <h2 className="text-white text-lg font-black uppercase tracking-widest mb-6">Crop Avatar</h2>
          <div className="relative w-full max-w-md h-[50vh] bg-black rounded-[2rem] overflow-hidden mb-8 border-2 border-white/10 shadow-2xl">
            <Cropper
              image={cropImageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="flex gap-4 w-full max-w-md">
            <button onClick={() => setIsCropping(false)} className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-black uppercase tracking-widest text-xs transition-all">Cancel</button>
            <button onClick={handleCropDone} className="flex-1 py-4 bg-[#007AFF] hover:bg-blue-600 text-white rounded-full font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Done
            </button>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto px-4 pt-6 space-y-6">
        
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* Profile & Identity Section */}
          <div>
            <div className="flex items-center gap-2 mb-4 pl-2">
              <User className="text-[#007AFF] w-4 h-4" />
              <h2 className="text-[#007AFF] text-[10px] font-black uppercase tracking-widest">Profile & Identity</h2>
            </div>
            
            <div className="flex flex-col items-center mb-8 relative">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar src={profile?.avatar_url} name={profile?.display_name || profile?.email || 'User'} size={100} className="shadow-lg border-4 border-white bg-[#EAB308]" />
                <div className="absolute bottom-0 right-0 bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-100">
                  <Camera className="w-4 h-4 text-[#007AFF]" />
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white w-8 h-8" />
                </div>
                {loading && <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center"><Loader2 className="animate-spin text-[#007AFF]" /></div>}
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-4 tracking-wide">Tap to change avatar</p>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                <div className="bg-[#F0F5FF] text-[#007AFF] p-3 rounded-xl shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Full Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="text-[13px] font-bold text-slate-900 outline-none bg-transparent w-full"
                  />
                </div>
                <div className="text-[#007AFF] pr-2">
                  <Pencil className="w-4 h-4" />
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                <div className="bg-[#F0F5FF] text-[#007AFF] p-3 rounded-xl shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phone Number</label>
                  <input 
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="text-[13px] font-bold text-slate-900 outline-none bg-transparent w-full"
                  />
                </div>
                <div className="text-[#007AFF] pr-2">
                  <Pencil className="w-4 h-4" />
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                <div className="bg-[#F0F5FF] text-[#007AFF] p-3 rounded-xl shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email (Read Only)</label>
                  <input 
                    readOnly
                    value={user.email}
                    className="text-[13px] font-bold text-slate-900 outline-none bg-transparent w-full"
                  />
                </div>
                <div className="text-slate-400 pr-2">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-4 pl-2">
              <CreditCard className="text-[#007AFF] w-4 h-4" />
              <h2 className="text-[#007AFF] text-[10px] font-black uppercase tracking-widest">Payment Details</h2>
            </div>

            <div className="space-y-4">
              {/* UPI ID */}
              <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                <div className="bg-[#F0F5FF] text-[#007AFF] p-3 rounded-xl shrink-0 flex items-center justify-center italic font-black text-xs">
                  UPI
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">UPI ID</label>
                  <input 
                    placeholder="e.g. yourname@upi"
                    value={formData.upi_id}
                    onChange={e => setFormData({...formData, upi_id: e.target.value})}
                    className="text-[13px] font-bold text-slate-900 outline-none bg-transparent w-full placeholder:text-slate-400 placeholder:font-medium"
                  />
                </div>
                <div className="text-[#007AFF] pr-2">
                  <Pencil className="w-4 h-4" />
                </div>
              </div>

              {/* Bank Details */}
              <div className="flex items-start gap-4 bg-white p-3 rounded-2xl border border-slate-50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                <div className="bg-[#F0F5FF] text-[#007AFF] p-3 rounded-xl shrink-0">
                  <Landmark className="w-5 h-5" />
                </div>
                <div className="flex-1 flex flex-col justify-center mt-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Bank Account Details</label>
                  <textarea 
                    rows={2}
                    placeholder="Account Number, IFSC Code, Bank Name"
                    value={formData.bank_details}
                    onChange={e => setFormData({...formData, bank_details: e.target.value})}
                    className="text-[13px] font-bold text-slate-900 outline-none bg-transparent w-full resize-none placeholder:text-slate-400 placeholder:font-medium"
                  />
                </div>
                <div className="text-[#007AFF] pr-2 mt-2">
                  <Pencil className="w-4 h-4" />
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full h-14 mt-4 bg-[#007AFF] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95 shadow-[0_4px_14px_-4px_rgba(0,122,255,0.4)]">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                Save Details
              </button>
            </div>
          </div>
        </form>

        {/* Logout Button */}
        <div className="pt-2">
          <button 
            onClick={() => signOut()} 
            className="w-full h-14 bg-[#FEF2F2] text-[#EF4444] rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 transition-all active:scale-95 border border-red-50"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
