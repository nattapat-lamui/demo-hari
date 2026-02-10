import { query } from '../db';

/**
 * Add composite indexes for common query patterns
 * These indexes optimize queries that filter on multiple columns
 */
export async function addCompositeIndexes() {
    try {
        console.log('Adding composite indexes for query optimization...');

        // Composite index for leave requests filtering (employee + status + date range queries)
        await query(`
            CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_status
            ON leave_requests(employee_id, status, start_date DESC)
        `);

        // Composite index for leave requests with type filter
        await query(`
            CREATE INDEX IF NOT EXISTS idx_leave_requests_status_type
            ON leave_requests(status, leave_type, created_at DESC)
        `);

        // Composite index for documents filtering (common search pattern)
        await query(`
            CREATE INDEX IF NOT EXISTS idx_documents_status_category
            ON documents(status, category, uploaded_at DESC)
        `);

        // Composite index for documents with employee filter
        await query(`
            CREATE INDEX IF NOT EXISTS idx_documents_employee_status
            ON documents(employee_id, status, uploaded_at DESC)
        `);

        // Composite index for employees directory searches
        await query(`
            CREATE INDEX IF NOT EXISTS idx_employees_status_department
            ON employees(status, department, name)
        `);

        // Composite index for tasks/onboarding queries
        await query(`
            CREATE INDEX IF NOT EXISTS idx_tasks_employee_completed
            ON tasks(employee_id, completed, due_date)
        `);

        // Composite index for notifications filtering
        await query(`
            CREATE INDEX IF NOT EXISTS idx_notifications_user_read
            ON notifications(user_id, read, created_at DESC)
        `);

        // Composite index for employee training
        await query(`
            CREATE INDEX IF NOT EXISTS idx_employee_training_employee_status
            ON employee_training(employee_id, status, completed_date DESC)
        `);

        // Composite index for attendance queries
        await query(`
            CREATE INDEX IF NOT EXISTS idx_attendance_employee_date
            ON attendance_records(employee_id, date DESC, status)
        `);

        // Composite index for payroll queries
        await query(`
            CREATE INDEX IF NOT EXISTS idx_payroll_employee_period
            ON payroll_records(employee_id, pay_period_start DESC, status)
        `);

        // Add index for document name search (text search optimization)
        await query(`
            CREATE INDEX IF NOT EXISTS idx_documents_name_trgm
            ON documents USING gin(name gin_trgm_ops)
        `);

        // Add index for employee name search (text search optimization)
        await query(`
            CREATE INDEX IF NOT EXISTS idx_employees_name_trgm
            ON employees USING gin(name gin_trgm_ops)
        `);

        console.log('✅ Composite indexes added successfully');
    } catch (error) {
        // Ignore if gin_trgm_ops doesn't exist (pg_trgm extension not installed)
        if ((error as any).message?.includes('gin_trgm_ops')) {
            console.log('⚠️  Note: pg_trgm extension not available for text search indexes');
            console.log('   To enable: CREATE EXTENSION IF NOT EXISTS pg_trgm;');
        } else {
            console.error('Error adding composite indexes:', error);
            throw error;
        }
    }
}

/**
 * Add database statistics for query planner optimization
 */
export async function analyzeDatabase() {
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
            await query(`ANALYZE ${table}`);
        }

        console.log('✅ Database analysis complete');
    } catch (error) {
        console.error('Error analyzing database:', error);
    }
}

// Run if called directly
if (require.main === module) {
    (async () => {
        try {
            await addCompositeIndexes();
            await analyzeDatabase();
            console.log('✅ Database optimization complete!');
            process.exit(0);
        } catch (error) {
            console.error('❌ Database optimization failed:', error);
            process.exit(1);
        }
    })();
}
