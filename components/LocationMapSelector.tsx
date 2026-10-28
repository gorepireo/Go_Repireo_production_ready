'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Loader2, Crosshair, Copy, ArrowRight, Compass, Search, Home as HomeIcon, Briefcase, Bookmark } from 'lucide-react';
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
  onClose,
}: LocationMapSelectorProps) {
  const [mounted, setMounted] = useState(false);
  const [center, setCenter] = useState({ lat: initialLat, lng: initialLng });
  const [address, setAddress] = useState('Detecting location...');
  const [cityTag, setCityTag] = useState('Kolkata');
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Search Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof document !== 'undefined') {
      const linkId = 'leaflet-css';
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
    }

    // Fetch user's saved addresses for quick 1-click selection
    fetch('/api/addresses', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { addresses: [] }))
      .then((data) => {
        if (Array.isArray(data.addresses) && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
        }
      })
      .catch(() => {});
  }, []);

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
            leafletMapRef.current.invalidateSize();
          }
          setIsLocating(false);
        },
        (err) => {
          console.warn('GPS detection error:', err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  // 2. Initialize Leaflet Map dynamically
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    let isSubscribed = true;

    const timer = setTimeout(() => {
      if (!isSubscribed || !mapContainerRef.current || leafletMapRef.current) return;

      import('leaflet').then((L) => {
        if (!isSubscribed || !mapContainerRef.current || leafletMapRef.current) return;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });

        const map = L.map(mapContainerRef.current, {
          center: [center.lat, center.lng],
          zoom: 16,
          zoomControl: false,
        });

        // Google Maps Clean Standard Tiles (No watermark, crisp street view)
        L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps',
        }).addTo(map);

        map.on('move', () => {
          const newCenter = map.getCenter();
          setCenter({ lat: newCenter.lat, lng: newCenter.lng });
        });

        leafletMapRef.current = map;

        // Force Leaflet to re-calculate container dimensions and paint tiles
        requestAnimationFrame(() => {
          if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
        });
        setTimeout(() => {
          if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
        }, 150);
        setTimeout(() => {
          if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
        }, 400);
      });
    }, 60);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [mounted]);

  // 3. Reverse Geocode address when map center changes (Debounced)
  useEffect(() => {
    const fetchAddress = async () => {
      setIsFetchingAddress(true);
      try {
        if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${center.lat},${center.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          );
          const data = await res.json();
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const formatted = data.results[0].formatted_address;
            setAddress(formatted);
            const localityComponent = data.results[0].address_components?.find((c: any) =>
              c.types.includes('locality') || c.types.includes('sublocality')
            );
            if (localityComponent) {
              setCityTag(localityComponent.long_name);
            }
            return;
          }
        }

        // OpenStreetMap Nominatim Geocoding
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${center.lat}&lon=${center.lng}&format=json&email=info@repireo.com`
        );
        const data = await res.json();
        if (data && data.display_name) {
          setAddress(data.display_name);
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.suburb ||
            data.address?.neighbourhood ||
            data.address?.state_district ||
            'Selected Location';
          setCityTag(city);
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
            leafletMapRef.current.invalidateSize();
          }
          setIsLocating(false);
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const handleCopy = () => {
    if (address && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSearchInput = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(query.trim())}&lat=${center.lat}&lng=${center.lng}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.warn('Place search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);
  };

  const handleSelectSearchResult = (item: { lat: number; lng: number; title: string; subtitle: string }) => {
    setSearchQuery(item.title);
    setSearchResults([]);
    setCenter({ lat: item.lat, lng: item.lng });
    setCityTag(item.title);
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([item.lat, item.lng], 16);
      leafletMapRef.current.invalidateSize();
    }
  };

  if (!mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Include Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 340 }}
        className="bg-white rounded-t-[2.2rem] sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col h-[88dvh] max-h-[88dvh] sm:h-[680px] relative z-[99999]"
      >
        {/* Top Handle Bar */}
        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Top Header */}
        <div className="px-5 py-2.5 flex items-center justify-between bg-white z-10 shrink-0 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EBF3FF] flex items-center justify-center text-[#007AFF] shrink-0">
              <MapPin size={20} className="text-[#007AFF]" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#0B1736] tracking-tight">
                Pin Your Location
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Search or move pin to choose exact address
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500 transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar Input */}
        <div className="px-4 pt-2.5 pb-1.5 relative z-50 shrink-0">
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search area, landmark, street, city..."
              className="w-full bg-[#F8FAFC] hover:bg-[#F1F5F9] focus:bg-white border border-slate-200/90 rounded-2xl pl-10 pr-9 py-2.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#007AFF] focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
            />
            {isSearching ? (
              <Loader2 size={14} className="absolute right-3.5 text-[#007AFF] animate-spin" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute left-4 right-4 top-[50px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-[999] max-h-64 overflow-y-auto divide-y divide-slate-100"
              >
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50/70 active:bg-blue-100/60 flex items-start gap-3 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#007AFF] group-hover:text-white transition-colors">
                      <MapPin size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Saved Addresses Quick Selection Pills */}
        {savedAddresses.length > 0 && (
          <div className="px-4 pt-0.5 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 z-20">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Saved:</span>
            {savedAddresses.map((addr) => {
              const labelLower = (addr.label || addr.name || '').toLowerCase();
              const isHome = labelLower.includes('home');
              const isWork = labelLower.includes('work') || labelLower.includes('office');
              const Icon = isHome ? HomeIcon : isWork ? Briefcase : Bookmark;
              return (
                <button
                  key={addr.id}
                  type="button"
                  onClick={() => {
                    const lat = Number(addr.latitude || addr.lat || 0);
                    const lng = Number(addr.longitude || addr.lng || 0);
                    const formatted = addr.formatted_address || addr.address_text || addr.label;
                    if (lat && lng) {
                      onConfirm({ lat, lng, address: formatted });
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-blue-50 border border-slate-200/90 rounded-full text-xs font-semibold text-slate-700 hover:text-[#007AFF] shrink-0 shadow-2xs transition-all active:scale-95"
                  title={addr.formatted_address || addr.address_text}
                >
                  <Icon size={12} className="text-[#007AFF]" />
                  <span>{addr.label || addr.name || 'Saved'}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Rounded Framed Map Area */}
        <div className="px-4 pt-2.5 pb-2 flex-1 min-h-[160px] relative z-10 isolate">
          <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200/90 relative shadow-xs bg-slate-100">
            <div
              ref={mapContainerRef}
              className="w-full h-full z-0"
              style={{ width: '100%', height: '100%', minHeight: '160px' }}
            />

            {/* FIXED CENTER PIN WITH FLOATING CITY LABEL */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[400]">
              <div className="relative -translate-y-1/2 flex flex-col items-center">
                
                {/* Floating City/Locality Tooltip Tag */}
                <div className="absolute -top-11 z-[420] bg-white px-3.5 py-1 rounded-xl shadow-md border border-slate-200/80 flex flex-col items-center select-none whitespace-nowrap min-w-[70px]">
                  <span className="text-xs font-black text-slate-800 leading-tight">
                    {cityTag || 'Selected Area'}
                  </span>
                  <div className="w-2 h-2 bg-white rotate-45 border-r border-b border-slate-200/80 -mb-1 mt-0.5" />
                </div>

                {/* Classic Red Pin Marker with Blue Center Dot */}
                <svg width="38" height="46" viewBox="0 0 38 46" fill="none" className="drop-shadow-md">
                  <path
                    d="M19 0C8.50659 0 0 8.50659 0 19C0 31.5 19 46 19 46C19 46 38 31.5 38 19C38 8.50659 29.4934 0 19 0Z"
                    fill="#EA4335"
                  />
                  <circle cx="19" cy="18" r="6" fill="#007AFF" />
                  <circle cx="19" cy="18" r="2.5" fill="white" />
                </svg>

                {/* Blue Accuracy Ring beneath pin tip */}
                <div className="w-8 h-3 rounded-full bg-[#007AFF]/25 border border-[#007AFF]/40 -mt-1" />
              </div>
            </div>

            {/* Recenter GPS Floating Button */}
            <button
              onClick={handleRecenterGPS}
              className="absolute bottom-3 right-3 z-[450] bg-white text-[#007AFF] w-11 h-11 rounded-full shadow-lg border border-slate-200/90 flex items-center justify-center hover:bg-blue-50 active:scale-95 transition-all"
              title="Recenter to my location"
            >
              {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Crosshair size={20} />}
            </button>
          </div>
        </div>

        {/* Bottom Section (Address Box + CTA + Helper) */}
        <div className="shrink-0 flex flex-col gap-2.5 px-4 pt-2 pb-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-white z-10 border-t border-slate-100">
          
          {/* Dynamic Full Address Display Box */}
          <div className="bg-[#F8FAFC] p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 flex items-start gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-full bg-[#EBF3FF] text-[#007AFF] flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={18} className="text-[#007AFF]" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                FULL DETECTED <span className="text-[#007AFF]">ADDRESS</span>
              </span>
              <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug line-clamp-2">
                {isFetchingAddress ? (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Loader2 size={12} className="animate-spin" /> Resolving address...
                  </span>
                ) : (
                  address
                )}
              </p>
            </div>

            <button
              onClick={handleCopy}
              type="button"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shrink-0 shadow-2xs transition-all active:scale-95"
              title="Copy address"
            >
              <Copy size={13} className="text-slate-500" />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Primary Set Location Button */}
          <button
            onClick={() => {
              onConfirm({ lat: center.lat, lng: center.lng, address });
              onClose();
            }}
            className="w-full py-3.5 sm:py-4 bg-[#007AFF] hover:bg-[#0066D6] active:scale-[0.98] text-white rounded-full font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md shadow-blue-500/25 transition-all"
          >
            <MapPin size={19} className="text-white shrink-0" strokeWidth={2.5} />
            <span>Set This Location</span>
            <ArrowRight size={18} className="text-white/80 shrink-0" />
          </button>

          {/* Helper Hint Pill */}
          <div className="w-full bg-[#F1F5F9]/80 rounded-full py-1.5 px-4 flex items-center justify-center gap-2 text-center text-[11px] text-slate-400 font-medium select-none">
            <Compass size={13} className="text-slate-400 shrink-0" />
            <span>Move the map to adjust the pin for more accurate location.</span>
          </div>
        </div>

      </motion.div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}
