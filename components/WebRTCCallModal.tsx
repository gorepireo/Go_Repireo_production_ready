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
  ShieldCheck
} from 'lucide-react';

export default function WebRTCCallModal() {
  const {
    callStatus,
    callData,
    durationSeconds,
    isMuted,
    isSpeakerOn,
    isRemoteSpeaking,
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

  const participantName = callData?.participant?.name || 'Service Partner';
  const participantRole = callData?.participant?.role || 'Service Specialist';
  const participantAvatar = callData?.participant?.avatar || '/hero_technician_banner.png';
  const orderIdText = callData?.orderId ? `#GR-${callData.orderId.slice(0, 4).toUpperCase()}` : 'Order VoIP';

  return (
    <>
      {/* HTML5 Remote Audio Element ALWAYS Mounted in DOM for low-latency WebRTC playback */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '10px',
          height: '10px',
          pointerEvents: 'none',
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
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-gradient-to-b from-white via-white to-slate-50 rounded-[2.5rem] max-w-sm w-full p-6 sm:p-8 border border-white/60 shadow-2xl space-y-6 text-center overflow-hidden relative"
            >
              {/* Private In-App Call Security Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 text-[#007AFF] border border-blue-100 text-[9.5px] font-black uppercase tracking-wider mx-auto">
                <ShieldCheck size={12} className="text-[#007AFF]" />
                <span>Private In-App Call &middot; No Numbers Shared</span>
              </div>

              {/* Profile Avatar with Real Voice Wave Pulse */}
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                {/* Outgoing or Incoming Ringing Ripple */}
                {['outgoing', 'incoming'].includes(callStatus) && (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-[#007AFF]/40 animate-ping" />
                    <div className="absolute inset-[-8px] rounded-full border border-blue-300/30 animate-pulse" />
                  </>
                )}

                {/* Live Speaking Voice Wave Animation */}
                {callStatus === 'connected' && isRemoteSpeaking && (
                  <>
                    <div className="absolute inset-[-10px] rounded-full bg-emerald-400/25 animate-ping" />
                    <div className="absolute inset-[-4px] rounded-full border-2 border-emerald-500 animate-pulse" />
                  </>
                )}

                <div className={`w-28 h-28 rounded-full overflow-hidden border-4 shadow-xl relative z-10 bg-slate-100 transition-all ${
                  callStatus === 'connected' && isRemoteSpeaking ? 'border-emerald-500 scale-105' : 'border-white'
                }`}>
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

              {/* Call Status & Live Speech Feedback */}
              <div className="py-1">
                {callStatus === 'outgoing' && (
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-slate-600 uppercase tracking-widest">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF] animate-ping" />
                    <span>Calling...</span>
                  </div>
                )}

                {callStatus === 'incoming' && (
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-widest">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" />
                    <span>Incoming Voice Call...</span>
                  </div>
                )}

                {callStatus === 'connected' && (
                  <div className="space-y-2">
                    <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                      {formatTimer(durationSeconds)}
                    </div>
                    {isRemoteSpeaking ? (
                      <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-extrabold text-xs">
                        <span className="flex items-center gap-0.5">
                          <span className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce" />
                          <span className="w-1 h-4 bg-emerald-500 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                        <span>Speaking...</span>
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>HD Voice Connected</span>
                      </div>
                    )}
                  </div>
                )}

                {callStatus === 'ended' && (
                  <div className="text-xs font-black text-red-500 uppercase tracking-widest">
                    Call Ended
                  </div>
                )}
              </div>

              {/* Interactive Telephony Action Controls */}
              <div className="pt-2">
                {/* Outgoing State Controls */}
                {callStatus === 'outgoing' && (
                  <div className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={endCall}
                      className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 active:scale-95 transition-all"
                      aria-label="Cancel Call"
                    >
                      <PhoneOff size={24} />
                    </button>
                    <span className="text-[10px] font-bold text-slate-500">Cancel</span>
                  </div>
                )}

                {/* Incoming State Controls */}
                {callStatus === 'incoming' && (
                  <div className="flex items-center justify-around px-4">
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={declineCall}
                        className="w-16 h-16 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center shadow-md active:scale-95 transition-all"
                        aria-label="Decline Call"
                      >
                        <PhoneOff size={24} />
                      </button>
                      <span className="text-[10px] font-bold text-slate-500">Decline</span>
                    </div>

                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={acceptCall}
                        className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 active:scale-95 transition-all animate-bounce"
                        aria-label="Accept Call"
                      >
                        <Phone size={24} className="fill-current" />
                      </button>
                      <span className="text-[10px] font-bold text-emerald-700">Accept</span>
                    </div>
                  </div>
                )}

                {/* Connected Active Call Controls */}
                {callStatus === 'connected' && (
                  <div className="flex items-center justify-around px-2">
                    {/* Mute Button */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={toggleMute}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all ${
                          isMuted 
                            ? 'bg-amber-500 text-white shadow-amber-500/30' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                      </button>
                      <span className="text-[9.5px] font-bold text-slate-500">
                        {isMuted ? 'Muted' : 'Mute'}
                      </span>
                    </div>

                    {/* End Call Button */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={endCall}
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xl shadow-red-500/40 active:scale-95 transition-all"
                        aria-label="End Call"
                      >
                        <PhoneOff size={24} />
                      </button>
                      <span className="text-[9.5px] font-black text-red-600">End</span>
                    </div>

                    {/* Speaker Button */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={toggleSpeaker}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all ${
                          isSpeakerOn 
                            ? 'bg-blue-600 text-white shadow-blue-500/30' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                        aria-label={isSpeakerOn ? 'Loudspeaker On' : 'Loudspeaker Off'}
                      >
                        {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                      </button>
                      <span className="text-[9.5px] font-bold text-slate-500">
                        {isSpeakerOn ? 'Speaker' : 'Earpiece'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
