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

  const saveAndBroadcastLocation = (lat: number, lng: number, address: string, isManual = false) => {
    setCurrentLocation(address);
    if (typeof window !== 'undefined') {
      localStorage.setItem('repireo_detected_location', address);
      localStorage.setItem('repireo_customer_lat', String(lat));
      localStorage.setItem('repireo_customer_lng', String(lng));
      if (isManual) {
        localStorage.setItem('repireo_location_source', 'manual');
      } else {
        localStorage.setItem('repireo_location_source', 'gps');
      }
      window.dispatchEvent(
        new CustomEvent('repireo_location_updated', {
          detail: { lat, lng, address, source: isManual ? 'manual' : 'gps' },
        })
      );
    }
  };

  const fetchLiveAddress = async (lat: number, lng: number) => {
    try {
      // Provider 1: BigDataCloud Reverse Geocode API (Instant 100ms, free, no rate limits)
      const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        const locality = bdcData.locality || bdcData.city || bdcData.localityInfo?.informative?.[0]?.name;
        const city = bdcData.city || bdcData.principalSubdivision;
        
        if (locality && city && locality !== city) {
          saveAndBroadcastLocation(lat, lng, `${locality}, ${city}`);
          return;
        } else if (locality || city) {
          saveAndBroadcastLocation(lat, lng, `${locality || city}`);
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
          saveAndBroadcastLocation(lat, lng, `${area}, ${city}`);
        } else if (city) {
          saveAndBroadcastLocation(lat, lng, `${city}`);
        }
      }
    } catch (err) {
      console.warn('Auto reverse-geocode error:', err);
    }
  };

  // Automatically detect live real GPS location on page load if not manually set by user
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isManual = localStorage.getItem('repireo_location_source') === 'manual';
      if (isManual) {
        // User explicitly pinned or chose a delivery address! Preserve across reloads.
        return;
      }

      if (navigator.geolocation) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetchLiveAddress(pos.coords.latitude, pos.coords.longitude).finally(() => setIsLocating(false));
          },
          (err) => {
            console.warn('Real GPS detection ungranted or timed out:', err.message);
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      }
    }
  }, []);

  // Listen for programmatic location modal trigger
  useEffect(() => {
    const handleOpenModal = () => setIsLocationModalOpen(true);
    window.addEventListener('repireo_open_location_modal', handleOpenModal);
    return () => window.removeEventListener('repireo_open_location_modal', handleOpenModal);
  }, []);

  // Handle location button click - Open map picker modal directly (Zomato / Swiggy behavior)
  const handleLocationClick = () => {
    setIsLocationModalOpen(true);
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
              const cleanList = list.filter((item: any) => !['c1', 'c2', 'c3', 'c4', 'c5', 'w1', 'w2'].includes(item.id));
              const unread = cleanList.filter((n: any) => !n.read).length;
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
    if (!user && !profile) return 'User';

    const dbName = (profile as any)?.full_name || (profile as any)?.name;
    if (dbName && typeof dbName === 'string' && dbName.trim() && !dbName.includes('@')) {
      return dbName.trim().split(' ')[0];
    }
    const storedName = typeof window !== 'undefined' ? localStorage.getItem('repireo_user_name') : null;
    if (storedName && typeof storedName === 'string' && storedName.trim() && !storedName.includes('@')) {
      return storedName.trim().split(' ')[0];
    }
    const dispName = profile?.display_name;
    if (dispName && typeof dispName === 'string' && dispName.trim() && !dispName.includes('@')) {
      return dispName.trim().split(' ')[0];
    }
    const metaName = user?.user_metadata?.full_name || user?.user_metadata?.name;
    if (metaName && typeof metaName === 'string' && metaName.trim() && !metaName.includes('@')) {
      return metaName.trim().split(' ')[0];
    }
    if (user?.email || profile?.email) {
      const prefix = (user?.email || profile?.email || '').split('@')[0];
      const alphaOnly = prefix.replace(/[0-9]/g, '');
      if (alphaOnly.length >= 3) {
        return alphaOnly.charAt(0).toUpperCase() + alphaOnly.slice(1);
      }
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'User';
  };

  const displayName = getDisplayName();

  return (
    <div className="relative z-40">
      <NotificationToastBanner />

      <header className="sticky top-0 z-40 grid min-h-[58px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1 border-b border-slate-100 bg-white px-2.5 py-2.5 shadow-xs min-[375px]:gap-2 min-[375px]:px-4">
        
        {/* Left: Location Dropdown */}
        {showLocation ? (
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={handleLocationClick}
              disabled={isLocating}
              className="inline-flex min-w-0 max-w-full items-center gap-1 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-700 transition-colors hover:bg-slate-100 active:scale-95 disabled:opacity-80 min-[375px]:gap-1.5 min-[375px]:px-3 min-[375px]:text-xs border border-slate-200/60 rounded-full"
            >
              {isLocating && currentLocation === 'Detecting location...' ? (
                <Loader2 size={13} className="text-[#007AFF] animate-spin shrink-0" />
              ) : (
                <MapPin size={13} className="text-[#007AFF] shrink-0" />
              )}
              <span className="max-w-[72px] truncate min-[375px]:max-w-[100px] sm:max-w-[140px]">{currentLocation}</span>
              <ChevronDown size={12} className="text-slate-400 shrink-0" />
            </button>
          </div>
        ) : (
          <div className="w-10"></div>
        )}

        {/* Center: Greeting / Custom Title */}
        <div className="min-w-0 px-1 text-center">
          {customTitle ? (
            <div>
              <h1 className="truncate text-xs font-black tracking-tight text-slate-900 min-[375px]:text-sm">{customTitle}</h1>
              {customSubtitle && <p className="hidden truncate text-[10px] font-medium text-slate-400 min-[390px]:block">{customSubtitle}</p>}
            </div>
          ) : showGreeting ? (
            <div>
              <h1 className="flex items-center justify-center gap-1 truncate text-xs font-bold text-slate-900 min-[375px]:text-sm">
                Hi, {displayName} <span className="text-base">👋</span>
              </h1>
              <p className="hidden truncate text-[10px] font-medium text-slate-400 min-[390px]:block">What can we help you with today?</p>
            </div>
          ) : null}
        </div>

        {/* Right: Notification Bell (DYNAMIC BADGE) */}
        <div className="flex items-center justify-end gap-1 min-[375px]:gap-2">
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
              saveAndBroadcastLocation(loc.lat, loc.lng, loc.address, true);
            }
            setIsLocationModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
