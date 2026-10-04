import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { Ambulance, EmergencyRequest, SystemStats, EmergencyStatus, AmbulanceStatus, Hospital, WardCapacityStatus } from '../types';
import { EmergencyReportModal } from './EmergencyReportModal';
import { HospitalCapacityPieChart } from './HospitalCapacityPieChart';
import { HospitalERTriageMonitor } from './HospitalERTriageMonitor';
import { AdminFleetLiveMap } from './AdminFleetLiveMap';
import { 
  ShieldCheck, 
  Truck, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  RotateCcw, 
  Activity, 
  Phone, 
  MapPin, 
  User, 
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText,
  Download,
  Mic,
  Building2,
  Bed,
  Heart,
  AlertTriangle,
  Users,
  Menu,
  Bell,
  Flame,
  Radio,
  Settings
} from 'lucide-react';
import { HospitalSidebar, HospitalTab } from './hospital/HospitalSidebar';

export const AdminDashboard: React.FC = () => {
  const { showToast, logout } = useAuth();
  const { t } = useLanguage();
  const { unreadCount, fetchNotifications } = useNotifications();

  // Tab-based navigation & sidebar state
  const [activeTab, setActiveTab] = useState<HospitalTab>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Hospital Filters
  const [hospFilter, setHospFilter] = useState<'ALL' | 'AVAILABLE' | 'FULL'>('ALL');
  const [hospSearch, setHospSearch] = useState<string>('');
  const [updatingHospId, setUpdatingHospId] = useState<number | string | null>(null);

  // Add Ambulance Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicleNumber, setNewVehicleNumber] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBaseLocation, setNewBaseLocation] = useState('');
  const [newType, setNewType] = useState('Advanced Cardiac Life Support (ACLS)');
  const [isSubmittingAmb, setIsSubmittingAmb] = useState(false);

  // Selected Emergency Detail Modal
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyRequest | null>(null);
  const [reportModalEmergencyId, setReportModalEmergencyId] = useState<number | null>(null);
  const [fallbackReportEmergency, setFallbackReportEmergency] = useState<EmergencyRequest | undefined>(undefined);

  const openReportModal = (id: number, emergency?: EmergencyRequest) => {
    setReportModalEmergencyId(id);
    setFallbackReportEmergency(emergency);
  };

  useEffect(() => {
    loadAllAdminData();
    const interval = setInterval(loadAllAdminData, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadAllAdminData = async () => {
    try {
      const [statsData, reqData, ambData, hospData] = await Promise.all([
        api.getStats(),
        api.getEmergencies(),
        api.getAmbulances(),
        api.getHospitals(),
      ]);
      setStats(statsData);
      setEmergencies(reqData.emergencies);
      setAmbulances(ambData.ambulances);
      if (hospData?.hospitals) {
        setHospitals(hospData.hospitals);
      }
    } catch (e) {
      console.warn('Error loading admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleHospitalCapacity = async (hosp: Hospital) => {
    const nextStatus: WardCapacityStatus = hosp.ward_capacity === 'AVAILABLE' ? 'FULL' : 'AVAILABLE';
    setUpdatingHospId(hosp.id);
    try {
      const res = await api.updateHospitalCapacity(hosp.id, nextStatus);
      showToast(res.message, nextStatus === 'AVAILABLE' ? 'success' : 'warning');
      setHospitals((prev) =>
        prev.map((h) => (h.id === hosp.id ? res.hospital : h))
      );
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Failed to update emergency ward capacity', 'error');
    } finally {
      setUpdatingHospId(null);
    }
  };

  const handleSetHospitalCapacity = async (hospId: number | string, status: WardCapacityStatus, beds?: number) => {
    setUpdatingHospId(hospId);
    try {
      const res = await api.updateHospitalCapacity(hospId, status, beds);
      showToast(res.message, status === 'AVAILABLE' ? 'success' : 'warning');
      setHospitals((prev) =>
        prev.map((h) => (h.id === hospId ? res.hospital : h))
      );
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Failed to update emergency ward capacity', 'error');
    } finally {
      setUpdatingHospId(null);
    }
  };

  const handleUpdateEmergencyStatus = async (id: number, status: EmergencyStatus) => {
    try {
      const res = await api.updateEmergencyStatus(id, status, 'Admin / Dispatch Control');
      showToast(res.message, 'success');
      loadAllAdminData();
      if (selectedEmergency?.id === id) {
        setSelectedEmergency(res.emergency);
      }
    } catch (err: any) {
      showToast(err.message || 'Status update failed', 'error');
    }
  };

  const handleUpdateAmbulanceStatus = async (id: number, status: AmbulanceStatus) => {
    try {
      const res = await api.updateAmbulanceStatus(id, status);
      showToast(res.message, 'success');
      loadAllAdminData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update ambulance status', 'error');
    }
  };

  const handleAddAmbulance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleNumber || !newDriverName || !newPhone || !newBaseLocation) {
      showToast('Please fill all required ambulance details', 'error');
      return;
    }

    setIsSubmittingAmb(true);
    try {
      const res = await api.createAmbulance({
        vehicle_number: newVehicleNumber,
        driver_name: newDriverName,
        phone: newPhone,
        base_location: newBaseLocation,
        type: newType,
        status: 'AVAILABLE',
      });
      showToast(res.message, 'success');
      setShowAddModal(false);
      setNewVehicleNumber('');
      setNewDriverName('');
      setNewPhone('');
      setNewBaseLocation('');
      loadAllAdminData();
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Failed to register ambulance', 'error');
    } finally {
      setIsSubmittingAmb(false);
    }
  };

  const handleResetSystemData = async () => {
    if (!window.confirm('Reset emergency ledger and restore default fleet availability?')) return;
    try {
      const res = await api.resetDatabase();
      showToast(res.message, 'success');
      loadAllAdminData();
      fetchNotifications();
    } catch (err: any) {
      showToast(err.message || 'Reset failed', 'error');
    }
  };

  // Filtered emergency list
  const filteredEmergencies = emergencies.filter((req) => {
    const matchesSearch =
      req.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.emergency_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.vehicle_number && req.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return !['COMPLETED', 'CANCELLED'].includes(req.status);
    if (statusFilter === 'COMPLETED') return req.status === 'COMPLETED';
    if (statusFilter === 'CANCELLED') return req.status === 'CANCELLED';
    return req.status === statusFilter;
  });

  return (
    <div id="hospital-portal-root" className="min-h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row w-full">
      {/* MOBILE TOPBAR WITH MENU TRIGGER & ACTIVE SOS BADGE */}
      <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between sticky top-16 z-30 shadow-xs">
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center gap-2 cursor-pointer"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span className="text-xs">Hospital Menu</span>
        </button>

        <div className="flex items-center gap-2">
          {stats && stats.activeEmergencies > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('emergencies');
                setIsMobileSidebarOpen(false);
                const el = document.getElementById('admin-emergency-feed');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="px-2.5 py-1 rounded-full bg-red-600 text-white font-black text-[10px] animate-pulse flex items-center gap-1 cursor-pointer"
            >
              <Flame className="w-3 h-3" />
              <span>{stats.activeEmergencies} Active SOS</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveTab('notifications');
              setIsMobileSidebarOpen(false);
            }}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 top-16"
        />
      )}

      {/* FIXED/COLLAPSIBLE HOSPITAL SIDEBAR */}
      <div className={`${isMobileSidebarOpen ? 'block' : 'hidden'} md:block fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] z-30`}>
        <HospitalSidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
            if (tab === 'profile') {
              setShowProfileModal(true);
              return;
            }
            if (tab === 'settings') {
              setShowSettingsModal(true);
              return;
            }
            const sectionMap: Record<string, string> = {
              dashboard: 'admin-dashboard-root',
              emergencies: 'admin-emergency-feed',
              trauma: 'admin-er-trauma-section',
              'patient-info': 'admin-er-trauma-section',
              ambulances: 'admin-fleet-section',
              'fleet-map': 'admin-fleet-map-section',
              wards: 'admin-hospitals-section',
              traffic: 'admin-traffic-signals-section',
              personnel: 'admin-users-section',
              reports: 'admin-reports-section',
              history: 'admin-reports-section',
            };
            const targetId = sectionMap[tab];
            if (targetId) {
              const el = document.getElementById(targetId);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            } else if (tab === 'dashboard') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          hospitalName="Command Center"
          activeEmergenciesCount={stats?.activeEmergencies || 0}
          availableAmbulancesCount={stats?.availableAmbulances || 0}
          wardDiversionCount={hospitals.filter((h) => h.ward_capacity === 'FULL').length}
          unreadNotificationsCount={unreadCount}
          onOpenSettingsModal={() => setShowSettingsModal(true)}
          onOpenProfileModal={() => setShowProfileModal(true)}
          onLogout={logout}
        />
      </div>

      {/* MAIN SCROLLABLE CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto space-y-6">
        <div id="admin-dashboard-root" className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t.adminPortalTitle}</h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                {t.adminConsoleBadge}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live Fleet Tracking, Emergency Dispatch Queue, and Central Incident Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSystemData}
            title="Restore Default Fleet & Clear Resolved Calls"
            className="p-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-400 hover:border-red-200 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.adminResetSystem}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="py-2 px-3.5 rounded-lg bg-[#0f172a] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all border border-slate-800 dark:border-blue-600 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-400 dark:text-white" />
            <span>{t.adminAddAmbulance}</span>
          </button>
        </div>
      </div>

      {/* Analytics Metric Cards / Reports */}
      <div id="admin-reports-section" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Emergencies */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{t.adminTotalCalls}</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{stats?.totalEmergencies ?? 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">Registered calls</span>
        </div>

        {/* Active Dispatches */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">{t.activeEmergencies}</span>
            <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">{stats?.activeEmergencies ?? 0}</p>
          <span className="text-[11px] text-red-500 font-semibold">{t.adminActiveCallsDesc}</span>
        </div>

        {/* Available Ambulances */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{t.availableAmbulances}</span>
            <Truck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats?.availableAmbulances ?? 0} <span className="text-sm text-slate-400 font-normal">/ {stats?.totalAmbulances ?? 0}</span>
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">{t.adminReadyFleetDesc}</span>
        </div>

        {/* Emergency Ward Capacity */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Emergency Wards</span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {hospitals.filter(h => h.ward_capacity === 'AVAILABLE').length} <span className="text-sm text-slate-400 font-normal">/ {hospitals.length}</span>
          </p>
          <span className="text-[11px] text-slate-400 font-medium">
            {hospitals.filter(h => h.ward_capacity === 'FULL').length} In Diversion Mode
          </span>
        </div>

        {/* Completed Emergencies */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t.completedTrips}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{stats?.completedEmergencies ?? 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">Admitted & Resolved</span>
        </div>
      </div>

      {/* Hospital ER Trauma & In-Transit e-PCR Telemetry Stream */}
      <div id="admin-er-trauma-section">
        <HospitalERTriageMonitor showToast={showToast} />
      </div>

      {/* Municipal Green Corridor Traffic Coordination Overview */}
      <div id="admin-traffic-signals-section" className="bg-white dark:bg-[#111C30] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Emergency Green Corridor Priority</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              Municipal Traffic Management Integration
            </h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Automated Municipal Corridor Protocol</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Corridor Status</span>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Green Corridor Active
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Emergency transit routes are synchronized with municipal traffic systems for active corridor clearance.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Traffic Management System</span>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Municipal Traffic Center
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Direct telemetry handshake with regional traffic signal dispatch and intersection controllers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Preemption Radius</span>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500" />
              800m Geofenced Approach
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
              Intersection preemption requests are transmitted dynamically as verified ambulances approach.
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Fleet Geolocation Live Map */}
      <div id="admin-fleet-map-section">
        <AdminFleetLiveMap
          initialAmbulances={ambulances}
          showToast={showToast}
          onSelectAmbulance={(amb) => {
            showToast?.(`Selected ${amb.vehicle_number} (${amb.status})`, 'info');
          }}
        />
      </div>

      {/* AMBULANCE FLEET MANAGEMENT PANEL */}
      <div id="admin-fleet-section" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div id="admin-drivers-section" className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.adminFleetTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.adminFleetDesc}</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-mono">
            {ambulances.length} Registered Units
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {ambulances.map((amb) => (
            <div
              key={amb.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:border-blue-300 dark:hover:border-blue-600 transition-all space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white font-mono block">{amb.vehicle_number}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block max-w-[140px]">{amb.type}</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    amb.status === 'AVAILABLE'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      : amb.status === 'ASSIGNED'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                      : amb.status === 'BUSY'
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {amb.status}
                </span>
              </div>

              <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-700">
                <p className="flex items-center gap-1 font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{amb.driver_name}</span>
                </p>
                <p className="flex items-center gap-1 font-mono text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{amb.phone}</span>
                </p>
                <p className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{amb.base_location}</span>
                </p>
              </div>

              {/* Status Toggle buttons */}
              <div className="pt-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateAmbulanceStatus(amb.id, 'AVAILABLE')}
                  className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-colors border cursor-pointer ${
                    amb.status === 'AVAILABLE'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAmbulanceStatus(amb.id, 'MAINTENANCE')}
                  className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-colors border cursor-pointer ${
                    amb.status === 'MAINTENANCE'
                      ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Service
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LOCAL HOSPITALS & EMERGENCY WARD CAPACITY CONTROL HUB */}
      <div id="admin-hospitals-section" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Local Hospitals & Emergency Ward Capacity Hub</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Toggle live Emergency Ward intake capacity (Available vs. Full). Updates patient maps and ambulance routing telemetry instantaneously.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{hospitals.filter(h => h.ward_capacity === 'AVAILABLE').length} Available Wards</span>
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center gap-1.5 font-mono">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>{hospitals.filter(h => h.ward_capacity === 'FULL').length} In Diversion Mode</span>
            </span>
          </div>
        </div>

        {/* Recharts Pie Chart Visualizing Available vs. Full Status Distribution */}
        <HospitalCapacityPieChart
          hospitals={hospitals}
          selectedFilter={hospFilter}
          onFilterChange={(newFilter) => setHospFilter(newFilter)}
        />

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={hospSearch}
              onChange={(e) => setHospSearch(e.target.value)}
              placeholder="Filter hospital, address, or specialty..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {(['ALL', 'AVAILABLE', 'FULL'] as const).map((filterVal) => (
              <button
                key={filterVal}
                type="button"
                onClick={() => setHospFilter(filterVal)}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                  hospFilter === filterVal
                    ? filterVal === 'FULL'
                      ? 'bg-red-600 text-white border-red-600 shadow-xs'
                      : filterVal === 'AVAILABLE'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {filterVal === 'ALL' ? `All (${hospitals.length})` : filterVal === 'AVAILABLE' ? `🟢 Available (${hospitals.filter(h => h.ward_capacity === 'AVAILABLE').length})` : `🔴 Full / Diversion (${hospitals.filter(h => h.ward_capacity === 'FULL').length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Hospital Capacity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {hospitals
            .filter((h) => {
              const matchesSearch =
                h.name.toLowerCase().includes(hospSearch.toLowerCase()) ||
                (h.specialty && h.specialty.toLowerCase().includes(hospSearch.toLowerCase())) ||
                (h.address && h.address.toLowerCase().includes(hospSearch.toLowerCase()));
              if (!matchesSearch) return false;
              if (hospFilter === 'AVAILABLE') return h.ward_capacity === 'AVAILABLE';
              if (hospFilter === 'FULL') return h.ward_capacity === 'FULL';
              return true;
            })
            .map((hosp) => {
              const isFull = hosp.ward_capacity === 'FULL';
              const isUpdating = updatingHospId === hosp.id;

              return (
                <div
                  key={hosp.id}
                  id={`admin-hosp-card-${hosp.id}`}
                  className={`p-4 rounded-xl border transition-all space-y-3 shadow-xs flex flex-col justify-between ${
                    isFull
                      ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
                      : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {hosp.name}
                        </h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                          {hosp.specialty || 'General Emergency Care'}
                        </p>
                      </div>

                      {/* Ward Capacity Status Badge */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider shrink-0 flex items-center gap-1 ${
                          isFull
                            ? 'bg-red-100 dark:bg-red-900/70 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800'
                            : 'bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-red-600 animate-pulse' : 'bg-emerald-600'}`}></span>
                        <span>{isFull ? 'WARD FULL' : 'AVAILABLE'}</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 mt-2">
                      <p className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{hosp.address}</span>
                      </p>
                      {hosp.phone && (
                        <p className="flex items-center gap-1 text-[11px] font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{hosp.phone}</span>
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300 pt-1">
                        <span className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>Emergency Beds:</span>
                        </span>
                        <span className="font-mono">
                          <strong className={isFull ? 'text-red-600 dark:text-red-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                            {hosp.available_beds}
                          </strong>
                          {' '}/ {hosp.total_beds} open
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Emergency Ward Capacity Controls */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">Emergency Intake Status:</span>
                      <span className={`font-bold ${isFull ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {isFull ? '🔴 Diversion Mode' : '🟢 Accepting Patients'}
                      </span>
                    </div>

                    {/* Action Toggle Button Group */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        id={`btn-set-available-${hosp.id}`}
                        disabled={isUpdating}
                        onClick={() => handleSetHospitalCapacity(hosp.id, 'AVAILABLE')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                          !isFull
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Available</span>
                      </button>

                      <button
                        type="button"
                        id={`btn-set-full-${hosp.id}`}
                        disabled={isUpdating}
                        onClick={() => handleSetHospitalCapacity(hosp.id, 'FULL')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                          isFull
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50'
                        }`}
                      >
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>Ward Full</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>Patient Map Marker:</span>
                      <span className="font-bold flex items-center gap-1">
                        {isFull ? (
                          <span className="text-red-500">🔴 Red Marker (Full)</span>
                        ) : (
                          <span className="text-emerald-500">🟢 Green Marker (Open)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* EMERGENCY REQUESTS DATA TABLE */}
      <div id="admin-emergency-feed" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.adminMasterLedgerTitle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.adminMasterLedgerDesc}</p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 font-mono">ID</th>
                <th className="py-3 px-4">{t.patientName}</th>
                <th className="py-3 px-4">{t.patientSelectEmergencyType}</th>
                <th className="py-3 px-4">{t.driverIncidentLocation}</th>
                <th className="py-3 px-4">{t.vehicleNumber}</th>
                <th className="py-3 px-4">{t.status}</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmergencies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No emergency requests found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredEmergencies.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">#{req.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 dark:text-white">{req.patient_name}</span>
                        {req.notes && (
                          <span
                            title={`Patient Spoken Context / Notes: ${req.notes}`}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded text-[10px] font-bold shrink-0 cursor-help"
                          >
                            <Mic className="w-2.5 h-2.5" />
                            <span>Voice/Notes</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{req.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{req.emergency_type}</span>
                    </td>
                    <td className="py-3 px-4 max-w-[180px] truncate text-slate-600 dark:text-slate-300" title={req.location}>
                      {req.location}
                    </td>
                    <td className="py-3 px-4">
                      {req.vehicle_number ? (
                        <div>
                          <span className="font-bold font-mono text-slate-900 dark:text-white">{req.vehicle_number}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{req.driver_name}</span>
                        </div>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-medium italic">{t.statusWaitingForDriver}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'COMPLETED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                            : req.status === 'CANCELLED'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            : req.status === 'WAITING_FOR_DRIVER'
                            ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 animate-pulse'
                            : req.status === 'DRIVER_ACCEPTED'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                            : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {req.status === 'COMPLETED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => openReportModal(req.id, req)}
                              className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold rounded-md transition-colors text-[10px] flex items-center gap-1 cursor-pointer"
                              title="View Emergency Report"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Report</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openReportModal(req.id, req)}
                              className="p-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold rounded-md transition-colors text-[10px] flex items-center justify-center cursor-pointer"
                              title="Download Report"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedEmergency(req)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-md transition-colors text-[11px] cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SYSTEM USERS & ROLE PERMISSIONS REGISTRY */}
      <div id="admin-users-section" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.adminUsersTitle}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.adminUsersDesc}</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-mono">
            Active Accounts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Admin Personnel</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-bold uppercase">{t.roleAdmin}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">System Administrator</p>
            <p className="text-[11px] text-slate-400 font-mono">admin@arogyavahini.gov.in</p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block pt-1">● Full Command Permissions</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Ambulance Crew</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase">{t.roleDriver}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">Mohammed Irfan</p>
            <p className="text-[11px] text-slate-400 font-mono">+91 98450 11223</p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block pt-1">● Dispatch & Vehicle Tracking</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">Emergency Caller</span>
              <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-[10px] font-bold uppercase">{t.rolePatient}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">Priya Rao</p>
            <p className="text-[11px] text-slate-400 font-mono">+91 98450 12345</p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block pt-1">● SOS Broadcast Access</span>
          </div>
        </div>
      </div>

      {/* ADD AMBULANCE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <h3 className="font-black text-base">{t.adminAddAmbulance}</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full hover:bg-white/20 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAmbulance} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.vehicleNumber} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-02-ER-5599"
                  value={newVehicleNumber}
                  onChange={(e) => setNewVehicleNumber(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.driverName} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manjunath Reddy"
                  value={newDriverName}
                  onChange={(e) => setNewDriverName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.phone} *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98450 99887"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.ambulanceType}</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Advanced Cardiac Life Support (ACLS)">Advanced Cardiac Life Support (ACLS)</option>
                  <option value="Basic Life Support (BLS)">Basic Life Support (BLS)</option>
                  <option value="Critical Care Response Unit">Critical Care Response Unit</option>
                  <option value="Neonatal & Trauma ICU Mobile">Neonatal & Trauma ICU Mobile</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t.baseLocation} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Malleshwaram Apollo Emergency Hub"
                  value={newBaseLocation}
                  onChange={(e) => setNewBaseLocation(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAmb}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer"
                >
                  {isSubmittingAmb ? t.loading : 'Save Ambulance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-red-400">Emergency Case File</span>
                <h3 className="font-black text-lg">Dispatch #{selectedEmergency.id}</h3>
              </div>
              <button onClick={() => setSelectedEmergency(null)} className="p-1 rounded-full hover:bg-white/20 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{t.patientName}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedEmergency.patient_name}</span>
                  <span className="text-slate-500 dark:text-slate-400 block">{selectedEmergency.phone}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">{t.patientSelectEmergencyType}</span>
                  <span className="font-bold text-red-700 dark:text-red-400 text-sm">{selectedEmergency.emergency_type}</span>
                </div>
              </div>

              {/* Patient Clinical Profile & Emergency Contact (Transmitted SOS) */}
              <div className="p-3.5 bg-red-50/60 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-bold text-[11px] uppercase tracking-wider">
                    <Heart className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                    <span>Patient Clinical Profile (Transmitted on SOS)</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
                    Blood Type: {selectedEmergency.patient_blood_type || 'B+'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-red-100 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Allergies
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                      {selectedEmergency.patient_allergies || 'No known allergies reported'}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-red-100 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block flex items-center gap-1">
                      <Users className="w-3 h-3" /> Emergency Contact
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] block">
                      {selectedEmergency.patient_emergency_contact_name || 'Rajesh Rao'} ({selectedEmergency.patient_emergency_contact_relation || 'Spouse'})
                    </span>
                    {(selectedEmergency.patient_emergency_contact_phone || '+91 98451 98765') && (
                      <a
                        href={`tel:${selectedEmergency.patient_emergency_contact_phone || '+91 98451 98765'}`}
                        className="text-[10px] font-mono text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {selectedEmergency.patient_emergency_contact_phone || '+91 98451 98765'}
                      </a>
                    )}
                  </div>
                </div>

                {selectedEmergency.patient_medical_notes && (
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-red-100 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Clinical History: </span>
                    {selectedEmergency.patient_medical_notes}
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{t.driverIncidentLocation}</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedEmergency.location}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">{t.patientAssignedAmbulance}</span>
                <p className="font-bold text-slate-900 dark:text-white">
                  {selectedEmergency.vehicle_number || 'None'} • Driver: {selectedEmergency.driver_name || 'N/A'} ({selectedEmergency.driver_phone || 'N/A'})
                </p>
              </div>

              {/* Official Report Generation for Completed Missions */}
              {selectedEmergency.status === 'COMPLETED' && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                        Official Medical Report Ready
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Mission finalized & patient handover verified.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => openReportModal(selectedEmergency.id, selectedEmergency)}
                      className="flex-1 sm:flex-initial px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Report</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openReportModal(selectedEmergency.id, selectedEmergency)}
                      className="flex-1 sm:flex-initial px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status Override */}
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 block font-bold uppercase mb-1.5">
                  Admin Status Override
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['WAITING_FOR_DRIVER', 'DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED', 'COMPLETED', 'CANCELLED'] as EmergencyStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateEmergencyStatus(selectedEmergency.id, st)}
                      className={`p-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        selectedEmergency.status === st
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Report Modal */}
      <EmergencyReportModal
        emergencyId={reportModalEmergencyId || 0}
        isOpen={reportModalEmergencyId !== null}
        onClose={() => setReportModalEmergencyId(null)}
        fallbackEmergency={fallbackReportEmergency}
      />

      {/* Hospital System Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Hospital Command Settings</h3>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">System Reset & Fleet Restore</span>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  Restore default fleet telemetry, reset simulated emergencies, and clear resolved calls for a fresh command demonstration.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleResetSystemData();
                    setShowSettingsModal(false);
                  }}
                  className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore Default Fleet & Clear Calls</span>
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Command Profile Modal */}
      {showProfileModal && (
        <div id="admin-profile-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 bg-blue-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-base">Hospital Command Profile</h3>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  HC
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Emergency Operations Center</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Command & Dispatch Center • Sector 108</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                    ● Active Dispatch Authority
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Jurisdiction</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Metropolitan Trauma Network</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Dispatch Protocol</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Arogyavahini CAD-Link v2.4</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Connected Hubs</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{hospitals.length} Hospitals</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Active Ambulances</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{ambulances.length} Units</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
};
