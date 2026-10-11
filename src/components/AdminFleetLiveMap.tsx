import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from '../utils/leafletPatch';
import { Ambulance, EmergencyRequest } from '../types';
import { api } from '../services/api';
import { socketService, AmbulanceLocationData } from '../services/socketService';
import { createBaseTileLayer, isValidLatLng, sanitizeCoordinates, BENGALURU_DEFAULT_COORDS } from '../utils/mapConfig';
import {
  Truck,
  MapPin,
  Crosshair,
  RefreshCw,
  Navigation,
  Radio,
  Clock,
  Phone,
  User,
  ShieldCheck,
  Filter,
  Maximize2
} from 'lucide-react';

interface AdminFleetLiveMapProps {
  initialAmbulances?: Ambulance[];
  onSelectAmbulance?: (amb: Ambulance) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminFleetLiveMap: React.FC<AdminFleetLiveMapProps> = ({
  initialAmbulances = [],
  onSelectAmbulance,
  showToast,
}) => {
  const [ambulances, setAmbulances] = useState<Ambulance[]>(initialAmbulances);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'AVAILABLE' | 'ASSIGNED'>('ALL');
  const [adminCoords, setAdminCoords] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [isLocatingAdmin, setIsLocatingAdmin] = useState(false);
  const [lastStreamTime, setLastStreamTime] = useState<string>('Live Connected');
  const [activeSocketCount, setActiveSocketCount] = useState<number>(0);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const adminMarkerRef = useRef<L.Marker | null>(null);

  // Sync initial ambulances prop
  useEffect(() => {
    if (initialAmbulances && initialAmbulances.length > 0) {
      setAmbulances((prev) => (prev.length === 0 ? initialAmbulances : prev));
    }
  }, [initialAmbulances]);

  // Fetch latest fleet and active emergencies
  const fetchFleetData = useCallback(async () => {
    try {
      const [ambRes, reqRes] = await Promise.all([
        api.getAmbulances(),
        api.getEmergencies(),
      ]);
      if (ambRes && ambRes.ambulances) {
        setAmbulances(ambRes.ambulances);
      }
      if (reqRes && reqRes.emergencies) {
        setEmergencies(reqRes.emergencies.filter((e) => !['COMPLETED', 'CANCELLED'].includes(e.status)));
      }
    } catch (err) {
      console.warn('Failed to fetch fleet data:', err);
    }
  }, []);

  useEffect(() => {
    fetchFleetData();
    const interval = setInterval(fetchFleetData, 5000);
    return () => clearInterval(interval);
  }, [fetchFleetData]);

  // Listen to live socket location broadcasts
  useEffect(() => {
    const unsub = socketService.onAmbulanceLocationUpdate((data: AmbulanceLocationData) => {
      setLastStreamTime(new Date().toLocaleTimeString());
      setActiveSocketCount((c) => c + 1);

      setAmbulances((prev) => {
        const idx = prev.findIndex((a) => a.id === data.ambulanceId);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            current_latitude: data.latitude,
            current_longitude: data.longitude,
            last_gps_update: data.timestamp || new Date().toISOString(),
          };
          return updated;
        }
        return prev;
      });
    });

    return () => {
      unsub();
    };
  }, []);

  // Request browser geolocation for Admin Command center
  const requestAdminLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast?.('Browser geolocation is not supported on this device', 'error');
      return;
    }

    setIsLocatingAdmin(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingAdmin(false);
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setAdminCoords(coords);
        showToast?.('Admin Command location synchronized via browser GPS', 'success');

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([coords.latitude, coords.longitude], 14, { duration: 1.2 });
        }
      },
      (err) => {
        setIsLocatingAdmin(false);
        console.warn('Admin geolocation error:', err.message);
        showToast?.('Unable to retrieve GPS location: ' + err.message, 'info');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  }, [showToast]);

  // Request location on first mount
  useEffect(() => {
    if (navigator.geolocation && !adminCoords) {
      requestAdminLocation();
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      const initialCenter: [number, number] = adminCoords
        ? [adminCoords.latitude, adminCoords.longitude]
        : BENGALURU_DEFAULT_COORDS;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 12,
        zoomControl: false,
        attributionControl: true,
      });

      // Free OpenStreetMap base layer (Zero watermark, guaranteed)
      createBaseTileLayer().addTo(map);

      // Dedicated layer group for fleet markers
      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;

      mapInstanceRef.current = map;

      // Invalidate map size after animation render
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
        adminMarkerRef.current = null;
      }
    };
  }, []);

  // Render Admin Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (adminCoords && isValidLatLng(adminCoords.latitude, adminCoords.longitude)) {
      const icon = L.divIcon({
        className: 'admin-marker-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></span>
            <div class="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-md flex items-center justify-center text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (!adminMarkerRef.current) {
        const marker = L.marker([adminCoords.latitude, adminCoords.longitude], { icon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-2 text-xs font-sans">
              <div class="font-bold text-blue-700">📍 Admin Command Center</div>
              <div class="text-slate-500 mt-1">Live Device Geolocation</div>
              <div class="text-[10px] text-slate-400 font-mono mt-0.5">
                ${adminCoords.latitude.toFixed(4)}, ${adminCoords.longitude.toFixed(4)}
              </div>
            </div>
          `);
        adminMarkerRef.current = marker;
      } else {
        adminMarkerRef.current.setLatLng([adminCoords.latitude, adminCoords.longitude]);
      }
    }
  }, [adminCoords]);

  // Filter ambulances
  const filteredAmbulances = ambulances.filter((amb) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return amb.status === 'AVAILABLE' || amb.status === 'ASSIGNED';
    if (filterStatus === 'AVAILABLE') return amb.status === 'AVAILABLE';
    if (filterStatus === 'ASSIGNED') return amb.status === 'ASSIGNED' || amb.status === 'BUSY';
    return true;
  });

  // Render Ambulance Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    const bounds: [number, number][] = [];

    if (adminCoords && isValidLatLng(adminCoords.latitude, adminCoords.longitude)) {
      bounds.push([adminCoords.latitude, adminCoords.longitude]);
    }

    filteredAmbulances.forEach((amb) => {
      // Determine coordinates: use current_latitude/longitude, or fall back to known regional spots
      let lat = amb.current_latitude;
      let lng = amb.current_longitude;

      if (!isValidLatLng(lat, lng)) {
        // Fallback realistic Bangalore coordinates based on ambulance id
        const offsets = [
          [12.9716, 77.5946],
          [12.9784, 77.6408],
          [12.9250, 77.5938],
          [12.8950, 77.5975],
          [12.9582, 77.6485],
          [12.9860, 77.5970],
        ];
        const offset = offsets[(amb.id - 1) % offsets.length];
        lat = offset[0];
        lng = offset[1];
      }

      bounds.push([lat, lng]);

      // Linked emergency if assigned
      const linkedEmergency = emergencies.find((e) => e.ambulance_id === amb.id);

      const isAvailable = amb.status === 'AVAILABLE';
      const isAssigned = amb.status === 'ASSIGNED' || amb.status === 'BUSY';
      const isMaintenance = amb.status === 'MAINTENANCE';

      const colorBg = isAvailable
        ? 'bg-emerald-600'
        : isAssigned
        ? 'bg-amber-600'
        : isMaintenance
        ? 'bg-slate-600'
        : 'bg-blue-600';

      const pingRing = isAssigned
        ? '<span class="absolute -inset-1 rounded-full bg-amber-400/40 animate-ping"></span>'
        : isAvailable
        ? '<span class="absolute -inset-0.5 rounded-full bg-emerald-400/30 animate-pulse"></span>'
        : '';

      const iconHtml = `
        <div class="relative flex flex-col items-center cursor-pointer group">
          ${pingRing}
          <div class="w-8 h-8 rounded-xl ${colorBg} border-2 border-white shadow-lg flex items-center justify-center text-white transform transition-transform group-hover:scale-110">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
          </div>
          <div class="mt-0.5 px-1.5 py-0.5 rounded bg-slate-900/90 text-[9px] font-mono font-bold text-white shadow-sm whitespace-nowrap">
            ${amb.vehicle_number}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'ambulance-map-marker',
        html: iconHtml,
        iconSize: [40, 52],
        iconAnchor: [20, 26],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Popup Content
      const popupHtml = `
        <div class="p-2 min-w-[200px] font-sans">
          <div class="flex items-center justify-between gap-2 border-b pb-1.5 mb-1.5">
            <span class="font-mono font-bold text-xs text-slate-900">${amb.vehicle_number}</span>
            <span class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
              isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }">
              ${amb.status}
            </span>
          </div>
          <div class="text-[11px] text-slate-600 mb-1">
            <strong>Driver:</strong> ${amb.driver_name}
          </div>
          <div class="text-[11px] text-slate-600 mb-1">
            <strong>Contact:</strong> ${amb.phone}
          </div>
          <div class="text-[11px] text-slate-600 mb-1">
            <strong>Type:</strong> ${amb.type}
          </div>
          <div class="text-[10px] text-slate-400 font-mono">
            GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </div>
          ${
            linkedEmergency
              ? `<div class="mt-2 pt-1.5 border-t text-[10px] text-red-600 font-bold">
                   🚨 Active SOS #${linkedEmergency.id}: ${linkedEmergency.emergency_type}
                 </div>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setSelectedAmbulance(amb);
        onSelectAmbulance?.(amb);
      });

      markersGroupRef.current?.addLayer(marker);
    });

    // Auto-fit bounds if we have valid positions and user hasn't panned
    if (bounds.length > 0 && mapInstanceRef.current) {
      try {
        const leafletBounds = L.latLngBounds(bounds);
        mapInstanceRef.current.fitBounds(leafletBounds, { padding: [40, 40], maxZoom: 14 });
      } catch {
        // Fallback to default center if bounds calculation is constrained
      }
    }
  }, [filteredAmbulances, emergencies, adminCoords, onSelectAmbulance]);

  // Fit all ambulances button handler
  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const coordsList: [number, number][] = filteredAmbulances
      .filter((a) => isValidLatLng(a.current_latitude, a.current_longitude))
      .map((a) => [a.current_latitude!, a.current_longitude!]);

    if (adminCoords && isValidLatLng(adminCoords.latitude, adminCoords.longitude)) {
      coordsList.push([adminCoords.latitude, adminCoords.longitude]);
    }

    if (coordsList.length > 0) {
      const bounds = L.latLngBounds(coordsList);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      mapInstanceRef.current.setView(BENGALURU_DEFAULT_COORDS, 12);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Header Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ambulance Fleet Live Map
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live GPS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live tracking of all {ambulances.length} registered ambulance units with driver telemetry
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({ambulances.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('AVAILABLE')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterStatus === 'AVAILABLE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
              }`}
            >
              Available ({ambulances.filter((a) => a.status === 'AVAILABLE').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('ASSIGNED')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterStatus === 'ASSIGNED'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
              }`}
            >
              On Mission ({ambulances.filter((a) => a.status === 'ASSIGNED' || a.status === 'BUSY').length})
            </button>
          </div>

          {/* Browser Geolocation Button */}
          <button
            type="button"
            onClick={requestAdminLocation}
            disabled={isLocatingAdmin}
            title="Locate Admin Command Center using browser GPS"
            className="p-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Crosshair className={`w-4 h-4 text-blue-600 dark:text-blue-400 ${isLocatingAdmin ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Locate Me</span>
          </button>

          {/* Fit All Bounds Button */}
          <button
            type="button"
            onClick={handleFitAll}
            title="Fit map to all active ambulances"
            className="p-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Fit Fleet</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchFleetData}
            title="Refresh GPS positions"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative isolate z-0">
        <div
          ref={mapContainerRef}
          id="admin-leaflet-fleet-map"
          className="w-full h-[400px] sm:h-[480px] bg-slate-100 dark:bg-slate-950 z-0"
        />

        {/* Overlay Telemetry HUD (Bottom Bar) */}
        <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 px-3 rounded-xl bg-slate-900/90 backdrop-blur-md text-white border border-slate-800 text-xs pointer-events-auto shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-[11px] text-slate-200">
                  {filteredAmbulances.length} Units Shown
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>Last GPS broadcast: {lastStreamTime}</span>
              </div>
              {adminCoords && (
                <div className="hidden md:flex items-center gap-1 text-[11px] text-blue-300">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Admin GPS Active (±{Math.round(adminCoords.accuracy || 15)}m)</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">Map: OpenStreetMap (Zero Watermark)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Ambulance Info Card (if clicked) */}
      {selectedAmbulance && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  {selectedAmbulance.vehicle_number}
                </h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedAmbulance.status === 'AVAILABLE'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {selectedAmbulance.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedAmbulance.type} • Base: {selectedAmbulance.base_location}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{selectedAmbulance.driver_name}</span>
            </div>
            <a
              href={`tel:${selectedAmbulance.phone}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{selectedAmbulance.phone}</span>
            </a>
            <button
              type="button"
              onClick={() => setSelectedAmbulance(null)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
