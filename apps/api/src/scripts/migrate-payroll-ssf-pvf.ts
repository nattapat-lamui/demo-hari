import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import pool from '../db';

async function migrate() {
  console.log('Adding SSF and PVF columns to payroll_records...');

  await pool.query(`
    ALTER TABLE payroll_records
      ADD COLUMN IF NOT EXISTS ssf_employee DECIMAL(12,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS ssf_employer DECIMAL(12,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS pvf_employee DECIMAL(12,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS pvf_employer DECIMAL(12,2) DEFAULT 0;
  `);

  console.log('SSF and PVF columns added successfully.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
