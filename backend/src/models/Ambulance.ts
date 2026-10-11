import { query } from '../config/db.js';

export type AmbulanceType =
  | 'ADVANCED_LIFE_SUPPORT'
  | 'BASIC_LIFE_SUPPORT'
  | 'CARDIAC_CARE_UNIT'
  | 'NEONATAL_ICU';

export type AmbulanceStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'BUSY'
  | 'MAINTENANCE'
  | 'OFFLINE';

export interface EquipmentStatus {
  oxygen: boolean;
  defibrillator: boolean;
  ventilator: boolean;
  suction: boolean;
  [key: string]: boolean;
}

export interface Ambulance {
  id: number;
  vehicle_number: string;
  type: AmbulanceType;
  driver_user_id?: string | number | null;
  driver_name?: string | null;
  phone?: string | null;
  base_location: string;
  current_latitude: number;
  current_longitude: number;
  current_address?: string | null;
  status: AmbulanceStatus;
  equipment_status?: EquipmentStatus;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface CreateAmbulanceInput {
  vehicle_number: string;
  type?: AmbulanceType;
  driver_user_id?: string | number;
  driver_name?: string;
  phone?: string;
  base_location: string;
  current_latitude: number;
  current_longitude: number;
  current_address?: string;
  status?: AmbulanceStatus;
  equipment_status?: EquipmentStatus;
}

export class AmbulanceModel {
  /**
   * Get all ambulances, optionally filtered by status
   */
  static async findAll(status?: AmbulanceStatus): Promise<Ambulance[]> {
    if (status) {
      const res = await query<Ambulance>(
        `SELECT * FROM ambulances WHERE status = $1 ORDER BY id ASC`,
        [status]
      );
      return res.rows;
    }
    const res = await query<Ambulance>(
      `SELECT * FROM ambulances ORDER BY id ASC`
    );
    return res.rows;
  }

  /**
   * Find ambulance by primary key ID
   */
  static async findById(id: number): Promise<Ambulance | null> {
    const res = await query<Ambulance>(
      `SELECT * FROM ambulances WHERE id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Find ambulance assigned to a specific driver
   */
  static async findByDriverUserId(driverUserId: string | number): Promise<Ambulance | null> {
    const res = await query<Ambulance>(
      `SELECT * FROM ambulances WHERE driver_user_id::text = $1::text LIMIT 1`,
      [String(driverUserId)]
    );
    return res.rows[0] || null;
  }

  /**
   * Find ambulance by registration plate
   */
  static async findByVehicleNumber(vehicleNumber: string): Promise<Ambulance | null> {
    const res = await query<Ambulance>(
      `SELECT * FROM ambulances WHERE UPPER(vehicle_number) = UPPER($1) LIMIT 1`,
      [vehicleNumber]
    );
    return res.rows[0] || null;
  }

  /**
   * Create a new ambulance record
   */
  static async create(input: CreateAmbulanceInput): Promise<Ambulance> {
    const res = await query<Ambulance>(
      `INSERT INTO ambulances (
        vehicle_number, type, driver_user_id, driver_name, phone,
        base_location, current_latitude, current_longitude, current_address,
        status, equipment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        input.vehicle_number,
        input.type || 'ADVANCED_LIFE_SUPPORT',
        input.driver_user_id ? String(input.driver_user_id) : null,
        input.driver_name || null,
        input.phone || null,
        input.base_location,
        input.current_latitude,
        input.current_longitude,
        input.current_address || null,
        input.status || 'AVAILABLE',
        JSON.stringify(
          input.equipment_status || {
            oxygen: true,
            defibrillator: true,
            ventilator: true,
            suction: true,
          }
        ),
      ]
    );
    return res.rows[0];
  }

  /**
   * Update real-time GPS coordinates of an ambulance
   */
  static async updateLocation(
    id: number,
    latitude: number,
    longitude: number,
    address?: string
  ): Promise<Ambulance | null> {
    const res = await query<Ambulance>(
      `UPDATE ambulances 
       SET current_latitude = $1, 
           current_longitude = $2, 
           current_address = COALESCE($3, current_address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [latitude, longitude, address || null, id]
    );
    return res.rows[0] || null;
  }

  /**
   * Update ambulance operational status
   */
  static async updateStatus(id: number, status: AmbulanceStatus): Promise<Ambulance | null> {
    const res = await query<Ambulance>(
      `UPDATE ambulances 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );
    return res.rows[0] || null;
  }
}
