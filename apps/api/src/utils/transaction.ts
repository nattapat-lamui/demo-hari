import pool, { query } from '../db';
import { PoolClient } from 'pg';

/**
 * A query function bound to a specific client (for use inside transactions).
 */
export type TxQuery = (text: string, params?: any[]) => Promise<import('pg').QueryResult>;

/**
 * Execute a callback within a database transaction using a dedicated client.
 * The callback receives a `txQuery` function that must be used for all queries
 * within the transaction to guarantee they run on the same connection.
 *
 * @example
 * await withTransaction(async (txQuery) => {
 *   await txQuery('INSERT INTO employees ...', [value1]);
 *   await txQuery('INSERT INTO users ...', [value2]);
 * });
 */
export async function withTransaction<T>(
  callback: (txQuery: TxQuery) => Promise<T>
): Promise<T> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');
    const txQuery: TxQuery = (text, params) => client.query(text, params);
    const result = await callback(txQuery);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction rolled back:', error);
    throw error;
  } finally {
    client.release();
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
  await withTransaction(async (txQuery) => {
    for (const { sql, params } of queries) {
      await txQuery(sql, params);
    }
  });
}
