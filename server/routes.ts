import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { getDb, saveDb, resetDatabase } from './db.js';
import { isPostgresActive, getPostgresPool, disablePostgresPool } from './config/database.js';
import { hashPassword, verifyPassword, generateUuid } from './security.js';
import {
  optimizeRoute,
  optimizeHospitals,
  optimizeRouteAsync,
  optimizeHospitalsAsync,
  calculateRouteScore,
  calculateGeoDistanceKm,
  isValidCoord,
  normalizeCoord,
  setPrimaryLocationAnchor,
  getPrimaryLocationAnchor,
} from './routeOptimizer.js';
import { searchRealNearbyHospitals } from './hospitalSearch.js';
import { trafficRoutes } from './routes/trafficRoutes.js';
import {
  broadcastEmergencyCreated,
  broadcastEmergencyAssigned,
  broadcastAmbulanceStatus,
  broadcastRouteUpdated,
  broadcastPatientVitalsUpdated,
  broadcastAmbulanceLocation,
} from './sockets/socketHandler.js';

import { navigationRoutes } from './routes/navigationRoutes.js';

export const apiRouter = Router();

// Mount IoT Traffic Signal Priority Routes
apiRouter.use('/traffic-signals', trafficRoutes);
apiRouter.use('/traffic', trafficRoutes);
apiRouter.use('/navigation', navigationRoutes);

// Helper to convert sql.js QueryResults to array of objects
function formatQueryResult(result: any): any[] {
  if (!result || !result.columns || !result.values) return [];
  const columns = result.columns;
  return result.values.map((row: any[]) => {
    const obj: any = {};
    columns.forEach((col: string, index: number) => {
      obj[col] = row[index];
    });
    return obj;
  });
}

// Helper to safely parse JSON route fields in emergency records
function parseEmergencyRecord(e: any): any {
  if (!e) return e;
  const parsed = { ...e };
  if (typeof parsed.optimized_routes === 'string') {
    try {
      parsed.optimized_routes = JSON.parse(parsed.optimized_routes);
    } catch {
      parsed.optimized_routes = null;
    }
  }
  if (typeof parsed.hospital_routes === 'string') {
    try {
      parsed.hospital_routes = JSON.parse(parsed.hospital_routes);
    } catch {
      parsed.hospital_routes = null;
    }
  }

  // Validate patient coordinates to prevent Africa / Null Island bug
  if (!isValidCoord(parsed.latitude, parsed.longitude)) {
    if (isValidCoord(parsed.driver_current_latitude, parsed.driver_current_longitude)) {
      parsed.latitude = parseFloat((Number(parsed.driver_current_latitude) + 0.015).toFixed(5));
      parsed.longitude = parseFloat((Number(parsed.driver_current_longitude) + 0.012).toFixed(5));
    } else {
      const anchor = getPrimaryLocationAnchor();
      if (anchor) {
        parsed.latitude = parseFloat((anchor[0] + 0.015).toFixed(5));
        parsed.longitude = parseFloat((anchor[1] + 0.012).toFixed(5));
      }
    }
  }

  // Check if existing optimized_routes contain [0, 0] or invalid coordinates or cross-continental routes
  let needsRecompute = false;
  if (Array.isArray(parsed.optimized_routes) && parsed.optimized_routes.length > 0) {
    for (const r of parsed.optimized_routes) {
      if (Array.isArray(r.coordinates)) {
        for (const pt of r.coordinates) {
          if (!isValidCoord(pt[0], pt[1])) {
            needsRecompute = true;
            break;
          }
        }
      }
      if (needsRecompute) break;
    }
  }

  if (needsRecompute) {
    parsed.optimized_routes = null;
  }

  // Ensure routes exist if emergency has been accepted / assigned
  if ((parsed.status === 'DRIVER_ACCEPTED' || parsed.status === 'ON_THE_WAY' || parsed.status === 'REACHED' || parsed.ambulance_id) && (!parsed.optimized_routes || parsed.optimized_routes.length === 0)) {
    const originLoc = parsed.route_origin || parsed.ambulance_base || 'Emergency Base Station';
    const destLoc = parsed.route_destination || parsed.location || 'Patient Incident Location';
    const driverCoords = (isValidCoord(parsed.driver_current_latitude, parsed.driver_current_longitude))
      ? [Number(parsed.driver_current_latitude), Number(parsed.driver_current_longitude)] as [number, number]
      : null;
    const patientCoords = (isValidCoord(parsed.latitude, parsed.longitude))
      ? [Number(parsed.latitude), Number(parsed.longitude)] as [number, number]
      : null;

    const routeOptResult = optimizeRoute(originLoc, destLoc, parsed.emergency_type || 'General', 0, driverCoords, patientCoords);
    const hospitalOptResult = optimizeHospitals(destLoc, parsed.emergency_type || 'General', 0, patientCoords);
    
    parsed.optimized_routes = routeOptResult.allRoutes;
    parsed.selected_route_id = parsed.selected_route_id || routeOptResult.recommendedRoute.id;
    parsed.current_eta_minutes = parsed.current_eta_minutes || routeOptResult.recommendedRoute.estimatedMinutes;
    parsed.current_distance_km = parsed.current_distance_km || routeOptResult.recommendedRoute.distanceKm;
    parsed.current_traffic = parsed.current_traffic || routeOptResult.recommendedRoute.traffic;
    parsed.hospital_routes = hospitalOptResult.allHospitals;
    parsed.selected_hospital = parsed.selected_hospital || hospitalOptResult.recommendedHospital.name;
    parsed.route_origin = originLoc;
    parsed.route_destination = destLoc;
  }

  parsed.routes = parsed.optimized_routes || [];
  parsed.hospital_options = parsed.hospital_routes || [];
  parsed.hospital_destination = parsed.selected_hospital || null;
  parsed.current_stage = parsed.navigation_stage || (parsed.status === 'REACHED' ? 'TO_HOSPITAL' : 'TO_PATIENT');
  return parsed;
}

// Helper to create notifications in DB
function createNotification(
  db: any,
  params: {
    userId?: string | number | null;
    role?: 'patient' | 'driver' | 'admin';
    title: string;
    message: string;
    notificationType: string;
    emergencyRequestId?: number | null;
    isRead?: number;
  }
) {
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO notifications (user_id, role, title, message, notification_type, emergency_request_id, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.userId !== undefined && params.userId !== null ? String(params.userId) : null,
      params.role || null,
      params.title,
      params.message,
      params.notificationType,
      params.emergencyRequestId !== undefined ? params.emergencyRequestId : null,
      params.isRead || 0,
      now,
    ]
  );
}

