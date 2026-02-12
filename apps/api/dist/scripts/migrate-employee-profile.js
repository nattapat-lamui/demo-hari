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
exports.migrateEmployeeProfile = migrateEmployeeProfile;
const db_1 = require("../db");
/**
 * Add employee_code and address columns to employees table.
 * All columns are nullable — fully backward-compatible, no downtime.
 */
function migrateEmployeeProfile() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Adding employee_code and address columns...');
            yield (0, db_1.query)(`
      ALTER TABLE employees
        ADD COLUMN IF NOT EXISTS employee_code VARCHAR(20) UNIQUE,
        ADD COLUMN IF NOT EXISTS address JSONB
    `);
            console.log('Columns added. Backfilling employee_code for existing rows...');
            yield (0, db_1.query)(`
      WITH numbered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
        FROM employees WHERE employee_code IS NULL
      )
      UPDATE employees SET employee_code = 'EMP-' || LPAD(numbered.rn::text, 4, '0')
      FROM numbered WHERE employees.id = numbered.id
    `);
            console.log('Employee profile migration completed successfully!');
        }
        catch (error) {
            console.error('Error migrating employee profile:', error);
            throw error;
        }
    });
}
// Run if called directly
if (require.main === module) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield migrateEmployeeProfile();
            console.log('Migration complete!');
            process.exit(0);
        }
        catch (error) {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    }))();
}
