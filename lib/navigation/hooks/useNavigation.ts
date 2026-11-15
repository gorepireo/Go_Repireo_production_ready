'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Coordinate,
  NavigationStatus,
  NavigationProgress,
  RouteResult,
  IRoutingProvider,
  GPSPosition,
} from '../types';
import { defaultRoutingAdapter } from '../providers/RoutingAdapter';
import {
  calculateDistanceMeters,
  checkRouteDeviation,
  calculateRemainingRouteDistance,
} from '../utils/geo';
import { voiceGuidance } from '../services/voiceGuidance';

export interface UseNavigationOptions {
  destination: Coordinate;
  initialWorkerPosition?: Coordinate | null;
  routingProvider?: IRoutingProvider;
  deviationThresholdMeters?: number;
  arrivalThresholdMeters?: number;
  enableVoice?: boolean;
  onArrival?: () => void;
  onReroute?: (newRoute: RouteResult) => void;
}

export interface UseNavigationReturn {
  navigationStatus: NavigationStatus;
  route: RouteResult | null;
  progress: NavigationProgress | null;
  isRecalculating: boolean;
  error: string | null;
  isVoiceMuted: boolean;
  startNavigation: (currentPos?: Coordinate) => Promise<void>;
  pauseNavigation: () => void;
  resumeNavigation: () => void;
  stopNavigation: () => void;
  recalculateRoute: (overrideOrigin?: Coordinate) => Promise<RouteResult | null>;
  toggleVoice: () => boolean;
  updateWorkerPosition: (gps: GPSPosition) => void;
}

