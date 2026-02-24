"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OnboardingController_1 = __importDefault(require("../controllers/OnboardingController"));
const auth_1 = require("../middlewares/auth");
const security_1 = require("../middlewares/security");
const upload_1 = require("../middlewares/upload");
const router = (0, express_1.Router)();
// All onboarding routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/onboarding/tasks - Get tasks (EMPLOYEE sees own, ADMIN sees all or filtered)
router.get("/tasks", OnboardingController_1.default.getTasks.bind(OnboardingController_1.default));
// POST /api/onboarding/tasks - Create a new task (Admin only)
router.post("/tasks", auth_1.requireAdmin, security_1.apiLimiter, OnboardingController_1.default.createTask.bind(OnboardingController_1.default));
// POST /api/onboarding/tasks/seed/:employeeId - Seed default tasks (Admin only)
// NOTE: This must be before /tasks/:id to avoid route conflict
router.post("/tasks/seed/:employeeId", auth_1.requireAdmin, security_1.apiLimiter, OnboardingController_1.default.seedTasks.bind(OnboardingController_1.default));
// PATCH /api/onboarding/tasks/:id - Update a task (Any authenticated user)
router.patch("/tasks/:id", security_1.apiLimiter, OnboardingController_1.default.updateTask.bind(OnboardingController_1.default));
// DELETE /api/onboarding/tasks/:id - Delete a task (Admin only)
router.delete("/tasks/:id", auth_1.requireAdmin, security_1.apiLimiter, OnboardingController_1.default.deleteTask.bind(OnboardingController_1.default));
// GET /api/onboarding/contacts - Get key contacts
router.get("/contacts", OnboardingController_1.default.getContacts.bind(OnboardingController_1.default));
// ==========================================
// Document Checklist Routes
// ==========================================
// GET /api/onboarding/documents - Get document checklist
router.get("/documents", OnboardingController_1.default.getDocuments.bind(OnboardingController_1.default));
// POST /api/onboarding/documents/:id/upload - Upload file for checklist item
router.post("/documents/:id/upload", security_1.apiLimiter, upload_1.onboardingDocUpload.single("file"), OnboardingController_1.default.uploadDocument.bind(OnboardingController_1.default));
// PATCH /api/onboarding/documents/:id/review - Approve/Reject (Admin only)
router.patch("/documents/:id/review", auth_1.requireAdmin, security_1.apiLimiter, OnboardingController_1.default.reviewDocument.bind(OnboardingController_1.default));
// GET /api/onboarding/documents/:id/download - Download uploaded file
router.get("/documents/:id/download", OnboardingController_1.default.downloadDocument.bind(OnboardingController_1.default));
exports.default = router;
