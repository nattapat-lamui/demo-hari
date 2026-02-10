"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AnnouncementsController_1 = __importDefault(require("../controllers/AnnouncementsController"));
const security_1 = require("../middlewares/security");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/announcements - Get all announcements
router.get('/', AnnouncementsController_1.default.getAllAnnouncements.bind(AnnouncementsController_1.default));
// POST /api/announcements - Create new announcement
router.post('/', security_1.apiLimiter, AnnouncementsController_1.default.createAnnouncement.bind(AnnouncementsController_1.default));
// PATCH /api/announcements/:id - Update announcement (Admin only)
router.patch('/:id', auth_1.requireAdmin, security_1.apiLimiter, AnnouncementsController_1.default.updateAnnouncement.bind(AnnouncementsController_1.default));
// DELETE /api/announcements/:id - Delete announcement (Admin only)
router.delete('/:id', auth_1.requireAdmin, security_1.apiLimiter, AnnouncementsController_1.default.deleteAnnouncement.bind(AnnouncementsController_1.default));
exports.default = router;
