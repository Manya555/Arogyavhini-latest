import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Navigation,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  MapPin,
  Play,
  Square,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Radio,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Compass,
  Gauge,
  ShieldAlert,
  MessageSquare,
  Volume1,
} from 'lucide-react';
import { RouteOption, NavigationInstruction, EmergencyRequest } from '../types';
import {
  generateRouteNavigationSteps,
  speakInstruction,
  cancelSpeech,
  isTextToSpeechSupported,
  isSpeechRecognitionSupported,
  isAmbulanceOffRoute,
  calculateHaversineDistanceMeters,
  formatFriendlyDistance,
} from '../utils/voiceNavigation';
import {
  executeVoiceCommand,
  VoiceAssistantContext,
  VoiceCommandResult,
} from '../services/voiceAssistantService';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

interface VoiceNavigationHUDProps {
  route: RouteOption | null;
  stage: 'TO_PATIENT' | 'TO_HOSPITAL';
  destinationName: string;
  isMissionAccepted: boolean;
  driverCoords?: {
    latitude: number;
    longitude: number;
    speed?: number | null;
    heading?: number | null;
    accuracy?: number;
  } | null;
  patientCoords?: {
    latitude: number;
    longitude: number;
  } | null;
  activeMission?: EmergencyRequest | null;
  availableHospitals?: any[];
  onStartNavigation?: () => void;
  onStopNavigation?: () => void;
  onMarkReached?: () => void;
  onUpdateStatus?: (nextStatus?: any) => void;
  onShowRoute?: () => void;
  onRouteRecalculateNeeded?: () => void;
  onSelectHospital?: (hospitalName: string, hospital?: any) => void;
  onNavigateToHospital?: (hospital: any) => void;
  missionStatus?: string;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const VoiceNavigationHUD: React.FC<VoiceNavigationHUDProps> = ({
  route,
  stage,
  destinationName,
  isMissionAccepted,
  driverCoords,
  patientCoords,
  activeMission,
  availableHospitals = [],
  onStartNavigation,
  onStopNavigation,
  onMarkReached,
  onUpdateStatus,
  onShowRoute,
  onRouteRecalculateNeeded,
  onSelectHospital,
  onNavigateToHospital,
  missionStatus = 'DRIVER_ACCEPTED',
  showToast,
}) => {
  const { language } = useLanguage();

  // Navigation State
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false);

  // Conversational Feedback State
  const [recognizedTranscript, setRecognizedTranscript] = useState<string>('');
  const [assistantReply, setAssistantReply] = useState<string>('');
  const [lastIntentExecuted, setLastIntentExecuted] = useState<string | null>(null);

  // Real-time GPS & Route Tracking
  const [localGpsCoords, setLocalGpsCoords] = useState<{
    latitude: number;
    longitude: number;
    speed?: number | null;
    heading?: number | null;
    accuracy?: number;
  } | null>(null);
  const [offRouteDetected, setOffRouteDetected] = useState<boolean>(false);
  const [offRouteDeviationMeters, setOffRouteDeviationMeters] = useState<number>(0);
  const [distanceToManeuverMeters, setDistanceToManeuverMeters] = useState<number | null>(null);
  const [realSteps, setRealSteps] = useState<NavigationInstruction[]>([]);

