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
  const [currentLocation, setCurrentLocation] = useState('Etawah, UP');
  const [isLocating, setIsLocating] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchLiveAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const area = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.road || addr.village;
        const city = addr.city || addr.town || addr.county || addr.state_district || 'UP';
        
        if (area && city) {
          setCurrentLocation(`${area}, ${city}`);
        } else if (city) {
          setCurrentLocation(`${city}, UP`);
        } else if (data.display_name) {
          const parts = data.display_name.split(',');
          setCurrentLocation(`${parts[0].trim()}, ${parts[1]?.trim() || 'UP'}`);
        }
      }
    } catch (err) {
      console.warn('Auto reverse-geocode error:', err);
    }
  };

  // Auto-detect browser live location on mount if location permission is granted
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchLiveAddress(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.log('Location permission not granted or timeout on mount:', err.message);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
      );
    }
  }, []);

  // Handle location pill click - immediately detects live location
  const handleLocationClick = () => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await fetchLiveAddress(pos.coords.latitude, pos.coords.longitude);
          setIsLocating(false);
        },
        (err) => {
          console.warn('GPS permission not granted or error, opening map picker:', err);
          setIsLocating(false);
          setIsLocationModalOpen(true);
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
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
              {isLocating ? (
                <Loader2 size={13} className="text-[#007AFF] animate-spin shrink-0" />
              ) : (
                <MapPin size={13} className="text-[#007AFF] shrink-0" />
              )}
              <span className="truncate max-w-[90px] sm:max-w-[120px]">{currentLocation}</span>
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
            if (loc.address) setCurrentLocation(loc.address);
            setIsLocationModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