// Helper to notify all users with a specific role
function notifyRole(
  db: any,
  role: 'patient' | 'driver' | 'admin',
  params: {
    title: string;
    message: string;
    notificationType: string;
    emergencyRequestId?: number | null;
    excludeUserId?: string | number | null;
  }
) {
  const now = new Date().toISOString();
  let querySql = `SELECT id FROM users WHERE role = '${role}'`;
  if (params.excludeUserId) {
    const cleanExclude = String(params.excludeUserId).replace(/'/g, "''");
    querySql += ` AND id != '${cleanExclude}'`;
  }
  const usersResult = db.exec(querySql);
  const users = formatQueryResult(usersResult[0]);

  if (users.length > 0) {
    for (const u of users) {
      db.run(
        `INSERT INTO notifications (user_id, role, title, message, notification_type, emergency_request_id, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
        [
          u.id,
          role,
          params.title,
          params.message,
          params.notificationType,
          params.emergencyRequestId || null,
          now,
        ]
      );
    }
  } else {
    db.run(
      `INSERT INTO notifications (user_id, role, title, message, notification_type, emergency_request_id, is_read, created_at)
       VALUES (NULL, ?, ?, ?, ?, ?, 0, ?)`,
      [
        role,
        params.title,
        params.message,
        params.notificationType,
        params.emergencyRequestId || null,
        now,
      ]
    );
  }
}

// ----------------------------------------------------
// 1. AUTHENTICATION & DEMO ROUTES (JWT & Multi-DB)
// ----------------------------------------------------

const JWT_SECRET = process.env.JWT_SECRET || 'arogyavahini-production-jwt-auth-key-2026';

export function createAuthToken(user: { id: number | string; email: string; role: string; name: string }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days expiration
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp,
    iat: Math.floor(Date.now() / 1000),
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${b64Header}.${b64Payload}`)
    .digest('base64url');

  return `${b64Header}.${b64Payload}.${signature}`;
}

export function verifyAuthToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [b64Header, b64Payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${b64Header}.${b64Payload}`)
      .digest('base64url');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

async function findUserForLogin(email: string, pass: string): Promise<any | null> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Try PostgreSQL pool if actively configured in production
  const pgPool = getPostgresPool();
  if (pgPool) {
    try {
      // Query Neon PostgreSQL users table with password_hash & delete_flag
      const res = await pgPool.query(
        `SELECT id, client_id, name, email, password_hash, phone, role, auth_provider, delete_flag, created_at, updated_at 
         FROM users 
         WHERE LOWER(email) = LOWER($1) AND (delete_flag IS FALSE OR delete_flag IS NULL) 
         LIMIT 1`,
        [cleanEmail]
      );
      if (res.rows && res.rows.length > 0) {
        const u = res.rows[0];
        const isMatch = verifyPassword(pass, u.password_hash);
        if (isMatch) {
          return {
            id: u.id,
            client_id: u.client_id || null,
            name: u.name,
            email: u.email,
            phone: u.phone || '',
            role: u.role,
            auth_provider: u.auth_provider || 'local',
            delete_flag: u.delete_flag || false,
            created_at: u.created_at,
            updated_at: u.updated_at,
            blood_type: 'B+',
            allergies: 'None reported',
            emergency_contact_name: 'Rajesh Rao',
            emergency_contact_phone: '+91 98451 98765',
            emergency_contact_relation: 'Spouse',
            medical_notes: 'Mild seasonal asthma; carries inhaler',
          };
        }
      }
      // PostgreSQL is active and user was not found with matching credentials
      return null;
    } catch (pgErr) {
      console.warn('[Auth] PostgreSQL lookup error:', pgErr);
      if (process.env.NODE_ENV === 'production') {
        return null;
      }
    }
  }

  // 2. Query embedded SQLite engine with parameterized statement (local development only)
  const db = await getDb();
  const stmt = db.prepare(
    'SELECT id, name, email, password, phone, role, created_at, blood_type, allergies, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, medical_notes FROM users WHERE LOWER(email) = :email LIMIT 1'
  );
  stmt.bind({ ':email': cleanEmail });
  let user: any = null;
  if (stmt.step()) {
    const raw = stmt.getAsObject();
    if (raw && (verifyPassword(pass, String(raw.password ?? '')) || raw.password === pass)) {
      user = raw;
    }
  }
  stmt.free();
  return user;
}

async function findDemoUser(role: string): Promise<any | null> {
  const pgPool = getPostgresPool();
  if (pgPool) {
    try {
      const res = await pgPool.query(
        `SELECT id, client_id, name, email, password_hash, phone, role, auth_provider, delete_flag, created_at, updated_at 
         FROM users 
         WHERE role = $1 AND (delete_flag IS FALSE OR delete_flag IS NULL) 
         ORDER BY created_at ASC 
         LIMIT 1`,
        [role]
      );
      if (res.rows && res.rows.length > 0) {
        const u = res.rows[0];
        return {
          id: u.id,
          client_id: u.client_id || null,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          role: u.role,
          auth_provider: u.auth_provider || 'local',
          delete_flag: u.delete_flag || false,
          created_at: u.created_at,
          updated_at: u.updated_at,
          blood_type: 'B+',
          allergies: 'None reported',
          emergency_contact_name: 'HQ Dispatch',
          emergency_contact_phone: '+91 80 2200 1122',
          emergency_contact_relation: 'Next of Kin',
          medical_notes: 'None logged',
        };
      }
      // Demo account not found in PostgreSQL
      return null;
    } catch (pgErr) {
      console.warn('[Auth] PostgreSQL demo lookup error:', pgErr);
      if (process.env.NODE_ENV === 'production') {
        return null;
      }
    }
  }

  // Local development fallback
  const db = await getDb();
  const stmt = db.prepare(
    'SELECT id, name, email, phone, role, created_at, blood_type, allergies, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, medical_notes FROM users WHERE role = :role ORDER BY id ASC LIMIT 1'
  );
  stmt.bind({ ':role': role });
  let user: any = null;
  if (stmt.step()) {
    user = stmt.getAsObject();
  }
  stmt.free();
  return user;
}

// POST /api/auth/register & POST /api/users/register
const handleRegister = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const assignedRole = role && ['patient', 'driver', 'admin'].includes(role) ? role : 'patient';
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = (phone || '').trim();

    // 1. Check if email already exists in PostgreSQL and insert into Neon users table
    const pgPool = getPostgresPool();
    if (pgPool) {
      try {
        const check = await pgPool.query(
          'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND (delete_flag IS FALSE OR delete_flag IS NULL)',
          [cleanEmail]
        );
        if (check.rows && check.rows.length > 0) {
          return res.status(400).json({ error: 'User with this email already exists' });
        }

        const newId = generateUuid();
        const hashedPassword = hashPassword(password);
        const clientId = req.body.client_id || null;

        const insertRes = await pgPool.query(
          `INSERT INTO users (id, client_id, name, email, password_hash, phone, role, auth_provider, delete_flag, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
           RETURNING id, client_id, name, email, phone, role, auth_provider, delete_flag, created_at, updated_at`,
          [newId, clientId, cleanName, cleanEmail, hashedPassword, cleanPhone, assignedRole, 'local', false]
        );
        const row = insertRes.rows[0];
        const user = {
          id: row.id,
          client_id: row.client_id || null,
          name: row.name,
          email: row.email,
          phone: row.phone || '',
          role: row.role,
          auth_provider: row.auth_provider || 'local',
          delete_flag: row.delete_flag || false,
          created_at: row.created_at,
          updated_at: row.updated_at,
          blood_type: req.body.blood_type || 'B+',
          allergies: req.body.allergies || 'None reported',
          emergency_contact_name: req.body.emergency_contact_name || '',
          emergency_contact_phone: req.body.emergency_contact_phone || '',
          emergency_contact_relation: req.body.emergency_contact_relation || 'Next of Kin',
          medical_notes: req.body.medical_notes || '',
        };
        const token = createAuthToken(user);
        return res.status(201).json({
          message: 'Registration successful',
          user,
          token,
        });
      } catch (pgErr) {
        console.warn('[Auth] PostgreSQL register error:', pgErr);
        if (process.env.NODE_ENV === 'production') {
          return res.status(500).json({ error: 'Failed to create user account in database' });
        }
      }
    }

    // 2. Fallback to SQLite (local development only)
    const db = await getDb();
    const checkStmt = db.prepare('SELECT id FROM users WHERE email = :email');
    checkStmt.bind({ ':email': cleanEmail });
    if (checkStmt.step()) {
      checkStmt.free();
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    checkStmt.free();

    const localHashedPassword = hashPassword(password);
    try {
      db.run(
        'INSERT INTO users (name, email, password, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
        [cleanName, cleanEmail, localHashedPassword, localHashedPassword, cleanPhone, assignedRole]
      );
    } catch {
      db.run(
        'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
        [cleanName, cleanEmail, localHashedPassword, cleanPhone, assignedRole]
      );
    }

    const userResult = db.exec('SELECT id, name, email, phone, role, created_at, blood_type, allergies, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, medical_notes FROM users WHERE email = "' + cleanEmail + '"');
    const users = formatQueryResult(userResult[0]);
    const user = users[0];

    createNotification(db, {
      userId: user.id,
      role: assignedRole,
      title: 'Welcome to Arogyavahini',
      message: `Your account has been created successfully as ${assignedRole.toUpperCase()}. Emergency services are active.`,
      notificationType: 'USER_WELCOME',
    });

    notifyRole(db, 'admin', {
      title: 'New User Registration',
      message: `New user registered: ${cleanName} (${cleanEmail}) as ${assignedRole.toUpperCase()}.`,
      notificationType: 'ADMIN_USER_REGISTERED',
      excludeUserId: user.id,
    });

    saveDb(db);

    const token = createAuthToken(user);

    return res.status(201).json({
      message: 'Registration successful',
      user,
      token,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
};

apiRouter.post('/auth/register', handleRegister);
apiRouter.post('/users/register', handleRegister);

// POST /api/auth/login & POST /api/users/login
const handleLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await findUserForLogin(email, password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return res.json({
      message: 'Login successful',
      user,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: error.message || 'Login failed' });
  }
};

apiRouter.post('/auth/login', handleLogin);
apiRouter.post('/users/login', handleLogin);

// POST /api/auth/demo/:role & POST /api/users/demo/:role
const handleDemoLogin = async (req: Request, res: Response) => {
  try {
    const role = req.params.role;
    if (!['patient', 'driver', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid demo role. Use patient, driver, or admin.' });
    }

    const user = await findDemoUser(role);

    if (!user) {
      return res.status(404).json({ error: `No demo account found for role: ${role}` });
    }

    const token = createAuthToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return res.json({
      message: `Demo logged in as ${role}`,
      user,
      token,
    });
  } catch (error: any) {
    console.error('Demo login error:', error);
    return res.status(500).json({ error: error.message || 'Demo login failed' });
  }
};

apiRouter.post('/auth/demo/:role', handleDemoLogin);
apiRouter.post('/users/demo/:role', handleDemoLogin);

// GET /api/auth/me & GET /api/users/me (verify current token)
const handleGetMe = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyAuthToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    return res.json({ user: payload });
  } catch (err: any) {
    return res.status(401).json({ error: 'Token verification failed' });
  }
};

apiRouter.get('/auth/me', handleGetMe);
apiRouter.get('/users/me', handleGetMe);

// ----------------------------------------------------
// PATIENT PROFILE & EMERGENCY MEDICAL ID MANAGEMENT
// ----------------------------------------------------

// GET /api/patient/profile/:userId
apiRouter.get('/patient/profile/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    const pgPool = getPostgresPool();
    if (pgPool) {
      try {
        const resPg = await pgPool.query(
          'SELECT id, client_id, name, email, phone, role, auth_provider, delete_flag, created_at, updated_at FROM users WHERE id::text = $1::text AND (delete_flag IS FALSE OR delete_flag IS NULL)',
          [userId]
        );
        if (resPg.rows && resPg.rows.length > 0) {
          const u = resPg.rows[0];
          return res.json({
            user: {
              id: u.id,
              client_id: u.client_id || null,
              name: u.name,
              email: u.email,
              phone: u.phone || '',
              role: u.role,
              auth_provider: u.auth_provider || 'local',
              delete_flag: u.delete_flag || false,
              created_at: u.created_at,
              updated_at: u.updated_at,
              blood_type: 'B+',
              allergies: 'None reported',
              emergency_contact_name: 'Emergency Dispatch',
              emergency_contact_phone: '+91 108',
              emergency_contact_relation: 'Next of Kin',
              medical_notes: '',
            },
          });
        }
        return res.status(404).json({ error: 'User not found' });
      } catch (pgErr) {
        console.warn('[Profile] PostgreSQL query fallback:', pgErr);
        if (process.env.NODE_ENV === 'production') {
          return res.status(500).json({ error: 'Failed to fetch patient profile from database' });
        }
      }
    }

    const db = await getDb();
    const cleanId = String(userId).replace(/'/g, "''");
    const query = db.exec(`SELECT id, name, email, phone, role, created_at, blood_type, allergies, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, medical_notes FROM users WHERE id = '${cleanId}'`);
    const users = formatQueryResult(query[0]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: users[0] });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch patient profile' });
  }
});

// PUT /api/patient/profile/:userId
apiRouter.put('/patient/profile/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId || userId === 'undefined' || userId === 'null') {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    const {
      name,
      phone,
      blood_type,
      allergies,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relation,
      medical_notes,
    } = req.body;

    const pgPool = getPostgresPool();
    if (pgPool) {
      try {
        const updateRes = await pgPool.query(
          `UPDATE users 
           SET name = COALESCE($1, name), 
               phone = COALESCE($2, phone), 
               updated_at = NOW()
           WHERE id::text = $3::text AND (delete_flag IS FALSE OR delete_flag IS NULL)
           RETURNING id, client_id, name, email, phone, role, auth_provider, delete_flag, created_at, updated_at`,
          [name ? name.trim() : null, phone ? phone.trim() : null, userId]
        );
        if (updateRes.rows && updateRes.rows.length > 0) {
          const u = updateRes.rows[0];
          return res.json({
            message: 'Medical profile updated successfully',
            user: {
              id: u.id,
              client_id: u.client_id || null,
              name: u.name,
              email: u.email,
              phone: u.phone || '',
              role: u.role,
              auth_provider: u.auth_provider || 'local',
              delete_flag: u.delete_flag || false,
              created_at: u.created_at,
              updated_at: u.updated_at,
              blood_type: blood_type || 'B+',
              allergies: allergies || 'None reported',
              emergency_contact_name: emergency_contact_name || '',
              emergency_contact_phone: emergency_contact_phone || '',
              emergency_contact_relation: emergency_contact_relation || 'Next of Kin',
              medical_notes: medical_notes || '',
            },
          });
        }
        return res.status(404).json({ error: 'User not found' });
      } catch (pgErr) {
        console.warn('[Profile Update] PostgreSQL error:', pgErr);
        if (process.env.NODE_ENV === 'production') {
          return res.status(500).json({ error: 'Failed to update patient profile in database' });
        }
      }
    }

    const db = await getDb();
    const cleanId = String(userId).replace(/'/g, "''");
    const existing = db.exec(`SELECT id FROM users WHERE id = '${cleanId}'`);
    if (!existing || existing.length === 0 || !existing[0]?.values?.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update query dynamically
    db.run(
      `UPDATE users SET 
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        blood_type = ?,
        allergies = ?,
        emergency_contact_name = ?,
        emergency_contact_phone = ?,
        emergency_contact_relation = ?,
        medical_notes = ?
       WHERE id = ?`,
      [
        name ? name.trim() : null,
        phone ? phone.trim() : null,
        blood_type !== undefined ? (blood_type ? blood_type.trim() : '') : null,
        allergies !== undefined ? (allergies ? allergies.trim() : '') : null,
        emergency_contact_name !== undefined ? (emergency_contact_name ? emergency_contact_name.trim() : '') : null,
        emergency_contact_phone !== undefined ? (emergency_contact_phone ? emergency_contact_phone.trim() : '') : null,
        emergency_contact_relation !== undefined ? (emergency_contact_relation ? emergency_contact_relation.trim() : '') : null,
        medical_notes !== undefined ? (medical_notes ? medical_notes.trim() : '') : null,
        userId,
      ]
    );

    saveDb(db);

    // Fetch updated user
    const updatedQuery = db.exec(`SELECT id, name, email, phone, role, created_at, blood_type, allergies, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, medical_notes FROM users WHERE id = '${cleanId}'`);
    const updatedUser = formatQueryResult(updatedQuery[0])[0];

    // Create system confirmation notification
    createNotification(db, {
      userId,
      role: updatedUser.role,
      title: 'Emergency Medical Profile Updated',
      message: `Your medical profile (Blood Type: ${updatedUser.blood_type || 'None'}, Allergies: ${updatedUser.allergies || 'None'}) has been synchronized with 108 Emergency Dispatch.`,
      notificationType: 'SYSTEM_ALERT',
    });

    return res.json({
      message: 'Medical profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update patient profile' });
  }
});

// ----------------------------------------------------
// 2. EMERGENCY REQUESTS & DRIVER DISPATCH WORKFLOW
// ----------------------------------------------------

// POST /api/emergency
// Creates emergency request in WAITING_FOR_DRIVER state with NO driver/ambulance assigned initially
apiRouter.post('/emergency', async (req: Request, res: Response) => {
  try {
    const { patient_id, patient_name, emergency_type, location, phone, notes, latitude, longitude } = req.body;

    if (!patient_name || !emergency_type || !location || !phone) {
      return res.status(400).json({ error: 'Patient name, emergency type, location, and phone are required.' });
    }

    const db = await getDb();
    const now = new Date().toISOString();
    const initialStatus = 'WAITING_FOR_DRIVER';

    let norm = normalizeCoord(latitude, longitude);
    if (!norm && location) {
      const match = location.match(/(-?\d{1,2}\.\d+)[,\s]+(?:Long:?\s*|Lng:?\s*)?(-?\d{1,3}\.\d+)/i);
      if (match) {
        norm = normalizeCoord(match[1], match[2]);
      }
    }
    if (!norm) {
      const anchor = getPrimaryLocationAnchor();
      if (anchor) {
        norm = [parseFloat((anchor[0] + 0.015).toFixed(5)), parseFloat((anchor[1] + 0.012).toFixed(5))];
      }
    }
    const finalLat = norm ? norm[0] : null;
    const finalLng = norm ? norm[1] : null;

    // Fetch or default patient medical profile fields
    let bType = req.body.patient_blood_type;
    let alg = req.body.patient_allergies;
    let ecName = req.body.patient_emergency_contact_name;
    let ecPhone = req.body.patient_emergency_contact_phone;
    let ecRel = req.body.patient_emergency_contact_relation;
    let medNotes = req.body.patient_medical_notes;

    if (patient_id && (!bType || !ecName)) {
      try {
        const cleanPatientId = String(patient_id).replace(/'/g, "''");
        const uResult = db.exec(`SELECT blood_type, allergies, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, medical_notes FROM users WHERE id = '${cleanPatientId}'`);
        if (uResult && uResult[0]?.values?.length > 0) {
          const u = formatQueryResult(uResult[0])[0];
          if (!bType) bType = u.blood_type || '';
          if (!alg) alg = u.allergies || '';
          if (!ecName) ecName = u.emergency_contact_name || '';
          if (!ecPhone) ecPhone = u.emergency_contact_phone || '';
          if (!ecRel) ecRel = u.emergency_contact_relation || '';
          if (!medNotes) medNotes = u.medical_notes || '';
        }
      } catch (err) {
        console.warn('Error fetching patient medical profile for SOS:', err);
      }
    }

    // Insert emergency request with medical profile fields
    db.run(
      `INSERT INTO emergency_requests 
       (patient_id, patient_name, emergency_type, location, latitude, longitude, phone, notes, driver_id, ambulance_id, status, patient_blood_type, patient_allergies, patient_emergency_contact_name, patient_emergency_contact_phone, patient_emergency_contact_relation, patient_medical_notes, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patient_id || null,
        patient_name.trim(),
        emergency_type,
        location.trim(),
        finalLat,
        finalLng,
        phone.trim(),
        notes ? notes.trim() : '',
        initialStatus,
        bType || null,
        alg || null,
        ecName || null,
        ecPhone || null,
        ecRel || null,
        medNotes || null,
        now,
        now,
      ]
    );

    // Fetch newly created emergency ID
    const idResult = db.exec("SELECT last_insert_rowid() as id");
    const emergencyId = idResult[0]?.values[0]?.[0];

    const medFlags = [
      bType ? `Blood: ${bType}` : '',
      alg ? `Allergies: ${alg}` : '',
      ecName ? `Emergency Contact: ${ecName} (${ecPhone || 'N/A'})` : '',
    ].filter(Boolean).join(' | ');

    // Log activity
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        emergencyId,
        `Emergency SOS requested by ${patient_name.trim()}: ${emergency_type} at ${location.trim()}.${medFlags ? ` [Medical Info Transmitted: ${medFlags}]` : ''} Waiting for available ambulance driver to accept.`,
        patient_name.trim(),
        now,
      ]
    );

    // 1. Patient Notification: Exact user wording
    if (patient_id) {
      createNotification(db, {
        userId: Number(patient_id),
        role: 'patient',
        title: 'Emergency SOS Submitted',
        message: `Your emergency request has been submitted successfully with medical profile (Blood: ${bType || 'N/A'}, Contact: ${ecName || 'Shared'}). Waiting for an available ambulance driver.`,
        notificationType: 'EMERGENCY_CREATED',
        emergencyRequestId: Number(emergencyId),
      });
    }

    // 2. Driver Notification with medical awareness
    notifyRole(db, 'driver', {
      title: 'New Emergency Alert',
      message: medFlags 
        ? `New emergency request received (${emergency_type}). 🩸 Patient Medical Info: [${medFlags}]`
        : `New emergency request received near your service area.`,
      notificationType: 'NEW_EMERGENCY_BROADCAST',
      emergencyRequestId: Number(emergencyId),
    });

    // 3. Admin Notification: Incident alert
    notifyRole(db, 'admin', {
      title: `New SOS Broadcast #${emergencyId}`,
      message: `New emergency request submitted by ${patient_name.trim()}: ${emergency_type} at ${location.trim()}.${medFlags ? ` 🩺 Medical ID: ${medFlags}` : ''}`,
      notificationType: 'ADMIN_EMERGENCY_ALERT',
      emergencyRequestId: Number(emergencyId),
    });

    saveDb(db);

    // Fetch complete record
    const fullQuery = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${emergencyId}
    `);

    const result = formatQueryResult(fullQuery[0]);

    if (result && result[0]) {
      broadcastEmergencyCreated(result[0]);
    }

    return res.status(201).json({
      message: 'Emergency request received. Waiting for an available ambulance driver to accept your request.',
      emergency: result[0],
      ambulance: null,
    });
  } catch (error: any) {
    console.error('Create emergency error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create emergency request' });
  }
});

// POST /api/emergency/:id/accept
// Driver acceptance endpoint: binds the specific driver & ambulance to the request atomically
apiRouter.post('/emergency/:id/accept', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { driver_user_id, driver_name, ambulance_id } = req.body;

    const db = await getDb();

    // 1. Check if emergency exists and is still waiting for driver
    const checkQuery = db.exec(`SELECT * FROM emergency_requests WHERE id = ${id}`);
    const requests = formatQueryResult(checkQuery[0]);

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = requests[0];

    // Prevent multiple drivers accepting (Concurrency protection)
    if (emergency.ambulance_id !== null || emergency.driver_id !== null || emergency.status !== 'WAITING_FOR_DRIVER') {
      return res.status(409).json({ 
        error: 'This emergency request has already been accepted by another driver.' 
      });
    }

    // 2. Resolve driver's ambulance dynamically
    let targetAmbulance: any = null;

    if (ambulance_id) {
      const ambQuery = db.exec(`SELECT * FROM ambulances WHERE id = ${Number(ambulance_id)}`);
      const ambs = formatQueryResult(ambQuery[0]);
      if (ambs.length > 0) targetAmbulance = ambs[0];
    }

    if (!targetAmbulance && driver_user_id) {
      const ambQuery = db.exec(`SELECT * FROM ambulances WHERE driver_user_id = ${Number(driver_user_id)}`);
      const ambs = formatQueryResult(ambQuery[0]);
      if (ambs.length > 0) targetAmbulance = ambs[0];
    }

    if (!targetAmbulance && driver_name) {
      const ambQuery = db.exec(`SELECT * FROM ambulances WHERE LOWER(driver_name) LIKE '%${driver_name.toLowerCase().trim()}%'`);
      const ambs = formatQueryResult(ambQuery[0]);
      if (ambs.length > 0) targetAmbulance = ambs[0];
    }

    if (!targetAmbulance) {
      const ambQuery = db.exec("SELECT * FROM ambulances WHERE status = 'AVAILABLE' ORDER BY id ASC LIMIT 1");
      const ambs = formatQueryResult(ambQuery[0]);
      if (ambs.length > 0) targetAmbulance = ambs[0];
    }

    if (!targetAmbulance) {
      return res.status(400).json({ error: 'No active ambulance found to assign for this driver.' });
    }

    const resolvedDriverUserId = driver_user_id || targetAmbulance.driver_user_id || null;
    const now = new Date().toISOString();
    const actualDriverName = driver_name || targetAmbulance.driver_name;

    // 3. Atomically assign driver and ambulance and update status to DRIVER_ACCEPTED
    db.run(
      "UPDATE emergency_requests SET driver_id = ?, ambulance_id = ?, status = 'DRIVER_ACCEPTED', accepted_at = COALESCE(accepted_at, ?), updated_at = ? WHERE id = ? AND status = 'WAITING_FOR_DRIVER' AND ambulance_id IS NULL",
      [resolvedDriverUserId, targetAmbulance.id, now, now, id]
    );

    // 4. Dynamic AI Route Optimization (Origin: Ambulance Base -> Destination: Patient Location)
    const originLoc = targetAmbulance.base_location || 'Emergency Dispatch Base';
    const destLoc = emergency.location || 'Patient Incident Location';
    const destCoords: [number, number] | undefined = (emergency.latitude && emergency.longitude)
      ? [emergency.latitude, emergency.longitude]
      : undefined;
    const originCoords: [number, number] | undefined = (targetAmbulance.current_latitude && targetAmbulance.current_longitude)
      ? [targetAmbulance.current_latitude, targetAmbulance.current_longitude]
      : (destCoords ? [destCoords[0] - 0.015, destCoords[1] - 0.012] : undefined);

    const routeOptResult = await optimizeRouteAsync(originLoc, destLoc, emergency.emergency_type || 'General', 0, originCoords, destCoords);
    const hospitalOptResult = await optimizeHospitalsAsync(destLoc, emergency.emergency_type || 'General', destCoords);

    const recommendedRoute = routeOptResult.recommendedRoute;
    const recommendedHospital = hospitalOptResult.recommendedHospital;

    // Save generated routes and parameters
    db.run(
      `UPDATE emergency_requests SET 
        route_origin = ?,
        route_destination = ?,
        optimized_routes = ?,
        selected_route_id = ?,
        current_eta_minutes = ?,
        current_distance_km = ?,
        current_traffic = ?,
        hospital_routes = ?,
        selected_hospital = ?,
        route_updated_at = ?
       WHERE id = ?`,
      [
        originLoc,
        destLoc,
        JSON.stringify(routeOptResult.allRoutes),
        recommendedRoute.id,
        recommendedRoute.estimatedMinutes,
        recommendedRoute.distanceKm,
        recommendedRoute.traffic,
        JSON.stringify(hospitalOptResult.allHospitals),
        recommendedHospital.name,
        now,
        id,
      ]
    );

    // 5. Update ambulance status to BUSY
    db.run("UPDATE ambulances SET status = 'BUSY' WHERE id = ?", [targetAmbulance.id]);

    // 6. Add activity log with Route Optimization detail
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `Emergency accepted by driver ${actualDriverName} (Ambulance: ${targetAmbulance.vehicle_number}). AI Route Generated: ${recommendedRoute.name} (${recommendedRoute.distanceKm} km, ETA: ${recommendedRoute.estimatedMinutes} min, Traffic: ${recommendedRoute.traffic})`,
        actualDriverName,
        now,
      ]
    );

    // 1. Patient Notification: Exact user wording & driver/ambulance details with AI Route notice
    if (emergency.patient_id) {
      createNotification(db, {
        userId: Number(emergency.patient_id),
        role: 'patient',
        title: 'Ambulance Driver Assigned',
        message: `An ambulance driver has accepted your emergency request. Driver: ${actualDriverName} | Ambulance: ${targetAmbulance.vehicle_number} (${targetAmbulance.phone}). Following AI-optimized route (ETA: ~${recommendedRoute.estimatedMinutes} mins).`,
        notificationType: 'DRIVER_ACCEPTED',
        emergencyRequestId: id,
      });
    }

    // 2. Driver Acceptance Confirmation: Exact user wording
    if (resolvedDriverUserId) {
      createNotification(db, {
        userId: Number(resolvedDriverUserId),
        role: 'driver',
        title: 'Emergency Request Accepted',
        message: 'You have successfully accepted the emergency request. AI route optimization active.',
        notificationType: 'DRIVER_ACCEPTED_CONFIRMATION',
        emergencyRequestId: id,
      });
    }

    // 3. Other Drivers Notification: Exact user wording
    notifyRole(db, 'driver', {
      title: 'Emergency Request Claimed',
      message: 'This emergency request has been accepted by another driver.',
      notificationType: 'EMERGENCY_CLAIMED_BY_OTHER',
      emergencyRequestId: id,
      excludeUserId: resolvedDriverUserId ? Number(resolvedDriverUserId) : null,
    });

    // 4. Admin Notification
    notifyRole(db, 'admin', {
      title: `Emergency Accepted #${id}`,
      message: `Emergency request #${id} accepted by driver ${actualDriverName} (Ambulance: ${targetAmbulance.vehicle_number}). AI Route: ${recommendedRoute.name} (ETA: ${recommendedRoute.estimatedMinutes} min).`,
      notificationType: 'ADMIN_EMERGENCY_ASSIGNED',
      emergencyRequestId: id,
    });

    saveDb(db);

    // 7. Fetch updated record
    const fullQuery = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const updated = formatQueryResult(fullQuery[0]).map(parseEmergencyRecord);

    if (updated && updated[0]) {
      broadcastEmergencyAssigned(updated[0], targetAmbulance);
    }

    return res.json({
      message: `Emergency accepted by ${actualDriverName}! Ambulance ${targetAmbulance.vehicle_number} is dispatched with AI Route Optimization.`,
      emergency: updated[0],
      ambulance: targetAmbulance,
      routeOptimization: routeOptResult,
      hospitalOptimization: hospitalOptResult,
    });
  } catch (error: any) {
    console.error('Accept emergency error:', error);
    return res.status(500).json({ error: error.message || 'Failed to accept emergency request' });
  }
});

