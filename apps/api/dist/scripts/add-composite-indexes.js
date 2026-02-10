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
exports.addCompositeIndexes = addCompositeIndexes;
exports.analyzeDatabase = analyzeDatabase;
const db_1 = require("../db");
/**
 * Add composite indexes for common query patterns
 * These indexes optimize queries that filter on multiple columns
 */
function addCompositeIndexes() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            console.log('Adding composite indexes for query optimization...');
            // Composite index for leave requests filtering (employee + status + date range queries)
            yield (0, db_1.query)(`
            CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_status
            ON leave_requests(employee_id, status, start_date DESC)
        `);
            // Composite index for leave requests with type filter
            yield (0, db_1.query)(`
            CREATE INDEX IF NOT EXISTS idx_leave_requests_status_type
            ON leave_requests(status, leave_type, created_at DESC)
        `);
            // Composite index for documents filtering (common search pattern)
            yield (0, db_1.query)(`
            CREATE INDEX IF NOT EXISTS idx_documents_status_category
            ON documents(status, category, uploaded_at DESC)
        `);
            // Composite index for documents with employee filter
            yield (0, db_1.query)(`
            CREATE INDEX IF NOT EXISTS idx_documents_employee_status
            ON documents(employee_id, status, uploaded_at DESC)
        `);
            // Composite index for employees directory searches
            yield (0, db_1.query)(`
            CREATE INDEX IF NOT EXISTS idx_employees_status_department
            ON employees(status, department, name)
        `);
            // Composite index for tasks/onboarding queries
            yield (0, db_1.query)(`
            CREATE INDEX IF NOT EXISTS idx_tasks_employee_completed
            ON tasks(employee_id, completed, due_date)
        `);
            // Composite index for notifications filtering
            yield (0, db_1.query)(`
            CREATE INDEX IF NOT EXISTS idx_notifications_user_read
            ON notifications(user_id, read, created_at DESC)
        `);
            // Composite index for employee training
            yield (0, db_1.query)(`
            CREATE INDEX IF NOT EXISTS idx_employee_training_employee_status
            ON employee_training(employee_id, status, completed_date DESC)
        `);
            // Composite index for attendance queries
            yield (0, db_1.query)(`
            CREATE INDEX IF NOT EXISTS idx_attendance_employee_date
            ON attendance_records(employee_id, date DESC, status)
        `);
            // Composite index for payroll queries
            yield (0, db_1.query)(`
            CREATE INDEX IF NOT EXISTS idx_payroll_employee_period
            ON payroll_records(employee_id, pay_period_start DESC, status)
        `);
            // Add index for document name search (text search optimization)
            yield (0, db_1.query)(`
            CREATE INDEX IF NOT EXISTS idx_documents_name_trgm
            ON documents USING gin(name gin_trgm_ops)
        `);
            // Add index for employee name search (text search optimization)
            yield (0, db_1.query)(`
            CREATE INDEX IF NOT EXISTS idx_employees_name_trgm
            ON employees USING gin(name gin_trgm_ops)
        `);
            console.log('✅ Composite indexes added successfully');
        }
        catch (error) {
            // Ignore if gin_trgm_ops doesn't exist (pg_trgm extension not installed)
            if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('gin_trgm_ops')) {
                console.log('⚠️  Note: pg_trgm extension not available for text search indexes');
                console.log('   To enable: CREATE EXTENSION IF NOT EXISTS pg_trgm;');
            }
            else {
                console.error('Error adding composite indexes:', error);
                throw error;
            }
        }
    });
}
/**
 * Add database statistics for query planner optimization
 */
function analyzeDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Analyzing database tables for query optimization...');
            const tables = [
                'users',
                'employees',
                'leave_requests',
                'documents',
                'tasks',
                'notifications',
                'attendance_records',
                'payroll_records',
                'employee_training',
            ];
            for (const table of tables) {
                yield (0, db_1.query)(`ANALYZE ${table}`);
            }
            console.log('✅ Database analysis complete');
        }
        catch (error) {
            console.error('Error analyzing database:', error);
        }
    });
}
// Run if called directly
if (require.main === module) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield addCompositeIndexes();
            yield analyzeDatabase();
            console.log('✅ Database optimization complete!');
            process.exit(0);
        }
        catch (error) {
            console.error('❌ Database optimization failed:', error);
            process.exit(1);
        }
    }))();
}
