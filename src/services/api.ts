import { User, Ambulance, EmergencyRequest, ActivityLog, SystemStats, CreateEmergencyInput, UserRole, EmergencyStatus, AmbulanceStatus, AppNotification, HospitalOption, EmergencyReport, Hospital, WardCapacityStatus, AmbulanceRatingInput, RouteOption } from '../types';

const getApiBase = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || '').trim();

  // Guard against baked-in localhost URLs leaking into production deployments
  if (typeof window !== 'undefined') {
    const isLocalhostHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (envUrl && !isLocalhostHost && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      console.warn('[API] Production environment detected: overriding localhost API URL to relative /api');
      return '/api';
    }
  }

  if (!envUrl) return '/api';
  const clean = envUrl.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

export const API_BASE = getApiBase();

export function getAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...customHeaders };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('arogyavahini_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const savedUser = localStorage.getItem('arogyavahini_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        if (u?.role) headers['x-user-role'] = u.role;
      } catch {
        // ignore
      }
    }
  }
  return headers;
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  url: string;
  data?: any;

  constructor(message: string, status: number, statusText: string, url: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.data = data;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const rawText = await res.text().catch(() => '');
  const trimmed = rawText.trim();

  // Detect HTML or plain-text Vercel 404 / 500 error pages
  const isHtml = trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<!doctype');
  const isVercel404 =
    trimmed.toLowerCase().includes('the page could not be found') ||
    trimmed.startsWith('404: NOT_FOUND') ||
    (res.status === 404 && !contentType.includes('application/json'));

  if (isHtml || isVercel404) {
    const errorMsg = isVercel404
      ? 'API endpoint not reachable (404). Please ensure backend server routes are deployed and accessible.'
      : `Received HTML document instead of JSON response (${res.status} ${res.statusText}). Please check API URL routing.`;
    
    console.error(`[API Error] Non-JSON format from ${res.url} [HTTP ${res.status}]:`, trimmed.slice(0, 180));
    throw new ApiError(errorMsg, res.status === 200 ? 404 : res.status, res.statusText, res.url, {
      rawText: trimmed.slice(0, 200),
      contentType,
    });
  }

  // Parse JSON safely
  let data: any = null;
  if (trimmed) {
    try {
      data = JSON.parse(trimmed);
    } catch (parseErr: any) {
      console.error(`[API Parse Error] JSON syntax error from ${res.url} [HTTP ${res.status}]:`, trimmed.slice(0, 180));
      throw new ApiError(
        `Unable to parse API response (${res.status}). Server returned unexpected content format.`,
        res.status,
        res.statusText,
        res.url,
        { rawText: trimmed.slice(0, 200), parseError: parseErr.message }
      );
    }
  } else {
    data = {};
  }

  // Check HTTP response ok status
  if (!res.ok) {
    const errorMsg =
      data?.error?.message ||
      data?.error ||
      data?.message ||
      `Request failed with status ${res.status}`;
    console.warn(`[API] HTTP ${res.status} from ${res.url}:`, errorMsg);
    throw new ApiError(errorMsg, res.status, res.statusText, res.url, data);
  }

  return data as T;
}

