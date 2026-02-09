import { query } from '../db';

/**
 * Execute a callback within a database transaction
 * Automatically commits on success or rolls back on error
 *
 * @example
 * await withTransaction(async () => {
 *   await query('INSERT INTO employees ...');
 *   await query('INSERT INTO users ...');
 * });
 */
export async function withTransaction<T>(
  callback: () => Promise<T>
): Promise<T> {
  try {
    await query('BEGIN');
    const result = await callback();
    await query('COMMIT');
    return result;
  } catch (error) {
    await query('ROLLBACK');
    console.error('Transaction rolled back:', error);
    throw error;
  }
}

/**
 * Execute multiple queries within a transaction
 *
 * @example
 * await executeInTransaction([
 *   { sql: 'INSERT INTO ...', params: [1, 2] },
 *   { sql: 'UPDATE ...', params: [3] },
 * ]);
 */
export async function executeInTransaction(
  queries: Array<{ sql: string; params?: any[] }>
): Promise<void> {
  await withTransaction(async () => {
    for (const { sql, params } of queries) {
      await query(sql, params);
    }
  });
}
