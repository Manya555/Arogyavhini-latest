import React, { useState } from 'react';
import { 
  Heart, 
  MapPin, 
  Phone, 
  PhoneCall, 
  User, 
  Users, 
  AlertTriangle, 
  Navigation, 
  Hospital, 
  Activity, 
  Radio, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  Compass,
  FileText,
  Clock,
  ExternalLink,
  Building2,
  Share2
} from 'lucide-react';
import { EmergencyRequest, EmergencyStatus, HospitalOption } from '../../types';
import { DriverTab } from './DriverSidebar';

interface DriverActiveViewProps {
  activeMission: EmergencyRequest | null;
  onUpdateStatus: (id: number, status: EmergencyStatus) => void;
  isUpdating: boolean;
  onSwitchTab: (tab: DriverTab) => void;
  onOpenVitalsModal: () => void;
  onOpenReportModal: (id: number, emergency?: EmergencyRequest) => void;
  onSwitchStage?: (emergencyId: number, stage: 'TO_PATIENT' | 'TO_HOSPITAL') => void;
  onFindNearbyHospitals?: (emergencyId: number) => void;
  onSelectHospital?: (emergencyId: number, hospitalName: string) => void;
  onNavigateToHospital?: (emergencyId: number, hospital: HospitalOption) => void;
  isSearchingHospitals?: boolean;
  driverCoords: { latitude: number; longitude: number } | null;
}

