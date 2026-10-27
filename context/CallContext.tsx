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

// Streamlined, ultra-fast STUN & TURN config (removes bloated servers that delay ICE checks)
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    {
      urls: [
        'turn:staticauth.openrelay.metered.ca:80',
        'turn:staticauth.openrelay.metered.ca:443?transport=tcp',
        'turns:staticauth.openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 2,
};

// Low-latency Opus audio SDP optimizer (forces 20ms packets, mono VoIP mode, minimizes buffer delay)
const optimizeAudioSdp = (sdp: string): string => {
  return sdp.replace(/a=fmtp:(\d+) (.*)/g, (match, pt, params) => {
    if (params.includes('minptime=')) return match;
    return `a=fmtp:${pt} ${params};stereo=0;sprop-stereo=0;maxaveragebitrate=32000;useinbandfec=1;ptime=20;maxptime=20;cbr=0`;
  });
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
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Candidate Batching & Guard Refs
  const addedCandidatesRef = useRef<Set<string>>(new Set());
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescriptionSetRef = useRef<boolean>(false);
  const myCallRoleRef = useRef<'caller' | 'callee'>('caller');
  const candidateBatchRef = useRef<RTCIceCandidateInit[]>([]);
  const candidateBatchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);

  // Initialize or resume Web Audio Context for Ringtone synthesis
  const getAudioContext = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }, []);

  // Play synthetic pleasant Ringtone
  const playRingtone = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    } catch {}
  }, [getAudioContext]);

  const startRingtoneLoop = useCallback(() => {
    playRingtone();
    ringtoneTimerRef.current = setInterval(playRingtone, 2200);
  }, [playRingtone]);

  const stopRingtoneLoop = useCallback(() => {
    if (ringtoneTimerRef.current) {
      clearInterval(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
  }, []);

  // Flush batched candidates to server immediately
  const flushCandidateBatch = useCallback(() => {
    if (!activeSessionIdRef.current || candidateBatchRef.current.length === 0) return;
    const toSend = [...candidateBatchRef.current];
    candidateBatchRef.current = [];

    fetch('/api/calls', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        call_id: activeSessionIdRef.current,
        candidates: toSend,
        role: myCallRoleRef.current,
      }),
    }).catch(() => {});
  }, []);

  const queueCandidateToSend = useCallback((cand: RTCIceCandidateInit) => {
    candidateBatchRef.current.push(cand);
    if (!candidateBatchTimerRef.current) {
      candidateBatchTimerRef.current = setTimeout(() => {
        candidateBatchTimerRef.current = null;
        flushCandidateBatch();
      }, 100); // Super responsive 100ms trickle flush
    }
  }, [flushCandidateBatch]);

  // Instant local teardown
  const cleanupCall = useCallback(() => {
    stopRingtoneLoop();

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (candidateBatchTimerRef.current) {
      clearTimeout(candidateBatchTimerRef.current);
      candidateBatchTimerRef.current = null;
    }
    candidateBatchRef.current = [];
    activeSessionIdRef.current = null;

    if (dataChannelRef.current) {
      try {
        dataChannelRef.current.close();
      } catch {}
      dataChannelRef.current = null;
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

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    remoteDescriptionSetRef.current = false;
    pendingCandidatesRef.current = [];
    addedCandidatesRef.current.clear();
    setIsMuted(false);
  }, [stopRingtoneLoop]);

  // Flush any ICE candidates that arrived before remoteDescription was set
  const flushPendingCandidates = useCallback(async () => {
    if (!peerConnectionRef.current || !remoteDescriptionSetRef.current) return;
    const pending = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];

    for (const cand of pending) {
      const key = `${cand.candidate}_${cand.sdpMid}_${cand.sdpMLineIndex}`;
      if (!addedCandidatesRef.current.has(key)) {
        addedCandidatesRef.current.add(key);
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand));
        } catch {}
      }
    }
  }, []);

  // Safe ICE Candidate Addition
  const addIceCandidateSafely = useCallback(async (candidateData: RTCIceCandidateInit) => {
    if (!candidateData || !candidateData.candidate) return;
    const key = `${candidateData.candidate}_${candidateData.sdpMid}_${candidateData.sdpMLineIndex}`;
    if (addedCandidatesRef.current.has(key)) return;

    if (!remoteDescriptionSetRef.current || !peerConnectionRef.current?.remoteDescription) {
      pendingCandidatesRef.current.push(candidateData);
      return;
    }

    addedCandidatesRef.current.add(key);
    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidateData));
    } catch {}
  }, []);

  // Request Microphone with lowest hardware buffer latency
  const getMicrophoneStream = async (): Promise<MediaStream | null> => {
    try {
      setMicPermissionError(null);
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 48000,
      };
      // Request low-latency hardware buffer on supported engines
      (audioConstraints as any).latency = 0;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false,
      });

      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });

      localStreamRef.current = stream;
      return stream;
    } catch (err: unknown) {
      const error = err as { name?: string };
      const msg =
        error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings to make in-app voice calls.'
          : 'Microphone is unavailable or busy on your device.';
      setMicPermissionError(msg);
      return null;
    }
  };

  // Route remote stream to HTML5 Audio element and configure zero-delay receiver
  const setupRemoteAudio = useCallback((remoteStream: MediaStream, pc?: RTCPeerConnection) => {
    if (pc) {
      // Force WebRTC audio receiver to use zero playout delay (no artificial jitter buffer lag)
      try {
        pc.getReceivers().forEach((receiver) => {
          if (receiver.track && receiver.track.kind === 'audio') {
            const anyReceiver = receiver as any;
            if ('playoutDelayHint' in anyReceiver) {
              anyReceiver.playoutDelayHint = 0;
            }
          }
        });
      } catch {}
    }

    if (!remoteAudioRef.current) return;
    const audioEl = remoteAudioRef.current;
    
    audioEl.srcObject = remoteStream;
    audioEl.muted = false;
    audioEl.volume = 1.0;

    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const unblock = () => {
          audioEl.play().catch(() => {});
          window.removeEventListener('click', unblock);
          window.removeEventListener('touchstart', unblock);
        };
        window.addEventListener('click', unblock, { once: true });
        window.addEventListener('touchstart', unblock, { once: true });
      });
    }
  }, []);

  // Instant remote hangup handler (triggered via DataChannel in 1ms)
  const handleRemoteHangup = useCallback(() => {
    stopRingtoneLoop();
    setCallStatus('ended');
    cleanupCall();
    setTimeout(() => {
      setCallStatus('idle');
      setCallData(null);
    }, 400); // Snappy 400ms dismissal
  }, [stopRingtoneLoop, cleanupCall]);

  // Set up Instant DataChannel for 0-latency call control signaling
  const setupDataChannel = (pc: RTCPeerConnection) => {
    const dc = pc.createDataChannel('repireo-call-control', { negotiated: true, id: 0 });
    dataChannelRef.current = dc;
    dc.onmessage = (event) => {
      if (event.data === 'HANGUP') {
        handleRemoteHangup();
      }
    };
  };

  // 1. INITIATE CALL (OUTGOING)
  const startCall = async (
    orderId: string,
    callerRole: 'customer' | 'worker' = 'customer',
    participantOverride?: CallParticipant
  ) => {
    if (callStatus !== 'idle') return;

    myCallRoleRef.current = 'caller';
    remoteDescriptionSetRef.current = false;
    pendingCandidatesRef.current = [];
    addedCandidatesRef.current.clear();
    candidateBatchRef.current = [];

    // Prime Web Audio and remote audio element during user click
    getAudioContext();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch(() => {});
    }

    const stream = await getMicrophoneStream();
    if (!stream) return;

    try {
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;
      setupDataChannel(pc);

      // Add local microphone audio tracks
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
        pc.addTrack(track, stream);
      });

      // Receive remote audio track
      pc.ontrack = (event) => {
        const remoteStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
        setupRemoteAudio(remoteStream, pc);

        event.track.onunmute = () => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.play().catch(() => {});
          }
          stopRingtoneLoop();
          setCallStatus('connected');
        };
      };

      // Candidate handling - trickle immediately
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          queueCandidateToSend(event.candidate.toJSON());
        }
      };

      // Connection status listeners
      const handleConnected = () => {
        stopRingtoneLoop();
        setCallStatus('connected');
        if (remoteAudioRef.current) {
          remoteAudioRef.current.volume = 1.0;
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          handleConnected();
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          handleConnected();
        }
      };

      // Create local SDP Offer with low-latency audio intent
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      // Optimize Opus parameters in SDP
      const optimizedSdp = optimizeAudioSdp(offer.sdp || '');
      const localDesc = new RTCSessionDescription({ type: 'offer', sdp: optimizedSdp });
      await pc.setLocalDescription(localDesc);

      // Post offer to server WITHOUT BLOCKING - trickle ICE handles candidate delivery
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          order_id: orderId,
          caller_role: callerRole,
          sdp_offer: localDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMicPermissionError(data.error || 'Unable to start in-app voice call.');
        cleanupCall();
        return;
      }

      const session = data.callSession;
      activeSessionIdRef.current = session.id;
      const targetParticipant = participantOverride || session.participant;

      // Flush any gathered candidates
      flushCandidateBatch();

      setCallData({
        sessionId: session.id,
        orderId: session.order_id,
        roomId: session.room_id,
        initiatedBy: callerRole,
        participant: targetParticipant,
      });

      setCallStatus('outgoing');
      startRingtoneLoop();
    } catch (err) {
      console.error('[CallContext] startCall failed:', err);
      setMicPermissionError('In-app call failed to connect.');
      cleanupCall();
    }
  };

  // 2. ACCEPT INCOMING CALL (ZERO-DELAY PICKUP)
  const acceptCall = async () => {
    if (!callData || callStatus !== 'incoming') return;

    myCallRoleRef.current = 'callee';
    activeSessionIdRef.current = callData.sessionId;
    remoteDescriptionSetRef.current = false;
    pendingCandidatesRef.current = [];
    addedCandidatesRef.current.clear();
    candidateBatchRef.current = [];

    stopRingtoneLoop();
    getAudioContext();

    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch(() => {});
    }

    const stream = await getMicrophoneStream();
    if (!stream) {
      declineCall();
      return;
    }

    try {
      const res = await fetch(`/api/calls?sessionId=${callData.sessionId}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.session?.sdpOffer) {
        throw new Error('Call offer is no longer valid');
      }

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;
      setupDataChannel(pc);

      // Add local microphone audio tracks
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        const remoteStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
        setupRemoteAudio(remoteStream, pc);

        event.track.onunmute = () => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.play().catch(() => {});
          }
          stopRingtoneLoop();
          setCallStatus('connected');
        };
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          queueCandidateToSend(event.candidate.toJSON());
        }
      };

      const handleConnected = () => {
        stopRingtoneLoop();
        setCallStatus('connected');
        if (remoteAudioRef.current) {
          remoteAudioRef.current.volume = 1.0;
          remoteAudioRef.current.play().catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          handleConnected();
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          handleConnected();
        }
      };

      // Set Remote Description from Caller's Offer
      await pc.setRemoteDescription(new RTCSessionDescription(data.session.sdpOffer));
      remoteDescriptionSetRef.current = true;
      await flushPendingCandidates();

      // Create local SDP Answer
      const answer = await pc.createAnswer();
      const optimizedSdp = optimizeAudioSdp(answer.sdp || '');
      const localAnswer = new RTCSessionDescription({ type: 'answer', sdp: optimizedSdp });
      await pc.setLocalDescription(localAnswer);

      // SEND ANSWER IMMEDIATELY TO SERVER - ZERO PICKUP DELAY
      fetch('/api/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          call_id: callData.sessionId,
          status: 'accepted',
          sdp_answer: localAnswer,
        }),
      });

      flushCandidateBatch();

      // Process any already recorded caller ICE candidates
      if (Array.isArray(data.session.iceCandidates)) {
        for (const c of data.session.iceCandidates) {
          if (c.candidate && (c.role === 'caller' || c.userId !== user?.uid)) {
            await addIceCandidateSafely(c.candidate);
          }
        }
      }
    } catch (err) {
      console.error('[CallContext] acceptCall failed:', err);
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
    }, 400);
  };

  // 4. END ACTIVE CALL (INSTANT VIA DATA CHANNEL + HTTP)
  const endCall = async () => {
    // A: Instantly notify other peer over WebRTC DataChannel (0ms delay)
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send('HANGUP');
      } catch {}
    }

    // B: Update server in background
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
    }, 400); // Fast 400ms dismissal
  };

  // Toggle Mute Local Mic
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const currentEnabled = audioTracks[0]?.enabled ?? true;
      const nextEnabled = !currentEnabled;
      audioTracks.forEach((track) => {
        track.enabled = nextEnabled;
      });
      setIsMuted(!nextEnabled);
    }
  };

  // Toggle Speakerphone
  const toggleSpeaker = async () => {
    const nextState = !isSpeakerOn;
    setIsSpeakerOn(nextState);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = nextState ? 1.0 : 0.7;
    }
  };

  const dismissError = () => {
    setMicPermissionError(null);
  };

  // Dynamic Signaling Polling Loop - Ultra-Responsive Handshake
  useEffect(() => {
    if (!user) return;

    // 250ms polling during handshake (detects pickup in ~125ms), 1000ms when connected
    const pollInterval = ['outgoing', 'incoming'].includes(callStatus) ? 250 : 1000;

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
              handleRemoteHangup();
              return;
            }

            // Caller side: check if receiver accepted call and provided SDP answer
            if (myCallRoleRef.current === 'caller' && session.status === 'accepted' && session.sdpAnswer) {
              if (
                peerConnectionRef.current &&
                peerConnectionRef.current.signalingState !== 'stable' &&
                !remoteDescriptionSetRef.current
              ) {
                try {
                  await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(session.sdpAnswer));
                  remoteDescriptionSetRef.current = true;
                  stopRingtoneLoop();
                  await flushPendingCandidates();

                  if (remoteAudioRef.current) {
                    remoteAudioRef.current.volume = 1.0;
                    remoteAudioRef.current.play().catch(() => {});
                  }
                } catch (err) {
                  console.warn('[CallContext] Error setting remote description for answer:', err);
                }
              }
            }

            // Process remote ICE Candidates
            if (Array.isArray(session.iceCandidates)) {
              const targetRole = myCallRoleRef.current === 'caller' ? 'callee' : 'caller';
              for (const candItem of session.iceCandidates) {
                if (candItem.candidate && (candItem.role === targetRole || (!candItem.role && candItem.userId !== user.uid))) {
                  await addIceCandidateSafely(candItem.candidate);
                }
              }
            }
          }
        }

        // B: If idle, check if an incoming call is ringing for this user (fast 800ms check)
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
      } catch {}
    }, pollInterval);

    return () => clearInterval(interval);
  }, [
    user,
    callStatus,
    callData?.sessionId,
    startRingtoneLoop,
    stopRingtoneLoop,
    cleanupCall,
    handleRemoteHangup,
    addIceCandidateSafely,
    flushPendingCandidates,
  ]);

  // Handle Call Duration Timer
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
