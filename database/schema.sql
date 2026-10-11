-- ==============================================================================
-- PROJECT: AROGYAVAHINI – SMART EMERGENCY AMBULANCE MANAGEMENT & TRAFFIC SIGNAL PRIORITY
-- DATABASE: PostgreSQL 14+ Relational Schema
-- ==============================================================================
-- This schema establishes all 12 core relational entities with strict primary keys,
-- foreign keys, cascading rules, enum-constrained statuses, and optimized indexes.
-- ==============================================================================

-- Clean slate initialization (optional in staging environments)
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;

-- Enable UUID extension if UUID primary keys are preferred
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. USERS TABLE (Role-Based Authentication & Profiles)
-- ==============================================================================
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

-- ==============================================================================
-- 2. PATIENTS TABLE (Dedicated Clinical Patient Registry)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    national_health_id VARCHAR(50) UNIQUE,
    date_of_birth DATE,
    gender VARCHAR(20),
    home_address TEXT,
    primary_hospital_preference VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. DRIVERS TABLE (Registered Paramedic Ambulance Drivers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(80) UNIQUE NOT NULL,
    badge_number VARCHAR(50) UNIQUE,
    experience_years INTEGER DEFAULT 3,
    duty_status VARCHAR(30) DEFAULT 'ON_DUTY' CHECK (duty_status IN ('ON_DUTY', 'OFF_DUTY', 'ON_MISSION', 'RESTING')),
    assigned_ambulance_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. AMBULANCES TABLE (Fleet Units & Live Telemetry)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ambulances (
    id SERIAL PRIMARY KEY,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'ADVANCED_LIFE_SUPPORT' CHECK (type IN ('ADVANCED_LIFE_SUPPORT', 'BASIC_LIFE_SUPPORT', 'CARDIAC_CARE_UNIT', 'NEONATAL_ICU')),
    driver_user_id VARCHAR(50),
    driver_name VARCHAR(150),
    phone VARCHAR(30),
    base_location VARCHAR(200) NOT NULL,
    current_latitude DECIMAL(10, 7) NOT NULL,
    current_longitude DECIMAL(10, 7) NOT NULL,
    current_address VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ASSIGNED', 'BUSY', 'MAINTENANCE', 'OFFLINE')),
    equipment_status JSONB DEFAULT '{"oxygen": true, "defibrillator": true, "ventilator": true, "suction": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ambulances_status ON ambulances(status);
CREATE INDEX IF NOT EXISTS idx_ambulances_location ON ambulances(current_latitude, current_longitude);

-- Connect drivers table foreign key to ambulances
ALTER TABLE drivers ADD CONSTRAINT fk_drivers_ambulance FOREIGN KEY (assigned_ambulance_id) REFERENCES ambulances(id) ON DELETE SET NULL;

-- ==============================================================================
-- 5. HOSPITALS TABLE (Emergency Trauma Centers & Bed Capacities)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS hospitals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    specialty VARCHAR(150) NOT NULL DEFAULT 'Multi-Specialty & Trauma Care',
    address TEXT NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    emergency_contact VARCHAR(30),
    ward_capacity VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE' CHECK (ward_capacity IN ('AVAILABLE', 'CRITICAL', 'FULL', 'RESTRICTED')),
    available_beds INTEGER NOT NULL DEFAULT 12,
    total_beds INTEGER NOT NULL DEFAULT 40,
    icu_available_beds INTEGER NOT NULL DEFAULT 4,
    icu_total_beds INTEGER NOT NULL DEFAULT 12,
    trauma_level VARCHAR(20) DEFAULT 'LEVEL_1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hospitals_capacity ON hospitals(ward_capacity);

-- ==============================================================================
-- 6. EMERGENCY_REQUESTS TABLE (Core SOS Mission Lifecycle)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS emergency_requests (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    patient_name VARCHAR(150) NOT NULL,
    emergency_type VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    notes TEXT,
    
    -- Dispatch and Lifecycle
    driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ambulance_id INTEGER REFERENCES ambulances(id) ON DELETE SET NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'WAITING_FOR_DRIVER' 
        CHECK (status IN ('WAITING_FOR_DRIVER', 'DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED', 'TRANSFERRING_TO_HOSPITAL', 'COMPLETED', 'CANCELLED')),
    
    -- Pre-hospital Patient Clinical Snapshot
    patient_blood_type VARCHAR(10),
    patient_allergies TEXT,
    patient_emergency_contact_name VARCHAR(150),
    patient_emergency_contact_phone VARCHAR(30),
    patient_emergency_contact_relation VARCHAR(50),
    patient_medical_notes TEXT,
    
    -- Live Navigation & AI Route Optimization Data
    destination_hospital VARCHAR(200),
    destination_latitude DECIMAL(10, 7),
    destination_longitude DECIMAL(10, 7),
    selected_route_id VARCHAR(50),
    selected_route_name VARCHAR(150),
    route_distance_km DECIMAL(6, 2),
    route_eta_minutes INTEGER,
    current_traffic VARCHAR(30) DEFAULT 'Low',
    navigation_stage VARCHAR(50) DEFAULT 'PICKUP',
    
    -- Proximity & Rating
    proximity_alert_sent BOOLEAN DEFAULT FALSE,
    rating_score INTEGER CHECK (rating_score BETWEEN 1 AND 5),
    rating_feedback TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    reached_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emergencies_status ON emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergencies_patient ON emergency_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergencies_ambulance ON emergency_requests(ambulance_id);

-- ==============================================================================
-- 7. AMBULANCE_ASSIGNMENTS TABLE (Historical Dispatch Audit)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ambulance_assignments (
    id SERIAL PRIMARY KEY,
    emergency_id INTEGER NOT NULL REFERENCES emergency_requests(id) ON DELETE CASCADE,
    ambulance_id INTEGER NOT NULL REFERENCES ambulances(id) ON DELETE CASCADE,
    driver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    response_time_seconds INTEGER,
    outcome VARCHAR(30) DEFAULT 'ASSIGNED' CHECK (outcome IN ('ASSIGNED', 'ACCEPTED', 'REJECTED', 'TRANSFERRED', 'COMPLETED'))
);

-- ==============================================================================
-- 8. AMBULANCE_LOCATION_HISTORY TABLE (GPS Telemetry Breadcrumbs)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ambulance_location_history (
    id SERIAL PRIMARY KEY,
    ambulance_id INTEGER NOT NULL REFERENCES ambulances(id) ON DELETE CASCADE,
    emergency_id INTEGER REFERENCES emergency_requests(id) ON DELETE SET NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    accuracy_meters DECIMAL(6, 2),
    speed_kmh DECIMAL(5, 2),
    heading_degrees DECIMAL(5, 2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_location_history_amb ON ambulance_location_history(ambulance_id, recorded_at DESC);

-- ==============================================================================
-- 9. PATIENT_REPORTS TABLE (Finalized Pre-Hospital Clinical Summaries)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS patient_reports (
    id SERIAL PRIMARY KEY,
    report_id VARCHAR(50) UNIQUE NOT NULL,
    emergency_id INTEGER UNIQUE NOT NULL REFERENCES emergency_requests(id) ON DELETE CASCADE,
    patient_name VARCHAR(150) NOT NULL,
    blood_group VARCHAR(10),
    allergies TEXT,
    emergency_type VARCHAR(100) NOT NULL,
    incident_location VARCHAR(255) NOT NULL,
    destination_hospital VARCHAR(200),
    ambulance_number VARCHAR(50),
    driver_name VARCHAR(150),
    total_response_time_minutes INTEGER,
    dispatch_time TIMESTAMP WITH TIME ZONE,
    arrival_time TIMESTAMP WITH TIME ZONE,
    handover_time TIMESTAMP WITH TIME ZONE,
    vitals_recorded JSONB DEFAULT '{"heart_rate": 82, "blood_pressure": "120/80", "spo2": 98, "respiratory_rate": 16}',
    clinical_notes TEXT,
    paramedic_signature VARCHAR(100),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 10. TRAFFIC_SIGNAL_PRIORITY_REQUESTS TABLE (IoT & ESP32 Preemption Log)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS traffic_signal_priority_requests (
    id SERIAL PRIMARY KEY,
    emergency_id INTEGER REFERENCES emergency_requests(id) ON DELETE SET NULL,
    ambulance_id INTEGER REFERENCES ambulances(id) ON DELETE SET NULL,
    junction_id VARCHAR(50) NOT NULL,
    junction_name VARCHAR(150) NOT NULL,
    route_direction VARCHAR(30) NOT NULL CHECK (route_direction IN ('ROUTE_A', 'ROUTE_B', 'NORMAL_MODE', 'RESTORE_NORMAL')),
    command_sent VARCHAR(50) NOT NULL,
    esp32_ip_address VARCHAR(45) NOT NULL,
    http_status_code INTEGER,
    execution_status VARCHAR(30) NOT NULL DEFAULT 'SENT' CHECK (execution_status IN ('SENT', 'SUCCESS', 'HARDWARE_OFFLINE', 'TIMEOUT', 'FAILED')),
    priority_duration_seconds INTEGER DEFAULT 25,
    triggered_by VARCHAR(50) DEFAULT 'AUTO_APPROACH_SENSOR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    restored_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_traffic_priority_junction ON traffic_signal_priority_requests(junction_id);
CREATE INDEX IF NOT EXISTS idx_traffic_priority_emergency ON traffic_signal_priority_requests(emergency_id);

-- ==============================================================================
-- 11. NOTIFICATIONS TABLE (Multi-Role Alert Feeds)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('patient', 'driver', 'admin', 'all')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(40) NOT NULL DEFAULT 'SYSTEM_ALERT' CHECK (type IN ('EMERGENCY_DISPATCH', 'DRIVER_ACCEPTED', 'PROXIMITY_ALERT', 'PATIENT_PICKED_UP', 'TRAFFIC_PRIORITY_ACTIVATED', 'HOSPITAL_ALERT', 'SYSTEM_ALERT')),
    related_emergency_id INTEGER REFERENCES emergency_requests(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(role, is_read);

-- ==============================================================================
-- 12. SYSTEM_LOGS TABLE (Immutable Governance & Audit Trail)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    emergency_id INTEGER REFERENCES emergency_requests(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    performed_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM_ENGINE',
    client_ip VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_logs_emergency ON system_logs(emergency_id);

-- ==============================================================================
-- SEED DATA (Demo Setup for Presentation & Viva Demonstration)
-- ==============================================================================

-- 1. Users (using UUIDs and password_hash bcrypt)
INSERT INTO users (id, client_id, name, email, password_hash, phone, role, auth_provider, delete_flag)
VALUES 
  ('11111111-1111-4111-a111-111111111111', '00000000-0000-0000-0000-000000000001', 'Pooja Sharma', 'pooja.patient@arogyavahini.gov.in', '$2a$10$wK1c7FvV2w6nNn8t1jUvxeY71vQ5tZ8W8N1m5k0h8z2l4b6n8q0y', '+91 98765 43210', 'patient', 'local', false),
  ('22222222-2222-4222-a222-222222222222', '00000000-0000-0000-0000-000000000001', 'Ramesh Kumar', 'ramesh.driver@arogyavahini.gov.in', '$2a$10$wK1c7FvV2w6nNn8t1jUvxeY71vQ5tZ8W8N1m5k0h8z2l4b6n8q0y', '+91 98765 11111', 'driver', 'local', false),
  ('33333333-3333-4333-a333-333333333333', '00000000-0000-0000-0000-000000000001', 'Dr. Aris Thorne', 'admin@arogyavahini.gov.in', '$2a$10$wK1c7FvV2w6nNn8t1jUvxeY71vQ5tZ8W8N1m5k0h8z2l4b6n8q0y', '+91 98765 00000', 'admin', 'local', false)
ON CONFLICT (email) DO NOTHING;

-- 2. Ambulances
INSERT INTO ambulances (id, vehicle_number, type, driver_user_id, driver_name, phone, base_location, current_latitude, current_longitude, current_address, status)
VALUES
  (1, 'KA-01-EA-1081', 'ADVANCED_LIFE_SUPPORT', '22222222-2222-4222-a222-222222222222', 'Ramesh Kumar', '+91 98765 11111', 'Victoria Hospital Emergency Base, Bangalore', 12.9628, 77.5756, 'Victoria Hospital Base, Kalasipalya', 'AVAILABLE'),
  (2, 'KA-01-EA-1082', 'CARDIAC_CARE_UNIT', NULL, 'Suresh Gowda', '+91 98765 22222', 'Bowring & Lady Curzon Hospital, Shivaji Nagar', 12.9833, 77.6033, 'Shivaji Nagar Trauma Hub', 'AVAILABLE'),
  (3, 'KA-01-EA-1083', 'BASIC_LIFE_SUPPORT', NULL, 'Mahesh Patel', '+91 98765 33333', 'Manipal Hospital, Old Airport Road', 12.9592, 77.6534, 'Indiranagar Flyover Junction', 'AVAILABLE'),
  (4, 'KA-01-EA-1084', 'NEONATAL_ICU', NULL, 'Anil Verma', '+91 98765 44444', 'Apollo Hospitals, Bannerghatta Road', 12.8948, 77.5985, 'Bannerghatta Tech Corridor', 'AVAILABLE')
ON CONFLICT (vehicle_number) DO NOTHING;

-- 3. Hospitals
INSERT INTO hospitals (id, name, specialty, address, latitude, longitude, phone, emergency_contact, ward_capacity, available_beds, total_beds, icu_available_beds, icu_total_beds)
VALUES
  (1, 'Victoria Hospital & Trauma Emergency Centre', 'Level-1 Government Trauma & Acute Resuscitation', 'Fort Road, Near City Market, Kalasipalya, Bengaluru 560002', 12.9634, 77.5746, '+91 80 2670 1150', '108-EXT-101', 'AVAILABLE', 16, 45, 6, 15),
  (2, 'Bowring & Lady Curzon Emergency Hospital', 'Cardiac Emergency & Neuro-Trauma', 'Lady Curzon Rd, Tasker Town, Shivaji Nagar, Bengaluru 560001', 12.9839, 77.6025, '+91 80 2559 1325', '108-EXT-102', 'AVAILABLE', 8, 30, 3, 10),
  (3, 'Manipal Hospital Bengaluru', 'Advanced Cardiac, Stroke & Multi-Organ ICU', '98, HAL Old Airport Rd, Kodihalli, Bengaluru 560017', 12.9590, 77.6531, '+91 80 2502 4444', '108-EXT-103', 'AVAILABLE', 12, 35, 4, 12)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence counters
SELECT setval('ambulances_id_seq', (SELECT MAX(id) FROM ambulances));
SELECT setval('hospitals_id_seq', (SELECT MAX(id) FROM hospitals));
