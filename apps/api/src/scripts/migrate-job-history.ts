import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import pool from '../db';

async function migrate() {
  console.log('Migrating job_history table...');

  // Add timestamp and audit columns
  await pool.query(`
    ALTER TABLE job_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE job_history ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE job_history ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
  `);

  console.log('job_history columns added.');

  // Add date validation constraint (safe: only adds if not exists)
  try {
    await pool.query(`
      ALTER TABLE job_history ADD CONSTRAINT chk_job_history_dates
        CHECK (end_date IS NULL OR end_date >= start_date);
    `);
    console.log('Date validation constraint added.');
  } catch (err: any) {
    if (err.code === '42710') {
      console.log('Date validation constraint already exists, skipping.');
    } else {
      throw err;
    }
  }

  console.log('Job history migration complete.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Job history migration failed:', err);
  process.exit(1);
});
