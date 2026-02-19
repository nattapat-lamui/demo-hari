import { Router } from "express";
import SurveyController from "../controllers/SurveyController";
import { authenticateToken, requireAdmin } from "../middlewares/auth";

const router = Router();

// All survey routes require authentication
router.use(authenticateToken);

// GET /api/surveys/sentiment - Must be before /:id to avoid conflict
router.get("/sentiment", SurveyController.sentiment.bind(SurveyController));

// GET /api/surveys - List all surveys
router.get("/", SurveyController.list.bind(SurveyController));

// GET /api/surveys/:id - Survey detail
router.get("/:id", SurveyController.detail.bind(SurveyController));

// POST /api/surveys - Create survey (admin only)
router.post("/", requireAdmin, SurveyController.create.bind(SurveyController));

// POST /api/surveys/:id/respond - Submit response (any authenticated user)
router.post("/:id/respond", SurveyController.respond.bind(SurveyController));

// PATCH /api/surveys/:id/close - Close survey (admin only)
router.patch("/:id/close", requireAdmin, SurveyController.close.bind(SurveyController));

// PATCH /api/surveys/:id/reopen - Reopen closed survey (admin only)
router.patch("/:id/reopen", requireAdmin, SurveyController.reopen.bind(SurveyController));

// DELETE /api/surveys/:id - Delete survey (admin only)
router.delete("/:id", requireAdmin, SurveyController.delete.bind(SurveyController));

export default router;
