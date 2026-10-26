'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => undefined,
  removeToast: () => undefined,
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', durationMs: number = 4000) => {
    if (!message) return;
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]); // Keep at most 4 toasts

    setTimeout(() => {
      removeToast(id);
    }, durationMs);
  }, [removeToast]);

  // Intercept any native window.alert calls in the browser so no system popups ever appear
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const originalAlert = window.alert;
    window.alert = (msg?: any) => {
      showToast(String(msg || ''), 'error');
    };
    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Floating in-app notifications container */}
      <div 
        aria-live="polite"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[92%] max-w-md pointer-events-none"
      >
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';
          const isWarning = toast.type === 'warning';

          const bgClass = isError
            ? 'bg-rose-600 text-white shadow-rose-900/20'
            : isSuccess
            ? 'bg-emerald-600 text-white shadow-emerald-900/20'
            : isWarning
            ? 'bg-amber-500 text-white shadow-amber-900/20'
            : 'bg-[#007AFF] text-white shadow-blue-900/20';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${bgClass}`}
              role="alert"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isError && <AlertCircle size={18} className="shrink-0 text-white" />}
                {isSuccess && <CheckCircle2 size={18} className="shrink-0 text-white" />}
                {isWarning && <AlertTriangle size={18} className="shrink-0 text-white" />}
                {!isError && !isSuccess && !isWarning && <Info size={18} className="shrink-0 text-white" />}
                <p className="text-xs sm:text-sm font-bold leading-snug break-words">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Dismiss notification"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
