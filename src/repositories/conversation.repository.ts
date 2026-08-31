import { db } from '@/lib/db';
import { Conversation } from '@/types';

export const ConversationRepository = {
  /**
   * Initializes a new conversation session.
   */
  async create(userId: string, title: string): Promise<Conversation> {
    const queryText = `
      INSERT INTO conversations (id, user_id, title, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
      RETURNING id, user_id AS "userId", title, created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const res = await db.query<Conversation>(queryText, [userId, title]);
    return res.rows[0];
  },

  /**
   * Retrieves conversation metadata by unique ID.
   */
  async findById(id: string): Promise<Conversation | null> {
    const queryText = `
      SELECT id, user_id AS "userId", title, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM conversations
      WHERE id = $1
    `;
    const res = await db.query<Conversation>(queryText, [id]);
    return res.rows[0] || null;
  },

  /**
   * Retrieves all conversations for a specific user, sorted by most recently active.
   */
  async findByUserId(userId: string): Promise<Conversation[]> {
    const queryText = `
      SELECT id, user_id AS "userId", title, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM conversations
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `;
    const res = await db.query<Conversation>(queryText, [userId]);
    return res.rows;
  },

  /**
   * Updates the title of an existing conversation.
   */
  async updateTitle(id: string, title: string): Promise<Conversation | null> {
    const queryText = `
      UPDATE conversations
      SET title = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING id, user_id AS "userId", title, created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const res = await db.query<Conversation>(queryText, [id, title]);
    return res.rows[0] || null;
  },

  /**
   * Deletes a conversation session (cascading deletes of messages should be handled by DB foreign keys or manually).
   */
  async delete(id: string): Promise<boolean> {
    const queryText = `
      DELETE FROM conversations
      WHERE id = $1
    `;
    const res = await db.query(queryText, [id]);
    return (res.rowCount ?? 0) > 0;
  },
};
