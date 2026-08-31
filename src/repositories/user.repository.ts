import { db } from '@/lib/db';
import { User } from '@/types';

export const UserRepository = {
  /**
   * Creates a new user record.
   * Uses gen_random_uuid() for ID generation.
   */
  async create(email: string, passwordHash: string): Promise<User> {
    const queryText = `
      INSERT INTO users (id, email, password_hash, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
      RETURNING id, email, password_hash AS "passwordHash", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const res = await db.query<User>(queryText, [email.toLowerCase().trim(), passwordHash]);
    return res.rows[0];
  },

  /**
   * Finds a user by their email address.
   */
  async findByEmail(email: string): Promise<User | null> {
    const queryText = `
      SELECT id, email, password_hash AS "passwordHash", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM users
      WHERE email = $1
    `;
    const res = await db.query<User>(queryText, [email.toLowerCase().trim()]);
    return res.rows[0] || null;
  },

  /**
   * Finds a user by their unique database ID.
   */
  async findById(id: string): Promise<User | null> {
    const queryText = `
      SELECT id, email, password_hash AS "passwordHash", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM users
      WHERE id = $1
    `;
    const res = await db.query<User>(queryText, [id]);
    return res.rows[0] || null;
  },
};