export function useNavigation(options: UseNavigationOptions): UseNavigationReturn {
  const {
    destination,
    initialWorkerPosition,
    routingProvider = defaultRoutingAdapter,
    deviationThresholdMeters = 35,
    arrivalThresholdMeters = 25,
    enableVoice = true,
    onArrival,
    onReroute,
  } = options;

  const [navigationStatus, setNavigationStatus] = useState<NavigationStatus>('idle');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [progress, setProgress] = useState<NavigationProgress | null>(null);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(!enableVoice);

  const lastGpsRef = useRef<GPSPosition | null>(null);
  const consecutiveOffRouteCountRef = useRef<number>(0);
  const isReroutingRef = useRef<boolean>(false);
  const lastSpokenStepIndexRef = useRef<number>(-1);

  // Set initial voice mute state
  useEffect(() => {
    voiceGuidance.setMuted(!enableVoice);
    setIsVoiceMuted(!enableVoice);
  }, [enableVoice]);

  const toggleVoice = useCallback(() => {
    const muted = voiceGuidance.toggleMute();
    setIsVoiceMuted(muted);
    return muted;
  }, []);

  // Recalculates route using latest known worker position
  const recalculateRoute = useCallback(
    async (overrideOrigin?: Coordinate): Promise<RouteResult | null> => {
      const origin: Coordinate | null =
        overrideOrigin ||
        (lastGpsRef.current
          ? [lastGpsRef.current.lat, lastGpsRef.current.lng]
          : initialWorkerPosition || null);

      if (!origin) {
        setError('Worker position unavailable to calculate route.');
        return null;
      }

      if (isReroutingRef.current) return null;
      isReroutingRef.current = true;
      setIsRecalculating(true);
      setError(null);

      try {
        const newRoute = await routingProvider.getRoute(origin, destination);
        setRoute(newRoute);
        consecutiveOffRouteCountRef.current = 0;

        // Reset step speech memory on new route
        lastSpokenStepIndexRef.current = -1;

        if (enableVoice && !isVoiceMuted && newRoute.steps.length > 0) {
          voiceGuidance.speak(
            `New route calculated. In ${Math.round(newRoute.steps[0].distanceMeters)} meters, ${newRoute.steps[0].instruction}`
          );
        }

        if (onReroute) {
          onReroute(newRoute);
        }

        return newRoute;
      } catch (err) {
        const msg = (err as Error).message || 'Route calculation failed.';
        setError(msg);
        console.error('[useNavigation] Reroute error:', err);
        return null;
      } finally {
        setIsRecalculating(false);
        isReroutingRef.current = false;
      }
    },
    [destination, initialWorkerPosition, routingProvider, enableVoice, isVoiceMuted, onReroute]
  );

  const startNavigation = useCallback(
    async (currentPos?: Coordinate) => {
      const startCoord =
        currentPos ||
        (lastGpsRef.current
          ? [lastGpsRef.current.lat, lastGpsRef.current.lng]
          : initialWorkerPosition);

      if (!startCoord) {
        setError('Cannot start navigation: GPS position not acquired yet.');
        return;
      }

      setError(null);
      setNavigationStatus('navigating');

      const routeResult = await recalculateRoute(startCoord);
      if (routeResult) {
        const firstStep = routeResult.steps[0];
        if (firstStep) {
          voiceGuidance.speak(`Starting navigation. ${firstStep.instruction}`);
        }
      }
    },
    [initialWorkerPosition, recalculateRoute]
  );

  const pauseNavigation = useCallback(() => {
    setNavigationStatus('paused');
    voiceGuidance.speak('Navigation paused.');
  }, []);

  const resumeNavigation = useCallback(() => {
    setNavigationStatus('navigating');
    voiceGuidance.speak('Resuming navigation.');
  }, []);

  const stopNavigation = useCallback(() => {
    setNavigationStatus('idle');
    setRoute(null);
    setProgress(null);
    voiceGuidance.stop();
  }, []);

  // Update position feed from GPS hook
  const updateWorkerPosition = useCallback(
    (gps: GPSPosition) => {
      lastGpsRef.current = gps;
      const workerCoord: Coordinate = [gps.lat, gps.lng];

      // If arrived at customer destination
      const distanceToDestination = calculateDistanceMeters(workerCoord, destination);
      if (distanceToDestination <= arrivalThresholdMeters && navigationStatus === 'navigating') {
        setNavigationStatus('arrived');
        voiceGuidance.speak('You have arrived at the customer destination.');
        if (onArrival) onArrival();
        return;
      }

      if (!route || navigationStatus !== 'navigating') return;

      // 1. Route Deviation Check
      const deviation = checkRouteDeviation(
        workerCoord,
        route.coordinates,
        deviationThresholdMeters
      );

      if (deviation.isDeviated) {
        consecutiveOffRouteCountRef.current += 1;
        // Require 2 consecutive off-route readings before triggering reroute to avoid GPS jitter false positives
        if (consecutiveOffRouteCountRef.current >= 2 && !isReroutingRef.current) {
          setNavigationStatus('rerouting');
          voiceGuidance.speak('Rerouting. Please proceed to the highlighted road.');
          recalculateRoute(workerCoord).then(() => {
            setNavigationStatus('navigating');
          });
          return;
        }
      } else {
        consecutiveOffRouteCountRef.current = 0;
      }

      // 2. Progress Calculation
      const remainingDistance = calculateRemainingRouteDistance(
        workerCoord,
        route.coordinates,
        deviation.nearestSegmentIndex
      );

      const distanceTraveled = Math.max(0, route.distanceMeters - remainingDistance);
      const percentCompleted = Math.min(
        100,
        Math.max(0, (distanceTraveled / (route.distanceMeters || 1)) * 100)
      );

      // Remaining duration estimation based on current speed or average speed
      const averageSpeedMs = gps.speed && gps.speed > 1.5 ? gps.speed : 8.33; // 30 km/h default city speed
      const remainingDurationSeconds = Math.round(remainingDistance / averageSpeedMs);

      // 3. Step & Maneuver tracking
      let activeStepIndex = 0;
      let minStepDist = Infinity;

      route.steps.forEach((step, idx) => {
        const d = calculateDistanceMeters(workerCoord, step.maneuver.location);
        if (d < minStepDist) {
          minStepDist = d;
          activeStepIndex = idx;
        }
      });

      const currentStep = route.steps[activeStepIndex] || route.steps[0];
      const nextStep = route.steps[activeStepIndex + 1] || null;

      // Voice instruction trigger within 60 meters of maneuver
      if (
        !isVoiceMuted &&
        currentStep &&
        activeStepIndex !== lastSpokenStepIndexRef.current &&
        minStepDist < 60
      ) {
        voiceGuidance.speak(`In ${Math.round(minStepDist)} meters, ${currentStep.instruction}`);
        lastSpokenStepIndexRef.current = activeStepIndex;
      }

      setProgress({
        distanceRemainingMeters: remainingDistance,
        durationRemainingSeconds: remainingDurationSeconds,
        distanceTraveledMeters: distanceTraveled,
        percentCompleted,
        currentStepIndex: activeStepIndex,
        currentInstruction: currentStep ? currentStep.instruction : 'Proceed on route',
        nextInstruction: nextStep ? nextStep.instruction : null,
        isOffRoute: deviation.isDeviated,
        offRouteDistanceMeters: deviation.minDistanceMeters,
        currentSpeedKmh: gps.speed ? Math.round(gps.speed * 3.6) : 0,
        headingDegrees: gps.heading,
      });
    },
    [
      destination,
      arrivalThresholdMeters,
      navigationStatus,
      route,
      deviationThresholdMeters,
      recalculateRoute,
      isVoiceMuted,
      onArrival,
    ]
  );

  return {
    navigationStatus,
    route,
    progress,
    isRecalculating,
    error,
    isVoiceMuted,
    startNavigation,
    pauseNavigation,
    resumeNavigation,
    stopNavigation,
    recalculateRoute,
    toggleVoice,
    updateWorkerPosition,
  };
}
