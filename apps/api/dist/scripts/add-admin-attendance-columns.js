"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addAdminAttendanceColumns = addAdminAttendanceColumns;
const db_1 = require("../db");
/**
 * Add modified_by column and indexes for admin attendance management
 */
function addAdminAttendanceColumns() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Adding admin attendance columns and indexes...');
            // Add modified_by column for audit trail
            yield (0, db_1.query)(`
      ALTER TABLE attendance_records
      ADD COLUMN IF NOT EXISTS modified_by UUID REFERENCES users(id)
    `);
            // Index for admin snapshot queries (today's date + status counts)
            yield (0, db_1.query)(`
      CREATE INDEX IF NOT EXISTS idx_attendance_date_status
      ON attendance_records(date DESC, status)
    `);
            // Index for admin paginated listing (date range + employee)
            yield (0, db_1.query)(`
      CREATE INDEX IF NOT EXISTS idx_attendance_date_range
      ON attendance_records(date DESC, employee_id)
    `);
            console.log('Admin attendance columns and indexes added successfully!');
        }
        catch (error) {
            console.error('Error adding admin attendance columns:', error);
            throw error;
        }
    });
}
// Run if called directly
if (require.main === module) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield addAdminAttendanceColumns();
            console.log('Migration complete!');
            process.exit(0);
        }
        catch (error) {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    }))();
}