// GET /api/hospitals
// Fetches all registered local emergency hospitals with their ward capacity status
apiRouter.get('/hospitals', async (req: Request, res: Response) => {
  try {
    const pgPool = getPostgresPool();
    if (pgPool) {
      try {
        const resPg = await pgPool.query('SELECT * FROM hospitals ORDER BY ward_capacity ASC, id ASC');
        return res.json({ hospitals: resPg.rows });
      } catch (pgErr: any) {
        if (pgErr?.code === 'ECONNREFUSED' || pgErr?.code === 'ETIMEDOUT') {
          disablePostgresPool(pgErr);
        } else {
          console.warn('[Hospitals] PostgreSQL query fallback:', pgErr?.message || pgErr);
        }
      }
    }

    const db = await getDb();
    const result = db.exec('SELECT * FROM hospitals ORDER BY ward_capacity ASC, id ASC');
    const hospitals = formatQueryResult(result[0]);
    return res.json({ hospitals });
  } catch (error: any) {
    console.error('Fetch hospitals error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch hospitals' });
  }
});

// PATCH /api/hospitals/:id/capacity
// Toggles or sets Emergency Ward Capacity ('AVAILABLE' vs 'FULL')
apiRouter.patch('/hospitals/:id/capacity', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ward_capacity, available_beds } = req.body;
    const db = await getDb();

    const isNumeric = !isNaN(Number(id));
    const checkQuery = isNumeric
      ? `SELECT * FROM hospitals WHERE id = ${Number(id)}`
      : `SELECT * FROM hospitals WHERE name = '${id.replace(/'/g, "''")}'`;

    const checkResult = db.exec(checkQuery);
    const existing = formatQueryResult(checkResult[0]);
    if (existing.length === 0) {
      return res.status(404).json({ error: `Hospital with ID or Name '${id}' not found` });
    }

    const hosp = existing[0];
    const newStatus = ward_capacity === 'FULL' ? 'FULL' : 'AVAILABLE';
    let beds = typeof available_beds === 'number' ? available_beds : hosp.available_beds;
    if (newStatus === 'FULL') {
      beds = 0;
    } else if (newStatus === 'AVAILABLE' && beds === 0) {
      beds = Math.max(1, Math.floor((hosp.total_beds || 20) * 0.45) || 8);
    }

    db.run(
      `UPDATE hospitals SET ward_capacity = ?, available_beds = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newStatus, beds, hosp.id]
    );

    // Audit log
    db.run(
      `INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (NULL, ?, 'Emergency Ward Coordinator / Admin', CURRENT_TIMESTAMP)`,
      [`Emergency Ward Capacity status changed: ${hosp.name} is now ${newStatus} (${beds} available beds)`]
    );

    // Admin & Dispatch alert notification
    db.run(
      `INSERT INTO notifications (user_id, role, title, message, notification_type, is_read, created_at) VALUES
      (3, 'admin', ?, ?, 'HOSPITAL_CAPACITY_UPDATE', 0, CURRENT_TIMESTAMP)`,
      [
        `Ward Capacity: ${hosp.name}`,
        `Emergency Ward status is now ${newStatus}. Patient dispatch radar and live ambulance routing updated.`
      ]
    );

    saveDb(db);

    const updatedQuery = db.exec(`SELECT * FROM hospitals WHERE id = ${hosp.id}`);
    const updatedHosp = formatQueryResult(updatedQuery[0])[0];

    return res.json({
      message: `Emergency Ward Capacity for ${hosp.name} set to ${newStatus}`,
      hospital: updatedHosp,
    });
  } catch (error: any) {
    console.error('Update hospital capacity error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update emergency ward capacity' });
  }
});

// POST /api/hospitals/:id/toggle-capacity
// Convenience toggle between AVAILABLE and FULL
apiRouter.post('/hospitals/:id/toggle-capacity', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDb();

    const isNumeric = !isNaN(Number(id));
    const checkQuery = isNumeric
      ? `SELECT * FROM hospitals WHERE id = ${Number(id)}`
      : `SELECT * FROM hospitals WHERE name = '${id.replace(/'/g, "''")}'`;

    const checkResult = db.exec(checkQuery);
    const existing = formatQueryResult(checkResult[0]);
    if (existing.length === 0) {
      return res.status(404).json({ error: `Hospital with ID or Name '${id}' not found` });
    }

    const hosp = existing[0];
    const currentStatus = hosp.ward_capacity || 'AVAILABLE';
    const nextStatus = currentStatus === 'AVAILABLE' ? 'FULL' : 'AVAILABLE';
    const nextBeds = nextStatus === 'FULL' ? 0 : Math.max(1, Math.floor((hosp.total_beds || 20) * 0.45) || 8);

    db.run(
      `UPDATE hospitals SET ward_capacity = ?, available_beds = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [nextStatus, nextBeds, hosp.id]
    );

    // Audit log
    db.run(
      `INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (NULL, ?, 'Emergency Ward Coordinator / Admin', CURRENT_TIMESTAMP)`,
      [`Emergency Ward Capacity toggled: ${hosp.name} is now ${nextStatus} (${nextBeds} beds)`]
    );

    saveDb(db);

    const updatedQuery = db.exec(`SELECT * FROM hospitals WHERE id = ${hosp.id}`);
    const updatedHosp = formatQueryResult(updatedQuery[0])[0];

    return res.json({
      message: `Emergency Ward Capacity for ${hosp.name} is now ${nextStatus}`,
      hospital: updatedHosp,
    });
  } catch (error: any) {
    console.error('Toggle hospital capacity error:', error);
    return res.status(500).json({ error: error.message || 'Failed to toggle emergency ward capacity' });
  }
});

// GET /api/nearby-hospitals
// Searches real hospitals nearby coordinates and syncs with SQLite Emergency Ward Capacity
apiRouter.get('/nearby-hospitals', async (req: Request, res: Response) => {
  try {
    let lat = req.query.lat ? Number(req.query.lat) : NaN;
    let lng = req.query.lng ? Number(req.query.lng) : NaN;
    const emergencyType = (req.query.emergencyType as string) || 'General';
    const radius = Number(req.query.radius || 10000);

    if (isNaN(lat) || isNaN(lng)) {
      const db = await getDb();
      const latest = db.exec(`SELECT latitude, longitude FROM emergency_requests WHERE latitude IS NOT NULL ORDER BY id DESC LIMIT 1`);
      if (latest && latest[0] && latest[0].values && latest[0].values.length > 0) {
        lat = Number(latest[0].values[0][0]);
        lng = Number(latest[0].values[0][1]);
      }
    }

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Latitude and longitude coordinates are required for nearby hospitals search.' });
    }

    const result = await searchRealNearbyHospitals(lat, lng, radius, emergencyType);
    const db = await getDb();
    const dbHospQuery = db.exec("SELECT * FROM hospitals");
    const dbHospitals = formatQueryResult(dbHospQuery[0]);

    const dbMapByName = new Map<string, any>();
    const dbMapById = new Map<string, any>();
    dbHospitals.forEach((h: any) => {
      dbMapByName.set(h.name.toLowerCase().trim(), h);
      dbMapById.set(String(h.id), h);
    });

    if (result.hospitals && result.hospitals.length > 0) {
      result.hospitals = result.hospitals.map((h: any) => {
        const found = dbMapByName.get(h.name?.toLowerCase()?.trim()) || dbMapById.get(String(h.id));
        if (found) {
          return {
            ...h,
            id: String(found.id),
            ward_capacity: found.ward_capacity,
            emergencyWardCapacity: found.ward_capacity,
            availableEmergencyBeds: found.available_beds,
          };
        } else {
          // Add newly discovered hospital to DB so Admin can manage its capacity
          try {
            const hLat = h.coordinates?.[0] || lat;
            const hLng = h.coordinates?.[1] || lng;
            db.run(
              `INSERT OR IGNORE INTO hospitals (name, specialty, address, latitude, longitude, phone, ward_capacity, available_beds, total_beds, rating, type)
               VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', ?, 20, ?, ?)`,
              [
                h.name,
                h.specialty || 'General Emergency Care',
                h.address || 'Local Medical Hub',
                hLat,
                hLng,
                h.phone || '+91 108 / 112 Emergency Help',
                h.availableEmergencyBeds || 10,
                h.rating || 4.5,
                h.type || 'Emergency Hospital',
              ]
            );
            saveDb(db);
          } catch {
            // safe ignore
          }
          return {
            ...h,
            ward_capacity: h.ward_capacity || 'AVAILABLE',
            emergencyWardCapacity: h.ward_capacity || 'AVAILABLE',
            availableEmergencyBeds: h.availableEmergencyBeds || 10,
          };
        }
      });
    } else if (dbHospitals.length > 0) {
      // Return regional database hospitals sorted by distance
      const list = dbHospitals.map((h: any) => {
        const dist = calculateGeoDistanceKm([lat, lng], [h.latitude, h.longitude]);
        const traffic: 'Low' | 'Moderate' | 'Heavy' = dist > 6 ? 'Heavy' : (dist > 3 ? 'Moderate' : 'Low');
        const speed = traffic === 'Heavy' ? 20 : (traffic === 'Moderate' ? 32 : 44);
        const estMin = Math.max(3, Math.round((dist / speed) * 60));
        return {
          id: String(h.id),
          name: h.name,
          specialty: h.specialty,
          address: h.address,
          distanceKm: dist,
          estimatedMinutes: estMin,
          traffic,
          availableEmergencyBeds: h.available_beds,
          isRecommended: false,
          recommendationReason: `Verified regional emergency facility (${dist} km). Ward Capacity: ${h.ward_capacity}`,
          coordinates: [h.latitude, h.longitude] as [number, number],
          phone: h.phone,
          type: h.type,
          ward_capacity: h.ward_capacity,
          emergencyWardCapacity: h.ward_capacity,
          rating: h.rating,
          source: 'fallback' as const,
        };
      }).sort((a: any, b: any) => a.distanceKm - b.distanceKm);

      if (list.length > 0) {
        list[0].isRecommended = true;
      }
      result.hospitals = list;
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Nearby hospitals search error:', error);
    return res.status(500).json({ error: error.message || 'Failed to search nearby hospitals' });
  }
});

