import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  Sparkles,
  MapPin,
  RefreshCw,
  Clock,
  Zap,
  Building2,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Crosshair,
  Compass,
  Map as MapIcon,
  Layers,
  Radio,
  AlertTriangle,
  Phone,
  Bed,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { RouteOption, HospitalOption } from '../types';
import { getTrafficBadgeClass, formatMinutes, formatDistance } from '../utils/routeOptimizer';
import { LeafletLiveMap } from './LeafletLiveMap';
import { useLocation } from '../context/LocationContext';

interface RouteMapVisualizerProps {
  originName: string;
  destinationName: string;
  routes: RouteOption[];
  selectedRouteId?: string;
  onSelectRoute?: (routeId: string) => void;
  onRecalculate?: () => void;
  onStartNavigation?: () => void;
  isRecalculating?: boolean;
  stage?: 'TO_PATIENT' | 'TO_HOSPITAL';
  onSwitchStage?: (stage: 'TO_PATIENT' | 'TO_HOSPITAL') => void;
  hospitals?: HospitalOption[];
  selectedHospital?: string;
  onSelectHospital?: (hospitalName: string) => void;
  onNavigateToHospital?: (hospital: HospitalOption) => void;
  onFindNearbyHospitals?: () => void;
  isSearchingHospitals?: boolean;
  hospitalSearchSource?: 'live_places' | 'fallback' | null;
  hospitalSearchMessage?: string | null;
  showSimulationControls?: boolean;
  driverCoords?: { latitude: number; longitude: number; accuracy?: number } | null;
  patientCoords?: { latitude: number; longitude: number } | null;
  isLiveTracking?: boolean;
  gpsPermissionStatus?: 'granted' | 'denied' | 'prompt' | 'unavailable' | 'demo';
  onEnableLiveLocation?: () => void;
  onUseDemoLocation?: () => void;
  onSetManualLocation?: (latitude: number, longitude: number) => void;
  lastGpsTimestamp?: string | null;
}

