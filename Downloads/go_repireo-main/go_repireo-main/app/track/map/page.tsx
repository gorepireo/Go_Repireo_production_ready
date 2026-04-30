'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Target, Navigation, Info, ShieldCheck, Zap, Activity, Satellite, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { insforge } from '@/lib/insforge';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

// Dynamic import for Leaflet to prevent SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Leaflet styles
import 'leaflet/dist/leaflet.css';

function StandardMapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('id');
  
  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState('m'); // m: roadmap, s: satellite, y: hybrid
  const [L, setL] = useState<any>(null);

  // Initialize Leaflet Icons only on client
  useEffect(() => {
    import('leaflet').then(leaflet => {
      setL(leaflet);
    });
  }, []);

  const fetchTracking = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      const { data: orderData } = await insforge.database
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (orderData) {
        setOrder(orderData);
        
        const { data: trackData } = await insforge.database
          .from('order_tracking')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (trackData) {
          setTracking(trackData);
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
    const interval = setInterval(fetchTracking, 10000); 
    return () => clearInterval(interval);
  }, [fetchTracking]);

  const center: [number, number] = tracking 
    ? [Number(tracking.lat), Number(tracking.lng)] 
    : order 
      ? [Number(order.lat), Number(order.lng)]
      : [28.6139, 77.2090]; // Default to Delhi coordinates if no data

  const partnerIcon = L ? L.divIcon({
    className: 'custom-partner-icon',
    html: `<div class="relative w-10 h-10 flex items-center justify-center">
             <div class="absolute inset-0 bg-[#007AFF]/20 rounded-full animate-ping"></div>
             <div class="w-6 h-6 bg-[#007AFF] rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                <div class="w-2 h-2 bg-white rounded-full"></div>
             </div>
             <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black px-2 py-1 rounded-md whitespace-nowrap shadow-xl">LIVE PARTNER</div>
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  }) : null;

  const targetIcon = L ? L.divIcon({
    className: 'custom-target-icon',
    html: `<div class="relative w-12 h-12 flex items-center justify-center">
             <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-2xl border-2 border-red-500">
                <div class="w-4 h-4 bg-red-500 rounded-sm rotate-45"></div>
             </div>
             <div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] font-black px-2 py-1 rounded-md whitespace-nowrap shadow-xl">DESTINATION</div>
           </div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  }) : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 relative overflow-hidden font-sans">
      <Navbar />
      
      {/* Map Layer - Professional Google Tiles */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        {!loading && L && (
          <MapContainer 
            center={center} 
            zoom={14} 
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%', background: '#e5e7eb' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; Google Maps'
              url={`http://{s}.google.com/vt/lyrs=${mapType}&x={x}&y={y}&z={z}`}
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />

            {tracking && partnerIcon && (
              <Marker position={[Number(tracking.lat), Number(tracking.lng)]} icon={partnerIcon}>
                <Popup className="standard-popup">Logistical Node Location</Popup>
              </Marker>
            )}

            {order && targetIcon && (
              <Marker position={[Number(order.lat), Number(order.lng)]} icon={targetIcon}>
                <Popup className="standard-popup">Client Asset Destination</Popup>
              </Marker>
            )}

            {tracking && order && (
               <Polyline
                  positions={[
                     [Number(tracking.lat), Number(tracking.lng)],
                     [Number(order.lat), Number(order.lng)]
                  ]}
                  pathOptions={{
                     color: "#007AFF",
                     weight: 4,
                     opacity: 0.6,
                     dashArray: '1, 10',
                     lineCap: 'round'
                  }}
               />
            )}
          </MapContainer>
        )}
      </div>

      <style jsx global>{`
        .leaflet-container {
          background: #e5e7eb !important;
        }
        .standard-popup .leaflet-popup-content-wrapper {
          background: white !important;
          border: none;
          color: #1E293B;
          border-radius: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.1em;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          padding: 4px;
        }
        .standard-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>

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
      <div className="absolute inset-0 z-50 pointer-events-none p-12 mt-32">
        
        {/* Top Left: Back Action */}
        <div className="absolute top-0 left-10 pointer-events-auto">
          <button 
            onClick={() => router.back()}
            className="w-16 h-16 bg-white/80 backdrop-blur-3xl rounded-full flex items-center justify-center shadow-2xl hover:bg-white transition-all active:scale-90"
          >
            <ArrowLeft className="w-6 h-6 text-[#1E293B]" />
          </button>
        </div>

        {/* Top Right: Signal Status */}
        <div className="absolute top-0 right-12 text-right">
           <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-300 mb-2">SIGNAL STATUS</p>
           <div className="flex items-center justify-end gap-4">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic transform -skew-x-12 leading-none text-[#1E293B]">
                PHASE: {loading ? 'INIT' : (order?.status === 'shipping' ? 'TRANSIT' : 'PROVISIONING')}
              </h2>
              <div className={`w-4 h-4 rounded-full shadow-lg ${loading ? 'bg-yellow-500 shadow-yellow-500/20 animate-pulse' : 'bg-[#007AFF] shadow-[#007AFF]/20'}`} />
           </div>
        </div>

        {/* Center Right: Proximity */}
        <div className="absolute top-1/2 right-12 -translate-y-1/2 text-right">
           <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-300 mb-2">PROXIMITY</p>
           <div className="flex items-baseline justify-end gap-1">
              <span className="text-5xl md:text-7xl font-black italic transform -skew-x-12 leading-none text-[#1E293B]">
                {tracking && order ? (Math.sqrt(Math.pow(tracking.lat - order.lat, 2) + Math.pow(tracking.lng - order.lng, 2)) * 111).toFixed(1) : "4.2"}
              </span>
              <span className="text-lg font-black italic text-slate-300 uppercase tracking-widest">KM</span>
           </div>
        </div>

        {/* Center Info HUD */}
        {loading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
             <div className="flex items-center justify-center gap-4 mb-4">
                <Satellite size={32} className="text-[#007AFF] animate-bounce" />
             </div>
             <p className="text-xs font-black uppercase tracking-[0.8em] text-[#007AFF] animate-pulse">Syncing Orbital Channel [v2]...</p>
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