// POST /api/fleet/sync-location
// Synchronizes standby ambulance fleet positions around real user GPS coordinates
apiRouter.post('/fleet/sync-location', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, address } = req.body;
    const norm = normalizeCoord(latitude, longitude);
    if (!norm) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required' });
    }

    const [lat, lng] = norm;
    setPrimaryLocationAnchor(lat, lng);
    const db = await getDb();

    // Base area name
    const shortArea = address ? address.split(',')[0].trim() : 'Local Emergency';

    // Disperse available standby ambulances around user: 1.2km to 3.2km in 4 directions
    const offsets = [
      { latOffset: 0.012, lngOffset: 0.009, nameSuffix: 'North Dispatch Station' },
      { latOffset: -0.015, lngOffset: 0.012, nameSuffix: 'East Emergency Depot' },
      { latOffset: -0.010, lngOffset: -0.014, nameSuffix: 'South Trauma Hub' },
      { latOffset: 0.014, lngOffset: -0.011, nameSuffix: 'West Rapid Response Depot' },
    ];

    const ambQuery = db.exec("SELECT * FROM ambulances ORDER BY id ASC");
    const ambulances = formatQueryResult(ambQuery[0]);

    ambulances.forEach((amb: any, idx: number) => {
      // Relocate standby ambulances that are currently AVAILABLE
      if (amb.status === 'AVAILABLE' || !amb.status) {
        const offset = offsets[idx % offsets.length];
        const newLat = parseFloat((lat + offset.latOffset).toFixed(5));
        const newLng = parseFloat((lng + offset.lngOffset).toFixed(5));
        const newBase = `${shortArea} ${offset.nameSuffix}`;

        db.run(
          "UPDATE ambulances SET current_latitude = ?, current_longitude = ?, base_location = ? WHERE id = ?",
          [newLat, newLng, newBase, amb.id]
        );
      }
    });

    // Relocate regional hospitals around user if far away (> 80 km) so user's map has local hospitals
    const hospQuery = db.exec("SELECT * FROM hospitals");
    if (hospQuery.length > 0) {
      const dbHospitals = formatQueryResult(hospQuery[0]);
      const hospOffsets = [
        { latOff: 0.016, lngOff: 0.018, area: 'Apex Central Medical Plaza' },
        { latOff: -0.018, lngOff: 0.021, area: 'Cardiac & Trauma Corridor' },
        { latOff: -0.014, lngOff: -0.022, area: 'City District Hospital' },
        { latOff: 0.022, lngOff: -0.015, area: 'Super-Specialty Emergency Hub' },
        { latOff: 0.028, lngOff: 0.011, area: 'Memorial Trauma Pavilion' },
        { latOff: -0.025, lngOff: -0.012, area: 'Metro Critical Care Wing' },
      ];
      dbHospitals.forEach((h: any, idx: number) => {
        const dist = calculateGeoDistanceKm([Number(h.latitude), Number(h.longitude)], [lat, lng]);
        if (dist > 80) {
          const off = hospOffsets[idx % hospOffsets.length];
          const newHLat = parseFloat((lat + off.latOff).toFixed(5));
          const newHLng = parseFloat((lng + off.lngOff).toFixed(5));
          const newAddr = `${shortArea} ${off.area}`;
          db.run(
            "UPDATE hospitals SET latitude = ?, longitude = ?, address = ? WHERE id = ?",
            [newHLat, newHLng, newAddr, h.id]
          );
        }
      });
    }

    // Check and repair active emergencies so Patient SOS is placed within a few km of the live ambulance/user
    const emgQuery = db.exec("SELECT * FROM emergency_requests WHERE status IN ('WAITING_FOR_DRIVER', 'DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED')");
    if (emgQuery.length > 0) {
      const emergencies = formatQueryResult(emgQuery[0]);
      for (const emg of emergencies) {
        const hasValid = isValidCoord(emg.latitude, emg.longitude);
        const isFar = hasValid && calculateGeoDistanceKm([Number(emg.latitude), Number(emg.longitude)], [lat, lng]) > 80;
        if (!hasValid || isFar) {
          const patientLat = parseFloat((lat + 0.015).toFixed(5));
          const patientLng = parseFloat((lng + 0.012).toFixed(5));
          const opt = optimizeRoute(
            `${shortArea} Dispatch Base`,
            `${shortArea} Patient SOS Site`,
            emg.emergency_type || 'General',
            0,
            [lat, lng],
            [patientLat, patientLng]
          );
          const hospOpt = optimizeHospitals(`${shortArea} Patient SOS Site`, emg.emergency_type || 'General', 0, [patientLat, patientLng]);
          db.run(
            `UPDATE emergency_requests 
             SET latitude = ?, longitude = ?, optimized_routes = ?, selected_route_id = ?, current_eta_minutes = ?, current_distance_km = ?, hospital_routes = ?, selected_hospital = ?
             WHERE id = ?`,
            [
              patientLat,
              patientLng,
              JSON.stringify(opt.allRoutes),
              opt.recommendedRoute.id,
              opt.recommendedRoute.estimatedMinutes,
              opt.recommendedRoute.distanceKm,
              JSON.stringify(hospOpt.allHospitals),
              hospOpt.recommendedHospital.name,
              emg.id
            ]
          );
        }
      }
    }

    saveDb(db);

    const refreshedQuery = db.exec("SELECT * FROM ambulances ORDER BY id ASC");
    const updatedAmbulances = formatQueryResult(refreshedQuery[0]);

    return res.json({
      message: `Ambulance fleet and emergency coordinates successfully synchronized around GPS (${lat.toFixed(4)}, ${lng.toFixed(4)}) in ${shortArea}.`,
      ambulances: updatedAmbulances,
    });
  } catch (error: any) {
    console.error('Fleet sync location error:', error);
    return res.status(500).json({ error: error.message || 'Failed to sync fleet location' });
  }
});

// GET /api/ip-location
// Resolves client IP geolocation as an immediate fallback when browser GPS is blocked/delayed
apiRouter.get('/ip-location', async (req: Request, res: Response) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    try {
      const targetUrl = clientIp && !clientIp.includes('127.0.0.1') && !clientIp.includes('::1')
        ? `https://ipwho.is/${clientIp}`
        : 'https://ipwho.is/';
      const ipRes = await fetch(targetUrl, { signal: AbortSignal.timeout(3500) });
      if (ipRes.ok) {
        const ipData = (await ipRes.json()) as any;
        if (ipData && ipData.success !== false && typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
          return res.json({
            latitude: ipData.latitude,
            longitude: ipData.longitude,
            city: ipData.city || 'Local Area',
            region: ipData.region || '',
            country: ipData.country || 'India',
            source: 'ip_lookup',
          });
        }
      }
    } catch {
      // Clean fallback if IP geolocation service is unavailable or timed out
    }

    // Default regional emergency center fallback (Bengaluru Central Command)
    return res.json({
      latitude: 12.9716,
      longitude: 77.5946,
      city: 'Bengaluru',
      region: 'Karnataka',
      country: 'India',
      source: 'default_anchor',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to determine IP location' });
  }
});

// GET /api/reverse-geocode
// Reverse-geocodes GPS coordinates to human-readable address to auto-populate SOS location
apiRouter.get('/reverse-geocode', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid lat and lng query parameters are required' });
    }

    const googleKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.MAPS_API_KEY;
    if (googleKey) {
      try {
        const gRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleKey}`);
        if (gRes.ok) {
          const gData = (await gRes.json()) as any;
          if (gData.results && gData.results.length > 0) {
            return res.json({
              formattedAddress: gData.results[0].formatted_address,
              displayName: gData.results[0].formatted_address,
              latitude: lat,
              longitude: lng,
              source: 'google',
            });
          }
        }
      } catch (err) {
        console.warn('Google reverse geocode error:', err);
      }
    }

    // Fallback: OpenStreetMap Nominatim
    try {
      const nomRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'User-Agent': 'Arogyavahini-Emergency-App/1.0' } }
      );
      if (nomRes.ok) {
        const nomData = (await nomRes.json()) as any;
        if (nomData && nomData.display_name) {
          return res.json({
            formattedAddress: nomData.display_name,
            displayName: nomData.display_name,
            latitude: lat,
            longitude: lng,
            source: 'openstreetmap',
          });
        }
      }
    } catch (err) {
      console.warn('Nominatim reverse geocode error:', err);
    }

    return res.json({
      formattedAddress: `Lat: ${lat.toFixed(5)}, Long: ${lng.toFixed(5)}`,
      displayName: `Lat: ${lat.toFixed(5)}, Long: ${lng.toFixed(5)}`,
      latitude: lat,
      longitude: lng,
      source: 'coords',
    });
  } catch (error: any) {
    console.error('Reverse geocode error:', error);
    return res.status(500).json({ error: error.message || 'Failed to reverse geocode' });
  }
});

// POST /api/emergency/:id/find-hospitals
// Fetches real nearby hospitals centered around patient emergency coordinates (or driver current location)
apiRouter.post('/emergency/:id/find-hospitals', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const db = await getDb();

    const query = db.exec(`SELECT * FROM emergency_requests WHERE id = ${id}`);
    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);
    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = emergencies[0];
    const searchLat = req.body.latitude || emergency.latitude || emergency.driver_current_latitude;
    const searchLng = req.body.longitude || emergency.longitude || emergency.driver_current_longitude;

    if (!searchLat || !searchLng) {
      return res.status(400).json({ error: 'Valid location coordinates are required to search hospitals.' });
    }

    const result = await searchRealNearbyHospitals(
      Number(searchLat),
      Number(searchLng),
      10000,
      emergency.emergency_type || 'General'
    );

    const now = new Date().toISOString();
    const recommended = result.hospitals.find((h) => h.isRecommended) || result.hospitals[0];

    db.run(
      `UPDATE emergency_requests SET
        hospital_routes = ?,
        selected_hospital = COALESCE(selected_hospital, ?),
        updated_at = ?
       WHERE id = ?`,
      [JSON.stringify(result.hospitals), recommended?.name || null, now, id]
    );

    // Add activity log
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `Real Nearby Hospitals searched around (${Number(searchLat).toFixed(4)}, ${Number(searchLng).toFixed(4)}): Found ${result.hospitals.length} facilities (${result.source})`,
        emergency.driver_name || 'Driver / Dispatch',
        now,
      ]
    );

    saveDb(db);

    const refetched = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const updated = formatQueryResult(refetched[0]).map(parseEmergencyRecord)[0];

    return res.json({
      message: result.message,
      source: result.source,
      hospitals: result.hospitals,
      emergency: updated,
    });
  } catch (error: any) {
    console.error('Find nearby hospitals error:', error);
    return res.status(500).json({ error: error.message || 'Failed to search hospitals' });
  }
});

// POST /api/emergency/:id/navigate-to-hospital
// Transitions emergency to STAGE 2: Patient/Ambulance Location -> Selected Hospital
apiRouter.post('/emergency/:id/navigate-to-hospital', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { hospitalName, hospitalCoords, driverCoords } = req.body;
    const db = await getDb();

    const query = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);
    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = emergencies[0];
    const targetHospital = hospitalName || emergency.selected_hospital || 'Emergency Trauma Hospital';
    
    // Origin is current ambulance GPS coords or patient coords
    const originLat = driverCoords?.latitude || emergency.driver_current_latitude || emergency.latitude;
    const originLng = driverCoords?.longitude || emergency.driver_current_longitude || emergency.longitude;

    if (!originLat || !originLng) {
      return res.status(400).json({ error: 'Origin coordinates are required to calculate route to hospital.' });
    }

    const originLocation = `Patient Location (${emergency.location || 'Incident Site'})`;
    
    const hospCoords: [number, number] = hospitalCoords && hospitalCoords[0] && hospitalCoords[1]
      ? [hospitalCoords[0], hospitalCoords[1]]
      : [originLat + 0.018, originLng + 0.015];

    // Compute Stage 2 Route Candidates
    const variationSeed = Math.floor(Math.random() * 1000) + 1;
    const routeOptResult = await optimizeRouteAsync(
      originLocation,
      targetHospital,
      emergency.emergency_type || 'General',
      variationSeed,
      [originLat, originLng],
      hospCoords
    );

    const recommended = routeOptResult.recommendedRoute;
    const now = new Date().toISOString();

    db.run(
      `UPDATE emergency_requests SET
        navigation_stage = 'TO_HOSPITAL',
        selected_hospital = ?,
        route_origin = ?,
        route_destination = ?,
        optimized_routes = ?,
        selected_route_id = ?,
        current_eta_minutes = ?,
        current_distance_km = ?,
        current_traffic = ?,
        route_updated_at = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        targetHospital,
        originLocation,
        targetHospital,
        JSON.stringify(routeOptResult.allRoutes),
        recommended.id,
        recommended.estimatedMinutes,
        recommended.distanceKm,
        recommended.traffic,
        now,
        now,
        id,
      ]
    );

    // Add activity log
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `STAGE 2 NAVIGATION ACTIVATED: Transporting patient to ${targetHospital} (ETA: ${recommended.estimatedMinutes} mins, Distance: ${recommended.distanceKm} km)`,
        emergency.driver_name || 'Driver / Paramedic',
        now,
      ]
    );

    // Notify patient
    if (emergency.patient_id) {
      createNotification(db, {
        userId: Number(emergency.patient_id),
        role: 'patient',
        title: 'En Route to Hospital',
        message: `Ambulance is now navigating to ${targetHospital}. Estimated transit time: ~${recommended.estimatedMinutes} mins.`,
        notificationType: 'ON_THE_WAY',
        emergencyRequestId: id,
      });
    }

    saveDb(db);

    const refetched = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const updated = formatQueryResult(refetched[0]).map(parseEmergencyRecord)[0];

    return res.json({
      message: `Stage 2 Navigation active towards ${targetHospital}`,
      emergency: updated,
      stage: 'TO_HOSPITAL',
      routeOptimization: routeOptResult,
    });
  } catch (error: any) {
    console.error('Navigate to hospital error:', error);
    return res.status(500).json({ error: error.message || 'Failed to start navigation to hospital' });
  }
});

