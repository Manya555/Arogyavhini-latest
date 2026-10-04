/**
 * ==============================================================================
 * PROJECT: AROGYAVAHINI
 * MODULE:  Traffic Signal Priority Integration Service (Decoupled Hardware)
 * ==============================================================================
 * Physical hardware development and firmware testing are separated from the web app.
 * Outbound HTTP commands to ESP32 IP addresses and simulation loops are disabled.
 */

import { getSqliteDb } from '../config/database.js';

export interface TrafficJunction {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  corridor: string;
  routeA_Name: string;
  routeB_Name: string;
  status: 'ACTIVE' | 'STANDBY';
}

export interface TrafficSignalState {
  system: string;
  currentMode: string;
  hardwareStatus: string;
  lastCommand: string;
  lastUpdated: string;
  activeJunctionId: string;
}

// Managed Municipal Emergency Corridors
export const SMART_JUNCTIONS: TrafficJunction[] = [
  {
    id: 'JNC-108-A',
    name: 'Victoria Hospital Emergency Gate Junction',
    latitude: 12.9631,
    longitude: 77.5750,
    corridor: 'Kalasipalya Hospital Road',
    routeA_Name: 'Route A - City Market Expressway (Direct Emergency Corridor)',
    routeB_Name: 'Route B - Fort Cross Road (Cross Traffic)',
    status: 'ACTIVE',
  },
  {
    id: 'JNC-108-B',
    name: 'Bowring Hospital Trauma Corridor Intersection',
    latitude: 12.9835,
    longitude: 77.6030,
    corridor: 'Bowring Hospital Flyover',
    routeA_Name: 'Route A - Lady Curzon Arterial Corridor',
    routeB_Name: 'Route B - Tasker Town Cross Avenue',
    status: 'ACTIVE',
  },
  {
    id: 'JNC-108-C',
    name: 'Indiranagar 100ft Emergency Flyover Junction',
    latitude: 12.9601,
    longitude: 77.6528,
    corridor: 'Old Airport Road',
    routeA_Name: 'Route A - HAL Expressway Corridor',
    routeB_Name: 'Route B - Indiranagar 100ft Cross Road',
    status: 'ACTIVE',
  },
];

const liveSignalState: TrafficSignalState = {
  system: 'Arogyavahini Municipal Traffic Integration',
  currentMode: 'MUNICIPAL_MANAGED',
  hardwareStatus: 'EXTERNAL',
  lastCommand: 'NORMAL_MODE',
  lastUpdated: new Date().toISOString(),
  activeJunctionId: 'JNC-108-A',
};

/**
 * Handle traffic command request - hardware is decoupled and managed externally.
 */
export async function sendTrafficCommand(
  command: string,
  options?: {
    junctionId?: string;
    emergencyId?: number;
    ambulanceId?: number;
    durationSeconds?: number;
    triggeredBy?: string;
  }
): Promise<{
  success: boolean;
  mode: string;
  hardwareStatus: string;
  message: string;
  junction: TrafficJunction;
  state: TrafficSignalState;
}> {
  const junction = SMART_JUNCTIONS.find((j) => j.id === (options?.junctionId || 'JNC-108-A')) || SMART_JUNCTIONS[0];
  return {
    success: true,
    mode: 'MUNICIPAL_MANAGED',
    hardwareStatus: 'EXTERNAL',
    message: 'Physical hardware managed externally; web simulation controls are disabled.',
    junction,
    state: liveSignalState,
  };
}

/**
 * Get current traffic signal state and recent priority history
 */
export async function getTrafficSignalStatus(): Promise<{
  state: TrafficSignalState;
  junctions: TrafficJunction[];
  recentRequests: any[];
}> {
  let recentRequests: any[] = [];
  try {
    const db = await getSqliteDb();
    const result = db.exec(
      `SELECT * FROM traffic_signal_priority_requests ORDER BY id DESC LIMIT 10`
    );
    if (result && result[0]?.values) {
      const cols = result[0].columns;
      recentRequests = result[0].values.map((row) => {
        const item: any = {};
        cols.forEach((col, idx) => {
          item[col] = row[idx];
        });
        return item;
      });
    }
  } catch (err) {
    // Non-fatal
  }

  return {
    state: liveSignalState,
    junctions: SMART_JUNCTIONS,
    recentRequests,
  };
}

/**
 * Check if approaching ambulance is within traffic preemption zone (no hardware dispatch)
 */
export async function evaluateApproachingPreemption(
  emergencyId: number,
  ambulanceLat: number,
  ambulanceLng: number,
  routeName: string
): Promise<{ preemptionTriggered: boolean; message?: string }> {
  return {
    preemptionTriggered: false,
    message: 'Hardware simulation disabled. Physical hardware managed externally.',
  };
}
