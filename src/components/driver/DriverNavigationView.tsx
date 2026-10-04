import React from 'react';
import { 
  Navigation, 
  RotateCcw, 
  Play, 
  Square, 
  MapPin, 
  Hospital, 
  Compass, 
  Volume2, 
  VolumeX, 
  Activity, 
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { EmergencyRequest, Ambulance, HospitalOption, RouteOption } from '../../types';
import { RouteMapVisualizer } from '../RouteMapVisualizer';
import { VoiceNavigationHUD } from '../VoiceNavigationHUD';
import { LiveFleetRadar } from '../LiveFleetRadar';
import { generateClientFallbackRoutes } from '../../utils/routeOptimizer';

interface DriverNavigationViewProps {
  activeMission: EmergencyRequest | null;
  selectedAmbulance: Ambulance | null;
  driverCoords: {
    latitude: number;
    longitude: number;
    speed?: number | null;
    heading?: number | null;
    accuracy?: number;
  } | null;
  isTrackingGPS: boolean;
  gpsPermissionStatus: 'granted' | 'denied' | 'prompt' | 'unavailable' | 'demo';
  lastGpsTimestamp: string | null;
  onEnableLiveLocation: () => void;
  onSetManualLocation: (lat: number, lng: number) => void;
  onRecalculateRoute: (emergencyId: number) => void;
  isRecalculatingRoute: boolean;
  onSelectRoute: (emergencyId: number, routeId: string) => void;
  onSelectHospital: (emergencyId: number, hospitalName: string) => void;
  onFindNearbyHospitals: (emergencyId: number) => void;
  onNavigateToHospital: (emergencyId: number, hospital: HospitalOption) => void;
  isSearchingHospitals: boolean;
  hospitalSearchSource: 'live_places' | 'fallback' | null;
  hospitalSearchMessage: string | null;
  onSwitchStage: (emergencyId: number, newStage: 'TO_PATIENT' | 'TO_HOSPITAL') => void;
  onUpdateStatus: (emergencyId: number, nextStatus: any) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DriverNavigationView: React.FC<DriverNavigationViewProps> = ({
  activeMission,
  selectedAmbulance,
  driverCoords,
  isTrackingGPS,
  gpsPermissionStatus,
  lastGpsTimestamp,
  onEnableLiveLocation,
  onSetManualLocation,
  onRecalculateRoute,
  isRecalculatingRoute,
  onSelectRoute,
  onSelectHospital,
  onFindNearbyHospitals,
  onNavigateToHospital,
  isSearchingHospitals,
  hospitalSearchSource,
  hospitalSearchMessage,
  onSwitchStage,
  onUpdateStatus,
  showToast,
}) => {
  // If no active mission, show live GPS standby radar with vehicle position
  if (!activeMission) {
    return (
      <div id="driver-navigation-standby" className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Compass className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Live GPS Standby Radar
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Broadcasting ambulance telemetry • No active dispatch route currently active
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onEnableLiveLocation}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Re-calibrate Live GPS</span>
          </button>
        </div>

        <LiveFleetRadar
          title="Regional Live Fleet Radar & Hospitals"
          subtitle="Real-time map view of all ambulances and emergency medical centers."
          heightClass="h-[520px] sm:h-[600px]"
          showEmergencyCta={false}
        />
      </div>
    );
  }

  // Active mission navigation parameters
  const routesToDisplay: RouteOption[] =
    activeMission.routes && activeMission.routes.length > 0
      ? activeMission.routes
      : activeMission.optimized_routes && activeMission.optimized_routes.length > 0
      ? activeMission.optimized_routes
      : generateClientFallbackRoutes(
          selectedAmbulance?.base_location || 'Ambulance Base Station',
          activeMission.location || 'Incident Location',
          activeMission.emergency_type || 'General Emergency'
        );

  const activeStage =
    (activeMission.navigation_stage as 'TO_PATIENT' | 'TO_HOSPITAL') ||
    (activeMission.status === 'REACHED' ? 'TO_HOSPITAL' : 'TO_PATIENT');

  const destinationName =
    activeStage === 'TO_HOSPITAL' && activeMission.hospital_destination
      ? activeMission.hospital_destination
      : activeMission.location;

  const selectedRoute =
    routesToDisplay.find((r) => r.id === (activeMission.selected_route_id || routesToDisplay[0]?.id)) ||
    routesToDisplay[0] ||
    null;

  return (
    <div id="driver-navigation-view" className="space-y-6">
      {/* 1. TOP NAV CONTROL STRIP */}
      <div className="bg-[#0f172a] dark:bg-slate-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                {activeStage === 'TO_PATIENT' ? 'STAGE 1: TO PATIENT' : 'STAGE 2: TO HOSPITAL'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ETA: {selectedRoute?.estimatedMinutes ? `${selectedRoute.estimatedMinutes} mins` : '12 mins'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 truncate max-w-md">
              En Route to {destinationName}
            </h2>
          </div>
        </div>

        {/* Quick Route Recalculate & Stage Switch Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onRecalculateRoute(activeMission.id)}
            disabled={isRecalculatingRoute}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRecalculatingRoute ? 'animate-spin' : ''}`} />
            <span>{isRecalculatingRoute ? 'Calculating...' : 'Recalculate Route'}</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchStage(activeMission.id, activeStage === 'TO_PATIENT' ? 'TO_HOSPITAL' : 'TO_PATIENT')}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Switch to {activeStage === 'TO_PATIENT' ? 'Stage 2 (Hospital)' : 'Stage 1 (Patient)'}</span>
          </button>
        </div>
      </div>

      {/* 2. VOICE NAVIGATION HUD (TURN-BY-TURN GUIDANCE) */}
      <div id="driver-navigation-voice-hud">
        <VoiceNavigationHUD
          route={selectedRoute}
          stage={activeStage}
          destinationName={destinationName}
          isMissionAccepted={['DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED'].includes(activeMission.status)}
          driverCoords={driverCoords}
          patientCoords={
            activeMission.latitude && activeMission.longitude
              ? { latitude: activeMission.latitude, longitude: activeMission.longitude }
              : activeMission.patient_latitude && activeMission.patient_longitude
              ? { latitude: activeMission.patient_latitude, longitude: activeMission.patient_longitude }
              : null
          }
          activeMission={activeMission}
          availableHospitals={activeMission.hospital_options || []}
          onSelectHospital={(hospName) => onSelectHospital(activeMission.id, hospName)}
          onNavigateToHospital={(hosp) => onNavigateToHospital(activeMission.id, hosp)}
          onRouteRecalculateNeeded={() => onRecalculateRoute(activeMission.id)}
          onStartNavigation={() => {
            if (activeMission.status === 'DRIVER_ACCEPTED') {
              onUpdateStatus(activeMission.id, 'ON_THE_WAY');
            } else {
              showToast('Turn-by-turn navigation actively following current route', 'info');
            }
          }}
          onMarkReached={() => onUpdateStatus(activeMission.id, 'REACHED')}
          onUpdateStatus={(nextStatus) => onUpdateStatus(activeMission.id, nextStatus)}
          onShowRoute={() => {
            const el = document.getElementById('driver-navigation-map-wrapper');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          missionStatus={activeMission.status}
          showToast={showToast}
        />
      </div>

      {/* 3. LARGE LIVE MAP WITH REAL ROAD ROUTE & TRAFFIC CORRIDORS */}
      <div id="driver-navigation-map-wrapper" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
        <RouteMapVisualizer
          originName={
            driverCoords && driverCoords.latitude
              ? `GPS [${driverCoords.latitude.toFixed(4)}, ${driverCoords.longitude.toFixed(4)}]`
              : selectedAmbulance?.base_location || 'Ambulance Station'
          }
          destinationName={destinationName}
          routes={routesToDisplay}
          selectedRouteId={activeMission.selected_route_id || routesToDisplay[0]?.id}
          onSelectRoute={(routeId) => onSelectRoute(activeMission.id, routeId)}
          onRecalculate={() => onRecalculateRoute(activeMission.id)}
          onStartNavigation={() => {
            if (activeMission.status === 'DRIVER_ACCEPTED') {
              onUpdateStatus(activeMission.id, 'ON_THE_WAY');
            } else {
              showToast('Live GPS Navigation tracking along active route', 'info');
            }
          }}
          isRecalculating={isRecalculatingRoute}
          stage={activeStage}
          onSwitchStage={(newStage) => onSwitchStage(activeMission.id, newStage)}
          hospitals={activeMission.hospital_options || []}
          selectedHospital={activeMission.hospital_destination}
          onSelectHospital={(hospName) => onSelectHospital(activeMission.id, hospName)}
          onFindNearbyHospitals={() => onFindNearbyHospitals(activeMission.id)}
          onNavigateToHospital={(hosp) => onNavigateToHospital(activeMission.id, hosp)}
          isSearchingHospitals={isSearchingHospitals}
          hospitalSearchSource={hospitalSearchSource}
          hospitalSearchMessage={hospitalSearchMessage}
          showSimulationControls={true}
          driverCoords={driverCoords}
          patientCoords={
            activeMission.latitude && activeMission.longitude
              ? { latitude: activeMission.latitude, longitude: activeMission.longitude }
              : activeMission.patient_latitude && activeMission.patient_longitude
              ? { latitude: activeMission.patient_latitude, longitude: activeMission.patient_longitude }
              : null
          }
          isLiveTracking={isTrackingGPS}
          gpsPermissionStatus={gpsPermissionStatus}
          onEnableLiveLocation={onEnableLiveLocation}
          onSetManualLocation={onSetManualLocation}
          lastGpsTimestamp={lastGpsTimestamp}
        />
      </div>
    </div>
  );
};
