import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useLocation } from '../context/LocationContext';
import { api } from '../services/api';
import { EmergencyRequest, EmergencyStatus } from '../types';
import { soundEffects } from '../utils/sound';
import { EmergencyStatusStepper } from './EmergencyStatusStepper';
import { FirstAidGuide } from './FirstAidGuide';
import { RouteMapVisualizer } from './RouteMapVisualizer';
import { EmergencyReportModal } from './EmergencyReportModal';
import { PinnedLocationMap } from './PinnedLocationMap';
import { VoiceSymptomRecorder } from './VoiceSymptomRecorder';
import { LiveFleetRadar } from './LiveFleetRadar';
import { PatientMedicalProfileCard } from './PatientMedicalProfileCard';
import { PatientMedicalProfileModal } from './PatientMedicalProfileModal';
import { EmergencyHealthPassModal } from './EmergencyHealthPassModal';
import { AmbulanceRatingCard } from './AmbulanceRatingCard';
import { AmbulanceProximityAlertBanner } from './AmbulanceProximityAlertBanner';
import { PatientVoiceAssistant } from './PatientVoiceAssistant';
import { speakInstruction, cancelSpeech } from '../utils/voiceNavigation';
import { socketService } from '../services/socketService';
import { PatientSidebar, PatientTab } from './patient/PatientSidebar';
import { 
  AlertOctagon, 
  MapPin, 
  Phone, 
  User, 
  Truck, 
  Activity, 
  Heart, 
  Clock, 
  Send, 
  CheckCircle2, 
  Compass, 
  RefreshCw,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  FileText,
  Download,
  Crosshair,
  Navigation,
  Loader2,
  LocateFixed,
  Edit3,
  Check,
  Mic,
  Volume2,
  Star,
  Radio,
  QrCode,
  X,
  Menu,
  Bell,
  Home
} from 'lucide-react';

