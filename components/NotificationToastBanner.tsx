'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, AlertCircle, Wrench, ChevronRight, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { insforge } from '@/lib/insforge';

export interface ToastMessage {
  id: string;
  type: 'worker_new_order' | 'started' | 'completed' | 'info';
  title: string;
  message: string;
  actionUrl?: string;
  orderId?: string;
}

export default function NotificationToastBanner() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [activeToast, setActiveToast] = useState<ToastMessage | null>(null);

  // Request Native Device Web Push Notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Listen for database changes & local custom notification events
  useEffect(() => {
    const handleCustomToast = (e: CustomEvent<ToastMessage>) => {
      const toastData = e.detail;
      setActiveToast(toastData);

      // Trigger Native Web Push System Notification for Android / iOS / Desktop
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(toastData.title, {
            body: toastData.message,
            icon: '/icon.png',
            badge: '/icon.png',
            tag: toastData.id
          });
        } catch (err) {
          console.warn('Native notification error:', err);
        }
      }
    };

    window.addEventListener('repireo_toast' as any, handleCustomToast as any);
    return () => {
      window.removeEventListener('repireo_toast' as any, handleCustomToast as any);
    };
  }, []);

  // Auto dismiss toast after 7 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  if (!activeToast) return null;

  const handleToastClick = () => {
    if (activeToast.actionUrl) {
      router.push(activeToast.actionUrl);
    }
    setActiveToast(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="fixed top-4 right-3 left-3 sm:left-auto sm:right-4 z-50 sm:max-w-sm bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-slate-200/90 shadow-2xl overflow-hidden flex items-start gap-3"
      >
        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
          {activeToast.type === 'worker_new_order' ? (
            <AlertCircle size={18} className="text-amber-500" />
          ) : activeToast.type === 'completed' ? (
            <CheckCircle2 size={18} className="text-emerald-500" />
          ) : (
            <Bell size={18} className="text-[#007AFF]" />
          )}
        </div>

        <div className="flex-1 min-w-0" onClick={handleToastClick}>
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-black text-slate-900 truncate leading-tight">
              {activeToast.title}
            </h4>
            <span className="text-[8px] font-extrabold text-[#007AFF] bg-blue-50 px-2 py-0.5 rounded-full">
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
