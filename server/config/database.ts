/**
 * ==============================================================================
 * PROJECT: AROGYAVAHINI
 * MODULE:  Backend Database Configuration (Neon PostgreSQL & Resilient Local Fallback)
 * ==============================================================================
 * This module configures a production-grade PostgreSQL connection pool using 'pg'.
 * When PostgreSQL credentials (DATABASE_URL, POSTGRES_URL, PGHOST, etc.) are provided,
 * queries execute directly against Neon PostgreSQL.
 * SQLite is only initialized when PostgreSQL credentials are not provided (local dev).
 */

import pg from 'pg';
import { hashPassword } from '../security.js';

const { Pool } = pg;

// Helper to lazy-load SQLite only when explicitly running in local SQLite fallback mode
async function loadSqlite() {
  const { getDb, saveDb } = await import('../db.js');
  return { getDb, saveDb };
}

// Detect PostgreSQL configuration from environment (supports Neon DATABASE_URL & POSTGRES_URL)
const rawConnectionString = (
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  process.env.POSTGRES_PRISMA_URL || 
  process.env.POSTGRES_URL_NON_POOLING || 
  ''
).trim();
const isPostgresEnabled = Boolean(
  rawConnectionString || 
  (process.env.PGHOST && process.env.PGDATABASE)
);

let pool: pg.Pool | null = null;

if (isPostgresEnabled) {
  try {
    const isSslDisabled = process.env.DB_SSL === 'false';
    const useSsl = !isSslDisabled && (
      Boolean(rawConnectionString && (
        rawConnectionString.includes('neon.tech') ||
        rawConnectionString.includes('sslmode=require') ||
        rawConnectionString.includes('amazonaws.com') ||
        rawConnectionString.includes('supabase.co')
      )) ||
      process.env.DB_SSL === 'true' ||
      process.env.NODE_ENV === 'production'
    );

    pool = new Pool({
      connectionString: rawConnectionString || undefined,
      host: process.env.PGHOST || process.env.POSTGRES_HOST,
      port: process.env.PGPORT ? Number(process.env.PGPORT) : (process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : undefined),
      database: process.env.PGDATABASE || process.env.POSTGRES_DATABASE || 'arogyavahini',
      user: process.env.PGUSER || process.env.POSTGRES_USER || 'postgres',
      password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: process.env.PG_MAX_POOL ? parseInt(process.env.PG_MAX_POOL, 10) : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // 10s timeout to allow Neon serverless compute wake-up
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]:', err);
    });

    console.log('🐘 [Database] Neon PostgreSQL connection pool initialized.');
  } catch (err) {
    console.warn('⚠️ [Database] Failed to initialize PostgreSQL pool:', err);
    pool = null;
  }
} else {
  console.log('ℹ️ [Database] PostgreSQL not configured in environment. Using embedded SQLite fallback.');
}

/**
 * Check if PostgreSQL is actively configured
 */
export function isPostgresActive(): boolean {
  return pool !== null;
}

/**
 * Get direct access to the PostgreSQL connection pool
 */
export function getPostgresPool(): pg.Pool | null {
  return pool;
}

/**
 * Initializes and verifies core schemas and demo accounts in Neon PostgreSQL
 */