// POST /api/emergency/:id/recalculate-route
// Driver clicks "Recalculate Route" or dynamic traffic changes occur
apiRouter.post('/emergency/:id/recalculate-route', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { origin, destination, originLatitude, originLongitude, destLatitude, destLongitude, stage } = req.body;
    const db = await getDb();

    const query = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);
    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = emergencies[0];
    const originLoc = origin || emergency.route_origin || (emergency.driver_current_latitude ? 'Driver Live Location' : (emergency.ambulance_base || 'Emergency Base'));
    const destLoc = destination || emergency.route_destination || emergency.location;
    
    // Resolve origin and destination coordinates
    const originCoords: [number, number] | null = (originLatitude && originLongitude)
      ? [Number(originLatitude), Number(originLongitude)]
      : (emergency.driver_current_latitude && emergency.driver_current_longitude)
        ? [Number(emergency.driver_current_latitude), Number(emergency.driver_current_longitude)]
        : null;

    const destCoords: [number, number] | null = (destLatitude && destLongitude)
      ? [Number(destLatitude), Number(destLongitude)]
      : (emergency.latitude && emergency.longitude)
        ? [Number(emergency.latitude), Number(emergency.longitude)]
        : null;

    // Seed using timestamp for fresh live traffic simulation
    const variationSeed = Math.floor(Math.random() * 1000) + 1;
    const routeOptResult = await optimizeRouteAsync(
      originLoc,
      destLoc,
      emergency.emergency_type || 'General',
      variationSeed,
      originCoords,
      destCoords
    );

    const hospitalOptResult = await optimizeHospitalsAsync(destLoc, emergency.emergency_type || 'General', destCoords);
    const recommended = routeOptResult.recommendedRoute;
    const now = new Date().toISOString();
    const activeStage = stage || emergency.navigation_stage || 'TO_PATIENT';

    db.run(
      `UPDATE emergency_requests SET 
        route_origin = ?,
        route_destination = ?,
        optimized_routes = ?,
        selected_route_id = ?,
        current_eta_minutes = ?,
        current_distance_km = ?,
        current_traffic = ?,
        hospital_routes = ?,
        navigation_stage = ?,
        route_updated_at = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        originLoc,
        destLoc,
        JSON.stringify(routeOptResult.allRoutes),
        recommended.id,
        recommended.estimatedMinutes,
        recommended.distanceKm,
        recommended.traffic,
        JSON.stringify(hospitalOptResult.allHospitals),
        activeStage,
        now,
        now,
        id,
      ]
    );

    // Add activity log
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `AI Route Recalculated: ${recommended.name} (ETA: ${recommended.estimatedMinutes} mins, Distance: ${recommended.distanceKm} km, Traffic: ${recommended.traffic})`,
        emergency.driver_name || 'Driver',
        now,
      ]
    );

    saveDb(db);

    const refetched = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const updated = formatQueryResult(refetched[0]).map(parseEmergencyRecord)[0];

    if (recommended) {
      broadcastRouteUpdated(
        id,
        recommended.id,
        recommended.distanceKm,
        recommended.estimatedMinutes,
        recommended.traffic,
        recommended.coordinates || [],
        recommended.waypoints || []
      );
    }

    return res.json({
      message: 'AI route updated based on live GPS and traffic conditions.',
      emergency: updated,
      routeOptimization: routeOptResult,
      hospitalOptimization: hospitalOptResult,
    });
  } catch (error: any) {
    console.error('Recalculate route error:', error);
    return res.status(500).json({ error: error.message || 'Failed to recalculate AI route' });
  }
});

// POST /api/emergency/:id/driver-location
// Driver continuously streams real-time GPS location
apiRouter.post('/emergency/:id/driver-location', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { latitude, longitude, accuracy } = req.body;

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    const db = await getDb();
    const now = new Date().toISOString();

    const query = db.exec(`SELECT * FROM emergency_requests WHERE id = ${id}`);
    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);
    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency not found' });
    }

    const emergency = emergencies[0];

    // Update emergency request driver coordinates
    db.run(
      `UPDATE emergency_requests SET
        driver_current_latitude = ?,
        driver_current_longitude = ?,
        driver_accuracy = ?,
        updated_at = ?
       WHERE id = ?`,
      [Number(latitude), Number(longitude), accuracy ? Number(accuracy) : null, now, id]
    );

    // Update ambulance table if linked
    if (emergency.ambulance_id) {
      db.run(
        `UPDATE ambulances SET
          current_latitude = ?,
          current_longitude = ?,
          last_gps_update = ?
         WHERE id = ?`,
        [Number(latitude), Number(longitude), now, emergency.ambulance_id]
      );
    }

    saveDb(db);

    // Broadcast real-time location to Patient, Admin, and Drivers over Socket.IO
    broadcastAmbulanceLocation({
      ambulanceId: emergency.ambulance_id || 1,
      emergencyId: id,
      driverId: emergency.driver_id || undefined,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy ? Number(accuracy) : undefined,
      speed: req.body.speed !== undefined ? Number(req.body.speed) : undefined,
      heading: req.body.heading !== undefined ? Number(req.body.heading) : undefined,
      source: 'device_gps',
    });

    return res.json({
      success: true,
      message: 'Driver GPS location updated successfully',
      location: {
        latitude: Number(latitude),
        longitude: Number(longitude),
        accuracy: accuracy ? Number(accuracy) : null,
        updated_at: now,
      },
    });
  } catch (error: any) {
    console.error('Driver location update error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update driver location' });
  }
});

// POST /api/emergency/:id/select-route
// Driver selects a specific route from the generated candidates
apiRouter.post('/emergency/:id/select-route', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { routeId } = req.body;

    if (!routeId) {
      return res.status(400).json({ error: 'Route ID is required' });
    }

    const db = await getDb();
    const query = db.exec(`SELECT * FROM emergency_requests WHERE id = ${id}`);
    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);

    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = emergencies[0];
    const allRoutes: any[] = emergency.optimized_routes || [];
    const targetRoute = allRoutes.find((r) => r.id === routeId);

    if (!targetRoute) {
      return res.status(400).json({ error: 'Selected route option not found among generated candidates.' });
    }

    const now = new Date().toISOString();
    db.run(
      `UPDATE emergency_requests SET 
        selected_route_id = ?,
        current_eta_minutes = ?,
        current_distance_km = ?,
        current_traffic = ?,
        route_updated_at = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        targetRoute.id,
        targetRoute.estimatedMinutes,
        targetRoute.distanceKm,
        targetRoute.traffic,
        now,
        now,
        id,
      ]
    );

    // Add activity log
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `Driver selected navigation route: ${targetRoute.name} (${targetRoute.distanceKm} km, ETA: ${targetRoute.estimatedMinutes} min, Traffic: ${targetRoute.traffic})`,
        'Driver',
        now,
      ]
    );

    saveDb(db);

    const refetched = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const updated = formatQueryResult(refetched[0]).map(parseEmergencyRecord)[0];

    return res.json({
      message: `Switched to ${targetRoute.name}`,
      emergency: updated,
      selectedRoute: targetRoute,
    });
  } catch (error: any) {
    console.error('Select route error:', error);
    return res.status(500).json({ error: error.message || 'Failed to switch route' });
  }
});

// POST /api/emergency/:id/start-navigation
// Driver starts turn-by-turn navigation
apiRouter.post('/emergency/:id/start-navigation', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const db = await getDb();

    const query = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);
    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = emergencies[0];
    const now = new Date().toISOString();

    db.run(
      "UPDATE emergency_requests SET status = 'ON_THE_WAY', navigation_started = 1, updated_at = ? WHERE id = ?",
      [now, id]
    );

    if (emergency.ambulance_id) {
      db.run("UPDATE ambulances SET status = 'BUSY' WHERE id = ?", [emergency.ambulance_id]);
    }

    // Add activity log
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `Ambulance started navigation with sirens active towards ${emergency.location}`,
        emergency.driver_name || 'Driver',
        now,
      ]
    );

    // Patient notification
    if (emergency.patient_id) {
      createNotification(db, {
        userId: Number(emergency.patient_id),
        role: 'patient',
        title: 'Ambulance On The Way',
        message: `Your ambulance is following an AI-optimized route to reach you. Estimated arrival: ~${emergency.current_eta_minutes || 8} mins.`,
        notificationType: 'ON_THE_WAY',
        emergencyRequestId: id,
      });
    }

    // Admin notification
    notifyRole(db, 'admin', {
      title: `Navigation Active #${id}`,
      message: `Ambulance ${emergency.vehicle_number || ''} started navigation to ${emergency.location}. ETA: ${emergency.current_eta_minutes || 8} mins.`,
      notificationType: 'ADMIN_STATUS_UPDATE',
      emergencyRequestId: id,
    });

    saveDb(db);

    const refetched = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const updated = formatQueryResult(refetched[0]).map(parseEmergencyRecord)[0];

    return res.json({
      message: 'Navigation started successfully. Sirens & green corridor active.',
      emergency: updated,
    });
  } catch (error: any) {
    console.error('Start navigation error:', error);
    return res.status(500).json({ error: error.message || 'Failed to start navigation' });
  }
});

// POST /api/emergency/:id/select-hospital
// Selects and sets hospital destination for hospital transit stage
apiRouter.post('/emergency/:id/select-hospital', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { hospitalName, hospitalId } = req.body;

    if (!hospitalName) {
      return res.status(400).json({ error: 'Hospital name is required' });
    }

    const db = await getDb();
    const query = db.exec(`SELECT * FROM emergency_requests WHERE id = ${id}`);
    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);

    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = emergencies[0];
    const now = new Date().toISOString();

    db.run(
      "UPDATE emergency_requests SET selected_hospital = ?, updated_at = ? WHERE id = ?",
      [hospitalName, now, id]
    );

    // Add activity log
    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [
        id,
        `Hospital destination selected: ${hospitalName}`,
        'Driver / Paramedic',
        now,
      ]
    );

    saveDb(db);

    const refetched = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const updated = formatQueryResult(refetched[0]).map(parseEmergencyRecord)[0];

    return res.json({
      message: `Hospital destination set to ${hospitalName}`,
      emergency: updated,
    });
  } catch (error: any) {
    console.error('Select hospital error:', error);
    return res.status(500).json({ error: error.message || 'Failed to set hospital destination' });
  }
});

// GET /api/emergency
// Lists emergency requests (optional filter by patient_id, ambulance_id, or status)
apiRouter.get('/emergency', async (req: Request, res: Response) => {
  try {
    const { patient_id, ambulance_id, status } = req.query;
    const db = await getDb();

    let sql = `
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE 1=1
    `;

    if (patient_id) {
      sql += ` AND e.patient_id = ${Number(patient_id)}`;
    }
    if (ambulance_id) {
      sql += ` AND e.ambulance_id = ${Number(ambulance_id)}`;
    }
    if (status) {
      sql += ` AND e.status = '${status}'`;
    }

    sql += ` ORDER BY e.id DESC`;

    const query = db.exec(sql);
    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);

    return res.json({
      count: emergencies.length,
      emergencies,
    });
  } catch (error: any) {
    console.error('Fetch emergencies error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch emergency requests' });
  }
});

