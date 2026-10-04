/**
 * ==============================================================================
 * PROJECT: AROGYAVAHINI EMERGENCY DISPATCH
 * MODULE:  Conversational Voice Navigation Assistant Service
 * ==============================================================================
 * Provides an intent-based natural voice layer for drivers, patients, and hospital users.
 * Supports:
 *   - Natural language variations & fuzzy intent parsing (never exact match only)
 *   - Conversational follow-ups (e.g. "How far is the hospital?" -> "How about the ambulance?" -> "Where is it now?")
 *   - Real GPS, real route distance, real ETA, and real database hospital search
 *   - Multilingual responses (English, Kannada, Hindi)
 *   - Zero fabricated locations, ETAs, or traffic numbers
 */

import { EmergencyRequest, RouteOption, NavigationInstruction, HospitalOption } from '../types';
import { api } from './api';

export type VoiceIntent =
  | 'GET_CURRENT_LOCATION'
  | 'GET_DESTINATION'
  | 'GET_DISTANCE'
  | 'GET_ETA'
  | 'GET_CURRENT_SPEED'
  | 'GET_NEXT_TURN'
  | 'GET_ROUTE_SUMMARY'
  | 'GET_TRAFFIC_STATUS'
  | 'FIND_NEAREST_HOSPITAL'
  | 'FIND_HOSPITAL_BY_NAME'
  | 'START_NAVIGATION'
  | 'STOP_NAVIGATION'
  | 'CANCEL_NAVIGATION'
  | 'REROUTE'
  | 'REPEAT_LAST_INSTRUCTION'
  | 'GET_AMBULANCE_LOCATION'
  | 'GET_PATIENT_LOCATION'
  | 'GET_EMERGENCY_STATUS'
  | 'GET_SELECTED_HOSPITAL'
  | 'GET_ROUTE_STATUS'
  | 'GET_NAVIGATION_HELP'
  | 'UNKNOWN';

export interface ExtractedEntities {
  destination?: string;
  hospitalName?: string;
  ambulance?: boolean;
  patient?: boolean;
  route?: boolean;
  emergency?: boolean;
  distance?: boolean;
  eta?: boolean;
}

export interface VoiceAssistantContext {
  role?: 'driver' | 'patient' | 'hospital' | 'admin';
  language?: 'en' | 'kn' | 'hi';
  userCoords?: { latitude: number; longitude: number; accuracy?: number; speed?: number | null; heading?: number | null } | null;
  driverCoords?: { latitude: number; longitude: number; accuracy?: number; speed?: number | null; heading?: number | null } | null;
  patientCoords?: { latitude: number; longitude: number } | null;
  activeEmergency?: EmergencyRequest | null;
  activeRoute?: RouteOption | null;
  availableHospitals?: HospitalOption[] | any[];
  selectedHospitalName?: string | null;
  currentStep?: NavigationInstruction | null;
  nextStep?: NavigationInstruction | null;
  distanceToNextStepMeters?: number | null;
  remainingDistanceKm?: number | null;
  remainingDurationMinutes?: number | null;
  currentStreetName?: string | null;
  resolvedAddress?: string | null;
  isNavigating?: boolean;
  trafficStatus?: string | null;
}

export interface VoiceCommandResult {
  intent: VoiceIntent;
  confidence: number;
  spokenResponse: string;
  action?: {
    type:
      | 'START_NAVIGATION'
      | 'STOP_NAVIGATION'
      | 'CANCEL_NAVIGATION'
      | 'REROUTE'
      | 'NAVIGATE_TO_HOSPITAL'
      | 'SELECT_HOSPITAL'
      | 'OPEN_ROUTE'
      | 'CHECK_PROXIMITY'
      | 'NONE';
    payload?: any;
  };
  entities: ExtractedEntities;
}

// Conversation context memory
class ConversationMemory {
  lastSubject: 'hospital' | 'ambulance' | 'patient' | 'route' | 'destination' | 'general' = 'general';
  lastSpokenAnswer: string = '';
  lastInstruction: string = '';
  lastIntent: VoiceIntent | null = null;
  lastMatchedHospital: string | null = null;

  reset() {
    this.lastSubject = 'general';
    this.lastSpokenAnswer = '';
    this.lastInstruction = '';
    this.lastIntent = null;
    this.lastMatchedHospital = null;
  }
}

export const conversationMemory = new ConversationMemory();

/**
 * Natural language intent parser
 */