export const api = {
  // Notifications
  async getNotifications(params?: { userId?: number | string; role?: UserRole; limit?: number }): Promise<{ count: number; unreadCount: number; notifications: AppNotification[] }> {
    const query = new URLSearchParams();
    if (params?.userId) query.set('userId', params.userId.toString());
    if (params?.role) query.set('role', params.role);
    if (params?.limit) query.set('limit', params.limit.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/notifications${queryString}`);
    return handleResponse(res);
  },

  async markNotificationRead(id: number | string): Promise<{ message: string; id: number | string }> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead(params: { userId?: number | string; role?: UserRole }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async deleteNotification(id: number | string): Promise<{ message: string; id: number | string }> {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async clearAllNotifications(params: { userId?: number | string; role?: UserRole }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/notifications/clear-all`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  // Auth
  async login(email: string, password: string): Promise<{ user: User; message: string; token?: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse<{ user: User; message: string; token?: string }>(res);
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('arogyavahini_token', data.token);
    }
    return data;
  },

  async register(data: { name: string; email: string; password: string; phone?: string; role?: UserRole }): Promise<{ user: User; message: string; token?: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ user: User; message: string; token?: string }>(res);
    if (result.token && typeof window !== 'undefined') {
      localStorage.setItem('arogyavahini_token', result.token);
    }
    return result;
  },

  async demoLogin(role: UserRole): Promise<{ user: User; message: string; token?: string }> {
    const res = await fetch(`${API_BASE}/auth/demo/${role}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await handleResponse<{ user: User; message: string; token?: string }>(res);
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('arogyavahini_token', data.token);
    }
    return data;
  },

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('arogyavahini_token');
      localStorage.removeItem('arogyavahini_user');
    }
  },

  // Patient Medical Profile Management
  async getPatientProfile(userId: number | string): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/patient/profile/${userId}`);
    return handleResponse(res);
  },

  async updatePatientProfile(userId: number | string, profileData: Partial<User>): Promise<{ user: User; message: string }> {
    const res = await fetch(`${API_BASE}/patient/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },

  // Emergency Requests
  async createEmergency(input: CreateEmergencyInput): Promise<{ message: string; emergency: EmergencyRequest; ambulance?: Ambulance }> {
    const res = await fetch(`${API_BASE}/emergency`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return handleResponse(res);
  },

  async getEmergencies(params?: { patient_id?: number; ambulance_id?: number; status?: string }): Promise<{ count: number; emergencies: EmergencyRequest[] }> {
    const query = new URLSearchParams();
    if (params?.patient_id) query.set('patient_id', params.patient_id.toString());
    if (params?.ambulance_id) query.set('ambulance_id', params.ambulance_id.toString());
    if (params?.status) query.set('status', params.status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/emergency${queryString}`);
    return handleResponse(res);
  },

  async getEmergencyById(id: number): Promise<{ emergency: EmergencyRequest; logs: ActivityLog[] }> {
    const res = await fetch(`${API_BASE}/emergency/${id}`);
    return handleResponse(res);
  },

  async acceptEmergency(
    id: number,
    data: { driver_user_id?: number; driver_name?: string; ambulance_id?: number }
  ): Promise<{ message: string; emergency: EmergencyRequest; ambulance: Ambulance }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateEmergencyStatus(
    id: number,
    status: EmergencyStatus,
    updated_by?: string,
    driver_ambulance_id?: number
  ): Promise<{ message: string; emergency: EmergencyRequest }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, updated_by, driver_ambulance_id }),
    });
    return handleResponse(res);
  },

  // Submit ambulance service & response speed rating
  async submitEmergencyRating(
    id: number,
    data: AmbulanceRatingInput
  ): Promise<{ message: string; emergency: EmergencyRequest }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Automated 2km Proximity Alert Notification API
  async sendProximityAlert(
    id: number,
    data: { distance_km?: number; eta_minutes?: number }
  ): Promise<{ success: boolean; message: string; distance_km?: number; eta_minutes?: number }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/proximity-alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Emergency Patient Report API
  async getEmergencyReport(id: number): Promise<{ report: EmergencyReport }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/report`);
    return handleResponse(res);
  },

  // AI Route Optimization APIs
  async recalculateRoute(
    id: number,
    params?: { origin?: string; destination?: string; originLatitude?: number; originLongitude?: number; destLatitude?: number; destLongitude?: number }
  ): Promise<{ message: string; emergency: EmergencyRequest; routeOptimization: any; hospitalOptimization: any }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/recalculate-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });
    return handleResponse(res);
  },

  async updateDriverLocation(
    id: number,
    coords: { latitude: number; longitude: number; accuracy?: number; speed?: number; heading?: number }
  ): Promise<{ success: boolean; message: string; location: { latitude: number; longitude: number; accuracy?: number; updated_at: string } }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/driver-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coords),
    });
    return handleResponse(res);
  },

  async findNearbyHospitals(
    id: number,
    params?: { latitude?: number; longitude?: number }
  ): Promise<{ message: string; source: 'live_places' | 'fallback'; hospitals: HospitalOption[]; emergency: EmergencyRequest }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/find-hospitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params || {}),
    });
    return handleResponse(res);
  },

  async navigateToHospital(
    id: number,
    params: { hospitalName: string; hospitalCoords?: [number, number]; driverCoords?: { latitude: number; longitude: number } }
  ): Promise<{ message: string; stage: string; emergency: EmergencyRequest; routeOptimization: any }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/navigate-to-hospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async getNearbyHospitals(params: { lat: number; lng: number; emergencyType?: string; radius?: number }): Promise<{
    hospitals: HospitalOption[];
    source: 'live_places' | 'fallback';
    message: string;
  }> {
    const q = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      emergencyType: params.emergencyType || 'General',
      radius: (params.radius || 10000).toString(),
    });
    const res = await fetch(`${API_BASE}/nearby-hospitals?${q.toString()}`);
    return handleResponse(res);
  },

  async getHospitals(): Promise<{ hospitals: Hospital[] }> {
    const res = await fetch(`${API_BASE}/hospitals`);
    return handleResponse(res);
  },

  async updateHospitalCapacity(
    id: number | string,
    ward_capacity: WardCapacityStatus,
    available_beds?: number
  ): Promise<{ message: string; hospital: Hospital }> {
    const res = await fetch(`${API_BASE}/hospitals/${id}/capacity`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ward_capacity, available_beds }),
    });
    return handleResponse(res);
  },

  async toggleHospitalCapacity(id: number | string): Promise<{ message: string; hospital: Hospital }> {
    const res = await fetch(`${API_BASE}/hospitals/${id}/toggle-capacity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  async selectRoute(
    id: number,
    routeId: string
  ): Promise<{ message: string; emergency: EmergencyRequest; selectedRoute: any }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/select-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeId }),
    });
    return handleResponse(res);
  },

  async startNavigation(
    id: number
  ): Promise<{ message: string; emergency: EmergencyRequest }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/start-navigation`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async selectHospital(
    id: number,
    hospitalName: string,
    hospitalId?: string
  ): Promise<{ message: string; emergency: EmergencyRequest }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/select-hospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hospitalName, hospitalId }),
    });
    return handleResponse(res);
  },

  // Ambulances
  async getAmbulances(): Promise<{ count: number; ambulances: Ambulance[] }> {
    const res = await fetch(`${API_BASE}/ambulances`);
    return handleResponse(res);
  },

  async getAvailableAmbulances(): Promise<{ count: number; ambulances: Ambulance[] }> {
    const res = await fetch(`${API_BASE}/ambulances/available`);
    return handleResponse(res);
  },

  async createAmbulance(data: {
    vehicle_number: string;
    driver_name: string;
    phone: string;
    type?: string;
    base_location: string;
    status?: AmbulanceStatus;
  }): Promise<{ message: string; ambulance: Ambulance }> {
    const res = await fetch(`${API_BASE}/ambulances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateAmbulanceStatus(id: number, status: AmbulanceStatus): Promise<{ message: string; ambulance: Ambulance }> {
    const res = await fetch(`${API_BASE}/ambulances/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },

  async updateAmbulanceLocation(
    id: number,
    coords: { latitude: number; longitude: number; accuracy?: number; speed?: number; heading?: number }
  ): Promise<{ success: boolean; message: string; ambulance_id: number; latitude: number; longitude: number; updated_at: string }> {
    const res = await fetch(`${API_BASE}/ambulances/${id}/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coords),
    });
    return handleResponse(res);
  },

  // Stats
  async getStats(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE}/stats`);
    return handleResponse(res);
  },

  // Reverse Geocoding API
  async reverseGeocode(lat: number, lng: number): Promise<{ formattedAddress: string; displayName: string; source: string; latitude: number; longitude: number }> {
    const res = await fetch(`${API_BASE}/reverse-geocode?lat=${lat}&lng=${lng}`);
    return handleResponse(res);
  },

  // Fleet location synchronization with user GPS
  async syncFleetLocation(data: { latitude: number; longitude: number; address?: string }): Promise<{ message: string; ambulances: Ambulance[] }> {
    const res = await fetch(`${API_BASE}/fleet/sync-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // IP Location Fallback
  async getIpLocation(): Promise<{ latitude: number; longitude: number; city: string; region: string; country: string; source: string }> {
    const res = await fetch(`${API_BASE}/ip-location`);
    return handleResponse(res);
  },

  // Reset Demo DB
  async resetDatabase(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/demo/reset`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Voice-to-Text & Symptom Triaging
  async analyzeSymptoms(payload: { rawTranscript: string; language?: string }): Promise<{
    success: boolean;
    source?: string;
    clinicalSummary: string;
    recommendedEmergencyType?: string;
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    symptoms: string[];
    dispatcherNotes: string;
    firstAidTip?: string;
  }> {
    const res = await fetch(`${API_BASE}/analyze-symptoms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Update emergency notes (e.g. for active emergencies)
  async updateEmergencyNotes(id: number, payload: { notes: string; updatedBy?: string }): Promise<{
    message: string;
    id: number;
    notes: string;
  }> {
    const res = await fetch(`${API_BASE}/emergency/${id}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Real-World Navigation APIs
  async getNavigationRoute(params: {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    emergencyId?: number;
    emergencyType?: string;
  }): Promise<{
    success: boolean;
    route: RouteOption;
    source: 'osrm' | 'google_routes' | 'fallback';
    steps: any[];
    distanceKm: number;
    estimatedMinutes: number;
    traffic: 'Low' | 'Moderate' | 'Heavy';
  }> {
    const query = new URLSearchParams({
      originLat: String(params.originLat),
      originLng: String(params.originLng),
      destLat: String(params.destLat),
      destLng: String(params.destLng),
    });
    if (params.emergencyId) query.set('emergencyId', String(params.emergencyId));
    if (params.emergencyType) query.set('emergencyType', params.emergencyType);

    const res = await fetch(`${API_BASE}/navigation/route?${query.toString()}`);
    return handleResponse(res);
  },

  async getNavigationEta(params: {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    speed?: number;
  }): Promise<{
    success: boolean;
    distanceKm: number;
    distanceMeters: number;
    estimatedMinutes: number;
    etaTimestamp: string;
    etaFormatted: string;
    traffic: 'Low' | 'Moderate' | 'Heavy';
  }> {
    const query = new URLSearchParams({
      originLat: String(params.originLat),
      originLng: String(params.originLng),
      destLat: String(params.destLat),
      destLng: String(params.destLng),
    });
    if (params.speed) query.set('speed', String(params.speed));

    const res = await fetch(`${API_BASE}/navigation/eta?${query.toString()}`);
    return handleResponse(res);
  },

  async getNavigationNearbyHospitals(params: {
    lat: number;
    lng: number;
    radius?: number;
    emergencyType?: string;
  }): Promise<{
    success: boolean;
    hospitals: any[];
    count: number;
    nearestAvailable: any | null;
  }> {
    const query = new URLSearchParams({
      lat: String(params.lat),
      lng: String(params.lng),
    });
    if (params.radius) query.set('radius', String(params.radius));
    if (params.emergencyType) query.set('emergencyType', params.emergencyType);

    const res = await fetch(`${API_BASE}/navigation/nearby-hospitals?${query.toString()}`);
    return handleResponse(res);
  },

  async getNavigationTraffic(params?: {
    lat?: number;
    lng?: number;
    routeId?: string;
    emergencyId?: number;
  }): Promise<{
    success: boolean;
    corridorStatus: string;
    trafficCondition: string;
  }> {
    const query = new URLSearchParams();
    if (params?.lat) query.set('lat', String(params.lat));
    if (params?.lng) query.set('lng', String(params.lng));
    if (params?.routeId) query.set('routeId', params.routeId);
    if (params?.emergencyId) query.set('emergencyId', String(params.emergencyId));

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/navigation/traffic${qs}`);
    return handleResponse(res);
  },

  // ER In-Transit Monitoring & Telemetry
  async getInTransitEREmergencies(): Promise<{ incoming_transfers: EmergencyRequest[] }> {
    const res = await fetch(`${API_BASE}/emergency/in-transit-er`);
    return handleResponse(res);
  },

  async transmitVitals(emergencyId: number, vitals: Record<string, any>): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${API_BASE}/emergency/${emergencyId}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vitals),
    });
    return handleResponse(res);
  },
};

