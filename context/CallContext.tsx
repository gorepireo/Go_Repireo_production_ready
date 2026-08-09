'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { insforge } from '@/lib/insforge';
import { useAuth } from '@/context/AuthContext';

export interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  service?: string;
}

export interface CallData {
  sessionId: string;
  orderId: string;
  roomId: string;
  initiatedBy: 'customer' | 'worker';
  participant: CallParticipant;
}

type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'connected' | 'ended';

interface CallContextType {
  callStatus: CallStatus;
  callData: CallData | null;
  durationSeconds: number;
  isMuted: boolean;
  micPermissionError: string | null;
  startCall: (orderId: string, callerRole?: 'customer' | 'worker', participantOverride?: CallParticipant) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  dismissError: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callData, setCallData] = useState<CallData | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  // WebRTC & Audio Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // WebRTC STUN Config
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
    ]
  };

  // Play synthetic Ringtone via Web Audio API
  const playRingtone = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn('Ringtone sound error:', e);
    }
  };

  const startRingtoneLoop = () => {
    playRingtone();
    ringtoneTimerRef.current = setInterval(playRingtone, 2500);
  };

  const stopRingtoneLoop = () => {
    if (ringtoneTimerRef.current) {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
  };

  // Cleanup WebRTC & Streams
  const cleanupCall = () => {
    stopRingtoneLoop();

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsMuted(false);
  };

  // InsForge Realtime Subscription for incoming call signaling
  useEffect(() => {
    if (!user?.id && !user?.email) return;

    const userKey = user?.id || user?.email;
    const globalTopic = 'global_voice_calls';

    insforge.realtime.subscribe(globalTopic).catch(console.warn);

    const handleIncomingCall = (msg: any) => {
      if (msg?.channel === globalTopic && msg?.payload) {
        const data = msg.payload;
        if (data.targetUserId === userKey || data.targetEmail === user?.email) {
          if (callStatus === 'idle') {
            setCallData({
              sessionId: data.sessionId,
              orderId: data.orderId,
              roomId: data.roomId,
              initiatedBy: data.initiatedBy,
              participant: data.callerParticipant
            });
            setCallStatus('incoming');
            startRingtoneLoop();
          }
        }
      }
    };

    const handleCallEnded = (msg: any) => {
      if (msg?.channel === globalTopic && msg?.payload) {
        const data = msg.payload;
        if (data?.sessionId && callData?.sessionId === data.sessionId) {
          setCallStatus('ended');
          cleanupCall();
          setTimeout(() => {
            setCallStatus('idle');
            setCallData(null);
          }, 1500);
        }
      }
    };

    insforge.realtime.on('incoming_call', handleIncomingCall);
    insforge.realtime.on('call_ended', handleCallEnded);

    // DB Polling Fallback for active ringing call sessions
    const dbPollInterval = setInterval(async () => {
      if (callStatus === 'idle' && (user?.id || user?.email)) {
        try {
          const { data: ringingSessions } = await insforge.database
            .from('call_sessions')
            .select('*')
            .eq('status', 'ringing')
            .or(`customer_id.eq.${userKey},worker_id.eq.${userKey}`)
            .order('created_at', { ascending: false })
            .limit(1);

          if (ringingSessions && ringingSessions.length > 0) {
            const session = ringingSessions[0];
            const isCaller = session.initiated_by === 'customer' ? (userKey === session.customer_id) : (userKey === session.worker_id);
            if (!isCaller) {
              setCallData({
                sessionId: session.id,
                orderId: session.order_id,
                roomId: session.room_id,
                initiatedBy: session.initiated_by,
                participant: {
                  id: session.initiated_by === 'customer' ? session.customer_id : session.worker_id,
                  name: session.initiated_by === 'customer' ? 'Customer' : 'Assigned Expert',
                  avatar: session.initiated_by === 'customer' ? '/customer_3d.png' : '/hero_technician_banner.png',
                  role: session.initiated_by === 'customer' ? 'Customer' : 'Assigned Expert'
                }
              });
              setCallStatus('incoming');
              startRingtoneLoop();
            }
          }
        } catch (err) {
          console.warn('Call DB poll error:', err);
        }
      }
    }, 3000);

    return () => {
      clearInterval(dbPollInterval);
      insforge.realtime.off('incoming_call', handleIncomingCall);
      insforge.realtime.off('call_ended', handleCallEnded);
      insforge.realtime.unsubscribe(globalTopic);
    };
  }, [user, callStatus, callData?.sessionId]);

  // Handle Call Timer on Connect
  useEffect(() => {
    if (callStatus === 'connected') {
      setDurationSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, [callStatus]);

  // Request Microphone Stream safely
  const getMicrophoneStream = async (): Promise<MediaStream | null> => {
    try {
      setMicPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      return stream;
    } catch (err: any) {
      console.error('Microphone access denied/error:', err);
      const msg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Microphone permission denied. Please allow microphone access in your browser settings to make voice calls.'
        : 'Microphone is missing or unavailable on your device.';
      setMicPermissionError(msg);
      return null;
    }
  };

  // Create WebRTC Peer Connection
  const createPeerConnection = (sessionId: string) => {
    const pc = new RTCPeerConnection(rtcConfig);
    peerConnectionRef.current = pc;

    // Attach local audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote audio stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        if (!remoteAudioRef.current) {
          const audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          audioEl.style.display = 'none';
          document.body.appendChild(audioEl);
          remoteAudioRef.current = audioEl;
        }
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        insforge.realtime.publish(`call_room_${sessionId}`, 'ice_candidate', {
          candidate: event.candidate,
          userId: user?.id || user?.email
        }).catch(console.warn);
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        stopRingtoneLoop();
        setCallStatus('connected');
      } else if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        cleanupCall();
        setCallStatus('ended');
        setTimeout(() => {
          setCallStatus('idle');
          setCallData(null);
        }, 1500);
      }
    };

    return pc;
  };

  // 1. INITIATE CALL (OUTGOING)
  const startCall = async (orderId: string, callerRole: 'customer' | 'worker' = 'customer', participantOverride?: CallParticipant) => {
    if (callStatus !== 'idle') return;

    // Check Mic Permission first
    const stream = await getMicrophoneStream();
    if (!stream) return;

    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          caller_id: user?.id || user?.email,
          caller_role: callerRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setMicPermissionError(data.error || 'Unable to start voice call');
        cleanupCall();
        return;
      }

      const session = data.callSession;
      const targetParticipant = participantOverride || session.participant;

      setCallData({
        sessionId: session.id,
        orderId: session.order_id,
        roomId: session.room_id,
        initiatedBy: callerRole,
        participant: targetParticipant
      });

      setCallStatus('outgoing');
      startRingtoneLoop();

      // Create Peer Connection & SDP Offer
      const pc = createPeerConnection(session.id);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Broadcast incoming call event to recipient via InsForge Realtime
      insforge.realtime.publish('global_voice_calls', 'incoming_call', {
        sessionId: session.id,
        orderId: session.order_id,
        roomId: session.room_id,
        initiatedBy: callerRole,
        targetUserId: targetParticipant.id,
        callerParticipant: {
          id: user?.id || user?.email,
          name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer',
          avatar: user?.user_metadata?.avatar_url || '/customer_3d.png',
          role: callerRole === 'customer' ? 'Customer' : 'Assigned Expert'
        }
      }).catch(console.warn);

      // Subscribe to session signaling room
      const roomTopic = `call_room_${session.id}`;
      insforge.realtime.subscribe(roomTopic).catch(console.warn);

      const handleSdpAnswer = (msg: any) => {
        if (msg?.channel === roomTopic && msg?.payload?.answer && pc.signalingState !== 'stable') {
          pc.setRemoteDescription(new RTCSessionDescription(msg.payload.answer)).then(() => {
            stopRingtoneLoop();
            setCallStatus('connected');
          }).catch(console.warn);
        }
      };

      const handleIceCandidate = (msg: any) => {
        if (msg?.channel === roomTopic && msg?.payload?.candidate && msg.payload.userId !== (user?.id || user?.email)) {
          pc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate)).catch(console.warn);
        }
      };

      const handleCallDeclined = (msg: any) => {
        if (msg?.channel === roomTopic) {
          setCallStatus('ended');
          cleanupCall();
          setTimeout(() => {
            setCallStatus('idle');
            setCallData(null);
          }, 1500);
        }
      };

      insforge.realtime.on('sdp_answer', handleSdpAnswer);
      insforge.realtime.on('ice_candidate', handleIceCandidate);
      insforge.realtime.on('call_declined', handleCallDeclined);

      // Auto Missed Call Timeout (35 seconds)
      setTimeout(() => {
        if (peerConnectionRef.current && peerConnectionRef.current.connectionState !== 'connected') {
          fetch('/api/calls', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ call_id: session.id, status: 'missed' })
          }).catch(() => {});
          setCallStatus('ended');
          cleanupCall();
          setTimeout(() => {
            setCallStatus('idle');
            setCallData(null);
          }, 1500);
        }
      }, 35000);

    } catch (err: any) {
      console.error('Call initiation failure:', err);
      setMicPermissionError('Call failed to connect');
      cleanupCall();
    }
  };

  // 2. ACCEPT INCOMING CALL
  const acceptCall = async () => {
    if (!callData || callStatus !== 'incoming') return;

    stopRingtoneLoop();

    const stream = await getMicrophoneStream();
    if (!stream) {
      declineCall();
      return;
    }

    try {
      await fetch('/api/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: callData.sessionId, status: 'accepted' })
      });

      const pc = createPeerConnection(callData.sessionId);
      const roomTopic = `call_room_${callData.sessionId}`;

      insforge.realtime.subscribe(roomTopic).catch(console.warn);

      const handleSdpOffer = async (msg: any) => {
        if (msg?.channel === roomTopic && msg?.payload?.offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.payload.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          insforge.realtime.publish(roomTopic, 'sdp_answer', { answer }).catch(console.warn);
          setCallStatus('connected');
        }
      };

      const handleIceCandidate = (msg: any) => {
        if (msg?.channel === roomTopic && msg?.payload?.candidate && msg.payload.userId !== (user?.id || user?.email)) {
          pc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate)).catch(console.warn);
        }
      };

      insforge.realtime.on('sdp_offer', handleSdpOffer);
      insforge.realtime.on('ice_candidate', handleIceCandidate);

      // Trigger caller to send SDP offer
      insforge.realtime.publish(roomTopic, 'ready_for_offer', { userId: user?.id || user?.email }).catch(console.warn);

      setCallStatus('connected');
    } catch (err) {
      console.error('Accept call error:', err);
      cleanupCall();
    }
  };

  // 3. DECLINE INCOMING CALL
  const declineCall = async () => {
    if (!callData) return;

    stopRingtoneLoop();
    try {
      await fetch('/api/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: callData.sessionId, status: 'declined', ended_by: user?.id || user?.email })
      });

      insforge.realtime.publish(`call_room_${callData.sessionId}`, 'call_declined', { call_id: callData.sessionId }).catch(console.warn);
    } catch (e) {
      console.warn('Decline error:', e);
    } finally {
      cleanupCall();
      setCallStatus('idle');
      setCallData(null);
    }
  };

  // 4. END ACTIVE CALL
  const endCall = async () => {
    if (!callData) return;

    try {
      await fetch('/api/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ call_id: callData.sessionId, status: 'ended', ended_by: user?.id || user?.email })
      });

      insforge.realtime.publish('global_voice_calls', 'call_ended', { sessionId: callData.sessionId }).catch(console.warn);
    } catch (e) {
      console.warn('End call error:', e);
    } finally {
      cleanupCall();
      setCallStatus('ended');
      setTimeout(() => {
        setCallStatus('idle');
        setCallData(null);
      }, 1500);
    }
  };

  // 5. TOGGLE MUTE
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const dismissError = () => {
    setMicPermissionError(null);
  };

  return (
    <CallContext.Provider
      value={{
        callStatus,
        callData,
        durationSeconds,
        isMuted,
        micPermissionError,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        dismissError
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
