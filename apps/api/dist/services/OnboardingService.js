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
exports.OnboardingService = void 0;
const db_1 = require("../db");
const NotificationService_1 = __importDefault(require("./NotificationService"));
// ==========================================
// Row → Response Mappers
// ==========================================
function mapTaskRow(row) {
    return {
        id: row.id,
        title: row.title,
        description: row.description || "",
        stage: row.stage || "Pre-boarding",
        assignee: row.assignee || "HR",
        dueDate: row.due_date || "",
        completed: row.completed,
        priority: row.priority || "Medium",
        link: row.link || null,
        employeeId: row.employee_id || null,
    };
}
function mapContactRow(row) {
    return {
        id: row.id,
        name: row.name || "",
        role: row.role || "",
        relation: row.relation || "",
        email: row.email || "",
        avatar: row.avatar || "",
    };
}
function mapDocumentRow(row) {
    return {
        id: row.id,
        employeeId: row.employee_id,
        name: row.name,
        description: row.description || "",
        status: row.status,
        filePath: row.file_path,
        fileType: row.file_type,
        fileSize: row.file_size,
        uploadedAt: row.uploaded_at,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        reviewNote: row.review_note,
        createdAt: row.created_at,
    };
}
const DEFAULT_TASKS = [
    // Pre-boarding (4)
    {
        title: "Complete Personal Information Form",
        description: "Fill out all personal details, emergency contacts, and tax information",
        stage: "Pre-boarding",
        assignee: "Employee",
        priority: "High",
        dueDaysOffset: -3,
    },
    {
        title: "Sign Offer Letter & Employment Agreement",
        description: "Review and digitally sign the official offer letter and employment contract",
        stage: "Pre-boarding",
        assignee: "Employee",
        priority: "High",
        dueDaysOffset: -5,
    },
    {
        title: "Set Up IT Accounts & Credentials",
        description: "Create email, Slack, and system access credentials for the new employee",
        stage: "Pre-boarding",
        assignee: "IT",
        priority: "High",
        dueDaysOffset: -1,
    },
    {
        title: "Prepare Workspace & Equipment",
        description: "Set up desk, chair, monitor, laptop, and any required peripherals",
        stage: "Pre-boarding",
        assignee: "IT",
        priority: "Medium",
        dueDaysOffset: -1,
    },
    // Week 1 (5)
    {
        title: "Attend Company Orientation",
        description: "Join the welcome session covering company history, mission, values, and culture",
        stage: "Week 1",
        assignee: "Employee",
        priority: "High",
        dueDaysOffset: 0,
    },
    {
        title: "Meet Your Team & Key Stakeholders",
        description: "Introductory meetings with team members, cross-functional partners, and leadership",
        stage: "Week 1",
        assignee: "Employee",
        priority: "Medium",
        dueDaysOffset: 2,
    },
    {
        title: "Review Company Policies & Handbook",
        description: "Read through the employee handbook, code of conduct, and HR policies",
        stage: "Week 1",
        assignee: "Employee",
        priority: "Medium",
        dueDaysOffset: 3,
        link: "/documents",
    },
    {
        title: "Set Up Development Environment",
        description: "Install required tools, clone repositories, and configure local development setup",
        stage: "Week 1",
        assignee: "Employee",
        priority: "High",
        dueDaysOffset: 1,
    },
    {
        title: "Schedule 1:1 with Manager",
        description: "Book an introductory one-on-one meeting to discuss role expectations and goals",
        stage: "Week 1",
        assignee: "HR",
        priority: "Medium",
        dueDaysOffset: 4,
    },
    // Month 1 (3)
    {
        title: "Complete Compliance Training",
        description: "Finish all mandatory compliance, safety, and security training modules",
        stage: "Month 1",
        assignee: "Employee",
        priority: "High",
        dueDaysOffset: 14,
    },
    {
        title: "Enroll in Benefits Program",
        description: "Select health insurance, retirement plan, and other employee benefits",
        stage: "Month 1",
        assignee: "Employee",
        priority: "Medium",
        dueDaysOffset: 21,
    },
    {
        title: "30-Day HR Check-in",
        description: "Scheduled check-in with HR to review onboarding progress and address any concerns",
        stage: "Month 1",
        assignee: "HR",
        priority: "Low",
        dueDaysOffset: 30,
    },
];
const DEFAULT_DOCUMENTS = [
    {
        name: "ID / Passport Copy",
        description: "Upload a clear copy of your government-issued ID or passport",
    },
    {
        name: "Signed Employment Contract",
        description: "Upload the signed employment contract",
    },
    {
        name: "Tax Forms (W-4)",
        description: "Upload completed tax withholding forms",
    },
    {
        name: "Bank Account Details",
        description: "Upload bank account information for payroll setup",
    },
    {
        name: "Emergency Contact Form",
        description: "Upload completed emergency contact information form",
    },
    {
        name: "Educational Certificates",
        description: "Upload copies of relevant degrees or certifications",
    },
];
// ==========================================
// Service Class
// ==========================================
class OnboardingService {
    // Get tasks for a specific employee
    getTasksByEmployeeId(employeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)(`SELECT * FROM tasks WHERE employee_id = $1 ORDER BY due_date ASC`, [employeeId]);
            return result.rows.map(mapTaskRow);
        });
    }
    // Get all tasks (admin view)
    getAllTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)(`SELECT * FROM tasks ORDER BY due_date ASC`);
            return result.rows.map(mapTaskRow);
        });
    }
    // Create a single task
    createTask(dto) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)(`INSERT INTO tasks (title, description, stage, assignee, due_date, priority, link, employee_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`, [
                dto.title,
                dto.description || null,
                dto.stage,
                dto.assignee,
                dto.dueDate,
                dto.priority,
                dto.link || null,
                dto.employeeId,
            ]);
            return mapTaskRow(result.rows[0]);
        });
    }
    // Update a task (dynamic fields)
    updateTask(id, dto) {
        return __awaiter(this, void 0, void 0, function* () {
            const updates = [];
            const values = [];
            let paramCount = 1;
            if (dto.title !== undefined) {
                updates.push(`title = $${paramCount++}`);
                values.push(dto.title);
            }
            if (dto.description !== undefined) {
                updates.push(`description = $${paramCount++}`);
                values.push(dto.description);
            }
            if (dto.stage !== undefined) {
                updates.push(`stage = $${paramCount++}`);
                values.push(dto.stage);
            }
            if (dto.assignee !== undefined) {
                updates.push(`assignee = $${paramCount++}`);
                values.push(dto.assignee);
            }
            if (dto.dueDate !== undefined) {
                updates.push(`due_date = $${paramCount++}`);
                values.push(dto.dueDate);
            }
            if (dto.completed !== undefined) {
                updates.push(`completed = $${paramCount++}`);
                values.push(dto.completed);
            }
            if (dto.priority !== undefined) {
                updates.push(`priority = $${paramCount++}`);
                values.push(dto.priority);
            }
            if (dto.link !== undefined) {
                updates.push(`link = $${paramCount++}`);
                values.push(dto.link);
            }
            if (updates.length === 0) {
                return null;
            }
            values.push(id);
            const result = yield (0, db_1.query)(`UPDATE tasks SET ${updates.join(", ")} WHERE id = $${paramCount} RETURNING *`, values);
            if (result.rows.length === 0) {
                return null;
            }
            // Recalculate onboarding progress when completed status changes
            if (dto.completed !== undefined && result.rows[0].employee_id) {
                yield this.recalculateProgress(result.rows[0].employee_id);
            }
            return mapTaskRow(result.rows[0]);
        });
    }
    // Recalculate and sync onboarding_percentage + onboarding_status on employees table
    recalculateProgress(employeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const countResult = yield (0, db_1.query)(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE completed = true) as done FROM tasks WHERE employee_id = $1`, [employeeId]);
            const total = parseInt(countResult.rows[0].total, 10);
            const done = parseInt(countResult.rows[0].done, 10);
            const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
            const status = percentage === 100 ? "Completed" : percentage > 0 ? "In Progress" : "Not Started";
            yield (0, db_1.query)(`UPDATE employees SET onboarding_percentage = $1, onboarding_status = $2 WHERE id = $3`, [percentage, status, employeeId]);
        });
    }
    // Delete a task
    deleteTask(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            // Get employee_id before deleting so we can recalculate progress
            const taskResult = yield (0, db_1.query)(`SELECT employee_id FROM tasks WHERE id = $1`, [id]);
            const employeeId = (_a = taskResult.rows[0]) === null || _a === void 0 ? void 0 : _a.employee_id;
            const result = yield (0, db_1.query)(`DELETE FROM tasks WHERE id = $1 RETURNING id`, [id]);
            if (((_b = result.rowCount) !== null && _b !== void 0 ? _b : 0) > 0 && employeeId) {
                yield this.recalculateProgress(employeeId);
            }
            return ((_c = result.rowCount) !== null && _c !== void 0 ? _c : 0) > 0;
        });
    }
    // Seed default tasks for an employee (idempotent — skips if already seeded)
    seedDefaultTasks(employeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Idempotency guard: skip if tasks OR documents already exist
            const existing = yield (0, db_1.query)(`SELECT
        (SELECT COUNT(*) FROM tasks WHERE employee_id = $1)::int AS task_count,
        (SELECT COUNT(*) FROM onboarding_documents WHERE employee_id = $1)::int AS doc_count`, [employeeId]);
            if (existing.rows[0].task_count > 0 || existing.rows[0].doc_count > 0) {
                // Already seeded — return existing tasks
                const existingTasks = yield (0, db_1.query)(`SELECT * FROM tasks WHERE employee_id = $1 ORDER BY due_date ASC`, [employeeId]);
                return existingTasks.rows.map(mapTaskRow);
            }
            // Get employee's join date
            const empResult = yield (0, db_1.query)(`SELECT join_date, name, user_id FROM employees WHERE id = $1`, [employeeId]);
            if (empResult.rows.length === 0) {
                throw new Error("Employee not found");
            }
            const joinDate = empResult.rows[0].join_date
                ? new Date(empResult.rows[0].join_date)
                : new Date();
            const employeeName = empResult.rows[0].name;
            const employeeUserId = empResult.rows[0].user_id;
            // Build bulk INSERT
            const valuesClauses = [];
            const params = [];
            let paramIndex = 1;
            for (const task of DEFAULT_TASKS) {
                const dueDate = new Date(joinDate);
                dueDate.setDate(dueDate.getDate() + task.dueDaysOffset);
                const dueDateStr = dueDate.toISOString().split("T")[0];
                valuesClauses.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`);
                params.push(task.title, task.description, task.stage, task.assignee, dueDateStr, task.priority, task.link || null, employeeId);
                paramIndex += 8;
            }
            const result = yield (0, db_1.query)(`INSERT INTO tasks (title, description, stage, assignee, due_date, priority, link, employee_id)
       VALUES ${valuesClauses.join(", ")}
       RETURNING *`, params);
            // Seed default documents
            const docValuesClauses = [];
            const docParams = [];
            let docParamIndex = 1;
            for (const doc of DEFAULT_DOCUMENTS) {
                docValuesClauses.push(`($${docParamIndex}, $${docParamIndex + 1}, $${docParamIndex + 2})`);
                docParams.push(employeeId, doc.name, doc.description);
                docParamIndex += 3;
            }
            yield (0, db_1.query)(`INSERT INTO onboarding_documents (employee_id, name, description)
       VALUES ${docValuesClauses.join(", ")}`, docParams);
            // Recalculate onboarding progress from the newly seeded tasks
            yield this.recalculateProgress(employeeId);
            // Send notification to the employee (if they have a user account)
            if (employeeUserId) {
                try {
                    yield NotificationService_1.default.create({
                        user_id: employeeUserId,
                        title: "Onboarding Tasks Assigned",
                        message: `Welcome ${employeeName}! Your onboarding checklist with ${DEFAULT_TASKS.length} tasks and ${DEFAULT_DOCUMENTS.length} documents has been created.`,
                        type: "info",
                        link: "/onboarding",
                    });
                }
                catch (_a) {
                    // Non-critical — don't fail the seed
                }
            }
            return result.rows.map(mapTaskRow);
        });
    }
    // Check if employee already has tasks
    hasExistingTasks(employeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)(`SELECT COUNT(*) as count FROM tasks WHERE employee_id = $1`, [employeeId]);
            return parseInt(result.rows[0].count, 10) > 0;
        });
    }
    // Get all contacts
    getAllContacts() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)(`SELECT * FROM contacts ORDER BY name ASC`);
            return result.rows.map(mapContactRow);
        });
    }
    // ==========================================
    // Document Checklist Methods
    // ==========================================
    getDocumentsByEmployeeId(employeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)(`SELECT * FROM onboarding_documents WHERE employee_id = $1 ORDER BY created_at ASC`, [employeeId]);
            return result.rows.map(mapDocumentRow);
        });
    }
    getAllDocuments() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)(`SELECT * FROM onboarding_documents ORDER BY created_at ASC`);
            return result.rows.map(mapDocumentRow);
        });
    }
    uploadDocument(id, filePath, fileType, fileSize) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)(`UPDATE onboarding_documents
       SET status = 'Uploaded', file_path = $1, file_type = $2, file_size = $3, uploaded_at = NOW()
       WHERE id = $4
       RETURNING *`, [filePath, fileType, fileSize, id]);
            if (result.rows.length === 0)
                return null;
            return mapDocumentRow(result.rows[0]);
        });
    }
    reviewDocument(id, userId, status, note) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)(`UPDATE onboarding_documents
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_note = $3
       WHERE id = $4
       RETURNING *`, [status, userId, note || null, id]);
            if (result.rows.length === 0)
                return null;
            return mapDocumentRow(result.rows[0]);
        });
    }
    getDocumentFilePath(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)(`SELECT file_path, name, employee_id FROM onboarding_documents WHERE id = $1`, [id]);
            if (result.rows.length === 0)
                return null;
            return { filePath: result.rows[0].file_path, name: result.rows[0].name, employeeId: result.rows[0].employee_id };
        });
    }
}
exports.OnboardingService = OnboardingService;
exports.default = new OnboardingService();