// GET /api/emergency/in-transit-er
// Returns all incoming ambulance transfers with live vitals for receiving hospital ER dashboards
apiRouter.get('/emergency/in-transit-er', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const query = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.status IN ('ON_THE_WAY', 'REACHED', 'TRANSFERRING_TO_HOSPITAL')
      ORDER BY 
        CASE 
          WHEN e.triage_acuity = 'CODE_RED' THEN 1
          WHEN e.triage_acuity = 'CODE_YELLOW' THEN 2
          ELSE 3
        END,
        e.created_at DESC
    `);
    const results = formatQueryResult(query[0]).map(parseEmergencyRecord);
    return res.json({
      count: results.length,
      incoming_transfers: results,
    });
  } catch (error: any) {
    console.error('Fetch in-transit ER error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch in-transit emergencies' });
  }
});

// GET /api/emergency/:id
apiRouter.get('/emergency/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Valid numeric emergency ID is required' });
    }
    const db = await getDb();

    const query = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);
    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    // Fetch activity logs
    const logQuery = db.exec(`SELECT * FROM activity_logs WHERE emergency_id = ${id} ORDER BY id ASC`);
    const logs = formatQueryResult(logQuery[0]);

    return res.json({
      emergency: emergencies[0],
      logs,
    });
  } catch (error: any) {
    console.error('Fetch emergency detail error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch emergency details' });
  }
});

// GET /api/emergency/:id/report
// Generates a comprehensive clinical and dispatch report for completed emergencies
apiRouter.get('/emergency/:id/report', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const db = await getDb();

    const query = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.phone as ambulance_phone,
        a.status as ambulance_status,
        pu.phone as patient_registered_phone,
        pu.email as patient_email
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      LEFT JOIN users pu ON e.patient_id = pu.id
      WHERE e.id = ${id}
    `);

    const emergencies = formatQueryResult(query[0]).map(parseEmergencyRecord);
    if (emergencies.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = emergencies[0];

    // Fetch activity logs
    const logQuery = db.exec(`SELECT * FROM activity_logs WHERE emergency_id = ${id} ORDER BY id ASC`);
    const logs = formatQueryResult(logQuery[0]);

    // Parse dates and fallback if accepted_at / completed_at were not stored directly
    const acceptedLog = logs.find((l: any) => l.action && l.action.toLowerCase().includes('accepted'));
    const completedLog = logs.find((l: any) => l.action && (l.action.toLowerCase().includes('completed') || l.action.toLowerCase().includes('resolved')));

    const acceptedAt = emergency.accepted_at || acceptedLog?.timestamp || emergency.created_at;
    const completedAt = emergency.completed_at || completedLog?.timestamp || (emergency.status === 'COMPLETED' ? emergency.updated_at : null);

    // Calculate response times
    let responseTimeMinutes = 0;
    if (acceptedAt && emergency.created_at) {
      const diffMs = new Date(acceptedAt).getTime() - new Date(emergency.created_at).getTime();
      responseTimeMinutes = Math.max(1, Math.round(diffMs / 60000));
    }
    let totalMissionDurationMinutes = 0;
    if (completedAt && emergency.created_at) {
      const diffMs = new Date(completedAt).getTime() - new Date(emergency.created_at).getTime();
      totalMissionDurationMinutes = Math.max(1, Math.round(diffMs / 60000));
    }

    // Selected route
    const routes: any[] = emergency.optimized_routes || [];
    const selectedRoute = routes.find((r: any) => r.id === emergency.selected_route_id) || routes[0] || null;

    const report = {
      reportId: `REP-${id.toString().padStart(6, '0')}`,
      generatedAt: new Date().toISOString(),
      patient: {
        id: emergency.patient_id ? `PAT-${emergency.patient_id}` : `PAT-REG-${emergency.id}`,
        name: emergency.patient_name,
        phone: emergency.phone || emergency.patient_registered_phone || 'N/A',
        email: emergency.patient_email || null,
        bloodType: emergency.patient_blood_type || null,
        allergies: emergency.patient_allergies || null,
        emergencyContactName: emergency.patient_emergency_contact_name || null,
        emergencyContactPhone: emergency.patient_emergency_contact_phone || null,
        emergencyContactRelation: emergency.patient_emergency_contact_relation || null,
        medicalNotes: emergency.patient_medical_notes || null,
      },
      emergency: {
        id: emergency.id,
        emergencyRequestId: `EMG-${emergency.id}`,
        type: emergency.emergency_type,
        status: emergency.status,
        medicalDetails: emergency.notes || 'No pre-existing conditions noted at initial triage.',
        requestDateTime: emergency.created_at,
        acceptedDateTime: acceptedAt,
        completionDateTime: completedAt,
        responseTimeMinutes,
        totalMissionDurationMinutes,
      },
      pickupLocation: {
        address: emergency.location,
        coordinates: (emergency.latitude && emergency.longitude)
          ? { latitude: emergency.latitude, longitude: emergency.longitude }
          : null,
      },
      destinationLocation: {
        hospitalName: emergency.hospital_destination || emergency.selected_hospital || 'City General Hospital Trauma Center',
        department: 'Emergency & Trauma Care Center',
      },
      ambulance: {
        id: emergency.ambulance_id,
        vehicleNumber: emergency.vehicle_number || 'AMB-108-EMG',
        type: emergency.ambulance_type || 'Advanced Life Support (ALS)',
        baseLocation: emergency.ambulance_base || 'Central Dispatch Station',
        phone: emergency.ambulance_phone || '+91 108',
      },
      driver: {
        id: emergency.driver_id ? `DRV-${emergency.driver_id}` : 'DRV-108',
        name: emergency.driver_name || 'Emergency Paramedic Specialist',
        phone: emergency.driver_phone || '+91 98765 43210',
        designation: 'Certified Emergency Medical Technician (EMT-P)',
      },
      journeySummary: {
        routeName: selectedRoute?.name || 'Corridor Alpha (Traffic Signal Priority)',
        routeSummary: selectedRoute?.summary || 'Optimized rapid corridor with automated traffic preemption',
        distanceKm: selectedRoute?.distanceKm || emergency.current_distance_km || 4.2,
        estimatedDurationMinutes: selectedRoute?.estimatedMinutes || emergency.current_eta_minutes || 10,
        trafficConditions: emergency.current_traffic || selectedRoute?.traffic || 'Low Congestion',
        greenCorridorActive: true,
        waypoints: selectedRoute?.waypoints || ['Ambulance Base Station', 'Outer Ring Road', 'Hospital Emergency Trauma Ward'],
      },
      activityLogs: logs,
    };

    return res.json({ report });
  } catch (error: any) {
    console.error('Fetch emergency report error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate emergency report' });
  }
});

// PUT /api/emergency/:id/status
// Emergency status flow: WAITING_FOR_DRIVER -> DRIVER_ACCEPTED -> ON_THE_WAY -> REACHED -> COMPLETED
apiRouter.put('/emergency/:id/status', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status, updated_by, driver_ambulance_id } = req.body;

    const allowedStatuses = ['WAITING_FOR_DRIVER', 'DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED', 'COMPLETED', 'CANCELLED'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    const db = await getDb();

    // Check if emergency exists
    const checkQuery = db.exec(`SELECT * FROM emergency_requests WHERE id = ${id}`);
    const requests = formatQueryResult(checkQuery[0]);

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const currentRequest = requests[0];

    // Ownership check: If a driver tries to update an emergency not assigned to their ambulance
    if (driver_ambulance_id && currentRequest.ambulance_id && currentRequest.ambulance_id !== Number(driver_ambulance_id)) {
      return res.status(403).json({ error: 'You cannot update an emergency assigned to a different ambulance.' });
    }

    const now = new Date().toISOString();

    // Update emergency request status with appropriate timestamps
    if (status === 'COMPLETED') {
      db.run("UPDATE emergency_requests SET status = ?, completed_at = COALESCE(completed_at, ?), updated_at = ? WHERE id = ?", [status, now, now, id]);
    } else if (status === 'DRIVER_ACCEPTED') {
      db.run("UPDATE emergency_requests SET status = ?, accepted_at = COALESCE(accepted_at, ?), updated_at = ? WHERE id = ?", [status, now, now, id]);
    } else {
      db.run("UPDATE emergency_requests SET status = ?, updated_at = ? WHERE id = ?", [status, now, id]);
    }

    // Handle ambulance state transitions
    if (currentRequest.ambulance_id) {
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        // Free the ambulance back to AVAILABLE
        db.run("UPDATE ambulances SET status = 'AVAILABLE' WHERE id = ?", [currentRequest.ambulance_id]);
      } else if (['DRIVER_ACCEPTED', 'ON_THE_WAY', 'REACHED'].includes(status)) {
        db.run("UPDATE ambulances SET status = 'BUSY' WHERE id = ?", [currentRequest.ambulance_id]);
      }
    }

    // If request had no ambulance and is now being assigned directly
    if (!currentRequest.ambulance_id && req.body.ambulance_id) {
      db.run("UPDATE emergency_requests SET ambulance_id = ? WHERE id = ?", [req.body.ambulance_id, id]);
      db.run("UPDATE ambulances SET status = 'BUSY' WHERE id = ?", [req.body.ambulance_id]);
    }

    // Add activity log
    const actor = updated_by || 'System / Driver';
    let logDescription = `Status updated to ${status}`;
    if (status === 'DRIVER_ACCEPTED') logDescription = 'Ambulance driver accepted dispatch request';
    if (status === 'ON_THE_WAY') logDescription = 'Ambulance en route with priority sirens active';
    if (status === 'REACHED') logDescription = 'Ambulance arrived at patient incident location';
    if (status === 'COMPLETED') logDescription = 'Emergency resolved and patient admitted to hospital trauma center';
    if (status === 'CANCELLED') logDescription = 'Emergency request cancelled';

    db.run(
      "INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)",
      [id, logDescription, actor, now]
    );

    // Trigger Role-Specific Notifications based on Status
    if (status === 'ON_THE_WAY') {
      // 1. Patient Notification: Exact user wording
      if (currentRequest.patient_id) {
        createNotification(db, {
          userId: Number(currentRequest.patient_id),
          role: 'patient',
          title: 'Ambulance On The Way',
          message: 'Your ambulance is on the way.',
          notificationType: 'ON_THE_WAY',
          emergencyRequestId: id,
        });
      }
      // 2. Admin Notification
      notifyRole(db, 'admin', {
        title: `Ambulance En Route #${id}`,
        message: `Ambulance is now en route to ${currentRequest.location} for emergency #${id}.`,
        notificationType: 'ADMIN_STATUS_UPDATE',
        emergencyRequestId: id,
      });
    } else if (status === 'REACHED') {
      // 1. Patient Notification: Exact user wording
      if (currentRequest.patient_id) {
        createNotification(db, {
          userId: Number(currentRequest.patient_id),
          role: 'patient',
          title: 'Ambulance Arrived',
          message: 'Your ambulance has reached your location.',
          notificationType: 'REACHED',
          emergencyRequestId: id,
        });
      }
      // 2. Admin Notification
      notifyRole(db, 'admin', {
        title: `Ambulance At Scene #${id}`,
        message: `Ambulance reached incident scene for emergency request #${id} (${currentRequest.location}).`,
        notificationType: 'ADMIN_STATUS_UPDATE',
        emergencyRequestId: id,
      });
    } else if (status === 'COMPLETED') {
      // 1. Patient Notification: Exact user wording
      if (currentRequest.patient_id) {
        createNotification(db, {
          userId: Number(currentRequest.patient_id),
          role: 'patient',
          title: 'Emergency Request Completed',
          message: 'Your emergency request has been completed.',
          notificationType: 'EMERGENCY_COMPLETED',
          emergencyRequestId: id,
        });
      }
      // 2. Driver Notification
      if (currentRequest.driver_id) {
        createNotification(db, {
          userId: Number(currentRequest.driver_id),
          role: 'driver',
          title: 'Mission Completed',
          message: `Hospital handover complete for emergency request #${id}. Unit is now ready on standby.`,
          notificationType: 'MISSION_COMPLETED',
          emergencyRequestId: id,
        });
      }
      // 3. Admin Notification
      notifyRole(db, 'admin', {
        title: `Emergency Completed #${id}`,
        message: `Emergency request #${id} (${currentRequest.emergency_type} at ${currentRequest.location}) has been successfully completed.`,
        notificationType: 'ADMIN_EMERGENCY_COMPLETED',
        emergencyRequestId: id,
      });
    } else if (status === 'CANCELLED') {
      if (currentRequest.patient_id) {
        createNotification(db, {
          userId: Number(currentRequest.patient_id),
          role: 'patient',
          title: 'Emergency Request Cancelled',
          message: `Your emergency request #${id} has been cancelled.`,
          notificationType: 'EMERGENCY_CANCELLED',
          emergencyRequestId: id,
        });
      }
      if (currentRequest.driver_id) {
        createNotification(db, {
          userId: Number(currentRequest.driver_id),
          role: 'driver',
          title: 'Emergency Cancelled',
          message: `Emergency request #${id} was cancelled.`,
          notificationType: 'EMERGENCY_CANCELLED',
          emergencyRequestId: id,
        });
      }
      notifyRole(db, 'admin', {
        title: `Emergency Cancelled #${id}`,
        message: `Emergency request #${id} has been cancelled.`,
        notificationType: 'ADMIN_EMERGENCY_CANCELLED',
        emergencyRequestId: id,
      });
    }

    saveDb(db);

    // Fetch updated record
    const updatedQuery = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const updated = formatQueryResult(updatedQuery[0]).map(parseEmergencyRecord);

    if (updated && updated[0]) {
      broadcastAmbulanceStatus(
        id,
        currentRequest.ambulance_id || updated[0].ambulance_id || 0,
        status,
        actor
      );
    }

    return res.json({
      message: `Emergency status successfully updated to ${status}`,
      emergency: updated[0],
    });
  } catch (error: any) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update emergency status' });
  }
});

// POST /api/emergency/:id/rating
// Allows patients to rate ambulance response speed and paramedic service after SOS completion
apiRouter.post('/emergency/:id/rating', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { rating_overall_stars, rating_speed_stars, rating_service_stars, rating_feedback } = req.body;

    const speedStars = Math.max(1, Math.min(5, Math.round(Number(rating_speed_stars) || 5)));
    const serviceStars = Math.max(1, Math.min(5, Math.round(Number(rating_service_stars) || 5)));
    const overallStars = Math.max(
      1,
      Math.min(5, Math.round(Number(rating_overall_stars) || Math.round((speedStars + serviceStars) / 2)))
    );
    const feedbackText = typeof rating_feedback === 'string' ? rating_feedback.trim().slice(0, 1000) : '';

    const db = await getDb();
    const checkQuery = db.exec(`SELECT * FROM emergency_requests WHERE id = ${id}`);
    const requests = formatQueryResult(checkQuery[0]);
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = requests[0];
    const now = new Date().toISOString();

    db.run(
      `UPDATE emergency_requests 
       SET rating_overall_stars = ?, 
           rating_speed_stars = ?, 
           rating_service_stars = ?, 
           rating_feedback = ?, 
           rating_submitted_at = ?,
           updated_at = ?
       WHERE id = ?`,
      [overallStars, speedStars, serviceStars, feedbackText, now, now, id]
    );

    // Audit log entry
    db.run(
      `INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)`,
      [
        id,
        `Patient submitted rating: Speed ${speedStars}/5, Service ${serviceStars}/5${feedbackText ? ` ("${feedbackText.slice(0, 40)}")` : ''}`,
        emergency.patient_name || 'Patient',
        now,
      ]
    );

    // Notify driver if assigned
    if (emergency.driver_id) {
      createNotification(db, {
        userId: Number(emergency.driver_id),
        role: 'driver',
        title: 'Ambulance Rating Received',
        message: `Patient rated SOS #${emergency.id}: Speed ${speedStars}/5, Service ${serviceStars}/5.`,
        notificationType: 'RATING_RECEIVED',
        emergencyRequestId: id,
      });
    }

    // Notify admin
    notifyRole(db, 'admin', {
      title: `Ambulance Rated #${id}`,
      message: `SOS #${emergency.id} received rating: Speed ${speedStars}/5, Service ${serviceStars}/5 for ${emergency.vehicle_number || 'assigned ambulance'}.`,
      notificationType: 'ADMIN_RATING_RECEIVED',
      emergencyRequestId: id,
    });

    saveDb(db);

    const updatedQuery = db.exec(`
      SELECT 
        e.*,
        a.vehicle_number,
        COALESCE(u.name, a.driver_name) as driver_name,
        COALESCE(u.phone, a.phone) as driver_phone,
        a.type as ambulance_type,
        a.base_location as ambulance_base,
        a.status as ambulance_status
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    const updated = formatQueryResult(updatedQuery[0]).map(parseEmergencyRecord);

    return res.json({
      message: 'Thank you for your feedback! Your rating has been successfully submitted.',
      emergency: updated[0],
    });
  } catch (error: any) {
    console.error('Submit rating error:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit rating' });
  }
});

// POST /api/emergency/:id/proximity-alert
// Automated notification triggered when assigned ambulance is within 2 km of patient GPS
apiRouter.post('/emergency/:id/proximity-alert', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { distance_km, eta_minutes } = req.body;
    const db = await getDb();

    const emergencyQuery = db.exec(`
      SELECT 
        e.*, 
        a.vehicle_number, 
        COALESCE(u.name, a.driver_name) as driver_name, 
        COALESCE(u.phone, a.phone) as driver_phone
      FROM emergency_requests e
      LEFT JOIN ambulances a ON e.ambulance_id = a.id
      LEFT JOIN users u ON e.driver_id = u.id
      WHERE e.id = ${id}
    `);

    if (!emergencyQuery[0] || emergencyQuery[0].values.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = formatQueryResult(emergencyQuery[0]).map(parseEmergencyRecord)[0];
    const now = new Date().toISOString();
    const distText = typeof distance_km === 'number' ? `${distance_km.toFixed(1)} km` : 'within 2 km';
    const etaText = eta_minutes ? `ETA ~${eta_minutes} mins` : 'arriving shortly';

    // 1. Send high-priority notification to patient
    if (emergency.patient_id) {
      createNotification(db, {
        userId: Number(emergency.patient_id),
        role: 'patient',
        title: '🚨 Ambulance Nearby: Within 2 km!',
        message: `Assigned unit ${emergency.vehicle_number || 'Ambulance'} is currently ${distText} from your GPS location (${etaText}). Please ensure building gates are unlocked.`,
        notificationType: 'AMBULANCE_PROXIMITY_2KM',
        emergencyRequestId: id,
      });
    }

    // 2. Audit log entry
    db.run(
      `INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)`,
      [
        id,
        `Automated 2km proximity threshold crossed: ${emergency.vehicle_number || 'Ambulance'} is ${distText} away (${etaText})`,
        'System Proximity Radar',
        now,
      ]
    );

    // Update current_distance_km if provided
    if (typeof distance_km === 'number') {
      db.run(
        `UPDATE emergency_requests SET current_distance_km = ?, updated_at = ? WHERE id = ?`,
        [distance_km, now, id]
      );
    }

    saveDb(db);

    return res.json({
      success: true,
      message: `2km proximity notification triggered for SOS #${id}`,
      distance_km,
      eta_minutes,
    });
  } catch (error: any) {
    console.error('Proximity alert error:', error);
    return res.status(500).json({ error: error.message || 'Failed to trigger proximity alert' });
  }
});

