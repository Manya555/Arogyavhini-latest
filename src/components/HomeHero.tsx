import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { SystemStats } from '../types';
import { soundEffects } from '../utils/sound';
import { 
  AlertOctagon, 
  Truck, 
  ShieldCheck, 
  ArrowRight, 
  Activity, 
  Building2, 
  PhoneCall, 
  Radio, 
  Navigation, 
  Clock, 
  Shield, 
  Lock, 
  MapPin, 
  HeartPulse, 
  CheckCircle2, 
  X,
  FileText
} from 'lucide-react';

import { Footer } from './Footer';

interface HomeHeroProps {
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ onOpenAuth }) => {
  const { demoLogin, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      try {
        const data = await api.getStats();
        if (isMounted) {
          setStats(data);
          setIsLoadingStats(false);
        }
      } catch (e) {
        if (isMounted) {
          setIsLoadingStats(false);
        }
      }
    };

    loadStats();
    const timer = setInterval(loadStats, 10000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleTriggerEmergencySos = () => {
    soundEffects.playEmergencyAlert();
    window.dispatchEvent(new CustomEvent('arogyavahini:open-rapid-sos'));
  };

  const handleLaunchRole = async (role: 'patient' | 'driver' | 'admin') => {
    if (onOpenAuth && !isAuthenticated) {
      await demoLogin(role);
    } else {
      await demoLogin(role);
    }
  };

  return (
    <div id="home-landing-container" className="w-full flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 sm:space-y-16 pb-16 w-full">
        {/* =========================================================================
          1. HERO SECTION (Refined Healthcare Technology Style with Midnight Navy)
          ========================================================================= */}
      <section className="bg-[#0B1220] text-white border border-slate-800 rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl relative overflow-hidden transition-colors">
        {/* Subtle background tech grid */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(#334155 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Heading, Description, Single Prominent SOS Button & Safety Note */}
          <div className="lg:col-span-7 space-y-6">
            {/* Small red-accented label */}
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-red-500 uppercase">
              <span className="w-2 h-2 rounded-full bg-[#F20D25] shrink-0 animate-pulse" />
              <span>SMART EMERGENCY MEDICAL RESPONSE</span>
            </div>

            {/* Main Heading: Crisp White with Emergency Red Accent */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
              Every Second Matters.{' '}
              <span className="text-[#F20D25]">Every Response Counts.</span>
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
              Arogyavahini connects patients, ambulance teams and hospitals through an integrated emergency response system designed to support faster coordination and real-time emergency tracking.
            </p>

            {/* Primary Action: Exactly ONE SOS button on the entire homepage */}
            <div className="pt-2 space-y-3">
              <button
                type="button"
                id="homepage-primary-emergency-sos-btn"
                onClick={handleTriggerEmergencySos}
                className="w-full sm:w-auto px-8 py-4 bg-[#F20D25] hover:bg-[#d00a1e] active:bg-[#b00819] text-white font-black text-base tracking-wide rounded-2xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer focus-visible:ring-4 focus-visible:ring-red-500/50 focus:outline-none"
                title="Trigger Emergency SOS: Initiates immediate verified ambulance dispatch"
              >
                <AlertOctagon className="w-5 h-5 fill-current" />
                <span>EMERGENCY SOS</span>
                <span className="hidden sm:inline-block text-[11px] font-mono font-bold bg-red-950/80 text-amber-200 px-2 py-0.5 rounded border border-red-400/40 ml-1">
                  ⌘+Shift+S
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              {/* Safety & Compliance Note */}
              <p className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Use in a genuine emergency. Location access may be required.</span>
              </p>
            </div>

            {/* Feature Assurances */}
            <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-400 font-medium border-t border-slate-800">
              <span className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-red-400" />
                108 / 112 Helpline
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                GPS-Verified Coordinates
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                Trauma ER Pre-Notification
              </span>
            </div>
          </div>

          {/* Right Column: PRESERVED HEALTHCARE GRAPH DESIGN with Enhanced Palette */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="w-full max-w-md bg-[#111C30] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
              {/* Subtle background coordinate grid */}
              <div 
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(#334155 1px, transparent 1px)`,
                  backgroundSize: '16px 16px'
                }}
              />

              {/* Vector Healthcare Flow Container */}
              <div className="relative z-10 space-y-5">
                {/* Visual Header with ECG Heartbeat Line */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-slate-200">
                    <Activity className="w-4 h-4 text-[#F20D25]" />
                    <span>Emergency Response Coordination</span>
                  </div>
                  {/* Heartbeat pulse animation */}
                  <svg className="w-16 h-4 text-emerald-400" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M0 10 H20 L25 2 L35 18 L42 5 L48 14 L53 10 H100" />
                  </svg>
                </div>

                {/* 3 Healthcare Coordination Nodes */}
                <div className="space-y-3.5">
                  {/* Node 1: Incident Location */}
                  <div className="flex items-start gap-3 bg-[#0B1220] p-3.5 rounded-2xl border border-slate-800 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-red-950/60 text-[#F20D25] flex items-center justify-center shrink-0 border border-red-800/50">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white">Incident Scene</span>
                        <span className="text-[10px] text-red-400 font-mono font-semibold">GPS Verified</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-tight">
                        Distress beacon transmits coordinates & emergency category
                      </p>
                    </div>
                  </div>

                  {/* Flow Connection 1 */}
                  <div className="pl-6 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <div className="h-4 w-0.5 bg-gradient-to-b from-[#F20D25] to-amber-500" />
                    <span>Corridor Priority Preemption</span>
                  </div>

                  {/* Node 2: Dispatched Ambulance */}
                  <div className="flex items-start gap-3 bg-[#0B1220] p-3.5 rounded-2xl border border-slate-800 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-amber-950/60 text-amber-400 flex items-center justify-center shrink-0 border border-amber-800/50">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white">Active Ambulance Unit</span>
                        <span className="text-[10px] text-amber-400 font-mono font-semibold">En Route</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-tight">
                        Turn-by-turn spoken guidance & real-time telemetry updates
                      </p>
                    </div>
                  </div>

                  {/* Flow Connection 2 */}
                  <div className="pl-6 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                    <div className="h-4 w-0.5 bg-gradient-to-b from-amber-500 to-blue-500" />
                    <span>Hospital Pre-Notification</span>
                  </div>

                  {/* Node 3: Receiving Trauma Center */}
                  <div className="flex items-start gap-3 bg-[#0B1220] p-3.5 rounded-2xl border border-slate-800 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-950/60 text-blue-400 flex items-center justify-center shrink-0 border border-blue-800/50">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white">Emergency Trauma Center</span>
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold">Ready</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-tight">
                        ER bay reservation & in-transit patient vitals review
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. OPERATIONAL STATISTICS (Verified Real Backend Metrics)
          ========================================================================= */}
      <section id="homepage-statistics-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Operational Overview
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {isLoadingStats ? 'Updating...' : 'Verified System Metrics'}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Total Ambulances */}
          <div className="bg-white dark:bg-[#111C30] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Ambulances</span>
              <Truck className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {isLoadingStats ? '—' : stats?.totalAmbulances ?? '—'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Registered fleet vehicles
            </p>
          </div>

          {/* Stat 2: Ambulances Available */}
          <div className="bg-white dark:bg-[#111C30] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ambulances Available</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {isLoadingStats ? '—' : stats?.availableAmbulances ?? '—'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Ready for immediate dispatch
            </p>
          </div>

          {/* Stat 3: Active Emergencies */}
          <div className="bg-white dark:bg-[#111C30] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Emergencies</span>
              <Activity className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {isLoadingStats ? '—' : stats?.activeEmergencies ?? '—'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              In-transit or active dispatches
            </p>
          </div>

          {/* Stat 4: Average Response Time */}
          <div className="bg-white dark:bg-[#111C30] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Response Time</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white">
              {isLoadingStats ? (
                '—'
              ) : stats?.averageResponseTimeMinutes !== null && stats?.averageResponseTimeMinutes !== undefined ? (
                <>
                  {stats.averageResponseTimeMinutes} <span className="text-sm font-sans font-medium text-slate-500">min</span>
                </>
              ) : (
                '—'
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {stats?.averageResponseTimeMinutes ? 'Calculated from completed dispatches' : 'Calculated upon dispatch completion'}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. HOW IT WORKS (Three-Stage Horizontal Process)
          ========================================================================= */}
      <section id="how-it-works" className="space-y-8 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span>THREE-STAGE EMERGENCY PROCESS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
              How It Works
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
            A synchronized three-stage emergency management pipeline engineered to eliminate critical transit delays between citizens, mobile ambulances, and trauma hospitals.
          </p>
        </div>

        {/* Horizontal Three-Stage Process Cards with Connecting Route Track */}
        <div className="relative">
          {/* Desktop Connecting Horizontal Flow Track */}
          <div className="hidden lg:block absolute top-14 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-red-500 via-amber-500 to-blue-500 z-0 pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {/* Stage 1: Emergency Request */}
            <div className="bg-white dark:bg-[#111C30] p-6 sm:p-7 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                {/* Number & Descriptive Icon Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-[#F20D25]">01</span>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/60 text-[#F20D25] border border-red-200 dark:border-red-900/40">
                      STAGE 1
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 text-[#F20D25] flex items-center justify-center border border-red-200/80 dark:border-red-900/60 shadow-xs">
                    <PhoneCall className="w-6 h-6" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Emergency Request
                  </h3>
                  <div className="text-xs font-semibold text-red-600 dark:text-red-400 mt-0.5">
                    Distress Trigger & Geolocation Verification
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Patients or bystanders trigger an SOS request. The system immediately captures verified device GPS coordinates and transmits the emergency type to the dispatch network.
                  </p>
                </div>
              </div>

              {/* Descriptive Micro-Feature Tags */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>Real GPS device coordinate lock</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Triage classification & medical notes</span>
                </div>
              </div>
            </div>

            {/* Stage 2: Ambulance Coordination */}
            <div className="bg-white dark:bg-[#111C30] p-6 sm:p-7 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                {/* Number & Descriptive Icon Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-amber-500">02</span>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
                      STAGE 2
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center border border-amber-200/80 dark:border-amber-900/60 shadow-xs">
                    <Truck className="w-6 h-6" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Ambulance Coordination
                  </h3>
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    Fleet Dispatch & Green Corridor Preemption
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    The nearest operational ambulance is deployed with conversational turn-by-turn spoken navigation. Traffic signal priority automatically preempts lights to clear the transit path.
                  </p>
                </div>
              </div>

              {/* Descriptive Micro-Feature Tags */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Multilingual spoken voice guidance</span>
                </div>
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Automated Green Wave corridor preemption</span>
                </div>
              </div>
            </div>

            {/* Stage 3: Hospital Coordination */}
            <div className="bg-white dark:bg-[#111C30] p-6 sm:p-7 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                {/* Number & Descriptive Icon Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl sm:text-4xl font-black font-mono text-blue-500">03</span>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
                      STAGE 3
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center border border-blue-200/80 dark:border-blue-900/60 shadow-xs">
                    <Building2 className="w-6 h-6" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Hospital Coordination
                  </h3>
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                    Pre-Arrival Telemetry & Trauma Bay Readiness
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    The receiving hospital trauma center receives incoming patient vitals, live ETA countdown, and emergency bed reservation so doctors are ready before the ambulance pulls up.
                  </p>
                </div>
              </div>

              {/* Descriptive Micro-Feature Tags */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>Accurate ETA countdown to emergency bay</span>
                </div>
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span>Trauma bay & vitals synchronization</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. PLATFORM CAPABILITIES (Clean Grid, Verified Features Only)
          ========================================================================= */}
      <section id="platform-capabilities" className="space-y-6">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Features & Infrastructure
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white tracking-tight">
            Integrated Emergency Response Capabilities
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Reliable tools designed for emergency responders, hospital staff, and patients in need of rapid transit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Capability 1 */}
          <div className="bg-white dark:bg-[#111C30] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Navigation className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Real-Time Ambulance Tracking
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Provides continuous GPS updates and vehicle telemetry during active response missions.
            </p>
          </div>

          {/* Capability 2 */}
          <div className="bg-white dark:bg-[#111C30] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Smart Route Navigation
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Calculates real road geometry, turn-by-turn guidance, and off-route recalculation using live mapping engines.
            </p>
          </div>

          {/* Capability 3 */}
          <div className="bg-white dark:bg-[#111C30] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hospital Coordination
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Shares patient emergency type and in-transit vitals with trauma centers to prepare reception teams.
            </p>
          </div>

          {/* Capability 4 */}
          <div className="bg-white dark:bg-[#111C30] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Emergency Status Updates
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Maintains an event timeline from dispatch to arrival, keeping all parties informed of progression.
            </p>
          </div>

          {/* Capability 5 */}
          <div className="bg-white dark:bg-[#111C30] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Lock className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Role-Based Access
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Separate functional workspaces for citizens, certified ambulance personnel, and hospital administrators.
            </p>
          </div>

          {/* Capability 6 */}
          <div className="bg-white dark:bg-[#111C30] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
              <Radio className="w-5 h-5 text-[#F20D25]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Traffic Signal Priority
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Integrates with smart IoT traffic controllers to request corridor preemption where connected hardware is operational.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. ROLE-BASED ACCESS & WORKSPACE ENTRY POINTS
          ========================================================================= */}
      <section id="portal-access-section" className="space-y-6">
        <div className="space-y-1">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Workspace Access
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white tracking-tight">
            Role-Based Operational Consoles
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Log in to your respective workspace to manage emergency requests, navigation, and hospital reception.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Citizen / Patient Workspace */}
          <div className="bg-white dark:bg-[#111C30] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-900/30">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Citizen & Patient Workspace</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Submit SOS alerts, track incoming ambulances in real time, and manage your emergency health pass.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleLaunchRole('patient')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Access Citizen Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ambulance Driver Console */}
          <div className="bg-white dark:bg-[#111C30] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900/30">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Ambulance Crew Console</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Accept incoming dispatch requests, follow live turn-by-turn spoken navigation, and update in-transit vitals.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleLaunchRole('driver')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Access Driver Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Hospital & Admin Portal */}
          <div className="bg-white dark:bg-[#111C30] p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Hospital ER & Dispatch Admin</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Monitor incoming trauma cases, update ward bed availability, and oversee city-wide emergency dispatch logs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleLaunchRole('admin')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <span>Access Hospital Admin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. TRUST AND SAFETY SECTION
          ========================================================================= */}
      <section id="trust-and-safety" className="bg-[#111C30]/40 dark:bg-[#111C30] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10">
        <div className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Trust, Privacy & Responsible Coordination</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Designed to Support Rapid, Responsible Medical Response
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Arogyavahini serves as an emergency coordination platform connecting citizens, certified ambulance personnel, and hospital emergency wards. We are committed to transparency, data integrity, and responsible operational protocols.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-white block font-semibold">Location Privacy</strong>
                GPS coordinates are used strictly to pinpoint distress locations and calculate response routes.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-white block font-semibold">Role-Based Security</strong>
                Operational consoles and telemetry are restricted to authenticated emergency roles.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-white block font-semibold">Medical Confidentiality</strong>
                Emergency profile data is made accessible only to active first responders and emergency doctors.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-white block font-semibold">Verified Response Flow</strong>
                Dispatches require user confirmation to prevent accidental alarms and protect public resources.
              </div>
            </div>
          </div>
        </div>
      </section>

      </div>

      {/* Dedicated Dark Theme Footer (#0B1220) with Branding, Helplines & Policy Modals */}
      <Footer />
    </div>
  );
};
