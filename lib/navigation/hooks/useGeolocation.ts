'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { GPSPosition, GPSStatus } from '../types';

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  accuracyThresholdMeters?: number; // Accuracy above this threshold flagged as poor
  autoStart?: boolean;
}

export interface UseGeolocationReturn {
  position: GPSPosition | null;
  status: GPSStatus;
  error: string | null;
  accuracyWarning: boolean;
  startWatching: () => void;
  stopWatching: () => void;
  requestCurrentPosition: () => Promise<GPSPosition>;
}

export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 2000,
    accuracyThresholdMeters = 50,
    autoStart = false,
  } = options;

  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [status, setStatus] = useState<GPSStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [accuracyWarning, setAccuracyWarning] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);

  // Check initial browser permission status if Permissions API is supported
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      setError('Geolocation API is not supported by this browser.');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((perm) => {
          if (perm.state === 'granted') {
            setStatus((prev) => (prev === 'idle' ? 'granted' : prev));
          } else if (perm.state === 'denied') {
            setStatus('denied');
            setError('Location access was denied. Please allow location in your browser settings.');
          } else {
            setStatus((prev) => (prev === 'idle' ? 'prompt' : prev));
          }

          perm.onchange = () => {
            if (perm.state === 'granted') {
              setStatus('granted');
              setError(null);
            } else if (perm.state === 'denied') {
              setStatus('denied');
              setError('Location permission has been denied.');
            }
          };
        })
        .catch(() => {
          // Permissions API query not supported for geolocation in some environments
        });
    }
  }, []);

  const handlePositionSuccess = useCallback(
    (pos: GeolocationPosition) => {
      const gpsPos: GPSPosition = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        heading: pos.coords.heading ?? null,
        speed: pos.coords.speed ?? null,
        timestamp: pos.timestamp,
      };

      setPosition(gpsPos);
      setStatus('locked');
      setError(null);

      // Check if signal accuracy is degraded (e.g., indoor or bad satellite lock)
      setAccuracyWarning(pos.coords.accuracy > accuracyThresholdMeters);
    },
    [accuracyThresholdMeters]
  );

  const handlePositionError = useCallback((err: GeolocationPositionError) => {
    let msg = 'Failed to obtain GPS position.';
    switch (err.code) {
      case err.PERMISSION_DENIED:
        msg = 'Location permission was denied. Please enable GPS permissions.';
        setStatus('denied');
        break;
      case err.POSITION_UNAVAILABLE:
        msg = 'GPS signal unavailable. Searching for satellite lock...';
        setStatus('searching');
        break;
      case err.TIMEOUT:
        msg = 'GPS request timed out. Retrying...';
        setStatus('searching');
        break;
      default:
        msg = err.message || 'Unknown GPS error';
        setStatus('searching');
        break;
    }
    setError(msg);
  }, []);

  const startWatching = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported');
      setError('Geolocation is not supported.');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setStatus('searching');
    setError(null);

    const id = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );

    watchIdRef.current = id;
  }, [enableHighAccuracy, timeout, maximumAge, handlePositionSuccess, handlePositionError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus('idle');
  }, []);

  const requestCurrentPosition = useCallback((): Promise<GPSPosition> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        reject(new Error('Geolocation is not supported in this browser.'));
        return;
      }

      setStatus('searching');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handlePositionSuccess(pos);
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading ?? null,
            speed: pos.coords.speed ?? null,
            timestamp: pos.timestamp,
          });
        },
        (err) => {
          handlePositionError(err);
          reject(err);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge, handlePositionSuccess, handlePositionError]);

  useEffect(() => {
    if (autoStart) {
      startWatching();
    }
    return () => {
      if (watchIdRef.current !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [autoStart, startWatching]);

  return {
    position,
    status,
    error,
    accuracyWarning,
    startWatching,
    stopWatching,
    requestCurrentPosition,
  };
}
