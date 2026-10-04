import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Language } from '../i18n/translations';
import { NotificationBell } from './NotificationBell';
import { useLocation } from '../context/LocationContext';
import { LiveLocationModal } from './LiveLocationModal';
import { PWAInstallButton } from './PWAInstallButton';
import { 
  LogOut, 
  PhoneCall, 
  LogIn, 
  Globe, 
  Sun, 
  Moon, 
  ChevronDown, 
  Check, 
  Compass, 
  MapPinOff, 
  Menu,
  X,
  Activity
} from 'lucide-react';

interface NavbarProps {
  openAuthModal: (mode?: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ openAuthModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const { userCoords, locationSource, locationPermission, cityName, isLocating } = useLocation();
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const role = user?.role?.toLowerCase();

  const languageOptions: { code: Language; label: string; nativeName: string }[] = [
    { code: 'en', label: 'English', nativeName: 'English' },
    { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  ];

  const currentLangOption = languageOptions.find((l) => l.code === language) || languageOptions[0];

  // Only display real coordinates when actual device GPS location has been granted
  const isRealGpsActive = locationPermission === 'granted' && locationSource === 'gps' && userCoords !== null;

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[#0B1220]/95 backdrop-blur-md border-b border-slate-800 text-white transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left Section: Brand Logo, Title & Subtitle */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-[#F20D25] flex items-center justify-center text-white font-black text-sm shadow-sm shadow-red-600/30 group-hover:bg-red-600 transition-colors">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-bold tracking-tight text-white block leading-tight">
              AROGYAVAHINI
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-normal block leading-tight">
              Emergency Response Network
            </span>
          </div>
        </div>

        {/* Right Section: Compact Desktop Navigation matching Midnight Navy Theme */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Emergency Helpline Information */}
          <a
            href="tel:108"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent hover:border-slate-700 transition-all"
            title="Toll-Free Emergency Helpline: 108 / 112"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#F20D25]" />
            <span className="text-slate-400">Helpline:</span>
            <span className="text-red-400 font-bold">108 / 112</span>
          </a>

          <div className="h-3.5 w-px bg-slate-800" />

          {/* Live GPS / Location Status */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className={`px-2 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              isRealGpsActive
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
            }`}
            title={
              isRealGpsActive
                ? `Live GPS connected: ${cityName || 'Local'}`
                : 'Click to configure location permissions'
            }
          >
            {isRealGpsActive ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <Compass className={`w-3.5 h-3.5 text-emerald-400 ${isLocating ? 'animate-spin' : ''}`} />
                <span className="font-medium truncate max-w-[120px]">
                  {cityName ? cityName : `${userCoords!.latitude.toFixed(2)}, ${userCoords!.longitude.toFixed(2)}`}
                </span>
              </>
            ) : (
              <>
                <MapPinOff className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] text-slate-400">Location not enabled</span>
              </>
            )}
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              title={t.languageSelect}
              className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentLangOption.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-36 bg-[#111C30] border border-slate-700 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1">
                {languageOptions.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => {
                      setLanguage(opt.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                      language === opt.code
                        ? 'bg-blue-600/30 text-blue-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <span>{opt.nativeName}</span>
                    {language === opt.code && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? t.themeLight : t.themeDark}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {/* PWA In-App Install Prompt */}
          <PWAInstallButton variant="navbar" />

          {/* Notification Bell (for Authenticated Users) */}
          {isAuthenticated && user && (
            <NotificationBell
              onOpenEmergency={(emergencyId) => {
                if (role === 'driver') {
                  const el = document.getElementById('driver-active-emergency-section') || document.getElementById('driver-incoming-requests-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else if (role === 'admin') {
                  const el = document.getElementById('admin-emergency-feed');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                } else {
                  const el = document.getElementById('patient-active-emergency-tracker') || document.getElementById('patient-history-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            />
          )}

          {/* User Sign In / Profile Section */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-1">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                  {user.name}
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  {role === 'driver' ? t.roleDriver : role === 'admin' ? t.roleAdmin : t.rolePatient}
                </span>
              </div>

              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs ${
                role === 'driver' ? 'bg-amber-600' : role === 'admin' ? 'bg-blue-600' : 'bg-red-600'
              }`}>
                {user.name.charAt(0)}
              </div>

              <button
                onClick={logout}
                title={t.logout}
                className="py-1 px-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-red-950/60 hover:text-red-400 border border-slate-700 transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{t.logout}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="py-1.5 px-3.5 rounded-lg bg-white hover:bg-slate-100 text-[#0B1220] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-600" />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Mobile Navigation Trigger */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && user && (
            <NotificationBell onOpenEmergency={() => {}} />
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0B1220] px-4 py-3.5 space-y-3 animate-in fade-in slide-in-from-top-2">
          {/* Emergency Helpline in Mobile Menu */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#F20D25]" />
              <span className="text-xs font-medium text-slate-300">Helpline:</span>
            </div>
            <a href="tel:108" className="text-xs font-bold text-red-400">
              108 / 112
            </a>
          </div>

          {/* Location Status in Mobile Menu */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2">
              {isRealGpsActive ? (
                <Compass className="w-4 h-4 text-emerald-400" />
              ) : (
                <MapPinOff className="w-4 h-4 text-slate-500" />
              )}
              <span className="text-xs font-medium text-slate-300">
                {isRealGpsActive ? 'Live GPS:' : 'Location:'}
              </span>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsLocationModalOpen(true);
              }}
              className="text-xs font-semibold text-blue-400 cursor-pointer"
            >
              {isRealGpsActive ? (cityName || 'Active') : 'Configure GPS'}
            </button>
          </div>

          {/* Language Selector in Mobile Menu */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-300">Language:</span>
            <div className="flex items-center gap-1.5">
              {languageOptions.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => setLanguage(opt.code)}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    language === opt.code
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {opt.nativeName}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Toggle in Mobile Menu */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-medium text-slate-300">Theme:</span>
            <button
              onClick={toggleTheme}
              className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium flex items-center gap-1.5 cursor-pointer text-slate-300"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-400" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          {/* Authentication Actions */}
          {isAuthenticated && user ? (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">{user.name}</span>
                <span className="text-[10px] text-slate-400 uppercase">{user.role}</span>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="px-3 py-1.5 rounded-lg bg-red-950/60 text-red-400 text-xs font-bold border border-red-900/60 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openAuthModal('login');
              }}
              className="w-full py-2 px-4 rounded-xl bg-white text-[#0B1220] text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-blue-600" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      )}

      {/* Live GPS Calibrator & Location Modal */}
      <LiveLocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </header>
  );
};
