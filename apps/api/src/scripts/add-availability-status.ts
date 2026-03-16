import * as dotenv from "dotenv";
import * as path from "path";

const envPath = path.resolve(__dirname, "../../.env");
console.log("Loading .env from:", envPath);
dotenv.config({ path: envPath });

import pool from "../db";

const addAvailabilityStatus = async () => {
  try {
    console.log("Connecting to database...");
    console.log("Adding availability_status and status_message columns to employees...");

    await pool.query(`
      ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'online',
        ADD COLUMN IF NOT EXISTS status_message VARCHAR(100) DEFAULT '';
    `);

    console.log("availability_status and status_message columns added successfully!");
  } catch (err) {
    console.error("Error adding availability status columns:", err);
    throw err;
  } finally {
    await pool.end();
  }
};

addAvailabilityStatus().catch((err) => {
  console.error(err);
  process.exit(1);
});
