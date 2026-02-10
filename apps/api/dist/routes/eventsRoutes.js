"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EventsController_1 = __importDefault(require("../controllers/EventsController"));
const security_1 = require("../middlewares/security");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/events - Get all events
router.get('/', EventsController_1.default.getAllEvents.bind(EventsController_1.default));
// GET /api/events/upcoming - Get upcoming events
router.get('/upcoming', EventsController_1.default.getUpcomingEvents.bind(EventsController_1.default));
// POST /api/events/upcoming - Create new upcoming event
router.post('/upcoming', security_1.apiLimiter, EventsController_1.default.createUpcomingEvent.bind(EventsController_1.default));
// DELETE /api/events/upcoming/:id - Delete an upcoming event
router.delete('/upcoming/:id', security_1.apiLimiter, EventsController_1.default.deleteUpcomingEvent.bind(EventsController_1.default));
exports.default = router;
