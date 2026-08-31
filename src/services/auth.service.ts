import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-that-is-at-least-32-characters-long'
);

export const AuthService = {
  /**
   * Hashes a plain-text password using bcrypt.
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  },

  /**
   * Compares a plain-text password with a bcrypt hash.
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generates a signed JWT for a user session, expiring in 24 hours.
   */
  async generateToken(payload: { userId: string; email: string }): Promise<string> {
    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);
  },

  /**
   * Verifies a JWT token and returns its decoded payload, or null if invalid.
   */
  async verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      return payload as { userId: string; email: string };
    } catch (error) {
      console.warn('[Auth Service] Token verification failed:', error);
      return null;
    }
  },
};
