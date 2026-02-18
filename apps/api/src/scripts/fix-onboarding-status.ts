import * as dotenv from "dotenv";
import * as path from "path";

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

import pool from "../db";

/**
 * One-time migration: recalculate onboarding_status & onboarding_percentage
 * for all existing employees based on their actual task completion data.
 *
 * Employees with no tasks → "Not Started", 0%
 * Employees with some tasks done → "In Progress", X%
 * Employees with all tasks done → "Completed", 100%
 */
async function fixOnboardingStatus() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(`
      UPDATE employees e
      SET
        onboarding_percentage = sub.percentage,
        onboarding_status = CASE
          WHEN sub.percentage = 100 THEN 'Completed'
          WHEN sub.percentage > 0 THEN 'In Progress'
          ELSE 'Not Started'
        END
      FROM (
        SELECT
          emp.id,
          CASE
            WHEN COUNT(t.id) > 0
              THEN ROUND((COUNT(*) FILTER (WHERE t.completed = true)::numeric / COUNT(t.id)) * 100)
            ELSE 0
          END::int AS percentage
        FROM employees emp
        LEFT JOIN tasks t ON t.employee_id = emp.id
        GROUP BY emp.id
      ) sub
      WHERE e.id = sub.id
      RETURNING e.id, e.name, e.onboarding_status, e.onboarding_percentage
    `);

    console.log(`Updated ${result.rowCount} employees:`);
    for (const row of result.rows) {
      console.log(`  ${row.name}: ${row.onboarding_status} (${row.onboarding_percentage}%)`);
    }

    await client.query("COMMIT");
    console.log("Done!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

fixOnboardingStatus();
