import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Hash a plain text password using bcrypt (standard for password_hash in PostgreSQL)
 */
export function hashPassword(password: string): string {
  if (!password) {
    throw new Error('Password cannot be empty');
  }
  return bcrypt.hashSync(password, 10);
}

/**
 * Verify a plain text password against a stored hash securely.
 * Supports bcrypt, scrypt, pbkdf2, SHA-256, and fallback plain-text comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) {
    return false;
  }

  // 1. Standard bcrypt hash
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    try {
      return bcrypt.compareSync(password, storedHash);
    } catch {
      return false;
    }
  }

  // 2. Node crypto scrypt (scrypt:salt:hash)
  if (storedHash.startsWith('scrypt:')) {
    try {
      const parts = storedHash.split(':');
      if (parts.length === 3) {
        const salt = parts[1];
        const keyHex = parts[2];
        const derivedKey = crypto.scryptSync(password, salt, 64);
        const expectedBuffer = Buffer.from(keyHex, 'hex');
        if (derivedKey.length === expectedBuffer.length) {
          return crypto.timingSafeEqual(derivedKey, expectedBuffer);
        }
      }
    } catch {
      return false;
    }
  }

  // 3. Node crypto pbkdf2 (pbkdf2:salt:iterations:hash)
  if (storedHash.startsWith('pbkdf2:')) {
    try {
      const parts = storedHash.split(':');
      if (parts.length >= 4) {
        const salt = parts[1];
        const iterations = parseInt(parts[2], 10);
        const keyHex = parts[3];
        const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');
        const expectedBuffer = Buffer.from(keyHex, 'hex');
        if (derivedKey.length === expectedBuffer.length) {
          return crypto.timingSafeEqual(derivedKey, expectedBuffer);
        }
      }
    } catch {
      return false;
    }
  }

  // 4. SHA-256 hex string (64 characters)
  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    try {
      const computed = crypto.createHash('sha256').update(password).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(storedHash));
    } catch {
      return false;
    }
  }

  // 5. Plain text comparison fallback (for demo accounts during transition)
  if (storedHash === password) {
    return true;
  }

  return false;
}

/**
 * Generate a standard UUID v4 string
 */
export function generateUuid(): string {
  return crypto.randomUUID();
}
