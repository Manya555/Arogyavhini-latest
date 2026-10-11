import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.join(process.cwd(), 'arogyavahini.sqlite');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  // Robust WASM asset resolution for Vercel / serverless and local dev environments
  const wasmCandidatePaths = [
    path.join(process.cwd(), 'node_modules/sql.js/dist/sql-wasm.wasm'),
    path.join(process.cwd(), 'dist/sql-wasm.wasm'),
    '/var/task/node_modules/sql.js/dist/sql-wasm.wasm',
  ];

  let wasmPath: string | null = null;
  for (const candidate of wasmCandidatePaths) {
    if (fs.existsSync(candidate)) {
      wasmPath = candidate;
      break;
    }
  }

  let SQL: any;
  try {
    if (wasmPath) {
      const fileBuf = fs.readFileSync(wasmPath);
      const wasmBinary = fileBuf.buffer.slice(fileBuf.byteOffset, fileBuf.byteOffset + fileBuf.byteLength);
      SQL = await initSqlJs({
        locateFile: () => wasmPath!,
        wasmBinary: wasmBinary as ArrayBuffer,
      });
    } else {
      SQL = await initSqlJs();
    }
  } catch (wasmErr) {
    console.warn('⚠️ [SQLite Fallback] sql-wasm loading failed, using pure JS asm.js engine:', (wasmErr as any)?.message || wasmErr);
    // Dynamic import pure JS asm.js build of sql.js that requires no wasm file
    const { default: initSqlJsAsm } = await import('sql.js/dist/sql-asm.js');
    SQL = await (initSqlJsAsm as any)();
  }

  if (fs.existsSync(DB_FILE_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Could not read existing SQLite database file, creating fresh in-memory database:', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initializeSchema(dbInstance);
  saveDb(dbInstance);
  return dbInstance;
}

export function saveDb(db: Database) {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE_PATH, buffer);
  } catch (err) {
    console.warn('Notice: SQLite disk persistence skipped (serverless environment):', (err as any)?.message || err);
  }
}

