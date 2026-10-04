import React, { useState } from 'react';
import { 
  Activity, 
  PhoneCall, 
  ShieldCheck, 
  MapPin, 
  Mail, 
  Clock, 
  FileText, 
  X, 
  Shield, 
  Lock, 
  Radio, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Headphones
} from 'lucide-react';

export const Footer: React.FC = () => {
  const [privacyModalOpen, setPrivacyModalOpen] = useState<boolean>(false);
  const [termsModalOpen, setTermsModalOpen] = useState<boolean>(false);
  const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);

  return (
    <footer id="arogyavahini-footer" className="w-full bg-[#0B1220] border-t border-slate-800 text-slate-300 transition-colors">
      {/* Upper Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Column 1: Branding & Mission (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F20D25] flex items-center justify-center text-white font-black text-base shadow-md shadow-red-600/30">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white block leading-tight">
                  AROGYAVAHINI
                </span>
                <span className="text-xs text-slate-400 font-medium tracking-normal block leading-tight">
                  Emergency Response Network
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
              Arogyavahini connects patients, emergency ambulance teams, and hospital trauma centers into a real-time, synchronized healthcare dispatch network with automated green traffic corridor preemption.
            </p>

            {/* Verified Network Status Indicator */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Central Dispatch System: Operational 24/7</span>
            </div>
          </div>

          {/* Column 2: Navigation & Policies (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Legal & Information
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => setPrivacyModalOpen(true)}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Privacy Policy & Telemetry</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setTermsModalOpen(true)}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Terms of Emergency Service</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setContactModalOpen(true)}
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Headphones className="w-3.5 h-3.5 text-amber-400" />
                  <span>Emergency Command & Contact</span>
                </button>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>Three-Stage Workflow</span>
                </a>
              </li>
              <li>
                <a
                  href="#platform-capabilities"
                  className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>Green Corridor Technology</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Verified Emergency Helplines (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Verified Emergency Helplines
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In acute life-threatening emergencies, connect directly with national emergency dispatch controllers.
            </p>

            <div className="space-y-2.5">
              <a
                href="tel:108"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-red-900/60 hover:bg-slate-900 transition-all group"
                title="Dial National Toll-Free Ambulance Helpline 108"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-950/60 text-[#F20D25] flex items-center justify-center border border-red-800/40 group-hover:scale-105 transition-transform">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Toll-Free Ambulance</span>
                    <span className="text-[11px] text-slate-400 font-mono">24/7 Free Medical Response</span>
                  </div>
                </div>
                <span className="text-base font-black font-mono text-[#F20D25] px-2.5 py-0.5 rounded bg-red-950/40 border border-red-800/30">
                  108
                </span>
              </a>

              <a
                href="tel:112"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-blue-900/60 hover:bg-slate-900 transition-all group"
                title="Dial National Integrated Emergency Helpline 112"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-950/60 text-blue-400 flex items-center justify-center border border-blue-800/40 group-hover:scale-105 transition-transform">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Unified Emergency (ERSS)</span>
                    <span className="text-[11px] text-slate-400 font-mono">Police, Fire & Medical</span>
                  </div>
                </div>
                <span className="text-base font-black font-mono text-blue-400 px-2.5 py-0.5 rounded bg-blue-950/40 border border-blue-800/30">
                  112
                </span>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Sub-Bar: Copyright, Security & Compliance Badges */}
      <div className="border-t border-slate-800/80 bg-[#080D17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span>© 2026 Arogyavahini</span>
            <span>·</span>
            <span>Smart Emergency Medical Response & Corridor Priority Platform</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Dispatch Protocol</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Encrypted Vitals Telemetry</span>
            </span>
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {privacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#111C30] max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-white animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Privacy Policy & Telemetry Handling</h3>
              </div>
              <button
                type="button"
                onClick={() => setPrivacyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                <strong>1. Geolocation Privacy:</strong> Device GPS coordinates are polled solely upon active user distress confirmation or continuous in-transit navigation, strictly avoiding commercial data resale or background surveillance.
              </p>
              <p>
                <strong>2. Medical Confidentiality:</strong> Emergency health passes, blood types, and in-transit vital telemetry are accessible only by active emergency first responders and certified ER trauma doctors.
              </p>
              <p>
                <strong>3. Audit Logs:</strong> Emergency dispatch records and green corridor actuation logs are retained for municipal traffic safety oversight and healthcare accreditation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPrivacyModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white text-[#0B1220] text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {termsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#111C30] max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-white animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Terms of Emergency Service</h3>
              </div>
              <button
                type="button"
                onClick={() => setTermsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <p>
                <strong>1. Emergency Coordination Tool:</strong> Arogyavahini provides digital dispatch and smart navigation coordination. For immediate acute life-support emergencies, also dial 108 or 112 directly.
              </p>
              <p>
                <strong>2. Genuine Emergency Use Only:</strong> Triggering false or malicious SOS alarms strains emergency fleets and may result in legal prosecution under public safety regulations.
              </p>
              <p>
                <strong>3. Infrastructure Dependencies:</strong> Automatic green corridor preemption depends on municipal smart traffic controller operational readiness and cellular connectivity.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTermsModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white text-[#0B1220] text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Contact & Support Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#111C30] max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-white animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Emergency Command & Support</h3>
              </div>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Central Operations Desk</span>
                <div className="text-white font-bold text-sm">Arogyavahini Integrated Command Center</div>
                <div className="text-slate-400">Bengaluru Emergency Medical Directorate, Karnataka</div>
              </div>

              <div className="space-y-2">
                <a
                  href="tel:108"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-red-950/40 border border-red-900/40 text-white hover:bg-red-900/40 transition"
                >
                  <span className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-red-500" />
                    <span>Emergency Ambulance Hotlines</span>
                  </span>
                  <span className="font-bold font-mono text-red-400">108 / 112</span>
                </a>

                <a
                  href="mailto:support@arogyavahini.network"
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span>Technical Support Desk</span>
                  </span>
                  <span className="font-mono text-slate-300">support@arogyavahini.network</span>
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setContactModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-white text-[#0B1220] text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};
