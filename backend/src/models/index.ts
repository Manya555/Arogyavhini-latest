import { query } from '../config/db.js';
export * from './User.js';
export * from './Ambulance.js';
export * from './EmergencyRequest.js';

/**
 * Initializes the PostgreSQL schema and core tables matching actual Neon PostgreSQL schema
 */
export async function initPostgresSchema(): Promise<void> {
  console.log('[PostgreSQL]: Verifying and initializing core schemas (Users, Ambulances, EmergencyRequests)...');

  const ddl = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(30),
      role VARCHAR(30) NOT NULL CHECK (role IN ('patient', 'driver', 'admin')),
      auth_provider VARCHAR(50) DEFAULT 'local',
      delete_flag BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

    CREATE TABLE IF NOT EXISTS ambulances (
      id SERIAL PRIMARY KEY,
      vehicle_number VARCHAR(50) UNIQUE NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'ADVANCED_LIFE_SUPPORT',
      driver_user_id VARCHAR(50),
      driver_name VARCHAR(150),
      phone VARCHAR(30),
      base_location VARCHAR(200) NOT NULL,
      current_latitude DECIMAL(10, 7) NOT NULL,
      current_longitude DECIMAL(10, 7) NOT NULL,
      current_address VARCHAR(255),
      status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' 
          CHECK (status IN ('AVAILABLE', 'ASSIGNED', 'BUSY', 'MAINTENANCE', 'OFFLINE')),
      equipment_status JSONB DEFAULT '{"oxygen": true, "defibrillator": true, "ventilator": true, "suction": true}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_ambulances_status ON ambulances(status);

    CREATE TABLE IF NOT EXISTS emergency_requests (
      id SERIAL PRIMARY KEY,
      patient_id VARCHAR(50),
      patient_name VARCHAR(150) NOT NULL,
      emergency_type VARCHAR(100) NOT NULL,
      location VARCHAR(255) NOT NULL,
      latitude DECIMAL(10, 7) NOT NULL,
      longitude DECIMAL(10, 7) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      notes TEXT,
      driver_id VARCHAR(50),
      ambulance_id INTEGER REFERENCES ambulances(id) ON DELETE SET NULL,
      status VARCHAR(40) NOT NULL DEFAULT 'WAITING_FOR_DRIVER' 
          CHECK (status IN (
              'WAITING_FOR_DRIVER', 
              'DRIVER_ACCEPTED', 
              'ON_THE_WAY', 
              'REACHED', 
              'TRANSFERRING_TO_HOSPITAL', 
              'COMPLETED', 
              'CANCELLED'
          )),
      patient_blood_type VARCHAR(10),
      patient_allergies TEXT,
      patient_emergency_contact_name VARCHAR(150),
      patient_emergency_contact_phone VARCHAR(30),
      patient_emergency_contact_relation VARCHAR(50),
      patient_medical_notes TEXT,
      destination_hospital VARCHAR(200),
      destination_latitude DECIMAL(10, 7),
      destination_longitude DECIMAL(10, 7),
      selected_route_id VARCHAR(50),
      selected_route_name VARCHAR(150),
      route_distance_km DECIMAL(6, 2),
      route_eta_minutes INTEGER,
      current_traffic VARCHAR(30) DEFAULT 'Low',
      navigation_stage VARCHAR(50) DEFAULT 'PICKUP',
      proximity_alert_sent BOOLEAN DEFAULT FALSE,
      rating_score INTEGER,
      rating_feedback TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      accepted_at TIMESTAMP WITH TIME ZONE,
      reached_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_emergency_requests_status ON emergency_requests(status);
    CREATE INDEX IF NOT EXISTS idx_emergency_requests_created ON emergency_requests(created_at DESC);
  `;

  await query(ddl);
  console.log('✅ [PostgreSQL]: Schemas verified.');
}
