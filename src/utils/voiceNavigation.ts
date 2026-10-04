import { RouteOption, NavigationInstruction } from '../types';

/**
 * Checks if browser SpeechSynthesis (TTS) is supported
 */
export function isTextToSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

/**
 * Checks if browser SpeechRecognition (STT) is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * Calculates real Haversine distance in meters between two GPS coordinates
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates initial compass bearing in degrees (0 - 360) from point 1 to point 2
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

/**
 * Determines turn maneuver based on bearing change
 */
export function getManeuverFromBearingChange(
  b1: number,
  b2: number
): 'straight' | 'turn-left' | 'turn-right' {
  let diff = b2 - b1;
  while (diff < -180) diff += 360;
  while (diff > 180) diff -= 360;
  if (diff < -28) return 'turn-left';
  if (diff > 28) return 'turn-right';
  return 'straight';
}

/**
 * Formats distance in meters into human-friendly text
 */
export function formatFriendlyDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
}

/**
 * Calculates minimum distance in meters from a GPS point to a line segment
 */
function distToSegmentMeters(
  pLat: number,
  pLng: number,
  vLat: number,
  vLng: number,
  wLat: number,
  wLng: number
): number {
  const l2 = Math.pow(wLat - vLat, 2) + Math.pow(wLng - vLng, 2);
  if (l2 === 0) return calculateHaversineDistanceMeters(pLat, pLng, vLat, vLng);

  // Project point onto line segment
  let t = ((pLat - vLat) * (wLat - vLat) + (pLng - vLng) * (wLng - vLng)) / l2;
  t = Math.max(0, Math.min(1, t));

  const projLat = vLat + t * (wLat - vLat);
  const projLng = vLng + t * (wLng - vLng);
  return calculateHaversineDistanceMeters(pLat, pLng, projLat, projLng);
}

/**
 * Finds distance in meters from an ambulance GPS point to the closest point along the route polyline
 */
export function findDistanceToPolylineMeters(
  currentLat: number,
  currentLng: number,
  polyline: [number, number][]
): number {
  if (!polyline || polyline.length < 2) return 0;

  let minDistance = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = distToSegmentMeters(
      currentLat,
      currentLng,
      polyline[i][0],
      polyline[i][1],
      polyline[i + 1][0],
      polyline[i + 1][1]
    );
    if (d < minDistance) {
      minDistance = d;
    }
  }

  return minDistance === Infinity ? 0 : Math.round(minDistance);
}

/**
 * Checks if the ambulance is significantly off-route (default 100m deviation threshold, between 80-150m)
 */
export function isAmbulanceOffRoute(
  coords: { latitude: number; longitude: number },
  polyline: [number, number][],
  deviationThresholdMeters: number = 100
): { isOffRoute: boolean; deviationMeters: number } {
  if (!coords || !polyline || polyline.length < 2) {
    return { isOffRoute: false, deviationMeters: 0 };
  }

  const dist = findDistanceToPolylineMeters(coords.latitude, coords.longitude, polyline);
  return {
    isOffRoute: dist > deviationThresholdMeters,
    deviationMeters: dist,
  };
}

/**
 * Generates turn-by-turn spoken and visual navigation instructions based on the actual route & stage
 */
