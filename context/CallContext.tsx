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

// WebRTC STUN & TURN Relay Server Config for cellular NAT & symmetric firewall traversal
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
};

// Helper: Wait briefly for ICE candidates to gather so they are embedded directly in the SDP
const waitForIceGathering = (pc: RTCPeerConnection, timeoutMs = 800): Promise<void> => {
  return new Promise<void>((resolve) => {
    if (pc.iceGatheringState === 'complete') {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      resolve();
    }, timeoutMs);

    const onStateChange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer);
        pc.removeEventListener('icegatheringstatechange', onStateChange);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', onStateChange);
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
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // ICE Candidate Queues & Guard Refs
  const addedCandidatesRef = useRef<Set<string>>(new Set());
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescriptionSetRef = useRef<boolean>(false);
  const myCallRoleRef = useRef<'caller' | 'callee'>('caller');

  // Resume or Initialize Web Audio Context
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

  // Play synthetic Ringtone via Web Audio API
  const playRingtone = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

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
  }, [getAudioContext]);

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

    if (mediaStreamSourceRef.current) {
      try {
        mediaStreamSourceRef.current.disconnect();
      } catch {}
      mediaStreamSourceRef.current = null;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch {}
      peerConnectionRef.current = null;
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
        } catch (err) {
          console.warn('[CallContext] Failed to add pending candidate:', err);
        }
      }
    }
  }, []);

  // Safe ICE Candidate Addition (Queues if remote description is not set yet)
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
    } catch (err) {
      console.warn('[CallContext] Candidate addition error:', err);
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

  // Route remote stream to HTML5 Audio element and Web Audio API destination for guaranteed playback
  const setupRemoteAudio = useCallback((remoteStream: MediaStream) => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch(() => {});
    }

    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (!mediaStreamSourceRef.current) {
          const source = ctx.createMediaStreamSource(remoteStream);
          mediaStreamSourceRef.current = source;
          source.connect(ctx.destination);
        }
      }
    } catch (err) {
      console.warn('[CallContext] Web Audio bridge failed:', err);
    }
  }, [getAudioContext]);

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

    // Unlock Web Audio and remote audio element during user click gesture
    getAudioContext();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch(() => {});
    }

    const stream = await getMicrophoneStream();
    if (!stream) return;

    try {
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      // Add local microphone audio tracks
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
        pc.addTrack(track, stream);
      });

      // Receive remote audio track
      pc.ontrack = (event) => {
        const remoteStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
        setupRemoteAudio(remoteStream);

        event.track.onunmute = () => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.play().catch(() => {});
          }
        };
      };

      // Early candidate buffer for candidates discovered before session ID is confirmed
      let activeSessionId: string | null = null;
      const earlyCandidates: RTCIceCandidateInit[] = [];

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candJson = event.candidate.toJSON();
          if (activeSessionId) {
            fetch('/api/calls', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                call_id: activeSessionId,
                candidate: candJson,
                role: 'caller',
              }),
            }).catch(() => {});
          } else {
            earlyCandidates.push(candJson);
          }
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

      // Create and set local SDP Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait briefly for ICE candidates to gather so they are baked into the offer SDP
      await waitForIceGathering(pc, 800);
      const offerToSend = pc.localDescription || offer;

      // Post offer to server
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          order_id: orderId,
          caller_role: callerRole,
          sdp_offer: offerToSend,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMicPermissionError(data.error || 'Unable to start in-app voice call.');
        cleanupCall();
        return;
      }

      const session = data.callSession;
      activeSessionId = session.id;
      const targetParticipant = participantOverride || session.participant;

      // Flush any early candidates
      if (earlyCandidates.length > 0) {
        for (const cand of earlyCandidates) {
          fetch('/api/calls', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              call_id: session.id,
              candidate: cand,
              role: 'caller',
            }),
          }).catch(() => {});
        }
      }

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

  // 2. ACCEPT INCOMING CALL
  const acceptCall = async () => {
    if (!callData || callStatus !== 'incoming') return;

    myCallRoleRef.current = 'callee';
    remoteDescriptionSetRef.current = false;
    pendingCandidatesRef.current = [];
    addedCandidatesRef.current.clear();

    stopRingtoneLoop();
    getAudioContext();

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

      // Add local microphone audio tracks
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        const remoteStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
        setupRemoteAudio(remoteStream);

        event.track.onunmute = () => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.play().catch(() => {});
          }
        };
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/calls', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              call_id: callData.sessionId,
              candidate: event.candidate.toJSON(),
              role: 'callee',
            }),
          }).catch(() => {});
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

      // Create and set local SDP Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Wait briefly for ICE candidates to gather into answer SDP
      await waitForIceGathering(pc, 800);
      const answerToSend = pc.localDescription || answer;

      // Send Answer to Server
      await fetch('/api/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          call_id: callData.sessionId,
          status: 'accepted',
          sdp_answer: answerToSend,
        }),
      });

      setCallStatus('connected');

      // Process any already recorded caller ICE candidates
      if (Array.isArray(data.session.iceCandidates)) {
        for (const c of data.session.iceCandidates) {
          if (c.candidate && c.role === 'caller') {
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
      remoteAudioRef.current.volume = nextState ? 1.0 : 0.6;
    }
  };

  const dismissError = () => {
    setMicPermissionError(null);
  };

  // Dynamic Signaling Polling Loop
  useEffect(() => {
    if (!user) return;

    // Use 700ms polling during handshake / ringing, 1500ms when idle or connected
    const pollInterval = ['outgoing', 'incoming'].includes(callStatus) ? 700 : 1500;

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
                  setCallStatus('connected');
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
                // If candidate is from remote peer (by role or non-matching userId)
                if (candItem.candidate && (candItem.role === targetRole || (!candItem.role && candItem.userId !== user.uid))) {
                  await addIceCandidateSafely(candItem.candidate);
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
    }, pollInterval);

    return () => clearInterval(interval);
  }, [
    user,
    callStatus,
    callData?.sessionId,
    startRingtoneLoop,
    stopRingtoneLoop,
    cleanupCall,
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
