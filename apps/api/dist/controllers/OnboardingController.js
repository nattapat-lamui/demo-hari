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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingController = void 0;
const OnboardingService_1 = __importDefault(require("../services/OnboardingService"));
const Onboarding_1 = require("../models/Onboarding");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class OnboardingController {
    // GET /api/onboarding/tasks?employeeId=xxx
    getTasks(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                const { employeeId } = req.query;
                // EMPLOYEE role → only their own tasks (auto-seed if first visit)
                if (user.role === "EMPLOYEE") {
                    if (!user.employeeId) {
                        res.status(403).json({ error: "No employee profile linked" });
                        return;
                    }
                    let tasks = yield OnboardingService_1.default.getTasksByEmployeeId(user.employeeId);
                    if (tasks.length === 0) {
                        try {
                            tasks = yield OnboardingService_1.default.seedDefaultTasks(user.employeeId);
                        }
                        catch (_a) {
                            // Seed failed (e.g. employee not found) — return empty
                        }
                    }
                    res.json(tasks);
                    return;
                }
                // HR_ADMIN → filter by employeeId or get all
                if (employeeId) {
                    const tasks = yield OnboardingService_1.default.getTasksByEmployeeId(employeeId);
                    res.json(tasks);
                }
                else {
                    const tasks = yield OnboardingService_1.default.getAllTasks();
                    res.json(tasks);
                }
            }
            catch (error) {
                console.error("Error fetching onboarding tasks:", error);
                res.status(500).json({ error: "Failed to fetch tasks" });
            }
        });
    }
    // POST /api/onboarding/tasks
    createTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { title, description, stage, assignee, dueDate, priority, link, employeeId } = req.body;
                // Validate required fields
                if (!title || !stage || !assignee || !dueDate || !priority || !employeeId) {
                    res.status(400).json({
                        error: "Missing required fields: title, stage, assignee, dueDate, priority, employeeId",
                    });
                    return;
                }
                // Validate enums
                if (!Onboarding_1.VALID_STAGES.includes(stage)) {
                    res.status(400).json({ error: `Invalid stage. Must be one of: ${Onboarding_1.VALID_STAGES.join(", ")}` });
                    return;
                }
                if (!Onboarding_1.VALID_PRIORITIES.includes(priority)) {
                    res.status(400).json({ error: `Invalid priority. Must be one of: ${Onboarding_1.VALID_PRIORITIES.join(", ")}` });
                    return;
                }
                const task = yield OnboardingService_1.default.createTask({
                    title,
                    description,
                    stage,
                    assignee,
                    dueDate,
                    priority,
                    link,
                    employeeId,
                });
                res.status(201).json(task);
            }
            catch (error) {
                console.error("Error creating onboarding task:", error);
                res.status(500).json({ error: "Failed to create task" });
            }
        });
    }
    // PATCH /api/onboarding/tasks/:id
    updateTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const _a = req.body, { stage, priority } = _a, rest = __rest(_a, ["stage", "priority"]);
                // Validate enums if provided
                if (stage && !Onboarding_1.VALID_STAGES.includes(stage)) {
                    res.status(400).json({ error: `Invalid stage. Must be one of: ${Onboarding_1.VALID_STAGES.join(", ")}` });
                    return;
                }
                if (priority && !Onboarding_1.VALID_PRIORITIES.includes(priority)) {
                    res.status(400).json({ error: `Invalid priority. Must be one of: ${Onboarding_1.VALID_PRIORITIES.join(", ")}` });
                    return;
                }
                const task = yield OnboardingService_1.default.updateTask(id, Object.assign({ stage, priority }, rest));
                if (!task) {
                    res.status(404).json({ error: "Task not found" });
                    return;
                }
                res.json(task);
            }
            catch (error) {
                console.error("Error updating onboarding task:", error);
                res.status(500).json({ error: "Failed to update task" });
            }
        });
    }
    // DELETE /api/onboarding/tasks/:id
    deleteTask(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const success = yield OnboardingService_1.default.deleteTask(id);
                if (!success) {
                    res.status(404).json({ error: "Task not found" });
                    return;
                }
                res.json({ message: "Task deleted successfully" });
            }
            catch (error) {
                console.error("Error deleting onboarding task:", error);
                res.status(500).json({ error: "Failed to delete task" });
            }
        });
    }
    // POST /api/onboarding/tasks/seed/:employeeId
    seedTasks(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { employeeId } = req.params;
                // Check if tasks already exist for this employee
                const hasExisting = yield OnboardingService_1.default.hasExistingTasks(employeeId);
                if (hasExisting) {
                    res.status(409).json({ error: "Tasks already exist for this employee" });
                    return;
                }
                const tasks = yield OnboardingService_1.default.seedDefaultTasks(employeeId);
                res.status(201).json(tasks);
            }
            catch (error) {
                if (error.message === "Employee not found") {
                    res.status(404).json({ error: "Employee not found" });
                    return;
                }
                console.error("Error seeding onboarding tasks:", error);
                res.status(500).json({ error: "Failed to seed tasks" });
            }
        });
    }
    // GET /api/onboarding/contacts
    getContacts(_req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const contacts = yield OnboardingService_1.default.getAllContacts();
                res.json(contacts);
            }
            catch (error) {
                console.error("Error fetching contacts:", error);
                res.status(500).json({ error: "Failed to fetch contacts" });
            }
        });
    }
    // ==========================================
    // Document Checklist Endpoints
    // ==========================================
    // GET /api/onboarding/documents?employeeId=xxx
    getDocuments(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = req.user;
                const { employeeId } = req.query;
                if (user.role === "EMPLOYEE") {
                    if (!user.employeeId) {
                        res.status(403).json({ error: "No employee profile linked" });
                        return;
                    }
                    const docs = yield OnboardingService_1.default.getDocumentsByEmployeeId(user.employeeId);
                    res.json(docs);
                    return;
                }
                if (employeeId) {
                    const docs = yield OnboardingService_1.default.getDocumentsByEmployeeId(employeeId);
                    res.json(docs);
                }
                else {
                    const docs = yield OnboardingService_1.default.getAllDocuments();
                    res.json(docs);
                }
            }
            catch (error) {
                console.error("Error fetching onboarding documents:", error);
                res.status(500).json({ error: "Failed to fetch documents" });
            }
        });
    }
    // POST /api/onboarding/documents/:id/upload
    uploadDocument(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const file = req.file;
                if (!file) {
                    res.status(400).json({ error: "No file uploaded" });
                    return;
                }
                const ext = path_1.default.extname(file.originalname).replace(".", "").toUpperCase();
                const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + " MB";
                const doc = yield OnboardingService_1.default.uploadDocument(id, file.path, ext, sizeMB);
                if (!doc) {
                    res.status(404).json({ error: "Document checklist item not found" });
                    return;
                }
                res.json(doc);
            }
            catch (error) {
                console.error("Error uploading onboarding document:", error);
                res.status(500).json({ error: "Failed to upload document" });
            }
        });
    }
    // PATCH /api/onboarding/documents/:id/review
    reviewDocument(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { status, note } = req.body;
                const user = req.user;
                if (!status || !["Approved", "Rejected"].includes(status)) {
                    res.status(400).json({ error: "Status must be 'Approved' or 'Rejected'" });
                    return;
                }
                const doc = yield OnboardingService_1.default.reviewDocument(id, user.userId, status, note);
                if (!doc) {
                    res.status(404).json({ error: "Document not found" });
                    return;
                }
                res.json(doc);
            }
            catch (error) {
                console.error("Error reviewing onboarding document:", error);
                res.status(500).json({ error: "Failed to review document" });
            }
        });
    }
    // GET /api/onboarding/documents/:id/download
    downloadDocument(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const result = yield OnboardingService_1.default.getDocumentFilePath(id);
                if (!result || !result.filePath) {
                    res.status(404).json({ error: "File not found" });
                    return;
                }
                if (!fs_1.default.existsSync(result.filePath)) {
                    res.status(404).json({ error: "File not found on disk" });
                    return;
                }
                const ext = path_1.default.extname(result.filePath);
                const filename = result.name.replace(/[^a-zA-Z0-9-_ ]/g, "") + ext;
                res.download(result.filePath, filename);
            }
            catch (error) {
                console.error("Error downloading onboarding document:", error);
                res.status(500).json({ error: "Failed to download document" });
            }
        });
    }
}
exports.OnboardingController = OnboardingController;
exports.default = new OnboardingController();
