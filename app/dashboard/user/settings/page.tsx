'use client';

import { useState, useEffect, useRef } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Save, Plus, MapPin, Trash2, Camera, Loader2, X, User, Phone, Mail, LogOut, Pencil, Lock } from 'lucide-react';
import Link from 'next/link';
import Avatar from '@/components/Avatar';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';

export default function UserSettings() {
  const { user, profile, refresh, signOut } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [newAddress, setNewAddress] = useState({ name: '', address_text: '', lat: 0, lng: 0 });
  const [isAddingAddress, setIsAddingAddress] = useState(false);

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
        phone: profile.phone || ''
      });
    }
    fetchAddresses();
  }, [profile]);

  const fetchAddresses = async () => {
    if (!user) return;
    const { data } = await insforge.database
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setAddresses(data);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    await insforge.database
      .from('users')
      .update({
        name: formData.name,
        display_name: formData.name,
        phone: formData.phone
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
      const { data, error } = await insforge.storage
        .from('avatars')
        .upload(fileName, croppedBlob);

      if (data) {
        const publicUrl = insforge.storage.from('avatars').getPublicUrl(fileName);
        if (publicUrl) {
          await insforge.database
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

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    await insforge.database.from('user_addresses').insert([{
      user_id: user.id,
      name: newAddress.name,
      address_text: newAddress.address_text,
      lat: newAddress.lat,
      lng: newAddress.lng
    }]);

    setNewAddress({ name: '', address_text: '', lat: 0, lng: 0 });
    setIsAddingAddress(false);
    await fetchAddresses();
    setLoading(false);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    setLoading(true);
    await insforge.database.from('user_addresses').delete().eq('id', id);
    await fetchAddresses();
    setLoading(false);
  };

  const detectLocationForNewAddress = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json`);
          const data = await res.json();
          setNewAddress({ 
            ...newAddress, 
            address_text: data.display_name || `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        } catch (err) {
           setNewAddress({ 
             ...newAddress, 
             address_text: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
             lat: position.coords.latitude,
             lng: position.coords.longitude
           });
        }
      });
    }
  };

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
        
        {/* Profile Information Section */}
        <div>
          <div className="flex items-center gap-2 mb-4 pl-2">
            <User className="text-[#007AFF] w-4 h-4" />
            <h2 className="text-[#007AFF] text-[10px] font-black uppercase tracking-widest">Profile Information</h2>
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

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            
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

            <button disabled={loading} type="submit" className="w-full h-14 mt-4 bg-[#007AFF] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all active:scale-95 shadow-[0_4px_14px_-4px_rgba(0,122,255,0.4)]">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
              Save Profile
            </button>
          </form>
        </div>

        {/* Saved Addresses */}
        <div className="pt-4">
          <div className="flex items-center gap-2 mb-4 pl-2">
            <MapPin className="text-[#007AFF] w-4 h-4" />
            <h2 className="text-[#007AFF] text-[10px] font-black uppercase tracking-widest flex-1">Saved Addresses</h2>
            <button onClick={() => setIsAddingAddress(!isAddingAddress)} className="text-[#007AFF] bg-blue-50 w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-100 transition-colors shrink-0">
              <Plus size={16} />
            </button>
          </div>

          {isAddingAddress && (
            <form onSubmit={handleAddAddress} className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100 space-y-4">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2 block mb-1">Location Name</label>
                <input 
                  required
                  placeholder="e.g. Home, Office, Mom's House"
                  value={newAddress.name}
                  onChange={e => setNewAddress({...newAddress, name: e.target.value})}
                  className="w-full h-12 bg-white rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-[#007AFF]/20 border border-slate-100"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2 block mb-1">Full Address</label>
                <div className="flex gap-2">
                  <input 
                    required
                    placeholder="Enter full address"
                    value={newAddress.address_text}
                    onChange={e => setNewAddress({...newAddress, address_text: e.target.value})}
                    className="flex-1 h-12 bg-white rounded-xl px-4 text-xs font-medium outline-none focus:ring-2 focus:ring-[#007AFF]/20 border border-slate-100"
                  />
                  <button type="button" onClick={detectLocationForNewAddress} className="w-12 h-12 bg-[#007AFF] text-white rounded-xl flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all shadow-md">
                    <MapPin size={16} />
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button disabled={loading} type="submit" className="flex-1 h-10 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">Save Address</button>
                <button type="button" onClick={() => setIsAddingAddress(false)} className="flex-1 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {addresses.length === 0 && !isAddingAddress ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-2xl bg-white">
                No saved addresses yet.
              </div>
            ) : (
              addresses.map(addr => (
                <div key={addr.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F0F5FF] text-[#007AFF] rounded-xl flex items-center justify-center shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-900">{addr.name}</h4>
                      <p className="text-[10px] font-medium text-slate-500 line-clamp-1 pr-4 mt-0.5">{addr.address_text}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteAddress(addr.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

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
