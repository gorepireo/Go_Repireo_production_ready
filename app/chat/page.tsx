'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, ArrowLeft, Loader2, Phone, MessageCircle, ChevronRight, ClipboardList, Wrench, Home, Calendar, Headphones, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

function ChatList() {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      let workerId = null;
      const { data: worker } = await insforge.database
        .from('workers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (worker) workerId = worker.id;

      const { data: userOrders, error: e1 } = await insforge.database
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      let allOrders = userOrders || [];

      if (workerId) {
        const { data: workerOrders, error: e2 } = await insforge.database
          .from('orders')
          .select('*')
          .eq('worker_id', workerId)
          .order('created_at', { ascending: false });
          
        if (workerOrders) {
           const existingIds = new Set(allOrders.map(o => o.id));
           workerOrders.forEach(wo => {
             if (!existingIds.has(wo.id)) {
               allOrders.push(wo);
             }
           });
        }
      }
      
      allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setChats(allOrders);
      setLoading(false);
    };

    fetchChats();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-24">
        <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-5 flex items-center justify-center border-b border-slate-100">
          <div className="h-4 w-24 bg-slate-200 rounded-full animate-pulse"></div>
        </div>
        <div className="max-w-xl mx-auto px-4 pt-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-32 bg-slate-200 rounded-full animate-pulse"></div>
                <div className="h-3 w-16 bg-slate-100 rounded-full animate-pulse"></div>
              </div>
              <div className="h-6 w-16 bg-slate-100 rounded-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <div className="px-4 py-8 flex items-center gap-3">
        <div className="w-12 h-12 rounded-[1.25rem] bg-[#F0F5FF] flex items-center justify-center shrink-0">
          <MessageCircle size={24} className="text-[#007AFF]" />
        </div>
        <div>
          <h1 className="text-lg font-black uppercase tracking-widest text-[#0A1629]">
            Your Chats
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            All your service orders in one place
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 space-y-3">
        {chats.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <MessageCircle size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">No chats available</p>
          </div>
        ) : (
          chats.map((chat, i) => {
            const isActive = ['shipping', 'in_progress'].includes(chat.status);
            
            const icons = [ClipboardList, Wrench, Home, Calendar, UserIcon, Headphones];
            const Icon = icons[i % icons.length];
            
            const dummyMessages = [
              "Order is confirmed",
              "Service scheduled",
              "Waiting for update",
              "Payment pending",
              "Technician assigned",
              "How can we help you?"
            ];
            const lastMessage = dummyMessages[i % dummyMessages.length];

            return (
              <Link key={chat.id} href={`/chat?orderId=${chat.id}`}>
                <div className="bg-white p-4 rounded-[1.5rem] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] flex items-center gap-4 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer relative border border-slate-50/50 mb-3">
                  {/* Left green active strip */}
                  {isActive && (
                    <div className="absolute left-0 top-6 bottom-6 w-1 bg-[#10B981] rounded-r-md"></div>
                  )}
                  
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ml-1 bg-[#F0F5FF]">
                    <Icon size={24} className="text-[#007AFF]" />
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-[15px] truncate">{chat.service_type || 'Service Order'}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 tracking-wide">ID: #{chat.id.slice(0, 6)}</p>
                    <p className="text-xs text-slate-500 font-medium truncate mt-1">Last message: {lastMessage}</p>
                  </div>

                  {/* Badges & Chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                      isActive 
                        ? 'bg-[#ECFDF5] text-[#10B981]' 
                        : 'bg-[#F1F5F9] text-[#94A3B8]'
                    }`}>
                      {isActive ? 'Active' : 'Inactive'}
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>}
                    </span>
                    <ChevronRight size={18} className="text-slate-400" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function ChatContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [messages, setMessages] = useState<any[]>([]);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user || !orderId) return;

    let isSubscribed = true;

    const fetchOrderAndMessages = async () => {
      if (!isSubscribed) return;
      
      const { data: order } = await insforge.database
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();
        
      if (order) setOrderStatus(order.status);

      const { data: initialMessages } = await insforge.database
        .from('messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (initialMessages) {
        setMessages(initialMessages);
      }
      setLoading(false);
    };

    fetchOrderAndMessages();
    const pollInterval = setInterval(fetchOrderAndMessages, 2000);

    insforge.realtime.subscribe(`chat_${orderId}`).catch(console.warn);
    const handleRealtime = (msg: any) => {
      if (msg?.channel === `chat_${orderId}` && msg?.payload) {
        setMessages((current) => {
          if (current.some(m => m.id === msg.payload.id)) return current;
          return [...current, msg.payload];
        });
        setTimeout(scrollToBottom, 100);
      }
    };
    insforge.realtime.on('new_message', handleRealtime);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
      insforge.realtime.off('new_message', handleRealtime);
      insforge.realtime.unsubscribe(`chat_${orderId}`);
    };
  }, [user, orderId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isActive = ['shipping', 'in_progress'].includes(orderStatus || '');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !orderId || !isActive) return;

    const msgText = newMessage.trim();
    setNewMessage(''); // optimistic clear

    const { data, error } = await insforge.database
      .from('messages')
      .insert({
        order_id: orderId,
        sender_id: user.id,
        message_text: msgText
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message.');
    } else if (data) {
      insforge.realtime.publish(`chat_${orderId}`, 'new_message', data).catch(console.warn);
      setMessages((current) => [...current, data]);
      setTimeout(scrollToBottom, 100);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[100dvh] bg-[#F8F9FA] max-w-2xl mx-auto border-x shadow-2xl overflow-hidden">
        <div className="bg-white px-4 py-4 border-b flex items-center justify-between shadow-sm z-10 sticky top-0 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse"></div>
            <div className="space-y-1">
              <div className="h-4 w-32 bg-slate-200 rounded-full animate-pulse"></div>
              <div className="h-2 w-16 bg-slate-100 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 animate-pulse"></div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          <div className="flex flex-col items-start"><div className="w-2/3 h-12 bg-white rounded-2xl rounded-bl-none shadow-sm animate-pulse border border-slate-100"></div></div>
          <div className="flex flex-col items-end"><div className="w-1/2 h-16 bg-[#007AFF]/20 rounded-2xl rounded-br-none shadow-sm animate-pulse"></div></div>
          <div className="flex flex-col items-start"><div className="w-3/4 h-20 bg-white rounded-2xl rounded-bl-none shadow-sm animate-pulse border border-slate-100"></div></div>
        </div>
        <div className="bg-white p-4 border-t sticky bottom-0 shrink-0 pb-safe">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-12 bg-slate-50 rounded-full animate-pulse"></div>
            <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F8F9FA] text-[#0F172A] max-w-2xl mx-auto border-x shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b flex items-center justify-between shadow-sm z-10 sticky top-0 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight uppercase tracking-tight flex items-center gap-2">
              Mission Chat
              {isActive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
            </h1>
            <p className="text-xs text-slate-400 font-mono">ID: #{orderId?.slice(0, 6)}</p>
          </div>
        </div>
        <button 
          onClick={() => alert("Call functionality requires 3rd party integration (Twilio) and is currently on hold.")}
          className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[#007AFF] hover:bg-blue-50 transition border border-blue-100"
        >
          <Phone size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bg-[#F8FAFC]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-40 text-center mt-20">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">No Messages Yet</p>
            <p className="text-xs mt-1 text-slate-400">Start the conversation below.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[85%] md:max-w-[75%] px-4 py-2.5 rounded-2xl ${
                    isMe 
                      ? 'bg-[#007AFF] text-white rounded-br-none shadow-[0_4px_10px_-4px_rgba(0,122,255,0.5)]' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="text-[15px]">{msg.message_text}</p>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest px-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t sticky bottom-0 shrink-0 pb-safe">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isActive ? "Type a message..." : "This chat is no longer active."}
            disabled={!isActive}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-[15px] outline-none focus:border-[#007AFF] focus:bg-white transition-all shadow-inner disabled:opacity-70 disabled:cursor-not-allowed"
          />
          <button 
            type="submit"
            disabled={!isActive || !newMessage.trim()}
            className="w-12 h-12 rounded-full bg-[#007AFF] text-white flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-[0_4px_12px_-4px_rgba(0,122,255,0.4)] shrink-0"
          >
            <Send size={18} className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}

function ChatWrapper() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return <ChatList />;
  }

  return <ChatContent />;
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#007AFF] animate-spin" />
      </div>
    }>
      <ChatWrapper />
    </Suspense>
  );
}
