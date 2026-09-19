'use client';

import React from 'react';
import { useCall } from '@/context/CallContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  AlertTriangle, 
  Lock
} from 'lucide-react';

export default function WebRTCCallModal() {
  const {
    callStatus,
    callData,
    durationSeconds,
    isMuted,
    isSpeakerOn,
    micPermissionError,
    remoteAudioRef,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    dismissError
  } = useCall();

  // Format Duration Timer (00:00)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const participantName = callData?.participant?.name || 'Service Expert';
  const participantRole = callData?.participant?.role || 'Assigned Expert';
  const participantAvatar = callData?.participant?.avatar || '/hero_technician_banner.png';
  const orderIdText = callData?.orderId ? `#GR-${callData.orderId.slice(0, 4).toUpperCase()}` : 'Order Communication';

  return (
    <>
      {/* HTML5 Remote Audio Element ALWAYS Mounted in DOM (Opacity 0.01 to prevent iOS/Android autoplay throttling) */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '1px',
          height: '1px',
          opacity: 0.01,
          pointerEvents: 'none',
          zIndex: -1
        }}
      />

      <AnimatePresence>
        {/* 1. Microphone Permission Error Banner / Alert */}
        {micPermissionError && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-100 shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">Microphone Required</h3>
                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                  {micPermissionError}
                </p>
              </div>
              <button
                onClick={dismissError}
                className="w-full py-3 bg-[#007AFF] hover:bg-blue-600 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all"
              >
                Understand & Dismiss
              </button>
            </motion.div>
          </div>
        )}

        {/* 2. Active Voice Call Screen Overlay */}
        {callStatus !== 'idle' && (
          <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="bg-white/95 rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 border border-white/40 shadow-2xl space-y-6 text-center overflow-hidden relative"
            >
              {/* Private Phone Security Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-[#007AFF] border border-blue-100 text-[9px] font-black uppercase tracking-widest mx-auto">
                <Lock size={11} />
                <span>Private In-App Voice Call (No Phone Numbers Exposed)</span>
              </div>

              {/* Profile Avatar with Pulsing Rings */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                {['outgoing', 'incoming', 'connected'].includes(callStatus) && (
                  <div className={`absolute inset-0 rounded-full border-2 ${
                    callStatus === 'connected' ? 'border-emerald-500/40 animate-ping' : 'border-[#007AFF]/40 animate-ping'
                  }`} />
                )}
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl relative z-10 bg-slate-100">
                  <img 
                    src={participantAvatar} 
                    alt={participantName} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { (e.target as HTMLImageElement).src = '/hero_technician_banner.png'; }}
                  />
                </div>
              </div>

              {/* Participant Information */}
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{participantName}</h3>
                <p className="text-xs font-extrabold text-[#007AFF] uppercase tracking-wider">{participantRole}</p>
                <p className="text-[10px] font-medium text-slate-400">{orderIdText}</p>
              </div>

              {/* Call Status / Timer Display */}
              <div className="py-2">
                {callStatus === 'outgoing' && (
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-slate-600 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-[#007AFF] animate-pulse" />
                    <span>Calling technician...</span>
                  </div>
                )}

                {callStatus === 'incoming' && (
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" />
                    <span>Incoming Voice Call...</span>
                  </div>
                )}

                {callStatus === 'connected' && (
                  <div className="space-y-1">
                    <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                      {formatTimer(durationSeconds)}
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">
                      ● Encrypted 2-Way Voice Connected
                    </span>
                  </div>
                )}

                {callStatus === 'ended' && (
                  <div className="text-xs font-black text-red-500 uppercase tracking-widest">
                    Call Ended
                  </div>
                )}
              </div>

              {/* Interactive Call Controls */}
              <div className="pt-2 flex items-center justify-center gap-4">
                {/* Outgoing State Controls */}
                {callStatus === 'outgoing' && (
                  <button
                    onClick={endCall}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-95 transition-all"
                    aria-label="Cancel Call"
                  >
                    <PhoneOff size={24} />
                  </button>
                )}

                {/* Incoming State Controls */}
                {callStatus === 'incoming' && (
                  <>
                    <button
                      onClick={declineCall}
                      className="w-16 h-16 rounded-full bg-slate-100 hover:bg-red-50 text-red-600 border border-slate-200 flex items-center justify-center shadow-md active:scale-95 transition-all"
                      aria-label="Decline Call"
                    >
                      <PhoneOff size={24} />
                    </button>
                    <button
                      onClick={acceptCall}
                      className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-all animate-bounce"
                      aria-label="Accept Call"
                    >
                      <Phone size={24} className="fill-current" />
                    </button>
                  </>
                )}

                {/* Connected Active Call Controls */}
                {callStatus === 'connected' && (
                  <>
                    <button
                      onClick={toggleMute}
                      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all ${
                        isMuted 
                          ? 'bg-amber-500 text-white shadow-amber-500/30' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                      title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                    >
                      {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>

                    <button
                      onClick={endCall}
                      className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-95 transition-all"
                      aria-label="End Call"
                      title="End Call"
                    >
                      <PhoneOff size={24} />
                    </button>

                    <button
                      onClick={toggleSpeaker}
                      className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all ${
                        isSpeakerOn 
                          ? 'bg-blue-600 text-white shadow-blue-500/30' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      aria-label={isSpeakerOn ? 'Loudspeaker On' : 'Loudspeaker Off'}
                      title={isSpeakerOn ? 'Loudspeaker On' : 'Earpiece / Soft Mode'}
                    >
                      {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
