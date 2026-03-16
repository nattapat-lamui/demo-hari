import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import pool from '../db';

async function migrate() {
  console.log('Creating expense_claims table...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS expense_claims (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      amount DECIMAL(12, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'THB',
      expense_date DATE NOT NULL,
      description TEXT,
      receipt_path TEXT,
      status VARCHAR(20) DEFAULT 'Pending',
      rejection_reason TEXT,
      approver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  console.log('Creating indexes...');

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_expense_claims_employee_id ON expense_claims(employee_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_expense_claims_status ON expense_claims(status);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_expense_claims_expense_date ON expense_claims(expense_date DESC);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_expense_claims_created_at ON expense_claims(created_at DESC);
  `);

  console.log('Migration complete.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
