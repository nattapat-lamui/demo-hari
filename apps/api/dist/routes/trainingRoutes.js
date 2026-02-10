"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TrainingController_1 = __importDefault(require("../controllers/TrainingController"));
const security_1 = require("../middlewares/security");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/training/modules - Get all training modules
router.get('/modules', TrainingController_1.default.getAllModules.bind(TrainingController_1.default));
// GET /api/training/employee/:employeeId - Get training for specific employee
router.get('/employee/:employeeId', TrainingController_1.default.getEmployeeTraining.bind(TrainingController_1.default));
// POST /api/training/assign - Assign training to employee (Admin)
router.post('/assign', security_1.apiLimiter, TrainingController_1.default.assignTraining.bind(TrainingController_1.default));
// PATCH /api/training/:id - Update training status/progress
router.patch('/:id', security_1.apiLimiter, TrainingController_1.default.updateTraining.bind(TrainingController_1.default));
exports.default = router;