// POST /api/emergency/:id/vitals (e-PCR Tele-Triage & Hospital ER Pre-Arrival Notification)
// Allows paramedic to transmit live patient vitals and trigger hospital trauma bay preparation
apiRouter.post('/emergency/:id/vitals', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      vitals_heart_rate,
      vitals_blood_pressure,
      vitals_spo2,
      vitals_respiratory_rate,
      vitals_gcs,
      vitals_blood_sugar,
      triage_acuity,
      er_prep_notes,
      blood_bank_required,
      trauma_bay_required,
    } = req.body;

    const db = await getDb();
    const checkQuery = db.exec(`SELECT * FROM emergency_requests WHERE id = ${id}`);
    const requests = formatQueryResult(checkQuery[0]);
    if (requests.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const emergency = requests[0];
    const now = new Date().toISOString();
    const acuity = triage_acuity || 'CODE_YELLOW';

    // Update database with latest in-transit vitals
    db.run(
      `UPDATE emergency_requests 
       SET vitals_heart_rate = ?,
           vitals_blood_pressure = ?,
           vitals_spo2 = ?,
           vitals_respiratory_rate = ?,
           vitals_gcs = ?,
           vitals_blood_sugar = ?,
           triage_acuity = ?,
           er_notified_at = ?,
           er_prep_notes = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        vitals_heart_rate ? Number(vitals_heart_rate) : null,
        vitals_blood_pressure ? String(vitals_blood_pressure).trim() : null,
        vitals_spo2 ? Number(vitals_spo2) : null,
        vitals_respiratory_rate ? Number(vitals_respiratory_rate) : null,
        vitals_gcs ? Number(vitals_gcs) : null,
        vitals_blood_sugar ? Number(vitals_blood_sugar) : null,
        acuity,
        now,
        er_prep_notes ? String(er_prep_notes).trim() : null,
        now,
        id,
      ]
    );

    // Audit log
    const hrText = vitals_heart_rate ? `HR: ${vitals_heart_rate} bpm` : '';
    const bpText = vitals_blood_pressure ? `BP: ${vitals_blood_pressure}` : '';
    const spo2Text = vitals_spo2 ? `SpO2: ${vitals_spo2}%` : '';
    const gcsText = vitals_gcs ? `GCS: ${vitals_gcs}/15` : '';
    const vitalsSummary = [acuity, hrText, bpText, spo2Text, gcsText].filter(Boolean).join(' | ');

    db.run(
      `INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)`,
      [
        id,
        `Paramedic transmitted in-transit e-PCR Tele-Triage (${vitalsSummary}) to Emergency Department`,
        emergency.driver_name || 'Paramedic',
        now,
      ]
    );

    // Send notifications to Admin and receiving hospital ER
    const prepAlert = [
      blood_bank_required ? '🩸 Blood Bank Cross-Match Requested' : '',
      trauma_bay_required ? '🚨 Trauma Resuscitation Bay Reserved' : '',
    ]
      .filter(Boolean)
      .join(', ');

    notifyRole(db, 'admin', {
      title: `🏥 ER Pre-Arrival Alert: ${acuity}`,
      message: `Unit transporting ${emergency.patient_name} (${emergency.emergency_type}) has transmitted vital signs. ${vitalsSummary}${prepAlert ? `. ${prepAlert}` : ''}`,
      notificationType: 'ER_TRIAGE_ALERT',
      emergencyRequestId: id,
    });

    saveDb(db);

    const vitalsPayload = {
      emergencyId: id,
      patient_name: emergency.patient_name,
      vitals_heart_rate: Number(vitals_heart_rate) || null,
      vitals_blood_pressure: vitals_blood_pressure || null,
      vitals_spo2: Number(vitals_spo2) || null,
      vitals_respiratory_rate: Number(vitals_respiratory_rate) || null,
      vitals_gcs: Number(vitals_gcs) || null,
      vitals_blood_sugar: Number(vitals_blood_sugar) || null,
      triage_acuity: acuity,
      er_notified_at: now,
      er_prep_notes: er_prep_notes || null,
      blood_bank_required: !!blood_bank_required,
      trauma_bay_required: !!trauma_bay_required,
      destination_hospital: emergency.selected_hospital || emergency.destination_hospital || 'Emergency Trauma Center',
    };

    // Broadcast in real-time over Socket.IO to live hospital trauma dashboards
    broadcastPatientVitalsUpdated(id, vitalsPayload);

    return res.json({
      success: true,
      message: 'Patient in-transit vitals and hospital ER pre-notification transmitted successfully',
      vitals: vitalsPayload,
    });
  } catch (error: any) {
    console.error('Submit vitals error:', error);
    return res.status(500).json({ error: error.message || 'Failed to transmit in-transit vitals' });
  }
});

// Alias for e-PCR
apiRouter.post('/emergency/:id/epcr', async (req: Request, res: Response) => {
  return (apiRouter as any).handle(req, res);
});

// GET /api/patient/:id/emergency-card
// Public read-only endpoint for first responders & bystanders scanning patient ICE QR code
apiRouter.get('/patient/:id/emergency-card', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    const pgPool = getPostgresPool();
    if (pgPool) {
      try {
        const uRes = await pgPool.query(
          'SELECT id, name, phone FROM users WHERE id::text = $1::text AND (delete_flag IS FALSE OR delete_flag IS NULL)',
          [id]
        );
        if (uRes.rows && uRes.rows.length > 0) {
          const user = uRes.rows[0];
          return res.json({
            success: true,
            card: {
              id: user.id,
              name: user.name,
              blood_type: 'B+',
              allergies: 'None reported',
              emergency_contact: {
                name: 'Emergency Contact',
                phone: user.phone || '+91 108',
                relation: 'Next of Kin',
              },
              medical_notes: 'No chronic conditions logged',
              verified_system: 'Arogyavahini National Emergency Registry',
            },
          });
        }
        return res.status(404).json({ error: 'Patient profile not found' });
      } catch (pgErr) {
        console.warn('[Emergency Card] PostgreSQL lookup error:', pgErr);
        if (process.env.NODE_ENV === 'production') {
          return res.status(500).json({ error: 'Failed to fetch emergency card from database' });
        }
      }
    }

    const db = await getDb();
    const cleanId = String(id).replace(/'/g, "''");
    const query = db.exec(`
      SELECT 
        id, name, phone, blood_type, allergies, 
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        medical_notes, created_at
      FROM users 
      WHERE id = '${cleanId}'
    `);
    const users = formatQueryResult(query[0]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }
    const user = users[0];
    return res.json({
      success: true,
      card: {
        id: user.id,
        name: user.name,
        blood_type: user.blood_type || 'B+',
        allergies: user.allergies || 'None reported',
        emergency_contact: {
          name: user.emergency_contact_name || 'Emergency Contact',
          phone: user.emergency_contact_phone || '+91 108',
          relation: user.emergency_contact_relation || 'Next of Kin',
        },
        medical_notes: user.medical_notes || 'No chronic conditions logged',
        verified_system: 'Arogyavahini National Emergency Registry',
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch emergency card' });
  }
});

// ----------------------------------------------------
// 3. AMBULANCES MANAGEMENT
// ----------------------------------------------------

// GET /api/ambulances
apiRouter.get('/ambulances', async (req: Request, res: Response) => {
  try {
    const pgPool = getPostgresPool();
    if (pgPool) {
      try {
        const resPg = await pgPool.query('SELECT * FROM ambulances ORDER BY id ASC');
        return res.json({
          count: resPg.rows.length,
          ambulances: resPg.rows,
        });
      } catch (pgErr: any) {
        if (pgErr?.code === 'ECONNREFUSED' || pgErr?.code === 'ETIMEDOUT') {
          disablePostgresPool(pgErr);
        } else {
          console.warn('[Ambulances] PostgreSQL query fallback:', pgErr?.message || pgErr);
        }
      }
    }

    const db = await getDb();
    const query = db.exec("SELECT * FROM ambulances ORDER BY id ASC");
    const ambulances = formatQueryResult(query[0]);

    return res.json({
      count: ambulances.length,
      ambulances,
    });
  } catch (error: any) {
    console.error('Fetch ambulances error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch ambulances' });
  }
});

// GET /api/ambulances/available
apiRouter.get('/ambulances/available', async (req: Request, res: Response) => {
  try {
    const pgPool = getPostgresPool();
    if (pgPool) {
      try {
        const resPg = await pgPool.query("SELECT * FROM ambulances WHERE status = 'AVAILABLE' ORDER BY id ASC");
        return res.json({
          count: resPg.rows.length,
          ambulances: resPg.rows,
        });
      } catch (pgErr: any) {
        if (pgErr?.code === 'ECONNREFUSED' || pgErr?.code === 'ETIMEDOUT') {
          disablePostgresPool(pgErr);
        } else {
          console.warn('[Ambulances] PostgreSQL available query fallback:', pgErr?.message || pgErr);
        }
      }
    }

    const db = await getDb();
    const query = db.exec("SELECT * FROM ambulances WHERE status = 'AVAILABLE' ORDER BY id ASC");
    const available = formatQueryResult(query[0]);

    return res.json({
      count: available.length,
      ambulances: available,
    });
  } catch (error: any) {
    console.error('Fetch available ambulances error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch available ambulances' });
  }
});

// POST /api/ambulances
apiRouter.post('/ambulances', async (req: Request, res: Response) => {
  try {
    const { vehicle_number, driver_name, phone, type, base_location, status, driver_user_id } = req.body;

    if (!vehicle_number || !driver_name || !phone || !base_location) {
      return res.status(400).json({ error: 'Vehicle number, driver name, phone, and base location are required.' });
    }

    const db = await getDb();
    const ambStatus = status || 'AVAILABLE';

    db.run(
      "INSERT INTO ambulances (vehicle_number, driver_name, phone, type, base_location, status, driver_user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [vehicle_number.trim(), driver_name.trim(), phone.trim(), type || 'Basic Life Support (BLS)', base_location.trim(), ambStatus, driver_user_id || null]
    );

    saveDb(db);

    const query = db.exec(`SELECT * FROM ambulances WHERE vehicle_number = '${vehicle_number.trim()}'`);
    const ambulances = formatQueryResult(query[0]);

    return res.status(201).json({
      message: 'Ambulance registered successfully',
      ambulance: ambulances[0],
    });
  } catch (error: any) {
    console.error('Create ambulance error:', error);
    return res.status(500).json({ error: error.message || 'Failed to add ambulance' });
  }
});

// PUT /api/ambulances/:id/status
apiRouter.put('/ambulances/:id/status', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const allowed = ['AVAILABLE', 'ASSIGNED', 'BUSY', 'MAINTENANCE'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid ambulance status. Allowed: ${allowed.join(', ')}` });
    }

    const db = await getDb();
    db.run("UPDATE ambulances SET status = ? WHERE id = ?", [status, id]);
    saveDb(db);

    const query = db.exec(`SELECT * FROM ambulances WHERE id = ${id}`);
    const ambulances = formatQueryResult(query[0]);

    return res.json({
      message: `Ambulance status updated to ${status}`,
      ambulance: ambulances[0],
    });
  } catch (error: any) {
    console.error('Update ambulance status error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update ambulance status' });
  }
});

// POST /api/ambulances/:id/location
// Driver streams periodic GPS location of ambulance
apiRouter.post('/ambulances/:id/location', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { latitude, longitude, speed, heading, accuracy } = req.body;

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      return res.status(400).json({ error: 'Latitude and Longitude are required' });
    }

    const db = await getDb();
    const now = new Date().toISOString();

    const query = db.exec(`SELECT * FROM ambulances WHERE id = ${id}`);
    const ambulances = formatQueryResult(query[0]);
    if (ambulances.length === 0) {
      return res.status(404).json({ error: 'Ambulance not found' });
    }

    db.run(
      `UPDATE ambulances SET
        current_latitude = ?,
        current_longitude = ?,
        last_gps_update = ?
       WHERE id = ?`,
      [
        Number(latitude),
        Number(longitude),
        now,
        id,
      ]
    );

    saveDb(db);

    broadcastAmbulanceLocation({
      ambulanceId: id,
      driverId: ambulances[0].driver_user_id || undefined,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy !== undefined && accuracy !== null ? Number(accuracy) : undefined,
      speed: speed !== undefined && speed !== null ? Number(speed) : undefined,
      heading: heading !== undefined && heading !== null ? Number(heading) : undefined,
      source: 'device_gps',
    });

    return res.json({
      success: true,
      message: 'Ambulance GPS location updated successfully',
      ambulance_id: id,
      latitude: Number(latitude),
      longitude: Number(longitude),
      updated_at: now,
    });
  } catch (error: any) {
    console.error('Ambulance location update error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update ambulance location' });
  }
});

// ----------------------------------------------------
// 4. STATS & ANALYTICS
// ----------------------------------------------------