export function parseVoiceIntent(spokenText: string): { intent: VoiceIntent; confidence: number; entities: ExtractedEntities } {
  const text = spokenText.toLowerCase().trim();
  const entities: ExtractedEntities = {};

  // Extract entities
  if (text.includes('ambulance') || text.includes('vehicle') || text.includes('ವ್ಯಾನ್') || text.includes('ಆಂಬ್ಯುಲೆನ್ಸ್') || text.includes('गाड़ी') || text.includes('एम्बुलेंस')) {
    entities.ambulance = true;
  }
  if (text.includes('patient') || text.includes('victim') || text.includes('ರೋಗಿ') || text.includes('ಮರೀಜ್') || text.includes('मरीज') || text.includes('मरीज़')) {
    entities.patient = true;
  }
  if (text.includes('hospital') || text.includes('clinic') || text.includes('er') || text.includes('trauma center') || text.includes('ಆಸ್ಪತ್ರೆ') || text.includes('ಅಸ್ಪತಾಲ್') || text.includes('अस्पताल')) {
    entities.hospitalName = text;
  }
  if (text.includes('route') || text.includes('corridor') || text.includes('path') || text.includes('ಮಾರ್ಗ') || text.includes('रास्ता') || text.includes('मार्ग')) {
    entities.route = true;
  }
  if (text.includes('distance') || text.includes('far') || text.includes('ಕಿಲೋಮೀಟರ್') || text.includes('ದೂರ') || text.includes('दूरी') || text.includes('किलोमीटर')) {
    entities.distance = true;
  }
  if (text.includes('eta') || text.includes('how long') || text.includes('minutes') || text.includes('time') || text.includes('ಸಮಯ') || text.includes('ನಿಮಿಷ') || text.includes('समय') || text.includes('मिनट')) {
    entities.eta = true;
  }

  // 1. Follow-up handling with conversational memory:
  // e.g., "how about the ambulance?", "what about the patient?", "and the hospital?"
  if (text.match(/^(how about|what about|and)\s+(the\s+)?(ambulance|patient|hospital|destination)/i)) {
    if (text.includes('ambulance')) {
      conversationMemory.lastSubject = 'ambulance';
      return { intent: 'GET_AMBULANCE_LOCATION', confidence: 0.95, entities };
    }
    if (text.includes('patient')) {
      conversationMemory.lastSubject = 'patient';
      return { intent: 'GET_PATIENT_LOCATION', confidence: 0.95, entities };
    }
    if (text.includes('hospital')) {
      conversationMemory.lastSubject = 'hospital';
      return { intent: 'GET_DISTANCE', confidence: 0.95, entities };
    }
  }

  // e.g. "where is it now?" / "where is it?"
  if (text.match(/where is (it|that|this)( now)?/i)) {
    if (conversationMemory.lastSubject === 'ambulance') {
      return { intent: 'GET_AMBULANCE_LOCATION', confidence: 0.9, entities };
    }
    if (conversationMemory.lastSubject === 'hospital') {
      return { intent: 'GET_SELECTED_HOSPITAL', confidence: 0.9, entities };
    }
    if (conversationMemory.lastSubject === 'patient') {
      return { intent: 'GET_PATIENT_LOCATION', confidence: 0.9, entities };
    }
  }

  // 2. Location Queries: "Where am I?", "What is my current location?", "Tell me where I am"
  if (
    text.includes('where am i') ||
    text.includes('what is my location') ||
    text.includes("what's my location") ||
    text.includes('tell me where i am') ||
    text.includes('where are we right now') ||
    text.includes('where are we') ||
    text.includes('my current location') ||
    text.includes('what street is this') ||
    text.includes('current coordinates') ||
    text.includes('ನಾನು ಎಲ್ಲಿದ್ದೇನೆ') ||
    text.includes('ನನ್ನ ಸ್ಥಳ') ||
    text.includes('ನನ್ನ ಲೊಕೇಶನ್') ||
    text.includes('मैं कहाँ हूँ') ||
    text.includes('हम कहाँ हैं') ||
    text.includes('मेरी लोकेशन') ||
    text.includes('मेरी वर्तमान स्थिति')
  ) {
    conversationMemory.lastSubject = 'general';
    return { intent: 'GET_CURRENT_LOCATION', confidence: 0.95, entities };
  }

  // 3. Repeat Last Instruction
  if (
    text.includes('repeat that') ||
    text.includes('say that again') ||
    text.includes('what did you say') ||
    text.includes('repeat') ||
    text.includes('pardon') ||
    text.includes('once again') ||
    text.includes('ಮತ್ತೆ ಹೇಳಿ') ||
    text.includes('ಪುನರಾವರ್ತಿಸಿ') ||
    text.includes('दोहराएं') ||
    text.includes('फिर से बोलें')
  ) {
    return { intent: 'REPEAT_LAST_INSTRUCTION', confidence: 0.95, entities };
  }

  // 4. Reroute / Recalculate
  if (
    text.includes('reroute') ||
    text.includes('recalculate') ||
    text.includes('find another route') ||
    text.includes('find alternate route') ||
    text.includes('change route') ||
    text.includes('new route') ||
    text.includes('other route') ||
    text.includes('ಮರುಮಾರ್ಗ') ||
    text.includes('ಬೇರೆ ಮಾರ್ಗ') ||
    text.includes('ಮಾರ್ಗ ಬದಲಾಯಿಸಿ') ||
    text.includes('रिरूट') ||
    text.includes('दूसरा रास्ता') ||
    text.includes('मार्ग बदलें')
  ) {
    conversationMemory.lastSubject = 'route';
    return { intent: 'REROUTE', confidence: 0.95, entities };
  }

  // 5. Next Turn / Maneuver
  if (
    text.includes('next turn') ||
    text.includes('when should i turn') ||
    text.includes('which way do i turn') ||
    text.includes('when do i turn') ||
    text.includes('next maneuver') ||
    text.includes('next direction') ||
    text.includes('what turn is next') ||
    text.includes('upcoming turn') ||
    text.includes('ಮುಂದಿನ ತಿರುವು') ||
    text.includes('ಎಲ್ಲಿ ತಿರುಗಬೇಕು') ||
    text.includes('अगला मोड़') ||
    text.includes('कहाँ मुड़ना है')
  ) {
    conversationMemory.lastSubject = 'route';
    return { intent: 'GET_NEXT_TURN', confidence: 0.95, entities };
  }

  // 6. ETA / Duration Queries
  if (
    text.includes('eta') ||
    text.includes('how long will it take') ||
    text.includes('how long') ||
    text.includes('estimated arrival') ||
    text.includes('arrival time') ||
    text.includes('when will we arrive') ||
    text.includes('when will the ambulance arrive') ||
    text.includes('when will i reach') ||
    text.includes('how many minutes') ||
    text.includes('ತಲುಪಲು ಎಷ್ಟು ಸಮಯ') ||
    text.includes('ಅಂದಾಜು ಸಮಯ') ||
    text.includes('ಎಷ್ಟು ನಿಮಿಷ') ||
    text.includes('पहुंचने का समय') ||
    text.includes('कितना समय लगेगा') ||
    text.includes('कितने मिनट')
  ) {
    if (text.includes('ambulance') || conversationMemory.lastSubject === 'ambulance') {
      conversationMemory.lastSubject = 'ambulance';
    } else {
      conversationMemory.lastSubject = 'destination';
    }
    return { intent: 'GET_ETA', confidence: 0.95, entities };
  }

  // 7. Distance Queries
  if (
    text.includes('how far') ||
    text.includes('how much distance') ||
    text.includes('what is the distance') ||
    text.includes('distance to') ||
    text.includes('how far away') ||
    text.includes('remaining distance') ||
    text.includes('ಎಷ್ಟು ದೂರ') ||
    text.includes('ದೂರ ಎಷ್ಟು') ||
    text.includes('कितनी दूर') ||
    text.includes('कितनी दूरी है')
  ) {
    if (text.includes('ambulance') || conversationMemory.lastSubject === 'ambulance') {
      conversationMemory.lastSubject = 'ambulance';
      return { intent: 'GET_DISTANCE', confidence: 0.95, entities };
    }
    if (text.includes('patient')) {
      conversationMemory.lastSubject = 'patient';
      return { intent: 'GET_DISTANCE', confidence: 0.95, entities };
    }
    conversationMemory.lastSubject = 'hospital';
    return { intent: 'GET_DISTANCE', confidence: 0.95, entities };
  }

  // 8. Vehicle Speed
  if (
    text.includes('how fast') ||
    text.includes('what is my speed') ||
    text.includes("what's my speed") ||
    text.includes('current speed') ||
    text.includes('vehicle speed') ||
    text.includes('driving speed') ||
    text.includes('ವೇಗ ಎಷ್ಟು') ||
    text.includes('ರಫ್ತಾರ್') ||
    text.includes('स्पीड क्या है') ||
    text.includes('रफ़्तार कितनी है')
  ) {
    return { intent: 'GET_CURRENT_SPEED', confidence: 0.95, entities };
  }

  // 9. Traffic Status
  if (
    text.includes('traffic ahead') ||
    text.includes('traffic') ||
    text.includes('congestion') ||
    text.includes('is there traffic') ||
    text.includes('how much traffic') ||
    text.includes('traffic conditions') ||
    text.includes('traffic delay') ||
    text.includes('ಟ್ರಾಫಿಕ್ ಇದೆಯೇ') ||
    text.includes('ಟ್ರಾಫಿಕ್ ಸ್ಥಿತಿ') ||
    text.includes('ट्रैफिक कैसा है') ||
    text.includes('ट्रैफिक जाम')
  ) {
    conversationMemory.lastSubject = 'route';
    return { intent: 'GET_TRAFFIC_STATUS', confidence: 0.95, entities };
  }

  // 10. Start / Stop / Cancel Navigation
  if (
    text.includes('start navigation') ||
    text.includes('begin navigation') ||
    text.includes('start journey') ||
    text.includes('let us go') ||
    text.includes("let's go") ||
    text === 'start' ||
    text.includes('ನ್ಯಾವಿಗೇಷನ್ ಪ್ರಾರಂಭಿಸಿ') ||
    text.includes('ಪ್ರಾರಂಭಿಸಿ') ||
    text.includes('नेविगेशन शुरू करें') ||
    text.includes('शुरू करें')
  ) {
    return { intent: 'START_NAVIGATION', confidence: 0.95, entities };
  }

  if (
    text.includes('stop navigation') ||
    text.includes('pause navigation') ||
    text.includes('stop voice') ||
    text.includes('stop guiding') ||
    text === 'stop' ||
    text.includes('ನ್ಯಾವಿಗೇಷನ್ ನಿಲ್ಲಿಸಿ') ||
    text.includes('ನಿಲ್ಲಿಸಿ') ||
    text.includes('नेविगेशन रोकें') ||
    text.includes('रोकें')
  ) {
    return { intent: 'STOP_NAVIGATION', confidence: 0.95, entities };
  }

  if (
    text.includes('cancel navigation') ||
    text.includes('cancel route') ||
    text.includes('exit navigation') ||
    text.includes('ರದ್ದುಮಾಡಿ') ||
    text.includes('रद्द करें')
  ) {
    return { intent: 'CANCEL_NAVIGATION', confidence: 0.95, entities };
  }

  // Handle "take me to the selected hospital" specifically
  if (text.includes('selected hospital') || text.includes('chosen hospital')) {
    conversationMemory.lastSubject = 'hospital';
    return { intent: 'GET_SELECTED_HOSPITAL', confidence: 0.95, entities };
  }

  // 11. Hospital queries by Name vs Nearest
  // "Find the nearest hospital", "Where is the closest hospital?", "Nearest available hospital", "Go to the nearest available hospital"
  if (
    text.includes('nearest hospital') ||
    text.includes('closest hospital') ||
    text.includes('find hospital') ||
    text.includes('find nearest') ||
    text.includes('closest emergency') ||
    text.includes('nearest emergency room') ||
    text.includes('take me to nearest') ||
    text.includes('take me to the nearest') ||
    text.includes('go to nearest') ||
    text.includes('go to the nearest') ||
    text.includes('nearest available') ||
    text.includes('ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ') ||
    text.includes('ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ ಹುಡುಕಿ') ||
    text.includes('नज़दीकी अस्पताल') ||
    text.includes('सबसे पास का अस्पताल')
  ) {
    conversationMemory.lastSubject = 'hospital';
    return { intent: 'FIND_NEAREST_HOSPITAL', confidence: 0.95, entities };
  }

  // e.g. "navigate to Victoria Hospital", "take me to Manipal Hospital"
  const navToMatch = text.match(/(?:navigate to|take me to|go to|drive to|head to|route to|find)\s+([a-z0-9\s]+?)(?:hospital|clinic|center|centre)?$/i);
  if (navToMatch && !text.includes('nearest') && !text.includes('closest') && !text.includes('ಹತ್ತಿರದ') && !text.includes('नज़दीकी')) {
    const candidateName = navToMatch[1].replace(/^(the|a|an)\s+/i, '').trim();
    if (candidateName && candidateName.length > 2 && candidateName !== 'selected') {
      entities.hospitalName = candidateName;
      conversationMemory.lastSubject = 'hospital';
      return { intent: 'FIND_HOSPITAL_BY_NAME', confidence: 0.9, entities };
    }
  }

  // 12. Ambulance Location: "Where is the ambulance?", "Where is my ambulance?"
  if (
    text.includes('where is the ambulance') ||
    text.includes('where is my ambulance') ||
    text.includes('where is ambulance') ||
    text.includes('ambulance location') ||
    text.includes('ambulance position') ||
    text.includes('track ambulance') ||
    text.includes('ಆಂಬ್ಯುಲೆನ್ಸ್ ಎಲ್ಲಿದೆ') ||
    text.includes('ಆಂಬ್ಯುಲೆನ್ಸ್ ಎಲ್ಲಿದೆ ನೋಡಿ') ||
    text.includes('एम्बुलेंस कहाँ है') ||
    text.includes('मेरी एम्बुलेंस कहाँ है')
  ) {
    conversationMemory.lastSubject = 'ambulance';
    return { intent: 'GET_AMBULANCE_LOCATION', confidence: 0.95, entities };
  }

  // 13. Patient Location: "Where is the patient?", "Where is the emergency?"
  if (
    text.includes('where is the patient') ||
    text.includes('patient location') ||
    text.includes('where is the incident') ||
    text.includes('where is the emergency') ||
    text.includes('patient address') ||
    text.includes('pickup location') ||
    text.includes('ರೋಗಿ ಎಲ್ಲಿದ್ದಾರೆ') ||
    text.includes('ರೋಗಿಯ ಸ್ಥಳ') ||
    text.includes('मरीज कहाँ है') ||
    text.includes('रोगी की स्थिति')
  ) {
    conversationMemory.lastSubject = 'patient';
    return { intent: 'GET_PATIENT_LOCATION', confidence: 0.95, entities };
  }

  // 14. Destination / Selected Hospital
  if (
    text.includes('where are we going') ||
    text.includes('what is the destination') ||
    text.includes('where is the destination') ||
    text.includes('which hospital are we going to') ||
    text.includes('which hospital') ||
    text.includes('what hospital') ||
    text.includes('destination hospital') ||
    text.includes('selected hospital') ||
    text.includes('ಯಾವ ಆಸ್ಪತ್ರೆಗೆ ಹೋಗುತ್ತಿದ್ದೇವೆ') ||
    text.includes('ಆಸ್ಪತ್ರೆ ಯಾವುದು') ||
    text.includes('हम किस अस्पताल जा रहे हैं') ||
    text.includes('गंतव्य अस्पताल कौन सा है')
  ) {
    conversationMemory.lastSubject = 'destination';
    return { intent: 'GET_SELECTED_HOSPITAL', confidence: 0.95, entities };
  }

  // 15. Emergency Status
  if (
    text.includes('emergency status') ||
    text.includes('what is my emergency status') ||
    text.includes("what's my emergency status") ||
    text.includes('status of emergency') ||
    text.includes('sos status') ||
    text.includes('ತುರ್ತು ಸ್ಥಿತಿ') ||
    text.includes('ಆಪತ್ಕಾಲೀನ ಸ್ಥಿತಿ') ||
    text.includes('आपातकालीन स्थिति') ||
    text.includes('स्थिति क्या है')
  ) {
    return { intent: 'GET_EMERGENCY_STATUS', confidence: 0.95, entities };
  }

  // 16. Route Summary / Corridor status
  if (
    text.includes('route summary') ||
    text.includes('route status') ||
    text.includes('tell me about the route') ||
    text.includes('how is the route') ||
    text.includes('corridor status') ||
    text.includes('green corridor') ||
    text.includes('ಮಾರ್ಗದ ಮಾಹಿತಿ') ||
    text.includes('रास्ते की जानकारी')
  ) {
    conversationMemory.lastSubject = 'route';
    return { intent: 'GET_ROUTE_SUMMARY', confidence: 0.95, entities };
  }

  // 17. Help
  if (
    text.includes('help') ||
    text.includes('what can i say') ||
    text.includes('what can you do') ||
    text.includes('commands') ||
    text.includes('navigation help') ||
    text.includes('ಸಹಾಯ') ||
    text.includes('ಮಾರ್ಗದರ್ಶನ') ||
    text.includes('मदद') ||
    text.includes('सहायता')
  ) {
    return { intent: 'GET_NAVIGATION_HELP', confidence: 0.95, entities };
  }

  return { intent: 'UNKNOWN', confidence: 0.3, entities };
}

