import { query } from '../db';

/**
 * Add modified_by column and indexes for admin attendance management
 */
export async function addAdminAttendanceColumns() {
  try {
    console.log('Adding admin attendance columns and indexes...');

    // Add modified_by column for audit trail
    await query(`
      ALTER TABLE attendance_records
      ADD COLUMN IF NOT EXISTS modified_by UUID REFERENCES users(id)
    `);

    // Index for admin snapshot queries (today's date + status counts)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_date_status
      ON attendance_records(date DESC, status)
    `);

    // Index for admin paginated listing (date range + employee)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_date_range
      ON attendance_records(date DESC, employee_id)
    `);

    console.log('Admin attendance columns and indexes added successfully!');
  } catch (error) {
    console.error('Error adding admin attendance columns:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await addAdminAttendanceColumns();
      console.log('Migration complete!');
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  })();
}