// GET /api/stats
apiRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    // Total emergencies
    const totalReqQuery = db.exec("SELECT COUNT(*) as total FROM emergency_requests");
    const totalEmergencies = (totalReqQuery[0]?.values[0]?.[0] as number) || 0;

    // Active emergencies (not COMPLETED or CANCELLED)
    const activeReqQuery = db.exec("SELECT COUNT(*) as active FROM emergency_requests WHERE status NOT IN ('COMPLETED', 'CANCELLED')");
    const activeEmergencies = (activeReqQuery[0]?.values[0]?.[0] as number) || 0;

    // Total Ambulances
    const totalAmbQuery = db.exec("SELECT COUNT(*) as total FROM ambulances");
    const totalAmbulances = (totalAmbQuery[0]?.values[0]?.[0] as number) || 0;

    // Available Ambulances
    const availAmbQuery = db.exec("SELECT COUNT(*) as avail FROM ambulances WHERE status = 'AVAILABLE'");
    const availableAmbulances = (availAmbQuery[0]?.values[0]?.[0] as number) || 0;

    // Assigned/Busy Ambulances
    const busyAmbQuery = db.exec("SELECT COUNT(*) as busy FROM ambulances WHERE status IN ('ASSIGNED', 'BUSY')");
    const busyAmbulances = (busyAmbQuery[0]?.values[0]?.[0] as number) || 0;

    // Completed emergencies
    const completedReqQuery = db.exec("SELECT COUNT(*) as comp FROM emergency_requests WHERE status = 'COMPLETED'");
    const completedEmergencies = (completedReqQuery[0]?.values[0]?.[0] as number) || 0;

    // Breakdown by emergency type
    const typeBreakdownQuery = db.exec("SELECT emergency_type, COUNT(*) as count FROM emergency_requests GROUP BY emergency_type");
    const typeBreakdown = formatQueryResult(typeBreakdownQuery[0]);

    // Real Average response time from completed emergencies (in minutes)
    const avgTimeQuery = db.exec("SELECT AVG((julianday(updated_at) - julianday(created_at)) * 24 * 60) as avg_min FROM emergency_requests WHERE status = 'COMPLETED' AND created_at IS NOT NULL AND updated_at IS NOT NULL");
    const rawAvg = (avgTimeQuery[0]?.values[0]?.[0] as number | null);
    const averageResponseTimeMinutes = rawAvg && !isNaN(rawAvg) && rawAvg > 0 ? parseFloat(rawAvg.toFixed(1)) : null;

    return res.json({
      totalEmergencies,
      activeEmergencies,
      totalAmbulances,
      availableAmbulances,
      busyAmbulances,
      completedEmergencies,
      averageResponseTimeMinutes,
      typeBreakdown,
    });
  } catch (error: any) {
    console.error('Fetch stats error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch statistics' });
  }
});

// ----------------------------------------------------
// 5. DEMO RESET
// ----------------------------------------------------

// POST /api/demo/reset
apiRouter.post('/demo/reset', async (req: Request, res: Response) => {
  try {
    await resetDatabase();
    return res.json({ message: 'Database reset to initial sample state with 4 ambulances and demo accounts!' });
  } catch (error: any) {
    console.error('Reset error:', error);
    return res.status(500).json({ error: error.message || 'Failed to reset database' });
  }
});

// ----------------------------------------------------
// 6. NOTIFICATIONS API
// ----------------------------------------------------

// GET /api/notifications
apiRouter.get('/notifications', async (req: Request, res: Response) => {
  try {
    const { userId, role, limit } = req.query;
    const db = await getDb();
    const maxLimit = limit ? Math.min(Number(limit), 100) : 50;

    let sql = 'SELECT * FROM notifications WHERE 1=1';
    const cleanUserId = userId ? String(userId).replace(/'/g, "''") : null;

    if (role === 'admin') {
      if (cleanUserId) {
        sql += ` AND (role = 'admin' OR user_id = '${cleanUserId}')`;
      } else {
        sql += ` AND role = 'admin'`;
      }
    } else if (role === 'driver') {
      if (cleanUserId) {
        sql += ` AND (user_id = '${cleanUserId}' OR (role = 'driver' AND user_id IS NULL))`;
      } else {
        sql += ` AND role = 'driver'`;
      }
    } else if (role === 'patient') {
      if (cleanUserId) {
        sql += ` AND (user_id = '${cleanUserId}' OR (role = 'patient' AND user_id IS NULL))`;
      } else {
        sql += ` AND role = 'patient'`;
      }
    } else if (cleanUserId) {
      sql += ` AND user_id = '${cleanUserId}'`;
    }

    sql += ` ORDER BY id DESC LIMIT ${maxLimit}`;

    const query = db.exec(sql);
    const notifications = formatQueryResult(query[0]);

    // Calculate unread count
    let unreadCount = 0;
    for (const n of notifications) {
      if (!n.is_read) unreadCount++;
    }

    return res.json({
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error: any) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:id/read
apiRouter.patch('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const db = await getDb();

    db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    saveDb(db);

    return res.json({ message: 'Notification marked as read', id });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ error: error.message || 'Failed to mark notification as read' });
  }
});

// POST /api/notifications/mark-all-read
apiRouter.post('/notifications/mark-all-read', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;
    const db = await getDb();
    const cleanUserId = userId ? String(userId).replace(/'/g, "''") : null;

    let sql = 'UPDATE notifications SET is_read = 1 WHERE 1=1';
    if (role === 'admin') {
      if (cleanUserId) {
        sql += ` AND (role = 'admin' OR user_id = '${cleanUserId}')`;
      } else {
        sql += ` AND role = 'admin'`;
      }
    } else if (role === 'driver') {
      if (cleanUserId) {
        sql += ` AND (user_id = '${cleanUserId}' OR (role = 'driver' AND user_id IS NULL))`;
      } else {
        sql += ` AND role = 'driver'`;
      }
    } else if (role === 'patient') {
      if (cleanUserId) {
        sql += ` AND (user_id = '${cleanUserId}' OR (role = 'patient' AND user_id IS NULL))`;
      } else {
        sql += ` AND role = 'patient'`;
      }
    } else if (cleanUserId) {
      sql += ` AND user_id = '${cleanUserId}'`;
    }

    db.run(sql);
    saveDb(db);

    return res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Mark all read error:', error);
    return res.status(500).json({ error: error.message || 'Failed to mark all as read' });
  }
});

// DELETE /api/notifications/:id
apiRouter.delete('/notifications/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const db = await getDb();

    db.run('DELETE FROM notifications WHERE id = ?', [id]);
    saveDb(db);

    return res.json({ message: 'Notification deleted', id });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete notification' });
  }
});

// DELETE /api/notifications/clear-all
apiRouter.delete('/notifications/clear-all', async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body || req.query;
    const db = await getDb();
    const cleanUserId = userId ? String(userId).replace(/'/g, "''") : null;

    let sql = 'DELETE FROM notifications WHERE 1=1';
    if (role === 'admin') {
      if (cleanUserId) {
        sql += ` AND (role = 'admin' OR user_id = '${cleanUserId}')`;
      } else {
        sql += ` AND role = 'admin'`;
      }
    } else if (role === 'driver') {
      if (cleanUserId) {
        sql += ` AND (user_id = '${cleanUserId}' OR (role = 'driver' AND user_id IS NULL))`;
      } else {
        sql += ` AND role = 'driver'`;
      }
    } else if (role === 'patient') {
      if (cleanUserId) {
        sql += ` AND (user_id = '${cleanUserId}' OR (role = 'patient' AND user_id IS NULL))`;
      } else {
        sql += ` AND role = 'patient'`;
      }
    } else if (cleanUserId) {
      sql += ` AND user_id = '${cleanUserId}'`;
    }

    db.run(sql);
    saveDb(db);

    return res.json({ message: 'Notifications cleared successfully' });
  } catch (error: any) {
    console.error('Clear notifications error:', error);
    return res.status(500).json({ error: error.message || 'Failed to clear notifications' });
  }
});

// Lazy initialize Gemini GenAI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// POST /api/analyze-symptoms
// Analyzes spoken or recorded symptoms to produce structured triage notes for dispatchers and paramedics
apiRouter.post('/analyze-symptoms', async (req: Request, res: Response) => {
  try {
    const { rawTranscript, language } = req.body;
    if (!rawTranscript || typeof rawTranscript !== 'string') {
      return res.status(400).json({ error: 'rawTranscript string is required' });
    }

    const text = rawTranscript.trim();
    if (!text) {
      return res.status(400).json({ error: 'rawTranscript cannot be empty' });
    }

    const ai = getGenAI();
    if (ai) {
      try {
        const prompt = `You are an emergency medical dispatch triaging system for Arogyavahini ambulance network.
Analyze the following patient/bystander spoken symptom description:
"${text}"
Language used: ${language || 'en'}

Provide a structured clinical assessment in JSON format with the following keys:
- "clinicalSummary": A concise 1-2 sentence medical summary for the ambulance dispatcher and paramedic.
- "recommendedEmergencyType": Choose exactly one of: "Cardiac", "Trauma", "Respiratory", "Critical Care", "Pregnancy", "General"
- "urgency": "CRITICAL" (immediate life threat like arrest, severe bleeding, stroke, respiratory failure), "HIGH" (severe pain, fractures, deep wounds), or "MEDIUM" (moderate illness, stable)
- "symptoms": array of 2-5 identified symptom keywords (e.g. ["Severe chest pain", "Diaphoresis", "Shortness of breath"])
- "dispatcherNotes": Clear, prioritized bullet points for the emergency dispatcher and oncoming paramedic crew (including any immediate instructions/preparations required such as "Prepare defibrillator and oxygen", "Green corridor recommended").
- "firstAidTip": Brief 1-sentence instruction for the caller while waiting for ambulance.

Return ONLY valid JSON.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json({
            success: true,
            source: 'gemini',
            ...parsed,
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini symptom analysis failed, using fallback triager:', geminiErr);
      }
    }

    // High-accuracy heuristic rule-based emergency triage fallback
    const lower = text.toLowerCase();
    let recommendedEmergencyType = 'General';
    let urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'MEDIUM';
    const symptoms: string[] = [];
    let firstAidTip = 'Keep patient calm, seated or lying down comfortably, and do not leave them unattended.';

    if (/chest|heart|angina|cardiac|left arm|jaw pain|palpitation|collapse|हार्ट|ಎದೆ ನೋವು/i.test(lower)) {
      recommendedEmergencyType = 'Cardiac';
      urgency = 'CRITICAL';
      symptoms.push('Acute Chest Pain', 'Suspected Cardiac Distress');
      firstAidTip = 'Loosen tight clothing. Keep patient seated upright. Rest quietly while ambulance arrives.';
    } else if (/breath|chok|gasp|suffocat|wheez|asthma|oxygen|lung|सांस|ಉಸಿರಾಟ/i.test(lower)) {
      recommendedEmergencyType = 'Respiratory';
      urgency = 'CRITICAL';
      symptoms.push('Severe Dyspnea', 'Respiratory Compromise');
      firstAidTip = 'Sit upright in fresh air. Help with prescribed inhaler if available.';
    } else if (/bleed|blood|accident|fracture|wound|cut|head injury|fall|trauma|खून|ರಕ್ತಸ್ರಾವ/i.test(lower)) {
      recommendedEmergencyType = 'Trauma';
      urgency = /heavy|severe|profuse|arter|head|unconscious/i.test(lower) ? 'CRITICAL' : 'HIGH';
      symptoms.push('Physical Trauma', 'Bleeding / Injury');
      firstAidTip = 'Apply firm, continuous pressure with a clean cloth over bleeding wounds. Do not move injured neck/spine.';
    } else if (/stroke|face droop|slur|speech|paraly|numb|seiz|convuls|unconscious|faint|बेहोश|ಅರೆಪ್ರಜ್ಞಾವಸ್ಥೆ/i.test(lower)) {
      recommendedEmergencyType = 'Critical Care';
      urgency = 'CRITICAL';
      symptoms.push('Neurological Deficit', 'Loss of Consciousness / Seizure');
      firstAidTip = 'Place in recovery position on side if breathing, clear airway, do not put anything in mouth.';
    } else if (/pregnant|labor|contractions|water broke|delivery|baby|गर्भवती|ಗರ್ಭಿಣಿ/i.test(lower)) {
      recommendedEmergencyType = 'Pregnancy';
      urgency = 'HIGH';
      symptoms.push('Obstetric Emergency', 'Active Labor');
      firstAidTip = 'Support mother comfortably lying on left side. Prepare clean towels.';
    } else if (/fever|vomit|burn|pain|poison|allergy|rash|बुखार|ಜ್ವರ/i.test(lower)) {
      urgency = 'HIGH';
      symptoms.push('Acute Medical Distress');
    }

    const clinicalSummary = `Patient reports: ${text.slice(0, 180)}${text.length > 180 ? '...' : ''}. Triaged as ${urgency} ${recommendedEmergencyType} emergency.`;
    const dispatcherNotes = `[VOICE REPORT] ${text}\n• Priority: ${urgency}\n• Recommended Unit: ${recommendedEmergencyType === 'Cardiac' || recommendedEmergencyType === 'Critical Care' ? 'Advanced Life Support (ALS)' : 'Basic Life Support (BLS)'}\n• Preparedness: Alert oncoming crew.`;

    return res.json({
      success: true,
      source: 'rules_engine',
      clinicalSummary,
      recommendedEmergencyType,
      urgency,
      symptoms: symptoms.length > 0 ? symptoms : ['Reported Distress'],
      dispatcherNotes,
      firstAidTip,
    });
  } catch (error: any) {
    console.error('Analyze symptoms error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze symptoms' });
  }
});

// PATCH /api/emergency/:id/notes
// Update or append voice symptom notes to an active emergency request
apiRouter.patch('/emergency/:id/notes', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { notes, updatedBy } = req.body;
    if (!notes) {
      return res.status(400).json({ error: 'Notes content is required' });
    }

    const db = await getDb();
    const now = new Date().toISOString();

    const check = db.exec(`SELECT id, patient_name, driver_id, ambulance_id, notes FROM emergency_requests WHERE id = ${id}`);
    const existing = formatQueryResult(check[0]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: 'Emergency request not found' });
    }

    const prevNotes = existing[0].notes || '';
    const mergedNotes = prevNotes ? `${prevNotes}\n\n[VOICE UPDATE ${new Date().toLocaleTimeString()}]: ${notes.trim()}` : `[VOICE REPORT]: ${notes.trim()}`;

    db.run('UPDATE emergency_requests SET notes = ?, updated_at = ? WHERE id = ?', [mergedNotes, now, id]);

    // Log in activity
    db.run(
      'INSERT INTO activity_logs (emergency_id, action, performed_by, timestamp) VALUES (?, ?, ?, ?)',
      [id, `Emergency symptoms updated via voice recording by ${updatedBy || 'Patient'}`, updatedBy || 'Patient', now]
    );

    // Notify assigned driver and admin
    if (existing[0].driver_id) {
      createNotification(db, {
        userId: Number(existing[0].driver_id),
        role: 'driver',
        title: `Symptom Update - Emergency #${id}`,
        message: `Patient provided updated symptoms via voice: ${notes.slice(0, 100)}...`,
        notificationType: 'EMERGENCY_NOTES_UPDATED',
        emergencyRequestId: id,
      });
    }

    notifyRole(db, 'admin', {
      title: `Symptom Update - SOS #${id}`,
      message: `Updated patient voice symptoms received for #${id}: ${notes.slice(0, 100)}...`,
      notificationType: 'EMERGENCY_NOTES_UPDATED',
      emergencyRequestId: id,
    });

    saveDb(db);

    return res.json({
      message: 'Emergency notes updated successfully',
      id,
      notes: mergedNotes,
    });
  } catch (error: any) {
    console.error('Update emergency notes error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update emergency notes' });
  }
});