export function generateRouteNavigationSteps(
  route: RouteOption | null,
  stage: 'TO_PATIENT' | 'TO_HOSPITAL',
  destinationName: string
): NavigationInstruction[] {
  const destClean = destinationName || (stage === 'TO_PATIENT' ? 'Patient Incident Location' : 'Hospital Emergency Center');

  // 1. If real steps already exist in the route (e.g. from OSRM or Google Routes API):
  if (route?.steps && Array.isArray(route.steps) && route.steps.length > 0) {
    return route.steps.map((s, idx) => ({
      ...s,
      id: idx,
      progressPercent: Math.min(100, Math.round((idx / Math.max(1, route.steps!.length - 1)) * 100)),
    }));
  }

  // 2. Derive real steps from the route polyline coordinates if available
  if (route?.coordinates && Array.isArray(route.coordinates) && route.coordinates.length >= 2) {
    const coords = route.coordinates;
    const waypoints = route.waypoints && route.waypoints.length > 0
      ? route.waypoints
      : ['Arterial Priority Corridor', 'Emergency Green Express', 'Medical Center Link'];

    const totalPoints = coords.length;
    const steps: NavigationInstruction[] = [];

    // Step 0: Departure
    const firstPoint = coords[0];
    const secondPoint = coords[1];
    const initialDist = calculateHaversineDistanceMeters(firstPoint[0], firstPoint[1], secondPoint[0], secondPoint[1]);
    steps.push({
      id: 0,
      text: stage === 'TO_PATIENT' ? `Starting emergency navigation towards patient incident scene.` : `Starting emergency navigation to ${destClean}.`,
      maneuver: 'start',
      distanceText: formatFriendlyDistance(initialDist),
      stepDistanceMeters: initialDist,
      stepDurationSeconds: Math.round(initialDist / 10),
      roadName: waypoints[0] || 'Emergency Corridor',
      location: firstPoint,
      progressPercent: 0,
    });

    // Generate steps at bearing changes along polyline points
    let prevBearing = calculateBearing(firstPoint[0], firstPoint[1], secondPoint[0], secondPoint[1]);
    let accumulatedDist = initialDist;

    for (let i = 1; i < totalPoints - 1; i++) {
      const pCurrent = coords[i];
      const pNext = coords[i + 1];
      const segDist = calculateHaversineDistanceMeters(pCurrent[0], pCurrent[1], pNext[0], pNext[1]);
      const currentBearing = calculateBearing(pCurrent[0], pCurrent[1], pNext[0], pNext[1]);
      const maneuver = getManeuverFromBearingChange(prevBearing, currentBearing);

      // If noticeable turn or significant distance
      if (maneuver !== 'straight' || accumulatedDist > 800 || i === Math.floor(totalPoints / 2)) {
        const wpName = waypoints[steps.length % waypoints.length] || `Emergency Corridor sector ${steps.length}`;
        let spokenText = '';
        if (maneuver === 'turn-left') {
          spokenText = `In ${formatFriendlyDistance(segDist)}, turn left onto ${wpName}.`;
        } else if (maneuver === 'turn-right') {
          spokenText = `In ${formatFriendlyDistance(segDist)}, turn right onto ${wpName}.`;
        } else {
          spokenText = `Continue straight along ${wpName} for ${formatFriendlyDistance(segDist)}.`;
        }

        steps.push({
          id: steps.length,
          text: spokenText,
          maneuver,
          distanceText: formatFriendlyDistance(segDist),
          stepDistanceMeters: segDist,
          stepDurationSeconds: Math.max(10, Math.round(segDist / 10)),
          roadName: wpName,
          location: pCurrent,
          progressPercent: Math.round((i / (totalPoints - 1)) * 90),
        });

        prevBearing = currentBearing;
        accumulatedDist = 0;
      } else {
        accumulatedDist += segDist;
      }
    }

    // Penultimate step: Approaching
    const lastCoord = coords[coords.length - 1];
    steps.push({
      id: steps.length,
      text: `You are approaching destination: ${destClean}.`,
      maneuver: 'approaching',
      distanceText: 'In 200m',
      stepDistanceMeters: 200,
      stepDurationSeconds: 15,
      roadName: destClean,
      location: lastCoord,
      progressPercent: 95,
    });

    // Final step: Arrival
    steps.push({
      id: steps.length,
      text: stage === 'TO_PATIENT'
        ? `You have reached the patient incident scene. Prepare triage and stabilization.`
        : `You have arrived at ${destClean}. Hand over patient to emergency trauma team.`,
      maneuver: 'reached',
      distanceText: 'Arrived',
      stepDistanceMeters: 0,
      stepDurationSeconds: 0,
      roadName: destClean,
      location: lastCoord,
      progressPercent: 100,
    });

    return steps;
  }

  // 3. Fallback when route has no coordinates or steps
  return [
    {
      id: 0,
      text: `Starting navigation to ${destClean}.`,
      maneuver: 'start',
      distanceText: 'Departing base',
      progressPercent: 0,
    },
    {
      id: 1,
      text: `Continue straight along emergency corridor towards ${destClean}.`,
      maneuver: 'straight',
      distanceText: 'In 500m',
      progressPercent: 50,
    },
    {
      id: 2,
      text: `You have reached the destination: ${destClean}.`,
      maneuver: 'reached',
      distanceText: 'Arrived',
      progressPercent: 100,
    },
  ];
}

// Memory to prevent repeating the identical spoken announcement in quick succession
let lastSpokenText: string = '';
let lastSpokenTime: number = 0;

/**
 * Plays speech using Web Speech API with duplicate suppression and multilingual support
 */
export function speakInstruction(
  text: string,
  isMuted: boolean,
  callbacks?: { onStart?: () => void; onEnd?: () => void; onError?: () => void },
  options?: {
    language?: 'en' | 'kn' | 'hi' | string;
    forceRepeat?: boolean;
    rate?: number;
    pitch?: number;
  }
): void {
  if (isMuted || !isTextToSpeechSupported() || !text) {
    return;
  }

  const now = Date.now();
  // Prevent repeating identical announcement within 8 seconds unless forceRepeat is requested
  if (!options?.forceRepeat && text === lastSpokenText && now - lastSpokenTime < 8000) {
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.02;

    const lang = options?.language || 'en';
    if (lang === 'kn') {
      utterance.lang = 'kn-IN';
    } else if (lang === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    // Pick best matching natural voice if available
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice: SpeechSynthesisVoice | undefined;

    if (lang === 'kn') {
      preferredVoice = voices.find((v) => v.lang.startsWith('kn') || v.lang.includes('Kannada'));
    } else if (lang === 'hi') {
      preferredVoice = voices.find((v) => v.lang.startsWith('hi') || v.lang.includes('Hindi'));
    } else {
      preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('India'))
      ) || voices.find((v) => v.lang.startsWith('en'));
    }

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      lastSpokenText = text;
      lastSpokenTime = Date.now();
      if (callbacks?.onStart) callbacks.onStart();
    };
    if (callbacks?.onEnd) utterance.onend = callbacks.onEnd;
    if (callbacks?.onError) utterance.onerror = callbacks.onError;

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Voice navigation speech error:', err);
    if (callbacks?.onError) callbacks.onError();
  }
}

/**
 * Stops any speech currently in progress
 */
export function cancelSpeech(): void {
  if (isTextToSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
      lastSpokenText = '';
    } catch {
      // Ignore
    }
  }
}
