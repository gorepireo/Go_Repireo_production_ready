'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export interface ToastMessage {
  id: string;
  type: 'worker_new_order' | 'started' | 'completed' | 'info';
  title: string;
  message: string;
  actionUrl?: string;
  orderId?: string;
}

// Register service worker and subscribe to push notifications
async function registerPushSubscription(userId: string | null, role: string) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    if (!vapidPublicKey) return;

    // Convert VAPID key to Uint8Array
    const urlBase64ToUint8Array = (base64String: string) => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      return outputArray;
    };

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    });

    // Save subscription to database
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId,
        role
      })
    });
  } catch (err) {
    console.warn('Push subscription error:', err);
  }
}

export default function NotificationToastBanner() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);
  const subscribed = useRef(false);

  // Register service worker + push subscription once user is ready
  useEffect(() => {
    if (subscribed.current || !user) return;

    const role = (profile as any)?.role || localStorage.getItem('repireo_cached_role') || 'user';
    registerPushSubscription(user.id, role).then(() => {
      subscribed.current = true;
    });
  }, [user, profile]);

  // Listen for custom in-app toast events dispatched by other components
  useEffect(() => {
    const handleCustomToast = (e: Event) => {
      const toastData = (e as CustomEvent<ToastMessage>).detail;
      setActiveToast(toastData);
    };

    window.addEventListener('repireo_toast', handleCustomToast);
    return () => window.removeEventListener('repireo_toast', handleCustomToast);
  }, []);

  // Auto dismiss toast after 7 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => setActiveToast(null), 7000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  const handleToastClick = () => {
    if (activeToast.actionUrl) router.push(activeToast.actionUrl);
    setActiveToast(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="fixed top-4 right-3 left-3 sm:left-auto sm:right-4 z-[9999] sm:max-w-sm bg-white/98 backdrop-blur-md rounded-2xl p-3.5 border border-slate-200/90 shadow-2xl overflow-hidden flex items-start gap-3"
      >
        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
          {activeToast.type === 'worker_new_order' ? (
            <AlertCircle size={18} className="text-amber-500" />
          ) : activeToast.type === 'completed' ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <Bell size={18} className="text-[#007AFF]" />
          )}
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={handleToastClick}>
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
              {activeToast.title}
            </h4>
            <span className="text-[8px] font-extrabold text-[#007AFF] bg-blue-50 px-2 py-0.5 rounded-full shrink-0">
              NOW
            </span>
          </div>
          <p className="text-[10.5px] text-slate-600 font-medium leading-snug mt-0.5">
            {activeToast.message}
          </p>
        </div>

        <button
          onClick={() => setActiveToast(null)}
          className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center shrink-0 transition-colors"
        >
          <X size={12} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// Helper: dispatch an in-app toast banner AND send a real web push notification to a specific user
export async function sendPushNotification(opts: {
  title: string;
  message: string;
  type?: ToastMessage['type'];
  actionUrl?: string;
  orderId?: string;
  targetUserId?: string;
  targetRole?: string;
}) {
  // 1. Fire in-app toast
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('repireo_toast', {
      detail: {
        id: `toast-${Date.now()}`,
        type: opts.type || 'info',
        title: opts.title,
        message: opts.message,
        actionUrl: opts.actionUrl,
        orderId: opts.orderId
      } as ToastMessage
    }));
  }

  // 2. Send real device push via API
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: opts.title,
        message: opts.message,
        url: opts.actionUrl || '/',
        orderId: opts.orderId,
        targetUserId: opts.targetUserId,
        targetRole: opts.targetRole
      })
    });
  } catch (err) {
    console.warn('Push send error:', err);
  }
}
