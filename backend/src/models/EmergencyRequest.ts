import { query } from '../config/db.js';

export type EmergencyStatus =
  | 'WAITING_FOR_DRIVER'
  | 'DRIVER_ACCEPTED'
  | 'ON_THE_WAY'
  | 'REACHED'
  | 'TRANSFERRING_TO_HOSPITAL'
  | 'COMPLETED'
  | 'CANCELLED';

export interface EmergencyRequest {
  id: number;
  patient_id?: string | number | null;
  patient_name: string;
  emergency_type: string;
  location: string;
  latitude: number;
  longitude: number;
  phone: string;
  notes?: string | null;
  driver_id?: string | number | null;
  ambulance_id?: number | null;
  status: EmergencyStatus;
  patient_blood_type?: string | null;
  patient_allergies?: string | null;
  patient_emergency_contact_name?: string | null;
  patient_emergency_contact_phone?: string | null;
  patient_emergency_contact_relation?: string | null;
  patient_medical_notes?: string | null;
  destination_hospital?: string | null;
  destination_latitude?: number | null;
  destination_longitude?: number | null;
  selected_route_id?: string | null;
  selected_route_name?: string | null;
  route_distance_km?: number | null;
  route_eta_minutes?: number | null;
  current_traffic?: string | null;
  navigation_stage?: string | null;
  proximity_alert_sent?: boolean;
  rating_score?: number | null;
  rating_feedback?: string | null;
  created_at?: Date | string;
  accepted_at?: Date | string | null;
  reached_at?: Date | string | null;
  completed_at?: Date | string | null;
  updated_at?: Date | string;

  // Joined fields
  vehicle_number?: string;
  driver_name?: string;
}

export interface CreateEmergencyRequestInput {
  patient_id?: string | number;
  patient_name: string;
  emergency_type: string;
  location: string;
  latitude: number;
  longitude: number;
  phone: string;
  notes?: string;
  patient_blood_type?: string;
  patient_allergies?: string;
  patient_emergency_contact_name?: string;
  patient_emergency_contact_phone?: string;
  patient_emergency_contact_relation?: string;
  patient_medical_notes?: string;
  destination_hospital?: string;
  destination_latitude?: number;
  destination_longitude?: number;
}

export class EmergencyRequestModel {
  /**
   * Get all emergency requests with optional status filter, sorted by newest
   */
  static async findAll(status?: EmergencyStatus): Promise<EmergencyRequest[]> {
    const baseQuery = `
      SELECT er.*, 
             a.vehicle_number, 
             u.name as driver_name
      FROM emergency_requests er
      LEFT JOIN ambulances a ON er.ambulance_id = a.id
      LEFT JOIN users u ON er.driver_id::text = u.id::text
    `;

    if (status) {
      const res = await query<EmergencyRequest>(
        `${baseQuery} WHERE er.status = $1 ORDER BY er.created_at DESC`,
        [status]
      );
      return res.rows;
    }

    const res = await query<EmergencyRequest>(
      `${baseQuery} ORDER BY er.created_at DESC`
    );
    return res.rows;
  }

  /**
   * Find an emergency request by ID
   */
  static async findById(id: number): Promise<EmergencyRequest | null> {
    const res = await query<EmergencyRequest>(
      `SELECT er.*, 
              a.vehicle_number, 
              u.name as driver_name
       FROM emergency_requests er
       LEFT JOIN ambulances a ON er.ambulance_id = a.id
       LEFT JOIN users u ON er.driver_id::text = u.id::text
       WHERE er.id = $1 LIMIT 1`,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Find the active emergency request for a driver
   */
  static async findActiveByDriverId(driverId: string | number): Promise<EmergencyRequest | null> {
    const res = await query<EmergencyRequest>(
      `SELECT er.*, a.vehicle_number, u.name as driver_name
       FROM emergency_requests er
       LEFT JOIN ambulances a ON er.ambulance_id = a.id
       LEFT JOIN users u ON er.driver_id::text = u.id::text
       WHERE er.driver_id::text = $1::text 
         AND er.status IN ('DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED', 'TRANSFERRING_TO_HOSPITAL')
       ORDER BY er.created_at DESC LIMIT 1`,
      [String(driverId)]
    );
    return res.rows[0] || null;
  }

  /**
   * Create a new emergency request
   */
  static async create(input: CreateEmergencyRequestInput): Promise<EmergencyRequest> {
    const res = await query<EmergencyRequest>(
      `INSERT INTO emergency_requests (
        patient_id, patient_name, emergency_type, location,
        latitude, longitude, phone, notes,
        patient_blood_type, patient_allergies,
        patient_emergency_contact_name, patient_emergency_contact_phone, patient_emergency_contact_relation,
        patient_medical_notes,
        destination_hospital, destination_latitude, destination_longitude,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'WAITING_FOR_DRIVER')
      RETURNING *`,
      [
        input.patient_id ? String(input.patient_id) : null,
        input.patient_name,
        input.emergency_type,
        input.location,
        input.latitude,
        input.longitude,
        input.phone,
        input.notes || null,
        input.patient_blood_type || null,
        input.patient_allergies || null,
        input.patient_emergency_contact_name || null,
        input.patient_emergency_contact_phone || null,
        input.patient_emergency_contact_relation || null,
        input.patient_medical_notes || null,
        input.destination_hospital || null,
        input.destination_latitude || null,
        input.destination_longitude || null,
      ]
    );
    return res.rows[0];
  }

  /**
   * Assign driver and ambulance to an emergency request
   */
  static async assignDriverAndAmbulance(
    id: number,
    driverId: string | number,
    ambulanceId: number
  ): Promise<EmergencyRequest | null> {
    const res = await query<EmergencyRequest>(
      `UPDATE emergency_requests
       SET driver_id = $1,
           ambulance_id = $2,
           status = 'DRIVER_ACCEPTED',
           accepted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [String(driverId), ambulanceId, id]
    );
    return res.rows[0] || null;
  }

  /**
   * Update lifecycle status of an emergency request
   */
  static async updateStatus(
    id: number,
    status: EmergencyStatus
  ): Promise<EmergencyRequest | null> {
    let extraClause = '';
    if (status === 'REACHED') {
      extraClause = ', reached_at = CURRENT_TIMESTAMP';
    } else if (status === 'COMPLETED' || status === 'CANCELLED') {
      extraClause = ', completed_at = CURRENT_TIMESTAMP';
    }

    const res = await query<EmergencyRequest>(
      `UPDATE emergency_requests
       SET status = $1, updated_at = CURRENT_TIMESTAMP ${extraClause}
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return res.rows[0] || null;
  }
}
