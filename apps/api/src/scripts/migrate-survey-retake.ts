import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import pool from '../db';

async function migrate() {
  console.log('Adding allow_retake column to surveys...');

  await pool.query(`
    ALTER TABLE surveys
      ADD COLUMN IF NOT EXISTS allow_retake BOOLEAN DEFAULT FALSE;
  `);

  console.log('allow_retake column added successfully.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
