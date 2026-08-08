'use client';

import { useState } from 'react';
import { MapPin, ChevronDown, Bell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NotificationDrawer from '@/components/NotificationDrawer';
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
  const { user } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('Etawah, UP');

  // Extract user's display name or email prefix
  const getDisplayName = () => {
    if (!user) return 'Priithibi';
    if (user.user_metadata?.full_name) return user.user_metadata.full_name.split(' ')[0];
    if (user.user_metadata?.name) return user.user_metadata.name.split(' ')[0];
    if (user.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'Priithibi';
  };

  const displayName = getDisplayName();

  return (
    <>
      <header className="bg-white border-b border-slate-100 px-4 py-2.5 sticky top-0 z-40 flex items-center justify-between shadow-xs">
        
        {/* Left: Location Dropdown */}
        {showLocation ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold border border-slate-200/60 transition-colors active:scale-95"
            >
              <MapPin size={13} className="text-[#007AFF] shrink-0" />
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

        {/* Right: Notification Bell */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-all active:scale-95"
            aria-label="Open notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white shadow-2xs">
              3
            </span>
          </button>
        </div>

      </header>

      {/* Collapsible Notification Panel */}
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
    </>
  );
}
