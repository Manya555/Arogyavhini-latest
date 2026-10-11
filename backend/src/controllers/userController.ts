import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../models/User.js';
import { verifyPassword } from '../utils/security.js';

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const role = req.query.role as any;
    const users = await UserModel.findAll(role);
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, error: { message: 'User ID is required' } });
    }
    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }
    const { password_hash: _, ...safeUser } = user as any;
    res.json({ success: true, data: safeUser });
  } catch (err) {
    next(err);
  }
}

export async function registerUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role, phone, client_id, auth_provider, blood_type, allergies, medical_notes } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields: name, email, password, role' },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await UserModel.findByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { message: 'A user with this email address already exists' },
      });
    }

    const newUser = await UserModel.create({
      name,
      email: cleanEmail,
      password,
      role,
      phone,
      client_id,
      auth_provider,
      blood_type,
      allergies,
      medical_notes,
    });

    const { password_hash: _, ...safeUser } = newUser as any;
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

export async function loginUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required' },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await UserModel.findByEmail(cleanEmail);
    if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid email or password' },
      });
    }

    const { password_hash: _, ...safeUser } = user as any;
    res.json({
      success: true,
      message: 'Login successful',
      data: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ success: false, error: { message: 'User ID is required' } });
    }
    const updated = await UserModel.update(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }
    const { password_hash: _, ...safeUser } = updated as any;
    res.json({ success: true, data: safeUser });
  } catch (err) {
    next(err);
  }
}