function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const PatientDashboard: React.FC = () => {
  const { user, updateUser, showToast, logout } = useAuth();
  const { language, t } = useLanguage();
  const { unreadCount, fetchNotifications } = useNotifications();

  // Tab-based navigation & sidebar state
  const [activeTab, setActiveTab] = useState<PatientTab>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const EMERGENCY_TYPES = [
    { 
      id: 'Cardiac Arrest / Heart Attack', 
      label: language === 'kn' ? 'ಹೃದಯಾಘಾತ / ಎದೆ ನೋವು' : language === 'hi' ? 'दिल का दौरा / सीने में दर्द' : 'Cardiac Arrest / Chest Pain', 
      icon: Heart, 
      color: 'text-red-600 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900' 
    },
    { 
      id: 'Severe Trauma / Accident', 
      label: language === 'kn' ? 'ಅಪಘಾತ / ತೀವ್ರ ರಕ್ತಸ್ರಾವ' : language === 'hi' ? 'दुर्घटना / गंभीर रक्तस्राव' : 'Accident / Severe Bleeding', 
      icon: AlertTriangle, 
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' 
    },
    { 
      id: 'Respiratory Distress', 
      label: language === 'kn' ? 'ಉಸಿರಾಟದ ತೊಂದರೆ / ಅಸ್ತಮಾ' : language === 'hi' ? 'सांस लेने में तकलीफ / अस्थमा' : 'Breathing Difficulty / Asthma', 
      icon: Activity, 
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900' 
    },
    { 
      id: 'Stroke / Neurological', 
      label: language === 'kn' ? 'ಪಾರ್ಶ್ವವಾಯು (ಸ್ಟ್ರೋಕ್)' : language === 'hi' ? 'स्ट्रोक / अचानक पक्षाघात' : 'Stroke / Sudden Paralysis', 
      icon: ShieldAlert, 
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900' 
    },
    { 
      id: 'Pregnancy / Labor Emergency', 
      label: language === 'kn' ? 'ಗರ್ಭಧಾರಣೆ / ಪ್ರಸವ ತುರ್ತು' : language === 'hi' ? 'गर्भावस्था / प्रसव आपातकाल' : 'Pregnancy / Labor Crisis', 
      icon: Heart, 
      color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-900' 
    },
    { 
      id: 'Unconscious / Fainting', 
      label: language === 'kn' ? 'ಪ್ರಜ್ಞಾಹೀನತೆ / ತೀವ್ರ ಕುಸಿತ' : language === 'hi' ? 'बेहोशी / गंभीर गिरावट' : 'Unconscious / Severe Fall', 
      icon: AlertOctagon, 
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900' 
    },
    { 
      id: 'General Medical Emergency', 
      label: language === 'kn' ? 'ಇತರ ಗಂಭೀರ ವೈದ್ಯಕೀಯ ತುರ್ತು' : language === 'hi' ? 'अन्य गंभीर चिकित्सा आपातकाल' : 'Other Critical Emergency', 
      icon: Activity, 
      color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' 
    },
  ];

  // Form states
  const { 
    userCoords, 
    resolvedAddress: contextAddress, 
    locationPermission, 
    requestLocation, 
    lastGpsTimestamp 
  } = useLocation();

  const [patientName, setPatientName] = useState(user?.name || '');
  const [emergencyType, setEmergencyType] = useState('Cardiac Arrest / Heart Attack');
  const [location, setLocation] = useState('');
  const [patientCoords, setPatientCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(userCoords);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(contextAddress || null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [lastPinnedTimestamp, setLastPinnedTimestamp] = useState<string | null>(lastGpsTimestamp || null);
  const [isManualEditing, setIsManualEditing] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'locating'>(
    locationPermission === 'granted' ? 'granted' : locationPermission === 'denied' ? 'denied' : 'prompt'
  );
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [sessionEmergencyId, setSessionEmergencyId] = useState<number | null>(null);

  // Patient Medical Profile & Emergency Contact Modal
  const [isMedicalProfileModalOpen, setIsMedicalProfileModalOpen] = useState(false);
  const [isHealthPassModalOpen, setIsHealthPassModalOpen] = useState(false);

  // Voice-to-Text Symptom Recording states
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceNotesAttached, setVoiceNotesAttached] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isUpdatingActiveEmergencyNotes, setIsUpdatingActiveEmergencyNotes] = useState(false);

  const handleApplyVoiceSymptoms = async (data: {
    rawTranscript: string;
    enhancedNotes: string;
    suggestedEmergencyType?: string;
    urgency?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    symptoms?: string[];
  }) => {
    setVoiceTranscript(data.rawTranscript);
    setVoiceNotesAttached(true);

    if (data.enhancedNotes) {
      setNotes(data.enhancedNotes);
    } else if (data.rawTranscript) {
      setNotes(`[PATIENT SYMPTOMS]: ${data.rawTranscript}`);
    }

    if (data.suggestedEmergencyType) {
      const match = EMERGENCY_TYPES.find((t) =>
        t.id.toLowerCase().includes(data.suggestedEmergencyType!.toLowerCase()) ||
        data.suggestedEmergencyType!.toLowerCase().includes(t.id.toLowerCase())
      );
      if (match) {
        setEmergencyType(match.id);
      }
    }

    if (isUpdatingActiveEmergencyNotes && activeEmergency) {
      try {
        await api.updateEmergencyNotes(activeEmergency.id, {
          notes: data.enhancedNotes || data.rawTranscript,
          updatedBy: user?.name || 'Patient',
        });
        showToast('Emergency symptoms updated! Dispatcher and oncoming crew alerted.', 'success');
        fetchActiveEmergency();
      } catch (err: any) {
        showToast(err.message || 'Failed to update symptoms for active emergency', 'error');
      } finally {
        setIsUpdatingActiveEmergencyNotes(false);
      }
    } else {
      showToast('Voice symptoms recorded! Clear dispatcher context attached.', 'success');
    }
  };

  useEffect(() => {
    if (userCoords) {
      setPatientCoords((prev) => {
        if (
          prev &&
          prev.latitude === userCoords.latitude &&
          prev.longitude === userCoords.longitude &&
          prev.accuracy === userCoords.accuracy
        ) {
          return prev;
        }
        return userCoords;
      });
      const nextPerm = locationPermission === 'granted' ? 'granted' : locationPermission === 'denied' ? 'denied' : 'prompt';
      setLocationPermissionStatus((prev) => (prev === nextPerm ? prev : nextPerm));
      if (lastGpsTimestamp) {
        setLastPinnedTimestamp((prev) => (prev === lastGpsTimestamp ? prev : lastGpsTimestamp));
      }
      if (contextAddress) {
        setLocation((prev) => (prev ? prev : contextAddress));
        setResolvedAddress((prev) => (prev ? prev : contextAddress));
      }
    }
  }, [userCoords, contextAddress, locationPermission, lastGpsTimestamp]);

  // Active Emergency state
  const [activeEmergency, setActiveEmergency] = useState<EmergencyRequest | null>(null);
  const [patientHistory, setPatientHistory] = useState<EmergencyRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [reportModalEmergencyId, setReportModalEmergencyId] = useState<number | null>(null);
  const [fallbackReportEmergency, setFallbackReportEmergency] = useState<EmergencyRequest | undefined>(undefined);

  // Track completed emergency IDs dismissed by patient so they can initiate new SOS
  const [dismissedEmergencyIds, setDismissedEmergencyIds] = useState<Set<number>>(new Set());

  const handleDismissCompletedSession = (id: number) => {
    setDismissedEmergencyIds((prev) => new Set([...prev, id]));
    setActiveEmergency((prev) => (prev?.id === id ? null : prev));
    setSessionEmergencyId((prev) => (prev === id ? null : prev));
  };

  const openReportModal = (id: number, emergency?: EmergencyRequest) => {
    setReportModalEmergencyId(id);
    setFallbackReportEmergency(emergency);
  };

  // 2km Proximity Alert & Voice Commands state
  const alerted2kmEmergenciesRef = useRef<Set<number>>(new Set());
  const [isProximityBannerVisible, setIsProximityBannerVisible] = useState(true);
  const [isSpeakingProximityAlert, setIsSpeakingProximityAlert] = useState(false);
  const [simulatedDistanceKm, setSimulatedDistanceKm] = useState<number | null>(null);

  const computeAmbulanceDistance = useCallback((emergency: EmergencyRequest): { distanceKm: number; etaMinutes: number; isWithin2Km: boolean } => {
    if (simulatedDistanceKm !== null) {
      const eta = Math.max(1, Math.round(simulatedDistanceKm * 2.2));
      return { distanceKm: simulatedDistanceKm, etaMinutes: eta, isWithin2Km: simulatedDistanceKm <= 2.0 };
    }

    const pLat = patientCoords?.latitude || emergency.latitude || emergency.patient_latitude;
    const pLng = patientCoords?.longitude || emergency.longitude || emergency.patient_longitude;
    const dLat = emergency.driver_current_latitude;
    const dLng = emergency.driver_current_longitude;

    if (pLat && pLng && dLat && dLng) {
      const calculatedKm = calculateHaversineDistanceKm(pLat, pLng, dLat, dLng);
      const eta = Math.max(1, Math.round(calculatedKm * 2.2));
      return { distanceKm: calculatedKm, etaMinutes: eta, isWithin2Km: calculatedKm <= 2.0 };
    }

    const fallbackDist = typeof emergency.current_distance_km === 'number' ? emergency.current_distance_km : 1.8;
    const fallbackEta = emergency.current_eta_minutes || Math.max(1, Math.round(fallbackDist * 2.2));
    return { distanceKm: fallbackDist, etaMinutes: fallbackEta, isWithin2Km: fallbackDist <= 2.0 };
  }, [simulatedDistanceKm, patientCoords]);

  const playProximityVoiceAnnouncement = useCallback((emergency: EmergencyRequest, distKm: number, etaMin: number) => {
    const unit = emergency.vehicle_number || 'Ambulance';
    let speechText = '';
    if (language === 'kn') {
      speechText = `ಗಮನಿಸಿ! ನಿಯೋಜಿತ ಆಂಬ್ಯುಲೆನ್ಸ್ ${unit} ನಿಮ್ಮ ಸ್ಥಳದಿಂದ 2 ಕಿಲೋಮೀಟರ್ ಒಳಗೆ ತಲುಪಿದೆ. ಅಂದಾಜು ${etaMin} ನಿಮಿಷಗಳಲ್ಲಿ ಆಗಮಿಸಲಿದೆ. ದಯವಿಟ್ಟು ಮುಖ್ಯ ಬಾಗಿಲನ್ನು ತೆರೆದಿಡಿ ಮತ್ತು ಫೋನ್ ಬಳಿ ಇಟ್ಟುಕೊಳ್ಳಿ.`;
    } else if (language === 'hi') {
      speechText = `ध्यान दें! आपकी एम्बुलेंस ${unit} अब आपके स्थान से 2 किलोमीटर के दायरे में आ चुकी है। लगभग ${etaMin} मिनट में पहुँचेगी। कृपया प्रवेश द्वार खुला रखें।`;
    } else {
      speechText = `Attention: Your assigned ambulance, unit ${unit}, is now within 2 kilometers of your location. Estimated arrival in approximately ${etaMin} minutes. Please keep your phone accessible and ensure entry gates are unlocked.`;
    }

    setIsSpeakingProximityAlert(true);
    speakInstruction(speechText, false, {
      onStart: () => setIsSpeakingProximityAlert(true),
      onEnd: () => setIsSpeakingProximityAlert(false),
      onError: () => setIsSpeakingProximityAlert(false),
    });
  }, [language]);

  // Automated 2km Proximity Alert Trigger
  useEffect(() => {
    if (!activeEmergency) return;
    if (!['DRIVER_ACCEPTED', 'ON_THE_WAY'].includes(activeEmergency.status)) return;

    const { distanceKm, etaMinutes, isWithin2Km } = computeAmbulanceDistance(activeEmergency);

    if (isWithin2Km && !alerted2kmEmergenciesRef.current.has(activeEmergency.id)) {
      alerted2kmEmergenciesRef.current.add(activeEmergency.id);
      setIsProximityBannerVisible(true);

      // Sound chime
      soundEffects.playEmergencyAlert();

      // Voice announcement
      playProximityVoiceAnnouncement(activeEmergency, distanceKm, etaMinutes);

      // Backend automated notification
      api.sendProximityAlert(activeEmergency.id, {
        distance_km: distanceKm,
        eta_minutes: etaMinutes,
      }).then(() => {
        fetchNotifications();
      }).catch((err) => {
        console.debug('Proximity alert API notify notice:', err);
      });

      showToast(`🚨 AMBULANCE NEARBY: Assigned unit is within 2 km (${distanceKm.toFixed(1)} km away)!`, 'success');
    }
  }, [activeEmergency, computeAmbulanceDistance, fetchNotifications, playProximityVoiceAnnouncement, showToast]);

  const activeEmergencyMetrics = activeEmergency ? computeAmbulanceDistance(activeEmergency) : null;

  // Poll active emergency every 3 seconds
  useEffect(() => {
    fetchActiveEmergency();
    fetchHistory();
    const interval = setInterval(() => {
      fetchActiveEmergency();
    }, 3000);
    return () => clearInterval(interval);
  }, [user, sessionEmergencyId]);

  // Socket.IO real-time subscriptions for immediate push updates
  useEffect(() => {
    const unsubLocation = socketService.onAmbulanceLocationUpdate((data) => {
      setActiveEmergency((prev) => {
        if (!prev) return prev;
        if (prev.ambulance_id === data.ambulanceId || prev.id === data.emergencyId) {
          return {
            ...prev,
            driver_current_latitude: data.latitude,
            driver_current_longitude: data.longitude,
            driver_accuracy: data.accuracy ?? prev.driver_accuracy,
          };
        }
        return prev;
      });
    });

    const unsubStatus = socketService.onAmbulanceStatusUpdate((data) => {
      setActiveEmergency((prev) => {
        if (!prev || prev.id !== data.emergencyId) return prev;
        if (prev.status !== data.status) {
          fetchNotifications();
          soundEffects.playSuccessTone();
        }
        return {
          ...prev,
          status: data.status as EmergencyStatus,
        };
      });
    });

    const unsubAssigned = socketService.onEmergencyAssigned((data) => {
      setActiveEmergency((prev) => {
        if (!prev || prev.id !== data.emergency.id) return prev;
        soundEffects.playEmergencyAlert();
        showToast(`Ambulance ${data.ambulance?.vehicle_number || ''} assigned to your emergency!`, 'success');
        return {
          ...prev,
          ...data.emergency,
          status: 'DRIVER_ACCEPTED' as EmergencyStatus,
          ambulance_id: data.ambulance?.id || prev.ambulance_id,
          vehicle_number: data.ambulance?.vehicle_number || prev.vehicle_number,
        };
      });
    });

    return () => {
      unsubLocation();
      unsubStatus();
      unsubAssigned();
    };
  }, [fetchNotifications, showToast]);

  // Sync user details to form
  useEffect(() => {
    if (user) {
      if (user.name) setPatientName(user.name);
      if (user.phone) setPhone(user.phone);
    } else {
      setPatientName('');
      setPhone('');
    }
  }, [user]);

  const fetchActiveEmergency = async () => {
    try {
      const res = await api.getEmergencies();

      // 1. Check for active in-progress emergency (WAITING_FOR_DRIVER, DRIVER_ACCEPTED, ON_THE_WAY, REACHED)
      let ongoing: EmergencyRequest | undefined;
      if (user?.id) {
        ongoing = res.emergencies.find(
          (e) => e.patient_id === user.id && !['COMPLETED', 'CANCELLED'].includes(e.status)
        );
      } else if (sessionEmergencyId) {
        ongoing = res.emergencies.find(
          (e) => e.id === sessionEmergencyId && !['COMPLETED', 'CANCELLED'].includes(e.status)
        );
      }

      if (ongoing) {
        setActiveEmergency(ongoing);
        return;
      }

      // 2. If no ongoing emergency, check if the session emergency or active emergency just completed
      const trackedId = sessionEmergencyId || activeEmergency?.id;
      if (trackedId) {
        const completedMatch = res.emergencies.find(
          (e) => e.id === trackedId && e.status === 'COMPLETED'
        );
        if (completedMatch && !dismissedEmergencyIds.has(completedMatch.id)) {
          setActiveEmergency(completedMatch);
          return;
        }
      }

      // 3. Or check if user has a recent unrated completed emergency within last 12 hours
      if (user?.id) {
        const recentCompleted = res.emergencies.find(
          (e) => e.patient_id === user.id && e.status === 'COMPLETED' && !e.rating_submitted_at && !dismissedEmergencyIds.has(e.id)
        );
        if (recentCompleted) {
          const ageMs = Date.now() - new Date(recentCompleted.created_at).getTime();
          if (ageMs < 12 * 60 * 60 * 1000) {
            setActiveEmergency(recentCompleted);
            return;
          }
        }
      }

      // 4. Otherwise, if current activeEmergency was completed and now dismissed
      setActiveEmergency((prev) => {
        if (prev && prev.status === 'COMPLETED' && !dismissedEmergencyIds.has(prev.id)) {
          const fresh = res.emergencies.find((e) => e.id === prev.id);
          return fresh || prev;
        }
        return null;
      });
    } catch (e) {
      console.warn('Error fetching active emergency:', e);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.getEmergencies();
      if (user?.id) {
        setPatientHistory(res.emergencies.filter((e) => e.patient_id === user.id));
      } else if (sessionEmergencyId) {
        setPatientHistory(res.emergencies.filter((e) => e.id === sessionEmergencyId));
      } else {
        setPatientHistory([]);
      }
    } catch (e) {
      console.warn('Error fetching history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Acquire high-precision location via Browser Geolocation API and auto-pin
  const acquireCurrentLocation = (silent: boolean = false): Promise<{ latitude: number; longitude: number; accuracy?: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        if (!silent) showToast('Geolocation is not supported by your browser', 'error');
        setLocationPermissionStatus('denied');
        resolve(null);
        return;
      }

      setIsLocating(true);
      setLocationPermissionStatus('locating');

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setIsLocating(false);
          const { latitude, longitude, accuracy } = position.coords;
          const coords = { latitude, longitude, accuracy: Math.round(accuracy) };
          setPatientCoords(coords);
          setLocationPermissionStatus('granted');
          setLastPinnedTimestamp(new Date().toLocaleTimeString());

          const fallbackAddress = `GPS Location [${latitude.toFixed(5)}, ${longitude.toFixed(5)}] (±${Math.round(accuracy)}m)`;

          // Reverse geocode in background to auto-populate readable street/landmark
          try {
            setIsReverseGeocoding(true);
            const geo = await api.reverseGeocode(latitude, longitude);
            if (geo && geo.formattedAddress) {
              setResolvedAddress(geo.formattedAddress);
              setLocation((prev) => {
                if (!prev || prev.startsWith('Lat:') || prev.startsWith('GPS Location')) {
                  return geo.formattedAddress;
                }
                return prev;
              });
            } else {
              setResolvedAddress(fallbackAddress);
              setLocation((prev) => (!prev || prev.startsWith('Lat:') || prev.startsWith('GPS Location') ? fallbackAddress : prev));
            }
          } catch {
            setResolvedAddress(fallbackAddress);
            setLocation((prev) => (!prev || prev.startsWith('Lat:') || prev.startsWith('GPS Location') ? fallbackAddress : prev));
          } finally {
            setIsReverseGeocoding(false);
          }

          if (!silent) {
            showToast(`📍 Current location pinned successfully! [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`, 'success');
          }
          resolve(coords);
        },
        (err) => {
          setIsLocating(false);
          setLocationPermissionStatus('denied');
          console.warn('Browser Geolocation error:', err);
          if (!silent) {
            if (err.code === 1) {
              showToast('Location permission denied. You can enter your address manually.', 'error');
            } else {
              showToast('Unable to acquire GPS signal. You can enter your address manually.', 'info');
            }
          }
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  };

  // Proactively auto-pin browser location on mount + watch for position updates
  useEffect(() => {
    let watchId: number | null = null;
    if (navigator.geolocation) {
      acquireCurrentLocation(true);

      // Keep location fresh and accurate in background
      try {
        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            setPatientCoords({ latitude, longitude, accuracy: Math.round(accuracy) });
            setLocationPermissionStatus('granted');
          },
          (err) => {
            console.warn('Geolocation watch error:', err.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } catch (e) {
        console.warn('Error establishing geolocation watch:', e);
      }
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Trigger SOS request with automatic Geolocation pinning to eliminate manual data entry
  const handleSubmitSOS = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsSubmitting(true);

    // 1. Auto-Pin Location via Geolocation API if not already pinned
    let activeCoords = patientCoords;
    let activeLocationStr = location.trim();

    if (!activeCoords && navigator.geolocation) {
      showToast('📍 Pinning your live GPS location via Browser Geolocation...', 'info');
      const freshCoords = await acquireCurrentLocation(true);
      if (freshCoords) {
        activeCoords = freshCoords;
        if (!activeLocationStr) {
          activeLocationStr = `GPS Location [${freshCoords.latitude.toFixed(5)}, ${freshCoords.longitude.toFixed(5)}]`;
          setLocation(activeLocationStr);
        }
      }
    }

    // 2. Auto-fill defaults for patient name and phone to reduce data entry time
    const finalPatientName = patientName.trim() || user?.name || 'Emergency Caller';
    const finalPhone = phone.trim() || user?.phone || '+91 98765 43210';

    if (!patientName.trim()) setPatientName(finalPatientName);
    if (!phone.trim()) setPhone(finalPhone);

    const finalLocation =
      activeLocationStr ||
      (activeCoords ? `GPS Location [${activeCoords.latitude.toFixed(5)}, ${activeCoords.longitude.toFixed(5)}]` : '');

    if (!finalLocation) {
      setIsSubmitting(false);
      showToast('Please allow browser location access or enter your location.', 'error');
      return;
    }

    soundEffects.playEmergencyAlert();

    try {
      const res = await api.createEmergency({
        patient_id: user?.id,
        patient_name: finalPatientName,
        emergency_type: emergencyType,
        location: finalLocation,
        latitude: activeCoords?.latitude,
        longitude: activeCoords?.longitude,
        phone: finalPhone,
        notes: notes.trim(),
        patient_blood_type: user?.blood_type || 'B+',
        patient_allergies: user?.allergies || 'Penicillin, NSAIDs (Aspirin)',
        patient_emergency_contact_name: user?.emergency_contact_name || 'Rajesh Rao',
        patient_emergency_contact_phone: user?.emergency_contact_phone || '+91 98451 98765',
        patient_emergency_contact_relation: user?.emergency_contact_relation || 'Spouse',
        patient_medical_notes: user?.medical_notes || 'Mild seasonal asthma',
      });

      setSessionEmergencyId(res.emergency.id);
      setActiveEmergency(res.emergency);
      showToast(res.message, 'success');
      soundEffects.playDriverDispatchTone();
      fetchHistory();
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch SOS', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEmergency = async () => {
    if (!activeEmergency) return;
    if (!window.confirm(t.patientCancelConfirm)) return;
    try {
      await api.updateEmergencyStatus(activeEmergency.id, 'CANCELLED', user?.name || 'Patient');
      showToast('Emergency request cancelled.', 'info');
      setActiveEmergency(null);
      fetchHistory();
      fetchNotifications();
    } catch (e: any) {
      showToast(e.message || 'Failed to cancel emergency', 'error');
    }
  };

  return (
    <div id="patient-portal-root" className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row w-full">
      {/* MOBILE TOPBAR WITH MENU TRIGGER & QUICK SOS */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between sticky top-16 z-30 shadow-xs">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-2 cursor-pointer"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span className="text-xs">Patient Menu</span>
        </button>

        <div className="flex items-center gap-2">
          {activeEmergency ? (
            <button
              type="button"
              onClick={() => {
                setActiveTab('tracking');
                setIsMobileSidebarOpen(false);
                const el = document.getElementById('active-emergency-status-card');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-black text-[10px] animate-pulse flex items-center gap-1 cursor-pointer"
            >
              <Truck className="w-3 h-3" />
              <span>SOS #{activeEmergency.id} Live</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setActiveTab('sos');
                setIsMobileSidebarOpen(false);
                const el = document.getElementById('patient-emergency-sos');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white font-black text-[10px] animate-pulse flex items-center gap-1 cursor-pointer"
            >
              <AlertOctagon className="w-3 h-3" />
              <span>EMERGENCY SOS</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveTab('notifications');
              setIsMobileSidebarOpen(false);
            }}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 top-16"
        />
      )}

      {/* FIXED/COLLAPSIBLE PATIENT SIDEBAR */}
      <div className={`${isMobileSidebarOpen ? 'block' : 'hidden'} md:block fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] z-30`}>
        <PatientSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
            const sectionMap: Record<string, string> = {
              dashboard: 'patient-dashboard-root',
              sos: 'patient-emergency-sos',
              status: 'active-emergency-status-card',
              tracking: 'active-emergency-status-card',
              'emergency-info': 'active-emergency-status-card',
              profile: 'patient-profile-section',
              hospitals: 'patient-live-radar-section',
              history: 'patient-requests-history',
              firstaid: 'patient-first-aid-section',
              notifications: 'patient-dashboard-root',
              settings: 'patient-profile-section',
            };
            const targetId = sectionMap[tab];
            if (targetId) {
              const el = document.getElementById(targetId) || (targetId === 'active-emergency-status-card' ? document.getElementById('patient-emergency-sos') : null);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            } else if (tab === 'dashboard') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          userName={user?.name || 'Citizen'}
          hasActiveEmergency={Boolean(activeEmergency)}
          activeEmergency={activeEmergency}
          unreadNotificationsCount={unreadCount}
          onOpenSos={() => {
            setActiveTab('sos');
            setIsMobileSidebarOpen(false);
            const el = document.getElementById('patient-emergency-sos');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onOpenMedicalProfileModal={() => setIsMedicalProfileModalOpen(true)}
          onLogout={logout}
        />
      </div>

      {/* MAIN SCROLLABLE CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto space-y-6">
        <div id="patient-dashboard-root" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div id="patient-profile-section" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.patientPortalTitle}</h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
                  {t.patientPortalBadge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user ? (
                  <>
                    {t.patientLoggedInAs}: <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span> • {t.phone}: <span className="font-mono text-slate-700 dark:text-slate-300">{user.phone || phone || 'Not set'}</span>
                  </>
                ) : (
                  <>
                    {t.status}: <span className="font-semibold text-slate-800 dark:text-slate-200">Guest Access</span> • {t.heroSubBadge}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-header-open-medical-profile"
            onClick={() => setIsMedicalProfileModalOpen(true)}
            className="p-2 px-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Manage your Emergency Medical Profile & Contacts"
          >
            <Heart className="w-3.5 h-3.5 fill-red-600 text-red-600" />
            <span>Emergency Medical ID</span>
          </button>

          <button
            onClick={() => { fetchActiveEmergency(); fetchHistory(); }}
            className="p-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{t.refresh}</span>
          </button>
        </div>
      </div>

      {/* 2KM AUTOMATED PROXIMITY ALERT BANNER */}
      {activeEmergency &&
        ['DRIVER_ACCEPTED', 'ON_THE_WAY'].includes(activeEmergency.status) &&
        activeEmergencyMetrics?.isWithin2Km &&
        isProximityBannerVisible && (
          <AmbulanceProximityAlertBanner
            emergency={activeEmergency}
            distanceKm={activeEmergencyMetrics.distanceKm}
            etaMinutes={activeEmergencyMetrics.etaMinutes}
            isAudioSpeaking={isSpeakingProximityAlert}
            onPlayVoiceAnnouncement={() => {
              playProximityVoiceAnnouncement(
                activeEmergency,
                activeEmergencyMetrics.distanceKm,
                activeEmergencyMetrics.etaMinutes
              );
            }}
            onDismiss={() => setIsProximityBannerVisible(false)}
          />
        )}

      {/* ACTIVE EMERGENCY DISPATCH & REAL-TIME STATUS CARD */}
      {activeEmergency ? (
        <div 
          id="active-emergency-status-card" 
          className={`bg-white dark:bg-slate-900 rounded-2xl border-2 shadow-xl overflow-hidden animate-in fade-in duration-300 ${
            activeEmergency.status === 'COMPLETED' ? 'border-emerald-500' : 'border-red-500'
          }`}
        >
          {/* Header Banner with Live Progress Indicator */}
          <div className="bg-[#0f172a] dark:bg-slate-950 text-white p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-lg shrink-0 ${
                activeEmergency.status === 'COMPLETED' 
                  ? 'bg-emerald-600 shadow-emerald-600/30' 
                  : 'bg-red-600 shadow-red-600/30 animate-pulse'
              }`}>
                {activeEmergency.status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-7 h-7 text-white" />
                ) : (
                  <AlertOctagon className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-white text-[11px] font-extrabold uppercase tracking-wider ${
                    activeEmergency.status === 'COMPLETED' ? 'bg-emerald-600' : 'bg-red-600'
                  }`}>
                    {activeEmergency.status === 'COMPLETED' ? `${t.missionCompleted} #${activeEmergency.id}` : `${t.liveSos} #${activeEmergency.id}`}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    activeEmergency.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {activeEmergency.status !== 'COMPLETED' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                    {activeEmergency.status === 'COMPLETED' && <Check className="w-3 h-3 text-emerald-400" />}
                    {activeEmergency.status === 'WAITING_FOR_DRIVER' 
                      ? t.searchingFleet 
                      : activeEmergency.status === 'DRIVER_ACCEPTED' 
                      ? t.ambulanceAssigned 
                      : activeEmergency.status === 'ON_THE_WAY' 
                      ? t.enRouteToYou 
                      : activeEmergency.status === 'REACHED' 
                      ? t.arrivedAtScene 
                      : activeEmergency.status === 'COMPLETED'
                      ? t.handoverCompleted 
                      : activeEmergency.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(activeEmergency.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                  {activeEmergency.emergency_type} {t.emergency}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              {activeEmergency.status !== 'COMPLETED' && activeEmergency.status !== 'CANCELLED' && (
                <button
                  id="btn-active-update-voice-notes"
                  type="button"
                  onClick={() => {
                    setIsUpdatingActiveEmergencyNotes(true);
                    setIsVoiceModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  title="Record updated symptoms via voice to notify dispatcher"
                >
                  <Mic className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                  <span className="hidden sm:inline">{t.voiceUpdateDispatcher || 'Update Dispatcher with Voice'}</span>
                  <span className="sm:hidden">{t.voiceUpdate}</span>
                </button>
              )}
              {activeEmergency.status === 'COMPLETED' && (
                <button
                  id="btn-active-view-report"
                  type="button"
                  onClick={() => openReportModal(activeEmergency.id, activeEmergency)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t.viewReport}</span>
                </button>
              )}
              {activeEmergency.status === 'COMPLETED' ? (
                <button
                  id="btn-dismiss-completed-sos-header"
                  type="button"
                  onClick={() => handleDismissCompletedSession(activeEmergency.id)}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition border border-slate-700 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{t.closeNewSos}</span>
                </button>
              ) : (
                <button
                  id="btn-cancel-patient-sos"
                  onClick={handleCancelEmergency}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition border border-slate-700 cursor-pointer shadow-xs"
                >
                  {t.patientCancelSOS}
                </button>
              )}
            </div>
          </div>

          {/* If Mission Completed: Prominent Report Banner */}
          {activeEmergency.status === 'COMPLETED' && (
            <div className="bg-emerald-950/90 border-b border-emerald-800 p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {t.emergencyMissionFinalized}
                  </h4>
                  <p className="text-xs text-emerald-200/80">
                    {t.emergencyMissionFinalizedDesc}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  id="btn-patient-view-emergency-report"
                  type="button"
                  onClick={() => openReportModal(activeEmergency.id, activeEmergency)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t.viewReport}</span>
                </button>
                <button
                  id="btn-patient-download-emergency-report"
                  type="button"
                  onClick={() => openReportModal(activeEmergency.id, activeEmergency)}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.downloadReport}</span>
                </button>
              </div>
            </div>
          )}

          {/* If Completed: 5-Star Rating Component for Ambulance Response Speed & Service */}
          {activeEmergency.status === 'COMPLETED' ? (
            <div className="p-4 sm:p-6 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <AmbulanceRatingCard
                emergency={activeEmergency}
                onRatingSubmitted={(updated) => {
                  setActiveEmergency(updated);
                  fetchHistory();
                }}
                onDismiss={() => handleDismissCompletedSession(activeEmergency.id)}
              />
            </div>
          ) : (
            /* Real-time ETA & Progress Highlight Banner (when active) */
            activeEmergency.ambulance_id ? (
              <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 text-white p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-[10px] text-blue-300 font-bold uppercase tracking-wider">
                      {t.estimatedEta}
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white flex flex-wrap items-center gap-2">
                      <span>~{activeEmergencyMetrics?.etaMinutes ?? activeEmergency.current_eta_minutes ?? 8} {t.mins}</span>
                      <span className="text-xs font-medium text-slate-300">
                        ({(activeEmergencyMetrics?.distanceKm ?? activeEmergency.current_distance_km ?? 3.2).toFixed(1)} {t.km})
                      </span>
                      {activeEmergencyMetrics?.isWithin2Km && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold uppercase tracking-wider animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          <span>{t.within2kmAlertZone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    id="btn-simulate-proximity-toggle"
                    onClick={() => {
                      const next = simulatedDistanceKm !== null ? null : 1.4;
                      setSimulatedDistanceKm(next);
                      if (next !== null) {
                        setIsProximityBannerVisible(true);
                        soundEffects.playEmergencyAlert();
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition cursor-pointer flex items-center gap-1.5"
                    title="Simulate ambulance within 2km to test automated notification and voice announcements"
                  >
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    <span>{simulatedDistanceKm !== null ? 'Reset Live GPS' : '⚡ Simulate 1.4 km (Test Alert)'}</span>
                  </button>

                  <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">{t.liveTraffic}</span>
                    <span className="font-bold text-emerald-400">{activeEmergency.current_traffic || t.lowCongestion}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{t.greenCorridorActive}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsHealthPassModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900/80 border border-red-500/40 text-[11px] font-bold text-red-200 transition cursor-pointer flex items-center gap-1.5"
                    title="Open First Responder QR Emergency Health Pass (ICE)"
                  >
                    <QrCode className="w-3.5 h-3.5 text-red-400" />
                    <span>{t.iceHealthPass}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-950/40 text-amber-200 p-4 border-b border-amber-900/50 flex items-center gap-3 text-xs">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping shrink-0" />
                <span>
                  <strong>{t.alertBroadcastInProgress}</strong> {t.alertBroadcastDesc}
                </span>
              </div>
            )
          )}

          {/* Stepper Status Progression */}
          <div className="p-6 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              {t.pipelineTitle}
            </h4>
            <EmergencyStatusStepper currentStatus={activeEmergency.status} />
          </div>

          {/* Body: Assigned Ambulance Card & Incident Details */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned Ambulance Card */}
            <div className={`border rounded-xl p-5 space-y-4 transition-all ${
              activeEmergency.ambulance_id
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-lg text-white shadow-xs ${
                    activeEmergency.ambulance_id ? 'bg-emerald-600' : 'bg-amber-500 animate-pulse'
                  }`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      activeEmergency.ambulance_id ? 'text-emerald-800 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-400'
                    }`}>
                      {activeEmergency.ambulance_id ? t.patientAssignedAmbulance : t.navAmbulanceStatus}
                    </span>
                    <h4 className="text-base font-bold font-mono text-slate-900 dark:text-white">
                      {activeEmergency.vehicle_number || t.searchingFleet}
                    </h4>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                  activeEmergency.ambulance_id
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-amber-500 text-white animate-pulse'
                }`}>
                  {activeEmergency.status === 'WAITING_FOR_DRIVER' ? t.statusWaitingForDriver : activeEmergency.status}
                </span>
              </div>

              {activeEmergency.ambulance_id && activeEmergency.vehicle_number ? (
                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-emerald-200/80 dark:border-emerald-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t.driverName}:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{activeEmergency.driver_name || 'Driver Confirmed'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t.patientAmbulanceType}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{activeEmergency.ambulance_type || 'Advanced Life Support (ALS)'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t.patientBaseLocation}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{activeEmergency.ambulance_base || 'City Central Emergency Base'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t.patientDriverContact}:</span>
                    <a
                      href={`tel:${activeEmergency.driver_phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{activeEmergency.driver_phone || t.callParamedic}</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-2 border-t border-amber-200/80 dark:border-amber-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t.driverName}:</span>
                    <span className="font-semibold text-amber-900 dark:text-amber-300 italic">{t.statusWaitingDesc}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{t.vehicleNumber}:</span>
                    <span className="font-semibold text-amber-900 dark:text-amber-300 italic">{t.broadcastingFleetAlert}</span>
                  </div>
                  <div className="p-3 bg-amber-100/70 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 text-xs font-medium leading-relaxed mt-2">
                    {t.patientActiveAlertDesc}
                  </div>
                </div>
              )}
            </div>

            {/* Patient Incident Info */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-sm">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>{t.driverIncidentLocation}</span>
              </div>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                {activeEmergency.location}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t.patientName}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeEmergency.patient_name}</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t.phone}</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">{activeEmergency.phone}</span>
                </div>
              </div>

              {activeEmergency.notes && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-xs">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{t.notes}</span>
                  <span className="text-slate-700 dark:text-slate-300">{activeEmergency.notes}</span>
                </div>
              )}
            </div>

            {/* Transmitted Patient Medical Profile & Emergency Contact */}
            <div className="lg:col-span-2 bg-gradient-to-r from-red-50/70 to-rose-50/50 dark:from-red-950/20 dark:to-slate-900 border border-red-200 dark:border-red-900/60 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-xs">
                    <Heart className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {t.clinicalProfileTransmitted}
                  </h4>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> {t.transmitted}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">{t.bloodGroup}</span>
                  <span className="text-sm font-black text-red-600 dark:text-red-400">
                    {activeEmergency.patient_blood_type || user?.blood_type || 'B+'}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">{t.allergies}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block" title={activeEmergency.patient_allergies || user?.allergies || 'None reported'}>
                    {activeEmergency.patient_allergies || user?.allergies || 'None reported'}
                  </span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">{t.primaryEmergencyContact}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                    {activeEmergency.patient_emergency_contact_name || user?.emergency_contact_name || 'Rajesh Rao'} ({activeEmergency.patient_emergency_contact_relation || user?.emergency_contact_relation || 'Spouse'})
                  </span>
                  {(activeEmergency.patient_emergency_contact_phone || user?.emergency_contact_phone) && (
                    <a
                      href={`tel:${activeEmergency.patient_emergency_contact_phone || user?.emergency_contact_phone}`}
                      className="text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1 font-semibold"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{activeEmergency.patient_emergency_contact_phone || user?.emergency_contact_phone}</span>
                    </a>
                  )}
                </div>
              </div>

              {(activeEmergency.patient_medical_notes || user?.medical_notes) && (
                <div className="mt-3 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{t.existingConditionsDirectives} </span>
                  <span>{activeEmergency.patient_medical_notes || user?.medical_notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Route Map & Live ETA Tracking */}
          {(activeEmergency.status === 'ON_THE_WAY' ||
            activeEmergency.status === 'DRIVER_ACCEPTED' ||
            activeEmergency.status === 'REACHED' ||
            Boolean(activeEmergency.ambulance_id) ||
            (activeEmergency.routes && activeEmergency.routes.length > 0)) && (
            <div className="p-6 pt-0">
              <RouteMapVisualizer
                originName={
                  activeEmergency.driver_current_latitude && activeEmergency.driver_current_longitude
                    ? `Live Ambulance GPS [${activeEmergency.driver_current_latitude.toFixed(4)}, ${activeEmergency.driver_current_longitude.toFixed(4)}]`
                    : activeEmergency.ambulance_base || 'Dispatched Ambulance Base'
                }
                destinationName={
                  (activeEmergency.navigation_stage === 'TO_HOSPITAL' || activeEmergency.status === 'REACHED') && activeEmergency.hospital_destination
                    ? activeEmergency.hospital_destination
                    : activeEmergency.location
                }
                routes={
                  activeEmergency.routes && activeEmergency.routes.length > 0
                    ? activeEmergency.routes
                    : [
                        {
                          id: 'direct-live-route',
                          name: 'Direct Priority Corridor',
                          distance: activeEmergencyMetrics?.distanceKm ? `${activeEmergencyMetrics.distanceKm.toFixed(1)} km` : '3.8 km',
                          duration: activeEmergencyMetrics?.etaMinutes ? `${activeEmergencyMetrics.etaMinutes} mins` : '7 mins',
                          trafficLevel: 'LIGHT',
                          isRecommended: true,
                          steps: [
                            'Ambulance dispatched with active siren & beacon',
                            'En route via emergency green corridor to patient location',
                            'Approaching destination with proximity alert enabled',
                          ],
                          coordinates: [
                            [
                              activeEmergency.driver_current_latitude || 12.9716,
                              activeEmergency.driver_current_longitude || 77.5946,
                            ],
                            [
                              activeEmergency.latitude || patientCoords?.latitude || 12.9784,
                              activeEmergency.longitude || patientCoords?.longitude || 77.6408,
                            ],
                          ],
                        },
                      ]
                }
                selectedRouteId={activeEmergency.selected_route_id || 'direct-live-route'}
                stage={(activeEmergency.navigation_stage as 'TO_PATIENT' | 'TO_HOSPITAL') || (activeEmergency.status === 'REACHED' ? 'TO_HOSPITAL' : 'TO_PATIENT')}
                hospitals={activeEmergency.hospital_options || []}
                selectedHospital={activeEmergency.hospital_destination}
                showSimulationControls={false}
                driverCoords={
                  activeEmergency.driver_current_latitude && activeEmergency.driver_current_longitude
                    ? {
                        latitude: activeEmergency.driver_current_latitude,
                        longitude: activeEmergency.driver_current_longitude,
                        accuracy: activeEmergency.driver_accuracy,
                      }
                    : null
                }
                patientCoords={
                  activeEmergency.latitude && activeEmergency.longitude
                    ? {
                        latitude: activeEmergency.latitude,
                        longitude: activeEmergency.longitude,
                      }
                    : activeEmergency.patient_latitude && activeEmergency.patient_longitude
                    ? {
                        latitude: activeEmergency.patient_latitude,
                        longitude: activeEmergency.patient_longitude,
                      }
                    : patientCoords
                }
                isLiveTracking={Boolean(activeEmergency.driver_current_latitude)}
                gpsPermissionStatus={activeEmergency.driver_current_latitude ? 'granted' : 'prompt'}
                lastGpsTimestamp={activeEmergency.driver_location_updated_at ? new Date(activeEmergency.driver_location_updated_at).toLocaleTimeString() : null}
              />
            </div>
          )}

          {/* Patient Voice Commands & Assistant inside Active Emergency */}
          <div className="p-6 pt-0">
            <PatientVoiceAssistant
              activeEmergency={activeEmergency}
              distanceKm={activeEmergencyMetrics?.distanceKm ?? null}
              etaMinutes={activeEmergencyMetrics?.etaMinutes ?? null}
              isWithin2Km={activeEmergencyMetrics?.isWithin2Km ?? false}
              onOpenFirstAid={() => {
                const el = document.getElementById('patient-first-aid-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenVoiceSymptoms={() => {
                setIsUpdatingActiveEmergencyNotes(true);
                setIsVoiceModalOpen(true);
              }}
              onCallDriver={() => {
                if (activeEmergency?.driver_phone) {
                  window.location.href = `tel:${activeEmergency.driver_phone}`;
                }
              }}
              onCancelEmergency={() => {
                handleCancelEmergency();
              }}
              onCheckProximity={() => {
                if (activeEmergencyMetrics?.isWithin2Km) {
                  setIsProximityBannerVisible(true);
                }
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Patient Voice Assistant when standby */}
      {!activeEmergency && (
        <div className="mb-2">
          <PatientVoiceAssistant
            activeEmergency={null}
            distanceKm={null}
            etaMinutes={null}
            isWithin2Km={false}
            onOpenFirstAid={() => {
              const el = document.getElementById('patient-first-aid-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenVoiceSymptoms={() => {
              setIsUpdatingActiveEmergencyNotes(false);
              setIsVoiceModalOpen(true);
            }}
            onCallDriver={() => {}}
            onCancelEmergency={() => {}}
            onCheckProximity={() => {}}
          />
        </div>
      )}

      {/* EMERGENCY SOS TRIGGER & FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form + SOS Trigger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Glowing Big SOS Action Card */}
          <div id="patient-emergency-sos" className="bg-[#0f172a] dark:bg-slate-950 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden border border-slate-800">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  {t.heroSubBadge}
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {t.patientTriggerTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed">
                  {t.patientTriggerDesc}
                </p>

                {/* Real-time Browser Geolocation Auto-Pin Status Badge */}
                {patientCoords ? (
                  <div className="mt-3 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <span className="font-semibold">
                      📍 {t.gpsAutoPinned} {patientCoords.latitude.toFixed(4)}, {patientCoords.longitude.toFixed(4)}
                      {patientCoords.accuracy ? ` (±${patientCoords.accuracy}m)` : ''}
                    </span>
                    <span className="text-[10px] bg-emerald-800/80 text-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold">
                      {t.instant1TapSos}
                    </span>
                  </div>
                ) : isLocating ? (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400 shrink-0" />
                    <span>{t.autoPinningGps}</span>
                  </div>
                ) : locationPermissionStatus === 'denied' ? (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{t.locationDenied}</span>
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs">
                    <Navigation className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>{t.searchingFleet}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Voice Symptoms Trigger + Pulsating SOS Button */}
              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                <button
                  id="btn-voice-symptom-sos-trigger"
                  type="button"
                  onClick={() => {
                    setIsUpdatingActiveEmergencyNotes(false);
                    setIsVoiceModalOpen(true);
                  }}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-3 border border-red-500/40 shadow-lg transition-all cursor-pointer group transform hover:scale-102 active:scale-98"
                >
                  <div className="w-9 h-9 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform shrink-0">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="block font-bold text-white">{t.voiceSymptomsBtn}</span>
                      {voiceNotesAttached && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {voiceNotesAttached ? '✓ Spoken context attached' : 'Voice-to-text triage for dispatch'}
                    </span>
                  </div>
                </button>

                {/* Pulsating SOS Button */}
                <button
                  type="button"
                  onClick={() => handleSubmitSOS()}
                  disabled={isSubmitting}
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-red-600 hover:bg-red-500 text-white font-black shadow-xl shadow-red-600/30 flex flex-col items-center justify-center shrink-0 border-4 border-red-400/40 transform hover:scale-105 active:scale-95 transition-all group cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <Loader2 className="w-8 h-8 animate-spin text-white mb-1" />
                      <span className="text-[11px] font-bold tracking-wide">PINNING & DISPATCHING</span>
                    </div>
                  ) : (
                    <>
                      <AlertOctagon className="w-9 h-9 group-hover:scale-110 transition-transform text-white" />
                      <span className="text-xl font-bold tracking-wider mt-0.5">SOS</span>
                      <span className="text-[9px] uppercase tracking-widest text-red-200 font-semibold">1-TAP DISPATCH</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Emergency Information Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.patientEmergencyDetails}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.patientTriggerDesc}</p>
              </div>
              <span className="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/50 px-2.5 py-0.5 rounded-md border border-red-100 dark:border-red-900">
                Priority
              </span>
            </div>

            <form onSubmit={handleSubmitSOS} className="space-y-4">
              {/* Emergency Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  1. {t.patientSelectEmergencyType} *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EMERGENCY_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = emergencyType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setEmergencyType(type.id)}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-red-600 bg-red-50/70 dark:bg-red-950/40 text-red-900 dark:text-red-300 ring-1 ring-red-500 font-bold shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg border ${type.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs leading-snug">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.patientName} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="e.g. Priya Rao"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.patientPhonePlaceholder} *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Location Input & Browser Geolocation Auto-Pin Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t.driverIncidentLocation} *
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => acquireCurrentLocation(false)}
                      disabled={isLocating}
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1.5 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors border border-red-200 dark:border-red-900 cursor-pointer"
                    >
                      <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-red-500' : ''}`} />
                      <span>{isLocating ? 'Auto-Pinning GPS...' : 'Re-Pin Live GPS'}</span>
                    </button>
                    {patientCoords && (
                      <button
                        type="button"
                        onClick={() => setIsManualEditing(!isManualEditing)}
                        className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isManualEditing ? 'Hide Manual' : 'Edit Details'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Auto-Pinned GPS Location Card */}
                {patientCoords ? (
                  <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/70 dark:border-emerald-900/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                          📍 Browser Geolocation Auto-Pinned
                        </span>
                        {patientCoords.accuracy && (
                          <span className="text-[10px] bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono px-1.5 py-0.5 rounded">
                            ±{patientCoords.accuracy}m fix
                          </span>
                        )}
                      </div>
                      {lastPinnedTimestamp && (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                          Pinned at {lastPinnedTimestamp}
                        </span>
                      )}
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        {isReverseGeocoding ? (
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                            Resolving street address from coordinates...
                          </span>
                        ) : resolvedAddress ? (
                          <span>{resolvedAddress}</span>
                        ) : (
                          <span>GPS Coordinates: {patientCoords.latitude.toFixed(5)}, {patientCoords.longitude.toFixed(5)}</span>
                        )}
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          Lat: {patientCoords.latitude.toFixed(5)} • Long: {patientCoords.longitude.toFixed(5)}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Leaflet Mini-Map preview of the auto-pinned GPS location */}
                    <PinnedLocationMap
                      latitude={patientCoords.latitude}
                      longitude={patientCoords.longitude}
                      accuracy={patientCoords.accuracy}
                      address={resolvedAddress || location}
                      onRefreshLocation={() => acquireCurrentLocation(false)}
                      isRefreshing={isLocating}
                    />
                  </div>
                ) : locationPermissionStatus === 'denied' ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold">Browser Location Permission Denied.</span>
                      <p className="text-[11px] leading-relaxed">
                        To auto-pin your GPS location and save typing time during an emergency, please allow location access in your browser settings. You can also type your current address below.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-blue-500" />
                      <span>Auto-pinning your GPS location via browser Geolocation API...</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => acquireCurrentLocation(false)}
                      disabled={isLocating}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                    >
                      Pin GPS Now
                    </button>
                  </div>
                )}

                {/* Manual Address Input (Shown if manual editing is active or no GPS coords yet) */}
                {(isManualEditing || !patientCoords || locationPermissionStatus === 'denied') && (
                  <div className="space-y-1 pt-1">
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Flat 302, Green Valley Apartments, Indiranagar"
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none font-medium"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      You can add floor, room number, or specific building landmarks to assist ambulance drivers.
                    </p>
                  </div>
                )}
              </div>

              {/* Medical notes & Voice Symptom Recorder */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {t.notes}
                  </label>
                  <button
                    id="btn-voice-symptom-form-trigger"
                    type="button"
                    onClick={() => {
                      setIsUpdatingActiveEmergencyNotes(false);
                      setIsVoiceModalOpen(true);
                    }}
                    className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900 transition cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span>{voiceNotesAttached ? 'Edit Voice Symptoms' : t.voiceSymptomsBtn}</span>
                  </button>
                </div>

                {voiceNotesAttached && (
                  <div className="mb-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">{t.voiceContextAttached}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUpdatingActiveEmergencyNotes(false);
                        setIsVoiceModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 underline hover:no-underline cursor-pointer"
                    >
                      Review/Re-record
                    </button>
                  </div>
                )}

                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.patientNotesPlaceholder}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
              </div>

              {/* Secure Medical Profile Attachment Preview */}
              <div className="p-3 bg-red-50/80 dark:bg-slate-800/80 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                    {user?.blood_type || 'B+'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Medical ID Transmitted on SOS:
                      </span>
                      <span className="text-xs font-black text-red-600 dark:text-red-400">
                        Type {user?.blood_type || 'B+'}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px]" title={user?.allergies || 'No known allergies'}>
                        Allergies: {user?.allergies || 'None'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Contact: {user?.emergency_contact_name || 'Rajesh Rao'} ({user?.emergency_contact_phone || '+91 98451 98765'})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsHealthPassModalOpen(true)}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
                    title="View First Responder QR Emergency Pass"
                  >
                    <QrCode className="w-3 h-3 text-red-600 dark:text-red-400" />
                    <span>ICE Pass</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMedicalProfileModalOpen(true)}
                    className="px-2.5 py-1 text-[11px] font-bold text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 rounded-lg transition-colors border border-red-200 dark:border-red-900/60 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Update Profile</span>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? t.loading : t.patientDispatchBtn}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Emergency History & Activity Log */}
        <div className="space-y-6">
          {/* Past Emergencies / Activity Log */}
          <div id="patient-requests-history" className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">{t.patientHistoryTitle}</h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                {patientHistory.length} {t.all}
              </span>
            </div>

            {isLoadingHistory ? (
              <div className="py-6 text-center text-xs text-slate-400">{t.loading}</div>
            ) : patientHistory.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {t.patientNoHistory}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                {patientHistory.slice(0, 5).map((item) => (
                  <div key={item.id} className="pt-2 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-800 dark:text-slate-200 truncate max-w-[140px]">{item.emergency_type}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                          : item.status === 'CANCELLED'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          : 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.location}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono">{item.vehicle_number ? `Unit: ${item.vehicle_number}` : 'No vehicle'}</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Report & Rating actions for completed history items */}
                    {item.status === 'COMPLETED' && (
                      <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex-wrap">
                        <button
                          type="button"
                          onClick={() => openReportModal(item.id, item)}
                          className="flex-1 py-1 px-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold rounded-md flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>View Report</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openReportModal(item.id, item)}
                          className="flex-1 py-1 px-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold rounded-md flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                        {item.rating_speed_stars ? (
                          <div 
                            title={`Response Speed: ${item.rating_speed_stars}★, Paramedic Care: ${item.rating_service_stars || item.rating_speed_stars}★`}
                            className="py-1 px-2 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 text-[10px] font-bold rounded-md flex items-center gap-1"
                          >
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{item.rating_overall_stars || item.rating_speed_stars}/5</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveEmergency(item);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="py-1 px-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold rounded-md flex items-center gap-1 transition cursor-pointer"
                          >
                            <Star className="w-3 h-3 text-amber-500" />
                            <span>Rate</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Regional Emergency Fleet & Hospital Ward Radar */}
      <div id="patient-live-radar-section" className="space-y-2 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Real-Time Local Fleet & Hospital Ward Radar</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live telemetry of regional standby ambulances and emergency ward capacity (🟢 Available vs 🔴 Full).
            </p>
          </div>
        </div>
        <LiveFleetRadar
          heightClass="h-80"
          showEmergencyCta={false}
        />
      </div>

      {/* SECURE EMERGENCY MEDICAL PROFILE (Supporting Medical Information) */}
      <div id="patient-profile-section" className="space-y-2 pt-2">
        <PatientMedicalProfileCard
          user={user}
          onOpenEditModal={() => setIsMedicalProfileModalOpen(true)}
          onProfileUpdated={(updatedUser) => {
            updateUser(updatedUser);
          }}
        />
      </div>

      {/* FIRST AID GUIDES / SECONDARY PROTOCOLS */}
      <div id="patient-first-aid-section" className="space-y-2 pt-2">
        <FirstAidGuide />
      </div>

      {/* Emergency Report Modal */}
      <EmergencyReportModal
        emergencyId={reportModalEmergencyId || 0}
        isOpen={reportModalEmergencyId !== null}
        onClose={() => setReportModalEmergencyId(null)}
        fallbackEmergency={fallbackReportEmergency}
      />

      {/* Voice-to-Text Symptom Recorder Modal */}
      <VoiceSymptomRecorder
        isOpen={isVoiceModalOpen}
        onClose={() => {
          setIsVoiceModalOpen(false);
          setIsUpdatingActiveEmergencyNotes(false);
        }}
        onApplySymptoms={handleApplyVoiceSymptoms}
        initialTranscript={voiceTranscript || (notes.startsWith('[') ? '' : notes)}
        language={language}
        t={t}
      />
      {/* Patient Medical Profile Modal */}
      <PatientMedicalProfileModal
        isOpen={isMedicalProfileModalOpen}
        onClose={() => setIsMedicalProfileModalOpen(false)}
        onProfileUpdated={(updatedUser) => {
          updateUser(updatedUser);
        }}
      />

      {/* Emergency Health Pass (ICE QR Card) Modal */}
      <EmergencyHealthPassModal
        isOpen={isHealthPassModalOpen}
        onClose={() => setIsHealthPassModalOpen(false)}
        user={user}
      />
        </div>
      </main>
    </div>
  );
};