export async function initPostgresSchema(poolInstance: pg.Pool): Promise<void> {
  const client = await poolInstance.connect();
  try {
    // 1. Ensure core users table exists matching existing Neon schema
    await client.query(`
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
    `);

    // 2. Ensure ambulances table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS ambulances (
        id SERIAL PRIMARY KEY,
        vehicle_number VARCHAR(50) UNIQUE NOT NULL,
        driver_user_id VARCHAR(50),
        driver_name VARCHAR(150) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        type VARCHAR(50) DEFAULT 'Basic Life Support (BLS)',
        base_location VARCHAR(200) NOT NULL,
        status VARCHAR(30) DEFAULT 'AVAILABLE',
        current_latitude DECIMAL(10, 7),
        current_longitude DECIMAL(10, 7),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Ensure emergency_requests table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_requests (
        id SERIAL PRIMARY KEY,
        patient_id VARCHAR(50),
        patient_name VARCHAR(150) NOT NULL,
        emergency_type VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 7) NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        phone VARCHAR(30) NOT NULL,
        driver_id VARCHAR(50),
        ambulance_id INTEGER,
        status VARCHAR(40) DEFAULT 'WAITING_FOR_DRIVER',
        route_origin TEXT,
        route_destination TEXT,
        optimized_routes TEXT,
        selected_route_id VARCHAR(50),
        current_eta_minutes REAL,
        current_distance_km REAL,
        current_traffic VARCHAR(30) DEFAULT 'Low',
        hospital_routes TEXT,
        selected_hospital VARCHAR(200),
        hospital_destination VARCHAR(200),
        navigation_started INTEGER DEFAULT 0,
        driver_current_latitude REAL,
        driver_current_longitude REAL,
        driver_accuracy REAL,
        navigation_stage VARCHAR(50) DEFAULT 'TO_PATIENT',
        route_updated_at TIMESTAMP WITH TIME ZONE,
        accepted_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        rating_overall_stars INTEGER,
        rating_speed_stars INTEGER,
        rating_service_stars INTEGER,
        rating_feedback TEXT,
        rating_submitted_at TIMESTAMP WITH TIME ZONE,
        patient_blood_type VARCHAR(10),
        patient_allergies TEXT,
        patient_emergency_contact_name VARCHAR(150),
        patient_emergency_contact_phone VARCHAR(30),
        patient_emergency_contact_relation VARCHAR(50),
        patient_medical_notes TEXT,
        vitals_heart_rate INTEGER,
        vitals_blood_pressure VARCHAR(30),
        vitals_spo2 INTEGER,
        vitals_respiratory_rate INTEGER,
        vitals_gcs INTEGER,
        vitals_blood_sugar INTEGER,
        triage_acuity VARCHAR(30),
        er_notified_at TIMESTAMP WITH TIME ZONE,
        er_prep_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Non-destructive column migrations for UUID foreign references
    try {
      await client.query('ALTER TABLE emergency_requests ALTER COLUMN driver_id TYPE VARCHAR(50) USING driver_id::text;');
    } catch { /* non-blocking */ }
    try {
      await client.query('ALTER TABLE emergency_requests ALTER COLUMN patient_id TYPE VARCHAR(50) USING patient_id::text;');
    } catch { /* non-blocking */ }

    // 4. Ensure hospitals table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        specialty VARCHAR(200) NOT NULL,
        address VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 7) NOT NULL,
        longitude DECIMAL(10, 7) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        total_beds INTEGER DEFAULT 20,
        available_beds INTEGER DEFAULT 12,
        ward_capacity VARCHAR(30) DEFAULT 'AVAILABLE',
        rating DECIMAL(3, 1) DEFAULT 4.6,
        type VARCHAR(100) DEFAULT 'Multi-Specialty Emergency Hospital'
      );
    `);

    // 5. Ensure notifications and activity_logs exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50),
        role VARCHAR(30),
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        emergency_request_id INTEGER,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    try {
      await client.query('ALTER TABLE notifications ALTER COLUMN user_id TYPE VARCHAR(50) USING user_id::text;');
    } catch { /* non-blocking */ }

    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        emergency_id INTEGER,
        action TEXT NOT NULL,
        performed_by VARCHAR(100) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS traffic_signal_priority_requests (
        id SERIAL PRIMARY KEY,
        emergency_id INTEGER,
        ambulance_id INTEGER,
        junction_id VARCHAR(50) NOT NULL,
        junction_name VARCHAR(150) NOT NULL,
        route_direction VARCHAR(50) NOT NULL,
        command_sent VARCHAR(50) NOT NULL,
        esp32_ip_address VARCHAR(50) NOT NULL,
        http_status_code INTEGER,
        execution_status VARCHAR(30) DEFAULT 'SENT',
        priority_duration_seconds INTEGER DEFAULT 25,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Seed demo users into PostgreSQL if empty
    const userCountRes = await client.query('SELECT COUNT(*) as count FROM users WHERE delete_flag IS FALSE OR delete_flag IS NULL');
    if (parseInt(userCountRes.rows[0].count, 10) === 0) {
      console.log('🌱 [Database] Seeding initial demo accounts in Neon PostgreSQL...');
      const demoPatientPass = hashPassword('password123');
      const demoDriverPass = hashPassword('password123');
      const demoAdminPass = hashPassword('password123');
      await client.query(`
        INSERT INTO users (id, client_id, name, email, password_hash, phone, role, auth_provider, delete_flag) VALUES
        ('11111111-1111-4111-a111-111111111111', '00000000-0000-0000-0000-000000000001', 'Priya Rao', 'patient@arogyavahini.in', $1, '+91 98765 43210', 'patient', 'local', false),
        ('22222222-2222-4222-a222-222222222222', '00000000-0000-0000-0000-000000000001', 'Mohammed Irfan', 'driver@arogyavahini.in', $2, '+91 97410 54321', 'driver', 'local', false),
        ('33333333-3333-4333-a333-333333333333', '00000000-0000-0000-0000-000000000001', 'Dr. Arvind Deshmukh', 'admin@arogyavahini.in', $3, '+91 98111 22334', 'admin', 'local', false)
        ON CONFLICT (email) DO NOTHING;
      `, [demoPatientPass, demoDriverPass, demoAdminPass]);
    }

    // 7. Seed demo ambulances into PostgreSQL if empty
    const ambCountRes = await client.query('SELECT COUNT(*) as count FROM ambulances');
    if (parseInt(ambCountRes.rows[0].count, 10) === 0) {
      console.log('🌱 [Database] Seeding unified fleet in Neon PostgreSQL...');
      await client.query(`
        INSERT INTO ambulances (id, vehicle_number, driver_user_id, driver_name, phone, type, base_location, status, current_latitude, current_longitude) VALUES
        (1, 'KA-01-EA-1008', '22222222-2222-4222-a222-222222222222', 'Mohammed Irfan', '+91 97410 54321', 'Advanced Cardiac Life Support (ACLS)', 'Central Trauma Center, Block A', 'AVAILABLE', 12.9716, 77.5946),
        (2, 'KA-05-EM-2044', NULL, 'Suresh Gowda', '+91 98860 67890', 'Basic Life Support (BLS)', 'Indiranagar Emergency Hub', 'AVAILABLE', 12.9783, 77.6408),
        (3, 'KA-03-AX-3091', NULL, 'Ramesh Kumar', '+91 98450 12345', 'Critical Care Response Unit', 'Jayanagar General Hospital', 'AVAILABLE', 12.9250, 77.5938)
        ON CONFLICT (id) DO NOTHING;
      `);
      try {
        await client.query("SELECT setval(pg_get_serial_sequence('ambulances', 'id'), COALESCE(MAX(id), 1)) FROM ambulances;");
      } catch { /* sequence might not exist */ }
    }

    // 8. Seed hospitals into PostgreSQL if empty
    const hospCountRes = await client.query('SELECT COUNT(*) as count FROM hospitals');
    if (parseInt(hospCountRes.rows[0].count, 10) === 0) {
      console.log('🌱 [Database] Seeding hospitals in Neon PostgreSQL...');
      await client.query(`
        INSERT INTO hospitals (id, name, specialty, address, latitude, longitude, phone, total_beds, available_beds, ward_capacity, rating, type) VALUES
        (1, 'Victoria Hospital & Trauma Emergency Centre', 'Level-1 Government Trauma & Acute Resuscitation', 'Fort Road, Near City Market, Kalasipalya, Bengaluru 560002', 12.9634, 77.5746, '+91 80 2670 1150', 45, 16, 'AVAILABLE', 4.8, 'Apex Trauma Center'),
        (2, 'Bowring & Lady Curzon Emergency Hospital', 'Cardiac Emergency & Neuro-Trauma', 'Lady Curzon Rd, Tasker Town, Shivaji Nagar, Bengaluru 560001', 12.9839, 77.6025, '+91 80 2559 1325', 30, 8, 'AVAILABLE', 4.6, 'Emergency Critical Care'),
        (3, 'Manipal Hospital Bengaluru', 'Advanced Cardiac, Stroke & Multi-Organ ICU', '98, HAL Old Airport Rd, Kodihalli, Bengaluru 560017', 12.9590, 77.6531, '+91 80 2502 4444', 35, 12, 'AVAILABLE', 4.9, 'Multi-Specialty Emergency Hospital')
        ON CONFLICT (id) DO NOTHING;
      `);
      try {
        await client.query("SELECT setval(pg_get_serial_sequence('hospitals', 'id'), COALESCE(MAX(id), 1)) FROM hospitals;");
      } catch { /* sequence might not exist */ }
    }

    console.log('✅ [Database] Neon PostgreSQL schemas verified and seeded.');
  } finally {
    client.release();
  }
}

/**
 * Pre-initializes database connection.
 * When Neon PostgreSQL is active, verifies connection and schemas WITHOUT loading SQLite/WASM.
 * SQLite is only initialized when PostgreSQL is not configured.
 */
export async function ensureDatabaseReady(): Promise<void> {
  if (pool) {
    try {
      await initPostgresSchema(pool);
      return;
    } catch (pgErr) {
      console.error('❌ [Database] Neon PostgreSQL initialization error:', pgErr);
      if (process.env.NODE_ENV === 'production') {
        throw pgErr;
      }
    }
  }

  // Local development fallback: only initialize SQLite when PostgreSQL is not configured
  const { getDb } = await loadSqlite();
  await getDb();
}

/**
 * Universal query runner:
 * If PostgreSQL is active, runs with parameterized query ($1, $2...).
 * If local engine is active, runs against embedded SQLite.
 */
export async function dbQuery(sql: string, params: any[] = []): Promise<any> {
  if (pool) {
    try {
      const res = await pool.query(sql, params);
      return res.rows;
    } catch (err) {
      console.error('[PostgreSQL Query Error]:', err);
      throw err;
    }
  }

  // Fallback to SQLite
  const { getDb, saveDb } = await loadSqlite();
  const db = await getDb();
  // Transform Postgres parameterized placeholders ($1, $2) to SQLite placeholders (?) if needed
  const sqliteSql = sql.replace(/\$\d+/g, '?');
  const stmt = db.prepare(sqliteSql);
  stmt.bind(params);
  
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  saveDb(db);
  return results;
}

export async function getSqliteDb() {
  const { getDb } = await loadSqlite();
  return getDb();
}

export async function saveSqliteDb(db: any) {
  const { saveDb } = await loadSqlite();
  return saveDb(db);
}

