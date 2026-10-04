export type Language = 'en' | 'kn' | 'hi';

export interface TranslationDictionary {
  [key: string]: string | undefined;

  // Navigation & Header
  appTitle: string;
  appSubtitle: string;
  appSubtitlePatient: string;
  appSubtitleDriver: string;
  appSubtitleAdmin: string;
  hotlineLabel: string;
  soundMute: string;
  soundUnmute: string;
  themeLight: string;
  themeDark: string;
  highContrastToggle: string;
  languageSelect: string;
  roleLabel: string;
  logout: string;
  signInRegister: string;
  
  // Roles
  rolePatient: string;
  roleDriver: string;
  roleAdmin: string;

  // Navigation & Sidebars (Common & Role-specific)
  dashboard: string;
  emergencyInformation: string;
  activeEmergency: string;
  ambulanceTracking: string;
  hospitalsFleetRadar: string;
  emergencyHistory: string;
  medicalProfile: string;
  firstAidGuides: string;
  settings: string;
  notifications: string;
  activeSosInProgress: string;
  triggerEmergencySos: string;
  dispatchedTrackingSub: string;
  instant108DispatchSub: string;
  expandSidebar: string;
  collapseSidebar: string;
  portalCitizen: string;
  portalPatient: string;
  portalDriver: string;
  portalHospital: string;
  portalAdmin: string;
  portalBadgePortal: string;
  portalBadgeCommand: string;
  portalBadgeCockpit: string;

  // Driver Nav
  navDriverDashboard: string;
  navIncomingRequests: string;
  navActiveEmergency: string;
  navAmbulanceStatus: string;
  navProfile: string;
  driverCockpit: string;
  driverIncoming: string;
  driverActive: string;
  driverNavigation: string;
  driverStatus: string;
  driverHistory: string;
  driverNotifications: string;
  driverProfile: string;
  driverSettings: string;
  missionActive: string;
  turnByTurn: string;
  enRoute: string;

  // Patient Nav
  navPatientDashboard: string;
  navEmergencySOS: string;
  navMyRequests: string;
  navAmbulanceTracking: string;

  // Hospital / Admin Nav
  navAdminDashboard: string;
  navEmergencyRequests: string;
  navAmbulances: string;
  navDrivers: string;
  navUsers: string;
  navReports: string;
  hospitalIncomingEmergencies: string;
  hospitalPatientInfo: string;
  hospitalFleetRadar: string;
  hospitalWards: string;
  hospitalTraffic: string;
  hospitalPersonnel: string;
  hospitalReports: string;
  hospitalHistory: string;
  hospitalSettings: string;
  criticalTraumaAdmission: string;

  // Common UI
  loading: string;
  cancel: string;
  submit: string;
  save: string;
  close: string;
  confirm: string;
  phone: string;
  location: string;
  status: string;
  type: string;
  actions: string;
  notes: string;
  search: string;
  filter: string;
  all: string;
  active: string;
  completed: string;
  cancelled: string;
  available: string;
  busy: string;
  assigned: string;
  maintenance: string;
  viewDetails: string;
  time: string;
  patientName: string;
  driverName: string;
  vehicleNumber: string;
  emergencyType: string;
  ambulanceType: string;
  baseLocation: string;
  activeEmergencies: string;
  availableAmbulances: string;
  completedTrips: string;
  refresh: string;
  rate: string;
  download: string;
  viewReport: string;

  // Stepper / Statuses
  statusWaitingForDriver: string;
  statusWaitingDesc: string;
  statusDriverAccepted: string;
  statusDriverAcceptedDesc: string;
  statusOnTheWay: string;
  statusOnTheWayDesc: string;
  statusReached: string;
  statusReachedDesc: string;
  statusCompleted: string;
  statusCompletedDesc: string;
  statusCancelled: string;
  statusCancelledDesc: string;
  statusEnRoute: string;
  statusAtScene: string;
  statusAvailable: string;

  // Home Hero
  heroBadge: string;
  heroSubBadge: string;
  heroTitle: string;
  heroTitleGradient: string;
  heroSubtitle: string;
  heroTriggerSOS: string;
  heroOpenAdmin: string;
  heroStatAmbulances: string;
  heroStatReady: string;
  heroStatEmergencies: string;
  heroStatResponseTime: string;
  heroPortalsTitle: string;
  heroPortalsSubtitle: string;

  // Portal Cards
  portalPatientTitle: string;
  portalPatientDesc: string;
  portalPatientF1: string;
  portalPatientF2: string;
  portalPatientF3: string;
  portalPatientBtn: string;

  portalDriverTitle: string;
  portalDriverDesc: string;
  portalDriverF1: string;
  portalDriverF2: string;
  portalDriverF3: string;
  portalDriverBtn: string;

  portalAdminTitle: string;
  portalAdminDesc: string;
  portalAdminF1: string;
  portalAdminF2: string;
  portalAdminF3: string;
  portalAdminBtn: string;

  // Pipeline
  pipelineTitle: string;
  pipelineSubtitle: string;
  pipelineDesc: string;
  pipelineStep1Title: string;
  pipelineStep1Desc: string;
  pipelineStep2Title: string;
  pipelineStep2Desc: string;
  pipelineStep3Title: string;
  pipelineStep3Desc: string;
  pipelineStep4Title: string;
  pipelineStep4Desc: string;
  networkBadge1: string;
  networkBadge2: string;
  networkBadge3: string;

  // Patient Dashboard & Operations
  patientPortalTitle: string;
  patientPortalBadge: string;
  patientWelcome: string;
  patientLoggedInAs: string;
  patientMedicalId: string;
  patientRegisteredPhone: string;
  patientActiveAlertTitle: string;
  patientActiveAlertDesc: string;
  patientAssignedAmbulance: string;
  patientDriverContact: string;
  patientAmbulanceType: string;
  patientBaseLocation: string;
  patientCancelSOS: string;
  patientCancelConfirm: string;
  patientTriggerTitle: string;
  patientTriggerDesc: string;
  patientInstantSOSBtn: string;
  patientEmergencyDetails: string;
  patientSelectEmergencyType: string;
  patientLocationPlaceholder: string;
  patientUseCurrentLocation: string;
  patientPhonePlaceholder: string;
  patientNotesPlaceholder: string;
  patientDispatchBtn: string;
  patientFirstAidTitle: string;
  patientFirstAidSubtitle: string;
  patientHistoryTitle: string;
  patientNoHistory: string;

  // Medical Profile
  secureMedicalProfile: string;
  secureMedicalProfileDesc: string;
  bloodGroup: string;
  bloodGroupDesc: string;
  allergies: string;
  chronicConditions: string;
  emergencyContact: string;
  inputEditMedicalInfo: string;
  saveMedicalProfile: string;
  transmittedOnSos: string;
  icePass: string;
  iceQrCode: string;
  noKnownAllergies: string;
  noRecordedConditions: string;
  notSet: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;

  // Driver Dashboard
  driverPortalTitle: string;
  driverPortalBadge: string;
  driverBadge: string;
  driverAssignedUnit: string;
  driverAvailabilityStatus: string;
  driverSetAvailable: string;
  driverSetMaintenance: string;
  driverSwitchVehicle: string;
  driverIncomingTitle: string;
  driverIncomingSubtitle: string;
  driverIncomingAlerts: string;
  driverIncomingDesc: string;
  driverNoIncoming: string;
  driverAcceptBtn: string;
  driverAcceptRequest: string;
  driverAcceptSuccess: string;
  driverActiveMissionTitle: string;
  driverActiveMissionBadge: string;
  driverPatientDetails: string;
  driverIncidentLocation: string;
  driverEmergencyNature: string;
  driverCallPatient: string;
  driverActionStartJourney: string;
  driverStartJourney: string;
  driverActionArrived: string;
  driverMarkReached: string;
  driverActionComplete: string;
  driverCompleteTrip: string;
  driverReadyStandby: string;
  driverStandby: string;
  driverStandbyDesc: string;
  driverVehicleSpecs: string;
  driverMissionHistory: string;
  driverCompletedMissions: string;

  // Admin Dashboard
  adminPortalTitle: string;
  adminPortalBadge: string;
  adminConsoleBadge: string;
  adminSubtitle: string;
  adminResetData: string;
  adminResetSystem: string;
  adminAddAmbulance: string;
  adminTotalCalls: string;
  adminActiveCallsDesc: string;
  adminReadyFleetDesc: string;
  adminMetricTotalCalls: string;
  adminMetricActive: string;
  adminMetricAvailable: string;
  adminMetricAvgTime: string;
  adminFleetTitle: string;
  adminFleetSubtitle: string;
  adminFleetDesc: string;
  adminLedgerTitle: string;
  adminLedgerSubtitle: string;
  adminMasterLedgerTitle: string;
  adminMasterLedgerDesc: string;
  adminFilterAll: string;
  adminFilterActive: string;
  adminFilterCompleted: string;
  adminFilterCancelled: string;
  adminUsersTitle: string;
  adminUsersSubtitle: string;
  adminUsersDesc: string;

  // Auth Modal
  authSignInTitle: string;
  authRegisterTitle: string;
  authSubtitle: string;
  authQuickDemo: string;
  authFullName: string;
  authEmail: string;
  authPassword: string;
  authSelectRole: string;
  authSignInBtn: string;
  authRegisterBtn: string;
  authNoAccount: string;
  authHaveAccount: string;
  authCreateOne: string;

  // Footer
  footerNetwork: string;
  footerDesc: string;
  footerTollFree: string;
  footerEmergencyHotline: string;
  footerRights: string;
  footerCertified: string;

  // Notifications
  notificationsTitle: string;
  notificationsEmpty: string;
  notificationsEmptyDesc: string;
  notificationsMarkAllRead: string;
  notificationsClearAll: string;
  notificationsViewAll: string;
  notificationsClose: string;
  notificationsUnreadBadge: string;
  notificationNew: string;
  notificationTimeJustNow: string;
  notificationViewEmergency: string;

  // Voice to Text & Symptom Recording
  voiceSymptomsBtn: string;
  voiceRecordingTitle: string;
  voiceRecordingSubtitle: string;
  voiceStartRecording: string;
  voiceStopRecording: string;
  voiceListening: string;
  voiceSpeakNow: string;
  voiceTranscribedLabel: string;
  voiceQuickSymptoms: string;
  voiceApplySymptoms: string;
  voiceClear: string;
  voiceSummarizeAi: string;
  voiceMicPermissionError: string;
  voiceNotSupported: string;
  voiceUrgencyLevel: string;
  voiceRecommendedType: string;
  voiceContextAttached: string;
  voiceUpdateDispatcher: string;

  // First Aid Guidance
  firstAidHeader: string;
  firstAidSub: string;
  cprAdult: string;
  cprChild: string;
  choking: string;
  severeBleeding: string;
  burnsScalds: string;
  strokeFast: string;
  heartAttack: string;
  step: string;
  alwaysCall108: string;

  // Proximity Alert Banner
  proximityAlertTitle: string;
  proximityAlertDesc: string;
  playVoiceAnnouncement: string;
  dismiss: string;

  // Dynamic Sentence Templates
  ambulanceArrivingIn: string;
  ambulanceDispatched: string;
  hospitalAssigned: string;
  searchingFleet: string;
  activeSos: string;
  driverAssigned: string;
  patientConnected: string;
  eta: string;
  mins: string;
  km: string;

  // Extended Comprehensive Portal & Emergency Translations
  emergency: string;
  missionCompleted: string;
  liveSos: string;
  ambulanceAssigned: string;
  enRouteToYou: string;
  arrivedAtScene: string;
  handoverCompleted: string;
  voiceUpdate: string;
  closeNewSos: string;
  emergencyMissionFinalized: string;
  emergencyMissionFinalizedDesc: string;
  downloadReport: string;
  estimatedEta: string;
  within2kmAlertZone: string;
  liveTraffic: string;
  lowCongestion: string;
  greenCorridorActive: string;
  iceHealthPass: string;
  alertBroadcastInProgress: string;
  alertBroadcastDesc: string;
  callParamedic: string;
  broadcastingFleetAlert: string;
  clinicalProfileTransmitted: string;
  transmitted: string;
  primaryEmergencyContact: string;
  existingConditionsDirectives: string;
  directPriorityCorridor: string;
  gpsAutoPinned: string;
  instant1TapSos: string;
  autoPinningGps: string;
  locationDenied: string;
  enterAddressManually: string;
  gpsCalibrate: string;
  centerOnMe: string;
  medicalIdOnSos: string;
  updateProfile: string;
  pastEmergencies: string;
  noPastEmergencies: string;
  radarMarkersLegend: string;
  wardAvailable: string;
  wardFullDiversion: string;
  ambulanceFleet: string;
  yourIncidentGps: string;
  yourDetectedPin: string;
  detectingGps: string;
  nearestAmbulance: string;
  transfusionReady: string;
  alerts108Paramedics: string;
  changesSyncSos: string;
  editCriticalInfo: string;
  clickChipToToggle: string;
  saveAndProtect: string;
  savingProfile: string;
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  ambulanceCrewCockpit: string;
  onEmergency: string;
  activeEmergencyInProgress: string;
  patient: string;
  destination: string;
  openLiveNav: string;
  incomingCalls: string;
  criticalTriageAlerts: string;
  noIncomingCalls: string;
  acceptEmergency: string;
  decline: string;
  priorityCritical: string;
  priorityHigh: string;
  priorityNormal: string;
  turnByTurnNav: string;
  distanceToPatient: string;
  distanceToHospital: string;
  erPreNotification: string;
  markAtScene: string;
  startTransitToHospital: string;
  completeHandover: string;
  enterVitals: string;
  inTransitTelemetry: string;
  heartRate: string;
  bloodPressure: string;
  oxygenSaturation: string;
  respiratoryRate: string;
  glasgowComaScale: string;
  transmitVitals: string;
  transmitting: string;
  offlineNotice: string;
  offlineNoticeDesc: string;
  onlineNotice: string;
  onlineNoticeDesc: string;
  emergencyReportTitle: string;
  printReport: string;
  erTraumaMonitorTitle: string;
  prepTraumaBay: string;
  bayPrepared: string;
  trafficSignalPriorityTitle: string;
  signalNormal: string;
  signalPriorityRouteA: string;
  signalPriorityRouteB: string;
  icePassTitle: string;
  copyLink: string;
  printIcePass: string;
  verifiedDispatch: string;
  fleetRadarTitle: string;
  fleetRadarSubtitle: string;
  hospitalWardCapacity: string;
  hospitalERTrauma: string;
  vehicleTelemetry: string;
  fuelLevel: string;
  oxygenLevel: string;
  batteryStatus: string;
  defibrillatorReady: string;
  maintenanceStatus: string;
  shiftHours: string;
  driverLicense: string;
  testSiren: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appTitle: 'Arogyavahini',
    appSubtitle: 'Emergency Medical Response & Ambulance Dispatch System',
    appSubtitlePatient: 'Emergency Response Network',
    appSubtitleDriver: 'Ambulance Crew Dispatch',
    appSubtitleAdmin: 'Hospital Command Center',
    hotlineLabel: '24/7 Emergency Dispatch Hotline:',
    soundMute: 'Mute Siren Audio',
    soundUnmute: 'Unmute Siren Audio',
    themeLight: 'Switch to Light Mode',
    themeDark: 'Switch to Dark Mode',
    highContrastToggle: 'High-Contrast Glare Mode (Outdoor Sunlight)',
    languageSelect: 'Select Language',
    roleLabel: 'ROLE:',
    logout: 'Logout',
    signInRegister: 'Sign In / Register',

    rolePatient: 'PATIENT',
    roleDriver: 'DRIVER',
    roleAdmin: 'ADMIN',

    dashboard: 'Dashboard',
    emergencyInformation: 'Emergency Information',
    activeEmergency: 'Active Emergency',
    ambulanceTracking: 'Ambulance Tracking',
    hospitalsFleetRadar: 'Hospitals & Fleet Radar',
    emergencyHistory: 'Emergency History',
    medicalProfile: 'Medical Profile',
    firstAidGuides: 'First Aid Guides',
    settings: 'Settings',
    notifications: 'Notifications',
    activeSosInProgress: '🚨 ACTIVE SOS IN PROGRESS',
    triggerEmergencySos: 'TRIGGER EMERGENCY SOS',
    dispatchedTrackingSub: 'Dispatched #{id} • Tap to Track',
    instant108DispatchSub: 'Instant 108 Dispatch (⌘⇧S)',
    expandSidebar: 'Expand Sidebar',
    collapseSidebar: 'Collapse Sidebar',
    portalCitizen: 'CITIZEN',
    portalPatient: 'PATIENT',
    portalDriver: 'DRIVER',
    portalHospital: 'HOSPITAL',
    portalAdmin: 'ADMIN',
    portalBadgePortal: 'PORTAL',
    portalBadgeCommand: 'COMMAND',
    portalBadgeCockpit: 'COCKPIT',

    navDriverDashboard: 'Driver Dashboard',
    navIncomingRequests: 'Incoming Requests',
    navActiveEmergency: 'Active Emergency',
    navAmbulanceStatus: 'Ambulance Status',
    navProfile: 'Profile',
    driverCockpit: 'Cockpit Overview',
    driverIncoming: 'Incoming Requests',
    driverActive: 'Active Mission',
    driverNavigation: 'GPS Route Navigation',
    driverStatus: 'Ambulance Status',
    driverHistory: 'Mission History',
    driverNotifications: 'Notifications',
    driverProfile: 'Crew Profile',
    driverSettings: 'Settings',
    missionActive: 'MISSION ACTIVE',
    turnByTurn: 'TURN-BY-TURN',
    enRoute: 'EN ROUTE',

