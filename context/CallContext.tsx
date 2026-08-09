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
  isSpeakerOn: boolean;
  micPermissionError: string | null;
  remoteAudioRef: React.RefObject<HTMLAudioElement | null>;
  startCall: (orderId: string, callerRole?: 'customer' | 'worker', participantOverride?: CallParticipant) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  dismissError: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callData, setCallData] = useState<CallData | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
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

    // High-Frequency 1-Second DB Sync for Instant Call State Handshake
    const dbPollInterval = setInterval(async () => {
      if (!userKey) return;

      try {
        // If caller is in outgoing ringing state, check if receiver accepted or declined
        if (callStatus === 'outgoing' && callData?.sessionId) {
          const { data: session } = await insforge.database
            .from('call_sessions')
            .select('status, sdp_answer')
            .eq('id', callData.sessionId)
            .single();

          if (session) {
            if (session.status === 'accepted') {
              stopRingtoneLoop();
              setCallStatus('connected');

              if (session.sdp_answer && peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'stable') {
                try {
                  await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(session.sdp_answer));
                } catch (e) {
                  console.warn('Set remote sdp_answer error:', e);
                }
              }
            } else if (['declined', 'ended', 'missed', 'cancelled'].includes(session.status)) {
              stopRingtoneLoop();
              setCallStatus('ended');
              cleanupCall();
              setTimeout(() => {
                setCallStatus('idle');
                setCallData(null);
              }, 1500);
            }
          }
        }

        // If receiver is in incoming ringing state or active connected call, check if caller hung up
        if ((callStatus === 'incoming' || callStatus === 'connected') && callData?.sessionId) {
          const { data: session } = await insforge.database
            .from('call_sessions')
            .select('status')
            .eq('id', callData.sessionId)
            .single();

          if (session && ['ended', 'declined', 'cancelled'].includes(session.status)) {
            stopRingtoneLoop();
            setCallStatus('ended');
            cleanupCall();
            setTimeout(() => {
              setCallStatus('idle');
              setCallData(null);
            }, 1500);
          }
        }

        // If idle, check for incoming ringing sessions targeted at user
        if (callStatus === 'idle') {
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
        }
      } catch (err) {
        console.warn('Call DB poll sync error:', err);
      }
    }, 1000);

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

  // Request Microphone Stream safely with Echo Cancellation & Noise Suppression
  const getMicrophoneStream = async (): Promise<MediaStream | null> => {
    try {
      setMicPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
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
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(err => console.warn('Remote audio play error:', err));
        }
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
        if (remoteAudioRef.current) {
          remoteAudioRef.current.play().catch(console.warn);
        }
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
      // Create local PeerConnection & SDP Offer BEFORE creating API session
      const tempPc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = tempPc;

      stream.getTracks().forEach(track => tempPc.addTrack(track, stream));

      tempPc.ontrack = (event) => {
        if (event.streams && event.streams[0] && remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(console.warn);
        }
      };

      const offer = await tempPc.createOffer();
      await tempPc.setLocalDescription(offer);

      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          caller_id: user?.id || user?.email,
          caller_role: callerRole,
          sdp_offer: offer
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

      // Handle ICE Candidates for created tempPc
      tempPc.onicecandidate = (event) => {
        if (event.candidate) {
          insforge.realtime.publish(`call_room_${session.id}`, 'ice_candidate', {
            candidate: event.candidate,
            userId: user?.id || user?.email
          }).catch(console.warn);
        }
      };

      tempPc.onconnectionstatechange = () => {
        if (tempPc.connectionState === 'connected') {
          stopRingtoneLoop();
          setCallStatus('connected');
          if (remoteAudioRef.current) remoteAudioRef.current.play().catch(console.warn);
        } else if (['disconnected', 'failed', 'closed'].includes(tempPc.connectionState)) {
          cleanupCall();
          setCallStatus('ended');
          setTimeout(() => {
            setCallStatus('idle');
            setCallData(null);
          }, 1500);
        }
      };

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
        if (msg?.channel === roomTopic && msg?.payload?.answer && tempPc.signalingState !== 'stable') {
          tempPc.setRemoteDescription(new RTCSessionDescription(msg.payload.answer)).then(() => {
            stopRingtoneLoop();
            setCallStatus('connected');
            if (remoteAudioRef.current) remoteAudioRef.current.play().catch(console.warn);
          }).catch(console.warn);
        }
      };

      const handleIceCandidate = (msg: any) => {
        if (msg?.channel === roomTopic && msg?.payload?.candidate && msg.payload.userId !== (user?.id || user?.email)) {
          tempPc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate)).catch(console.warn);
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
      // Unblock HTML5 Audio Playback in click gesture
      if (remoteAudioRef.current) {
        remoteAudioRef.current.play().catch(console.warn);
      }

      // Fetch sdp_offer from DB session
      const { data: dbSession } = await insforge.database
        .from('call_sessions')
        .select('sdp_offer')
        .eq('id', callData.sessionId)
        .single();

      const pc = createPeerConnection(callData.sessionId);
      const roomTopic = `call_room_${callData.sessionId}`;

      insforge.realtime.subscribe(roomTopic).catch(console.warn);

      if (dbSession?.sdp_offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(dbSession.sdp_offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await fetch('/api/calls', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ call_id: callData.sessionId, status: 'accepted', sdp_answer: answer })
        });

        insforge.realtime.publish(roomTopic, 'sdp_answer', { answer }).catch(console.warn);
      } else {
        await fetch('/api/calls', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ call_id: callData.sessionId, status: 'accepted' })
        });
      }

      const handleIceCandidate = (msg: any) => {
        if (msg?.channel === roomTopic && msg?.payload?.candidate && msg.payload.userId !== (user?.id || user?.email)) {
          pc.addIceCandidate(new RTCIceCandidate(msg.payload.candidate)).catch(console.warn);
        }
      };

      insforge.realtime.on('ice_candidate', handleIceCandidate);

      stopRingtoneLoop();
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

  // 6. TOGGLE LOUDSPEAKER
  const toggleSpeaker = async () => {
    const nextState = !isSpeakerOn;
    setIsSpeakerOn(nextState);

    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = nextState ? 1.0 : 0.4;
      try {
        if ('setSinkId' in remoteAudioRef.current) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const outputs = devices.filter(d => d.kind === 'audiooutput');
          const target = nextState 
            ? (outputs.find(d => d.label.toLowerCase().includes('speaker') || d.label.toLowerCase().includes('loudspeaker')) || outputs[0])
            : (outputs.find(d => d.label.toLowerCase().includes('earpiece') || d.label.toLowerCase().includes('headset')) || outputs[0]);

          if (target) {
            await (remoteAudioRef.current as any).setSinkId(target.deviceId);
          }
        }
      } catch (e) {
        console.warn('Toggle speaker error:', e);
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
        isSpeakerOn,
        micPermissionError,
        remoteAudioRef,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleSpeaker,
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
