'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, Check, Loader2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationMapSelectorProps {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (location: { lat: number; lng: number; address: string }) => void;
  onClose: () => void;
}

export default function LocationMapSelector({
  initialLat = 22.5726,
  initialLng = 88.3639,
  onConfirm,
  onClose
}: LocationMapSelectorProps) {
  const [center, setCenter] = useState({ lat: initialLat, lng: initialLng });
  const [address, setAddress] = useState('Detecting location...');
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  // 1. Detect user's current GPS location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCenter({ lat, lng });
          if (leafletMapRef.current) {
            leafletMapRef.current.setView([lat, lng], 16);
          }
          setIsLocating(false);
        },
        (err) => {
          console.warn("GPS detection error:", err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // 2. Initialize Leaflet Map dynamically
  useEffect(() => {
    let isMounted = true;
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Fix Leaflet marker icons if needed
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });

      if (!leafletMapRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [center.lat, center.lng],
          zoom: 16,
          zoomControl: false
        });

        // Google Maps Tile Layer (Always Updated Official Google Maps Tiles)
        L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps'
        }).addTo(map);

        // Update center whenever user drags/moves map underneath fixed pin
        map.on('move', () => {
          const newCenter = map.getCenter();
          setCenter({ lat: newCenter.lat, lng: newCenter.lng });
        });

        leafletMapRef.current = map;
      }
    });

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // 3. Reverse Geocode address when center changes (Debounced)
  useEffect(() => {
    const fetchAddress = async () => {
      setIsFetchingAddress(true);
      try {
        if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${center.lat},${center.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
          const data = await res.json();
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            setAddress(data.results[0].formatted_address);
            return;
          }
        }
        // Fallback OpenStreetMap Nominatim Geocoding
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${center.lat}&lon=${center.lng}&format=json&email=info@repireo.com`);
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        } else {
          setAddress(`${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`);
        }
      } catch (err) {
        setAddress(`${center.lat.toFixed(5)}, ${center.lng.toFixed(5)}`);
      } finally {
        setIsFetchingAddress(false);
      }
    };

    const timer = setTimeout(fetchAddress, 400);
    return () => clearTimeout(timer);
  }, [center.lat, center.lng]);

  const handleRecenterGPS = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCenter({ lat, lng });
          if (leafletMapRef.current) {
            leafletMapRef.current.setView([lat, lng], 16);
          }
          setIsLocating(false);
        },
        () => setIsLocating(false)
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Include Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-t-[2.5rem] sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col h-[75vh] sm:h-[620px] relative"
      >
        {/* Top Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Pin Your Location</h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Drag map under pin to choose exact address</p>
          </div>
          <button 
            onClick={onClose}
            className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Interactive Map Area (Occupies ~55% of the Drawer) */}
        <div className="relative flex-1 bg-slate-100 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* FIXED PIN AT EXACT CENTER (STATIC CLASSIC TEARDROP PIN, NO ANIMATION) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[400]">
            <div className="relative -translate-y-1/2 flex flex-col items-center">
              {/* Classic Google Maps Teardrop Pin Marker */}
              <svg width="40" height="48" viewBox="0 0 38 46" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                <path 
                  d="M19 0C8.50659 0 0 8.50659 0 19C0 31.5 19 46 19 46C19 46 38 31.5 38 19C38 8.50659 29.4934 0 19 0Z" 
                  fill="#EA4335" 
                />
                <circle cx="19" cy="18" r="7" fill="#8E1004" opacity="0.35" />
                <circle cx="19" cy="17" r="6.5" fill="white" />
              </svg>
              {/* Static Shadow Point */}
              <div className="w-2.5 h-1 bg-black/30 rounded-full blur-[0.8px] -mt-1" />
            </div>
          </div>

          {/* Recenter GPS Floating Button */}
          <button
            onClick={handleRecenterGPS}
            className="absolute bottom-4 right-4 z-[450] bg-white text-[#007AFF] w-11 h-11 rounded-full shadow-lg border border-slate-100 flex items-center justify-center hover:bg-blue-50 active:scale-95 transition-all"
            title="My GPS Location"
          >
            {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
          </button>
        </div>

        {/* Bottom Address Box & Confirm Action */}
        <div className="p-5 bg-white border-t border-slate-100 z-10 space-y-4 shadow-lg">
          
          {/* Dynamic Full Address Display Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
            <div className="w-9 h-9 bg-blue-100 text-[#007AFF] rounded-xl flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">
                FULL DETECTED ADDRESS
              </span>
              <p className="text-xs font-bold text-slate-900 leading-relaxed line-clamp-3">
                {isFetchingAddress ? (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Loader2 size={12} className="animate-spin" /> Resolving address...
                  </span>
                ) : (
                  address
                )}
              </p>
            </div>
          </div>

          {/* Confirm Button */}
          <button 
            onClick={() => {
              onConfirm({ lat: center.lat, lng: center.lng, address });
              onClose();
            }}
            className="w-full h-14 bg-[#007AFF] hover:bg-blue-600 active:scale-[0.98] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(0,122,255,0.3)] transition-all"
          >
            <Check size={18} strokeWidth={3} />
            <span>CONFIRM LOCATION & USE ADDRESS</span>
          </button>

        </div>
      </motion.div>
    </div>
  );
}
