'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Wrench,
  Phone,
  MoreVertical,
  Calendar,
  MapPin,
  Map,
  Paperclip,
  Smile,
  Send,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  senderRole?: 'worker' | 'customer';
  senderName?: string;
  text?: string;
  time?: string;
  type?: 'text' | 'tracking-card';
  title?: string;
  distance?: string;
}

function formatOrderId(rawId?: string): string {
  if (!rawId) return '#c65c8c';
  const clean = rawId.replace(/^#/, '').replace(/^GR-/, '').trim();
  if (clean.length > 6) {
    return `#${clean.slice(0, 6).toLowerCase()}`;
  }
  return `#${clean.toLowerCase()}`;
}

function ChatContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const paramOrderId =
    searchParams.get('orderId') ||
    searchParams.get('order_id') ||
    searchParams.get('id') ||
    'c65c8ca2-66b8-4954-a709-586f70d1ada2';

  const [orderData, setOrderData] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [liveTracking, setLiveTracking] = useState<any>({
    statusText: 'Expert is on the way',
    distance: '4.0 km away • 6 min',
  });
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch live order and messages from database API
  useEffect(() => {
    let isMounted = true;

    const loadChatData = async () => {
      try {
        const res = await fetch(`/api/chat?order_id=${encodeURIComponent(paramOrderId)}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (data.order) setOrderData(data.order);
            if (data.liveTracking) setLiveTracking(data.liveTracking);

            // If database returned messages, build stream with tracking card
            const dbMessages: ChatMessage[] = (data.messages || []).map((m: any) => ({
              id: m.id,
              senderRole: m.senderRole,
              senderName: m.senderName,
              text: m.text,
              time: m.time,
              type: 'text',
            }));

            // Insert Live Tracking Card right after the second message (or at suitable spot)
            if (dbMessages.length >= 3) {
              const withTracking = [
                dbMessages[0],
                dbMessages[1],
                dbMessages[2],
                {
                  id: 'system-tracking-card',
                  type: 'tracking-card' as const,
                  title: data.liveTracking?.statusText || 'Expert is on the way',
                  distance: data.liveTracking?.distance || '4.0 km away • 6 min',
                },
                ...dbMessages.slice(3),
              ];
              setMessages(withTracking);
            } else if (dbMessages.length > 0) {
              setMessages([
                ...dbMessages,
                {
                  id: 'system-tracking-card',
                  type: 'tracking-card' as const,
                  title: data.liveTracking?.statusText || 'Expert is on the way',
                  distance: data.liveTracking?.distance || '4.0 km away • 6 min',
                },
              ]);
            } else {
              // Fallback if database had 0 rows
              setMessages([
                {
                  id: 'msg-1',
                  senderRole: 'worker',
                  senderName: 'Anupam',
                  text: "Hi Prithibi! I'm on the way to your location.",
                  time: '2:47 PM',
                  type: 'text',
                },
                {
                  id: 'msg-2',
                  senderRole: 'customer',
                  senderName: 'Prithibi',
                  text: 'Great! How much time will it take?',
                  time: '2:49 PM',
                  type: 'text',
                },
                {
                  id: 'msg-3',
                  senderRole: 'worker',
                  senderName: 'Anupam',
                  text: "Around 6 minutes. I'll reach soon.",
                  time: '2:50 PM',
                  type: 'text',
                },
                {
                  id: 'system-tracking-card',
                  type: 'tracking-card',
                  title: 'Expert is on the way',
                  distance: '4.0 km away • 6 min',
                },
                {
                  id: 'msg-4',
                  senderRole: 'customer',
                  senderName: 'Prithibi',
                  text: 'Okay, see you!',
                  time: '2:51 PM',
                  type: 'text',
                },
              ]);
            }
          }
        }
      } catch (err) {
        console.warn('[Chat] Failed to load data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadChatData();

    // Periodic sync every 6 seconds for new incoming messages
    const interval = setInterval(loadChatData, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [paramOrderId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const technicianName = orderData?.workerName || 'Anupam';
  const technicianPhone = orderData?.workerPhone || '+917679430992';
  const serviceName = orderData?.serviceName || 'Plumbing Service';
  const scheduleTime = orderData?.scheduleTime || 'Today, 3:00 PM – 5:00 PM';
  const orderDisplayId = formatOrderId(orderData?.id || paramOrderId);

  // Phone Call Handler
  const handleCall = () => {
    if (typeof window !== 'undefined') {
      window.location.href = `tel:${technicianPhone}`;
    }
  };

  // Back Button Handler
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/track?orderId=${encodeURIComponent(paramOrderId)}`);
    }
  };

  // Send Message Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText('');

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const optimisticMsg: ChatMessage = {
      id: `client-${Date.now()}`,
      senderRole: 'customer',
      senderName: orderData?.customerName || 'Prithibi',
      text: messageText,
      time: timeString,
      type: 'text',
    };

    // Optimistically update UI
    setMessages((prev) => [...prev, optimisticMsg]);

    // Persist to database via API
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: paramOrderId,
          text: messageText,
          senderRole: 'customer',
          senderId: user?.uid,
        }),
      });
    } catch (err) {
      console.error('[Chat] Save message error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#F0F4F9] max-w-md mx-auto items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0062FF] animate-spin" />
        <p className="text-xs text-slate-500 font-semibold mt-3">Loading Mission Chat...</p>
      </div>
    );
  }

  return (
    <div className="fixed top-0 bottom-[84px] sm:bottom-[88px] left-0 right-0 max-w-md mx-auto flex flex-col bg-[#F0F4F9] shadow-2xl overflow-hidden font-sans select-none z-40">
      {/* 1. FIXED TOP: Dark Navy Header + Floating Order Card */}
      <div className="shrink-0 z-30 select-none">
        <header className="bg-[#0B1528] text-white px-4 pt-4 pb-11 relative">
          <div className="flex items-center justify-between">
            {/* Left: Back button + Service Badge + Title */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handleBack}
                aria-label="Go back"
                className="text-white/90 hover:text-white p-1 -ml-1 rounded-full transition cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Blue & White Icon Badge */}
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0">
                <Wrench className="w-5 h-5 text-[#0062FF]" />
              </div>

              {/* Mission Chat Title & ID */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-base text-white tracking-tight leading-tight">
                    Mission Chat
                  </h1>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {orderDisplayId}
                </p>
              </div>
            </div>

            {/* Right: Phone button + More options */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCall}
                aria-label="Call Expert"
                className="w-10 h-10 rounded-full bg-[#182338] hover:bg-[#202e47] text-white flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm"
              >
                <Phone className="w-4 h-4 fill-white text-white" />
              </button>
              <button
                type="button"
                aria-label="More options"
                className="p-1.5 text-white/80 hover:text-white rounded-full transition cursor-pointer"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Floating Order Info Card (Fixed right below Header) */}
        <div className="-mt-7 px-4 relative z-20">
          <div className="bg-white rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.06)] border border-slate-100/90 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Water tap / Faucet / Wrench Icon */}
              <div className="w-11 h-11 rounded-2xl bg-[#EBF3FF] flex items-center justify-center text-[#0062FF] shrink-0">
                <Wrench className="w-5 h-5 text-[#0062FF]" />
              </div>

              <div className="min-w-0">
                <h2 className="font-bold text-[15px] text-slate-900 leading-tight truncate">
                  {serviceName}
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{scheduleTime}</span>
                </div>
              </div>
            </div>

            {/* Status Badge: Active */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#EAFBF3] text-[#10B981] border border-[#D1F7E4] rounded-full text-xs font-semibold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
              <span>Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SCROLLABLE MIDDLE: Only Messages Stream Scrolls */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 space-y-3.5 relative">
        {/* Date Divider: Today */}
        <div className="flex justify-center my-2">
          <span className="px-4 py-1 bg-[#E2EAF4] text-slate-500 text-[11px] font-semibold rounded-full shadow-2xs">
            Today
          </span>
        </div>

        {messages.map((msg) => {
          // Live Tracking System Card (Fixed: No truncation on title)
          if (msg.type === 'tracking-card') {
            return (
              <div
                key={msg.id}
                className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center justify-between gap-2.5 w-full my-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#EBF3FF] flex items-center justify-center text-[#0062FF] shrink-0">
                    <MapPin className="w-5 h-5 text-[#0062FF] fill-[#0062FF]/20" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-[13.5px] text-slate-900 leading-tight whitespace-nowrap">
                      {msg.title || liveTracking.statusText || 'Expert is on the way'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 whitespace-nowrap">
                      {msg.distance || liveTracking.distance || '4.0 km away • 6 min'}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/track?orderId=${encodeURIComponent(paramOrderId)}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 text-[#0062FF] hover:bg-blue-50/50 bg-slate-50/60 text-xs font-semibold shrink-0 transition active:scale-95 shadow-2xs whitespace-nowrap"
                >
                  <Map className="w-3.5 h-3.5" />
                  <span>View on Map</span>
                </Link>
              </div>
            );
          }

          // Technician (Worker) Message
          if (msg.senderRole === 'worker') {
            return (
              <div key={msg.id} className="flex items-start gap-2.5 max-w-[85%]">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 shrink-0 mt-1 border border-white shadow-sm flex items-center justify-center">
                  <img
                    src="/hero_technician_banner.png"
                    alt={msg.senderName || 'Anupam'}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-[11px] font-bold text-blue-700">
                    {(msg.senderName || 'A').charAt(0)}
                  </span>
                </div>

                {/* White Speech Bubble */}
                <div className="bg-white rounded-2xl rounded-tl-sm p-3.5 shadow-sm border border-slate-100/80">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <div className="text-xs">
                      <span className="font-bold text-slate-900">
                        {msg.senderName || technicianName}
                      </span>
                      <span className="text-slate-400 ml-1 font-normal">(Expert)</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {msg.time}
                    </span>
                  </div>
                  <p className="text-[14px] text-slate-700 leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          }

          // Customer (Me) Message
          return (
            <div key={msg.id} className="flex flex-col items-end">
              <div className="bg-[#0062FF] text-white rounded-2xl rounded-tr-sm p-3.5 max-w-[82%] shadow-[0_4px_14px_rgba(0,98,255,0.35)]">
                <p className="text-[14px] text-white leading-relaxed">
                  {msg.text}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-blue-100 font-medium">
                  <span>{msg.time}</span>
                  <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. FIXED BOTTOM: Input Bar Sitting Comfortably Above Nav Bar */}
      <footer className="shrink-0 z-30 pt-1 pb-2 px-3.5 bg-gradient-to-t from-[#E2EDF8] via-[#EDF3FA] to-transparent">
        <div className="max-w-md mx-auto">
          <form
            onSubmit={handleSendMessage}
            className="bg-white rounded-full shadow-[0_6px_22px_rgba(0,0,0,0.08)] border border-slate-200/80 p-1.5 pl-3 flex items-center gap-1.5"
          >
            {/* Attachment paperclip */}
            <button
              type="button"
              className="p-1.5 text-slate-500 hover:text-slate-700 transition cursor-pointer"
              aria-label="Attach file"
            >
              <Paperclip className="w-5 h-5 -rotate-45" />
            </button>

            {/* Message input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-[14px] outline-none text-slate-800 placeholder:text-slate-400 bg-transparent px-1.5"
            />

            {/* Emoji icon */}
            <button
              type="button"
              className="p-1.5 text-slate-500 hover:text-slate-700 transition cursor-pointer"
              aria-label="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Blue Send circular button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-10 h-10 rounded-full bg-[#0062FF] hover:bg-blue-600 disabled:bg-blue-300 text-white flex items-center justify-center transition active:scale-95 shadow-[0_4px_10px_rgba(0,98,255,0.35)] shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F0F4F9] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#0062FF] animate-spin" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
