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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = __importDefault(require("http"));
const db_1 = require("./db");
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const security_1 = require("./middlewares/security");
const auditLog_1 = require("./middlewares/auditLog");
const auth_1 = require("./middlewares/auth");
const swagger_1 = require("./config/swagger");
const socket_1 = require("./socket");
// Import Clean Architecture routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const employeeRoutes_1 = __importDefault(require("./routes/employeeRoutes"));
const documentRoutes_1 = __importDefault(require("./routes/documentRoutes"));
const leaveRequestRoutes_1 = __importDefault(require("./routes/leaveRequestRoutes"));
const systemConfigRoutes_1 = __importDefault(require("./routes/systemConfigRoutes"));
const attendanceRoutes_1 = __importDefault(require("./routes/attendanceRoutes"));
const payrollRoutes_1 = __importDefault(require("./routes/payrollRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
const orgChartRoutes_1 = __importDefault(require("./routes/orgChartRoutes"));
const notesRoutes_1 = __importDefault(require("./routes/notesRoutes"));
const onboardingRoutes_1 = __importDefault(require("./routes/onboardingRoutes"));
const trainingRoutes_1 = __importDefault(require("./routes/trainingRoutes"));
const jobHistoryRoutes_1 = __importDefault(require("./routes/jobHistoryRoutes"));
const performanceRoutes_1 = __importDefault(require("./routes/performanceRoutes"));
const eventsRoutes_1 = __importDefault(require("./routes/eventsRoutes"));
const announcementsRoutes_1 = __importDefault(require("./routes/announcementsRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const adminAttendanceRoutes_1 = __importDefault(require("./routes/adminAttendanceRoutes"));
const init_db_1 = require("./scripts/init-db");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Trust proxy for Render.com and other reverse proxies
// Required for express-rate-limit to work correctly behind proxies
app.set('trust proxy', 1);
// Security: Helmet - Security headers
app.use(security_1.helmetConfig);
// Performance: Gzip/Brotli compression for responses
app.use((0, compression_1.default)({
    level: 6,
    threshold: 1024, // Only compress responses > 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression_1.default.filter(req, res);
    }
}));
// Security: CORS configuration - support multiple origins
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://hari-hr-system.vercel.app",
    "https://hari-hr-system-api.vercel.app",
    process.env.FRONTEND_URL,
].filter(Boolean);
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
            callback(null, true);
            return;
        }
        // Check if origin is allowed
        if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
            callback(null, true);
        }
        else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(null, true); // Allow anyway for now, log for debugging
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
// Security: Rate limiting for all requests
app.use(security_1.generalLimiter);
// Body parser
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Audit logging middleware
app.use(auditLog_1.auditLogMiddleware);
// Serve uploaded files statically
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
app.get("/ping", (_req, res) => res.send("pong"));
// API Documentation
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "HARI HR API Documentation",
}));
// Serve OpenAPI spec as JSON
app.get("/api-docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swagger_1.swaggerSpec);
});
// ==========================================
// HEALTH CHECK (for cron jobs / keep-alive)
// ==========================================
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// ==========================================
// CLEAN ARCHITECTURE ROUTES
// ==========================================
// Auth routes (login is public, change-password is protected)
app.use("/api/auth", authRoutes_1.default);
// Protected routes (all require authentication)
app.use("/api/employees", employeeRoutes_1.default);
app.use("/api/documents", documentRoutes_1.default);
app.use("/api/leave-requests", leaveRequestRoutes_1.default);
app.use("/api/configs", systemConfigRoutes_1.default);
app.use("/api/attendance", attendanceRoutes_1.default);
app.use("/api/payroll", payrollRoutes_1.default);
app.use("/api/notifications", notificationRoutes_1.default);
app.use("/api/dashboard", dashboardRoutes_1.default);
app.use("/api/org-chart", orgChartRoutes_1.default);
app.use("/api/notes", notesRoutes_1.default);
app.use("/api/onboarding", onboardingRoutes_1.default);
app.use("/api/training", trainingRoutes_1.default);
app.use("/api/job-history", jobHistoryRoutes_1.default);
app.use("/api/performance", performanceRoutes_1.default);
app.use("/api/events", eventsRoutes_1.default);
app.use("/api/announcements", announcementsRoutes_1.default);
app.use("/api/analytics", analyticsRoutes_1.default);
app.use("/api/admin/attendance", adminAttendanceRoutes_1.default);
// Backward compatibility for leave balances endpoint
// Old: GET /api/leave-balances/:employeeId
// New: GET /api/leave-requests/balances/:employeeId
app.get("/api/leave-balances/:employeeId", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    req.url = `/balances/${req.params.employeeId}`;
    (0, leaveRequestRoutes_1.default)(req, res, () => { });
}));
// ==========================================
// BACKWARD COMPATIBILITY & LEGACY ENDPOINTS
// ==========================================
// Backward compatibility: old training endpoints
// Redirect to new /api/training routes
app.get("/api/training-modules", (req, res) => res.redirect(301, "/api/training/modules"));
app.get("/api/employee-training/:employeeId", (req, res) => res.redirect(301, `/api/training/employee/${req.params.employeeId}`));
app.post("/api/employee-training", (req, res, next) => {
    req.url = "/api/training/assign";
    (0, trainingRoutes_1.default)(req, res, next);
});
app.patch("/api/employee-training/:id", (req, res, next) => {
    req.url = `/${req.params.id}`;
    (0, trainingRoutes_1.default)(req, res, next);
});
// Backward compatibility: old events endpoints
// Redirect to new /api/events routes
app.get("/api/upcoming-events", (req, res) => res.redirect(301, "/api/events/upcoming"));
app.post("/api/upcoming-events", (req, res, next) => {
    req.url = "/upcoming";
    (0, eventsRoutes_1.default)(req, res, next);
});
app.delete("/api/upcoming-events/:id", (req, res, next) => {
    req.url = `/upcoming/${req.params.id}`;
    (0, eventsRoutes_1.default)(req, res, next);
});
// Backward compatibility: old analytics endpoints
// Redirect to new /api/analytics routes
app.get("/api/headcount-stats", (req, res) => res.redirect(301, "/api/analytics/headcount-stats"));
app.get("/api/audit-logs", (req, res) => res.redirect(301, "/api/analytics/audit-logs"));
app.get("/api/compliance", (req, res) => res.redirect(301, "/api/analytics/compliance"));
app.get("/api/sentiment", (req, res) => res.redirect(301, "/api/analytics/sentiment"));
// ==========================================
// SYSTEM MANAGEMENT ENDPOINTS
// ==========================================
// POST /api/system/setup (Initial setup - only works when database is empty)
// This allows setting up the database without authentication for first-time deployment
app.post("/api/system/setup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if any users exist
        const usersResult = yield (0, db_1.query)("SELECT COUNT(*) as count FROM users");
        const userCount = parseInt(usersResult.rows[0].count, 10);
        if (userCount > 0) {
            return res.status(403).json({
                error: "Setup already completed",
                message: "Database already has users. Use /api/system/seed with admin authentication to reseed."
            });
        }
        // Database is empty, safe to seed
        yield (0, init_db_1.runMigration)();
        res.json({
            message: "Database setup completed successfully",
            hint: "You can now login with admin@company.com / Admin123!@#"
        });
    }
    catch (err) {
        const error = err;
        console.error("Setup error:", error);
        // If tables don't exist, try running migration anyway
        if (error.code === '42P01') { // Table doesn't exist error
            try {
                yield (0, init_db_1.runMigration)();
                res.json({
                    message: "Database setup completed successfully",
                    hint: "You can now login with admin@company.com / Admin123!@#"
                });
            }
            catch (migrationErr) {
                console.error("Migration error:", migrationErr);
                res.status(500).json({ error: "Failed to setup database" });
            }
        }
        else {
            res.status(500).json({ error: "Failed to setup database" });
        }
    }
}));
// POST /api/system/seed (Manually trigger database seed - ADMIN ONLY)
// Security: This endpoint requires authentication and HR_ADMIN role
app.post("/api/system/seed", auth_1.authenticateToken, auth_1.requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, init_db_1.runMigration)();
        res.json({ message: "Database seeded successfully" });
    }
    catch (err) {
        console.error("Seeding error:", err);
        res.status(500).json({ error: "Failed to seed database" });
    }
}));
// Lightweight migrations (safe to run multiple times)
const runLightMigrations = () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Admin attendance: add modified_by column + indexes
        yield (0, db_1.query)(`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS modified_by UUID REFERENCES users(id)`);
        yield (0, db_1.query)(`CREATE INDEX IF NOT EXISTS idx_attendance_date_status ON attendance_records(date DESC, status)`);
        yield (0, db_1.query)(`CREATE INDEX IF NOT EXISTS idx_attendance_date_range ON attendance_records(date DESC, employee_id)`);
        // Migrate attendance status VARCHAR → ENUM (only when column is still VARCHAR)
        const colType = yield (0, db_1.query)(`SELECT data_type FROM information_schema.columns WHERE table_name = 'attendance_records' AND column_name = 'status'`);
        if (((_a = colType.rows[0]) === null || _a === void 0 ? void 0 : _a.data_type) === 'character varying') {
            yield (0, db_1.query)(`UPDATE attendance_records SET status = 'On-time' WHERE status IN ('Present', 'Remote')`);
            yield (0, db_1.query)(`UPDATE attendance_records SET status = 'On-time' WHERE status = 'Half-day' AND clock_in IS NOT NULL AND (clock_in AT TIME ZONE 'Asia/Bangkok')::time <= '09:00:00'::time`);
            yield (0, db_1.query)(`UPDATE attendance_records SET status = 'Late' WHERE status = 'Half-day' AND clock_in IS NOT NULL AND (clock_in AT TIME ZONE 'Asia/Bangkok')::time > '09:00:00'::time`);
            yield (0, db_1.query)(`UPDATE attendance_records SET status = 'Absent' WHERE status = 'Half-day'`);
            yield (0, db_1.query)(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status_enum') THEN CREATE TYPE attendance_status_enum AS ENUM ('On-time', 'Late', 'Absent'); END IF; END $$`);
            yield (0, db_1.query)(`ALTER TABLE attendance_records ALTER COLUMN status DROP DEFAULT`);
            yield (0, db_1.query)(`ALTER TABLE attendance_records ALTER COLUMN status TYPE attendance_status_enum USING status::attendance_status_enum`);
            yield (0, db_1.query)(`ALTER TABLE attendance_records ALTER COLUMN status SET DEFAULT 'On-time'::attendance_status_enum`);
        }
        // Add On-leave to attendance status enum (safe to run multiple times)
        yield (0, db_1.query)(`ALTER TYPE attendance_status_enum ADD VALUE IF NOT EXISTS 'On-leave'`);
        // Fix: Absent records with clock_in were incorrectly migrated — recalculate
        yield (0, db_1.query)(`UPDATE attendance_records SET status = 'On-time' WHERE status = 'Absent' AND clock_in IS NOT NULL AND (clock_in AT TIME ZONE 'Asia/Bangkok')::time <= '09:00:00'::time`);
        yield (0, db_1.query)(`UPDATE attendance_records SET status = 'Late' WHERE status = 'Absent' AND clock_in IS NOT NULL`);
        // One-time fix: Employee clock-in/out on UTC servers stored Bangkok time as UTC (+7h off).
        // Uses tz_fixed column as idempotency guard so it only runs once per record.
        yield (0, db_1.query)(`ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS tz_fixed BOOLEAN DEFAULT FALSE`);
        const serverOffsetMin = new Date().getTimezoneOffset(); // 0 for UTC, -420 for Bangkok
        if (serverOffsetMin === 0) {
            // Case 1: Both clock_in & clock_out from old code (clock_out >= clock_in) → fix both
            yield (0, db_1.query)(`
        UPDATE attendance_records
        SET clock_in  = clock_in  - interval '7 hours',
            clock_out = clock_out - interval '7 hours',
            tz_fixed  = TRUE
        WHERE tz_fixed = FALSE AND modified_by IS NULL
          AND clock_in IS NOT NULL AND clock_out IS NOT NULL AND clock_out >= clock_in
      `);
            // Case 2: Only clock_in, no clock_out yet → fix clock_in only
            yield (0, db_1.query)(`
        UPDATE attendance_records
        SET clock_in = clock_in - interval '7 hours',
            tz_fixed = TRUE
        WHERE tz_fixed = FALSE AND modified_by IS NULL
          AND clock_in IS NOT NULL AND clock_out IS NULL
      `);
            // Case 3: clock_in from old code, clock_out from new fixed code (clock_out < clock_in)
            // Only fix clock_in, recalculate total_hours
            yield (0, db_1.query)(`
        UPDATE attendance_records
        SET clock_in    = clock_in - interval '7 hours',
            total_hours = ROUND(EXTRACT(EPOCH FROM (clock_out - (clock_in - interval '7 hours')))::numeric / 3600, 2),
            tz_fixed    = TRUE
        WHERE tz_fixed = FALSE AND modified_by IS NULL
          AND clock_in IS NOT NULL AND clock_out IS NOT NULL AND clock_out < clock_in
      `);
        }
        // Mark remaining records as processed (admin-created or non-UTC server records)
        yield (0, db_1.query)(`UPDATE attendance_records SET tz_fixed = TRUE WHERE tz_fixed = FALSE`);
        yield (0, db_1.query)(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL`);
        yield (0, db_1.query)(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
        // Create upcoming_events table if it doesn't exist
        yield (0, db_1.query)(`
      CREATE TABLE IF NOT EXISTS upcoming_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        type VARCHAR(50) DEFAULT 'Meeting',
        avatar TEXT,
        color VARCHAR(20),
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
        yield (0, db_1.query)(`CREATE INDEX IF NOT EXISTS idx_upcoming_events_date ON upcoming_events(date)`);
        yield (0, db_1.query)(`CREATE INDEX IF NOT EXISTS idx_upcoming_events_type ON upcoming_events(type)`);
        // Create onboarding_documents table if it doesn't exist
        yield (0, db_1.query)(`
      CREATE TABLE IF NOT EXISTS onboarding_documents (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        file_path TEXT,
        file_type VARCHAR(20),
        file_size VARCHAR(20),
        uploaded_at TIMESTAMP WITH TIME ZONE,
        reviewed_by UUID REFERENCES users(id),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        review_note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
        yield (0, db_1.query)(`CREATE INDEX IF NOT EXISTS idx_onboarding_docs_employee ON onboarding_documents(employee_id)`);
        yield (0, db_1.query)(`CREATE INDEX IF NOT EXISTS idx_onboarding_docs_status ON onboarding_documents(status)`);
        // Fix: change onboarding_status default from 'Completed' to 'Not Started'
        yield (0, db_1.query)(`ALTER TABLE employees ALTER COLUMN onboarding_status SET DEFAULT 'Not Started'`);
        // Recalculate onboarding progress for all employees based on actual task data
        yield (0, db_1.query)(`
      UPDATE employees e SET
        onboarding_percentage = COALESCE(sub.pct, 0),
        onboarding_status = CASE
          WHEN sub.pct IS NULL THEN 'Not Started'
          WHEN sub.pct = 100 THEN 'Completed'
          WHEN sub.pct > 0 THEN 'In Progress'
          ELSE 'Not Started'
        END
      FROM (
        SELECT employee_id,
          ROUND(COUNT(*) FILTER (WHERE completed = true) * 100.0 / NULLIF(COUNT(*), 0))::int AS pct
        FROM tasks
        GROUP BY employee_id
      ) sub
      WHERE e.id = sub.employee_id
    `);
        // Employees with no tasks at all → 'Not Started'
        yield (0, db_1.query)(`
      UPDATE employees SET onboarding_status = 'Not Started', onboarding_percentage = 0
      WHERE id NOT IN (SELECT DISTINCT employee_id FROM tasks WHERE employee_id IS NOT NULL)
        AND onboarding_status = 'Completed'
    `);
        // Leave requests: add handover + medical certificate columns
        yield (0, db_1.query)(`
      ALTER TABLE leave_requests
        ADD COLUMN IF NOT EXISTS handover_employee_id UUID REFERENCES employees(id),
        ADD COLUMN IF NOT EXISTS handover_notes TEXT,
        ADD COLUMN IF NOT EXISTS medical_certificate_path VARCHAR(500)
    `);
    }
    catch (err) {
        // Table may not exist yet — ignore
    }
});
// Create HTTP server for Socket.io
const httpServer = http_1.default.createServer(app);
// Initialize Socket.io
(0, socket_1.initializeSocket)(httpServer);
// Only start the server when running locally (not in Vercel serverless)
if (process.env.VERCEL !== '1') {
    runLightMigrations().then(() => {
        httpServer.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
            console.log(`Socket.io enabled for real-time updates`);
        });
    });
}
// Export for Vercel serverless
exports.default = app;
