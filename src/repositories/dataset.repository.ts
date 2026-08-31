import { db } from '@/lib/db';
import { Dataset } from '@/types';

export const DatasetRepository = {
  /**
   * Registers a new dataset record in the database.
   */
  async create(data: {
    userId: string;
    originalFilename: string;
    r2Key: string;
    tableName: string;
    rowCount: number;
  }): Promise<Dataset> {
    const queryText = `
      INSERT INTO datasets (id, user_id, original_filename, r2_key, table_name, row_count, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, user_id AS "userId", original_filename AS "originalFilename", r2_key AS "r2Key", table_name AS "tableName", row_count AS "rowCount", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    const params = [
      data.userId,
      data.originalFilename,
      data.r2Key,
      data.tableName,
      data.rowCount,
    ];
    const res = await db.query<Dataset>(queryText, params);
    return res.rows[0];
  },

  /**
   * Finds dataset metadata by unique ID.
   */
  async findById(id: string): Promise<Dataset | null> {
    const queryText = `
      SELECT id, user_id AS "userId", original_filename AS "originalFilename", r2_key AS "r2Key", table_name AS "tableName", row_count AS "rowCount", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM datasets
      WHERE id = $1
    `;
    const res = await db.query<Dataset>(queryText, [id]);
    return res.rows[0] || null;
  },

  /**
   * Retrieves all dataset records registered by a specific user.
   */
  async findByUserId(userId: string): Promise<Dataset[]> {
    const queryText = `
      SELECT id, user_id AS "userId", original_filename AS "originalFilename", r2_key AS "r2Key", table_name AS "tableName", row_count AS "rowCount", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM datasets
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const res = await db.query<Dataset>(queryText, [userId]);
    return res.rows;
  },

  /**
   * Deletes a dataset record.
   */
  async delete(id: string): Promise<boolean> {
    const queryText = `
      DELETE FROM datasets
      WHERE id = $1
    `;
    const res = await db.query(queryText, [id]);
    return (res.rowCount ?? 0) > 0;
  },
};
