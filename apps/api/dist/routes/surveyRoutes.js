"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SurveyController_1 = __importDefault(require("../controllers/SurveyController"));
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// All survey routes require authentication
router.use(auth_1.authenticateToken);
// GET /api/surveys/sentiment - Must be before /:id to avoid conflict
router.get("/sentiment", SurveyController_1.default.sentiment.bind(SurveyController_1.default));
// GET /api/surveys - List all surveys
router.get("/", SurveyController_1.default.list.bind(SurveyController_1.default));
// GET /api/surveys/:id - Survey detail
router.get("/:id", SurveyController_1.default.detail.bind(SurveyController_1.default));
// POST /api/surveys - Create survey (admin only)
router.post("/", auth_1.requireAdmin, SurveyController_1.default.create.bind(SurveyController_1.default));
// POST /api/surveys/:id/respond - Submit response (any authenticated user)
router.post("/:id/respond", SurveyController_1.default.respond.bind(SurveyController_1.default));
// PATCH /api/surveys/:id/close - Close survey (admin only)
router.patch("/:id/close", auth_1.requireAdmin, SurveyController_1.default.close.bind(SurveyController_1.default));
// PATCH /api/surveys/:id/reopen - Reopen closed survey (admin only)
router.patch("/:id/reopen", auth_1.requireAdmin, SurveyController_1.default.reopen.bind(SurveyController_1.default));
// DELETE /api/surveys/:id - Delete survey (admin only)
router.delete("/:id", auth_1.requireAdmin, SurveyController_1.default.delete.bind(SurveyController_1.default));
exports.default = router;
