'use client';

import { useState, useEffect } from 'react';
import { MapPin, ChevronDown, Bell, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NotificationDrawer from '@/components/NotificationDrawer';
import NotificationToastBanner from '@/components/NotificationToastBanner';
import LocationMapSelector from '@/components/LocationMapSelector';

interface HeaderProps {
  showLocation?: boolean;
  showGreeting?: boolean;
  customTitle?: string;
  customSubtitle?: string;
}

export default function Header({
  showLocation = true,
  showGreeting = true,
  customTitle,
  customSubtitle
}: HeaderProps) {
  const { user, profile } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize location from localStorage cache or fallback to 'Detecting location...'
  const [currentLocation, setCurrentLocation] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('repireo_detected_location');
      if (cached && cached.trim().length > 0) return cached;
    }
    return 'Detecting location...';
  });

  const fetchLiveAddress = async (lat: number, lng: number) => {
    try {
      // Provider 1: BigDataCloud Reverse Geocode API (Instant 100ms, free, no rate limits)
      const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        const locality = bdcData.locality || bdcData.city || bdcData.localityInfo?.informative?.[0]?.name;
        const city = bdcData.city || bdcData.principalSubdivision;
        
        if (locality && city && locality !== city) {
          const locStr = `${locality}, ${city}`;
          setCurrentLocation(locStr);
          if (typeof window !== 'undefined') localStorage.setItem('repireo_detected_location', locStr);
          return;
        } else if (locality || city) {
          const locStr = `${locality || city}`;
          setCurrentLocation(locStr);
          if (typeof window !== 'undefined') localStorage.setItem('repireo_detected_location', locStr);
          return;
        }
      }

      // Provider 2: OpenStreetMap Nominatim Fallback
      const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`);
      if (nomRes.ok) {
        const data = await nomRes.json();
        const addr = data.address || {};
        const area = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.road || addr.village;
        const city = addr.city || addr.town || addr.county || addr.state_district;
        
        if (area && city) {
          const locStr = `${area}, ${city}`;
          setCurrentLocation(locStr);
          if (typeof window !== 'undefined') localStorage.setItem('repireo_detected_location', locStr);
        } else if (city) {
          const locStr = `${city}`;
          setCurrentLocation(locStr);
          if (typeof window !== 'undefined') localStorage.setItem('repireo_detected_location', locStr);
        }
      }
    } catch (err) {
      console.warn('Auto reverse-geocode error:', err);
    }
  };

  // Automatically detect live GPS location on page load for client & worker
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchLiveAddress(pos.coords.latitude, pos.coords.longitude).finally(() => setIsLocating(false));
        },
        (err) => {
          console.log('Mount GPS error or permission ungranted:', err.message);
          setIsLocating(false);
          // Only fallback to Etawah if no location was ever detected or cached
          if (typeof window !== 'undefined' && !localStorage.getItem('repireo_detected_location')) {
            setCurrentLocation('Etawah, UP');
          }
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
      );
    } else {
      if (typeof window !== 'undefined' && !localStorage.getItem('repireo_detected_location')) {
        setCurrentLocation('Etawah, UP');
      }
    }
  }, []);

  // Handle location button click
  const handleLocationClick = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await fetchLiveAddress(pos.coords.latitude, pos.coords.longitude);
          setIsLocating(false);
        },
        (err) => {
          console.warn('GPS permission not granted, opening map picker modal:', err);
          setIsLocating(false);
          setIsLocationModalOpen(true);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setIsLocationModalOpen(true);
    }
  };

  // Dynamic calculation of unread notification count
  useEffect(() => {
    const updateUnreadBadge = () => {
      if (typeof window !== 'undefined') {
        const activeRole = profile?.role || localStorage.getItem('repireo_cached_role') || 'user';
        const isWorker = activeRole === 'worker';
        const storageKey = isWorker ? 'repireo_notifications_worker' : 'repireo_notifications_customer';
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
          try {
            const list = JSON.parse(saved);
            if (Array.isArray(list)) {
              const unread = list.filter((n: any) => !n.read).length;
              setUnreadCount(unread);
            } else {
              setUnreadCount(0);
            }
          } catch {
            setUnreadCount(0);
          }
        } else {
          setUnreadCount(0);
        }
      }
    };

    updateUnreadBadge();
    const interval = setInterval(updateUnreadBadge, 1000);
    window.addEventListener('storage', updateUnreadBadge);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', updateUnreadBadge);
    };
  }, [profile]);

  // Extract user's actual account full name or default to 'User'
  const getDisplayName = () => {
    if (!user) return 'User';

    const dbName = (profile as any)?.full_name || (profile as any)?.name || profile?.display_name;
    if (dbName && typeof dbName === 'string' && dbName.trim()) {
      return dbName.trim().split(' ')[0];
    }
    const metaName = user?.user_metadata?.full_name || user?.user_metadata?.name;
    if (metaName && typeof metaName === 'string' && metaName.trim()) {
      return metaName.trim().split(' ')[0];
    }
    if (user?.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'User';
  };

  const displayName = getDisplayName();

  return (
    <div className="relative z-40">
      <NotificationToastBanner />

      <header className="bg-white border-b border-slate-100 px-4 py-2.5 sticky top-0 z-40 flex items-center justify-between shadow-xs">
        
        {/* Left: Location Dropdown */}
        {showLocation ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleLocationClick}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-slate-200/60 transition-colors active:scale-95 disabled:opacity-80"
            >
              {isLocating && currentLocation === 'Detecting location...' ? (
                <Loader2 size={13} className="text-[#007AFF] animate-spin shrink-0" />
              ) : (
                <MapPin size={13} className="text-[#007AFF] shrink-0" />
              )}
              <span className="truncate max-w-[100px] sm:max-w-[140px]">{currentLocation}</span>
              <ChevronDown size={12} className="text-slate-400 shrink-0" />
            </button>
          </div>
        ) : (
          <div className="w-10"></div>
        )}

        {/* Center: Greeting / Custom Title */}
        <div className="text-center">
          {customTitle ? (
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight">{customTitle}</h1>
              {customSubtitle && <p className="text-[10px] text-slate-400 font-medium">{customSubtitle}</p>}
            </div>
          ) : showGreeting ? (
            <div>
              <h1 className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1">
                Hi, {displayName} <span className="text-base">👋</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">What can we help you with today?</p>
            </div>
          ) : null}
        </div>

        {/* Right: Notification Bell (DYNAMIC BADGE) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-all active:scale-95"
            aria-label="Open notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

      </header>

      {/* Collapsible Compact Popover Notification Panel */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />

      {/* Location Map Selector Modal */}
      {isLocationModalOpen && (
        <LocationMapSelector
          onClose={() => setIsLocationModalOpen(false)}
          onConfirm={(loc) => {
            if (loc.address) {
              setCurrentLocation(loc.address);
              if (typeof window !== 'undefined') localStorage.setItem('repireo_detected_location', loc.address);
            }
            setIsLocationModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
