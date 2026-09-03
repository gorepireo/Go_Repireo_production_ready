'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Target, Navigation, Info, ShieldCheck, Zap, Activity, Satellite, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import BottomNav from '@/components/BottomNav';

import { GoogleMap, useJsApiLoader, OverlayView, Polyline } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

function StandardMapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id');
  
  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState('m'); // m: roadmap, s: satellite, y: hybrid
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const fetchTracking = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      const { data: orderData } = await db.database
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (orderData) {
        setOrder(orderData);
        
        let finalTrackData = null;
        
        // 1. Try to get the real-time live location first
        const { data: liveData } = await db.database
          .from('order_live_location')
          .select('*')
          .eq('order_id', orderId)
          .maybeSingle();

        if (liveData) {
          finalTrackData = liveData;
        } else {
          // 2. Fallback to the historical order tracking log
          const { data: trackData } = await db.database
            .from('order_tracking')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          if (trackData) {
            finalTrackData = trackData;
          }
        }
        
        if (finalTrackData) {
          setTracking(finalTrackData);
        }
      }
    } catch (err) {
      console.error('Fetch tracking error:', err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 5000); 
    return () => clearInterval(interval);
  }, [fetchTracking]);

  const centerLat = tracking ? Number(tracking.lat) : (order ? Number(order.lat) : 28.6139);
  const centerLng = tracking ? Number(tracking.lng) : (order ? Number(order.lng) : 77.2090);

  const mapOptionsType = mapType === 'm' ? 'roadmap' : (mapType === 's' ? 'satellite' : 'hybrid');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 relative overflow-hidden font-sans">
      
      {/* Map Layer - Professional Google Tiles */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        {!loading && isLoaded && (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={{ lat: centerLat, lng: centerLng }}
            zoom={14}
            options={{ 
              disableDefaultUI: true, 
              zoomControl: false,
              mapTypeId: mapOptionsType
            }}
          >
            {tracking && (
              <OverlayView
                position={{ lat: Number(tracking.lat), lng: Number(tracking.lng) }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height / 2) })}
              >
                <div className="relative flex flex-col items-center">
                  <div className="absolute inset-0 bg-[#007AFF]/30 rounded-full animate-ping"></div>
                  <div className="w-11 h-11 bg-[#007AFF] rounded-full border-2 border-white shadow-2xl overflow-hidden flex items-center justify-center relative z-10">
                    {order?.worker_avatar && !order.worker_avatar.includes('hero_technician') ? (
                      <img src={order.worker_avatar} alt={order.worker_name || 'Worker'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#007AFF] text-white font-black text-sm flex items-center justify-center">
                        {(order?.worker_name || tracking?.worker_name || 'E').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="bg-[#007AFF] text-white text-[9px] font-black px-2.5 py-1 rounded-xl shadow-lg mt-1 whitespace-nowrap flex items-center gap-1.5 z-10">
                    <span>{order?.worker_name || tracking?.worker_name || 'Expert Partner'}</span>
                  </div>
                </div>
              </OverlayView>
            )}

            {order && (
              <OverlayView
                position={{ lat: Number(order.lat), lng: Number(order.lng) }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height / 2) })}
              >
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl border-2 border-red-500">
                    <div className="w-4 h-4 bg-red-500 rounded-sm rotate-45"></div>
                  </div>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-md whitespace-nowrap shadow-xl">DESTINATION</div>
                </div>
              </OverlayView>
            )}

            {tracking && order && (
               <Polyline
                  path={[
                     { lat: Number(tracking.lat), lng: Number(tracking.lng) },
                     { lat: Number(order.lat), lng: Number(order.lng) }
                  ]}
                  options={{
                     strokeColor: "#007AFF",
                     strokeWeight: 4,
                     strokeOpacity: 0.6
                  }}
               />
            )}
          </GoogleMap>
        )}
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-32 right-8 z-50 flex flex-col gap-2 pointer-events-auto">
         <button 
           onClick={() => setMapType('m')}
           className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${mapType === 'm' ? 'bg-[#007AFF] text-white' : 'bg-white text-slate-400'}`}
         >
           <Navigation size={20} />
         </button>
         <button 
           onClick={() => setMapType('s')}
           className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${mapType === 's' ? 'bg-[#007AFF] text-white' : 'bg-white text-slate-400'}`}
         >
           <Satellite size={20} />
         </button>
         <button 
           onClick={() => setMapType('y')}
           className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${mapType === 'y' ? 'bg-[#007AFF] text-white' : 'bg-white text-slate-400'}`}
         >
           <Globe size={20} />
         </button>
      </div>

      {/* HUD Overlays - Adapted for Standard Light Mode */}
      <div className="absolute inset-0 z-50 pointer-events-none p-6 md:p-12 mt-20 md:mt-32">
        
        {/* Top Left: Back Action */}
        <div className="absolute top-6 left-6 md:top-10 md:left-10 pointer-events-auto">
          <button 
            onClick={() => router.back()}
            className="w-12 h-12 md:w-16 md:h-16 bg-white/80 backdrop-blur-3xl rounded-full flex items-center justify-center shadow-2xl hover:bg-white transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-[#1E293B]" />
          </button>
        </div>

        {/* Top Right: Signal Status */}
        <div className="absolute top-6 right-6 md:top-10 md:right-12 text-right">
           <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-slate-500 mb-1 md:mb-2 drop-shadow-md">ORDER STATUS</p>
           <div className="flex items-center justify-end gap-2 md:gap-4">
              <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter italic transform -skew-x-12 leading-none text-[#1E293B] drop-shadow-lg">
                PHASE: {loading ? 'INIT' : (order?.status === 'shipping' ? 'TRANSIT' : 'PREPPING')}
              </h2>
              <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full shadow-lg ${loading ? 'bg-yellow-500 shadow-yellow-500/20 animate-pulse' : 'bg-[#007AFF] shadow-[#007AFF]/20'}`} />
           </div>
        </div>

        {/* Center Right: Proximity */}
        <div className="absolute top-1/2 right-6 md:right-12 -translate-y-1/2 text-right mt-10 md:mt-0">
           <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-slate-500 mb-1 md:mb-2 drop-shadow-md">DISTANCE</p>
           <div className="flex items-baseline justify-end gap-1">
              <span className="text-4xl md:text-7xl font-black italic transform -skew-x-12 leading-none text-[#1E293B] drop-shadow-lg">
                {tracking && order ? (Math.sqrt(Math.pow(tracking.lat - order.lat, 2) + Math.pow(tracking.lng - order.lng, 2)) * 111).toFixed(1) : "4.2"}
              </span>
              <span className="text-sm md:text-lg font-black italic text-slate-500 uppercase tracking-widest drop-shadow-md">KM</span>
           </div>
        </div>

        {/* Center Info HUD */}
        {loading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center bg-white/80 p-6 rounded-2xl shadow-2xl backdrop-blur-md">
             <div className="flex items-center justify-center gap-4 mb-4">
                <Satellite size={24} className="text-[#007AFF] animate-bounce md:w-8 md:h-8" />
             </div>
             <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] md:tracking-[0.8em] text-[#007AFF] animate-pulse">Syncing Tracking...</p>
          </div>
        )}

        {/* Bottom Overlay: Customer Security OTP Card */}
        {order && (
          <div className="absolute bottom-24 left-4 right-4 md:left-12 md:right-12 z-50 pointer-events-auto max-w-lg mx-auto">
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-slate-100 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#007AFF]" />
                  <span className="text-xs font-black uppercase tracking-tight text-slate-900">SERVICE VERIFICATION CODES</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${order.payment_method === 'cash' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {order.payment_method === 'cash' ? '💵 Pay After Work' : '💳 Prepaid Online'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-amber-50/70 p-2.5 rounded-2xl border border-amber-100 text-center">
                  <p className="text-[8px] font-extrabold text-amber-800 uppercase tracking-wider">START OTP</p>
                  <p className="text-xl font-black text-amber-900 tracking-[0.2em] mt-0.5">
                    {order.details?.start_otp || '4812'}
                  </p>
                  <p className="text-[7px] text-amber-700 mt-0.5">Share with technician upon arrival</p>
                </div>

                {order.payment_method !== 'cash' ? (
                  <div className="bg-emerald-50/70 p-2.5 rounded-2xl border border-emerald-100 text-center">
                    <p className="text-[8px] font-extrabold text-emerald-800 uppercase tracking-wider">COMPLETION OTP</p>
                    <p className="text-xl font-black text-emerald-900 tracking-[0.2em] mt-0.5">
                      {order.details?.completion_otp || '7924'}
                    </p>
                    <p className="text-[7px] text-emerald-700 mt-0.5">Share ONLY after work is verified</p>
                  </div>
                ) : (
                  <div className="bg-blue-50/70 p-2.5 rounded-2xl border border-blue-100 text-center flex flex-col justify-center">
                    <p className="text-[8px] font-extrabold text-[#007AFF] uppercase tracking-wider">PAYMENT DUE</p>
                    <p className="text-sm font-black text-blue-900 mt-0.5">₹{order.total_price || 499}</p>
                    <p className="text-[7px] text-slate-500 mt-0.5">Pay via Cash / QR Code when done</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Global Bottom Navigation Interface */}
      <BottomNav />
      
      {/* Soft Vignette for Map Clarity */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#F8F9FA]/40 via-transparent to-[#F8F9FA]/40 opacity-50 z-20" />
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <Activity className="w-12 h-12 text-[#007AFF] animate-spin opacity-20" />
      </div>
    }>
      <StandardMapContent />
    </Suspense>
  );
}
