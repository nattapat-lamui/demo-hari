import { query } from '../db';

/**
 * Add half-day leave columns to leave_requests and leave_request_history.
 * All operations are idempotent — safe to run multiple times.
 */
export async function migrateHalfDayLeave() {
  try {
    console.log('Adding half-day leave columns...');

    await query(`
      ALTER TABLE leave_requests
        ADD COLUMN IF NOT EXISTS is_half_day BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS half_day_period VARCHAR(10)
    `);

    await query(`
      ALTER TABLE leave_request_history
        ADD COLUMN IF NOT EXISTS is_half_day BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS half_day_period VARCHAR(10)
    `);

    console.log('Half-day leave columns added successfully!');
  } catch (error) {
    console.error('Error adding half-day leave columns:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await migrateHalfDayLeave();
      console.log('Migration complete!');
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  })();
}
