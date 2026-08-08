'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  UserCheck, 
  MapPin, 
  Wrench, 
  Star, 
  ChevronRight,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export interface NotificationItem {
  id: string;
  type: 'confirmed' | 'assigned' | 'reached' | 'started' | 'completed' | 'review';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockNotifications: NotificationItem[] = [
  {
    id: 'n1',
    type: 'review',
    title: 'Rate Your Service Experience ⭐',
    message: 'Rohit Sharma completed your AC Repair & Service. Please leave a review!',
    time: '2 mins ago',
    read: false,
    actionUrl: '/track?review=true'
  },
  {
    id: 'n2',
    type: 'completed',
    title: 'Work Completed Successfully',
    message: 'Service completed! Verification OTP verified by Rohit Sharma.',
    time: '15 mins ago',
    read: false,
    actionUrl: '/track'
  },
  {
    id: 'n3',
    type: 'started',
    title: 'Work Started (OTP Verified)',
    message: 'Start Work OTP verified. Rohit Sharma is now performing repair.',
    time: '45 mins ago',
    read: true,
    actionUrl: '/track'
  },
  {
    id: 'n4',
    type: 'reached',
    title: 'Expert Reached Your Location',
    message: 'Rohit Sharma has arrived at your address in Etawah.',
    time: '1 hour ago',
    read: true,
    actionUrl: '/track'
  },
  {
    id: 'n5',
    type: 'assigned',
    title: 'Expert Assigned',
    message: 'Rohit Sharma (4.8 ★) assigned to your AC Repair order #GR-7821.',
    time: '2 hours ago',
    read: true,
    actionUrl: '/track'
  },
  {
    id: 'n6',
    type: 'confirmed',
    title: 'Order Confirmed',
    message: 'Your booking for AC Repair & Service has been confirmed.',
    time: '3 hours ago',
    read: true,
    actionUrl: '/track'
  }
];

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const router = useRouter();

  const handleNotificationClick = (url?: string) => {
    if (url) {
      router.push(url);
    }
    onClose();
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'review':
        return <Star size={16} className="text-amber-500 fill-amber-400" />;
      case 'completed':
        return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'started':
        return <Wrench size={16} className="text-[#007AFF]" />;
      case 'reached':
        return <MapPin size={16} className="text-purple-500" />;
      case 'assigned':
        return <UserCheck size={16} className="text-blue-500" />;
      case 'confirmed':
        return <CheckCircle2 size={16} className="text-blue-500" />;
      default:
        return <Bell size={16} className="text-[#007AFF]" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 pointer-events-auto"
          />

          {/* Collapsible Panel Drawer (Slides down from top header) */}
          <motion.div
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white rounded-b-3xl shadow-2xl border-b border-slate-100 max-h-[85vh] flex flex-col overflow-hidden mx-auto max-w-md"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-[#F8FAFC] border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 text-[#007AFF] rounded-full flex items-center justify-center">
                  <Bell size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">Notifications</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Real-time updates for your services</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 bg-white border border-slate-200 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Notifications List */}
            <div className="p-4 overflow-y-auto space-y-3 divide-y divide-slate-100/60 max-h-[60vh]">
              {mockNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.actionUrl)}
                  className={`pt-3 first:pt-0 p-3 rounded-2xl transition-all cursor-pointer hover:bg-slate-50 ${
                    !notif.read ? 'bg-blue-50/40 border border-blue-100/60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-white shadow-xs border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-black text-slate-900 tracking-tight truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[9px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                          <Clock size={10} />
                          {notif.time}
                        </span>
                      </div>

                      <p className="text-[10.5px] text-slate-600 font-medium leading-snug line-clamp-2">
                        {notif.message}
                      </p>

                      {/* Special Action Button for Reviews */}
                      {notif.type === 'review' && (
                        <div className="pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notif.actionUrl);
                            }}
                            className="w-full bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-[10px] py-2 px-3 rounded-full shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                          >
                            <Star size={12} className="fill-amber-300 text-amber-300" />
                            <span>Give Review Now</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button
                onClick={onClose}
                className="text-[10px] font-extrabold text-[#007AFF] hover:underline"
              >
                Close Panel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
