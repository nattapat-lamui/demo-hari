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
exports.migrateLeaveHandover = migrateLeaveHandover;
const db_1 = require("../db");
/**
 * Add handover and medical certificate columns to leave_requests table.
 * All columns are nullable — fully backward-compatible, no downtime.
 */
function migrateLeaveHandover() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Adding leave handover columns...');
            yield (0, db_1.query)(`
      ALTER TABLE leave_requests
        ADD COLUMN IF NOT EXISTS handover_employee_id UUID REFERENCES employees(id),
        ADD COLUMN IF NOT EXISTS handover_notes TEXT,
        ADD COLUMN IF NOT EXISTS medical_certificate_path VARCHAR(500)
    `);
            console.log('Leave handover columns added successfully!');
        }
        catch (error) {
            console.error('Error adding leave handover columns:', error);
            throw error;
        }
    });
}
// Run if called directly
if (require.main === module) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield migrateLeaveHandover();
            console.log('Migration complete!');
            process.exit(0);
        }
        catch (error) {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    }))();
}
