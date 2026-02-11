import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import pool from '../db';

async function migrate() {
  console.log('Adding rejection_reason column to leave_requests...');

  await pool.query(`
    ALTER TABLE leave_requests
      ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
  `);

  console.log('Migration complete.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
