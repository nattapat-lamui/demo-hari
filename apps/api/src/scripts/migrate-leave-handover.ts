import { query } from '../db';

/**
 * Add handover and medical certificate columns to leave_requests table.
 * All columns are nullable — fully backward-compatible, no downtime.
 */
export async function migrateLeaveHandover() {
  try {
    console.log('Adding leave handover columns...');

    await query(`
      ALTER TABLE leave_requests
        ADD COLUMN IF NOT EXISTS handover_employee_id UUID REFERENCES employees(id),
        ADD COLUMN IF NOT EXISTS handover_notes TEXT,
        ADD COLUMN IF NOT EXISTS medical_certificate_path VARCHAR(500)
    `);

    console.log('Leave handover columns added successfully!');
  } catch (error) {
    console.error('Error adding leave handover columns:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await migrateLeaveHandover();
      console.log('Migration complete!');
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  })();
}
