import React, { useState } from 'react';
import { 
  Activity, 
  Heart, 
  Droplet, 
  Wind, 
  Brain, 
  Send, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { InTransitVitalsInput, TriageAcuityLevel } from '../types';
import { api } from '../services/api';

interface InTransitVitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  emergencyId: number;
  patientName: string;
  destinationHospital: string;
  initialVitals?: Partial<InTransitVitalsInput>;
  onVitalsSubmitted: (vitals: InTransitVitalsInput) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const InTransitVitalsModal: React.FC<InTransitVitalsModalProps> = ({
  isOpen,
  onClose,
  emergencyId,
  patientName,
  destinationHospital,
  onVitalsSubmitted,
  showToast,
}) => {
  const [acuity, setAcuity] = useState<TriageAcuityLevel>('CODE_YELLOW');
  const [heartRate, setHeartRate] = useState<number>(88);
  const [bpSystolic, setBpSystolic] = useState<number>(120);
  const [bpDiastolic, setBpDiastolic] = useState<number>(80);
  const [spO2, setSpO2] = useState<number>(97);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(18);
  const [gcs, setGcs] = useState<number>(15);
  const [bloodSugar, setBloodSugar] = useState<number>(110);
  const [prepNotes, setPrepNotes] = useState<string>('');
  const [bloodBankRequired, setBloodBankRequired] = useState<boolean>(false);
  const [traumaBayRequired, setTraumaBayRequired] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const applyPreset = (preset: 'NORMAL' | 'CODE_RED_CARDIAC' | 'CODE_RED_TRAUMA' | 'RESPIRATORY') => {
    switch (preset) {
      case 'NORMAL':
        setAcuity('CODE_GREEN');
        setHeartRate(76);
        setBpSystolic(120);
        setBpDiastolic(80);
        setSpO2(99);
        setRespiratoryRate(16);
        setGcs(15);
        setBloodSugar(105);
        setBloodBankRequired(false);
        setTraumaBayRequired(false);
        setPrepNotes('Patient conscious, stable vitals. Standard ER bed required.');
        break;
      case 'CODE_RED_CARDIAC':
        setAcuity('CODE_RED');
        setHeartRate(132);
        setBpSystolic(85);
        setBpDiastolic(55);
        setSpO2(91);
        setRespiratoryRate(26);
        setGcs(13);
        setBloodSugar(140);
        setBloodBankRequired(false);
        setTraumaBayRequired(true);
        setPrepNotes('SUSPECTED STEMI / ACUTE CORONARY SYNDROME. Cath lab on standby, ECG show ST elevation in anterior leads.');
        break;
      case 'CODE_RED_TRAUMA':
        setAcuity('CODE_RED');
        setHeartRate(128);
        setBpSystolic(90);
        setBpDiastolic(60);
        setSpO2(94);
        setRespiratoryRate(24);
        setGcs(10);
        setBloodSugar(115);
        setBloodBankRequired(true);
        setTraumaBayRequired(true);
        setPrepNotes('POLYTRAUMA / MOTOR VEHICLE ACCIDENT. Suspected internal hemorrhage. O-Negative blood cross-match & trauma team required.');
        break;
      case 'RESPIRATORY':
        setAcuity('CODE_YELLOW');
        setHeartRate(104);
        setBpSystolic(135);
        setBpDiastolic(88);
        setSpO2(89);
        setRespiratoryRate(30);
        setGcs(14);
        setBloodSugar(120);
        setBloodBankRequired(false);
        setTraumaBayRequired(false);
        setPrepNotes('SEVERE ASTHMA / RESPIRATORY DISTRESS. Nebulization active in-transit, 6L high-flow O2 administered.');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const vitalsPayload: InTransitVitalsInput = {
      vitals_heart_rate: heartRate,
      vitals_blood_pressure: `${bpSystolic}/${bpDiastolic} mmHg`,
      vitals_spo2: spO2,
      vitals_respiratory_rate: respiratoryRate,
      vitals_gcs: gcs,
      vitals_blood_sugar: bloodSugar,
      triage_acuity: acuity,
      er_prep_notes: prepNotes,
      blood_bank_required: bloodBankRequired,
      trauma_bay_required: traumaBayRequired,
    };

    try {
      await api.transmitVitals(emergencyId, vitalsPayload);
      showToast(`e-PCR transmitted! ${destinationHospital} ER notified (${acuity})`, 'success');
      onVitalsSubmitted(vitalsPayload);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error transmitting vitals', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                In-Transit e-PCR & Tele-Triage
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  Live ER Link
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                Patient: <strong className="text-gray-800">{patientName}</strong> • Destination: <strong className="text-gray-800">{destinationHospital}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick Clinical Presets
              </span>
              <span className="text-xs text-gray-400">Tap to populate standard readings</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('NORMAL')}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100 transition-colors text-center"
              >
                Stable / Normal
              </button>
              <button
                type="button"
                onClick={() => applyPreset('CODE_RED_CARDIAC')}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-red-200 bg-red-50/60 text-red-800 hover:bg-red-100 transition-colors text-center"
              >
                STEMI / Cardiac
              </button>
              <button
                type="button"
                onClick={() => applyPreset('CODE_RED_TRAUMA')}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-rose-200 bg-rose-50/60 text-rose-800 hover:bg-rose-100 transition-colors text-center"
              >
                Severe Trauma
              </button>
              <button
                type="button"
                onClick={() => applyPreset('RESPIRATORY')}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-amber-200 bg-amber-50/60 text-amber-800 hover:bg-amber-100 transition-colors text-center"
              >
                Asthma / Hypoxia
              </button>
            </div>
          </div>

          {/* Triage Acuity Radio Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Emergency Department Triage Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAcuity('CODE_RED')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 text-center transition-all ${
                  acuity === 'CODE_RED'
                    ? 'border-red-500 bg-red-50 text-red-900 ring-2 ring-red-200'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                <span className="font-bold text-sm text-red-700">CODE RED</span>
                <span className="text-[11px] text-gray-500">Immediate Resuscitation</span>
              </button>

              <button
                type="button"
                onClick={() => setAcuity('CODE_YELLOW')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 text-center transition-all ${
                  acuity === 'CODE_YELLOW'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-200'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="font-bold text-sm text-amber-700">CODE YELLOW</span>
                <span className="text-[11px] text-gray-500">Urgent / High Priority</span>
              </button>

              <button
                type="button"
                onClick={() => setAcuity('CODE_GREEN')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 text-center transition-all ${
                  acuity === 'CODE_GREEN'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="font-bold text-sm text-emerald-700">CODE GREEN</span>
                <span className="text-[11px] text-gray-500">Stable / Delayed</span>
              </button>
            </div>
          </div>

          {/* Vitals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Heart Rate */}
            <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-red-500" />
                  Heart Rate
                </span>
                <span className="text-sm font-bold text-red-600">{heartRate} BPM</span>
              </div>
              <input
                type="range"
                min="40"
                max="200"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                className="w-full accent-red-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Brady (40)</span>
                <span>Normal (60-100)</span>
                <span>Tachy (200)</span>
              </div>
            </div>

            {/* Blood Pressure */}
            <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-blue-500" />
                  Blood Pressure
                </span>
                <span className="text-sm font-bold text-blue-600">{bpSystolic} / {bpDiastolic} mmHg</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">Systolic</label>
                  <input
                    type="number"
                    value={bpSystolic}
                    onChange={(e) => setBpSystolic(Number(e.target.value))}
                    className="w-full text-xs font-bold p-1.5 bg-white border border-gray-200 rounded-lg text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">Diastolic</label>
                  <input
                    type="number"
                    value={bpDiastolic}
                    onChange={(e) => setBpDiastolic(Number(e.target.value))}
                    className="w-full text-xs font-bold p-1.5 bg-white border border-gray-200 rounded-lg text-center"
                  />
                </div>
              </div>
            </div>

            {/* SpO2 Saturation */}
            <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-cyan-600" />
                  SpO2 Oxygen Saturation
                </span>
                <span className={`text-sm font-bold ${spO2 < 92 ? 'text-red-600' : 'text-cyan-700'}`}>
                  {spO2}%
                </span>
              </div>
              <input
                type="range"
                min="70"
                max="100"
                value={spO2}
                onChange={(e) => setSpO2(Number(e.target.value))}
                className="w-full accent-cyan-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span className="text-red-500">&lt;90% Hypoxia</span>
                <span>95-100% Normal</span>
              </div>
            </div>

            {/* Respiratory Rate */}
            <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-600" />
                  Respiratory Rate
                </span>
                <span className="text-sm font-bold text-teal-700">{respiratoryRate} / min</span>
              </div>
              <input
                type="range"
                min="8"
                max="45"
                value={respiratoryRate}
                onChange={(e) => setRespiratoryRate(Number(e.target.value))}
                className="w-full accent-teal-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>Bradypnea (8)</span>
                <span>Normal (12-20)</span>
                <span>Tachypnea (45)</span>
              </div>
            </div>

            {/* Glasgow Coma Scale (GCS) */}
            <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-purple-500" />
                  GCS (Coma Scale)
                </span>
                <span className={`text-sm font-bold ${gcs <= 8 ? 'text-red-600' : gcs <= 12 ? 'text-amber-600' : 'text-purple-700'}`}>
                  {gcs} / 15
                </span>
              </div>
              <input
                type="range"
                min="3"
                max="15"
                value={gcs}
                onChange={(e) => setGcs(Number(e.target.value))}
                className="w-full accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span className="text-red-500">Severe (&le;8)</span>
                <span className="text-amber-500">Moderate (9-12)</span>
                <span className="text-emerald-600">Mild (13-15)</span>
              </div>
            </div>

            {/* Blood Sugar */}
            <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-700">Blood Glucose (RBS)</span>
                <span className="text-sm font-bold text-gray-800">{bloodSugar} mg/dL</span>
              </div>
              <input
                type="number"
                value={bloodSugar}
                onChange={(e) => setBloodSugar(Number(e.target.value))}
                className="w-full text-xs font-bold p-2 bg-white border border-gray-200 rounded-lg"
                placeholder="mg/dL"
              />
            </div>
          </div>

          {/* Hospital Preparation Special Requests */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/70 space-y-3">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
              Emergency Department Resource Requisitions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-50/40 transition-colors">
                <input
                  type="checkbox"
                  checked={bloodBankRequired}
                  onChange={(e) => setBloodBankRequired(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded"
                />
                <span className="text-xs font-semibold text-gray-800">
                  🩸 Request Urgent Blood Bank Cross-Match
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-50/40 transition-colors">
                <input
                  type="checkbox"
                  checked={traumaBayRequired}
                  onChange={(e) => setTraumaBayRequired(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded"
                />
                <span className="text-xs font-semibold text-gray-800">
                  🚨 Reserve Emergency Trauma Resuscitation Bay
                </span>
              </label>
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Paramedic Field Assessment & Symptoms for Receiving Doctor
            </label>
            <textarea
              value={prepNotes}
              onChange={(e) => setPrepNotes(e.target.value)}
              rows={3}
              placeholder="e.g., Severe crushing chest pain radiating to left jaw, onset 40 mins ago. Administered 325mg Aspirin chewable and sublingual Nitro..."
              className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Transmitting...' : 'Transmit e-PCR to Hospital ER'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