    navPatientDashboard: 'Dashboard',
    navEmergencySOS: 'Emergency SOS',
    navMyRequests: 'My Requests',
    navAmbulanceTracking: 'Ambulance Tracking',

    navAdminDashboard: 'Dashboard',
    navEmergencyRequests: 'Emergency Requests',
    navAmbulances: 'Ambulances',
    navDrivers: 'Drivers',
    navUsers: 'Users',
    navReports: 'Reports',
    hospitalIncomingEmergencies: 'Incoming Emergencies',
    hospitalPatientInfo: 'Patient Information & e-PCR',
    hospitalFleetRadar: 'Ambulance Tracking & Fleet',
    hospitalWards: 'Hospital Capacity & Wards',
    hospitalTraffic: 'Green Corridor Traffic Signal',
    hospitalPersonnel: 'Medical Personnel & Doctors',
    hospitalReports: 'Reports & Insights',
    hospitalHistory: 'Admission History',
    hospitalSettings: 'Hospital Settings',
    criticalTraumaAdmission: 'CRITICAL TRAUMA ADMISSION',

    loading: 'Loading...',
    cancel: 'Cancel',
    submit: 'Submit',
    save: 'Save',
    close: 'Close',
    confirm: 'Confirm',
    phone: 'Phone',
    location: 'Location',
    status: 'Status',
    type: 'Type',
    actions: 'Actions',
    notes: 'Notes',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    available: 'AVAILABLE',
    busy: 'BUSY',
    assigned: 'ASSIGNED',
    maintenance: 'MAINTENANCE',
    viewDetails: 'View Details',
    time: 'Time',
    patientName: 'Patient Name',
    driverName: 'Driver Name',
    vehicleNumber: 'Vehicle Number',
    emergencyType: 'Emergency Type',
    ambulanceType: 'Ambulance Type',
    baseLocation: 'Base Location',
    activeEmergencies: 'Active Emergencies',
    availableAmbulances: 'Available Ambulances',
    completedTrips: 'Completed Missions',
    refresh: 'Refresh',
    rate: 'Rate',
    download: 'Download',
    viewReport: 'View Report',

    statusWaitingForDriver: 'SOS Broadcast',
    statusWaitingDesc: 'Waiting for available crew to accept',
    statusDriverAccepted: 'Driver Accepted',
    statusDriverAcceptedDesc: 'Ambulance assigned & confirmed',
    statusOnTheWay: 'On The Way',
    statusOnTheWayDesc: 'En route with priority sirens active',
    statusReached: 'Crew Reached',
    statusReachedDesc: 'First responders at incident scene',
    statusCompleted: 'Hospital Admission',
    statusCompletedDesc: 'Handover complete at trauma center',
    statusCancelled: 'Emergency Cancelled',
    statusCancelledDesc: 'Request closed by user or dispatch',
    statusEnRoute: 'En Route',
    statusAtScene: 'At Scene',
    statusAvailable: 'Available',

    heroBadge: 'Emergency Medical Response Network',
    heroSubBadge: '24/7 Rapid Response Dispatch',
    heroTitle: 'Smart Integrated Emergency',
    heroTitleGradient: 'Medical Response System',
    heroSubtitle: 'A unified emergency medical network connecting patients in crisis with the nearest available life-support ambulances, hospital trauma wards, and dispatch controllers.',
    heroTriggerSOS: 'TRIGGER EMERGENCY SOS',
    heroOpenAdmin: 'Open Admin Command Center',
    heroStatAmbulances: 'Active Ambulances',
    heroStatReady: 'Ready for Dispatch',
    heroStatEmergencies: 'Live Emergencies',
    heroStatResponseTime: 'Avg. Response Time',
    heroPortalsTitle: 'Dedicated Stakeholder Portals',
    heroPortalsSubtitle: 'Select a portal below to access role-specific workflows and live dispatch operations',

    portalPatientTitle: 'Patient Portal',
    portalPatientDesc: 'One-tap Emergency SOS dispatch with automated ambulance pairing, live GPS status progression, driver contact card, and first-aid instructions.',
    portalPatientF1: 'Instant SOS Emergency Button',
    portalPatientF2: 'Real-time Stepper (Requested → Reached)',
    portalPatientF3: 'Assigned Vehicle & Crew Details',
    portalPatientBtn: 'Access Patient Portal',

    portalDriverTitle: 'Driver Console',
    portalDriverDesc: 'Real-time responder cockpit for ambulance drivers to receive incoming dispatches, accept routes, start siren journeys, and log scene arrival.',
    portalDriverF1: 'Instant Sound & Visual Siren Alert',
    portalDriverF2: '1-Click Status Controls (Accept/En Route)',
    portalDriverF3: 'Direct Patient Phone & Incident Pin',
    portalDriverBtn: 'Access Driver Console',

    portalAdminTitle: 'Admin Command Center',
    portalAdminDesc: 'Hospital emergency operations room for fleet tracking, dispatch monitoring, emergency triage analytics, manual assignment overrides, and audit trails.',
    portalAdminF1: 'Comprehensive Emergency Ledger',
    portalAdminF2: 'Fleet Availability & Maintenance',
    portalAdminF3: 'System Diagnostics & Data Refresh',
    portalAdminBtn: 'Access Command Center',

    pipelineTitle: 'Operational Emergency Lifecycle',
    pipelineSubtitle: 'State-certified emergency response lifecycle with immediate responder acknowledgment and live status updates.',
    pipelineDesc: 'Chronological emergency dispatch progression and live telemetry',
    pipelineStep1Title: 'Patient SOS Trigger',
    pipelineStep1Desc: 'Patient broadcasts incident location and medical emergency severity.',
    pipelineStep2Title: 'Driver Response & Claim',
    pipelineStep2Desc: 'Available paramedic crew reviews alert and immediately claims the emergency.',
    pipelineStep3Title: 'Siren Priority Journey',
    pipelineStep3Desc: 'Ambulance proceeds with emergency sirens active directly to patient location.',
    pipelineStep4Title: 'Trauma Ward Handover',
    pipelineStep4Desc: 'Patient admitted to emergency trauma center and ambulance returned to ready status.',
    networkBadge1: 'National Emergency Response Network',
    networkBadge2: '24/7 Centralized Dispatch Operation',
    networkBadge3: 'High-Availability Medical Telemetry',

    patientPortalTitle: 'Emergency Patient Portal',
    patientPortalBadge: 'Priority Medical Access',
    patientWelcome: 'Welcome back',
    patientLoggedInAs: 'Logged in as Emergency Contact',
    patientMedicalId: 'Patient ID',
    patientRegisteredPhone: 'Primary Contact',
    patientActiveAlertTitle: 'Active Emergency Dispatch in Progress',
    patientActiveAlertDesc: 'Keep your phone accessible. Emergency response team is coordinating this mission.',
    patientAssignedAmbulance: 'Assigned Ambulance',
    patientDriverContact: 'Driver Contact',
    patientAmbulanceType: 'Vehicle Type',
    patientBaseLocation: 'Base Station',
    patientCancelSOS: 'Cancel Emergency Call',
    patientCancelConfirm: 'Are you sure you want to cancel this emergency request?',
    patientTriggerTitle: 'Instant Emergency SOS Broadcast',
    patientTriggerDesc: 'Press the SOS button below for immediate ambulance dispatch to your current location.',
    patientInstantSOSBtn: 'ONE-TAP EMERGENCY SOS',
    patientEmergencyDetails: 'Emergency Details & Incident Location',
    patientSelectEmergencyType: 'Select Emergency Classification',
    patientLocationPlaceholder: 'Enter exact landmark or address',
    patientUseCurrentLocation: 'Auto-detect GPS',
    patientPhonePlaceholder: 'Emergency Contact Phone',
    patientNotesPlaceholder: 'Patient condition, symptoms, known allergies, floor/building details...',
    patientDispatchBtn: 'CONFIRM & BROADCAST SOS DISPATCH',
    patientFirstAidTitle: 'Emergency First Aid Guidance',
    patientFirstAidSubtitle: 'Immediate life-support instructions while ambulance is en route',
    patientHistoryTitle: 'Emergency Request History',
    patientNoHistory: 'No past emergency requests recorded.',

    secureMedicalProfile: 'Secure Emergency Medical Profile',
    secureMedicalProfileDesc: '256-Bit Encrypted Healthcare Record • Shared directly with dispatched ambulance crew upon SOS',
    bloodGroup: 'Blood Group',
    bloodGroupDesc: 'Critical for Pre-hospital Blood Transfusion',
    allergies: 'Allergies & Contraindications',
    chronicConditions: 'Chronic Medical Conditions / Implants',
    emergencyContact: 'Emergency Contact & Next of Kin',
    inputEditMedicalInfo: 'Input / Edit Medical Info',
    saveMedicalProfile: 'Save Emergency Profile',
    transmittedOnSos: 'Medical ID Transmitted on SOS',
    icePass: 'ICE Pass',
    iceQrCode: 'First Responder QR Emergency Pass',
    noKnownAllergies: 'No known allergies',
    noRecordedConditions: 'No chronic conditions recorded',
    notSet: 'Not set',
    emergencyContactName: 'Contact Name',
    emergencyContactPhone: 'Contact Phone',
    emergencyContactRelation: 'Relationship',

    driverPortalTitle: 'Ambulance Crew Cockpit',
    driverPortalBadge: 'Emergency Driver Terminal',
    driverBadge: 'Emergency Crew',
    driverAssignedUnit: 'Assigned Unit',
    driverAvailabilityStatus: 'Vehicle Availability Status',
    driverSetAvailable: 'Set to READY / AVAILABLE',
    driverSetMaintenance: 'Set to MAINTENANCE',
    driverSwitchVehicle: 'Switch Assigned Vehicle:',
    driverIncomingTitle: 'Incoming Emergency Dispatches',
    driverIncomingSubtitle: 'Urgent calls awaiting nearest driver acceptance',
    driverIncomingAlerts: 'Incoming Emergency Alerts',
    driverIncomingDesc: 'Urgent SOS requests broadcast in your operational radius',
    driverNoIncoming: 'No unassigned emergency dispatches in queue. Fleet is on standby.',
    driverAcceptBtn: 'ACCEPT EMERGENCY & DISPATCH',
    driverAcceptRequest: 'Accept Emergency Dispatch',
    driverAcceptSuccess: 'Emergency accepted! Dispatched to incident.',
    driverActiveMissionTitle: 'Active Emergency Mission',
    driverActiveMissionBadge: 'Priority Siren Active',
    driverPatientDetails: 'Patient Information',
    driverIncidentLocation: 'Incident Location',
    driverEmergencyNature: 'Emergency Classification',
    driverCallPatient: 'Call Patient',
    driverActionStartJourney: 'START JOURNEY (ON THE WAY)',
    driverStartJourney: 'Start Journey',
    driverActionArrived: 'ARRIVED AT SCENE (REACHED)',
    driverMarkReached: 'Mark Arrived at Scene',
    driverActionComplete: 'COMPLETE HOSPITAL HANDOVER',
    driverCompleteTrip: 'Complete Hospital Handover',
    driverReadyStandby: 'Unit is now free and ready on standby',
    driverStandby: 'Ready on Standby',
    driverStandbyDesc: 'Vehicle is active and awaiting next emergency dispatch',
    driverVehicleSpecs: 'Vehicle Equipment & Crew',
    driverMissionHistory: 'Completed Mission History',
    driverCompletedMissions: 'Completed Emergency Dispatches',

    adminPortalTitle: 'Hospital Dispatch Command Center',
    adminPortalBadge: 'Admin Command',
    adminConsoleBadge: 'Admin Console',
    adminSubtitle: 'Live Fleet Tracking, Central Dispatch Queue, and Operational Activity Logs',
    adminResetData: 'Restore Default Fleet',
    adminResetSystem: 'Reset System Data',
    adminAddAmbulance: 'Add Ambulance',
    adminTotalCalls: 'Total Emergencies',
    adminActiveCallsDesc: 'Currently en route / at scene',
    adminReadyFleetDesc: 'Ready for instant SOS',
    adminMetricTotalCalls: 'Total Emergencies',
    adminMetricActive: 'Active Calls',
    adminMetricAvailable: 'Ready Fleet',
    adminMetricAvgTime: 'Avg Response',
    adminFleetTitle: 'Emergency Ambulance Fleet & Crew Management',
    adminFleetSubtitle: 'Real-time readiness, vehicle telemetry, and crew status',
    adminFleetDesc: 'Real-time status, vehicle readiness, and driver telemetry',
    adminLedgerTitle: 'Emergency Dispatches Master Ledger',
    adminLedgerSubtitle: 'Complete chronological record of emergency dispatches and triage outcomes',
    adminMasterLedgerTitle: 'Emergency Dispatches Master Ledger',
    adminMasterLedgerDesc: 'All registered SOS calls, assignments, and response lifecycles',
    adminFilterAll: 'All Records',
    adminFilterActive: 'Active Calls',
    adminFilterCompleted: 'Completed',
    adminFilterCancelled: 'Cancelled',
    adminUsersTitle: 'Authorized Personnel & Role Directory',
    adminUsersSubtitle: 'Verified medical officers, paramedics, and registered patient profiles',
    adminUsersDesc: 'Authorized personnel accounts, active dispatchers, and verified drivers',

    authSignInTitle: 'Sign In to Arogyavahini',
    authRegisterTitle: 'Create Emergency Account',
    authSubtitle: 'Access rapid response dispatch, medical profiles, and mission controls.',
    authQuickDemo: 'Instant Role-Based Access:',
    authFullName: 'Full Name',
    authEmail: 'Email Address',
    authPassword: 'Password',
    authSelectRole: 'Select Role Access',
    authSignInBtn: 'Sign In to Portal',
    authRegisterBtn: 'Create Account & Sign In',
    authNoAccount: "Don't have an account?",
    authHaveAccount: 'Already have an account?',
    authCreateOne: 'Register new profile',

    footerNetwork: 'Arogyavahini Emergency Medical Response Network',
    footerDesc: 'Unified state emergency dispatch platform providing rapid paramedic mobilization, hospital trauma ward routing, and live patient tracking.',
    footerTollFree: 'Toll-Free Emergency Helpline: 108 / 112',
    footerEmergencyHotline: 'Emergency Helpline: 108 / 112',
    footerRights: 'All rights reserved. Government Healthcare Emergency Infrastructure.',
    footerCertified: 'Certified Emergency Medical Service Network',

    notificationsTitle: 'Notifications',
    notificationsEmpty: 'No notifications yet',
    notificationsEmptyDesc: 'Emergency dispatches, alerts, and system updates will appear here in real time.',
    notificationsMarkAllRead: 'Mark all as read',
    notificationsClearAll: 'Clear all',
    notificationsViewAll: 'View All Notifications',
    notificationsClose: 'Close panel',
    notificationsUnreadBadge: 'unread',
    notificationNew: 'NEW',
    notificationTimeJustNow: 'Just now',
    notificationViewEmergency: 'View Emergency Details',

    voiceSymptomsBtn: 'Describe Symptoms with Voice',
    voiceRecordingTitle: 'Emergency Voice-to-Text Symptom Recorder',
    voiceRecordingSubtitle: 'Speak naturally to record your symptoms. Dispatchers and paramedics will receive clear clinical context.',
    voiceStartRecording: 'Start Voice Recording',
    voiceStopRecording: 'Stop Recording',
    voiceListening: 'Listening... Speak your symptoms clearly',
    voiceSpeakNow: 'Speak now into your microphone',
    voiceTranscribedLabel: 'Transcribed Symptoms (Spoken Context):',
    voiceQuickSymptoms: 'Tap Quick Emergency Symptoms:',
    voiceApplySymptoms: 'Save & Use for Emergency SOS',
    voiceClear: 'Clear Text',
    voiceSummarizeAi: 'Enhance Clinical Context (AI Triage)',
    voiceMicPermissionError: 'Microphone access was blocked. Please allow microphone permissions in your browser.',
    voiceNotSupported: 'Speech recognition is not fully supported in this browser. You can type or tap quick symptom chips below.',
    voiceUrgencyLevel: 'Estimated Urgency:',
    voiceRecommendedType: 'Suggested Emergency Unit:',
    voiceContextAttached: 'Voice-to-Text Context Attached',
    voiceUpdateDispatcher: 'Update Dispatcher with Voice',

    firstAidHeader: 'Emergency First Aid Guidance',
    firstAidSub: 'Immediate life-support instructions while ambulance is en route',
    cprAdult: 'Adult CPR',
    cprChild: 'Child & Infant CPR',
    choking: 'Choking (Heimlich)',
    severeBleeding: 'Severe Bleeding',
    burnsScalds: 'Burns & Scalds',
    strokeFast: 'Stroke (F.A.S.T.)',
    heartAttack: 'Heart Attack',
    step: 'Step',
    alwaysCall108: 'Always call 108 first. These instructions provide bridging care while responders are en route.',

    proximityAlertTitle: 'Ambulance Approaching (Within 2 KM)',
    proximityAlertDesc: 'Ambulance is near your location. Please keep your phone reachable and prepare the entrance.',
    playVoiceAnnouncement: 'Play Voice Alert',
    dismiss: 'Dismiss',

    ambulanceArrivingIn: 'Ambulance arriving in ~{minutes} mins',
    ambulanceDispatched: 'Ambulance #{id} dispatched',
    hospitalAssigned: 'Hospital assigned: {hospital}',
    searchingFleet: 'Searching nearby standby ambulances...',
    activeSos: 'Active SOS',
    driverAssigned: 'Driver {driver} assigned',
    patientConnected: 'Patient connected',
    eta: 'ETA',
    mins: 'mins',
    km: 'km',

