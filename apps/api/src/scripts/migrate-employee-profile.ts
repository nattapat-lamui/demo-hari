import { query } from '../db';

/**
 * Add employee_code and address columns to employees table.
 * All columns are nullable — fully backward-compatible, no downtime.
 */
export async function migrateEmployeeProfile() {
  try {
    console.log('Adding employee_code and address columns...');

    await query(`
      ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS employee_code VARCHAR(20) UNIQUE,
        ADD COLUMN IF NOT EXISTS address JSONB
    `);

    console.log('Columns added. Backfilling employee_code for existing rows...');

    await query(`
      WITH numbered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
        FROM employees WHERE employee_code IS NULL
      )
      UPDATE employees SET employee_code = 'EMP-' || LPAD(numbered.rn::text, 4, '0')
      FROM numbered WHERE employees.id = numbered.id
    `);

    console.log('Employee profile migration completed successfully!');
  } catch (error) {
    console.error('Error migrating employee profile:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await migrateEmployeeProfile();
      console.log('Migration complete!');
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  })();
}
