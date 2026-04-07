import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import pool from '../db';

async function migrate() {
  console.log('Migrating training tables...');

  // Add columns to training_modules
  await pool.query(`
    ALTER TABLE training_modules ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE training_modules ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id) ON DELETE SET NULL;
    ALTER TABLE training_modules ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    ALTER TABLE training_modules ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE training_modules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  `);

  console.log('training_modules columns added.');

  // Add columns to employee_training
  await pool.query(`
    ALTER TABLE employee_training ADD COLUMN IF NOT EXISTS due_date DATE;
    ALTER TABLE employee_training ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES employees(id) ON DELETE SET NULL;
    ALTER TABLE employee_training ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE employee_training ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  `);

  console.log('employee_training columns added.');

  // Add indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_employee_training_due_date ON employee_training(due_date);
    CREATE INDEX IF NOT EXISTS idx_employee_training_module_id ON employee_training(module_id);
    CREATE INDEX IF NOT EXISTS idx_training_modules_is_active ON training_modules(is_active);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_training_unique_assignment
      ON employee_training(employee_id, module_id) WHERE module_id IS NOT NULL;
  `);

  console.log('Training migration complete.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Training migration failed:', err);
  process.exit(1);
});
