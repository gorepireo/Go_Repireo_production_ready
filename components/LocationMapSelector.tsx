'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

// Component to handle map movement and get center coordinates
function MapEvents({ onMoveEnd }: { onMoveEnd: (center: { lat: number; lng: number }) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onMoveEnd({ lat: center.lat, lng: center.lng });
    },
  });
  return null;
}

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
  const [address, setAddress] = useState('Fetching location...');
  const [isFetching, setIsFetching] = useState(false);

  // Initialize center with current position if defaults are used and geolocation is available
  useEffect(() => {
    if (initialLat === 22.5726 && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => {}
      );
    }
  }, [initialLat]);

  // Fetch address whenever the center changes
  useEffect(() => {
    const fetchAddress = async () => {
      setIsFetching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${center.lat}&lon=${center.lng}&format=json&email=info@repireo.com`);
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
        } else {
          setAddress(`${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`);
        }
      } catch (err) {
        setAddress(`${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`);
      } finally {
        setIsFetching(false);
      }
    };

    const timeoutId = setTimeout(fetchAddress, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [center.lat, center.lng]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col h-[70vh] sm:h-[600px]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10 relative">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Select Location</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Move the map to set the precise location</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Map Area */}
        <div className="relative flex-1 bg-slate-100">
          <MapContainer 
            center={[center.lat, center.lng]} 
            zoom={16} 
            zoomControl={false}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents onMoveEnd={setCenter} />
          </MapContainer>

          {/* Fixed Center Pin */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[400] pb-8">
            <div className="relative flex flex-col items-center">
               {/* Location Icon with Drop Shadow */}
               <MapPin size={36} className="text-[#007AFF] fill-blue-50 drop-shadow-md relative z-10" strokeWidth={2} />
               {/* Pin shadow point */}
               <div className="w-2 h-1 bg-black/20 rounded-[100%] absolute bottom-[-1px] blur-[1px]"></div>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="p-5 bg-white border-t border-slate-100 z-10 relative space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={14} className="text-[#007AFF]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Selected Location</p>
              <p className="text-xs text-slate-900 font-medium line-clamp-2 leading-relaxed">
                {isFetching ? 'Locating...' : address}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={onClose}
               className="flex-1 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-widest transition-colors"
             >
               Cancel
             </button>
             <button 
               onClick={() => onConfirm({ lat: center.lat, lng: center.lng, address })}
               className="flex-[2] h-12 rounded-2xl bg-[#007AFF] hover:bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
             >
               Confirm Location
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
