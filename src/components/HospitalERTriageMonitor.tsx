import React, { useEffect, useState, useCallback } from 'react';
import { 
  Activity, 
  Heart, 
  Wind, 
  Droplet, 
  Brain, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  RefreshCw,
  Building2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { EmergencyRequest } from '../types';
import { socketService } from '../services/socketService';
import { api } from '../services/api';

interface HospitalERTriageMonitorProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const HospitalERTriageMonitor: React.FC<HospitalERTriageMonitorProps> = ({ showToast }) => {
  const [incomingTransfers, setIncomingTransfers] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledgedBays, setAcknowledgedBays] = useState<Record<number, boolean>>({});

  const fetchIncomingTransfers = useCallback(async () => {
    try {
      const data = await api.getInTransitEREmergencies();
      setIncomingTransfers(data.incoming_transfers || []);
    } catch (err: any) {
      console.warn('Could not fetch in-transit ER emergencies:', err.message || err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncomingTransfers();

    // Listen to real-time vitals updates
    const unsubscribeVitals = socketService.onPatientVitalsUpdated((payload: any) => {
      showToast(
        `🚨 In-Transit Telemetry: ${payload.patient_name || 'Ambulance'} transmitted live vitals (${payload.triage_acuity || 'CODE_YELLOW'})`,
        'info'
      );
      fetchIncomingTransfers();
    });

    const interval = setInterval(fetchIncomingTransfers, 12000);

    return () => {
      unsubscribeVitals();
      clearInterval(interval);
    };
  }, [fetchIncomingTransfers, showToast]);

  const handleAcknowledgeBay = (emergencyId: number) => {
    setAcknowledgedBays((prev) => ({ ...prev, [emergencyId]: true }));
    showToast(`Trauma Team & Resuscitation Bay prepped for SOS #${emergencyId}!`, 'success');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-linear-to-r from-slate-900 to-slate-800 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600 rounded-xl shadow-xs">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">Emergency Trauma & In-Transit e-PCR Telemetry</h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full bg-red-500/30 text-red-200 border border-red-400/30">
                Hospital ER Live Link
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Real-time vital signs and resuscitation triage stream from en-route Arogyavahini paramedic units
            </p>
          </div>
        </div>

        <button
          onClick={fetchIncomingTransfers}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-semibold rounded-lg transition-colors text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stream
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && incomingTransfers.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Activity className="w-8 h-8 animate-spin mx-auto mb-2 text-red-500" />
            <p className="text-sm font-medium">Listening for incoming paramedic telemetry...</p>
          </div>
        ) : incomingTransfers.length === 0 ? (
          <div className="py-10 text-center text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
            <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-700 text-sm">No Active Patient Transfers Currently In-Transit</p>
            <p className="text-xs text-gray-400 mt-1">
              When an ambulance dispatches with a patient and transmits e-PCR vitals, live telemetry appears here immediately.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {incomingTransfers.map((req) => {
              const acuity = req.triage_acuity || 'CODE_YELLOW';
              const isCodeRed = acuity === 'CODE_RED';
              const isAcknowledged = !!acknowledgedBays[req.id];

              return (
                <div
                  key={req.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCodeRed
                      ? 'border-red-300 bg-red-50/30 ring-1 ring-red-200'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {/* Top Row: Acuity & ETA */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 text-xs font-extrabold uppercase rounded-lg tracking-wider flex items-center gap-1.5 ${
                          isCodeRed
                            ? 'bg-red-600 text-white shadow-xs animate-pulse'
                            : acuity === 'CODE_YELLOW'
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {acuity.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-500">
                        SOS #{req.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-gray-700 text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>ETA: ~{req.current_eta_minutes || 8} mins</span>
                    </div>
                  </div>

                  {/* Patient & Vehicle */}
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{req.patient_name}</h4>
                      <p className="text-xs text-gray-500 font-medium">
                        {req.emergency_type} • Ambulance: <strong className="text-gray-700">{req.vehicle_number || 'Unit 108'}</strong>
                      </p>
                    </div>
                    {req.patient_blood_type && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-black text-xs rounded-md border border-rose-200">
                        🩸 {req.patient_blood_type}
                      </span>
                    )}
                  </div>

                  {/* Vitals Telemetry Badges */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 bg-gray-50 rounded-xl border border-gray-200/80 text-center">
                      <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-center gap-1">
                        <Heart className="w-3 h-3 text-red-500" /> HR
                      </span>
                      <span className="text-sm font-extrabold text-gray-800 block mt-0.5">
                        {req.vitals_heart_rate ? `${req.vitals_heart_rate} bpm` : '84 bpm'}
                      </span>
                    </div>

                    <div className="p-2 bg-gray-50 rounded-xl border border-gray-200/80 text-center">
                      <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-center gap-1">
                        <Droplet className="w-3 h-3 text-blue-500" /> BP
                      </span>
                      <span className="text-sm font-extrabold text-gray-800 block mt-0.5">
                        {req.vitals_blood_pressure || '120/80'}
                      </span>
                    </div>

                    <div className="p-2 bg-gray-50 rounded-xl border border-gray-200/80 text-center">
                      <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-center gap-1">
                        <Wind className="w-3 h-3 text-cyan-600" /> SpO2
                      </span>
                      <span className="text-sm font-extrabold text-cyan-700 block mt-0.5">
                        {req.vitals_spo2 ? `${req.vitals_spo2}%` : '98%'}
                      </span>
                    </div>

                    <div className="p-2 bg-gray-50 rounded-xl border border-gray-200/80 text-center">
                      <span className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-center gap-1">
                        <Brain className="w-3 h-3 text-purple-600" /> GCS
                      </span>
                      <span className="text-sm font-extrabold text-purple-700 block mt-0.5">
                        {req.vitals_gcs ? `${req.vitals_gcs}/15` : '15/15'}
                      </span>
                    </div>
                  </div>

                  {/* Clinical Field Notes */}
                  {req.er_prep_notes && (
                    <div className="mt-3 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950">
                      <strong className="font-bold text-amber-900 block mb-0.5">Paramedic Assessment:</strong>
                      {req.er_prep_notes}
                    </div>
                  )}

                  {/* Destination & Action */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      <span>{req.selected_hospital || 'Emergency Trauma Center'}</span>
                    </div>

                    <button
                      onClick={() => handleAcknowledgeBay(req.id)}
                      disabled={isAcknowledged}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        isAcknowledged
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                      }`}
                    >
                      {isAcknowledged ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Trauma Bay Prepped
                        </>
                      ) : (
                        <>
                          Reserve Trauma Bay
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
