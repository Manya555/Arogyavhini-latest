import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { LocationProvider } from './context/LocationContext';
import { Navbar } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { PatientDashboard } from './components/PatientDashboard';
import { DriverDashboard } from './components/DriverDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { GlobalEmergencySOSModal } from './components/GlobalEmergencySOSModal';
import { soundEffects } from './utils/sound';
import { 
  HeartHandshake, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  AlertOctagon,
  Info, 
  Activity,
  PhoneCall,
  Phone,
  Smartphone,
  WifiOff,
  Wifi,
  Contrast
} from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, toast, showToast, demoLogin } = useAuth();
  const { notify, setIsOnline, fetchNotifications } = useNotifications();
  const { t } = useLanguage();
  const { isHighContrast, toggleHighContrast } = useTheme();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [showRestoredNotice, setShowRestoredNotice] = useState<boolean>(false);
  const [globalSosModalOpen, setGlobalSosModalOpen] = useState(false);
  const wasOfflineRef = useRef<boolean>(false);

  // Global Emergency Keyboard Shortcut Listener: Cmd+Shift+S (Mac) or Ctrl+Shift+S (Windows/Linux)
  // Ensures rapid access for users to trigger the emergency SOS flow even when they are not on the dashboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;
      const isKeyS = e.key?.toLowerCase() === 's' || e.code === 'KeyS';

      if (isCmdOrCtrl && isShift && isKeyS) {
        e.preventDefault();
        e.stopPropagation();

        // Sound emergency siren alert immediately
        soundEffects.playEmergencyAlert();

        // Open rapid Emergency SOS dispatch modal
        setGlobalSosModalOpen(true);

        // Notify user via toast and notification system
        showToast('🚨 Emergency SOS Shortcut (Cmd+Shift+S) Triggered!', 'error');
        notify(
          '🚨 Emergency SOS Shortcut Activated',
          'Rapid emergency SOS dispatch initiated via global keyboard shortcut (Cmd+Shift+S). Please confirm dispatch details to deploy an ambulance immediately.',
          'SYSTEM_ALERT'
        );

        // Also broadcast custom event for mounted components
        window.dispatchEvent(new CustomEvent('arogyavahini:rapid-sos-triggered'));
      }
    };

    const handleOpenSosEvent = () => {
      soundEffects.playEmergencyAlert();
      setGlobalSosModalOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('arogyavahini:open-rapid-sos', handleOpenSosEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('arogyavahini:open-rapid-sos', handleOpenSosEvent);
    };
  }, [notify, showToast]);

  // Mobile Shake-to-SOS Detection (Accelerometer-based emergency trigger)
  // Allows mobile users in distress to shake their device to trigger emergency dispatch without keyboard shortcuts
  useEffect(() => {
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;
    let lastTime = 0;
    let shakeCount = 0;
    let resetShakeTimer: any = null;
    let cooldownTimer: any = null;
    let inCooldown = false;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (inCooldown) return;

      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      const now = Date.now();
      if (now - lastTime > 100) {
        const diffTime = now - lastTime;
        lastTime = now;

        if (lastX !== null && lastY !== null && lastZ !== null) {
          const deltaX = Math.abs(acc.x - lastX);
          const deltaY = Math.abs(acc.y - lastY);
          const deltaZ = Math.abs(acc.z - lastZ);
          const speed = ((deltaX + deltaY + deltaZ) / diffTime) * 10000;

          // Vigorous shake gesture threshold
          if (speed > 2500) {
            shakeCount++;
            clearTimeout(resetShakeTimer);
            resetShakeTimer = setTimeout(() => {
              shakeCount = 0;
            }, 1200);

            // 2 vigorous shakes in succession triggers SOS
            if (shakeCount >= 2) {
              shakeCount = 0;
              inCooldown = true;
              cooldownTimer = setTimeout(() => {
                inCooldown = false;
              }, 4000);

              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try {
                  navigator.vibrate([300, 100, 300, 100, 400]);
                } catch {}
              }

              soundEffects.playEmergencyAlert();
              setGlobalSosModalOpen(true);
              showToast('🚨 Mobile Shake-to-SOS Activated! Emergency dispatch screen opened.', 'error');
              notify(
                '🚨 Shake-to-SOS Activated',
                'Mobile phone shake gesture detected. Emergency ambulance dispatch screen initiated.',
                'SYSTEM_ALERT'
              );
              window.dispatchEvent(new CustomEvent('arogyavahini:rapid-sos-triggered'));
            }
          }
        }

        lastX = acc.x;
        lastY = acc.y;
        lastZ = acc.z;
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
      clearTimeout(resetShakeTimer);
      clearTimeout(cooldownTimer);
    };
  }, [notify, showToast]);

  // Offline detection listener: monitors browser connectivity and notifies user via NotificationProvider
  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setIsOnline(false);
      wasOfflineRef.current = true;

      // Notify the user via the NotificationProvider
      notify(
        'Internet Connection Lost',
        'You are currently offline. Emergency SOS requests, live ambulance GPS tracking, and ER telemetry require internet connectivity.',
        'OFFLINE_ALERT'
      );

      showToast('Internet connection lost. You are currently offline.', 'error');
    };

    const handleOnline = () => {
      setIsOffline(false);
      setIsOnline(true);

      if (wasOfflineRef.current) {
        // Notify the user via the NotificationProvider
        notify(
          'Internet Connection Restored',
          'Your connection has been restored. Live emergency synchronization and real-time fleet telemetry are back online.',
          'ONLINE_RESTORED'
        );

        showToast('Internet connection restored. Live sync active.', 'success');
        setShowRestoredNotice(true);
        fetchNotifications();
      }
      wasOfflineRef.current = false;
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Initial check on mount
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [notify, setIsOnline, fetchNotifications, showToast]);

  const openAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const role = user?.role?.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white transition-colors duration-200">
      {/* Offline Status Alert Banner */}
      {isOffline && (
        <div
          id="offline-detection-banner"
          role="alert"
          className="bg-amber-600 dark:bg-amber-700 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-md z-50 border-b border-amber-500 animate-in slide-in-from-top duration-200"
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0 text-amber-100 animate-pulse" />
              <span>
                <strong>{t.offlineNotice}</strong> {t.offlineNoticeDesc}
              </span>
            </div>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded bg-amber-700/80 dark:bg-amber-800/80 text-[11px] font-mono uppercase tracking-wider text-amber-100 border border-amber-500/50">
              {t.offlineNotice}
            </span>
          </div>
        </div>
      )}

      {/* Online Restored Status Banner */}
      {showRestoredNotice && (
        <div
          id="online-restored-banner"
          role="status"
          className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md z-50 border-b border-emerald-500 animate-in fade-in duration-200"
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 shrink-0 text-emerald-100" />
              <span>
                <strong>{t.onlineNotice}</strong> {t.onlineNoticeDesc}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowRestoredNotice(false)}
              className="text-emerald-100 hover:text-white text-xs font-semibold px-2 py-0.5 rounded hover:bg-emerald-700 transition cursor-pointer"
            >
              {t.dismiss}
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-slate-900 text-emerald-400 border-slate-700'
                : toast.type === 'error'
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-white shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-amber-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Single Role-Based Navbar */}
      <Navbar openAuthModal={openAuth} />

      {/* Main Page Body: Render exclusively based on authenticated user role */}
      <div className="flex-1 w-full flex flex-col">
        {!isAuthenticated || !user ? (
          <main className="flex-1 w-full">
            <HomeHero onOpenAuth={() => openAuth('login')} />
          </main>
        ) : role === 'driver' ? (
          <DriverDashboard />
        ) : role === 'patient' ? (
          <PatientDashboard />
        ) : role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <main className="flex-1 w-full">
            <HomeHero onOpenAuth={() => openAuth('login')} />
          </main>
        )}
      </div>



      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Global Rapid Emergency SOS Modal (Cmd+Shift+S) */}
      <GlobalEmergencySOSModal
        isOpen={globalSosModalOpen}
        onClose={() => setGlobalSosModalOpen(false)}
        onEmergencyDispatched={async (emergency) => {
          if (role !== 'patient') {
            await demoLogin('patient');
          }
          fetchNotifications();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <LocationProvider>
              <AppContent />
            </LocationProvider>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
