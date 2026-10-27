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
  isRemoteSpeaking: boolean;
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

// Streamlined, ultra-fast STUN & TURN config
const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
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

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callData, setCallData] = useState<CallData | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  // WebRTC & Audio Refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const vadCleanupRef = useRef<(() => void) | null>(null);

  // Candidate Batching & Guard Refs
  const addedCandidatesRef = useRef<Set<string>>(new Set());
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescriptionSetRef = useRef<boolean>(false);
  const myCallRoleRef = useRef<'caller' | 'callee'>('caller');
  const candidateBatchRef = useRef<RTCIceCandidateInit[]>([]);
  const candidateBatchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);

  // Initialize or resume Web Audio Context
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

  // 1. REAL OUTGOING RINGBACK TONE (Dual-frequency telecom standard: 440Hz + 480Hz)
  const playRingbackTone = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.value = 440;
      osc2.frequency.value = 480;

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.08);
      gain.gain.setValueAtTime(0.06, now + 1.4);
      gain.gain.linearRampToValueAtTime(0, now + 1.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.55);
      osc2.stop(now + 1.55);
    } catch {}
  }, [getAudioContext]);

  // 2. REAL INCOMING SMARTPHONE RINGTONE (Harmonic chime arpeggio + physical mobile vibration)
  const playIncomingRingtone = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.09, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([400, 250, 400, 900]);
      }
    } catch {}
  }, [getAudioContext]);

  // 3. CALL CONNECTED SOUND (Crisp positive double-chirp + soft haptic)
  const playConnectedChime = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const notes = [587.33, 880]; // D5 -> A5
      const now = ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(60);
      }
    } catch {}
  }, [getAudioContext]);

  // 4. CALL ENDED / HANGUP SOUND (Telephone disconnect beeps + haptic)
  const playEndedChime = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const freqs = [620, 480];
      const now = ctx.currentTime;
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.11;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.07, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.17);
      });

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 50, 80]);
      }
    } catch {}
  }, [getAudioContext]);

  const startRingLoop = useCallback((type: 'outgoing' | 'incoming') => {
    if (ringtoneTimerRef.current) clearInterval(ringtoneTimerRef.current);
    if (type === 'outgoing') {
      playRingbackTone();
      ringtoneTimerRef.current = setInterval(playRingbackTone, 3200);
    } else {
      playIncomingRingtone();
      ringtoneTimerRef.current = setInterval(playIncomingRingtone, 2200);
    }
  }, [playRingbackTone, playIncomingRingtone]);

  const stopRingLoop = useCallback(() => {
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
      }, 100);
    }
  }, [flushCandidateBatch]);

  // Clean Voice Activity Detector (VAD)
  const stopVoiceActivityDetection = useCallback(() => {
    if (vadCleanupRef.current) {
      vadCleanupRef.current();
      vadCleanupRef.current = null;
    }
    setIsRemoteSpeaking(false);
  }, []);

  // Attach Voice Activity Detector
  const startVoiceActivityDetection = useCallback((stream: MediaStream) => {
    stopVoiceActivityDetection();
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.2;
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      let animId: number;
      let active = true;

      const checkVolume = () => {
        if (!active) return;
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        setIsRemoteSpeaking(avg > 18);
        animId = requestAnimationFrame(checkVolume);
      };

      checkVolume();

      vadCleanupRef.current = () => {
        active = false;
        cancelAnimationFrame(animId);
        try { source.disconnect(); } catch {}
      };
    } catch {}
  }, [getAudioContext, stopVoiceActivityDetection]);

  // Teardown
  const cleanupCall = useCallback(() => {
    stopRingLoop();
    stopVoiceActivityDetection();

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
  }, [stopRingLoop, stopVoiceActivityDetection]);

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

  // Request Microphone Stream safely
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

  // Route remote stream to HTML5 Audio element
  const setupRemoteAudio = useCallback((remoteStream: MediaStream, pc?: RTCPeerConnection) => {
    if (pc) {
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

    startVoiceActivityDetection(remoteStream);

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
  }, [startVoiceActivityDetection]);

  // Remote hangup handler
  const handleRemoteHangup = useCallback(() => {
    stopRingLoop();
    playEndedChime();
    setCallStatus('ended');
    cleanupCall();
    setTimeout(() => {
      setCallStatus('idle');
      setCallData(null);
    }, 450);
  }, [stopRingLoop, playEndedChime, cleanupCall]);

  // DataChannel for 0-latency call control
  const setupDataChannel = (pc: RTCPeerConnection) => {
    try {
      const dc = pc.createDataChannel('repireo-call-control', { negotiated: true, id: 0 });
      dataChannelRef.current = dc;
      dc.onmessage = (event) => {
        if (event.data === 'HANGUP') {
          handleRemoteHangup();
        }
      };
    } catch {}
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
        };
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          queueCandidateToSend(event.candidate.toJSON());
        }
      };

      const handleConnected = () => {
        stopRingLoop();
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

      // Native clean offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
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
      activeSessionIdRef.current = session.id;
      const targetParticipant = participantOverride || session.participant;

      flushCandidateBatch();

      setCallData({
        sessionId: session.id,
        orderId: session.order_id,
        roomId: session.room_id,
        initiatedBy: callerRole,
        participant: targetParticipant,
      });

      setCallStatus('outgoing');
      startRingLoop('outgoing');
    } catch (err) {
      console.error('[CallContext] startCall failed:', err);
      setMicPermissionError('In-app call failed to connect.');
      cleanupCall();
    }
  };

  // 2. ACCEPT INCOMING CALL (IMMEDIATE PICKUP & SEAMLESS TRANSITION)
  const acceptCall = async () => {
    if (!callData || callStatus !== 'incoming') return;

    myCallRoleRef.current = 'callee';
    activeSessionIdRef.current = callData.sessionId;
    remoteDescriptionSetRef.current = false;
    pendingCandidatesRef.current = [];
    addedCandidatesRef.current.clear();
    candidateBatchRef.current = [];

    // CRITICAL: Stop ringing, play connected sound, and transition UI immediately!
    stopRingLoop();
    playConnectedChime();
    setCallStatus('connected');

    getAudioContext();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch(() => {});
    }

    const stream = await getMicrophoneStream();
    if (!stream) {
      endCall();
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
        };
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          queueCandidateToSend(event.candidate.toJSON());
        }
      };

      const handleConnected = () => {
        stopRingLoop();
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

      // Set Remote Description (Caller's Offer) natively without brittle regex
      await pc.setRemoteDescription(new RTCSessionDescription(data.session.sdpOffer));
      remoteDescriptionSetRef.current = true;
      await flushPendingCandidates();

      // Create native local Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Instant answer broadcast
      fetch('/api/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          call_id: callData.sessionId,
          status: 'accepted',
          sdp_answer: answer,
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
      endCall();
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

    stopRingLoop();
    playEndedChime();
    setCallStatus('ended');
    cleanupCall();
    setTimeout(() => {
      setCallStatus('idle');
      setCallData(null);
    }, 450);
  };

  // 4. END ACTIVE CALL
  const endCall = async () => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send('HANGUP');
      } catch {}
    }

    if (callData?.sessionId) {
      fetch('/api/calls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ call_id: callData.sessionId, status: 'ended' }),
      }).catch(() => {});
    }

    stopRingLoop();
    playEndedChime();
    setCallStatus('ended');
    cleanupCall();
    setTimeout(() => {
      setCallStatus('idle');
      setCallData(null);
    }, 450);
  };

  // Toggle Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const currentEnabled = audioTracks[0]?.enabled ?? true;
      const nextEnabled = !currentEnabled;
      audioTracks.forEach((track) => {
        track.enabled = nextEnabled;
      });
      setIsMuted(!nextEnabled);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
      }
    }
  };

  // Toggle Speakerphone
  const toggleSpeaker = async () => {
    const nextState = !isSpeakerOn;
    setIsSpeakerOn(nextState);
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = nextState ? 1.0 : 0.65;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(40);
    }
  };

  const dismissError = () => {
    setMicPermissionError(null);
  };

  // Dynamic Signaling Polling Loop
  useEffect(() => {
    if (!user) return;

    const pollInterval = ['outgoing', 'incoming'].includes(callStatus) ? 250 : 1000;

    const interval = setInterval(async () => {
      try {
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

            // Caller receives Callee's SDP Answer
            if (myCallRoleRef.current === 'caller' && session.status === 'accepted' && session.sdpAnswer) {
              if (
                peerConnectionRef.current &&
                peerConnectionRef.current.signalingState !== 'stable' &&
                !remoteDescriptionSetRef.current
              ) {
                try {
                  await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(session.sdpAnswer));
                  remoteDescriptionSetRef.current = true;
                  stopRingLoop();
                  playConnectedChime();
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
              startRingLoop('incoming');
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
    startRingLoop,
    stopRingLoop,
    cleanupCall,
    handleRemoteHangup,
    playConnectedChime,
    addIceCandidateSafely,
    flushPendingCandidates,
  ]);

  // Duration Timer
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
        isRemoteSpeaking,
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
