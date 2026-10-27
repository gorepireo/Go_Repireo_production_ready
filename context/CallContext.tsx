'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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

// WebRTC STUN & TURN Relay Server Config for 4G/5G Cellular NAT Traversal
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callData, setCallData] = useState<CallData | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  // WebRTC & Audio Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const addedCandidatesRef = useRef<Set<string>>(new Set());

  // Play synthetic Ringtone via Web Audio API
  const playRingtone = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
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
    } catch {
      // AudioContext unavailable
    }
  }, []);

  const startRingtoneLoop = useCallback(() => {
    playRingtone();
    ringtoneTimerRef.current = setInterval(playRingtone, 2500);
  }, [playRingtone]);

  const stopRingtoneLoop = useCallback(() => {
    if (ringtoneTimerRef.current) {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
  }, []);

  // Cleanup WebRTC & Streams
  const cleanupCall = useCallback(() => {
    stopRingtoneLoop();

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch {}
      peerConnectionRef.current = null;
    }

    addedCandidatesRef.current.clear();
    setIsMuted(false);
  }, [stopRingtoneLoop]);

  // Safe ICE Candidate Addition
  const addIceCandidateSafely = useCallback(async (candidateData: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current || !candidateData) return;
    const key = JSON.stringify(candidateData);
    if (addedCandidatesRef.current.has(key)) return;
    addedCandidatesRef.current.add(key);

    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidateData));
    } catch {
      // Candidate rejected
    }
  }, []);

  // Request Microphone Stream safely
  const getMicrophoneStream = async (): Promise<MediaStream | null> => {
    try {
      setMicPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = stream;
      return stream;
    } catch (err: unknown) {
      const error = err as { name?: string };
      const msg =
        error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings to make voice calls.'
          : 'Microphone is unavailable on your device.';
      setMicPermissionError(msg);
      return null;
    }
  };

  // 1. INITIATE CALL (OUTGOING)
  const startCall = async (
    orderId: string,
    callerRole: 'customer' | 'worker' = 'customer',
    participantOverride?: CallParticipant
  ) => {
    if (callStatus !== 'idle') return;

    // Unblock Audio Element Playback in click gesture
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch(() => {});
    }

    const stream = await getMicrophoneStream();
    if (!stream) return;

    try {
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      // Add sendrecv transceiver for 2-way audio
      pc.addTransceiver('audio', { direction: 'sendrecv' });

      // Attach microphone tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Receive remote audio track
      pc.ontrack = (event) => {
        const remoteStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.volume = 1.0;
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      // Create SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          order_id: orderId,
          caller_role: callerRole,
          sdp_offer: offer,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMicPermissionError(data.error || 'Unable to start in-app voice call.');
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
        participant: targetParticipant,
      });

      setCallStatus('outgoing');
      startRingtoneLoop();

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/calls', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              call_id: session.id,
              candidate: event.candidate,
            }),
          }).catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          stopRingtoneLoop();
          setCallStatus('connected');
          if (remoteAudioRef.current) {
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.play().catch(() => {});
          }
        }
      };
    } catch {
      setMicPermissionError('In-app call failed to connect.');
      cleanupCall();
    }
  };

  // 2. ACCEPT INCOMING CALL
  const acceptCall = async () => {
    if (!callData || callStatus !== 'incoming') return;

    stopRingtoneLoop();

    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch(() => {});
    }

    const stream = await getMicrophoneStream();
    if (!stream) {
      declineCall();
      return;
    }

    try {
      // Fetch session offer from API
      const res = await fetch(`/api/calls?sessionId=${callData.sessionId}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.session?.sdpOffer) {
        throw new Error('Call offer is no longer valid');
      }

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      pc.addTransceiver('audio', { direction: 'sendrecv' });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        const remoteStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.volume = 1.0;
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/calls', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              call_id: callData.sessionId,
              candidate: event.candidate,
            }),
          }).catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          stopRingtoneLoop();
          setCallStatus('connected');
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(data.session.sdpOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await fetch('/api/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          call_id: callData.sessionId,
          status: 'accepted',
          sdp_answer: answer,
        }),
      });

      setCallStatus('connected');

      // Add already generated ICE candidates
      if (Array.isArray(data.session.iceCandidates)) {
        for (const c of data.session.iceCandidates) {
          if (c.candidate) addIceCandidateSafely(c.candidate);
        }
      }
    } catch {
      cleanupCall();
      setCallStatus('idle');
      setCallData(null);
    }
  };

  // 3. DECLINE INCOMING CALL
  const declineCall = async () => {
    if (callData?.sessionId) {
      fetch('/api/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ call_id: callData.sessionId, status: 'declined' }),
      }).catch(() => {});
    }

    stopRingtoneLoop();
    setCallStatus('ended');
    cleanupCall();
    setTimeout(() => {
      setCallStatus('idle');
      setCallData(null);
    }, 1500);
  };

  // 4. END ACTIVE CALL
  const endCall = async () => {
    if (callData?.sessionId) {
      fetch('/api/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ call_id: callData.sessionId, status: 'ended' }),
      }).catch(() => {});
    }

    stopRingtoneLoop();
    setCallStatus('ended');
    cleanupCall();
    setTimeout(() => {
      setCallStatus('idle');
      setCallData(null);
    }, 1500);
  };

  // Toggle Mute Local Mic
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Speakerphone
  const toggleSpeaker = async () => {
    const nextState = !isSpeakerOn;
    setIsSpeakerOn(nextState);
  };

  const dismissError = () => {
    setMicPermissionError(null);
  };

  // Signaling Polling Loop
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        // A: If in active call, poll session for answer, remote candidates, or termination
        if (callData?.sessionId && ['outgoing', 'incoming', 'connected'].includes(callStatus)) {
          const res = await fetch(`/api/calls?sessionId=${callData.sessionId}`, { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            const session = data.session;
            if (!session) return;

            if (['ended', 'declined', 'cancelled'].includes(session.status)) {
              stopRingtoneLoop();
              setCallStatus('ended');
              cleanupCall();
              setTimeout(() => {
                setCallStatus('idle');
                setCallData(null);
              }, 1500);
              return;
            }

            // Caller side: check if receiver accepted call
            if (callStatus === 'outgoing' && session.status === 'accepted') {
              stopRingtoneLoop();
              setCallStatus('connected');

              if (
                session.sdpAnswer &&
                peerConnectionRef.current &&
                peerConnectionRef.current.signalingState !== 'stable'
              ) {
                try {
                  await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(session.sdpAnswer));
                  if (remoteAudioRef.current) {
                    remoteAudioRef.current.volume = 1.0;
                    remoteAudioRef.current.play().catch(() => {});
                  }
                } catch {}
              }
            }

            // Process remote ICE Candidates
            if (Array.isArray(session.iceCandidates)) {
              for (const candItem of session.iceCandidates) {
                if (candItem.candidate && candItem.userId !== user.uid) {
                  addIceCandidateSafely(candItem.candidate);
                }
              }
            }
          }
        }

        // B: If idle, check if an incoming call is ringing for this user
        if (callStatus === 'idle') {
          const res = await fetch('/api/calls?checkIncoming=true', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            if (data.incomingCall) {
              const incoming = data.incomingCall;
              setCallData({
                sessionId: incoming.sessionId,
                orderId: incoming.orderId,
                roomId: incoming.roomId,
                initiatedBy: incoming.initiatedBy,
                participant: incoming.participant,
              });
              setCallStatus('incoming');
              startRingtoneLoop();
            }
          }
        }
      } catch {
        // Polling loop error ignored
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [user, callStatus, callData?.sessionId, startRingtoneLoop, stopRingtoneLoop, cleanupCall, addIceCandidateSafely]);

  // Handle Call Timer on Connect
  useEffect(() => {
    if (callStatus === 'connected') {
      setDurationSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [callStatus]);

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
        dismissError,
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