function initializeSchema(db: Database) {
  // Create Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('patient', 'driver', 'admin')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Ambulances table with driver_user_id
  db.run(`
    CREATE TABLE IF NOT EXISTS ambulances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_number TEXT UNIQUE NOT NULL,
      driver_user_id INTEGER,
      driver_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      type TEXT DEFAULT 'Basic Life Support (BLS)',
      base_location TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('AVAILABLE', 'ASSIGNED', 'BUSY', 'MAINTENANCE')) DEFAULT 'AVAILABLE',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_user_id) REFERENCES users(id)
    );
  `);

  // Create or Migrate EmergencyRequests table
  migrateEmergencyRequestsTable(db);
  ensureRouteOptimizationColumns(db);
  ensureMedicalProfileColumns(db);

  // Create ActivityLogs table for audit trail
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      emergency_id INTEGER,
      action TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      role TEXT CHECK(role IN ('patient', 'driver', 'admin')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      notification_type TEXT NOT NULL,
      emergency_request_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (emergency_request_id) REFERENCES emergency_requests(id)
    );
  `);

  // Create Hospitals table with Emergency Ward Capacity tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      specialty TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      phone TEXT DEFAULT '+91 108 / 112 Emergency Help',
      ward_capacity TEXT NOT NULL CHECK(ward_capacity IN ('AVAILABLE', 'FULL')) DEFAULT 'AVAILABLE',
      available_beds INTEGER DEFAULT 12,
      total_beds INTEGER DEFAULT 20,
      rating REAL DEFAULT 4.6,
      type TEXT DEFAULT 'Multi-Specialty Emergency Hospital',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedInitialData(db);
}

function migrateEmergencyRequestsTable(db: Database) {
  try {
    const tableCheck = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='emergency_requests'");
    
    if (!tableCheck || tableCheck.length === 0 || !tableCheck[0].values || tableCheck[0].values.length === 0) {
      // Table doesn't exist, create it with new schema
      db.run(`
        CREATE TABLE emergency_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          patient_id INTEGER,
          patient_name TEXT NOT NULL,
          emergency_type TEXT NOT NULL,
          location TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
          phone TEXT NOT NULL,
          notes TEXT,
          driver_id INTEGER,
          ambulance_id INTEGER,
          status TEXT NOT NULL CHECK(status IN ('WAITING_FOR_DRIVER', 'DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED', 'COMPLETED', 'CANCELLED')) DEFAULT 'WAITING_FOR_DRIVER',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES users(id),
          FOREIGN KEY (driver_id) REFERENCES users(id),
          FOREIGN KEY (ambulance_id) REFERENCES ambulances(id)
        );
      `);
      return;
    }

    // Table exists: create new table with updated CHECK constraint and copy existing data
    const tableInfo = db.exec("PRAGMA table_info(emergency_requests)");
    const cols = tableInfo[0]?.values?.map((v: any[]) => v[1] as string) || [];
    const hasDriverId = cols.includes('driver_id');

    db.run(`
      CREATE TABLE emergency_requests_migration (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        patient_name TEXT NOT NULL,
        emergency_type TEXT NOT NULL,
        location TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        phone TEXT NOT NULL,
        notes TEXT,
        driver_id INTEGER,
        ambulance_id INTEGER,
        status TEXT NOT NULL CHECK(status IN ('WAITING_FOR_DRIVER', 'DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED', 'COMPLETED', 'CANCELLED')) DEFAULT 'WAITING_FOR_DRIVER',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patient_id) REFERENCES users(id),
        FOREIGN KEY (driver_id) REFERENCES users(id),
        FOREIGN KEY (ambulance_id) REFERENCES ambulances(id)
      );
    `);

    const driverSelect = hasDriverId ? 'driver_id' : 'NULL as driver_id';

    db.run(`
      INSERT OR IGNORE INTO emergency_requests_migration (
        id, patient_id, patient_name, emergency_type, location, latitude, longitude, phone, notes, driver_id, ambulance_id, status, created_at, updated_at
      )
      SELECT 
        id, patient_id, patient_name, emergency_type, location, latitude, longitude, phone, notes,
        ${driverSelect},
        ambulance_id,
        CASE 
          WHEN status = 'REQUESTED' THEN 'WAITING_FOR_DRIVER'
          WHEN status IN ('AMBULANCE_ASSIGNED', 'ACCEPTED') THEN 'DRIVER_ACCEPTED'
          WHEN status IN ('WAITING_FOR_DRIVER', 'DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED', 'COMPLETED', 'CANCELLED') THEN status
          ELSE 'WAITING_FOR_DRIVER'
        END as status,
        created_at,
        updated_at
      FROM emergency_requests;
    `);

    db.run("DROP TABLE emergency_requests;");
    db.run("ALTER TABLE emergency_requests_migration RENAME TO emergency_requests;");
    console.log('Database migration complete: emergency_requests updated with WAITING_FOR_DRIVER and driver_id.');
  } catch (err) {
    console.error('Error during emergency_requests migration:', err);
  }
}

function ensureRouteOptimizationColumns(db: Database) {
  try {
    const tableInfo = db.exec("PRAGMA table_info(emergency_requests)");
    if (!tableInfo || tableInfo.length === 0 || !tableInfo[0].values) return;
    const cols = tableInfo[0].values.map((v: any[]) => v[1] as string);

    const columnsToAdd: [string, string][] = [
      ['route_origin', 'TEXT'],
      ['route_destination', 'TEXT'],
      ['optimized_routes', 'TEXT'],
      ['selected_route_id', 'TEXT'],
      ['current_eta_minutes', 'REAL'],
      ['current_distance_km', 'REAL'],
      ['current_traffic', 'TEXT'],
      ['hospital_routes', 'TEXT'],
      ['selected_hospital', 'TEXT'],
      ['hospital_destination', 'TEXT'],
      ['navigation_started', 'INTEGER DEFAULT 0'],
      ['driver_current_latitude', 'REAL'],
      ['driver_current_longitude', 'REAL'],
      ['driver_accuracy', 'REAL'],
      ['navigation_stage', 'TEXT DEFAULT "TO_PATIENT"'],
      ['route_updated_at', 'TEXT'],
      ['accepted_at', 'TEXT'],
      ['completed_at', 'TEXT'],
      ['rating_overall_stars', 'INTEGER'],
      ['rating_speed_stars', 'INTEGER'],
      ['rating_service_stars', 'INTEGER'],
      ['rating_feedback', 'TEXT'],
      ['rating_submitted_at', 'TEXT'],
    ];

    for (const [colName, colType] of columnsToAdd) {
      if (!cols.includes(colName)) {
        db.run(`ALTER TABLE emergency_requests ADD COLUMN ${colName} ${colType};`);
      }
    }

    // Ensure traffic_signal_priority_requests table exists
    db.run(`
      CREATE TABLE IF NOT EXISTS traffic_signal_priority_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        emergency_id INTEGER,
        ambulance_id INTEGER,
        junction_id TEXT NOT NULL,
        junction_name TEXT NOT NULL,
        route_direction TEXT NOT NULL,
        command_sent TEXT NOT NULL,
        esp32_ip_address TEXT NOT NULL,
        http_status_code INTEGER,
        execution_status TEXT NOT NULL DEFAULT 'SENT',
        priority_duration_seconds INTEGER DEFAULT 25,
        triggered_by TEXT DEFAULT 'DRIVER_APPROACH',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        restored_at TEXT
      );
    `);

    const ambInfo = db.exec("PRAGMA table_info(ambulances)");
    if (ambInfo && ambInfo[0]?.values) {
      const ambCols = ambInfo[0].values.map((v: any[]) => v[1] as string);
      const ambColsToAdd: [string, string][] = [
        ['current_latitude', 'REAL'],
        ['current_longitude', 'REAL'],
        ['last_gps_update', 'TEXT'],
      ];
      for (const [cName, cType] of ambColsToAdd) {
        if (!ambCols.includes(cName)) {
          db.run(`ALTER TABLE ambulances ADD COLUMN ${cName} ${cType};`);
        }
      }
    }
  } catch (err) {
    console.error('Error adding route optimization columns:', err);
  }
}

function ensureMedicalProfileColumns(db: Database) {
  try {
    // 1. Ensure medical profile columns in users table
    const userTableInfo = db.exec("PRAGMA table_info(users)");
    if (userTableInfo && userTableInfo[0]?.values) {
      const userCols = userTableInfo[0].values.map((v: any[]) => v[1] as string);
      const userColsToAdd: [string, string][] = [
        ['blood_type', 'TEXT'],
        ['allergies', 'TEXT'],
        ['emergency_contact_name', 'TEXT'],
        ['emergency_contact_phone', 'TEXT'],
        ['emergency_contact_relation', 'TEXT'],
        ['medical_notes', 'TEXT'],
        ['password_hash', 'TEXT'],
        ['client_id', 'TEXT'],
        ['auth_provider', 'TEXT'],
        ['delete_flag', 'INTEGER DEFAULT 0'],
      ];
      for (const [colName, colType] of userColsToAdd) {
        if (!userCols.includes(colName)) {
          try {
            db.run(`ALTER TABLE users ADD COLUMN ${colName} ${colType};`);
          } catch { /* column might already exist */ }
        }
      }
    }

    // 2. Ensure medical profile snapshot columns in emergency_requests table
    const reqTableInfo = db.exec("PRAGMA table_info(emergency_requests)");
    if (reqTableInfo && reqTableInfo[0]?.values) {
      const reqCols = reqTableInfo[0].values.map((v: any[]) => v[1] as string);
      const reqColsToAdd: [string, string][] = [
        ['patient_blood_type', 'TEXT'],
        ['patient_allergies', 'TEXT'],
        ['patient_emergency_contact_name', 'TEXT'],
        ['patient_emergency_contact_phone', 'TEXT'],
        ['patient_emergency_contact_relation', 'TEXT'],
        ['patient_medical_notes', 'TEXT'],
        ['vitals_heart_rate', 'INTEGER'],
        ['vitals_blood_pressure', 'TEXT'],
        ['vitals_spo2', 'INTEGER'],
        ['vitals_respiratory_rate', 'INTEGER'],
        ['vitals_gcs', 'INTEGER'],
        ['vitals_blood_sugar', 'INTEGER'],
        ['triage_acuity', 'TEXT'],
        ['er_notified_at', 'TEXT'],
        ['er_prep_notes', 'TEXT'],
      ];
      for (const [colName, colType] of reqColsToAdd) {
        if (!reqCols.includes(colName)) {
          db.run(`ALTER TABLE emergency_requests ADD COLUMN ${colName} ${colType};`);
        }
      }
    }

    // 3. Seed default medical profile for demo patient Priya Rao (id 1) if not populated
    try {
      db.run(`
        UPDATE users 
        SET 
          blood_type = COALESCE(NULLIF(blood_type, ''), 'B+'),
          allergies = COALESCE(NULLIF(allergies, ''), 'Penicillin, NSAIDs (Aspirin)'),
          emergency_contact_name = COALESCE(NULLIF(emergency_contact_name, ''), 'Rajesh Rao'),
          emergency_contact_phone = COALESCE(NULLIF(emergency_contact_phone, ''), '+91 98451 98765'),
          emergency_contact_relation = COALESCE(NULLIF(emergency_contact_relation, ''), 'Spouse'),
          medical_notes = COALESCE(NULLIF(medical_notes, ''), 'Mild seasonal asthma; carries inhaler')
        WHERE id = 1 AND (blood_type IS NULL OR blood_type = '');
      `);

      db.run(`
        UPDATE users 
        SET password_hash = password
        WHERE (password_hash IS NULL OR password_hash = '') AND password IS NOT NULL;
      `);
    } catch {
      // ignore
    }
  } catch (err) {
    console.error('Error adding medical profile columns:', err);
  }
}

export function seedInitialData(db: Database) {
  // Check if users exist
  const userCheck = db.exec("SELECT COUNT(*) as count FROM users");
  const userCount = userCheck[0]?.values[0]?.[0] as number;

  if (userCount === 0) {
    console.log('Seeding standard user accounts...');
    db.run(`
      INSERT INTO users (id, name, email, password, password_hash, phone, role) VALUES
      (1, 'Priya Rao', 'patient@arogyavahini.in', 'password123', 'password123', '+91 98765 43210', 'patient'),
      (2, 'Mohammed Irfan', 'driver@arogyavahini.in', 'password123', 'password123', '+91 97410 54321', 'driver'),
      (3, 'Dr. Arvind Deshmukh', 'admin@arogyavahini.in', 'password123', 'password123', '+91 98111 22334', 'admin'),
      (4, 'Suresh Gowda', 'driver2@arogyavahini.in', 'password123', 'password123', '+91 98860 67890', 'driver'),
      (5, 'Ramesh Kumar', 'driver3@arogyavahini.in', 'password123', 'password123', '+91 98450 12345', 'driver'),
      (6, 'Anand Verma', 'driver4@arogyavahini.in', 'password123', 'password123', '+91 99000 88776', 'driver');
    `);
  }

  // Check if ambulances exist
  const ambCheck = db.exec("SELECT COUNT(*) as count FROM ambulances");
  const ambCount = ambCheck[0]?.values[0]?.[0] as number;

  if (ambCount === 0) {
    console.log('Seeding unified fleet ambulances and driver assignments...');
    db.run(`
      INSERT INTO ambulances (id, vehicle_number, driver_user_id, driver_name, phone, type, base_location, status) VALUES
      (1, 'KA-01-EA-1008', 2, 'Mohammed Irfan', '+91 97410 54321', 'Advanced Cardiac Life Support (ACLS)', 'Central Trauma Center, Block A', 'AVAILABLE'),
      (2, 'KA-05-EM-2044', 4, 'Suresh Gowda', '+91 98860 67890', 'Basic Life Support (BLS)', 'Indiranagar Emergency Hub', 'AVAILABLE'),
      (3, 'KA-03-AX-3091', 5, 'Ramesh Kumar', '+91 98450 12345', 'Critical Care Response Unit', 'Jayanagar General Hospital', 'AVAILABLE'),
      (4, 'KA-04-ICU-4412', 6, 'Anand Verma', '+91 99000 88776', 'Neonatal & Trauma ICU Mobile', 'Whitefield Rapid Response Station', 'AVAILABLE');
    `);
  }

  // Check if sample emergencies exist
  const reqCheck = db.exec("SELECT COUNT(*) as count FROM emergency_requests");
  const reqCount = reqCheck[0]?.values[0]?.[0] as number;

  if (reqCount === 0) {
    console.log('Seeding initial resolved emergency log...');
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000).toISOString();

    db.run(`
      INSERT INTO emergency_requests (id, patient_id, patient_name, emergency_type, location, phone, notes, ambulance_id, status, created_at, updated_at) VALUES
      (1, 1, 'Priya Rao', 'Severe Trauma / Accident', 'MG Road Junction near Metro Pillar 140', '+91 98765 43210', 'Two wheeler collision, conscious with leg injury', 1, 'COMPLETED', '${twoHoursAgo}', '${twoHoursAgo}');
    `);

    db.run(`
      INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES
      (1, 'Emergency SOS requested by patient', 'Priya Rao', '${twoHoursAgo}'),
      (1, 'Ambulance KA-01-EA-1008 assigned to call', 'Arogyavahini Dispatch Engine', '${twoHoursAgo}'),
      (1, 'Request accepted by driver Mohammed Irfan', 'Mohammed Irfan', '${twoHoursAgo}'),
      (1, 'Ambulance reached hospital with patient', 'Mohammed Irfan', '${twoHoursAgo}');
    `);

    db.run(`
      INSERT INTO notifications (user_id, role, title, message, notification_type, emergency_request_id, is_read, created_at) VALUES
      (1, 'patient', 'Emergency Request Completed', 'Your emergency request has been completed.', 'EMERGENCY_COMPLETED', 1, 1, '${twoHoursAgo}'),
      (2, 'driver', 'Mission Completed', 'Hospital handover complete for emergency request #1. Ambulance is now ready on standby.', 'MISSION_COMPLETED', 1, 1, '${twoHoursAgo}'),
      (3, 'admin', 'Emergency Completed #1', 'Emergency request #1 has been successfully completed and resolved.', 'ADMIN_EMERGENCY_COMPLETED', 1, 1, '${twoHoursAgo}');
    `);
  }

  // Check if hospitals exist
  const hospCheck = db.exec("SELECT COUNT(*) as count FROM hospitals");
  const hospCount = hospCheck[0]?.values[0]?.[0] as number;

  if (hospCount === 0) {
    console.log('Seeding regional hospitals with emergency ward capacity...');
    db.run(`
      INSERT INTO hospitals (id, name, specialty, address, latitude, longitude, phone, ward_capacity, available_beds, total_beds, rating, type) VALUES
      (1, 'Metro Apex Multi-Specialty & Trauma Center', 'Apex Level 1 Trauma & Critical Care', 'MG Road Medical Corridor, Bengaluru', 12.9755, 77.5980, '+91 80 2558 1008', 'AVAILABLE', 14, 25, 4.8, 'Apex Level 1 Trauma Hospital'),
      (2, 'Regional Cardiac & Critical Care Hospital', 'Apex Interventional Cardiology & Cardiac ICU', 'Indiranagar 100ft Road, Bengaluru', 12.9784, 77.6408, '+91 80 2520 2044', 'AVAILABLE', 8, 18, 4.7, 'Specialized Cardiac Hospital'),
      (3, 'City General Emergency Hospital', 'Comprehensive Emergency & Advanced ICU', 'Jayanagar 4th Block, Bengaluru', 12.9250, 77.5938, '+91 80 2656 3091', 'FULL', 0, 30, 4.4, 'Public Emergency Hospital'),
      (4, 'Apollo Emergency & Trauma Hospital', '24/7 Emergency & Critical Trauma Hub', 'Bannerghatta Main Road, Bengaluru', 12.8950, 77.5975, '+91 80 2630 4412', 'AVAILABLE', 16, 28, 4.9, 'Super-Specialty Trauma Center'),
      (5, 'Manipal Comprehensive Emergency Hub', 'Level 1 Trauma, Neuro & Cardiac Emergency', 'Old Airport Road, Kodihalli, Bengaluru', 12.9582, 77.6485, '+91 80 2502 5500', 'AVAILABLE', 11, 24, 4.8, 'Multi-Specialty Emergency Hospital'),
      (6, 'Fortis Memorial Critical Care', 'Super-Specialty Emergency & ICU', 'Cunningham Road, Vasanth Nagar, Bengaluru', 12.9860, 77.5970, '+91 80 4044 6600', 'FULL', 0, 20, 4.6, 'Super-Specialty Emergency Center');
    `);
  }
}

// Reset database to default clean state
export async function resetDatabase(): Promise<void> {
  const db = await getDb();
  db.run(`DROP TABLE IF EXISTS hospitals;`);
  db.run(`DROP TABLE IF EXISTS notifications;`);
  db.run(`DROP TABLE IF EXISTS activity_logs;`);
  db.run(`DROP TABLE IF EXISTS emergency_requests;`);
  db.run(`DROP TABLE IF EXISTS ambulances;`);
  db.run(`DROP TABLE IF EXISTS users;`);
  
  initializeSchema(db);
  saveDb(db);
}