  // Smart Navigation Timing Memory: tracks milestones ('500', '200', '50', 'arrived') announced for each step index
  const announcedMilestonesRef = useRef<{ [stepIdx: number]: Set<string> }>({});
  const lastRecalculateTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);
  const watchIdRef = useRef<number | null>(null);

  const ttsSupported = isTextToSpeechSupported();
  const sttSupported = isSpeechRecognitionSupported();

  // Effective GPS coordinates (from props or local continuous watcher)
  const currentCoords = useMemo(() => {
    if (driverCoords && driverCoords.latitude && driverCoords.longitude) {
      return driverCoords;
    }
    return localGpsCoords;
  }, [driverCoords, localGpsCoords]);

  // Mount/Unmount lifecycle
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Continuous GPS tracking using navigator.geolocation.watchPosition
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    try {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          if (!isMountedRef.current) return;
          setLocalGpsCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy ? Math.round(pos.coords.accuracy) : 10,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
          });
        },
        (err) => {
          console.warn('[VoiceHUD] Continuous GPS watch notice:', err.message);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 2500 }
      );
      watchIdRef.current = id;
    } catch (e) {
      console.warn('[VoiceHUD] Failed to attach watchPosition:', e);
    }

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Load real turn-by-turn road steps from route or backend API
  useEffect(() => {
    let cancelled = false;

    const resolveSteps = async () => {
      // 1. If route already has real calculated steps
      if (route?.steps && route.steps.length > 0) {
        const computed = generateRouteNavigationSteps(route, stage, destinationName);
        if (!cancelled) setRealSteps(computed);
        return;
      }

      // 2. If coordinates are present, try fetching real OSRM street steps from backend
      if (
        currentCoords &&
        route?.coordinates &&
        route.coordinates.length >= 2
      ) {
        const origin = currentCoords;
        const dest = route.coordinates[route.coordinates.length - 1];

        try {
          const apiRoute = await api.getNavigationRoute({
            originLat: origin.latitude,
            originLng: origin.longitude,
            destLat: dest[0],
            destLng: dest[1],
            emergencyId: activeMission?.id,
            emergencyType: activeMission?.emergency_type || 'General',
          });

          if (!cancelled && apiRoute && apiRoute.steps && apiRoute.steps.length > 0) {
            setRealSteps(apiRoute.steps);
            return;
          }
        } catch (err) {
          console.warn('[VoiceHUD] Could not fetch OSRM steps, falling back to polyline geometry:', err);
        }
      }

      // 3. Generate geometric steps from polyline bearing
      const generated = generateRouteNavigationSteps(route, stage, destinationName);
      if (!cancelled) setRealSteps(generated);
    };

    resolveSteps();

    return () => {
      cancelled = true;
    };
  }, [route, stage, destinationName, currentCoords?.latitude, currentCoords?.longitude, activeMission?.id]);

  // Reset steps & milestones on stage change
  useEffect(() => {
    setCurrentStepIndex(0);
    announcedMilestonesRef.current = {};
  }, [stage, route?.id]);

  const steps = realSteps.length > 0 ? realSteps : generateRouteNavigationSteps(route, stage, destinationName);
  const currentInstruction: NavigationInstruction = steps[currentStepIndex] || steps[0] || {
    id: 0,
    text: `Navigating to ${destinationName}`,
    maneuver: 'start',
    distanceText: 'Ready',
    progressPercent: 0,
  };

  // Helper to speak spoken instruction with duplicate and language handling
  const announceSpoken = useCallback(
    (text: string, forceRepeat: boolean = false) => {
      if (!text || isMuted || !ttsSupported) return;
      setIsSpeaking(true);
      speakInstruction(
        text,
        false,
        {
          onStart: () => {
            if (isMountedRef.current) setIsSpeaking(true);
          },
          onEnd: () => {
            if (isMountedRef.current) setIsSpeaking(false);
          },
          onError: () => {
            if (isMountedRef.current) setIsSpeaking(false);
          },
        },
        { language, forceRepeat }
      );
    },
    [isMuted, ttsSupported, language]
  );

  // Real-time GPS distance calculation to maneuver point and smart timing engine
  useEffect(() => {
    if (!currentCoords || !currentCoords.latitude || !currentCoords.longitude) return;
    if (!steps || steps.length === 0) return;

    const step = steps[currentStepIndex];
    if (!step) return;

    // 1. Determine target coordinates for current maneuver
    let targetLat = step.location ? step.location[0] : null;
    let targetLng = step.location ? step.location[1] : null;

    // If step doesn't have an explicit location, estimate from route polyline
    if (!targetLat && route?.coordinates && route.coordinates.length > 0) {
      const pointIndex = Math.min(
        route.coordinates.length - 1,
        Math.floor((currentStepIndex / Math.max(1, steps.length - 1)) * (route.coordinates.length - 1))
      );
      targetLat = route.coordinates[pointIndex][0];
      targetLng = route.coordinates[pointIndex][1];
    }

    if (targetLat !== null && targetLng !== null) {
      const distMeters = calculateHaversineDistanceMeters(
        currentCoords.latitude,
        currentCoords.longitude,
        targetLat,
        targetLng
      );
      setDistanceToManeuverMeters(distMeters);

      // Initialize milestone memory for this step
      if (!announcedMilestonesRef.current[currentStepIndex]) {
        announcedMilestonesRef.current[currentStepIndex] = new Set<string>();
      }
      const milestones = announcedMilestonesRef.current[currentStepIndex];

      // Smart timing announcements if voice navigation is active
      if (isVoiceActive && !isMuted) {
        // Destination Arrival: within 35 meters
        if (currentStepIndex === steps.length - 1 && distMeters < 35 && !milestones.has('arrived')) {
          milestones.add('arrived');
          announceSpoken(`You have arrived at your destination: ${destinationName}.`);
          if (showToast) showToast(`Arrived at ${destinationName}`, 'success');
        }
        // 50m / Immediate Turn: within 50 meters
        else if (distMeters <= 55 && !milestones.has('50') && currentStepIndex < steps.length - 1) {
          milestones.add('50');
          const turnWord = step.maneuver === 'turn-left' ? 'Turn left' : step.maneuver === 'turn-right' ? 'Turn right' : 'Continue straight';
          announceSpoken(`${turnWord}${step.roadName ? ` onto ${step.roadName}` : ''} now.`);
          // Auto-advance to next maneuver step
          if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
          }
        }
        // 200m Turn Alert: within 220 meters
        else if (distMeters <= 220 && distMeters > 70 && !milestones.has('200')) {
          milestones.add('200');
          announceSpoken(`In 200 meters, ${step.text.replace(/^in \d+ ?(?:m|km),? /i, '')}`);
        }
        // 500m Turn Alert: within 520 meters
        else if (distMeters <= 520 && distMeters > 300 && !milestones.has('500')) {
          milestones.add('500');
          announceSpoken(`In 500 meters, ${step.text.replace(/^in \d+ ?(?:m|km),? /i, '')}`);
        }
      }
    }

    // 2. Off-route detection (threshold: 100 meters deviation)
    if (route?.coordinates && route.coordinates.length >= 2) {
      const { isOffRoute, deviationMeters } = isAmbulanceOffRoute(
        currentCoords,
        route.coordinates,
        100
      );
      setOffRouteDetected(isOffRoute);
      setOffRouteDeviationMeters(deviationMeters);

      if (isOffRoute) {
        const now = Date.now();
        // Debounce automatic recalculation: once every 15 seconds
        if (now - lastRecalculateTimeRef.current > 15000) {
          lastRecalculateTimeRef.current = now;
          const rerouteMsg =
            language === 'kn'
              ? 'ಮಾರ್ಗ ಬದಲಾವಣೆ ಕಂಡುಬಂದಿದೆ. ಹೊಸ ಮಾರ್ಗವನ್ನು ಮರುಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ.'
              : language === 'hi'
              ? 'मार्ग विचलन का पता चला। नया मार्ग निकाला जा रहा है।'
              : 'You are off the route. Recalculating route now.';
          announceSpoken(rerouteMsg, true);
          if (showToast) {
            showToast(`Route deviation (${deviationMeters}m). Auto-recalculating...`, 'info');
          }
          if (onRouteRecalculateNeeded) {
            onRouteRecalculateNeeded();
          }
        }
      }
    }
  }, [
    currentCoords,
    currentStepIndex,
    steps,
    route?.coordinates,
    isVoiceActive,
    isMuted,
    destinationName,
    announceSpoken,
    onRouteRecalculateNeeded,
    showToast,
    language,
  ]);

  // Execute intent-based conversational voice input
  const processVoiceInput = useCallback(
    async (rawText: string) => {
      const clean = rawText.trim();
      if (!clean) return;

      setRecognizedTranscript(clean);
      setIsProcessingVoice(true);

      const context: VoiceAssistantContext = {
        role: 'driver',
        language: (language as 'en' | 'kn' | 'hi') || 'en',
        driverCoords: currentCoords,
        userCoords: currentCoords,
        patientCoords,
        activeEmergency: activeMission,
        activeRoute: route,
        availableHospitals,
        selectedHospitalName: destinationName,
        currentStep: steps[currentStepIndex] || null,
        nextStep: steps[currentStepIndex + 1] || null,
        distanceToNextStepMeters: distanceToManeuverMeters,
        remainingDistanceKm: route?.distanceKm ?? activeMission?.current_distance_km ?? null,
        remainingDurationMinutes: route?.estimatedMinutes ?? activeMission?.current_eta_minutes ?? null,
        currentStreetName: currentInstruction.roadName || null,
        isNavigating: isVoiceActive,
        trafficStatus: route?.traffic || activeMission?.current_traffic || 'Moderate',
      };

      try {
        const result: VoiceCommandResult = await executeVoiceCommand(clean, context);
        setAssistantReply(result.spokenResponse);
        setLastIntentExecuted(result.intent);

        // Speak assistant response aloud
        announceSpoken(result.spokenResponse, result.intent === 'REPEAT_LAST_INSTRUCTION');

        // Handle dispatched actions
        if (result.action) {
          switch (result.action.type) {
            case 'START_NAVIGATION':
              setIsVoiceActive(true);
              if (onStartNavigation) onStartNavigation();
              if (showToast) showToast('Voice Navigation Started', 'success');
              break;

            case 'STOP_NAVIGATION':
              setIsVoiceActive(false);
              cancelSpeech();
              if (onStopNavigation) onStopNavigation();
              if (showToast) showToast('Voice Navigation Paused', 'info');
              break;

            case 'CANCEL_NAVIGATION':
              setIsVoiceActive(false);
              cancelSpeech();
              if (onStopNavigation) onStopNavigation();
              if (showToast) showToast('Navigation Cancelled', 'info');
              break;

            case 'REROUTE':
              if (onRouteRecalculateNeeded) {
                onRouteRecalculateNeeded();
              }
              if (showToast) showToast('Recalculating route...', 'info');
              break;

            case 'NAVIGATE_TO_HOSPITAL':
              if (result.action.payload) {
                const hosp = result.action.payload;
                if (onNavigateToHospital) {
                  onNavigateToHospital(hosp);
                } else if (onSelectHospital) {
                  onSelectHospital(hosp.name, hosp);
                }
                if (showToast) showToast(`Routing to ${hosp.name}`, 'success');
              }
              break;

            case 'SELECT_HOSPITAL':
              if (result.action.payload && onSelectHospital) {
                onSelectHospital(result.action.payload.name || result.action.payload);
              }
              break;

            case 'OPEN_ROUTE':
              if (onShowRoute) onShowRoute();
              break;

            default:
              break;
          }
        }
      } catch (err) {
        console.error('[VoiceHUD] Command execution error:', err);
        const errText =
          language === 'kn'
            ? 'ಧ್ವನಿ ಆದೇಶವನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.'
            : language === 'hi'
            ? 'वॉयस कमांड को प्रोसेस नहीं किया जा सका।'
            : "I couldn't process that voice command. Please try again.";
        setAssistantReply(errText);
        announceSpoken(errText);
      } finally {
        setIsProcessingVoice(false);
      }
    },
    [
      language,
      currentCoords,
      patientCoords,
      activeMission,
      route,
      availableHospitals,
      destinationName,
      steps,
      currentStepIndex,
      distanceToManeuverMeters,
      currentInstruction.roadName,
      isVoiceActive,
      announceSpoken,
      onStartNavigation,
      onStopNavigation,
      onRouteRecalculateNeeded,
      onNavigateToHospital,
      onSelectHospital,
      onShowRoute,
      showToast,
    ]
  );

  // Toggle Speech Recognition
  const toggleListening = () => {
    if (!sttSupported) {
      if (showToast) {
        showToast('Speech recognition is not supported in this browser. Please use manual controls.', 'error');
      }
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      // Localized recognition language
      if (language === 'kn') {
        recognition.lang = 'kn-IN';
      } else if (language === 'hi') {
        recognition.lang = 'hi-IN';
      } else {
        recognition.lang = 'en-IN';
      }

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        processVoiceInput(text);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          console.warn('[VoiceHUD] Speech recognition error:', event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[VoiceHUD] Failed to start speech recognition:', err);
      setIsListening(false);
      if (showToast) showToast('Could not initialize microphone.', 'error');
    }
  };

  // Toggle Voice Navigation
  const handleToggleVoiceNavigation = () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
      cancelSpeech();
      setIsSpeaking(false);
      if (onStopNavigation) onStopNavigation();
      if (showToast) showToast('Voice Navigation paused', 'info');
    } else {
      setIsVoiceActive(true);
      if (onStartNavigation) onStartNavigation();
      announceSpoken(currentInstruction.text, true);
      if (showToast) showToast('Voice Navigation active with real-world turn-by-turn guidance', 'success');
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      announceSpoken('Voice navigation unmuted.', true);
      if (showToast) showToast('Voice navigation unmuted', 'info');
    } else {
      cancelSpeech();
      setIsSpeaking(false);
      setIsMuted(true);
      if (showToast) showToast('Voice navigation muted', 'info');
    }
  };

  // Manual Maneuver navigation
  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      announceSpoken(steps[next].text, true);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prev = currentStepIndex - 1;
      setCurrentStepIndex(prev);
      announceSpoken(steps[prev].text, true);
    }
  };

  // Repeat current maneuver or last response
  const handleRepeat = () => {
    const textToRepeat = assistantReply || currentInstruction.text;
    announceSpoken(textToRepeat, true);
  };

  // Maneuver Icon helper
  const renderManeuverIcon = (maneuver: string) => {
    switch (maneuver) {
      case 'turn-left':
        return <CornerUpLeft className="w-8 h-8 text-amber-400 animate-pulse" />;
      case 'turn-right':
        return <CornerUpRight className="w-8 h-8 text-amber-400 animate-pulse" />;
      case 'straight':
        return <ArrowUp className="w-8 h-8 text-emerald-400 animate-pulse" />;
      case 'approaching':
        return <MapPin className="w-8 h-8 text-blue-400 animate-bounce" />;
      case 'reached':
        return <Flag className="w-8 h-8 text-emerald-400" />;
      default:
        return <Navigation className="w-8 h-8 text-amber-400" />;
    }
  };

  // Quick chips for one-tap voice testing
  const quickChips = [
    { label: language === 'kn' ? 'ನಾನು ಎಲ್ಲಿದ್ದೇನೆ?' : language === 'hi' ? 'मैं कहाँ हूँ?' : 'Where am I?', cmd: 'Where am I?' },
    { label: language === 'kn' ? 'ETA ಎಷ್ಟು?' : language === 'hi' ? 'ईटीए क्या है?' : "What's my ETA?", cmd: "What's my ETA?" },
    { label: language === 'kn' ? 'ಮುಂದಿನ ತಿರುವು' : language === 'hi' ? 'अगला मोड़' : 'Next turn?', cmd: 'What is the next turn?' },
    { label: language === 'kn' ? 'ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ' : language === 'hi' ? 'निकटतम अस्पताल' : 'Nearest Hospital', cmd: 'Find the nearest hospital' },
    { label: language === 'kn' ? 'ಮರುಮಾರ್ಗ' : language === 'hi' ? 'रिरूट' : 'Reroute', cmd: 'Reroute' },
    { label: language === 'kn' ? 'ಮತ್ತೆ ಹೇಳಿ' : language === 'hi' ? 'फिर से बोलें' : 'Repeat that', cmd: 'Repeat that' },
  ];

  return (
    <div
      id="voice-navigation-hud"
      className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden"
    >
      {/* 1. TOP HEADER: Status, Speed, GPS Accuracy & Controls */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              isVoiceActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-600'
            }`}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
                {isVoiceActive ? 'Live Real-World Navigation Active' : 'Voice Assistant Standby'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                {stage === 'TO_PATIENT' ? 'Stage 1: To Patient' : 'Stage 2: To Hospital'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md mt-0.5">
              Target: <span className="text-white font-medium">{destinationName}</span>
            </p>
          </div>
        </div>

        {/* Real-time Telemetry Badges */}
        <div className="flex items-center gap-2">
          {/* Real Speed */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-slate-300">
            <Gauge className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {currentCoords?.speed !== null && currentCoords?.speed !== undefined && currentCoords.speed > 0
                ? `${Math.round(currentCoords.speed * 3.6)} km/h`
                : '0 km/h'}
            </span>
          </div>

          {/* Real GPS Accuracy */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[11px] font-mono text-slate-300">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {currentCoords?.accuracy ? `±${Math.round(currentCoords.accuracy)}m` : 'GPS OK'}
            </span>
          </div>

          {/* Mute Button */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`p-2 rounded-xl transition cursor-pointer border ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute Voice' : 'Mute Voice'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Main Voice Navigation Toggle */}
          <button
            type="button"
            onClick={handleToggleVoiceNavigation}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md ${
              isVoiceActive
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isVoiceActive ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Pause Nav</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Nav</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. OFF-ROUTE ALERT BANNER */}
      {offRouteDetected && (
        <div className="px-5 py-2.5 bg-red-600 text-white flex items-center justify-between text-xs font-bold animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            <span>
              Off-Route Detected: {offRouteDeviationMeters}m deviation from green corridor. Auto-recalculating...
            </span>
          </div>
          <button
            type="button"
            onClick={() => onRouteRecalculateNeeded && onRouteRecalculateNeeded()}
            className="px-2.5 py-1 rounded bg-white text-red-700 hover:bg-red-50 text-[11px] font-black cursor-pointer"
          >
            Force Recalculate
          </button>
        </div>
      )}

      {/* 3. MAIN TURN MANEUVER CARD */}
      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Maneuver Icon & Distance Box */}
        <div className="md:col-span-4 flex items-center gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-center shrink-0 shadow-inner">
            {renderManeuverIcon(currentInstruction.maneuver)}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              {currentInstruction.maneuver === 'reached'
                ? 'Destination Arrived'
                : currentInstruction.maneuver === 'start'
                ? 'Departing Now'
                : 'Next Maneuver'}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono leading-none mt-1">
              {distanceToManeuverMeters !== null
                ? formatFriendlyDistance(distanceToManeuverMeters)
                : currentInstruction.distanceText || 'In 400m'}
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[150px] mt-1">
              {currentInstruction.roadName || 'Arterial Corridor'}
            </p>
          </div>
        </div>

        {/* Spoken Turn Instruction & Step Stepper */}
        <div className="md:col-span-8 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                title="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                disabled={currentStepIndex >= steps.length - 1}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                title="Next step"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRepeat}
                className="p-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Repeat instruction"
              >
                <Volume1 className="w-3.5 h-3.5" />
                <span>Repeat</span>
              </button>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
            {currentInstruction.text}
          </h3>

          {/* Progress Bar along route */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.max(
                  5,
                  Math.min(100, Math.round(((currentStepIndex + 1) / steps.length) * 100))
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 4. CONVERSATIONAL VOICE ASSISTANT BAR & SPEECH RECOGNITION */}
      <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Live Mic Activity & Transcript Display */}
          <div className="flex-1 flex items-center gap-3 bg-slate-900 p-2.5 sm:p-3 rounded-xl border border-slate-800 min-h-[48px]">
            {/* Visualizer / Mic Icon */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/40 ring-4 ring-red-500/20'
                  : isSpeaking
                  ? 'bg-emerald-600 text-white animate-bounce'
                  : isProcessingVoice
                  ? 'bg-amber-500 text-slate-950 animate-spin'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isListening ? (
                <Radio className="w-5 h-5 animate-pulse" />
              ) : isSpeaking ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </div>

            {/* Conversational Text */}
            <div className="flex-1 min-w-0">
              {isListening ? (
                <p className="text-xs text-amber-400 font-semibold animate-pulse">
                  Listening for voice command... (speak naturally)
                </p>
              ) : isProcessingVoice ? (
                <p className="text-xs text-blue-400 font-semibold animate-pulse">
                  Analyzing navigation intent...
                </p>
              ) : assistantReply ? (
                <div className="text-xs">
                  <span className="text-emerald-400 font-bold">Assistant: </span>
                  <span className="text-slate-200">{assistantReply}</span>
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Tap microphone or speak: &quot;Where am I?&quot;, &quot;What is my ETA?&quot;, &quot;Find nearest hospital&quot;
                </p>
              )}
            </div>
          </div>

          {/* Mic Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleListening}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span>{isListening ? 'Stop Listening' : 'Speak to Nav'}</span>
            </button>
          </div>
        </div>

        {/* Quick Voice Prompt Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-[11px] scrollbar-none">
          <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Quick:
          </span>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => processVoiceInput(chip.cmd)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition whitespace-nowrap cursor-pointer shrink-0 font-medium"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
