import { query } from '../db';

/**
 * Create holidays table and add business_days column to leave_requests.
 * All operations are idempotent — safe to run multiple times.
 */
export async function migrateHolidays() {
  try {
    console.log('Creating holidays table...');

    await query(`
      CREATE TABLE IF NOT EXISTS holidays (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          date DATE NOT NULL,
          name VARCHAR(255) NOT NULL,
          is_recurring BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_holidays_is_recurring ON holidays(is_recurring)`);

    console.log('Holidays table created successfully!');

    console.log('Adding business_days column to leave_requests...');

    await query(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS business_days DECIMAL(5,1)`);
    await query(`ALTER TABLE leave_request_history ADD COLUMN IF NOT EXISTS business_days DECIMAL(5,1)`);

    // Backfill existing rows with simple calendar-day count
    await query(`UPDATE leave_requests SET business_days = (end_date::date - start_date::date) + 1 WHERE business_days IS NULL`);

    console.log('business_days column added and backfilled!');
  } catch (error) {
    console.error('Error in holidays migration:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  (async () => {
    try {
      await migrateHolidays();
      console.log('Migration complete!');
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  })();
}