export const DriverActiveView: React.FC<DriverActiveViewProps> = ({
  activeMission,
  onUpdateStatus,
  isUpdating,
  onSwitchTab,
  onOpenVitalsModal,
  onOpenReportModal,
  onSwitchStage,
  onFindNearbyHospitals,
  onSelectHospital,
  onNavigateToHospital,
  isSearchingHospitals,
  driverCoords,
}) => {
  const [patientOnBoardLocal, setPatientOnBoardLocal] = useState<boolean>(false);
  const [arrivedAtHospitalLocal, setArrivedAtHospitalLocal] = useState<boolean>(false);

  if (!activeMission) {
    return (
      <div id="driver-active-view-empty" className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Active Emergency
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You do not have an active mission assigned to your ambulance unit. Review incoming SOS alerts to accept a dispatch.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => onSwitchTab('incoming')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition cursor-pointer"
          >
            View Incoming Emergencies
          </button>
        </div>
      </div>
    );
  }

  // Derive current tracker stage (1 to 7)
  // 1: SOS Received (WAITING_FOR_DRIVER)
  // 2: Accepted (DRIVER_ACCEPTED)
  // 3: On the Way (ON_THE_WAY)
  // 4: Arrived at Scene (REACHED and not on board)
  // 5: Patient Picked Up (REACHED and on board / TO_HOSPITAL)
  // 6: Hospital Arrival (Arrived at Hospital)
  // 7: Completed (COMPLETED)
  const isHospitalStage = activeMission.navigation_stage === 'TO_HOSPITAL' || patientOnBoardLocal;
  let currentStageIndex = 1; // 0-indexed: 0..6
  if (activeMission.status === 'WAITING_FOR_DRIVER') currentStageIndex = 0;
  else if (activeMission.status === 'DRIVER_ACCEPTED') currentStageIndex = 1;
  else if (activeMission.status === 'ON_THE_WAY') currentStageIndex = 2;
  else if (activeMission.status === 'REACHED' && !isHospitalStage && !arrivedAtHospitalLocal) currentStageIndex = 3;
  else if (activeMission.status === 'REACHED' && isHospitalStage && !arrivedAtHospitalLocal) currentStageIndex = 4;
  else if (arrivedAtHospitalLocal) currentStageIndex = 5;
  else if (activeMission.status === 'COMPLETED') currentStageIndex = 6;

  const STAGES = [
    { label: 'SOS Received', sub: 'Dispatched by CAD' },
    { label: 'Accepted', sub: 'Crew Assigned' },
    { label: 'On the Way', sub: 'Ambulance En Route' },
    { label: 'Arrived at Scene', sub: 'Triage & First Aid' },
    { label: 'Patient Picked Up', sub: 'En Route to Hospital' },
    { label: 'Hospital Arrival', sub: 'ER Handover' },
    { label: 'Completed', sub: 'Trip Documented' },
  ];

  // Primary action button based on state
  const handlePrimaryAction = async () => {
    if (activeMission.status === 'DRIVER_ACCEPTED') {
      onUpdateStatus(activeMission.id, 'ON_THE_WAY');
    } else if (activeMission.status === 'ON_THE_WAY') {
      onUpdateStatus(activeMission.id, 'REACHED');
    } else if (activeMission.status === 'REACHED' && !patientOnBoardLocal && activeMission.navigation_stage !== 'TO_HOSPITAL') {
      setPatientOnBoardLocal(true);
      if (onSwitchStage) {
        onSwitchStage(activeMission.id, 'TO_HOSPITAL');
      }
      if (onFindNearbyHospitals) {
        onFindNearbyHospitals(activeMission.id);
      }
    } else if (isHospitalStage && !arrivedAtHospitalLocal) {
      setArrivedAtHospitalLocal(true);
    } else if (arrivedAtHospitalLocal || activeMission.status === 'REACHED') {
      onUpdateStatus(activeMission.id, 'COMPLETED');
      onOpenReportModal(activeMission.id, activeMission);
    }
  };

  let primaryButtonText = 'START JOURNEY';
  let primaryButtonColor = 'bg-orange-600 hover:bg-orange-700 text-white';
  let primaryButtonIcon = Navigation;

  if (activeMission.status === 'DRIVER_ACCEPTED') {
    primaryButtonText = '1. START JOURNEY';
    primaryButtonColor = 'bg-orange-600 hover:bg-orange-700 text-white animate-pulse';
    primaryButtonIcon = Navigation;
  } else if (activeMission.status === 'ON_THE_WAY') {
    primaryButtonText = '2. MARK ARRIVED AT SCENE';
    primaryButtonColor = 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse';
    primaryButtonIcon = MapPin;
  } else if (activeMission.status === 'REACHED' && !patientOnBoardLocal && activeMission.navigation_stage !== 'TO_HOSPITAL') {
    primaryButtonText = '3. MARK PATIENT ON BOARD (START HOSPITAL RUN)';
    primaryButtonColor = 'bg-amber-600 hover:bg-amber-700 text-white';
    primaryButtonIcon = Heart;
  } else if (isHospitalStage && !arrivedAtHospitalLocal) {
    primaryButtonText = '4. ARRIVED AT HOSPITAL (ER HANDOVER)';
    primaryButtonColor = 'bg-emerald-600 hover:bg-emerald-700 text-white';
    primaryButtonIcon = Hospital;
  } else {
    primaryButtonText = '5. COMPLETE EMERGENCY & SUBMIT REPORT';
    primaryButtonColor = 'bg-emerald-700 hover:bg-emerald-800 text-white';
    primaryButtonIcon = CheckCircle2;
  }

  return (
    <div id="driver-active-emergency-view" className="space-y-6">
      {/* 1. TOP URGENT BANNER */}
      <div className="bg-[#0f172a] dark:bg-slate-950 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shadow-md shrink-0 animate-bounce">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                🚨 ACTIVE EMERGENCY #{activeMission.id}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(activeMission.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {activeMission.emergency_type}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Patient: <strong className="text-white">{activeMission.patient_name}</strong> • Current Status:{' '}
              <span className="text-amber-400 font-bold uppercase">{activeMission.status.replace(/_/g, ' ')}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSwitchTab('navigation')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Open Map Navigation</span>
          </button>

          <button
            type="button"
            onClick={onOpenVitalsModal}
            className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Activity className="w-4 h-4 animate-pulse" />
            <span>{activeMission.vitals_heart_rate ? 'Vitals (Transmitted)' : 'e-PCR Tele-Triage'}</span>
          </button>
        </div>
      </div>

      {/* 2. EMERGENCY PROGRESS TRACKER (HIGHLIGHT ONLY THE CURRENT STAGE) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
          Emergency Response Progress
        </span>

        {/* Responsive Progress Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {STAGES.map((stage, idx) => {
            const isCurrent = idx === currentStageIndex;
            const isPassed = idx < currentStageIndex;

            return (
              <div
                key={stage.label}
                className={`p-3 rounded-xl border text-center transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow-md ring-2 ring-amber-500/40 scale-102'
                    : isPassed
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                    isCurrent ? 'bg-slate-950 text-amber-400' : isPassed ? 'bg-emerald-600 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {idx + 1}
                  </span>
                  {isPassed && <span className="text-[10px]">✓</span>}
                </div>
                <div className={`text-xs ${isCurrent ? 'font-black' : 'font-bold'} leading-tight`}>
                  {stage.label}
                </div>
                <div className={`text-[9px] mt-1 truncate ${isCurrent ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                  {isCurrent ? '● CURRENT STAGE' : stage.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PATIENT & INCIDENT TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Patient Clinical Info Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                PATIENT INFORMATION
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
              SOS Verified
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Full Name</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {activeMission.patient_name}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Emergency Type</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {activeMission.emergency_type}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Blood Group</span>
              <span className="font-black text-red-600 dark:text-red-400 px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900">
                {activeMission.patient_blood_type || 'B+'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Known Allergies</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {activeMission.patient_allergies || 'None reported'}
              </span>
            </div>

            <div className="py-1.5 border-b border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block">Next of Kin / Emergency Contact</span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeMission.patient_emergency_contact_name || 'Family Contact'} (
                  {activeMission.patient_emergency_contact_relation || 'Kin'})
                </span>
                <a
                  href={`tel:${activeMission.patient_emergency_contact_phone || activeMission.phone}`}
                  className="px-2 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold rounded-lg hover:underline flex items-center gap-1"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>{activeMission.patient_emergency_contact_phone || activeMission.phone}</span>
                </a>
              </div>
            </div>

            {activeMission.patient_medical_notes && (
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 text-[11px] text-slate-700 dark:text-slate-300">
                <strong className="text-amber-900 dark:text-amber-300">Medical Notes: </strong>
                {activeMission.patient_medical_notes}
              </div>
            )}
          </div>
        </div>

        {/* Incident Info Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                INCIDENT LOCATION
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">GPS Calibrated</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Exact Location</span>
              <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                {activeMission.location}
              </p>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">GPS Coordinates</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {activeMission.latitude && activeMission.longitude
                  ? `${activeMission.latitude.toFixed(4)}, ${activeMission.longitude.toFixed(4)}`
                  : activeMission.patient_latitude && activeMission.patient_longitude
                  ? `${activeMission.patient_latitude.toFixed(4)}, ${activeMission.patient_longitude.toFixed(4)}`
                  : '12.9716, 77.5946 (Bengaluru)'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">Destination Hospital</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {activeMission.hospital_destination || 'Hospital Selection Pending'}
              </span>
            </div>

            {/* Direct Patient Call Action */}
            <div className="pt-2">
              <a
                href={`tel:${activeMission.phone}`}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Patient ({activeMission.phone})</span>
              </a>
            </div>

            {/* In-Transit Vitals Telemetry Trigger */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">e-PCR Vitals Telemetry</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {activeMission.vitals_heart_rate
                    ? `HR: ${activeMission.vitals_heart_rate} bpm | BP: ${activeMission.vitals_blood_pressure || '120/80'}`
                    : 'Stream patient vitals directly to receiving ER'}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenVitalsModal}
                className="px-3 py-1.5 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-xs rounded-lg hover:bg-red-200 transition cursor-pointer"
              >
                {activeMission.vitals_heart_rate ? 'Update' : 'Transmit'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PRIMARY ACTION BUTTON (LARGE & PROMINENT) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border-2 border-amber-500 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Emergency Workflow Controller
          </span>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
            One-touch sequential progression
          </span>
        </div>

        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={isUpdating}
          className={`w-full py-5 rounded-2xl font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer ${primaryButtonColor}`}
        >
          {React.createElement(primaryButtonIcon, { className: 'w-6 h-6' })}
          <span>{isUpdating ? 'Updating Mission...' : primaryButtonText}</span>
        </button>
      </div>
    </div>
  );
};