export const RouteMapVisualizer: React.FC<RouteMapVisualizerProps> = ({
  originName,
  destinationName,
  routes = [],
  selectedRouteId,
  onSelectRoute,
  onRecalculate,
  onStartNavigation,
  isRecalculating = false,
  stage = 'TO_PATIENT',
  onSwitchStage,
  hospitals = [],
  selectedHospital,
  onSelectHospital,
  onNavigateToHospital,
  onFindNearbyHospitals,
  isSearchingHospitals = false,
  hospitalSearchSource,
  hospitalSearchMessage,
  showSimulationControls = true,
  driverCoords,
  patientCoords,
  isLiveTracking = false,
  gpsPermissionStatus = 'prompt',
  onEnableLiveLocation,
  onUseDemoLocation,
  onSetManualLocation,
  lastGpsTimestamp,
}) => {
  const { userCoords } = useLocation();
  const [activeRouteId, setActiveRouteId] = useState<string>(
    selectedRouteId || routes.find((r) => r.isRecommended)?.id || routes[0]?.id || ''
  );
  const [viewMode, setViewMode] = useState<'live_map' | 'schematic'>('live_map');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualLat, setManualLat] = useState<string>('');
  const [manualLng, setManualLng] = useState<string>('');
  const [simulationProgress, setSimulationProgress] = useState<number>(0); // 0 to 1
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [chosenHospitalObj, setChosenHospitalObj] = useState<HospitalOption | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (selectedRouteId) {
      setActiveRouteId(selectedRouteId);
    } else if (routes.length > 0) {
      const rec = routes.find((r) => r.isRecommended) || routes[0];
      setActiveRouteId(rec.id);
    }
  }, [selectedRouteId, routes]);

  useEffect(() => {
    if (selectedHospital && hospitals.length > 0) {
      const found = hospitals.find((h) => h.name === selectedHospital);
      if (found) {
        setChosenHospitalObj((prev) => (prev?.id === found.id ? prev : found));
      }
    } else if (hospitals.length > 0) {
      setChosenHospitalObj((prev) => {
        if (prev) return prev;
        return hospitals.find((h) => h.isRecommended) || hospitals[0] || null;
      });
    }
  }, [selectedHospital, hospitals]);

  const currentRoute = routes.find((r) => r.id === activeRouteId) || routes[0];

  // Simulation animation loop
  useEffect(() => {
    if (!isSimulating) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    const speed = 0.06; // Loop every ~16 seconds for full route

    const animate = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setSimulationProgress((prev) => {
        const next = prev + delta * speed;
        if (next >= 1) {
          return 0; // loop
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSimulating]);

  // Coordinate normalization for SVG Canvas (width: 800, height: 420)
  const svgWidth = 800;
  const svgHeight = 420;

  const refLat = driverCoords?.latitude || patientCoords?.latitude || userCoords?.latitude || currentRoute?.coordinates?.[0]?.[0] || 0;
  const refLng = driverCoords?.longitude || patientCoords?.longitude || userCoords?.longitude || currentRoute?.coordinates?.[0]?.[1] || 0;

  const points = currentRoute?.coordinates && currentRoute.coordinates.length > 0
    ? currentRoute.coordinates
    : refLat && refLng
    ? [
        [refLat, refLng],
        [refLat + 0.005, refLng + 0.006],
        [refLat + 0.012, refLng + 0.014],
        [refLat + 0.020, refLng + 0.022],
      ]
    : [];

  // Compute bounding box
  let minLat = 90;
  let maxLat = -90;
  let minLng = 180;
  let maxLng = -180;

  routes.forEach((r) => {
    r.coordinates?.forEach(([lat, lng]) => {
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });
  });

  if (driverCoords) {
    if (driverCoords.latitude < minLat) minLat = driverCoords.latitude;
    if (driverCoords.latitude > maxLat) maxLat = driverCoords.latitude;
    if (driverCoords.longitude < minLng) minLng = driverCoords.longitude;
    if (driverCoords.longitude > maxLng) maxLng = driverCoords.longitude;
  }
  if (patientCoords) {
    if (patientCoords.latitude < minLat) minLat = patientCoords.latitude;
    if (patientCoords.latitude > maxLat) maxLat = patientCoords.latitude;
    if (patientCoords.longitude < minLng) minLng = patientCoords.longitude;
    if (patientCoords.longitude > maxLng) maxLng = patientCoords.longitude;
  }

  if (minLat >= maxLat) {
    minLat = refLat - 0.03;
    maxLat = refLat + 0.03;
  }
  if (minLng >= maxLng) {
    minLng = refLng - 0.03;
    maxLng = refLng + 0.03;
  }

  // Padding
  const pad = 60;
  const toSvgX = (lng: number) => pad + ((lng - minLng) / (maxLng - minLng || 0.01)) * (svgWidth - pad * 2);
  const toSvgY = (lat: number) => svgHeight - pad - ((lat - minLat) / (maxLat - minLat || 0.01)) * (svgHeight - pad * 2);

  // Generate SVG path strings
  const getSvgPathString = (coords: [number, number][]) => {
    if (!coords || coords.length === 0) return '';
    return coords
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(pt[1]).toFixed(1)} ${toSvgY(pt[0]).toFixed(1)}`)
      .join(' ');
  };

  // Interpolate ambulance position during simulation
  const getInterpolatedPosition = () => {
    if (!points || points.length === 0) return { x: pad, y: svgHeight / 2, angle: 0 };
    if (simulationProgress <= 0) {
      return { x: toSvgX(points[0][1]), y: toSvgY(points[0][0]), angle: 0 };
    }
    if (simulationProgress >= 1) {
      const last = points[points.length - 1];
      return { x: toSvgX(last[1]), y: toSvgY(last[0]), angle: 0 };
    }

    const totalSegments = points.length - 1;
    const currentSegmentIndex = Math.min(
      Math.floor(simulationProgress * totalSegments),
      totalSegments - 1
    );
    const segmentT = (simulationProgress * totalSegments) - currentSegmentIndex;

    const pA = points[currentSegmentIndex];
    const pB = points[currentSegmentIndex + 1];

    const xA = toSvgX(pA[1]);
    const yA = toSvgY(pA[0]);
    const xB = toSvgX(pB[1]);
    const yB = toSvgY(pB[0]);

    const x = xA + (xB - xA) * segmentT;
    const y = yA + (yB - yA) * segmentT;
    const angle = (Math.atan2(yB - yA, xB - xA) * 180) / Math.PI;

    return { x, y, angle };
  };

  const ambPos = getInterpolatedPosition();
  const trafficBadge = getTrafficBadgeClass(currentRoute?.traffic);

  const handleStartNavClick = () => {
    setIsSimulating(true);
    if (onStartNavigation) {
      onStartNavigation();
    }
  };

  return (
    <div id="ai-route-optimization-section" className="bg-slate-900 text-white rounded-2xl border-2 border-blue-500/60 shadow-2xl overflow-hidden my-4">
      {/* Section Header: AI ROUTE OPTIMIZATION */}
      <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <Navigation className="w-6 h-6 animate-pulse text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                AI ROUTE OPTIMIZATION
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Sparkles className="w-3 h-3" /> Live Dynamic Routing
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {stage === 'TO_PATIENT' ? 'Optimized Route to Patient Location' : 'Optimized Transfer to Hospital'}
            </h3>
          </div>
        </div>

        {/* Action Buttons: [Start Navigation] [Recalculate Route] [View Mode Toggle] */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mode Switch: Live Map / Schematic */}
          <div className="bg-slate-900 rounded-xl p-1 border border-slate-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('live_map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'live_map'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Live interactive OpenStreetMap with GPS markers"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Live Map</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('schematic')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'schematic'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Schematic Vector Route HUD"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Route HUD</span>
            </button>
          </div>

          <button
            id="btn-start-navigation"
            type="button"
            onClick={handleStartNavClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-900/40 transition cursor-pointer"
            title="Start live GPS Navigation along the AI-Optimized Route"
          >
            <Navigation className="w-4 h-4" />
            <span>Start Navigation</span>
          </button>

          {onRecalculate && (
            <button
              id="btn-recalculate-route"
              type="button"
              onClick={onRecalculate}
              disabled={isRecalculating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition disabled:opacity-50 cursor-pointer shadow-xs"
              title="Recalculate route based on live traffic updates"
            >
              <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isRecalculating ? 'Recalculating...' : 'Recalculate Route'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Two-Stage Emergency Navigation Pipeline Banner */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 sm:px-5 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Navigation Mode:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSwitchStage && onSwitchStage('TO_PATIENT')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  stage === 'TO_PATIENT'
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-blue-300" />
                <span>STAGE 1: En Route to Patient</span>
                {stage === 'TO_PATIENT' && <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-ping ml-1" />}
              </button>

              <button
                type="button"
                onClick={() => onSwitchStage && onSwitchStage('TO_HOSPITAL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  stage === 'TO_HOSPITAL'
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>STAGE 2: Transfer to Hospital</span>
                {stage === 'TO_HOSPITAL' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping ml-1" />}
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {stage === 'TO_PATIENT'
                ? 'Ambulance Current Location → Patient SOS Incident'
                : 'Patient Location → Selected Emergency Hospital'}
            </span>
          </div>
        </div>
      </div>

      {/* LIVE GPS STATUS & LOCATION BAR */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-5 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status info */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                LIVE GPS STATUS:
              </span>
              {gpsPermissionStatus === 'granted' || (isLiveTracking && gpsPermissionStatus !== 'denied' && gpsPermissionStatus !== 'demo') ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active Live GPS
                </span>
              ) : gpsPermissionStatus === 'demo' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Demo Coordinates Active
                </span>
              ) : gpsPermissionStatus === 'denied' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-500/20 text-red-300 border border-red-500/40">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Location Unavailable / Denied
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-700/60 text-slate-300 border border-slate-600">
                  <Radio className="w-3 h-3 text-slate-400" />
                  Ready to Connect
                </span>
              )}
            </div>

            {/* Coordinates & Accuracy */}
            {driverCoords && (
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 font-mono bg-slate-950/70 px-3 py-1 rounded-lg border border-slate-800">
                <span>
                  📍 <strong>Lat:</strong> {driverCoords.latitude.toFixed(5)}
                </span>
                <span>
                  <strong>Lng:</strong> {driverCoords.longitude.toFixed(5)}
                </span>
                {driverCoords.accuracy && (
                  <span className="text-emerald-400 font-sans font-semibold">
                    (Accuracy: ±{Math.round(driverCoords.accuracy)}m)
                  </span>
                )}
                {lastGpsTimestamp && (
                  <span className="text-[10px] text-slate-500 font-sans">
                    • {lastGpsTimestamp}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Location Toggle Buttons */}
          <div className="flex items-center gap-2">
            {onEnableLiveLocation && (
              <button
                type="button"
                id="btn-enable-live-location"
                onClick={onEnableLiveLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                title="Request device GPS location permissions"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>📍 Enable Live Location</span>
              </button>
            )}

            {onSetManualLocation && (
              <button
                type="button"
                id="btn-set-manual-location"
                onClick={() => setShowManualInput(!showManualInput)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                title="Enter custom coordinates manually"
              >
                <span>✏️ {showManualInput ? 'Close Input' : 'Enter Manually'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Permission Denied / Error banner */}
        {gpsPermissionStatus === 'denied' && (
          <div className="mt-2.5 px-3.5 py-2.5 bg-red-950/50 rounded-xl border border-red-800/50 text-xs text-red-200 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Location permission was denied. Please allow location access in your browser or enter your coordinates manually below.</span>
              </div>
              {onSetManualLocation && (
                <button
                  type="button"
                  onClick={() => setShowManualInput(true)}
                  className="px-2.5 py-1 rounded bg-red-800 hover:bg-red-700 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                >
                  Enter Manually
                </button>
              )}
            </div>
          </div>
        )}

        {/* Manual Location Form Input (when toggled or permission denied) */}
        {showManualInput && onSetManualLocation && (
          <div className="mt-2.5 p-3.5 bg-slate-900/95 rounded-xl border border-slate-700 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-[11px] uppercase tracking-wider">
                Enter Real / Manual Coordinates
              </span>
              <button
                type="button"
                onClick={() => setShowManualInput(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder={driverCoords?.latitude ? String(driverCoords.latitude) : userCoords?.latitude ? String(userCoords.latitude) : 'Latitude'}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white text-xs font-mono outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder={driverCoords?.longitude ? String(driverCoords.longitude) : userCoords?.longitude ? String(userCoords.longitude) : 'Longitude'}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-white text-xs font-mono outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    const lat = parseFloat(manualLat);
                    const lng = parseFloat(manualLng);
                    if (!isNaN(lat) && !isNaN(lng)) {
                      onSetManualLocation(lat, lng);
                      setShowManualInput(false);
                    }
                  }}
                  disabled={!manualLat || !manualLng}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded transition cursor-pointer"
                >
                  Apply Location
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Current Ambulance Location (Origin)
            </span>
            <p className="text-sm font-bold text-slate-100 truncate mt-0.5" title={originName}>
              📍 {originName}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Destination (Patient Incident Location)
            </span>
            <p className="text-sm font-bold text-slate-100 truncate mt-0.5" title={destinationName}>
              📍 {destinationName}
            </p>
          </div>
        </div>
      </div>

      {/* Main Map Visual Canvas: ROUTE MAP / ROUTE VISUALIZATION */}
      {viewMode === 'live_map' ? (
        <LeafletLiveMap
          routes={routes}
          activeRouteId={activeRouteId}
          onSelectRoute={(id) => {
            setActiveRouteId(id);
            if (onSelectRoute) onSelectRoute(id);
          }}
          driverCoords={driverCoords}
          patientCoords={patientCoords}
          originName={originName}
          destinationName={destinationName}
          stage={stage}
          hospitals={hospitals}
          selectedHospital={selectedHospital}
          onSelectHospital={onSelectHospital}
          isLiveTracking={isLiveTracking}
        />
      ) : (
      <div className="relative bg-[#0b1120] w-full h-[280px] sm:h-[360px] select-none overflow-hidden flex items-center justify-center">
        {/* Map Grid Backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent opacity-80 pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent opacity-80 pointer-events-none"></div>

        {/* Dynamic Route SVG Map Layer */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full object-contain filter drop-shadow-md"
        >
          <defs>
            {/* Glow filters */}
            <filter id="glow-primary" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            {/* Green corridor glow */}
            <linearGradient id="greenCorridor" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Render Alternative Inactive Routes first (slate dashed) */}
          {routes
            .filter((r) => r.id !== activeRouteId)
            .map((r) => {
              const pathStr = getSvgPathString(r.coordinates);
              return (
                <g key={r.id} className="cursor-pointer" onClick={() => onSelectRoute && onSelectRoute(r.id)}>
                  {/* Click target hit area */}
                  <path d={pathStr} fill="none" stroke="transparent" strokeWidth="24" />
                  {/* Background line */}
                  <path
                    d={pathStr}
                    fill="none"
                    stroke="#475569"
                    strokeWidth="4"
                    strokeDasharray="6 6"
                    strokeOpacity="0.6"
                    className="hover:stroke-slate-300 transition-colors"
                  />
                </g>
              );
            })}

          {/* Render Selected / AI Recommended Route with glowing pulse */}
          {currentRoute && (
            <g>
              {/* Outer Glow Halo */}
              <path
                d={getSvgPathString(currentRoute.coordinates)}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="10"
                strokeOpacity="0.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Main Corridor Line */}
              <path
                d={getSvgPathString(currentRoute.coordinates)}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow-primary)"
              />
              {/* Animated Direction Flow Particles */}
              <path
                d={getSvgPathString(currentRoute.coordinates)}
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeDasharray="8 16"
                strokeLinecap="round"
                className="animate-[dash_1.5s_linear_infinite]"
              />
            </g>
          )}

          {/* Intermediate Waypoint Dots */}
          {currentRoute?.coordinates?.map((pt, idx) => {
            if (idx === 0 || idx === currentRoute.coordinates.length - 1) return null;
            const cx = toSvgX(pt[1]);
            const cy = toSvgY(pt[0]);
            return (
              <g key={idx}>
                <circle cx={cx} cy={cy} r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
              </g>
            );
          })}

          {/* Origin Marker (Ambulance Base) */}
          {points.length > 0 && (
            <g transform={`translate(${toSvgX(points[0][1])}, ${toSvgY(points[0][0])})`}>
              <circle r="16" fill="#3b82f6" fillOpacity="0.2" className="animate-ping" />
              <circle r="10" fill="#1e40af" stroke="#60a5fa" strokeWidth="2" />
              <text y="24" textAnchor="middle" fill="#93c5fd" fontSize="11" fontWeight="600">
                Ambulance Base
              </text>
            </g>
          )}

          {/* Destination Marker (Patient SOS or Hospital) */}
          {points.length > 0 && (
            <g transform={`translate(${toSvgX(points[points.length - 1][1])}, ${toSvgY(points[points.length - 1][0])})`}>
              <circle
                r="18"
                fill={stage === 'TO_PATIENT' ? '#ef4444' : '#10b981'}
                fillOpacity="0.25"
                className="animate-ping"
              />
              <circle
                r="12"
                fill={stage === 'TO_PATIENT' ? '#dc2626' : '#059669'}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <text
                y="26"
                textAnchor="middle"
                fill={stage === 'TO_PATIENT' ? '#fca5a5' : '#6ee7b7'}
                fontSize="11"
                fontWeight="700"
              >
                {stage === 'TO_PATIENT' ? 'Patient Location' : 'Hospital Destination'}
              </text>
            </g>
          )}

          {/* Simulated Moving Ambulance Vehicle on Canvas */}
          {points.length > 0 && (
            <g
              transform={`translate(${ambPos.x}, ${ambPos.y}) rotate(${ambPos.angle})`}
              className="transition-transform duration-75"
            >
              {/* Siren Pulse Wave */}
              <circle r="20" fill="#ef4444" fillOpacity="0.2" className="animate-ping" />
              {/* Vehicle Body Base */}
              <rect
                x="-12"
                y="-7"
                width="24"
                height="14"
                rx="3"
                fill="#ffffff"
                stroke="#1e293b"
                strokeWidth="1.5"
              />
              {/* Red Cross / Siren */}
              <rect x="-1" y="-5" width="2" height="10" fill="#ef4444" />
              <rect x="-5" y="-1" width="10" height="2" fill="#ef4444" />
              {/* Flashing Blue/Red Emergency Beacon */}
              <circle cx="2" cy="0" r="2.5" fill="#3b82f6" className="animate-pulse" />
            </g>
          )}
        </svg>

        {/* Map Floating Badges: Live Route ETA and Traffic Overlay */}
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-3 text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active ETA</div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              {formatMinutes(currentRoute?.estimatedMinutes || 8)}
            </div>
          </div>
          <div className="w-[1px] h-6 bg-slate-700" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Distance</div>
            <div className="text-sm font-bold text-slate-200">
              {formatDistance(currentRoute?.distanceKm || 3.2)}
            </div>
          </div>
          <div className="w-[1px] h-6 bg-slate-700" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Traffic Flow</div>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${trafficBadge.bg} ${trafficBadge.text} ${trafficBadge.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${trafficBadge.indicator}`} />
              {currentRoute?.traffic || 'Low'}
            </span>
          </div>
        </div>

        {/* Green Corridor Status Banner */}
        <div className="absolute bottom-3 right-3 bg-emerald-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/40 shadow-lg flex items-center gap-2 text-xs text-emerald-300">
          <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-semibold">AI Green Corridor Priority Active</span>
        </div>

        {/* Simulation Control Overlay */}
        {showSimulationControls && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/80 shadow-lg">
            <button
              id="btn-toggle-route-sim"
              onClick={() => setIsSimulating(!isSimulating)}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title={isSimulating ? 'Pause Route Simulation' : 'Play Live Ambulance Movement Simulation'}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating ? 'Pause' : 'Live Sim'}</span>
            </button>
            <button
              id="btn-reset-route-sim"
              onClick={() => {
                setIsSimulating(false);
                setSimulationProgress(0);
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 transition text-xs cursor-pointer"
              title="Reset Ambulance to Base"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      )}

      {/* 🤖 AI RECOMMENDED ROUTE DETAILS BOX */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-950/70 via-slate-900 to-slate-950 border-t border-b border-blue-900/60">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-black uppercase tracking-wider text-blue-300">
            🤖 AI RECOMMENDED ROUTE
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Route description */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:col-span-2 lg:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Route
            </span>
            <p className="text-sm font-bold text-white mt-0.5">
              {currentRoute?.name || 'Corridor Alpha'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {currentRoute?.summary || 'Optimized rapid corridor'}
            </p>
          </div>

          {/* 2. Estimated Arrival */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Estimated Arrival
            </span>
            <p className="text-sm font-bold text-blue-300 mt-0.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>{formatMinutes(currentRoute?.estimatedMinutes || 8)}</span>
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Live traffic ETA</span>
          </div>

          {/* 3. Distance */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Distance
            </span>
            <p className="text-sm font-bold text-slate-100 mt-0.5">
              {formatDistance(currentRoute?.distanceKm || 3.2)}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Direct transit arc</span>
          </div>

          {/* 4. Traffic */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Traffic
            </span>
            <div className="mt-1">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${trafficBadge.bg} ${trafficBadge.text} ${trafficBadge.border}`}
              >
                <span className={`w-2 h-2 rounded-full ${trafficBadge.indicator}`} />
                <span>{currentRoute?.traffic || 'Low'} Congestion</span>
              </span>
            </div>
          </div>
        </div>

        {/* Reason block */}
        <div className="mt-3 px-3.5 py-2.5 bg-blue-950/40 rounded-xl border border-blue-800/40 flex items-start gap-2.5 text-xs text-blue-200">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-blue-300">Reason: </span>
            <span>Recommended based on travel time, distance and traffic conditions. {currentRoute?.recommendationReason ? `(${currentRoute.recommendationReason})` : ''}</span>
          </div>
        </div>
      </div>

      {/* Alternative Route Options Selection Cards */}
      <div className="p-4 sm:p-5 bg-slate-950/60">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Evaluated Route Candidates ({routes.length})
          </h4>
          <span className="text-[11px] text-slate-500">Click any route card to inspect & switch</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {routes.map((r, index) => {
            const isSelected = r.id === activeRouteId;
            const badge = getTrafficBadgeClass(r.traffic);

            return (
              <div
                key={r.id}
                id={`route-card-${r.id}`}
                onClick={() => {
                  setActiveRouteId(r.id);
                  if (onSelectRoute) onSelectRoute(r.id);
                }}
                className={`relative p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-blue-950/50 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {/* Recommended Badge */}
                {r.isRecommended && (
                  <div className="absolute -top-2.5 right-3 bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider shadow">
                    AI Recommended
                  </div>
                )}

                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    {r.name}
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-1 mb-2.5">{r.summary}</p>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1 font-bold text-slate-200">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>{formatMinutes(r.estimatedMinutes)}</span>
                  </div>
                  <div className="text-slate-400 font-medium">{formatDistance(r.distanceKm)}</div>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.indicator}`} />
                    {r.traffic}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real Nearby Hospitals Section & Stage 2 Transition */}
      <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                Nearby Hospitals Directory
              </h4>
              {hospitalSearchSource === 'live_places' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Live Places API
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Global Emergency Network
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time emergency centers sorted by proximity, route transit time, and trauma capacity.
            </p>
          </div>

          {/* [ 🏥 Find Nearby Hospitals ] Button */}
          {onFindNearbyHospitals && (
            <button
              type="button"
              id="btn-find-nearby-hospitals"
              onClick={onFindNearbyHospitals}
              disabled={isSearchingHospitals}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/50 transition cursor-pointer disabled:opacity-50 shrink-0"
              title="Query live hospital locations using GPS coordinates"
            >
              <Search className={`w-4 h-4 ${isSearchingHospitals ? 'animate-spin' : ''}`} />
              <span>{isSearchingHospitals ? 'Searching Hospitals...' : '🏥 Find Nearby Hospitals'}</span>
            </button>
          )}
        </div>

        {/* Fallback Notice message if applicable */}
        {hospitalSearchSource === 'fallback' && (
          <div className="mb-3.5 px-3 py-2 bg-amber-950/30 rounded-xl border border-amber-800/40 flex items-center gap-2 text-xs text-amber-200/90">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Live hospital search requires Maps/Places API configuration. Using verified regional emergency trauma centers.
            </span>
          </div>
        )}

        {/* Hospital Cards Grid */}
        {hospitals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {hospitals.map((h, idx) => {
              const isChosen = chosenHospitalObj?.name === h.name || selectedHospital === h.name;
              const hBadge = getTrafficBadgeClass(h.traffic);

              return (
                <div
                  key={h.id || idx}
                  id={`hosp-option-${h.id || idx}`}
                  onClick={() => {
                    setChosenHospitalObj(h);
                    if (onSelectHospital) onSelectHospital(h.name);
                  }}
                  className={`relative p-3.5 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                    isChosen
                      ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    {/* Header: Name + Badge */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-bold text-sm text-white line-clamp-1">
                        {idx + 1}. {h.name}
                      </div>
                      {h.isRecommended && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[9px] font-black uppercase shrink-0">
                          Apex Match
                        </span>
                      )}
                    </div>

                    {/* Specialty / Type */}
                    <div className="text-xs text-emerald-400 font-semibold mb-1">
                      {h.specialty || h.type || 'Multi-Specialty Trauma Center'}
                    </div>

                    {/* Emergency Ward Capacity Status Badge */}
                    <div className="mb-2">
                      {h.ward_capacity === 'FULL' || h.emergencyWardCapacity === 'FULL' || h.availableEmergencyBeds === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950/80 border border-red-800 text-red-400 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          Emergency Ward: FULL (Diversion)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Emergency Ward: Available ({h.availableEmergencyBeds || 12} Beds)
                        </span>
                      )}
                    </div>

                    {/* Address */}
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                      {h.address}
                    </p>
                  </div>

                  <div>
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-slate-800/80 mb-3">
                      <div className="flex items-center gap-1.5 font-bold text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{formatMinutes(h.estimatedMinutes)}</span>
                      </div>
                      <div className="text-slate-400 text-right font-medium">
                        {formatDistance(h.distanceKm)}
                      </div>
                      <div className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
                        <Bed className="w-3 h-3 text-blue-400" />
                        <span>{h.availableEmergencyBeds || 12} ICU Beds</span>
                      </div>
                      {h.phone && (
                        <div className="text-[11px] text-slate-400 text-right truncate">
                          ☎ {h.phone}
                        </div>
                      )}
                    </div>

                    {/* Select Hospital Button */}
                    <button
                      type="button"
                      id={`btn-select-hospital-${h.id || idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setChosenHospitalObj(h);
                        if (onSelectHospital) onSelectHospital(h.name);
                      }}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isChosen
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isChosen ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selected Hospital</span>
                        </>
                      ) : (
                        <span>Select Hospital</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 bg-slate-900/60 rounded-xl border border-slate-800 mb-4">
            <Building2 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">
              No hospital options loaded yet. Click <strong>Find Nearby Hospitals</strong> to query real facilities.
            </p>
          </div>
        )}

        {/* Selected Hospital Action Footer: [ 🧭 Navigate to Selected Hospital ] */}
        {chosenHospitalObj && (
          <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Selected Transfer Destination:
              </span>
              <div className="font-bold text-sm text-white flex items-center gap-2 mt-0.5">
                <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{chosenHospitalObj.name}</span>
                <span className="text-xs text-slate-400 font-normal">
                  ({formatDistance(chosenHospitalObj.distanceKm)} • {formatMinutes(chosenHospitalObj.estimatedMinutes)})
                </span>
              </div>
            </div>

            {onNavigateToHospital && (
              <button
                type="button"
                id="btn-navigate-to-selected-hospital"
                onClick={() => onNavigateToHospital(chosenHospitalObj)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Compass className="w-4 h-4" />
                <span>🧭 Navigate to Selected Hospital</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
