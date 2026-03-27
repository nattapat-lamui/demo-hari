import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import pool from '../db';

async function migrate() {
  console.log('Adding daily_rate column to employees...');

  await pool.query(`
    ALTER TABLE employees
      ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(12,2);
  `);

  console.log('daily_rate column added successfully.');

  // Insert default intern daily rate config if not exists
  await pool.query(`
    INSERT INTO system_configs (category, key, value, data_type, description)
    VALUES ('payroll', 'default_intern_daily_rate', '350', 'number', 'Default daily rate for interns (THB)')
    ON CONFLICT (category, key) DO NOTHING;
  `);

  console.log('Default intern daily rate config added.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
