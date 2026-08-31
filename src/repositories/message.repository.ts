import { db } from '@/lib/db';
import { Message } from '@/types';

export const MessageRepository = {
  /**
   * Appends a new message (user prompt or AI assistant response) to a conversation.
   */
  async create(data: {
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    sqlQuery?: string | null;
    sqlResult?: unknown | null;
    chartConfig?: unknown | null;
  }): Promise<Message> {
    const queryText = `
      INSERT INTO messages (
        id, conversation_id, role, content, sql_query, sql_result, chart_config, created_at
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
      RETURNING 
        id, 
        conversation_id AS "conversationId", 
        role, 
        content, 
        sql_query AS "sqlQuery", 
        sql_result AS "sqlResult", 
        chart_config AS "chartConfig", 
        created_at AS "createdAt"
    `;

    // The pg driver automatically serializes JS objects/arrays to JSON for jsonb parameters
    const params = [
      data.conversationId,
      data.role,
      data.content,
      data.sqlQuery || null,
      data.sqlResult || null,
      data.chartConfig || null,
    ];

    const res = await db.query<Message>(queryText, params);
    return res.rows[0];
  },

  /**
   * Retrieves the full chronological history of messages in a conversation.
   */
  async findByConversationId(conversationId: string): Promise<Message[]> {
    const queryText = `
      SELECT 
        id, 
        conversation_id AS "conversationId", 
        role, 
        content, 
        sql_query AS "sqlQuery", 
        sql_result AS "sqlResult", 
        chart_config AS "chartConfig", 
        created_at AS "createdAt"
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `;
    const res = await db.query<Message>(queryText, [conversationId]);
    return res.rows;
  },
};
