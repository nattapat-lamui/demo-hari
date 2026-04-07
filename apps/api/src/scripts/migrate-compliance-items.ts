import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import pool from '../db';

async function migrate() {
  console.log('Migrating compliance tables...');

  // Check if compliance_items table exists and what schema it has
  const tableCheck = await pool.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'compliance_items'
    ORDER BY ordinal_position
  `);

  const columns = tableCheck.rows.map(r => r.column_name);
  const hasUuidId = tableCheck.rows.find(r => r.column_name === 'id')?.data_type === 'uuid';
  const hasCategory = columns.includes('category');

  if (tableCheck.rows.length === 0) {
    // Table doesn't exist - create fresh
    console.log('compliance_items table not found, creating...');
    await createComplianceItemsTable();
  } else if (!hasUuidId || !hasCategory) {
    // Old schema (SERIAL id, only title+status) - needs replacement
    // Check if there's real data we should preserve
    const countResult = await pool.query('SELECT COUNT(*) AS cnt FROM compliance_items');
    const rowCount = parseInt(countResult.rows[0].cnt, 10);

    if (rowCount > 0) {
      console.warn(`⚠️  WARNING: compliance_items has ${rowCount} existing rows with old schema.`);
      console.warn('   Backing up to compliance_items_backup before migration...');
      await pool.query('ALTER TABLE IF EXISTS compliance_items RENAME TO compliance_items_backup');
      console.log('   Old table renamed to compliance_items_backup.');
    } else {
      console.log('Old compliance_items table is empty, replacing with new schema...');
      await pool.query('DROP TABLE IF EXISTS compliance_items CASCADE');
    }

    await createComplianceItemsTable();
  } else {
    console.log('compliance_items table already has new schema, skipping recreation.');
    // Just ensure all columns exist (additive migration)
    await pool.query('ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS description TEXT');
    await pool.query('ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT \'Medium\'');
    await pool.query('ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) NOT NULL DEFAULT \'Low\'');
    await pool.query('ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL');
    await pool.query('ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS assigned_department VARCHAR(100)');
    await pool.query('ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS due_date DATE');
    await pool.query('ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL');
    await pool.query('ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    await pool.query('ALTER TABLE compliance_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
  }

  // Create related tables (IF NOT EXISTS - safe to run multiple times)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS compliance_status_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      compliance_item_id UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
      old_status VARCHAR(50),
      new_status VARCHAR(50) NOT NULL,
      changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
      reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('compliance_status_history table ensured.');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS compliance_evidence (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      compliance_item_id UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
      file_path TEXT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_size BIGINT,
      uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('compliance_evidence table ensured.');

  // Indexes (IF NOT EXISTS - safe)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_compliance_items_status ON compliance_items(status);
    CREATE INDEX IF NOT EXISTS idx_compliance_items_category ON compliance_items(category);
    CREATE INDEX IF NOT EXISTS idx_compliance_items_assigned_to ON compliance_items(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_compliance_items_due_date ON compliance_items(due_date);
    CREATE INDEX IF NOT EXISTS idx_compliance_status_history_item ON compliance_status_history(compliance_item_id);
    CREATE INDEX IF NOT EXISTS idx_compliance_evidence_item ON compliance_evidence(compliance_item_id);
  `);

  console.log('Compliance migration complete.');
  await pool.end();
}

async function createComplianceItemsTable() {
  await pool.query(`
    CREATE TABLE compliance_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(50) NOT NULL DEFAULT 'Custom',
      status VARCHAR(50) NOT NULL DEFAULT 'Draft',
      priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
      risk_level VARCHAR(20) NOT NULL DEFAULT 'Low',
      assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
      assigned_department VARCHAR(100),
      due_date DATE,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log('compliance_items table created with new schema.');
}

migrate().catch((err) => {
  console.error('Compliance migration failed:', err);
  process.exit(1);
});
