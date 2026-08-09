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
import { insforge } from '@/lib/insforge';

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
    message: 'New AC Repair & Service booked in Etawah (2.4 km away). Tap Accept to take this job.',
    time: 'Just now',
    read: false,
    actionUrl: '/dashboard/worker',
    workerAccepted: false
  },
  {
    id: 'w2',
    type: 'worker_payment',
    title: 'Payment Credited ₹499',
    message: 'Work completion verified. ₹499 credited to your wallet balance.',
    time: '2h ago',
    read: true,
    actionUrl: '/dashboard/worker'
  }
];

export default function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
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
  const handleWorkerAccept = async (id: string) => {
    const workerName = (profile as any)?.full_name || (profile as any)?.name || user?.email?.split('@')[0] || 'Rohit Sharma';
    const workerAvatar = (profile as any)?.avatar || '/hero_technician_banner.png';
    const workerPhone = (profile as any)?.phone || '+918679245568';

    // Assign pending order in InsForge DB
    try {
      const { data: pendingOrders } = await insforge.database
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (pendingOrders && pendingOrders.length > 0) {
        await insforge.database
          .from('orders')
          .update({
            status: 'in_progress',
            worker_id: user?.id || 'w-rohit-sharma',
            worker_name: workerName,
            worker_avatar: workerAvatar,
            worker_phone: workerPhone,
            worker_email: user?.email
          })
          .eq('id', pendingOrders[0].id);
      }
    } catch (err) {
      console.error('Accept order error:', err);
    }

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
          {/* Transparent Backdrop */}
          <div 
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-2xs"
          />

          {/* Compact Dropdown Popover Card */}
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
                    className="text-[10px] font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full border border-red-100 transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={11} />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="p-3 overflow-y-auto space-y-2 flex-1 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full mx-auto flex items-center justify-center">
                    <Bell size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No New Notifications</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">
                    Alerts for service updates and status changes will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-2xl border transition-all text-left space-y-2 ${
                      n.read ? 'bg-slate-50/70 border-slate-100' : 'bg-blue-50/50 border-blue-100/80 shadow-2xs'
                    }`}
                  >
                    <div 
                      onClick={() => handleNotificationClick(n)}
                      className="cursor-pointer flex items-start gap-2.5"
                    >
                      <div className="w-7 h-7 rounded-full bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        {getIcon(n.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
                            {n.title}
                          </h4>
                          <span className="text-[8.5px] font-medium text-slate-400 shrink-0">
                            {n.time}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-600 font-medium leading-relaxed mt-0.5">
                          {n.message}
                        </p>
                      </div>
                    </div>

                    {/* Quick Accept/Decline for Worker New Order Alerts */}
                    {isWorker && n.type === 'worker_new_order' && !n.workerAccepted && (
                      <div className="flex items-center gap-2 pt-1 border-t border-blue-100/60">
                        <button
                          onClick={() => handleWorkerAccept(n.id)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] py-1.5 rounded-xl shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-1"
                        >
                          <Check size={12} />
                          <span>Accept Order</span>
                        </button>
                        <button
                          onClick={() => handleWorkerDecline(n.id)}
                          className="px-3 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-[10px] py-1.5 rounded-xl transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center shrink-0">
              <span className="text-[9px] font-bold text-slate-400">
                GoRepireo Alert System • Etawah, UP
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