    emergency: 'Emergency',
    missionCompleted: 'MISSION COMPLETED',
    liveSos: 'LIVE SOS',
    ambulanceAssigned: 'Ambulance Assigned',
    enRouteToYou: 'En Route to You',
    arrivedAtScene: 'Arrived at Scene',
    handoverCompleted: 'Handover Completed',
    voiceUpdate: 'Voice Update',
    closeNewSos: 'Close / New SOS',
    emergencyMissionFinalized: 'Emergency Mission Finalized & Patient Handover Completed',
    emergencyMissionFinalizedDesc: 'A comprehensive clinical and operational emergency report has been compiled for your records.',
    downloadReport: 'Download Report',
    estimatedEta: 'Estimated Time of Arrival (Live ETA)',
    within2kmAlertZone: 'Within 2km Alert Zone',
    liveTraffic: 'Live Traffic',
    lowCongestion: 'Low Congestion',
    greenCorridorActive: 'Green Corridor Active',
    iceHealthPass: 'ICE Health Pass',
    alertBroadcastInProgress: 'Alert Broadcast in Progress:',
    alertBroadcastDesc: 'We are routing your SOS request to the nearest available ambulance units in real time. Please stay on this screen.',
    callParamedic: 'Call Paramedic',
    broadcastingFleetAlert: 'Broadcasting alert to nearest fleet',
    clinicalProfileTransmitted: 'Clinical Emergency Profile Transmitted to 108 Dispatchers & Paramedics',
    transmitted: 'Transmitted',
    primaryEmergencyContact: 'Primary Emergency Contact',
    existingConditionsDirectives: 'Existing Conditions & Medical Directives:',
    directPriorityCorridor: 'Direct Priority Corridor',
    gpsAutoPinned: 'GPS Auto-Pinned:',
    instant1TapSos: 'Instant 1-Tap SOS',
    autoPinningGps: 'Auto-pinning your GPS location via Browser Geolocation API...',
    locationDenied: 'Location access was denied in browser settings. Enter address manually.',
    enterAddressManually: 'Enter location or landmark manually',
    gpsCalibrate: 'Calibrate GPS',
    centerOnMe: 'Center on Me',
    medicalIdOnSos: 'Medical ID Transmitted on SOS:',
    updateProfile: 'Update Profile',
    pastEmergencies: 'Past Emergencies & Activity Log',
    noPastEmergencies: 'No past emergency requests recorded on this profile.',
    radarMarkersLegend: 'Radar Markers Legend',
    wardAvailable: 'Ward Available',
    wardFullDiversion: 'Ward Full (Diversion)',
    ambulanceFleet: 'Ambulance Fleet',
    yourIncidentGps: 'Your Incident GPS',
    yourDetectedPin: 'Your Detected GPS Pin',
    detectingGps: 'Detecting GPS...',
    nearestAmbulance: 'Nearest Standby Ambulance',
    transfusionReady: 'Transfusion Ready',
    alerts108Paramedics: 'Alerts 108 Paramedics',
    changesSyncSos: 'Changes will instantly synchronize with your account and SOS dispatch',
    editCriticalInfo: 'Edit Critical Emergency Information',
    clickChipToToggle: 'Click chip to toggle',
    saveAndProtect: 'Save & Protect',
    savingProfile: 'Saving Profile...',
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    ambulanceCrewCockpit: 'Ambulance Crew Cockpit',
    onEmergency: 'On Emergency',
    activeEmergencyInProgress: '🚨 ACTIVE EMERGENCY IN PROGRESS',
    patient: 'Patient',
    destination: 'Destination',
    openLiveNav: 'Open Live Navigation HUD',
    incomingCalls: 'Incoming Emergency Calls',
    criticalTriageAlerts: 'Critical Triage Alerts',
    noIncomingCalls: 'No incoming emergency dispatches at this moment',
    acceptEmergency: 'Accept Emergency',
    decline: 'Decline',
    priorityCritical: 'CRITICAL',
    priorityHigh: 'HIGH',
    priorityNormal: 'NORMAL',
    turnByTurnNav: 'Turn-by-Turn GPS Navigation',
    distanceToPatient: 'Distance to Patient',
    distanceToHospital: 'Distance to Hospital',
    erPreNotification: 'ER Pre-Notification Sent',
    markAtScene: 'Mark Reached Incident Scene',
    startTransitToHospital: 'Start Transit to Hospital',
    completeHandover: 'Complete Hospital Handover',
    enterVitals: 'Input In-Transit e-PCR Vitals',
    inTransitTelemetry: 'In-Transit Patient Telemetry',
    heartRate: 'Heart Rate',
    bloodPressure: 'Blood Pressure',
    oxygenSaturation: 'Oxygen Saturation (SpO2)',
    respiratoryRate: 'Respiratory Rate',
    glasgowComaScale: 'Glasgow Coma Scale (GCS)',
    transmitVitals: 'Transmit Vitals to ER',
    transmitting: 'Transmitting...',
    offlineNotice: 'Offline Notice:',
    offlineNoticeDesc: 'Internet connection lost. Emergency SOS requests and real-time fleet telemetry are suspended until connection is restored.',
    onlineNotice: 'Online:',
    onlineNoticeDesc: 'Internet connection restored. Real-time emergency synchronization is active.',
    emergencyReportTitle: 'Official Emergency Incident & Dispatch Record',
    printReport: 'Print Report',
    erTraumaMonitorTitle: 'Hospital Emergency Department & In-Transit Trauma Triage',
    prepTraumaBay: 'Prepare Trauma Bay',
    bayPrepared: 'Trauma Bay Prepared',
    trafficSignalPriorityTitle: 'Emergency Green Corridor Traffic Coordination',
    signalNormal: 'Normal Traffic Signal Cycle',
    signalPriorityRouteA: 'Green Wave Active (Corridor A)',
    signalPriorityRouteB: 'Green Wave Active (Corridor B)',
    icePassTitle: 'First Responder Emergency Health Pass (ICE)',
    copyLink: 'Copy Profile Link',
    printIcePass: 'Print ICE Card',
    verifiedDispatch: '24/7 Verified Medical Dispatch',
    fleetRadarTitle: 'Live Emergency Fleet & GPS Radar',
    fleetRadarSubtitle: 'Real-time map showing your current position and nearby standby emergency ambulances',
    hospitalWardCapacity: 'Emergency Ward Capacity',
    hospitalERTrauma: 'Emergency ER & Trauma',
    vehicleTelemetry: 'Vehicle Telemetry',
    fuelLevel: 'Fuel Level',
    oxygenLevel: 'Oxygen Level',
    batteryStatus: 'Battery Voltage',
    defibrillatorReady: 'Defibrillator Status',
    maintenanceStatus: 'Maintenance Status',
    shiftHours: 'Shift Hours',
    driverLicense: 'Driver License',
    testSiren: 'Test Siren Alert',
  },

  kn: {
    appTitle: 'ಆರೋಗ್ಯವಾಹಿನಿ',
    appSubtitle: 'ತುರ್ತು ವೈದ್ಯಕೀಯ ಪ್ರತಿಕ್ರಿಯೆ ಮತ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ರವಾನೆ ವ್ಯವಸ್ಥೆ',
    appSubtitlePatient: 'ತುರ್ತು ವೈದ್ಯಕೀಯ ಸೇವಾ ಜಾಲ',
    appSubtitleDriver: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಿಬ್ಬಂದಿ ರವಾನೆ',
    appSubtitleAdmin: 'ಆಸ್ಪತ್ರೆ ಕಮಾಂಡ್ ನಿಯಂತ್ರಣ ಕೇಂದ್ರ',
    hotlineLabel: '24/7 ತುರ್ತು ರವಾನೆ ಸಹಾಯವಾಣಿ:',
    soundMute: 'ಸೈರನ್ ಶಬ್ದ ಮ್ಯೂಟ್ ಮಾಡಿ',
    soundUnmute: 'ಸೈರನ್ ಶಬ್ದ ಆನ್ ಮಾಡಿ',
    themeLight: 'ಲೈಟ್ ಮೋಡ್‌ಗೆ ಬದಲಿಸಿ',
    themeDark: 'ಡಾರ್ಕ್ ಮೋಡ್‌ಗೆ ಬದಲಿಸಿ',
    highContrastToggle: 'ಹೈ-ಕಾಂಟ್ರಾಸ್ಟ್ ಗ್ಲೇರ್ ಮೋಡ್ (ಬಿಸಿಲು/ಹೊರಾಂಗಣ)',
    languageSelect: 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    roleLabel: 'ಪಾತ್ರ:',
    logout: 'ಲಾಗ್ ಔಟ್',
    signInRegister: 'ಸೈನ್ ಇನ್ / ನೋಂದಣಿ',

    rolePatient: 'ರೋಗಿ',
    roleDriver: 'ಚಾಲಕರು',
    roleAdmin: 'ಆಡಳಿತ',

    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    emergencyInformation: 'ತುರ್ತು ಮಾಹಿತಿ',
    activeEmergency: 'ಸಕ್ರಿಯ ತುರ್ತು ಕರೆ',
    ambulanceTracking: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಟ್ರ್ಯಾಕಿಂಗ್',
    hospitalsFleetRadar: 'ಆಸ್ಪತ್ರೆಗಳು ಮತ್ತು ವಾಹನ ಜಾಲ',
    emergencyHistory: 'ತುರ್ತು ಇತಿಹಾಸ',
    medicalProfile: 'ವೈದ್ಯಕೀಯ ಪ್ರೊಫೈಲ್',
    firstAidGuides: 'ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ಮಾರ್ಗದರ್ಶಿ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    notifications: 'ಅಧಿಸೂಚನೆಗಳು',
    activeSosInProgress: '🚨 ಸಕ್ರಿಯ SOS ಚಾಲನೆಯಲ್ಲಿದೆ',
    triggerEmergencySos: 'ತುರ್ತು SOS ಕಳುಹಿಸಿ',
    dispatchedTrackingSub: 'ರವಾನಿಸಲಾಗಿದೆ #{id} • ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಸ್ಪರ್ಶಿಸಿ',
    instant108DispatchSub: 'ತ್ವರಿತ 108 ರವಾನೆ (⌘⇧S)',
    expandSidebar: 'ಸೈಡ್‌ಬಾರ್ ವಿಸ್ತರಿಸಿ',
    collapseSidebar: 'ಸೈಡ್‌ಬಾರ್ ಮಡಿಸಿ',
    portalCitizen: 'ನಾಗರಿಕ',
    portalPatient: 'ರೋಗಿ',
    portalDriver: 'ಚಾಲಕ',
    portalHospital: 'ಆಸ್ಪತ್ರೆ',
    portalAdmin: 'ಆಡಳಿತ',
    portalBadgePortal: 'ಪೋರ್ಟಲ್',
    portalBadgeCommand: 'ಕಮಾಂಡ್',
    portalBadgeCockpit: 'ಕಾಕ್‌ಪಿಟ್',

    navDriverDashboard: 'ಚಾಲಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    navIncomingRequests: 'ಒಳಬರುವ ವಿನಂತಿಗಳು',
    navActiveEmergency: 'ಸಕ್ರಿಯ ತುರ್ತು ಕರೆ',
    navAmbulanceStatus: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸ್ಥಿತಿ',
    navProfile: 'ಪ್ರೊಫೈಲ್',
    driverCockpit: 'ಕಾಕ್‌ಪಿಟ್ ಅವಲೋಕನ',
    driverIncoming: 'ಒಳಬರುವ ವಿನಂತಿಗಳು',
    driverActive: 'ಸಕ್ರಿಯ ಮಿಷನ್',
    driverNavigation: 'ಜಿಪಿಎಸ್ ಮಾರ್ಗ ಸಂಚರಣೆ',
    driverStatus: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸ್ಥಿತಿ',
    driverHistory: 'ಮಿಷನ್ ಇತಿಹಾಸ',
    driverNotifications: 'ಅಧಿಸೂಚನೆಗಳು',
    driverProfile: 'ಸಿಬ್ಬಂದಿ ಪ್ರೊಫೈಲ್',
    driverSettings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    missionActive: 'ಮಿಷನ್ ಸಕ್ರಿಯ',
    turnByTurn: 'ಹಂತ-ಹಂತದ ಮಾರ್ಗ',
    enRoute: 'ಮಾರ್ಗದಲ್ಲಿದೆ',

    navPatientDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    navEmergencySOS: 'ತುರ್ತು SOS',
    navMyRequests: 'ನನ್ನ ವಿನಂತಿಗಳು',
    navAmbulanceTracking: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಟ್ರ್ಯಾಕಿಂಗ್',

    navAdminDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    navEmergencyRequests: 'ತುರ್ತು ವಿನಂತಿಗಳು',
    navAmbulances: 'ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಳು',
    navDrivers: 'ಚಾಲಕರು',
    navUsers: 'ಬಳಕೆದಾರರು',
    navReports: 'ವರದಿಗಳು',
    hospitalIncomingEmergencies: 'ಆಗಮಿಸುತ್ತಿರುವ ತುರ್ತು ಕರೆಗಳು',
    hospitalPatientInfo: 'ರೋಗಿಯ ಮಾಹಿತಿ & ಇ-ಪಿಸಿಆರ್',
    hospitalFleetRadar: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಟ್ರ್ಯಾಕಿಂಗ್ & ವಾಹನಗಳು',
    hospitalWards: 'ಆಸ್ಪತ್ರೆ ಸಾಮರ್ಥ್ಯ ಮತ್ತು ವಾರ್ಡ್‌ಗಳು',
    hospitalTraffic: 'ಗ್ರೀನ್ ಕಾರಿಡಾರ್ ಟ್ರಾಫಿಕ್ ಸಿಗ್ನಲ್',
    hospitalPersonnel: 'ವೈದ್ಯಕೀಯ ಸಿಬ್ಬಂದಿ ಮತ್ತು ವೈದ್ಯರು',
    hospitalReports: 'ವರದಿಗಳು ಮತ್ತು ಅಂಕಿಅಂಶ',
    hospitalHistory: 'ದಾಖಲಾತಿ ಇತಿಹಾಸ',
    hospitalSettings: 'ಆಸ್ಪತ್ರೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    criticalTraumaAdmission: 'ತೀವ್ರ ಟ್ರಾಮಾ ತುರ್ತು ದಾಖಲಾತಿ',

    loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    cancel: 'ರದ್ದುಮಾಡಿ',
    submit: 'ಸಲ್ಲಿಸಿ',
    save: 'ಉಳಿಸಿ',
    close: 'ಮುಚ್ಚಿ',
    confirm: 'ದೃಢೀಕರಿಸಿ',
    phone: 'ದೂರವಾಣಿ',
    location: 'ಸ್ಥಳ',
    status: 'ಸ್ಥಿತಿ',
    type: 'ವಿಧ',
    actions: 'ಕ್ರಮಗಳು',
    notes: 'ವಿವರಗಳು',
    search: 'ಹುಡುಕಿ',
    filter: 'ಫಿಲ್ಟರ್',
    all: 'ಎಲ್ಲಾ',
    active: 'ಸಕ್ರಿಯ',
    completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    cancelled: 'ರದ್ದುಗೊಂಡಿದೆ',
    available: 'ಲಭ್ಯವಿದೆ',
    busy: 'ಕಾರ್ಯನಿರತ',
    assigned: 'ನಿಯೋಜಿಸಲಾಗಿದೆ',
    maintenance: 'ನಿರ್ವಹಣೆಯಲ್ಲಿ',
    viewDetails: 'ವಿವರ ವೀಕ್ಷಿಸಿ',
    time: 'ಸಮಯ',
    patientName: 'ರೋಗಿಯ ಹೆಸರು',
    driverName: 'ಚಾಲಕರ ಹೆಸರು',
    vehicleNumber: 'ವಾಹನ ಸಂಖ್ಯೆ',
    emergencyType: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿಯ ವಿಧ',
    ambulanceType: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ವಿಧ',
    baseLocation: 'ಮೂಲ ನಿಲ್ದಾಣ',
    activeEmergencies: 'ಸಕ್ರಿಯ ತುರ್ತು ಕರೆಗಳು',
    availableAmbulances: 'ಲಭ್ಯವಿರುವ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಳು',
    completedTrips: 'ಪೂರ್ಣಗೊಂಡ ಟ್ರಿಪ್‌ಗಳು',
    refresh: 'ನವೀಕರಿಸಿ',
    rate: 'ರೇಟಿಂಗ್',
    download: 'ಡೌನ್‌ಲೋಡ್',
    viewReport: 'ವರದಿ ವೀಕ್ಷಿಸಿ',

    statusWaitingForDriver: 'SOS ಪ್ರಸಾರವಾಗಿದೆ',
    statusWaitingDesc: 'ಚಾಲಕರ ಸ್ವೀಕಾರಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ',
    statusDriverAccepted: 'ಚಾಲಕರು ಸ್ವೀಕರಿಸಿದ್ದಾರೆ',
    statusDriverAcceptedDesc: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ನಿಯೋಜನೆ ದೃಢಪಟ್ಟಿದೆ',
    statusOnTheWay: 'ಮಾರ್ಗದಲ್ಲಿದೆ',
    statusOnTheWayDesc: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ವೇಗವಾಗಿ ಬರುತ್ತಿದೆ',
    statusReached: 'ಸಿಬ್ಬಂದಿ ತಲುಪಿದ್ದಾರೆ',
    statusReachedDesc: 'ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ಸಿಬ್ಬಂದಿ ಸ್ಥಳಕ್ಕೆ ತಲುಪಿದ್ದಾರೆ',
    statusCompleted: 'ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲು',
    statusCompletedDesc: 'ತುರ್ತು ಚಿಕಿತ್ಸಾ ವಿಭಾಗಕ್ಕೆ ಹಸ್ತಾಂತರ ಪೂರ್ಣ',
    statusCancelled: 'ತುರ್ತು ಕರೆ ರದ್ದಾಗಿದೆ',
    statusCancelledDesc: 'ವಿನಂತಿಯನ್ನು ಮುಕ್ತಾಯಗೊಳಿಸಲಾಗಿದೆ',
    statusEnRoute: 'ಮಾರ್ಗದಲ್ಲಿದೆ',
    statusAtScene: 'ಸ್ಥಳಕ್ಕೆ ತಲುಪಿದೆ',
    statusAvailable: 'ಲಭ್ಯವಿದೆ',

    heroBadge: 'ತುರ್ತು ವೈದ್ಯಕೀಯ ಸೇವಾ ಜಾಲ',
    heroSubBadge: '24/7 ಕ್ಷಿಪ್ರ ಪ್ರತಿಕ್ರಿಯೆ ರವಾನೆ',
    heroTitle: 'ಸ್ಮಾರ್ಟ್ ಸಂಯೋಜಿತ ತುರ್ತು',
    heroTitleGradient: 'ವೈದ್ಯಕೀಯ ಸ್ಪಂದನಾ ವ್ಯವಸ್ಥೆ',
    heroSubtitle: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿರುವ ನಾಗರಿಕರನ್ನು ಹತ್ತಿರದ ಲೈಫ್-ಸಪೋರ್ಟ್ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಳು ಮತ್ತು ಆಸ್ಪತ್ರೆಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುವ ಅಧಿಕೃತ ತುರ್ತು ವೇದಿಕೆ.',
    heroTriggerSOS: 'ತುರ್ತು SOS ಕಳುಹಿಸಿ',
    heroOpenAdmin: 'ಆಡಳಿತ ನಿಯಂತ್ರಣ ಕೇಂದ್ರ ತೆರೆಯಿರಿ',
    heroStatAmbulances: 'ಸಕ್ರಿಯ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಳು',
    heroStatReady: 'ರವಾನೆಗೆ ಸಿದ್ಧವಾಗಿವೆ',
    heroStatEmergencies: 'ಲೈವ್ ತುರ್ತು ಕರೆಗಳು',
    heroStatResponseTime: 'ಸರಾಸರಿ ಪ್ರತಿಕ್ರಿಯೆ ಸಮಯ',
    heroPortalsTitle: 'ವಿಶೇಷ ಪಾತ್ರ ಪೋರ್ಟಲ್‌ಗಳು',
    heroPortalsSubtitle: 'ಸಂಬಂಧಿತ ಕಾರ್ಯಗಳನ್ನು ನಿರ್ವಹಿಸಲು ಕೆಳಗಿನ ಪೋರ್ಟಲ್ ಆಯ್ಕೆಮಾಡಿ',

    portalPatientTitle: 'ರೋಗಿ ಪೋರ್ಟಲ್',
    portalPatientDesc: 'ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ SOS ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಕರೆ, ಲೈವ್ GPS ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ಮಾರ್ಗದರ್ಶನ.',
    portalPatientF1: 'ತತ್‌ಕ್ಷಣದ SOS ತುರ್ತು ಬಟನ್',
    portalPatientF2: 'ನೈಜ ಸಮಯದ ಸ್ಟೆಪ್ಪರ್ ಪ್ರಗತಿ',
    portalPatientF3: 'ವಾಹನ ಮತ್ತು ಸಿಬ್ಬಂದಿ ವಿವರಗಳು',
    portalPatientBtn: 'ರೋಗಿ ಪೋರ್ಟಲ್‌ಗೆ ಪ್ರವೇಶಿಸಿ',

    portalDriverTitle: 'ಚಾಲಕರ ನಿಯಂತ್ರಣ ಕನ್ಸೋಲ್',
    portalDriverDesc: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಚಾಲಕರಿಗೆ ತುರ್ತು ಕರೆ ಸ್ವೀಕರಿಸಲು, ಮಾರ್ಗ ಪ್ರಾರಂಭಿಸಲು ಮತ್ತು ಸ್ಥಳಕ್ಕೆ ತಲುಪಿದ ದಾಖಲೆ ಮಾಡಲು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್.',
    portalDriverF1: 'ತತ್‌ಕ್ಷಣದ ಸೈರನ್ ಶಬ್ದ ಮತ್ತು ಎಚ್ಚರಿಕೆ',
    portalDriverF2: '1-ಕ್ಲಿಕ್ ಸ್ಥಿತಿ ನಿಯಂತ್ರಣಗಳು',
    portalDriverF3: 'ರೋಗಿಯ ನೇರ ದೂರವಾಣಿ ಮತ್ತು ಸ್ಥಳ',
    portalDriverBtn: 'ಚಾಲಕರ ಕನ್ಸೋಲ್‌ಗೆ ಪ್ರವೇಶಿಸಿ',

    portalAdminTitle: 'ಆಡಳಿತ ಕಮಾಂಡ್ ಸೆಂಟರ್',
    portalAdminDesc: 'ಆಸ್ಪತ್ರೆ ತುರ್ತು ಕಾರ್ಯಾಚರಣೆ ಕೊಠಡಿ: ಆಂಬ್ಯುಲೆನ್ಸ್ ನಿರ್ವಹಣೆ, ರವಾನೆ ಮೇಲ್ವಿಚಾರಣೆ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ.',
    portalAdminF1: 'ಸಮಗ್ರ ತುರ್ತು ಲೆಡ್ಜರ್',
    portalAdminF2: 'ವಾಹನ ಲಭ್ಯತೆ ಮತ್ತು ನಿರ್ವಹಣೆ',
    portalAdminF3: 'ವ್ಯವಸ್ಥೆಯ ಡೇಟಾ ರಿಫ್ರೆಶ್',
    portalAdminBtn: 'ಕಮಾಂಡ್ ಸೆಂಟರ್‌ಗೆ ಪ್ರವೇಶಿಸಿ',

    pipelineTitle: 'ತುರ್ತು ಕಾರ್ಯಾಚರಣೆ ಹಂತಗಳು',
    pipelineSubtitle: 'ತತ್‌ಕ್ಷಣದ ಸ್ವೀಕಾರ ಮತ್ತು ನಿಖರವಾದ ಸ್ಥಿತಿ ನವೀಕರಣಗಳೊಂದಿಗೆ ಅಧಿಕೃತ ತುರ್ತು ಪ್ರತಿಕ್ರಿಯೆ ವ್ಯವಸ್ಥೆ.',
    pipelineDesc: 'ಕಾಲಾನುಕ್ರಮದ ತುರ್ತು ರವಾನೆ ಪ್ರಗತಿ ಮತ್ತು ಲೈವ್ ಟೆಲಿಮೆಟ್ರಿ',
    pipelineStep1Title: 'ರೋಗಿ SOS ಪ್ರಸಾರ',
    pipelineStep1Desc: 'ರೋಗಿಯು ಘಟನಾ ಸ್ಥಳ ಮತ್ತು ವೈದ್ಯಕೀಯ ತೀವ್ರತೆಯನ್ನು ಪ್ರಸಾರ ಮಾಡುತ್ತಾರೆ.',
    pipelineStep2Title: 'ಚಾಲಕರ ಸ್ವೀಕಾರ',
    pipelineStep2Desc: 'ಲಭ್ಯವಿರುವ ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಿಬ್ಬಂದಿ ಕರೆಯನ್ನು ಪರಿಶೀಲಿಸಿ ತಕ್ಷಣ ಸ್ವೀಕರಿಸುತ್ತಾರೆ.',
    pipelineStep3Title: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಪ್ರಯಾಣ',
    pipelineStep3Desc: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸೈರನ್‌ನೊಂದಿಗೆ ರೋಗಿಯ ಸ್ಥಳಕ್ಕೆ ತ್ವರಿತವಾಗಿ ಹೊರಡುತ್ತದೆ.',
    pipelineStep4Title: 'ಆಸ್ಪತ್ರೆಗೆ ದಾಖಲು',
    pipelineStep4Desc: 'ರೋಗಿಯನ್ನು ಟ್ರಾಮಾ ಕೇಂದ್ರಕ್ಕೆ ದಾಖಲಿಸಿ ಆಂಬ್ಯುಲೆನ್ಸ್ ಅನ್ನು ಮತ್ತೆ ಸಿದ್ಧಗೊಳಿಸಲಾಗುತ್ತದೆ.',
    networkBadge1: 'ರಾಜ್ಯ ತುರ್ತು ಸ್ಪಂದನಾ ಜಾಲ',
    networkBadge2: '24/7 ಕೇಂದ್ರೀಕೃತ ರವಾನೆ ಕಾರ್ಯಾಚರಣೆ',
    networkBadge3: 'ಹೆಚ್ಚಿನ ಲಭ್ಯತೆಯ ವೈದ್ಯಕೀಯ ಜಾಲ',

    patientPortalTitle: 'ತುರ್ತು ರೋಗಿ ಪೋರ್ಟಲ್',
    patientPortalBadge: 'ಆದ್ಯತೆಯ ವೈದ್ಯಕೀಯ ಪ್ರವೇಶ',
    patientWelcome: 'ಮರಳಿ ಸ್ವಾಗತ',
    patientLoggedInAs: 'ತುರ್ತು ಸಂಪರ್ಕವಾಗಿ ಲಾಗ್ ಇನ್ ಆಗಿದ್ದೀರಿ',
    patientMedicalId: 'ರೋಗಿ ಐಡಿ',
    patientRegisteredPhone: 'ನೋಂದಾಯಿತ ದೂರವಾಣಿ',
    patientActiveAlertTitle: 'ಸಕ್ರಿಯ ತುರ್ತು ರವಾನೆ ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    patientActiveAlertDesc: 'ದಯವಿಟ್ಟು ದೂರವಾಣಿಯನ್ನು ಲಭ್ಯವಿರಿಸಿ. ತುರ್ತು ತಂಡವು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿದೆ.',
    patientAssignedAmbulance: 'ನಿಯೋಜಿತ ಆಂಬ್ಯುಲೆನ್ಸ್',
    patientDriverContact: 'ಚಾಲಕರ ಸಂಪರ್ಕ',
    patientAmbulanceType: 'ವಾಹನದ ವಿಧ',
    patientBaseLocation: 'ಆರಂಭಿಕ ನಿಲ್ದಾಣ',
    patientCancelSOS: 'ತುರ್ತು ಕರೆ ರದ್ದುಮಾಡಿ',
    patientCancelConfirm: 'ನೀವು ಈ ತುರ್ತು ಕರೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?',
    patientTriggerTitle: 'ತತ್‌ಕ್ಷಣದ ತುರ್ತು SOS ಪ್ರಸಾರ',
    patientTriggerDesc: 'ನಿಮ್ಮ ಸ್ಥಳಕ್ಕೆ ತಕ್ಷಣ ಆಂಬ್ಯುಲೆನ್ಸ್ ಕಳುಹಿಸಲು ಕೆಳಗಿನ SOS ಬಟನ್ ಒತ್ತಿರಿ.',
    patientInstantSOSBtn: 'ಒಂದೇ ಟ್ಯಾಪ್ ತುರ್ತು SOS',
    patientEmergencyDetails: 'ತುರ್ತು ವಿವರಗಳು ಮತ್ತು ಸ್ಥಳ',
    patientSelectEmergencyType: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿಯ ವಿಧ ಆರಿಸಿ',
    patientLocationPlaceholder: 'ನಿಖರವಾದ ವಿಳಾಸ ಅಥವಾ ಲ್ಯಾಂಡ್‌ಮಾರ್ಕ್ ನಮೂದಿಸಿ',
    patientUseCurrentLocation: 'ಸ್ವಯಂ ಜಿಪಿಎಸ್ ಗುರುತಿಸುವಿಕೆ',
    patientPhonePlaceholder: 'ತುರ್ತು ಸಂಪರ್ಕ ದೂರವಾಣಿ ಸಂಖ್ಯೆ',
    patientNotesPlaceholder: 'ರೋಗಿಯ ಸ್ಥಿತಿ, ರೋಗಲಕ್ಷಣಗಳು, ತಿಳಿದಿರುವ ಅಲರ್ಜಿಗಳು...',
    patientDispatchBtn: 'ದೃಢೀಕರಿಸಿ ಮತ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಕಳುಹಿಸಿ',
    patientFirstAidTitle: 'ತುರ್ತು ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ಮಾರ್ಗದರ್ಶಿ',
    patientFirstAidSubtitle: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಬರುವವರೆಗೆ ತಕ್ಷಣದ ಜೀವ ರಕ್ಷಣಾ ಹಂತಗಳು',
    patientHistoryTitle: 'ತುರ್ತು ವಿನಂತಿಗಳ ಇತಿಹಾಸ',
    patientNoHistory: 'ಹಿಂದಿನ ತುರ್ತು ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ.',

    secureMedicalProfile: 'ಸುರಕ್ಷಿತ ತುರ್ತು ವೈದ್ಯಕೀಯ ಪ್ರೊಫೈಲ್',
    secureMedicalProfileDesc: '256-ಬಿಟ್ ಎನ್‌ಕ್ರಿಪ್ಟ್ ಮಾಡಲಾದ ದಾಖಲೆ • SOS ಸಂದರ್ಭದಲ್ಲಿ ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಿಬ್ಬಂದಿಗೆ ತಕ್ಷಣ ಹಂಚಲಾಗುತ್ತದೆ',
    bloodGroup: 'ರಕ್ತದ ಗುಂಪು',
    bloodGroupDesc: 'ತುರ್ತು ರಕ್ತ ವರ್ಗಾವಣೆಗೆ ಅತ್ಯಗತ್ಯ',
    allergies: 'ಅಲರ್ಜಿಗಳು ಮತ್ತು ಔಷಧ ನಿರ್ಬಂಧಗಳು',
    chronicConditions: 'ದೀರ್ಘಕಾಲದ ಕಾಯಿಲೆಗಳು / ಅಳವಡಿಕೆಗಳು',
    emergencyContact: 'ತುರ್ತು ಸಂಪರ್ಕ ವ್ಯಕ್ತಿ & ಆಪ್ತರು',
    inputEditMedicalInfo: 'ಮಾಹಿತಿ ನಮೂದಿಸಿ / ಬದಲಾಯಿಸಿ',
    saveMedicalProfile: 'ತುರ್ತು ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ',
    transmittedOnSos: 'SOS ನಲ್ಲಿ ರವಾನಿಸಲಾಗುವ ವೈದ್ಯಕೀಯ ಮಾಹಿತಿ',
    icePass: 'ತುರ್ತು ICE ಪಾಸ್',
    iceQrCode: 'ಪ್ರಥಮ ಚಿಕಿತ್ಸಕರ ಕ್ಯೂಆರ್ ಪಾಸ್',
    noKnownAllergies: 'ಯಾವುದೇ ಅಲರ್ಜಿಗಳಿಲ್ಲ',
    noRecordedConditions: 'ಯಾವುದೇ ದೀರ್ಘಕಾಲದ ಕಾಯಿಲೆಗಳಿಲ್ಲ',
    notSet: 'ನಮೂದಿಸಿಲ್ಲ',
    emergencyContactName: 'ಸಂಪರ್ಕ ವ್ಯಕ್ತಿಯ ಹೆಸರು',
    emergencyContactPhone: 'ಸಂಪರ್ಕ ದೂರವಾಣಿ ಸಂಖ್ಯೆ',
    emergencyContactRelation: 'ಸಂಬಂಧ',

    driverPortalTitle: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಿಬ್ಬಂದಿ ಕಾಕ್‌ಪಿಟ್',
    driverPortalBadge: 'ತುರ್ತು ಚಾಲಕರ ಟರ್ಮಿನಲ್',
    driverBadge: 'ತುರ್ತು ಸಿಬ್ಬಂದಿ',
    driverAssignedUnit: 'ನಿಯೋಜಿತ ವಾಹನ',
    driverAvailabilityStatus: 'ವಾಹನ ಲಭ್ಯತೆ ಸ್ಥಿತಿ',
    driverSetAvailable: 'ಸಿದ್ಧವಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ',
    driverSetMaintenance: 'ನಿರ್ವಹಣೆಯಲ್ಲಿದೆ ಎಂದು ಗುರುತಿಸಿ',
    driverSwitchVehicle: 'ನಿಯೋಜಿತ ವಾಹನ ಬದಲಾಯಿಸಿ:',
    driverIncomingTitle: 'ಒಳಬರುವ ತುರ್ತು ಕರೆಗಳು',
    driverIncomingSubtitle: 'ಹತ್ತಿರದ ಚಾಲಕರ ಸ್ವೀಕಾರಕ್ಕಾಗಿ ಕಾಯುತ್ತಿರುವ ಕರೆಗಳು',
    driverIncomingAlerts: 'ಒಳಬರುವ ತುರ್ತು ಎಚ್ಚರಿಕೆಗಳು',
    driverIncomingDesc: 'ನಿಮ್ಮ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಪ್ರಸಾರವಾದ ತುರ್ತು SOS ಕರೆಗಳು',
    driverNoIncoming: 'ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ತುರ್ತು ಕರೆಗಳಿಲ್ಲ. ವಾಹನ ಸನ್ನದ್ಧವಾಗಿದೆ.',
    driverAcceptBtn: 'ತುರ್ತು ಕರೆ ಸ್ವೀಕರಿಸಿ ಹೊರಡಿ',
    driverAcceptRequest: 'ತುರ್ತು ಕರೆ ಸ್ವೀಕರಿಸಿ',
    driverAcceptSuccess: 'ತುರ್ತು ಕರೆ ಸ್ವೀಕರಿಸಲಾಗಿದೆ! ಸ್ಥಳಕ್ಕೆ ಹೊರಡಲಾಗಿದೆ.',
    driverActiveMissionTitle: 'ಸಕ್ರಿಯ ತುರ್ತು ಮಿಷನ್',
    driverActiveMissionBadge: 'ಆದ್ಯತೆಯ ಸೈರನ್ ಚಾಲನೆಯಲ್ಲಿದೆ',
    driverPatientDetails: 'ರೋಗಿಯ ಮಾಹಿತಿ',
    driverIncidentLocation: 'ಘಟನಾ ಸ್ಥಳ',
    driverEmergencyNature: 'ತುರ್ತು ಪರಿಸ್ಥಿತಿಯ ವಿಧ',
    driverCallPatient: 'ರೋಗಿಗೆ ಕರೆ ಮಾಡಿ',
    driverActionStartJourney: 'ಪ್ರಯಾಣ ಆರಂಭಿಸಿ (ಮಾರ್ಗದಲ್ಲಿದೆ)',
    driverStartJourney: 'ಪ್ರಯಾಣ ಆರಂಭಿಸಿ',
    driverActionArrived: 'ಸ್ಥಳ ತಲುಪಿದೆ ಎಂದು ಗುರುತಿಸಿ',
    driverMarkReached: 'ಸ್ಥಳ ತಲುಪಿದೆ',
    driverActionComplete: 'ಆಸ್ಪತ್ರೆ ಹಸ್ತಾಂತರ ಪೂರ್ಣಗೊಳಿಸಿ',
    driverCompleteTrip: 'ಮಿಷನ್ ಪೂರ್ಣಗೊಳಿಸಿ',
    driverReadyStandby: 'ವಾಹನ ಮುಕ್ತವಾಗಿದೆ ಮತ್ತು ಮುಂದಿನ ಕರೆಗೆ ಸಿದ್ಧವಾಗಿದೆ',
    driverStandby: 'ಸಿದ್ಧವಾಗಿದೆ',
    driverStandbyDesc: 'ವಾಹನ ಸಕ್ರಿಯವಾಗಿದೆ ಮತ್ತು ಮುಂದಿನ ಕರೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ',
    driverVehicleSpecs: 'ವಾಹನದ ಉಪಕರಣಗಳು ಮತ್ತು ಸಿಬ್ಬಂದಿ',
    driverMissionHistory: 'ಪೂರ್ಣಗೊಂಡ ಮಿಷನ್ ಇತಿಹಾಸ',
    driverCompletedMissions: 'ಪೂರ್ಣಗೊಂಡ ತುರ್ತು ರವಾನೆಗಳು',

    adminPortalTitle: 'ಆಸ್ಪತ್ರೆ ರವಾನೆ ನಿಯಂತ್ರಣ ಕೇಂದ್ರ',
    adminPortalBadge: 'ಆಡಳಿತ ಕಮಾಂಡ್',
    adminConsoleBadge: 'ಆಡಳಿತ ಕನ್ಸೋಲ್',
    adminSubtitle: 'ಲೈವ್ ಫ್ಲೀಟ್ ಟ್ರ್ಯಾಕಿಂಗ್, ಕೇಂದ್ರೀಯ ರವಾನೆ ಕ್ಯೂ ಮತ್ತು ಕಾರ್ಯಾಚರಣೆ ಲಾಗ್‌ಗಳು',
    adminResetData: 'ಡೀಫಾಲ್ಟ್ ಫ್ಲೀಟ್ ಮರುಸ್ಥಾಪಿಸಿ',
    adminResetSystem: 'ಡೇಟಾ ಮರುಹೊಂದಿಸಿ',
    adminAddAmbulance: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸೇರಿಸಿ',
    adminTotalCalls: 'ಒಟ್ಟು ತುರ್ತು ಕರೆಗಳು',
    adminActiveCallsDesc: 'ಪ್ರಸ್ತುತ ಮಾರ್ಗದಲ್ಲಿ / ಸ್ಥಳದಲ್ಲಿ',
    adminReadyFleetDesc: 'ತತ್‌ಕ್ಷಣದ ಕರೆಗೆ ಸಿದ್ಧವಾಗಿದೆ',
    adminMetricTotalCalls: 'ಒಟ್ಟು ತುರ್ತು ಕರೆಗಳು',
    adminMetricActive: 'ಸಕ್ರಿಯ ಕರೆಗಳು',
    adminMetricAvailable: 'ಸಿದ್ಧ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಳು',
    adminMetricAvgTime: 'ಸರಾಸರಿ ಪ್ರತಿಕ್ರಿಯೆ',
    adminFleetTitle: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಫ್ಲೀಟ್ ಮತ್ತು ಸಿಬ್ಬಂದಿ ನಿರ್ವಹಣೆ',
    adminFleetSubtitle: 'ನೈಜ-ಸಮಯದ ಸನ್ನದ್ಧತೆ, ವಾಹನ ಟೆಲಿಮೆಟ್ರಿ ಮತ್ತು ಸಿಬ್ಬಂದಿ ಸ್ಥಿತಿ',
    adminFleetDesc: 'ನೈಜ-ಸಮಯದ ಸ್ಥಿತಿ, ವಾಹನ ಸನ್ನದ್ಧತೆ ಮತ್ತು ಚಾಲಕರ ಮಾಹಿತಿ',
    adminLedgerTitle: 'ತುರ್ತು ರವಾನೆಗಳ ಮುಖ್ಯ ಲೆಡ್ಜರ್',
    adminLedgerSubtitle: 'ಎಲ್ಲಾ ತುರ್ತು ಕರೆಗಳ ಕಾಲಾನುಕ್ರಮದ ಅಧಿಕೃತ ದಾಖಲೆಗಳು',
    adminMasterLedgerTitle: 'ತುರ್ತು ರವಾನೆಗಳ ಮಾಸ್ಟರ್ ಲೆಡ್ಜರ್',
    adminMasterLedgerDesc: 'ಎಲ್ಲಾ ನೋಂದಾಯಿತ ಕರೆಗಳು ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆ ಪ್ರಗತಿ',
    adminFilterAll: 'ಎಲ್ಲಾ ದಾಖಲೆಗಳು',
    adminFilterActive: 'ಸಕ್ರಿಯ ಕರೆಗಳು',
    adminFilterCompleted: 'ಪೂರ್ಣಗೊಂಡಿದೆ',
    adminFilterCancelled: 'ರದ್ದುಗೊಂಡಿದೆ',
    adminUsersTitle: 'ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಮತ್ತು ಬಳಕೆದಾರರ ಡೈರೆಕ್ಟರಿ',
    adminUsersSubtitle: 'ದೃಢೀಕೃತ ವೈದ್ಯಕೀಯ ಅಧಿಕಾರಿಗಳು, ಪ್ಯಾರಾಮೆಡಿಕ್ಸ್ ಮತ್ತು ನೋಂದಾಯಿತ ರೋಗಿಗಳು',
    adminUsersDesc: 'ಅಧಿಕೃತ ಸಿಬ್ಬಂದಿ ಖಾತೆಗಳು ಮತ್ತು ನೋಂದಾಯಿತ ಚಾಲಕರು',

    authSignInTitle: 'ಆರೋಗ್ಯವಾಹಿನಿಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ',
    authRegisterTitle: 'ತುರ್ತು ಖಾತೆ ರಚಿಸಿ',
    authSubtitle: 'ತ್ವರಿತ ತುರ್ತು ರವಾನೆ ಮತ್ತು ವೈದ್ಯಕೀಯ ಪ್ರೊಫೈಲ್‌ಗೆ ಪ್ರವೇಶ ಪಡೆಯಿರಿ.',
    authQuickDemo: 'ತ್ವರಿತ ಪಾತ್ರ ಪ್ರವೇಶ:',
    authFullName: 'ಪೂರ್ಣ ಹೆಸರು',
    authEmail: 'ಇಮೇಲ್ ವಿಳಾಸ',
    authPassword: 'ಪಾಸ್‌ವರ್ಡ್',
    authSelectRole: 'ಪಾತ್ರ ಆಯ್ಕೆಮಾಡಿ',
    authSignInBtn: 'ಪೋರ್ಟಲ್‌ಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ',
    authRegisterBtn: 'ಖಾತೆ ರಚಿಸಿ & ಪ್ರವೇಶಿಸಿ',
    authNoAccount: 'ಖಾತೆ ಇಲ್ಲವೇ?',
    authHaveAccount: 'ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ?',
    authCreateOne: 'ಹೊಸ ಪ್ರೊಫೈಲ್ ನೋಂದಾಯಿಸಿ',

    footerNetwork: 'ಆರೋಗ್ಯವಾಹಿನಿ ತುರ್ತು ವೈದ್ಯಕೀಯ ಸ್ಪಂದನಾ ಜಾಲ',
    footerDesc: 'ತ್ವರಿತ ಪ್ಯಾರಾಮೆಡಿಕ್ ಚಲನಶೀಲತೆ, ಆಸ್ಪತ್ರೆ ಟ್ರಾಮಾ ವಾರ್ಡ್ ಮಾರ್ಗ ಮತ್ತು ಲೈವ್ ರೋಗಿ ಟ್ರ್ಯಾಕಿಂಗ್ ಒದಗಿಸುವ ರಾಜ್ಯ ತುರ್ತು ರವಾನೆ ವೇದಿಕೆ.',
    footerTollFree: 'ಟೋಲ್-ಫ್ರೀ ತುರ್ತು ಸಹಾಯವಾಣಿ: 108 / 112',
    footerEmergencyHotline: 'ತುರ್ತು ಸಹಾಯವಾಣಿ: 108 / 112',
    footerRights: 'ಎಲ್ಲಾ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ. ಸರ್ಕಾರಿ ಆರೋಗ್ಯ ತುರ್ತು ಮೂಲಸೌಕರ್ಯ.',
    footerCertified: 'ಪ್ರಮಾಣೀಕೃತ ತುರ್ತು ವೈದ್ಯಕೀಯ ಸೇವಾ ಜಾಲ',

    notificationsTitle: 'ಅಧಿಸೂಚನೆಗಳು',
    notificationsEmpty: 'ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ',
    notificationsEmptyDesc: 'ತುರ್ತು ರವಾನೆಗಳು, ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಸಿಸ್ಟಮ್ ನವೀಕರಣಗಳು ಇಲ್ಲಿ ನೈಜ ಸಮಯದಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ.',
    notificationsMarkAllRead: 'ಎಲ್ಲವನ್ನೂ ಓದಿದೆ ಎಂದು ಗುರುತಿಸಿ',
    notificationsClearAll: 'ಎಲ್ಲವನ್ನೂ ತೆರವುಗೊಳಿಸಿ',
    notificationsViewAll: 'ಎಲ್ಲಾ ಅಧಿಸೂಚನೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
    notificationsClose: 'ಮುಚ್ಚಿ',
    notificationsUnreadBadge: 'ಓದಿಲ್ಲ',
    notificationNew: 'ಹೊಸದು',
    notificationTimeJustNow: 'ಈಗಷ್ಟೇ',
    notificationViewEmergency: 'ತುರ್ತು ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ',

    voiceSymptomsBtn: 'ಧ್ವನಿಯ ಮೂಲಕ ರೋಗಲಕ್ಷಣಗಳನ್ನು ವಿವರಿಸಿ',
    voiceRecordingTitle: 'ತುರ್ತು ಧ್ವನಿಯಿಂದ ಪಠ್ಯ ರೋಗಲಕ್ಷಣ ರೆಕಾರ್ಡರ್',
    voiceRecordingSubtitle: 'ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಧ್ವನಿಯಲ್ಲಿ ರೆಕಾರ್ಡ್ ಮಾಡಿ. ರವಾನೆದಾರರಿಗೆ ಸ್ಪಷ್ಟ ವೈದ್ಯಕೀಯ ಮಾಹಿತಿ ತಲುಪುತ್ತದೆ.',
    voiceStartRecording: 'ಧ್ವನಿ ರೆಕಾರ್ಡಿಂಗ್ ಪ್ರಾರಂಭಿಸಿ',
    voiceStopRecording: 'ರೆಕಾರ್ಡಿಂಗ್ ನಿಲ್ಲಿಸಿ',
    voiceListening: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇವೆ... ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ',
    voiceSpeakNow: 'ಈಗ ಮೈಕ್ರೊಫೋನ್‌ನಲ್ಲಿ ಮಾತನಾಡಿ',
    voiceTranscribedLabel: 'ಧ್ವನಿ ಲಿಪ್ಯಂತರ ರೋಗಲಕ್ಷಣಗಳು:',
    voiceQuickSymptoms: 'ತ್ವರಿತ ತುರ್ತು ರೋಗಲಕ್ಷಣಗಳು:',
    voiceApplySymptoms: 'ತುರ್ತು SOS ಗಾಗಿ ಬಳಸಿ',
    voiceClear: 'ತೆರವುಗೊಳಿಸಿ',
    voiceSummarizeAi: 'ವೈದ್ಯಕೀಯ ಸಾರಾಂಶ (AI ವಿಶ್ಲೇಷಣೆ)',
    voiceMicPermissionError: 'ಮೈಕ್ರೊಫೋನ್ ಅನುಮತಿಯನ್ನು ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಅನುಮತಿ ನೀಡಿ.',
    voiceNotSupported: 'ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಭಾಷಣ ಗುರುತಿಸುವಿಕೆ ಬೆಂಬಲಿಸುವುದಿಲ್ಲ. ನೀವು ಕೆಳಗಿನ ಟ್ಯಾಗ್‌ಗಳನ್ನು ಬಳಸಬಹುದು.',
    voiceUrgencyLevel: 'ತುರ್ತು ಮಟ್ಟ:',
    voiceRecommendedType: 'ಶಿಫಾರಸು ಮಾಡಿದ ಆಂಬ್ಯುಲೆನ್ಸ್:',
    voiceContextAttached: 'ಧ್ವನಿ ರೋಗಲಕ್ಷಣ ಮಾಹಿತಿ ಲಗತ್ತಿಸಲಾಗಿದೆ',
    voiceUpdateDispatcher: 'ಧ್ವನಿಯ ಮೂಲಕ ರವಾನೆದಾರರಿಗೆ ಅಪ್‌ಡೇಟ್ ಮಾಡಿ',

    firstAidHeader: 'ತುರ್ತು ಪ್ರಥಮ ಚಿಕಿತ್ಸಾ ಮಾರ್ಗದರ್ಶಿ',
    firstAidSub: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಬರುವವರೆಗೆ ತಕ್ಷಣದ ಜೀವ ರಕ್ಷಣಾ ಹಂತಗಳು',
    cprAdult: 'ವಯಸ್ಕರ ಸಿಪಿಆರ್ (CPR)',
    cprChild: 'ಮಕ್ಕಳ & ಶಿಶುಗಳ ಸಿಪಿಆರ್',
    choking: 'ಉಸಿರುಗಟ್ಟುವಿಕೆ (ಹೈಮ್ಲಿಕ್)',
    severeBleeding: 'ತೀವ್ರ ರಕ್ತಸ್ರಾವ ನಿಯಂತ್ರಣ',
    burnsScalds: 'ಸುಟ್ಟ ಗಾಯಗಳು',
    strokeFast: 'ಪಾರ್ಶ್ವವಾಯು (F.A.S.T.)',
    heartAttack: 'ಹೃದಯಾಘಾತ ಮುನ್ನೆಚ್ಚರಿಕೆ',
    step: 'ಹಂತ',
    alwaysCall108: 'ಮೊದಲು 108 ಕರೆ ಮಾಡಿ. ಆಂಬ್ಯುಲೆನ್ಸ್ ಬರುವವರೆಗೆ ಈ ಕ್ರಮಗಳು ನೆರವಾಗುತ್ತವೆ.',

    proximityAlertTitle: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಮೀಪಿಸುತ್ತಿದೆ (೨ ಕಿ.ಮೀ ಒಳಗಿದೆ)',
    proximityAlertDesc: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ನಿಮ್ಮ ಸ್ಥಳದ ಸಮೀಪದಲ್ಲಿದೆ. ದಯವಿಟ್ಟು ಫೋನ್ ಗಮನಿಸಿ ಮತ್ತು ಪ್ರವೇಶದ್ವಾರವನ್ನು ಸಿದ್ಧವಾಗಿರಿಸಿ.',
    playVoiceAnnouncement: 'ಧ್ವನಿ ಎಚ್ಚರಿಕೆ ಪ್ಲೇ ಮಾಡಿ',
    dismiss: 'ವಜಾಗೊಳಿಸಿ',

    ambulanceArrivingIn: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸುಮಾರು {minutes} ನಿಮಿಷಗಳಲ್ಲಿ ತಲುಪಲಿದೆ',
    ambulanceDispatched: 'ಆಂಬ್ಯುಲೆನ್ಸ್ #{id} ರವಾನಿಸಲಾಗಿದೆ',
    hospitalAssigned: 'ನಿಯೋಜಿಸಲಾದ ಆಸ್ಪತ್ರೆ: {hospital}',
    searchingFleet: 'ಹತ್ತಿರದ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಳನ್ನು ಹುಡುಕಲಾಗುತ್ತಿದೆ...',
    activeSos: 'ಸಕ್ರಿಯ SOS',
    driverAssigned: 'ಚಾಲಕ {driver} ನಿಯೋಜಿಸಲಾಗಿದೆ',
    patientConnected: 'ರೋಗಿಯ ಸಂಪರ್ಕದಲ್ಲಿದೆ',
    eta: 'ಅಂದಾಜು ಸಮಯ',
    mins: 'ನಿಮಿಷ',
    km: 'ಕಿ.ಮೀ',

    emergency: 'ತುರ್ತು',
    missionCompleted: 'ಮಿಷನ್ ಪೂರ್ಣಗೊಂಡಿದೆ',
    liveSos: 'ಸಕ್ರಿಯ SOS',
    ambulanceAssigned: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ನಿಯೋಜಿಸಲಾಗಿದೆ',
    enRouteToYou: 'ನಿಮ್ಮ ಕಡೆಗೆ ಬರುತ್ತಿದೆ',
    arrivedAtScene: 'ಸ್ಥಳಕ್ಕೆ ತಲುಪಿದೆ',
    handoverCompleted: 'ಆಸ್ಪತ್ರೆ ಹಸ್ತಾಂತರ ಪೂರ್ಣಗೊಂಡಿದೆ',
    voiceUpdate: 'ಧ್ವನಿ ಅಪ್‌ಡೇಟ್',
    closeNewSos: 'ಮುಕ್ತಾಯ / ಹೊಸ SOS',
    emergencyMissionFinalized: 'ತುರ್ತು ಮಿಷನ್ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ ಮತ್ತು ರೋಗಿಯನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ',
    emergencyMissionFinalizedDesc: 'ನಿಮ್ಮ ದಾಖಲೆಗಾಗಿ ಸಮಗ್ರ ಕ್ಲಿನಿಕಲ್ ಮತ್ತು ಕಾರ್ಯಾಚರಣೆಯ ತುರ್ತು ವರದಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಲಾಗಿದೆ.',
    downloadReport: 'ವರದಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    estimatedEta: 'ತಲುಪುವ ಅಂದಾಜು ಸಮಯ (ಲೈವ್ ಇಟಿಎ)',
    within2kmAlertZone: '೨ ಕಿ.ಮೀ ಎಚ್ಚರಿಕೆ ವಲಯದಲ್ಲಿದೆ',
    liveTraffic: 'ಲೈವ್ ಸಂಚಾರ',
    lowCongestion: 'ಕಡಿಮೆ ಸಂಚಾರ ದಟ್ಟಣೆ',
    greenCorridorActive: 'ಗ್ರೀನ್ ಕಾರಿಡಾರ್ ಸಕ್ರಿಯ',
    iceHealthPass: 'ICE ಹೆಲ್ತ್ ಪಾಸ್',
    alertBroadcastInProgress: 'ಎಚ್ಚರಿಕೆ ಸಂದೇಶ ಪ್ರಸಾರವಾಗುತ್ತಿದೆ:',
    alertBroadcastDesc: 'ನಿಮ್ಮ ತುರ್ತು ಕರೆಯನ್ನು ಹತ್ತಿರದ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಳಿಗೆ ರವಾನಿಸಲಾಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಈ ಪರದೆಯಲ್ಲೇ ಇರಿ.',
    callParamedic: 'ಪ್ಯಾರಾಮೆಡಿಕ್‌ಗೆ ಕರೆ ಮಾಡಿ',
    broadcastingFleetAlert: 'ಹತ್ತಿರದ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಳಿಗೆ ಎಚ್ಚರಿಕೆ ರವಾನಿಸಲಾಗುತ್ತಿದೆ',
    clinicalProfileTransmitted: 'ತುರ್ತು ವೈದ್ಯಕೀಯ ವಿವರಗಳನ್ನು 108 ರವಾನೆದಾರರಿಗೆ ಮತ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ',
    transmitted: 'ರವಾನಿಸಲಾಗಿದೆ',
    primaryEmergencyContact: 'ಮುಖ್ಯ ತುರ್ತು ಸಂಪರ್ಕ ವ್ಯಕ್ತಿ',
    existingConditionsDirectives: 'ಹಾಲಿ ಆರೋಗ್ಯ ಸ್ಥಿತಿ ಮತ್ತು ತುರ್ತು ಸೂಚನೆಗಳು:',
    directPriorityCorridor: 'ನೇರ ಆದ್ಯತೆಯ ಕಾರಿಡಾರ್',
    gpsAutoPinned: 'ಜಿಪಿಎಸ್ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಗುರುತಿಸಲಾಗಿದೆ:',
    instant1TapSos: 'ಏಕ-ಸ್ಪರ್ಶ ತುರ್ತು SOS',
    autoPinningGps: 'ಬ್ರೌಸರ್ ಮೂಲಕ ನಿಮ್ಮ ಜಿಪಿಎಸ್ ಸ್ಥಳವನ್ನು ಗುರುತಿಸಲಾಗುತ್ತಿದೆ...',
    locationDenied: 'ಸ್ಥಳ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.',
    enterAddressManually: 'ವಿಳಾಸ ಅಥವಾ ಹೆಗ್ಗುರುತನ್ನು ನಮೂದಿಸಿ',
    gpsCalibrate: 'ಜಿಪಿಎಸ್ ಸರಿಹೊಂದಿಸಿ',
    centerOnMe: 'ನನ್ನ ಸ್ಥಳಕ್ಕೆ ಕೇಂದ್ರೀಕರಿಸಿ',
    medicalIdOnSos: 'SOS ನೊಂದಿಗೆ ರವಾನಿಸಲಾದ ವೈದ್ಯಕೀಯ ವಿವರ:',
    updateProfile: 'ಪ್ರೊಫೈಲ್ ನವೀಕರಿಸಿ',
    pastEmergencies: 'ಹಿಂದಿನ ತುರ್ತು ಕರೆಗಳು ಮತ್ತು ದಾಖಲೆಗಳು',
    noPastEmergencies: 'ಈ ಪ್ರೊಫೈಲ್‌ನಲ್ಲಿ ಯಾವುದೇ ಹಿಂದಿನ ತುರ್ತು ಕರೆಗಳಿಲ್ಲ.',
    radarMarkersLegend: 'ರಾಡಾರ್ ಗುರುತುಗಳ ವಿವರಣೆ',
    wardAvailable: 'ವಾರ್ಡ್ ಲಭ್ಯವಿದೆ',
    wardFullDiversion: 'ವಾರ್ಡ್ ಭರ್ತಿಯಾಗಿದೆ (ಡೈವರ್ಶನ್)',
    ambulanceFleet: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಪಡೆ',
    yourIncidentGps: 'ನಿಮ್ಮ ತುರ್ತು ಸ್ಥಳ',
    yourDetectedPin: 'ಗುರುತಿಸಲಾದ ನಿಮ್ಮ ಜಿಪಿಎಸ್ ಸ್ಥಳ',
    detectingGps: 'ಜಿಪಿಎಸ್ ಪತ್ತೆಹಚ್ಚಲಾಗುತ್ತಿದೆ...',
    nearestAmbulance: 'ಹತ್ತಿರದ ಸ್ಟ್ಯಾಂಡ್‌ಬೈ ಆಂಬ್ಯುಲೆನ್ಸ್',
    transfusionReady: 'ರಕ್ತ ವರ್ಗಾವಣೆಗೆ ಸಿದ್ಧ',
    alerts108Paramedics: '108 ಪ್ಯಾರಾಮೆಡಿಕ್‌ಗಳಿಗೆ ಎಚ್ಚರಿಕೆ ನೀಡುತ್ತದೆ',
    changesSyncSos: 'ಬದಲಾವಣೆಗಳು ತಕ್ಷಣವೇ ನಿಮ್ಮ ಖಾತೆ ಮತ್ತು SOS ರವಾನೆಯೊಂದಿಗೆ ಸಿಂಕ್ ಆಗುತ್ತವೆ',
    editCriticalInfo: 'ಪ್ರಮುಖ ತುರ್ತು ಮಾಹಿತಿಯನ್ನು ಸಂಪಾದಿಸಿ',
    clickChipToToggle: 'ಆಯ್ಕೆ ಮಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
    saveAndProtect: 'ಉಳಿಸಿ ಮತ್ತು ರಕ್ಷಿಸಿ',
    savingProfile: 'ಪ್ರೊಫೈಲ್ ಉಳಿಸಲಾಗುತ್ತಿದೆ...',
    goodMorning: 'ಶುಭೋದಯ',
    goodAfternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
    goodEvening: 'ಶುಭ ಸಂಜೆ',
    ambulanceCrewCockpit: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಿಬ್ಬಂದಿ ಕಾಕ್‌ಪಿಟ್',
    onEmergency: 'ತುರ್ತು ಕಾರ್ಯದಲ್ಲಿದೆ',
    activeEmergencyInProgress: '🚨 ಸಕ್ರಿಯ ತುರ್ತು ಮಿಷನ್ ಚಾಲನೆಯಲ್ಲಿದೆ',
    patient: 'ರೋಗಿ',
    destination: 'ತಲುಪಬೇಕಾದ ಸ್ಥಳ',
    openLiveNav: 'ಲೈವ್ ನ್ಯಾವಿಗೇಷನ್ HUD ತೆರೆಯಿರಿ',
    incomingCalls: 'ಒಳಬರುವ ತುರ್ತು ಕರೆಗಳು',
    criticalTriageAlerts: 'ತೀವ್ರ ತುರ್ತು ಎಚ್ಚರಿಕೆಗಳು',
    noIncomingCalls: 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ಒಳಬರುವ ತುರ್ತು ಕರೆಗಳಿಲ್ಲ',
    acceptEmergency: 'ತುರ್ತು ಕರೆ ಸ್ವೀಕರಿಸಿ',
    decline: 'ತಿರಸ್ಕರಿಸಿ',
    priorityCritical: 'ಅತ್ಯಂತ ತುರ್ತು (CRITICAL)',
    priorityHigh: 'ಹೆಚ್ಚಿನ ಆದ್ಯತೆ (HIGH)',
    priorityNormal: 'ಸಾಮಾನ್ಯ (NORMAL)',
    turnByTurnNav: 'ಹಂತ-ಹಂತದ ಜಿಪಿಎಸ್ ನ್ಯಾವಿಗೇಷನ್',
    distanceToPatient: 'ರೋಗಿಗೆ ಇರುವ ದೂರ',
    distanceToHospital: 'ಆಸ್ಪತ್ರೆಗೆ ಇರುವ ದೂರ',
    erPreNotification: 'ಆಸ್ಪತ್ರೆಗೆ ಮುನ್ಸೂಚನೆ ಕಳುಹಿಸಲಾಗಿದೆ',
    markAtScene: 'ಸ್ಥಳಕ್ಕೆ ತಲುಪಿದೆ ಎಂದು ಗುರುತಿಸಿ',
    startTransitToHospital: 'ಆಸ್ಪತ್ರೆಗೆ ಪ್ರಯಾಣ ಪ್ರಾರಂಭಿಸಿ',
    completeHandover: 'ಆಸ್ಪತ್ರೆ ಹಸ್ತಾಂತರ ಪೂರ್ಣಗೊಳಿಸಿ',
    enterVitals: 'ಮಾರ್ಗಮಧ್ಯದ ಜೀವಾಧಾರಕ ಅಂಕಿಅಂಶಗಳನ್ನು ನಮೂದಿಸಿ (e-PCR)',
    inTransitTelemetry: 'ಮಾರ್ಗಮಧ್ಯದ ರೋಗಿ ಟೆಲಿಮೆಟ್ರಿ',
    heartRate: 'ಹೃದಯ ಬಡಿತ (BPM)',
    bloodPressure: 'ರಕ್ತದೊತ್ತಡ (BP)',
    oxygenSaturation: 'ಆಮ್ಲಜನಕ ಮಟ್ಟ (SpO2)',
    respiratoryRate: 'ಉಸಿರಾಟದ ದರ',
    glasgowComaScale: 'ಗ್ಲ್ಯಾಸ್ಗೋ ಕೋಮಾ ಸ್ಕೇಲ್ (GCS)',
    transmitVitals: 'ಆಸ್ಪತ್ರೆ ತುರ್ತು ವಿಭಾಗಕ್ಕೆ ರವಾನಿಸಿ',
    transmitting: 'ರವಾನಿಸಲಾಗುತ್ತಿದೆ...',
    offlineNotice: 'ಆಫ್‌ಲೈನ್ ಸೂಚನೆ:',
    offlineNoticeDesc: 'ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಕಡಿತಗೊಂಡಿದೆ. ಸಂಪರ್ಕ ಮರುಸ್ಥಾಪನೆಯಾಗುವವರೆಗೆ ತುರ್ತು SOS ಮತ್ತು ಲೈವ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಸ್ಥಗಿತಗೊಂಡಿರುತ್ತದೆ.',
    onlineNotice: 'ಆನ್‌ಲೈನ್:',
    onlineNoticeDesc: 'ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಮರುಸ್ಥಾಪನೆಯಾಗಿದೆ. ನೈಜ-ಸಮಯದ ತುರ್ತು ಸಿಂಕ್ ಸಕ್ರಿಯವಾಗಿದೆ.',
    emergencyReportTitle: 'ಅಧಿಕೃತ ತುರ್ತು ಘಟನೆ ಮತ್ತು ರವಾನೆ ವರದಿ' ,
    printReport: 'ವರದಿ ಮುದ್ರಿಸಿ',
    erTraumaMonitorTitle: 'ಆಸ್ಪತ್ರೆ ತುರ್ತು ವಿಭಾಗ ಮತ್ತು ಟ್ರಾಮಾ ಟ್ರಯಾಜ್ ಮಾನಿಟರ್',
    prepTraumaBay: 'ಟ್ರಾಮಾ ಬೆಡ್ ಸಿದ್ಧಪಡಿಸಿ',
    bayPrepared: 'ಟ್ರಾಮಾ ಬೆಡ್ ಸಿದ್ಧವಾಗಿದೆ',
    trafficSignalPriorityTitle: 'ತುರ್ತು ಗ್ರೀನ್ ಕಾರಿಡಾರ್ ಟ್ರಾಫಿಕ್ ಸಮನ್ವಯ',
    signalNormal: 'ಸಾಮಾನ್ಯ ಟ್ರಾಫಿಕ್ ಸಿಗ್ನಲ್ ಚಕ್ರ',
    signalPriorityRouteA: 'ಗ್ರೀನ್ ಕಾರಿಡಾರ್ ಸಕ್ರಿಯ (ಮಾರ್ಗ A)',
    signalPriorityRouteB: 'ಗ್ರೀನ್ ಕಾರಿಡಾರ್ ಸಕ್ರಿಯ (ಮಾರ್ಗ B)',
    icePassTitle: 'ತುರ್ತು ಆರೋಗ್ಯ ಪಾಸ್ (ICE)',
    copyLink: 'ಪ್ರೊಫೈಲ್ ಲಿಂಕ್ ನಕಲಿಸಿ',
    printIcePass: 'ICE ಕಾರ್ಡ್ ಮುದ್ರಿಸಿ',
    verifiedDispatch: '24/7 ಪ್ರಮಾಣೀಕೃತ ವೈದ್ಯಕೀಯ ರವಾನೆ',
    fleetRadarTitle: 'ಲೈವ್ ತುರ್ತು ಆಂಬ್ಯುಲೆನ್ಸ್ ಪಡೆ ಮತ್ತು ಜಿಪಿಎಸ್ ರಾಡಾರ್',
    fleetRadarSubtitle: 'ನಿಮ್ಮ ಸ್ಥಳ ಮತ್ತು ಹತ್ತಿರದ ಸ್ಟ್ಯಾಂಡ್‌ಬೈ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗಳ ನೈಜ-ಸಮಯದ ನಕ್ಷೆ',
    hospitalWardCapacity: 'ಆಸ್ಪತ್ರೆ ಹಾಸಿಗೆ ಸಾಮರ್ಥ್ಯ',
    hospitalERTrauma: 'ತುರ್ತು ಟ್ರಾಮಾ ವಾರ್ಡ್',
    vehicleTelemetry: 'ವಾಹನ ಟೆಲಿಮೆಟ್ರಿ',
    fuelLevel: 'ಇಂಧನ ಮಟ್ಟ',
    oxygenLevel: 'ಆಮ್ಲಜನಕ ಸಿಲಿಂಡರ್ ಮಟ್ಟ',
    batteryStatus: 'ಬ್ಯಾಟರಿ ಸ್ಥಿತಿ',
    defibrillatorReady: 'ಡಿಫಿಬ್ರಿಲೇಟರ್ ಸಿದ್ಧತೆ',
    maintenanceStatus: 'ನಿರ್ವಹಣಾ ಸ್ಥಿತಿ',
    shiftHours: 'ಪಾಳಿಯ ಸಮಯ',
    driverLicense: 'ಚಾಲನಾ ಪರವಾನಗಿ ಸಂಖ್ಯೆ',
    testSiren: 'ಸೈರನ್ ಪರೀಕ್ಷಿಸಿ',
  },

  hi: {
    appTitle: 'आरोग्यवाहिनी',
    appSubtitle: 'आपातकालीन चिकित्सा प्रतिक्रिया और एम्बुलेंस प्रेषण प्रणाली',
    appSubtitlePatient: 'आपातकालीन चिकित्सा प्रतिक्रिया नेटवर्क',
    appSubtitleDriver: 'एम्बुलेंस क्रू प्रेषण',
    appSubtitleAdmin: 'अस्पताल कमांड सेंटर',
    hotlineLabel: '24/7 आपातकालीन प्रेषण हेल्पलाइन:',
    soundMute: 'सायरन म्यूट करें',
    soundUnmute: 'सायरन अनम्यूट करें',
    themeLight: 'लाइट मोड पर स्विच करें',
    themeDark: 'डार्क मोड पर स्विच करें',
    highContrastToggle: 'हाई-कंट्रास्ट ग्लेयर मोड (धूप/आउटडोर)',
    languageSelect: 'भाषा चुनें',
    roleLabel: 'भूमिका:',
    logout: 'लॉग आउट',
    signInRegister: 'साइन इन / पंजीकरण',

    rolePatient: 'मरीज',
    roleDriver: 'चालक',
    roleAdmin: 'प्रशासक',

    dashboard: 'डैशबोर्ड',
    emergencyInformation: 'आपातकालीन जानकारी',
    activeEmergency: 'सक्रिय आपातकाल',
    ambulanceTracking: 'एंबुलेंस ट्रैकिंग',
    hospitalsFleetRadar: 'अस्पताल और बेड़ा रडार',
    emergencyHistory: 'आपातकालीन इतिहास',
    medicalProfile: 'मेडिकल प्रोफाइल',
    firstAidGuides: 'प्राथमिक चिकित्सा गाइड',
    settings: 'सेटिंग्स',
    notifications: 'सूचनाएं',
    activeSosInProgress: '🚨 सक्रिय SOS जारी है',
    triggerEmergencySos: 'आपातकालीन SOS भेजें',
    dispatchedTrackingSub: 'प्रेषित #{id} • ट्रैक करने के लिए टैप करें',
    instant108DispatchSub: 'त्वरित 108 प्रेषण (⌘⇧S)',
    expandSidebar: 'साइडबार फैलाएं',
    collapseSidebar: 'साइडबार समेटें',
    portalCitizen: 'नागरिक',
    portalPatient: 'मरीज',
    portalDriver: 'चालक',
    portalHospital: 'अस्पताल',
    portalAdmin: 'प्रशासक',
    portalBadgePortal: 'पोर्टल',
    portalBadgeCommand: 'कमांड',
    portalBadgeCockpit: 'कॉकपिट',

    navDriverDashboard: 'चालक डैशबोर्ड',
    navIncomingRequests: 'आने वाले अनुरोध',
    navActiveEmergency: 'सक्रिय आपातकाल',
    navAmbulanceStatus: 'एम्बुलेंस स्थिति',
    navProfile: 'प्रोफ़ाइल',
    driverCockpit: 'कॉकपिट अवलोकन',
    driverIncoming: 'आने वाले अनुरोध',
    driverActive: 'सक्रिय मिशन',
    driverNavigation: 'GPS रूट नेविगेशन',
    driverStatus: 'एंबुलेंस स्थिति',
    driverHistory: 'मिशन इतिहास',
    driverNotifications: 'सूचनाएं',
    driverProfile: 'चालक दल प्रोफ़ाइल',
    driverSettings: 'सेटिंग्स',
    missionActive: 'मिशन सक्रिय',
    turnByTurn: 'टर्न-बाय-टर्न',
    enRoute: 'रास्ते में',

    navPatientDashboard: 'डैशबोर्ड',
    navEmergencySOS: 'आपातकालीन SOS',
    navMyRequests: 'मेरे अनुरोध',
    navAmbulanceTracking: 'एम्बुलेंस ट्रैकिंग',

    navAdminDashboard: 'डैशबोर्ड',
    navEmergencyRequests: 'आपातकालीन अनुरोध',
    navAmbulances: 'एम्बुलेंस',
    navDrivers: 'चालक',
    navUsers: 'उपयोगकर्ता',
    navReports: 'रिपोर्ट',
    hospitalIncomingEmergencies: 'आने वाले आपातकालीन मामले',
    hospitalPatientInfo: 'मरीज की जानकारी और ई-पीसीआर',
    hospitalFleetRadar: 'एंबुलेंस ट्रैकिंग और बेड़ा',
    hospitalWards: 'अस्पताल क्षमता और वार्ड',
    hospitalTraffic: 'ग्रीन कॉरिडोर ट्रैफिक सिग्नल',
    hospitalPersonnel: 'चिकित्सा कर्मी और डॉक्टर',
    hospitalReports: 'रिपोर्ट और विश्लेषण',
    hospitalHistory: 'प्रवेश इतिहास',
    hospitalSettings: 'अस्पताल सेटिंग्स',
    criticalTraumaAdmission: 'गंभीर ट्रॉमा आपातकालीन प्रवेश',

    loading: 'लोड हो रहा है...',
    cancel: 'रद्द करें',
    submit: 'जमा करें',
    save: 'सहेजें',
    close: 'बंद करें',
    confirm: 'पुष्टि करें',
    phone: 'फ़ोन',
    location: 'स्थान',
    status: 'स्थिति',
    type: 'प्रकार',
    actions: 'कार्रवाई',
    notes: 'विवरण',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    all: 'सभी',
    active: 'सक्रिय',
    completed: 'पूर्ण',
    cancelled: 'रद्द',
    available: 'उपलब्ध',
    busy: 'व्यस्त',
    assigned: 'नियुक्त',
    maintenance: 'रखरखाव में',
    viewDetails: 'विवरण देखें',
    time: 'समय',
    patientName: 'मरीज का नाम',
    driverName: 'चालक का नाम',
    vehicleNumber: 'वाहन संख्या',
    emergencyType: 'आपातकाल का प्रकार',
    ambulanceType: 'एम्बुलेंस का प्रकार',
    baseLocation: 'बेस स्टेशन',
    activeEmergencies: 'सक्रिय आपातकाल',
    availableAmbulances: 'उपलब्ध एम्बुलेंस',
    completedTrips: 'पूर्ण मिशन',
    refresh: 'रिफ्रेश',
    rate: 'रेटिंग',
    download: 'डाउनलोड',
    viewReport: 'रिपोर्ट देखें',

    statusWaitingForDriver: 'SOS प्रसारित',
    statusWaitingDesc: 'चालक की स्वीकृति की प्रतीक्षा है',
    statusDriverAccepted: 'चालक ने स्वीकार किया',
    statusDriverAcceptedDesc: 'एम्बुलेंस आवंटित और पुष्टि की गई',
    statusOnTheWay: 'रास्ते में है',
    statusOnTheWayDesc: 'सायरन के साथ तेजी से आ रही है',
    statusReached: 'दल पहुंच गया',
    statusReachedDesc: 'प्राथमिक रिस्पॉन्डर घटनास्थल पर पहुंचे',
    statusCompleted: 'अस्पताल में भर्ती',
    statusCompletedDesc: 'ट्रॉमा सेंटर में मरीज सौंप दिया गया',
    statusCancelled: 'आपातकाल रद्द',
    statusCancelledDesc: 'अनुरोध समाप्त कर दिया गया',
    statusEnRoute: 'रास्ते में',
    statusAtScene: 'घटनास्थल पर',
    statusAvailable: 'उपलब्ध',

    heroBadge: 'आपातकालीन चिकित्सा प्रतिक्रिया नेटवर्क',
    heroSubBadge: '24/7 त्वरित प्रतिक्रिया प्रेषण',
    heroTitle: 'स्मार्ट एकीकृत आपातकालीन',
    heroTitleGradient: 'चिकित्सा प्रतिक्रिया प्रणाली',
    heroSubtitle: 'संकट में मरीजों को निकटतम उपलब्ध जीवन-रक्षक एम्बुलेंस, अस्पताल ट्रॉमा वार्ड और प्रेषण नियंत्रकों से जोड़ने वाला राज्य आपातकालीन नेटवर्क।',
    heroTriggerSOS: 'आपातकालीन SOS भेजें',
    heroOpenAdmin: 'कमांड सेंटर खोलें',
    heroStatAmbulances: 'सक्रिय एम्बुलेंस',
    heroStatReady: 'प्रेषण के लिए तैयार',
    heroStatEmergencies: 'लाइव आपातकाल',
    heroStatResponseTime: 'औसत प्रतिक्रिया समय',
    heroPortalsTitle: 'विशिष्ट हितधारक पोर्टल',
    heroPortalsSubtitle: 'विशिष्ट कार्यों के लिए नीचे संबंधित पोर्टल चुनें',

    portalPatientTitle: 'मरीज पोर्टल',
    portalPatientDesc: 'वन-टैप आपातकालीन SOS, लाइव जीपीएस ट्रैकिंग और प्राथमिक चिकित्सा सहायता।',
    portalPatientF1: 'त्वरित SOS आपातकालीन बटन',
    portalPatientF2: 'रीयल-टाइम प्रेषण ट्रैकर',
    portalPatientF3: 'आवंटित वाहन और चालक दल विवरण',
    portalPatientBtn: 'मरीज पोर्टल खोलें',

    portalDriverTitle: 'चालक कंसोल',
    portalDriverDesc: 'आपातकालीन कॉल स्वीकार करने, सायरन यात्रा शुरू करने और स्थल पर पहुंचने के लिए चालक कॉकपिट।',
    portalDriverF1: 'तुरंत सायरन और दृश्य चेतावनी',
    portalDriverF2: '1-क्लिक स्थिति नियंत्रण',
    portalDriverF3: 'सीधा मरीज फ़ोन और जीपीएस पिन',
    portalDriverBtn: 'चालक कंसोल खोलें',

    portalAdminTitle: 'कमांड सेंटर',
    portalAdminDesc: 'अस्पताल आपातकालीन संचालन कक्ष: बेड़ा ट्रैकिंग, प्रेषण निगरानी और विश्लेषण।',
    portalAdminF1: 'व्यापक आपातकालीन खाता बही',
    portalAdminF2: 'बेड़ा उपलब्धता और रखरखाव',
    portalAdminF3: 'सिस्टम डायग्नोस्टिक्स और डेटा रिफ्रेश',
    portalAdminBtn: 'कमांड सेंटर खोलें',

    pipelineTitle: 'परिचालन आपातकालीन जीवनचक्र',
    pipelineSubtitle: 'त्वरित स्वीकृति और सटीक अपडेट के साथ प्रमाणित आपातकालीन प्रतिक्रिया प्रणाली।',
    pipelineDesc: 'आपातकालीन प्रेषण प्रगति और लाइव टेलीमेट्री',
    pipelineStep1Title: 'मरीज SOS संकेत',
    pipelineStep1Desc: 'मरीज घटनास्थल और आपात स्थिति की गंभीरता प्रसारित करता है।',
    pipelineStep2Title: 'चालक स्वीकृति',
    pipelineStep2Desc: 'उपलब्ध पैरामेडिक दल कॉल की समीक्षा कर तुरंत स्वीकार करता है।',
    pipelineStep3Title: 'सायरन प्राथमिकता यात्रा',
    pipelineStep3Desc: 'एम्बुलेंस सायरन के साथ मरीज के स्थान की ओर तेजी से रवाना होती है।',
    pipelineStep4Title: 'अस्पताल में भर्ती',
    pipelineStep4Desc: 'मरीज को ट्रॉमा सेंटर में भर्ती कर एम्बुलेंस पुनः तैयार की जाती है।',
    networkBadge1: 'राष्ट्रीय आपातकालीन प्रतिक्रिया नेटवर्क',
    networkBadge2: '24/7 केंद्रीकृत प्रेषण संचालन',
    networkBadge3: 'उच्च उपलब्धता चिकित्सा टेलीमेट्री',

    patientPortalTitle: 'आपातकालीन मरीज पोर्टल',
    patientPortalBadge: 'प्राथमिकता चिकित्सा पहुंच',
    patientWelcome: 'स्वागत है',
    patientLoggedInAs: 'आपातकालीन संपर्क के रूप में लॉग इन हैं',
    patientMedicalId: 'मरीज आईडी',
    patientRegisteredPhone: 'पंजीकृत फ़ोन',
    patientActiveAlertTitle: 'सक्रिय आपातकालीन प्रेषण जारी है',
    patientActiveAlertDesc: 'कृपया अपना फ़ोन पास रखें। आपातकालीन टीम समन्वय कर रही है।',
    patientAssignedAmbulance: 'आवंटित एम्बुलेंस',
    patientDriverContact: 'चालक संपर्क',
    patientAmbulanceType: 'वाहन का प्रकार',
    patientBaseLocation: 'बेस स्टेशन',
    patientCancelSOS: 'आपातकालीन कॉल रद्द करें',
    patientCancelConfirm: 'क्या आप वाकई इस आपातकालीन अनुरोध को रद्द करना चाहते हैं?',
    patientTriggerTitle: 'त्वरित आपातकालीन SOS प्रसारण',
    patientTriggerDesc: 'अपने स्थान पर तुरंत एम्बुलेंस बुलाने के लिए नीचे दिया गया SOS बटन दबाएं।',
    patientInstantSOSBtn: 'एक-टैप आपातकालीन SOS',
    patientEmergencyDetails: 'आपातकाल विवरण और स्थान',
    patientSelectEmergencyType: 'आपातकाल का प्रकार चुनें',
    patientLocationPlaceholder: 'सटीक पता या लैंडमार्क दर्ज करें',
    patientUseCurrentLocation: 'ऑटो-डिटेक्ट जीपीएस',
    patientPhonePlaceholder: 'आपातकालीन संपर्क फ़ोन',
    patientNotesPlaceholder: 'मरीज की स्थिति, लक्षण, ज्ञात एलर्जी, मंजिल/भवन का विवरण...',
    patientDispatchBtn: 'पुष्टि करें और एम्बुलेंस भेजें',
    patientFirstAidTitle: 'आपातकालीन प्राथमिक चिकित्सा गाइड',
    patientFirstAidSubtitle: 'एम्बुलेंस आने तक तत्काल जीवन-रक्षक निर्देश',
    patientHistoryTitle: 'आपातकालीन अनुरोध इतिहास',
    patientNoHistory: 'कोई पिछला आपातकालीन अनुरोध दर्ज नहीं है।',

    secureMedicalProfile: 'सुरक्षित आपातकालीन मेडिकल प्रोफाइल',
    secureMedicalProfileDesc: '256-बिट एन्क्रिप्टेड रिकॉर्ड • SOS पर एंबुलेंस कर्मियों को तुरंत साझा किया जाता है',
    bloodGroup: 'रक्त समूह',
    bloodGroupDesc: 'आपातकालीन रक्त आधान के लिए महत्वपूर्ण',
    allergies: 'एलर्जी और दवा प्रतिबंध',
    chronicConditions: 'पुरानी बीमारियां / प्रत्यारोपण',
    emergencyContact: 'आपातकालीन संपर्क और परिजन',
    inputEditMedicalInfo: 'जानकारी दर्ज करें / संपादित करें',
    saveMedicalProfile: 'आपातकालीन प्रोफाइल सहेजें',
    transmittedOnSos: 'SOS पर प्रेषित मेडिकल आईडी',
    icePass: 'ICE आपातकालीन पास',
    iceQrCode: 'रिस्पॉन्डर क्यूआर आपातकालीन पास',
    noKnownAllergies: 'कोई ज्ञात एलर्जी नहीं',
    noRecordedConditions: 'कोई पुरानी बीमारी दर्ज नहीं',
    notSet: 'दर्ज नहीं',
    emergencyContactName: 'संपर्क का नाम',
    emergencyContactPhone: 'संपर्क फ़ोन नंबर',
    emergencyContactRelation: 'संबंध',

    driverPortalTitle: 'एम्बुलेंस क्रू कॉकपिट',
    driverPortalBadge: 'आपातकालीन चालक टर्मिनल',
    driverBadge: 'आपातकालीन क्रू',
    driverAssignedUnit: 'आवंटित वाहन',
    driverAvailabilityStatus: 'वाहन उपलब्धता स्थिति',
    driverSetAvailable: 'तैयार / उपलब्ध के रूप में सेट करें',
    driverSetMaintenance: 'रखरखाव के रूप में सेट करें',
    driverSwitchVehicle: 'आवंटित वाहन बदलें:',
    driverIncomingTitle: 'आने वाले आपातकालीन प्रेषण',
    driverIncomingSubtitle: 'स्वीकृति की प्रतीक्षा कर रही जरूरी कॉल',
    driverIncomingAlerts: 'आने वाली आपातकालीन अलर्ट',
    driverIncomingDesc: 'आपके दायरे में प्रसारित तत्काल SOS अनुरोध',
    driverNoIncoming: 'कतार में कोई अनुरोध नहीं है। बेड़ा स्टैंडबाय पर है।',
    driverAcceptBtn: 'आपातकाल स्वीकार करें और रवाना हों',
    driverAcceptRequest: 'आपातकालीन कॉल स्वीकार करें',
    driverAcceptSuccess: 'आपातकाल स्वीकार किया गया! घटनास्थल के लिए रवाना।',
    driverActiveMissionTitle: 'सक्रिय आपातकालीन मिशन',
    driverActiveMissionBadge: 'प्राथमिकता सायरन सक्रिय',
    driverPatientDetails: 'मरीज की जानकारी',
    driverIncidentLocation: 'घटना का स्थान',
    driverEmergencyNature: 'आपातकाल का प्रकार',
    driverCallPatient: 'मरीज को कॉल करें',
    driverActionStartJourney: 'यात्रा शुरू करें (रास्ते में)',
    driverStartJourney: 'यात्रा शुरू करें',
    driverActionArrived: 'घटनास्थल पर पहुंचे दर्ज करें',
    driverMarkReached: 'घटनास्थल पर पहुंचे',
    driverActionComplete: 'अस्पताल हैंडओवर पूर्ण करें',
    driverCompleteTrip: 'मिशन पूरा करें',
    driverReadyStandby: 'वाहन अब खाली है और अगले कॉल के लिए तैयार है',
    driverStandby: 'स्टैंडबाय पर तैयार',
    driverStandbyDesc: 'वाहन सक्रिय है और अगले प्रेषण की प्रतीक्षा कर रहा है',
    driverVehicleSpecs: 'वाहन उपकरण और चालक दल',
    driverMissionHistory: 'पूर्ण मिशन इतिहास',
    driverCompletedMissions: 'पूर्ण आपातकालीन प्रेषण',

    adminPortalTitle: 'अस्पताल प्रेषण कमांड सेंटर',
    adminPortalBadge: 'एडमिन कमांड',
    adminConsoleBadge: 'एडमिन कंसोल',
    adminSubtitle: 'लाइव फ्लीट ट्रैकिंग, केंद्रीय प्रेषण कतार और गतिविधि लॉग',
    adminResetData: 'डिफ़ॉल्ट बेड़ा पुनर्स्थापित करें',
    adminResetSystem: 'सिस्टम डेटा रीसेट करें',
    adminAddAmbulance: 'एम्बुलेंस जोड़ें',
    adminTotalCalls: 'कुल आपातकालीन कॉल',
    adminActiveCallsDesc: 'वर्तमान में रास्ते में / घटनास्थल पर',
    adminReadyFleetDesc: 'तत्काल SOS के लिए तैयार',
    adminMetricTotalCalls: 'कुल आपातकालीन कॉल',
    adminMetricActive: 'सक्रिय कॉल',
    adminMetricAvailable: 'तैयार बेड़ा',
    adminMetricAvgTime: 'औसत प्रतिक्रिया',
    adminFleetTitle: 'एम्बुलेंस बेड़ा और चालक दल प्रबंधन',
    adminFleetSubtitle: 'रीयल-टाइम तत्परता, वाहन टेलीमेट्री और क्रू स्थिति',
    adminFleetDesc: 'रीयल-टाइम स्थिति, वाहन तत्परता और चालक टेलीमेट्री',
    adminLedgerTitle: 'आपातकालीन प्रेषण मास्टर लेजर',
    adminLedgerSubtitle: 'सभी आपातकालीन कॉलों का पूर्ण कालानुक्रमिक रिकॉर्ड',
    adminMasterLedgerTitle: 'आपातकालीन प्रेषण मास्टर लेजर',
    adminMasterLedgerDesc: 'सभी पंजीकृत SOS कॉल, आवंटन और प्रतिक्रिया जीवनचक्र',
    adminFilterAll: 'सभी रिकॉर्ड',
    adminFilterActive: 'सक्रिय कॉल',
    adminFilterCompleted: 'पूर्ण',
    adminFilterCancelled: 'रद्द',
    adminUsersTitle: 'अधिकृत कार्मिक और भूमिका निर्देशिका',
    adminUsersSubtitle: 'सत्यापित चिकित्सा अधिकारी, पैरामेडिक्स और पंजीकृत मरीज',
    adminUsersDesc: 'अधिकृत कार्मिक खाते, सक्रिय प्रेषक और सत्यापित चालक',

    authSignInTitle: 'आरोग्यवाहिनी में साइन इन करें',
    authRegisterTitle: 'आपातकालीन खाता बनाएं',
    authSubtitle: 'त्वरित प्रतिक्रिया प्रेषण और चिकित्सा प्रोफ़ाइल तक पहुंचें।',
    authQuickDemo: 'त्वरित भूमिका पहुंच:',
    authFullName: 'पूरा नाम',
    authEmail: 'ईमेल पता',
    authPassword: 'पासवर्ड',
    authSelectRole: 'भूमिका चुनें',
    authSignInBtn: 'पोर्टल में साइन इन करें',
    authRegisterBtn: 'खाता बनाएं और साइन इन करें',
    authNoAccount: 'खाता नहीं है?',
    authHaveAccount: 'पहले से खाता है?',
    authCreateOne: 'नया प्रोफ़ाइल पंजीकृत करें',

    footerNetwork: 'आरोग्यवाहिनी आपातकालीन चिकित्सा प्रतिक्रिया नेटवर्क',
    footerDesc: 'त्वरित पैरामेडिक लामबंदी, अस्पताल ट्रॉमा वार्ड रूटिंग और लाइव मरीज ट्रैकिंग प्रदान करने वाला राज्य आपातकालीन प्रेषण मंच।',
    footerTollFree: 'टोल-फ्री आपातकालीन हेल्पलाइन: 108 / 112',
    footerEmergencyHotline: 'आपातकालीन हेल्पलाइन: 108 / 112',
    footerRights: 'सर्वाधिकार सुरक्षित। सरकारी स्वास्थ्य आपातकालीन बुनियादी ढांचा।',
    footerCertified: 'प्रमाणित आपातकालीन चिकित्सा सेवा नेटवर्क',

    notificationsTitle: 'सूचनाएं',
    notificationsEmpty: 'कोई सूचना नहीं है',
    notificationsEmptyDesc: 'आपातकालीन प्रेषण, अलर्ट और सिस्टम अपडेट यहां वास्तविक समय में दिखाई देंगे।',
    notificationsMarkAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',
    notificationsClearAll: 'सभी साफ़ करें',
    notificationsViewAll: 'सभी सूचनाएं देखें',
    notificationsClose: 'पैनल बंद करें',
    notificationsUnreadBadge: 'अपठित',
    notificationNew: 'नया',
    notificationTimeJustNow: 'अभी-अभी',
    notificationViewEmergency: 'आपातकालीन विवरण देखें',

    voiceSymptomsBtn: 'आवाज़ से लक्षण बताएं (Voice-to-Text)',
    voiceRecordingTitle: 'आपातकालीन वॉयस-टू-टेक्स्ट लक्षण रिकॉर्डर',
    voiceRecordingSubtitle: 'बोलकर अपने लक्षणों का वर्णन करें। प्रेषक और पैरामेडिक्स को स्पष्ट नैदानिक संदर्भ प्राप्त होगा।',
    voiceStartRecording: 'वॉयस रिकॉर्डिंग शुरू करें',
    voiceStopRecording: 'रिकॉर्डिंग रोकें',
    voiceListening: 'सुन रहे हैं... कृपया स्पष्ट बोलें',
    voiceSpeakNow: 'अब माइक्रोफ़ोन में बोलें',
    voiceTranscribedLabel: 'ट्रांसक्रिप्ट किए गए लक्षण (बोला गया संदर्भ):',
    voiceQuickSymptoms: 'त्वरित आपातकालीन लक्षण चुनें:',
    voiceApplySymptoms: 'सहेजें और आपातकालीन SOS में जोड़ें',
    voiceClear: 'टेक्स्ट साफ़ करें',
    voiceSummarizeAi: 'नैदानिक संदर्भ बढ़ाएं (AI ट्राइएज)',
    voiceMicPermissionError: 'माइक्रोफ़ोन अनुमति अवरुद्ध है। कृपया ब्राउज़र सेटिंग में अनुमति दें।',
    voiceNotSupported: 'इस ब्राउज़र में स्पीच रिकग्निशन पूरी तरह समर्थित नहीं है। आप नीचे दिए गए लक्षणों को टैप कर सकते हैं।',
    voiceUrgencyLevel: 'अनुमानित तात्कालिकता:',
    voiceRecommendedType: 'अनुशंसित आपातकालीन इकाई:',
    voiceContextAttached: 'वॉयस-टू-टेक्स्ट संदर्भ संलग्न',
    voiceUpdateDispatcher: 'आवाज़ से प्रेषक को अपडेट करें',

    firstAidHeader: 'आपातकालीन प्राथमिक चिकित्सा गाइड',
    firstAidSub: 'एम्बुलेंस आने तक तत्काल जीवन-रक्षक निर्देश',
    cprAdult: 'वयस्क सीपीआर (CPR)',
    cprChild: 'बाल और शिशु सीपीआर',
    choking: 'गले में रुकावट (हाइमलिच)',
    severeBleeding: 'गंभीर रक्तस्राव नियंत्रण',
    burnsScalds: 'जलने की चोट',
    strokeFast: 'स्ट्रोक (F.A.S.T.)',
    heartAttack: 'दिल का दौरा सावधानी',
    step: 'चरण',
    alwaysCall108: 'हमेशा पहले 108 डायल करें। ये निर्देश एंबुलेंस आने तक अंतरिम सहायता हैं।',

    proximityAlertTitle: 'एम्बुलेंस पास आ रही है (2 किमी के भीतर)',
    proximityAlertDesc: 'एम्बुलेंस आपके स्थान के पास है। कृपया अपना फ़ोन चालू रखें और प्रवेश द्वार तैयार रखें।',
    playVoiceAnnouncement: 'वॉइस अलर्ट चलाएं',
    dismiss: 'हटाएं',

    ambulanceArrivingIn: 'एम्बुलेंस लगभग {minutes} मिनट में पहुंचेगी',
    ambulanceDispatched: 'एम्बुलेंस #{id} रवाना कर दी गई है',
    hospitalAssigned: 'आवंटित अस्पताल: {hospital}',
    searchingFleet: 'निकटतम उपलब्ध एम्बुलेंस खोजी जा रही हैं...',
    activeSos: 'सक्रिय SOS',
    driverAssigned: 'चालक {driver} नियुक्त',
    patientConnected: 'मरीज जुड़ा हुआ है',
    eta: 'समय',
    mins: 'मिनट',
    km: 'किमी',

    emergency: 'आपातकाल',
    missionCompleted: 'मिशन पूर्ण हुआ',
    liveSos: 'सक्रिय SOS',
    ambulanceAssigned: 'एम्बुलेंस आवंटित',
    enRouteToYou: 'आपकी ओर आ रही है',
    arrivedAtScene: 'घटनास्थल पर पहुंची',
    handoverCompleted: 'अस्पताल सुपुर्दगी पूर्ण',
    voiceUpdate: 'वॉयस अपडेट',
    closeNewSos: 'बंद करें / नया SOS',
    emergencyMissionFinalized: 'आपातकालीन मिशन सफलतापूर्वक संपन्न और मरीज को भर्ती कराया गया',
    emergencyMissionFinalizedDesc: 'आपके रिकॉर्ड के लिए एक व्यापक नैदानिक और परिचालन आपातकालीन रिपोर्ट तैयार की गई है।',
    downloadReport: 'रिपोर्ट डाउनलोड करें',
    estimatedEta: 'आगमन का अनुमानित समय (लाइव ETA)',
    within2kmAlertZone: '2 किमी अलर्ट ज़ोन के भीतर',
    liveTraffic: 'लाइव ट्रैफिक',
    lowCongestion: 'कम ट्रैफिक',
    greenCorridorActive: 'ग्रीन कॉरिडोर सक्रिय',
    iceHealthPass: 'ICE हेल्थ पास',
    alertBroadcastInProgress: 'अलर्ट प्रसारण प्रगति पर है:',
    alertBroadcastDesc: 'आपका SOS अनुरोध निकटतम उपलब्ध एम्बुलेंस को भेजा जा रहा है। कृपया इसी स्क्रीन पर रहें।',
    callParamedic: 'पैरामेडिक को कॉल करें',
    broadcastingFleetAlert: 'निकटतम बेड़े को अलर्ट प्रसारित किया जा रहा है',
    clinicalProfileTransmitted: 'आपातकालीन चिकित्सा प्रोफ़ाइल 108 प्रेषकों और एम्बुलेंस को भेजी गई',
    transmitted: 'प्रेषित',
    primaryEmergencyContact: 'मुख्य आपातकालीन संपर्क',
    existingConditionsDirectives: 'पूर्व-मौजूद स्थितियां और चिकित्सा निर्देश:',
    directPriorityCorridor: 'सीधा प्राथमिकता कॉरिडोर',
    gpsAutoPinned: 'जीपीएस स्वतः पिन किया गया:',
    instant1TapSos: 'त्वरित 1-टैप SOS',
    autoPinningGps: 'ब्राउज़र के माध्यम से आपका जीपीएस स्थान प्राप्त किया जा रहा है...',
    locationDenied: 'स्थान अनुमति अस्वीकृत है। कृपया पता मैन्युअल रूप से दर्ज करें।',
    enterAddressManually: 'स्थान या लैंडमार्क मैन्युअल दर्ज करें',
    gpsCalibrate: 'जीपीएस कैलिब्रेट करें',
    centerOnMe: 'मेरे स्थान पर केंद्रित करें',
    medicalIdOnSos: 'SOS पर प्रेषित मेडिकल आईडी:',
    updateProfile: 'प्रोफ़ाइल अपडेट करें',
    pastEmergencies: 'पिछली आपातकालीन कॉल और गतिविधि लॉग',
    noPastEmergencies: 'इस प्रोफ़ाइल पर कोई पूर्व आपातकालीन रिकॉर्ड नहीं है।',
    radarMarkersLegend: 'राडार मार्कर सूची',
    wardAvailable: 'वार्ड उपलब्ध',
    wardFullDiversion: 'वार्ड भरा हुआ (डायवर्जन)',
    ambulanceFleet: 'एम्बुलेंस बेड़ा',
    yourIncidentGps: 'आपका आपातकालीन स्थान',
    yourDetectedPin: 'पहचाना गया जीपीएस पिन',
    detectingGps: 'जीपीएस खोज रहे हैं...',
    nearestAmbulance: 'निकटतम स्टैंडबाय एम्बुलेंस',
    transfusionReady: 'रक्त आधान के लिए तैयार',
    alerts108Paramedics: '108 पैरामेडिक्स को सचेत करता है',
    changesSyncSos: 'परिवर्तन तुरंत आपके खाते और SOS प्रेषण के साथ सिंक होंगे',
    editCriticalInfo: 'गंभीर आपातकालीन जानकारी संपादित करें',
    clickChipToToggle: 'चुनने के लिए टैप करें',
    saveAndProtect: 'सहेजें और सुरक्षित करें',
    savingProfile: 'प्रोफ़ाइल सहेजी जा रही है...',
    goodMorning: 'शुभ प्रभात',
    goodAfternoon: 'शुभ दोपहर',
    goodEvening: 'शुभ संध्या',
    ambulanceCrewCockpit: 'एम्बुलेंस क्रू कॉकपिट',
    onEmergency: 'आपातकालीन ड्यूटी पर',
    activeEmergencyInProgress: '🚨 सक्रिय आपातकालीन मिशन प्रगति पर है',
    patient: 'मरीज',
    destination: 'गंतव्य',
    openLiveNav: 'लाइव नेविगेशन HUD खोलें',
    incomingCalls: 'इनकमिंग आपातकालीन कॉल',
    criticalTriageAlerts: 'गंभीर ट्राइएज अलर्ट',
    noIncomingCalls: 'इस समय कोई नया आपातकालीन अनुरोध नहीं है',
    acceptEmergency: 'आपातकालीन कॉल स्वीकार करें',
    decline: 'अस्वीकार करें',
    priorityCritical: 'अति गंभीर (CRITICAL)',
    priorityHigh: 'उच्च प्राथमिकता (HIGH)',
    priorityNormal: 'सामान्य (NORMAL)',
    turnByTurnNav: 'चरण-दर-चरण जीपीएस नेविगेशन',
    distanceToPatient: 'मरीज तक की दूरी',
    distanceToHospital: 'अस्पताल तक की दूरी',
    erPreNotification: 'अस्पताल को पूर्व-सूचना भेजी गई',
    markAtScene: 'घटनास्थल पर पहुंचे चिह्नित करें',
    startTransitToHospital: 'अस्पताल के लिए रवाना हों',
    completeHandover: 'अस्पताल सुपुर्दगी पूर्ण करें',
    enterVitals: 'मार्ग में वाइटल्स दर्ज करें (e-PCR)',
    inTransitTelemetry: 'मार्ग में मरीज टेलीमेट्री',
    heartRate: 'हृदय गति (BPM)',
    bloodPressure: 'रक्तचाप (BP)',
    oxygenSaturation: 'ऑक्सीजन स्तर (SpO2)',
    respiratoryRate: 'श्वसन दर',
    glasgowComaScale: 'ग्लासगो कोमा स्केल (GCS)',
    transmitVitals: 'अस्पताल आपातकालीन वार्ड को भेजें',
    transmitting: 'भेजा जा रहा है...',
    offlineNotice: 'ऑफ़लाइन सूचना:',
    offlineNoticeDesc: 'इंटरनेट कनेक्शन टूट गया है। कनेक्शन बहाल होने तक आपातकालीन SOS और लाइव टेलीमेट्री निलंबित हैं।',
    onlineNotice: 'ऑनलाइन:',
    onlineNoticeDesc: 'इंटरनेट कनेक्शन बहाल हो गया है। रीयल-टाइम आपातकालीन सिंक सक्रिय है।',
    emergencyReportTitle: 'आधिकारिक आपातकालीन घटना एवं प्रेषण रिपोर्ट',
    printReport: 'रिपोर्ट प्रिंट करें',
    erTraumaMonitorTitle: 'अस्पताल आपातकालीन विभाग और ट्रॉमा ट्राइएज मॉनिटर',
    prepTraumaBay: 'ट्रॉमा बेड तैयार करें',
    bayPrepared: 'ट्रॉमा बेड तैयार है',
    trafficSignalPriorityTitle: 'आपातकालीन ग्रीन कॉरिडोर ट्रैफ़िक समन्वय',
    signalNormal: 'सामान्य सिग्नल चक्र',
    signalPriorityRouteA: 'ग्रीन वेव सक्रिय (कॉरिडोर A)',
    signalPriorityRouteB: 'ग्रीन वेव सक्रिय (कॉरिडोर B)',
    icePassTitle: 'आपातकालीन स्वास्थ्य पास (ICE)',
    copyLink: 'प्रोफ़ाइल लिंक कॉपी करें',
    printIcePass: 'ICE कार्ड प्रिंट करें',
    verifiedDispatch: '24/7 प्रमाणित चिकित्सा प्रेषण',
    fleetRadarTitle: 'लाइव आपातकालीन एम्बुलेंस बेड़ा और जीपीएस रडार',
    fleetRadarSubtitle: 'आपकी स्थिति और निकटतम उपलब्ध एम्बुलेंस का रीयल-टाइम मानचित्र',
    hospitalWardCapacity: 'अस्पताल बिस्तर क्षमता',
    hospitalERTrauma: 'आपातकालीन ट्रॉमा वार्ड',
    vehicleTelemetry: 'वाहन टेलीमेट्री',
    fuelLevel: 'ईंधन स्तर',
    oxygenLevel: 'ऑक्सीजन स्तर',
    batteryStatus: 'बैटरी स्थिति',
    defibrillatorReady: 'डिफाइब्रिलेटर तत्परता',
    maintenanceStatus: 'रखरखाव स्थिति',
    shiftHours: 'ड्यूटी का समय',
    driverLicense: 'ड्राइविंग लाइसेंस संख्या',
    testSiren: 'सायरन परीक्षण',
  },
};