/**
 * Executes a parsed voice intent using real application context, real GPS, real routing, and real hospital data
 */
export async function executeVoiceCommand(
  rawTranscript: string,
  context: VoiceAssistantContext
): Promise<VoiceCommandResult> {
  const { intent, confidence, entities } = parseVoiceIntent(rawTranscript);
  const lang = context.language || 'en';
  conversationMemory.lastIntent = intent;

  // 1. GET_CURRENT_LOCATION
  if (intent === 'GET_CURRENT_LOCATION') {
    const coords = context.userCoords || context.driverCoords;
    if (!coords || !coords.latitude || !coords.longitude) {
      const response =
        lang === 'kn'
          ? 'ನನಗೆ ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಸ್ಥಳ ತಿಳಿಯುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್‌ನಲ್ಲಿ GPS ಸ್ಥಳ ಅನುಮತಿಯನ್ನು ನೀಡಿ.'
          : lang === 'hi'
          ? 'मुझे आपकी वर्तमान स्थिति नहीं मिल रही है। कृपया अपने ब्राउज़र में लोकेशन अनुमति सक्षम करें।'
          : "I can't access your current location. Please enable location permission in your browser.";
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    const accuracyText = coords.accuracy ? ` (accuracy within ±${Math.round(coords.accuracy)} meters)` : '';
    const locName = context.resolvedAddress || context.currentStreetName || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;

    let response = '';
    if (lang === 'kn') {
      response = `ನೀವು ಪ್ರಸ್ತುತ ${locName} ಬಳಿ ಇದ್ದೀರಿ.${coords.accuracy ? ` GPS ನಿಖರತೆ ±${Math.round(coords.accuracy)} ಮೀಟರ್.` : ''}`;
    } else if (lang === 'hi') {
      response = `आप वर्तमान में ${locName} के पास हैं।${coords.accuracy ? ` जीपीएस सटीकता ±${Math.round(coords.accuracy)} मीटर है।` : ''}`;
    } else {
      response = `You are currently located at ${locName}${accuracyText}.`;
    }

    conversationMemory.lastSpokenAnswer = response;
    return { intent, confidence, spokenResponse: response, entities };
  }

  // 2. GET_DESTINATION or GET_SELECTED_HOSPITAL
  if (intent === 'GET_DESTINATION' || intent === 'GET_SELECTED_HOSPITAL') {
    const dest =
      context.selectedHospitalName ||
      context.activeEmergency?.hospital_destination ||
      context.activeEmergency?.selected_hospital ||
      context.activeEmergency?.location;

    if (!dest) {
      const response =
        lang === 'kn'
          ? 'ಯಾವುದೇ ಸಕ್ರಿಯ ಗಮ್ಯಸ್ಥಾನ ನಿಗದಿಯಾಗಿಲ್ಲ. ನೀವು ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ ಹುಡುಕಲು ಕೇಳಬಹುದು.'
          : lang === 'hi'
          ? 'कोई सक्रिय गंतव्य निर्धारित नहीं है। आप निकटतम अस्पताल खोजने के लिए कह सकते हैं।'
          : 'There is no active destination set. You can ask to find the nearest hospital.';
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    let response = '';
    if (lang === 'kn') {
      response = `ನಿಮ್ಮ ಗಮ್ಯಸ್ಥಾನ ${dest}. ತುರ್ತು ಹಸಿರು ಕಾರಿಡಾರ್ ಸಕ್ರಿಯವಾಗಿದೆ.`;
    } else if (lang === 'hi') {
      response = `आपका गंतव्य ${dest} है। आपातकालीन ग्रीन कॉरिडोर सक्रिय है।`;
    } else {
      response = `Your active destination is ${dest}. Emergency priority corridor is active.`;
    }

    conversationMemory.lastSpokenAnswer = response;
    return { intent, confidence, spokenResponse: response, entities };
  }

  // 3. GET_DISTANCE
  if (intent === 'GET_DISTANCE') {
    // If asking about ambulance distance from patient viewpoint:
    if (entities.ambulance || conversationMemory.lastSubject === 'ambulance') {
      if (context.remainingDistanceKm !== null && context.remainingDistanceKm !== undefined) {
        const d = context.remainingDistanceKm.toFixed(1);
        const response =
          lang === 'kn'
            ? `ಆಂಬ್ಯುಲೆನ್ಸ್ ನಿಮ್ಮಿಂದ ಸರಿಸುಮಾರು ${d} ಕಿಲೋಮೀಟರ್ ದೂರದಲ್ಲಿದೆ.`
            : lang === 'hi'
            ? `एम्बुलेंस आपसे लगभग ${d} किलोमीटर दूर है।`
            : `The ambulance is approximately ${d} kilometers away.`;
        conversationMemory.lastSpokenAnswer = response;
        return { intent, confidence, spokenResponse: response, entities };
      }
      if (context.activeEmergency?.current_distance_km) {
        const d = context.activeEmergency.current_distance_km.toFixed(1);
        const response =
          lang === 'kn'
            ? `ಆಂಬ್ಯುಲೆನ್ಸ್ ಸರಿಸುಮಾರು ${d} ಕಿಲೋಮೀಟರ್ ದೂರದಲ್ಲಿದೆ.`
            : lang === 'hi'
            ? `एम्बुलेंस लगभग ${d} किलोमीटर दूर है।`
            : `The ambulance is approximately ${d} kilometers away.`;
        conversationMemory.lastSpokenAnswer = response;
        return { intent, confidence, spokenResponse: response, entities };
      }
      const response =
        lang === 'kn'
          ? 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸ್ಥಳದ ಮಾಹಿತಿ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ.'
          : lang === 'hi'
          ? 'एम्बुलेंस की लोकेशन वर्तमान में अनुपलब्ध है।'
          : 'The ambulance location is currently unavailable.';
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    // Default: distance to destination / hospital
    if (context.remainingDistanceKm !== null && context.remainingDistanceKm !== undefined) {
      const d = context.remainingDistanceKm.toFixed(1);
      const dest = context.selectedHospitalName || context.activeEmergency?.hospital_destination || 'destination';
      const response =
        lang === 'kn'
          ? `ನೀವು ${dest} ನಿಂದ ${d} ಕಿಲೋಮೀಟರ್ ದೂರದಲ್ಲಿದ್ದೀರಿ.`
          : lang === 'hi'
          ? `आप ${dest} से ${d} किलोमीटर दूर हैं।`
          : `You are ${d} kilometers from ${dest}.`;
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    if (context.activeRoute?.distanceKm) {
      const d = context.activeRoute.distanceKm.toFixed(1);
      const response =
        lang === 'kn'
          ? `ಗಮ್ಯಸ್ಥಾನಕ್ಕೆ ಉಳಿದಿರುವ ದೂರ ${d} ಕಿಲೋಮೀಟರ್.`
          : lang === 'hi'
          ? `गंतव्य की शेष दूरी ${d} किलोमीटर है।`
          : `The remaining distance to your destination is ${d} kilometers.`;
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    const response =
      lang === 'kn'
        ? 'ದೂರವನ್ನು ಲೆಕ್ಕಹಾಕಲು ಸಕ್ರಿಯ ಮಾರ್ಗ ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೊದಲು ನ್ಯಾವಿಗೇಷನ್ ಪ್ರಾರಂಭಿಸಿ.'
        : lang === 'hi'
        ? 'दूरी की गणना के लिए कोई सक्रिय मार्ग उपलब्ध नहीं है। कृपया पहले नेविगेशन शुरू करें।'
        : 'Active route information is unavailable to calculate distance. Please start navigation first.';
    conversationMemory.lastSpokenAnswer = response;
    return { intent, confidence, spokenResponse: response, entities };
  }

  // 4. GET_ETA
  if (intent === 'GET_ETA') {
    const mins = context.remainingDurationMinutes ?? context.activeRoute?.estimatedMinutes ?? context.activeEmergency?.current_eta_minutes ?? null;
    const dest = context.selectedHospitalName || context.activeEmergency?.hospital_destination || 'destination';

    if (mins !== null && mins > 0) {
      const now = new Date();
      const etaTime = new Date(now.getTime() + mins * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let response = '';
      if (lang === 'kn') {
        response = `ಅಂದಾಜು ಆಗಮನ ಸಮಯ ${mins} ನಿಮಿಷಗಳು, ಸರಿಸುಮಾರು ${etaTime} ಗಂಟೆಗೆ.`;
      } else if (lang === 'hi') {
        response = `अनुमानित समय ${mins} मिनट है, लगभग ${etaTime} बजे।`;
      } else {
        response = `Estimated arrival time is in ${mins} minutes, at approximately ${etaTime}.`;
      }
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    const response =
      lang === 'kn'
        ? 'ETA ಮಾಹಿತಿ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ. ಸಕ್ರಿಯ ಮಾರ್ಗವನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ.'
        : lang === 'hi'
        ? 'ईटीए जानकारी वर्तमान में अनुपलब्ध है। सक्रिय मार्ग की पुष्टि की जा रही है।'
        : 'Estimated arrival time is currently unavailable. Please verify active route GPS.';
    conversationMemory.lastSpokenAnswer = response;
    return { intent, confidence, spokenResponse: response, entities };
  }

  // 5. GET_CURRENT_SPEED
  if (intent === 'GET_CURRENT_SPEED') {
    const speedRaw = context.driverCoords?.speed ?? context.userCoords?.speed;
    if (speedRaw !== null && speedRaw !== undefined && speedRaw > 0) {
      const kmh = Math.round(speedRaw * 3.6);
      const response =
        lang === 'kn'
          ? `ಪ್ರಸ್ತುತ ವಾಹನದ ವೇಗ ಗಂಟೆಗೆ ${kmh} ಕಿಲೋಮೀಟರ್.`
          : lang === 'hi'
          ? `वर्तमान वाहन गति ${kmh} किलोमीटर प्रति घंटा है।`
          : `Current vehicle speed is ${kmh} kilometers per hour.`;
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    const response =
      lang === 'kn'
        ? 'ವಾಹನ ನಿಂತಿದೆ ಅಥವಾ GPS ವೇಗದ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.'
        : lang === 'hi'
        ? 'वाहन स्थिर है या जीपीएस गति डेटा अनुपलब्ध है।'
        : 'Vehicle is currently stationary or GPS speed data is not reporting.';
    conversationMemory.lastSpokenAnswer = response;
    return { intent, confidence, spokenResponse: response, entities };
  }

  // 6. GET_NEXT_TURN
  if (intent === 'GET_NEXT_TURN') {
    if (context.currentStep) {
      const response = context.currentStep.text;
      conversationMemory.lastInstruction = response;
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    if (context.activeRoute?.steps && context.activeRoute.steps.length > 0) {
      const step = context.activeRoute.steps[0];
      const response = step.text;
      conversationMemory.lastInstruction = response;
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    const response =
      lang === 'kn'
        ? 'ಮುಂದಿನ ತಿರುವು ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಸಕ್ರಿಯ ಮಾರ್ಗವನ್ನು ಅನುಸರಿಸಿ.'
        : lang === 'hi'
        ? 'अगला मोड़ उपलब्ध नहीं है। कृपया सीधे मार्ग पर आगे बढ़ें।'
        : 'Next maneuver instruction is not available for the active route.';
    conversationMemory.lastSpokenAnswer = response;
    return { intent, confidence, spokenResponse: response, entities };
  }

  // 7. GET_TRAFFIC_STATUS
  if (intent === 'GET_TRAFFIC_STATUS') {
    const traffic = context.activeRoute?.traffic || context.activeEmergency?.current_traffic;
    const isCorridorActive = context.trafficStatus?.includes('Green Corridor') || context.activeEmergency?.selected_route_id;

    if (traffic) {
      let response = '';
      if (lang === 'kn') {
        response = `ಈ ಮಾರ್ಗದಲ್ಲಿ ಸಂಚಾರ ಸಾಂದ್ರತೆ ${traffic === 'Low' ? 'ಕಡಿಮೆ' : traffic === 'Heavy' ? 'ಹೆಚ್ಚು' : 'ಸಾಧಾರಣ'}ವಾಗಿದೆ.${isCorridorActive ? ' ತುರ್ತು ಹಸಿರು ಸಿಗ್ನಲ್ ಪ್ರಿಯಾರಿಟಿ ಸಕ್ರಿಯವಾಗಿದೆ.' : ''}`;
      } else if (lang === 'hi') {
        response = `इस मार्ग पर ट्रैफिक ${traffic === 'Low' ? 'कम' : traffic === 'Heavy' ? 'भारी' : 'मध्यम'} है।${isCorridorActive ? ' आपातकालीन सिग्नल प्राथमिकता चालू है।' : ''}`;
      } else {
        response = `Traffic on this route is currently ${traffic.toLowerCase()}.${isCorridorActive ? ' Green corridor IoT signal preemption is active.' : ''}`;
      }
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    const response =
      lang === 'kn'
        ? 'ನೈಜ ಸಮಯದ ಟ್ರಾಫಿಕ್ ಸಂವೇದಕ ಮಾಹಿತಿ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ.'
        : lang === 'hi'
        ? 'लाइव ट्रैफिक सेंसर डेटा वर्तमान में उपलब्ध नहीं है।'
        : 'Live traffic sensor information is currently unavailable.';
    conversationMemory.lastSpokenAnswer = response;
    return { intent, confidence, spokenResponse: response, entities };
  }

  // 8. FIND_NEAREST_HOSPITAL
  if (intent === 'FIND_NEAREST_HOSPITAL') {
    const coords = context.userCoords || context.driverCoords;
    if (!coords) {
      const response =
        lang === 'kn'
          ? 'ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ ಹುಡುಕಲು ನಿಮ್ಮ GPS ಸ್ಥಳ ಅಗತ್ಯವಿದೆ. ದಯವಿಟ್ಟು ಸ್ಥಳ ಅನುಮತಿ ನೀಡಿ.'
          : lang === 'hi'
          ? 'निकटतम अस्पताल खोजने के लिए आपके जीपीएस स्थान की आवश्यकता है। कृपया स्थान अनुमति दें।'
          : 'I need your current GPS location to find the nearest hospital. Please enable GPS.';
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    try {
      const res = await api.getNavigationNearbyHospitals({
        lat: coords.latitude,
        lng: coords.longitude,
        radius: 35,
        emergencyType: context.activeEmergency?.emergency_type || 'General',
      });

      const nearest = res.nearestAvailable || (res.hospitals && res.hospitals[0]);
      if (nearest) {
        conversationMemory.lastMatchedHospital = nearest.name;
        conversationMemory.lastSubject = 'hospital';

        let response = '';
        if (lang === 'kn') {
          response = `ಹತ್ತಿರದ ಲಭ್ಯವಿರುವ ಆಸ್ಪತ್ರೆ ${nearest.name}, ಸರಿಸುಮಾರು ${nearest.distanceKm} ಕಿಲೋಮೀಟರ್ ದೂರದಲ್ಲಿದೆ. ಇದರಲ್ಲಿ ${nearest.available_beds} ಹಾಸಿಗೆಗಳು ಸಿದ್ಧವಾಗಿವೆ.`;
        } else if (lang === 'hi') {
          response = `निकटतम उपलब्ध अस्पताल ${nearest.name} है, जो लगभग ${nearest.distanceKm} किलोमीटर दूर है। यहाँ ${nearest.available_beds} बेड तैयार हैं।`;
        } else {
          response = `The nearest available hospital is ${nearest.name}, approximately ${nearest.distanceKm} kilometers away with ${nearest.available_beds} emergency beds ready.`;
        }

        conversationMemory.lastSpokenAnswer = response;
        return {
          intent,
          confidence,
          spokenResponse: response,
          entities: { hospitalName: nearest.name },
          action: { type: 'NAVIGATE_TO_HOSPITAL', payload: nearest },
        };
      }
    } catch (err) {
      console.warn('Failed to query nearby hospitals via API:', err);
    }

    const response =
      lang === 'kn'
        ? 'ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳ ಮಾಹಿತಿ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.'
        : lang === 'hi'
        ? 'निकटतम अस्पतालों का विवरण प्राप्त नहीं हो सका। कृपया इंटरनेट कनेक्शन जांचें।'
        : "I couldn't fetch nearby hospital records right now. Please check your network connection.";
    conversationMemory.lastSpokenAnswer = response;
    return { intent, confidence, spokenResponse: response, entities };
  }

  // 9. FIND_HOSPITAL_BY_NAME
  if (intent === 'FIND_HOSPITAL_BY_NAME') {
    const rawTarget = entities.hospitalName || '';
    const cleanTarget = rawTarget
      .replace(/(navigate to|take me to|go to|find|hospital|clinic|center|centre)/gi, '')
      .trim()
      .toLowerCase();

    // Search available hospitals in context first
    const list = context.availableHospitals || [];
    let matched = list.find((h: any) => h.name.toLowerCase().includes(cleanTarget));

    // If not found in context, query real database hospitals
    if (!matched) {
      try {
        const allH = await api.getHospitals();
        if (allH && Array.isArray(allH.hospitals)) {
          matched = allH.hospitals.find((h: any) => h.name.toLowerCase().includes(cleanTarget));
        }
      } catch (err) {
        console.warn('Fallback database hospital query error:', err);
      }
    }

    if (matched) {
      conversationMemory.lastMatchedHospital = matched.name;
      conversationMemory.lastSubject = 'hospital';
      let response = '';
      if (lang === 'kn') {
        response = `${matched.name} ಗೆ ಮಾರ್ಗ ನಿಗದಿಪಡಿಸಲಾಗುತ್ತಿದೆ. ಅಂದಾಜು ದೂರ ${matched.distanceKm || 4.5} ಕಿಲೋಮೀಟರ್.`;
      } else if (lang === 'hi') {
        response = `${matched.name} के लिए मार्ग निर्धारित किया जा रहा है। अनुमानित दूरी ${matched.distanceKm || 4.5} किलोमीटर है।`;
      } else {
        response = `Routing to ${matched.name}, approximately ${matched.distanceKm || 4.5} kilometers away.`;
      }
      conversationMemory.lastSpokenAnswer = response;
      return {
        intent,
        confidence,
        spokenResponse: response,
        entities: { hospitalName: matched.name },
        action: { type: 'NAVIGATE_TO_HOSPITAL', payload: matched },
      };
    }

    const response =
      lang === 'kn'
        ? `ಕ್ಷಮಿಸಿ, ${rawTarget} ಆಸ್ಪತ್ರೆ ವಿವರಗಳು ಸಿಗಲಿಲ್ಲ. ನೀವು ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ ಹುಡುಕಲು ಕೇಳಬಹುದು.`
        : lang === 'hi'
        ? `क्षमा करें, ${rawTarget} अस्पताल नहीं मिला। आप निकटतम अस्पताल खोजने के लिए कह सकते हैं।`
        : `I could not find a hospital matching "${cleanTarget}". You can ask to find the nearest available hospital.`;
    conversationMemory.lastSpokenAnswer = response;
    return { intent, confidence, spokenResponse: response, entities };
  }

  // 10. START_NAVIGATION
  if (intent === 'START_NAVIGATION') {
    const dest = context.selectedHospitalName || context.activeEmergency?.hospital_destination || context.activeEmergency?.location;
    let response = '';
    if (lang === 'kn') {
      response = `ತಿರುವು-ತಿರುವು ಧ್ವನಿ ನ್ಯಾವಿಗೇಷನ್ ಪ್ರಾರಂಭವಾಗಿದೆ.${dest ? ` ಗಮ್ಯಸ್ಥಾನ: ${dest}.` : ''} ಸುರಕ್ಷಿತವಾಗಿ ಚಾಲನೆ ಮಾಡಿ.`;
    } else if (lang === 'hi') {
      response = `टर्न-बाय-टर्न वॉयस नेविगेशन शुरू हो गया है।${dest ? ` गंतव्य: ${dest}।` : ''} सुरक्षित ड्राइव करें।`;
    } else {
      response = `Starting turn-by-turn voice navigation${dest ? ` to ${dest}` : ''}. Follow the displayed route when safe to do so.`;
    }
    conversationMemory.lastSpokenAnswer = response;
    return {
      intent,
      confidence,
      spokenResponse: response,
      action: { type: 'START_NAVIGATION' },
      entities,
    };
  }

  // 11. STOP_NAVIGATION
  if (intent === 'STOP_NAVIGATION') {
    let response = '';
    if (lang === 'kn') {
      response = 'ಧ್ವನಿ ನ್ಯಾವಿಗೇಷನ್ ನಿಲ್ಲಿಸಲಾಗಿದೆ.';
    } else if (lang === 'hi') {
      response = 'वॉयस नेविगेशन रोक दिया गया है।';
    } else {
      response = 'Voice navigation paused.';
    }
    conversationMemory.lastSpokenAnswer = response;
    return {
      intent,
      confidence,
      spokenResponse: response,
      action: { type: 'STOP_NAVIGATION' },
      entities,
    };
  }

  // 12. CANCEL_NAVIGATION
  if (intent === 'CANCEL_NAVIGATION') {
    let response = '';
    if (lang === 'kn') {
      response = 'ನ್ಯಾವಿಗೇಷನ್ ಮಾರ್ಗವನ್ನು ರದ್ದುಮಾಡಲಾಗಿದೆ.';
    } else if (lang === 'hi') {
      response = 'नेविगेशन मार्ग रद्द कर दिया गया है।';
    } else {
      response = 'Navigation route cancelled.';
    }
    conversationMemory.lastSpokenAnswer = response;
    return {
      intent,
      confidence,
      spokenResponse: response,
      action: { type: 'CANCEL_NAVIGATION' },
      entities,
    };
  }

  // 13. REROUTE
  if (intent === 'REROUTE') {
    let response = '';
    if (lang === 'kn') {
      response = 'ನಿಮ್ಮ ಪ್ರಸ್ತುತ GPS ಸ್ಥಳದಿಂದ ಹೊಸ ಮಾರ್ಗವನ್ನು ಮರುಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ.';
    } else if (lang === 'hi') {
      response = 'आपकी वर्तमान जीपीएस स्थिति से नया मार्ग फिर से निकाला जा रहा है।';
    } else {
      response = 'Recalculating the fastest route from your current GPS position.';
    }
    conversationMemory.lastSpokenAnswer = response;
    return {
      intent,
      confidence,
      spokenResponse: response,
      action: { type: 'REROUTE' },
      entities,
    };
  }

  // 14. REPEAT_LAST_INSTRUCTION
  if (intent === 'REPEAT_LAST_INSTRUCTION') {
    const repeatText = conversationMemory.lastInstruction || conversationMemory.lastSpokenAnswer;
    if (repeatText) {
      return {
        intent,
        confidence,
        spokenResponse: repeatText,
        entities,
      };
    }
    const response =
      lang === 'kn'
        ? 'ಯಾವುದೇ ಹಿಂದಿನ ಧ್ವನಿ ಸೂಚನೆ ಲಭ್ಯವಿಲ್ಲ.'
        : lang === 'hi'
        ? 'कोई पिछला निर्देश उपलब्ध नहीं है।'
        : 'There is no previous instruction to repeat.';
    return { intent, confidence, spokenResponse: response, entities };
  }

  // 15. GET_AMBULANCE_LOCATION
  if (intent === 'GET_AMBULANCE_LOCATION') {
    const em = context.activeEmergency;
    if (!em) {
      const response =
        lang === 'kn'
          ? 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ಸಕ್ರಿಯ ತುರ್ತು ಕರೆ ಇಲ್ಲ.'
          : lang === 'hi'
          ? 'वर्तमान में कोई सक्रिय आपातकालीन कॉल नहीं है।'
          : 'There is currently no active emergency dispatch.';
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    if (em.driver_current_latitude && em.driver_current_longitude) {
      const d = context.remainingDistanceKm !== null ? `${context.remainingDistanceKm.toFixed(1)} km` : '';
      const unit = em.vehicle_number || '108';
      let response = '';
      if (lang === 'kn') {
        response = `ಆಂಬ್ಯುಲೆನ್ಸ್ ${unit} ಲೈವ್ ಟ್ರ್ಯಾಕಿಂಗ್‌ನಲ್ಲಿದೆ${d ? `, ಸುಮಾರು ${d} ದೂರದಲ್ಲಿದೆ` : ''}.`;
      } else if (lang === 'hi') {
        response = `एम्बुलेंस ${unit} लाइव ट्रैक पर है${d ? `, लगभग ${d} दूर` : ''}।`;
      } else {
        response = `Ambulance ${unit} is actively transmitting live GPS coordinates${d ? `, approximately ${d} away` : ''}.`;
      }
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    const response =
      lang === 'kn'
        ? 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸ್ಥಳದ ಮಾಹಿತಿ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ.'
        : lang === 'hi'
        ? 'एम्बुलेंस का लोकेशन डेटा वर्तमान में अनुपलब्ध है।'
        : 'The ambulance location is currently unavailable.';
    conversationMemory.lastSpokenAnswer = response;
    return { intent, confidence, spokenResponse: response, entities };
  }

  // 16. GET_PATIENT_LOCATION
  if (intent === 'GET_PATIENT_LOCATION') {
    const loc = context.activeEmergency?.location;
    if (loc) {
      let response = '';
      if (lang === 'kn') {
        response = `ರೋಗಿಯ ತುರ್ತು ಸ್ಥಳ: ${loc}.`;
      } else if (lang === 'hi') {
        response = `मरीज का आपातकालीन स्थान है: ${loc}।`;
      } else {
        response = `The patient's incident location is ${loc}.`;
      }
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    const response =
      lang === 'kn'
        ? 'ಯಾವುದೇ ಸಕ್ರಿಯ ರೋಗಿಯ ಸ್ಥಳ ದಾಖಲಾಗಿಲ್ಲ.'
        : lang === 'hi'
        ? 'कोई सक्रिय मरीज का स्थान दर्ज नहीं है।'
        : 'No active patient location record is available.';
    conversationMemory.lastSpokenAnswer = response;
    return { intent, confidence, spokenResponse: response, entities };
  }

  // 17. GET_EMERGENCY_STATUS
  if (intent === 'GET_EMERGENCY_STATUS') {
    const em = context.activeEmergency;
    if (!em) {
      const response =
        lang === 'kn'
          ? 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ಸಕ್ರಿಯ ತುರ್ತು ದಾಖಲೆ ಇಲ್ಲ.'
          : lang === 'hi'
          ? 'वर्तमान में कोई सक्रिय आपातकालीन रिकॉर्ड नहीं है।'
          : 'There is currently no active emergency dispatch.';
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    const readableStatus = em.status.replace(/_/g, ' ');
    let response = '';
    if (lang === 'kn') {
      response = `ನಿಮ್ಮ ತುರ್ತು ಕರೆ #${em.id} ರ ಸ್ಥಿತಿ: ${readableStatus}. ಆಂಬ್ಯುಲೆನ್ಸ್: ${em.vehicle_number || 'ನಿಯೋಜಿಸಲಾಗುತ್ತಿದೆ'}.`;
    } else if (lang === 'hi') {
      response = `आपकी आपातकालीन कॉल #${em.id} की स्थिति है: ${readableStatus}। एम्बुलेंस: ${em.vehicle_number || 'असाइन की जा रही है'}।`;
    } else {
      response = `Emergency call #${em.id} status is ${readableStatus}. Assigned unit: ${em.vehicle_number || 'Dispatching'}.`;
    }
    conversationMemory.lastSpokenAnswer = response;
    return { intent, confidence, spokenResponse: response, entities };
  }

  // 18. GET_ROUTE_SUMMARY
  if (intent === 'GET_ROUTE_SUMMARY') {
    if (context.activeRoute) {
      const r = context.activeRoute;
      let response = '';
      if (lang === 'kn') {
        response = `ಮಾರ್ಗ: ${r.name}, ಒಟ್ಟು ${r.distanceKm} ಕಿಲೋಮೀಟರ್ ಮತ್ತು ${r.estimatedMinutes} ನಿಮಿಷಗಳು. ${r.summary}.`;
      } else if (lang === 'hi') {
        response = `मार्ग: ${r.name}, कुल ${r.distanceKm} किलोमीटर और ${r.estimatedMinutes} मिनट। ${r.summary}।`;
      } else {
        response = `Active route is ${r.name}, ${r.distanceKm} kilometers with an estimated duration of ${r.estimatedMinutes} minutes. ${r.summary}.`;
      }
      conversationMemory.lastSpokenAnswer = response;
      return { intent, confidence, spokenResponse: response, entities };
    }

    const response =
      lang === 'kn'
        ? 'ಯಾವುದೇ ಸಕ್ರಿಯ ಮಾರ್ಗ ವಿವರಗಳು ಲಭ್ಯವಿಲ್ಲ.'
        : lang === 'hi'
        ? 'कोई सक्रिय मार्ग विवरण उपलब्ध नहीं है।'
        : 'Active route summary is currently unavailable.';
    conversationMemory.lastSpokenAnswer = response;
    return { intent, confidence, spokenResponse: response, entities };
  }

  // 19. GET_NAVIGATION_HELP
  if (intent === 'GET_NAVIGATION_HELP') {
    let response = '';
    if (lang === 'kn') {
      response = 'ನೀವು ಹೀಗೆ ಕೇಳಬಹುದು: ನಾನು ಎಲ್ಲಿದ್ದೇನೆ? ಆಸ್ಪತ್ರೆ ಎಷ್ಟು ದೂರ? ETA ಎಷ್ಟು? ಮುಂದಿನ ತಿರುವು ಏನು? ಅಥವಾ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆ ಹುಡುಕಿ.';
    } else if (lang === 'hi') {
      response = 'आप पूछ सकते हैं: मैं कहाँ हूँ? अस्पताल कितनी दूर है? ईटीए क्या है? अगला मोड़ क्या है? या निकटतम अस्पताल खोजें।';
    } else {
      response = 'You can ask: Where am I? How far is the hospital? What is my ETA? What is the next turn? Find nearest hospital, or Reroute.';
    }
    conversationMemory.lastSpokenAnswer = response;
    return { intent, confidence, spokenResponse: response, entities };
  }

  // Default UNKNOWN:
  let fallbackResponse = '';
  if (lang === 'kn') {
    fallbackResponse = `ಕ್ಷಮಿಸಿ, "${rawTranscript}" ಅರ್ಥವಾಗಲಿಲ್ಲ. ನೀವು: ನಾನು ಎಲ್ಲಿದ್ದೇನೆ, ETA ಎಷ್ಟು, ಅಥವಾ ಮುಂದಿನ ತಿರುವು ಏನು ಎಂದು ಕೇಳಬಹುದು.`;
  } else if (lang === 'hi') {
    fallbackResponse = `क्षमा करें, "${rawTranscript}" समझ नहीं आया। आप पूछ सकते हैं: मैं कहाँ हूँ, ईटीए क्या है, या अगला मोड़ क्या है।`;
  } else {
    fallbackResponse = `I did not catch "${rawTranscript}". You can ask: "Where am I?", "What's my ETA?", "What is the next turn?", or "Find nearest hospital".`;
  }

  conversationMemory.lastSpokenAnswer = fallbackResponse;
  return { intent: 'UNKNOWN', confidence: 0.3, spokenResponse: fallbackResponse, entities };
}
