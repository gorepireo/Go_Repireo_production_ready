'use client';

import { useState, useEffect } from 'react';
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
  Clock,
  Trash2,
  AlertCircle,
  Check,
  Ban
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export interface NotificationItem {
  id: string;
  type: 'confirmed' | 'assigned' | 'reached' | 'started' | 'completed' | 'review' | 'worker_new_order' | 'worker_payment';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionUrl?: string;
  workerAccepted?: boolean;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const customerDefaults: NotificationItem[] = [
  {
    id: 'c1',
    type: 'review',
    title: 'Rate Your Experience ⭐',
    message: 'Rohit Sharma completed your AC Repair. Please leave a review!',
    time: '2m ago',
    read: false,
    actionUrl: '/track?review=true'
  },
  {
    id: 'c2',
    type: 'completed',
    title: 'Work Completed',
    message: 'Service completed! Verification OTP verified by Rohit Sharma.',
    time: '15m ago',
    read: false,
    actionUrl: '/track'
  },
  {
    id: 'c3',
    type: 'started',
    title: 'Work Started',
    message: 'Start Work OTP verified. Rohit Sharma is now performing repair.',
    time: '45m ago',
    read: true,
    actionUrl: '/track'
  },
  {
    id: 'c4',
    type: 'reached',
    title: 'Expert Reached',
    message: 'Rohit Sharma has arrived at your address in Etawah.',
    time: '1h ago',
    read: true,
    actionUrl: '/track'
  },
  {
    id: 'c5',
    type: 'assigned',
    title: 'Expert Assigned',
    message: 'Rohit Sharma (4.8 ★) assigned to your AC Repair order #GR-7821.',
    time: '2h ago',
    read: true,
    actionUrl: '/track'
  }
];

const workerDefaults: NotificationItem[] = [
  {
    id: 'w1',
    type: 'worker_new_order',
    title: '⚡ New Service Booking Alert!',
    message: 'New AC Repair & Service booked in Etawah (2.4 km away). Earn ₹499.',
    time: 'Just now',
    read: false,
    actionUrl: '/dashboard/worker',
    workerAccepted: false
  },
  {
    id: 'w2',
    type: 'started',
    title: 'Start Work OTP Verified',
    message: 'Customer verified Start OTP 4812. You may now perform service.',
    time: '30m ago',
    read: true,
    actionUrl: '/dashboard/worker'
  },
  {
    id: 'w3',
    type: 'worker_payment',
    title: 'Payment Credited ₹499',
    message: 'Work completion OTP verified. ₹499 credited to your wallet balance.',
    time: '2h ago',
    read: true,
    actionUrl: '/dashboard/worker'
  }
];

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const [cachedRole, setCachedRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCachedRole(localStorage.getItem('repireo_cached_role'));
    }
  }, []);

  const activeRole = profile?.role || cachedRole || 'user';
  const isWorker = activeRole === 'worker';

  const storageKey = isWorker ? 'repireo_notifications_worker' : 'repireo_notifications_customer';

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Load notifications from local device storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setNotifications(JSON.parse(saved));
        } catch {
          const initial = isWorker ? workerDefaults : customerDefaults;
          setNotifications(initial);
          localStorage.setItem(storageKey, JSON.stringify(initial));
        }
      } else {
        const initial = isWorker ? workerDefaults : customerDefaults;
        setNotifications(initial);
        localStorage.setItem(storageKey, JSON.stringify(initial));
      }
    }
  }, [storageKey, isWorker]);

  // Persist local notifications on update
  const updateNotifications = (newList: NotificationItem[]) => {
    setNotifications(newList);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(newList));
    }
  };

  // Clear all notifications
  const handleClearAll = () => {
    updateNotifications([]);
  };

  // Worker Accept Order
  const handleWorkerAccept = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, workerAccepted: true, title: 'Order Accepted ✓', message: 'You accepted order #GR-7821. Navigate to customer location.' } : n
    );
    updateNotifications(updated);
    router.push('/dashboard/worker');
    onClose();
  };

  // Worker Decline Order
  const handleWorkerDecline = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    updateNotifications(updated);
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    // Mark read
    const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n);
    updateNotifications(updated);

    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
    onClose();
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'worker_new_order':
        return <AlertCircle size={15} className="text-amber-500" />;
      case 'worker_payment':
        return <CheckCircle2 size={15} className="text-emerald-500" />;
      case 'review':
        return <Star size={15} className="text-amber-500 fill-amber-400" />;
      case 'completed':
        return <CheckCircle2 size={15} className="text-emerald-500" />;
      case 'started':
        return <Wrench size={15} className="text-[#007AFF]" />;
      case 'reached':
        return <MapPin size={15} className="text-purple-500" />;
      case 'assigned':
        return <UserCheck size={15} className="text-blue-500" />;
      default:
        return <Bell size={15} className="text-[#007AFF]" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Transparent Backdrop to close when clicking outside */}
          <div 
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-2xs"
          />

          {/* Compact Dropdown Popover Card (Anchored top right under Bell icon) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-3 top-13 z-50 w-[92vw] max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100/90 overflow-hidden flex flex-col max-h-[380px]"
          >
            {/* Header Bar */}
            <div className="px-4 py-3 bg-[#F8FAFC] border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-50 text-[#007AFF] rounded-full flex items-center justify-center">
                  <Bell size={14} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 tracking-tight">Notifications</h3>
                  <p className="text-[9px] text-slate-400 font-medium">Device local alerts</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[9px] font-bold text-red-500 hover:text-red-600 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 active:scale-95 transition-all"
                  >
                    <Trash2 size={10} />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-6 h-6 bg-white border border-slate-200 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Notifications Scrollable Body */}
            <div className="p-3 overflow-y-auto space-y-2 max-h-[300px] divide-y divide-slate-100/60">
              {notifications.length === 0 ? (
                <div className="py-8 text-center space-y-1.5">
                  <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-full mx-auto flex items-center justify-center">
                    <Bell size={18} />
                  </div>
                  <h4 className="text-xs font-black text-slate-400">No new notifications</h4>
                  <p className="text-[9.5px] text-slate-400">You're all caught up!</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`pt-2.5 first:pt-0 p-2.5 rounded-2xl transition-all cursor-pointer hover:bg-slate-50 ${
                      !notif.read ? 'bg-blue-50/30 border border-blue-100/40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-white shadow-2xs border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                        {getIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-[11px] font-black text-slate-900 tracking-tight truncate">
                            {notif.title}
                          </h4>
                          <span className="text-[8.5px] text-slate-400 font-medium shrink-0">
                            {notif.time}
                          </span>
                        </div>

                        <p className="text-[9.5px] text-slate-600 font-medium leading-snug line-clamp-2">
                          {notif.message}
                        </p>

                        {/* Customer Review Button */}
                        {notif.type === 'review' && (
                          <div className="pt-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notif);
                              }}
                              className="w-full bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-[9px] py-1.5 px-3 rounded-full shadow-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                            >
                              <Star size={11} className="fill-amber-300 text-amber-300" />
                              <span>Give Review</span>
                              <ChevronRight size={11} />
                            </button>
                          </div>
                        )}

                        {/* Worker Action Buttons (Accept / Decline) */}
                        {isWorker && notif.type === 'worker_new_order' && (
                          <div className="pt-1.5 flex items-center gap-2">
                            {notif.workerAccepted ? (
                              <span className="text-[9px] font-extrabold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <Check size={10} /> Order Accepted
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWorkerAccept(notif.id);
                                  }}
                                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[9px] py-1.5 px-2 rounded-full shadow-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                                >
                                  <Check size={10} />
                                  <span>Accept</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWorkerDecline(notif.id);
                                  }}
                                  className="bg-slate-100 text-slate-500 hover:bg-slate-200 font-extrabold text-[9px] py-1.5 px-2.5 rounded-full flex items-center justify-center gap-1 active:scale-95 transition-all"
                                >
                                  <Ban size={10} />
                                  <span>Decline</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
