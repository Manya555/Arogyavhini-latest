import { query } from '../config/db.js';
import { hashPassword, generateUuid } from '../utils/security.js';

export type UserRole = 'patient' | 'driver' | 'admin';

export interface User {
  id: string;
  client_id?: string | null;
  name: string;
  email: string;
  password_hash?: string;
  phone?: string | null;
  role: UserRole;
  auth_provider?: string;
  delete_flag?: boolean;
  blood_type?: string | null;
  allergies?: string | null;
  medical_notes?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  client_id?: string;
  auth_provider?: string;
  blood_type?: string;
  allergies?: string;
  medical_notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
}

export class UserModel {
  /**
   * Find a user by email address from Neon PostgreSQL users table
   */
  static async findByEmail(email: string): Promise<User | null> {
    const res = await query<User>(
      `SELECT id, client_id, name, email, password_hash, phone, role, auth_provider, delete_flag, created_at, updated_at 
       FROM users 
       WHERE LOWER(email) = LOWER($1) AND (delete_flag IS FALSE OR delete_flag IS NULL) 
       LIMIT 1`,
      [email]
    );
    if (!res.rows[0]) return null;
    return {
      ...res.rows[0],
      blood_type: 'B+',
      allergies: 'None reported',
      emergency_contact_name: 'Emergency Dispatch',
      emergency_contact_phone: '+91 108',
      emergency_contact_relation: 'Next of Kin',
      medical_notes: '',
    };
  }

  /**
   * Find a user by their primary key UUID / ID
   */
  static async findById(id: string | number): Promise<User | null> {
    const res = await query<User>(
      `SELECT id, client_id, name, email, phone, role, auth_provider, delete_flag, created_at, updated_at
       FROM users 
       WHERE id::text = $1::text 
       LIMIT 1`,
      [String(id)]
    );
    if (!res.rows[0]) return null;
    return {
      ...res.rows[0],
      blood_type: 'B+',
      allergies: 'None reported',
      emergency_contact_name: 'Emergency Dispatch',
      emergency_contact_phone: '+91 108',
      emergency_contact_relation: 'Next of Kin',
      medical_notes: '',
    };
  }

  /**
   * List users, optionally filtered by role
   */
  static async findAll(role?: UserRole): Promise<User[]> {
    if (role) {
      const res = await query<User>(
        `SELECT id, client_id, name, email, phone, role, auth_provider, delete_flag, created_at, updated_at
         FROM users 
         WHERE role = $1 AND (delete_flag IS FALSE OR delete_flag IS NULL) 
         ORDER BY created_at ASC`,
        [role]
      );
      return res.rows;
    }
    const res = await query<User>(
      `SELECT id, client_id, name, email, phone, role, auth_provider, delete_flag, created_at, updated_at
       FROM users 
       WHERE (delete_flag IS FALSE OR delete_flag IS NULL) 
       ORDER BY created_at ASC`
    );
    return res.rows;
  }

  /**
   * Create a new user record matching Neon PostgreSQL schema
   * Uses password_hash for secure password storage
   */
  static async create(input: CreateUserInput): Promise<User> {
    const hashedPassword = hashPassword(input.password);
    let clientId = input.client_id ? input.client_id.trim() : null;

    if (!clientId) {
      try {
        const existingClientRes = await query<{ client_id: string }>(
          `SELECT client_id FROM users 
           WHERE client_id IS NOT NULL 
           AND (delete_flag IS FALSE OR delete_flag IS NULL) 
           ORDER BY created_at ASC 
           LIMIT 1`
        );
        if (existingClientRes.rows && existingClientRes.rows.length > 0 && existingClientRes.rows[0].client_id) {
          clientId = existingClientRes.rows[0].client_id;
        }
      } catch (err) {
        console.warn('[User] Error querying existing client_id from users:', err);
      }
    }

    if (!clientId) {
      clientId = generateUuid();
    }

    const res = await query<User>(
      `INSERT INTO users (
        name, email, password_hash, phone, role, auth_provider, delete_flag, client_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING id, client_id, name, email, phone, role, auth_provider, delete_flag, created_at, updated_at`,
      [
        input.name.trim(),
        input.email.trim().toLowerCase(),
        hashedPassword,
        input.phone ? input.phone.trim() : null,
        input.role,
        input.auth_provider || 'local',
        false,
        clientId,
      ]
    );
    const row = res.rows[0];
    return {
      ...row,
      blood_type: input.blood_type || 'B+',
      allergies: input.allergies || 'None reported',
      medical_notes: input.medical_notes || '',
      emergency_contact_name: input.emergency_contact_name || '',
      emergency_contact_phone: input.emergency_contact_phone || '',
      emergency_contact_relation: input.emergency_contact_relation || 'Next of Kin',
    };
  }

  /**
   * Update a user's profile info
   */
  static async update(id: string | number, fields: Partial<CreateUserInput>): Promise<User | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (fields.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(fields.name.trim());
    }
    if (fields.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(fields.phone ? fields.phone.trim() : null);
    }
    if (fields.role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(fields.role);
    }
    if (fields.password !== undefined && fields.password) {
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(hashPassword(fields.password));
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(String(id));

    const res = await query<User>(
      `UPDATE users SET ${updates.join(', ')} WHERE id::text = $${paramIndex}::text
       RETURNING id, client_id, name, email, phone, role, auth_provider, delete_flag, created_at, updated_at`,
      values
    );

    if (!res.rows[0]) return null;
    return {
      ...res.rows[0],
      blood_type: fields.blood_type || 'B+',
      allergies: fields.allergies || 'None reported',
      medical_notes: fields.medical_notes || '',
      emergency_contact_name: fields.emergency_contact_name || '',
      emergency_contact_phone: fields.emergency_contact_phone || '',
      emergency_contact_relation: fields.emergency_contact_relation || 'Next of Kin',
    };
  }
}
