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
exports.SurveyController = void 0;
const SurveyService_1 = __importDefault(require("../services/SurveyService"));
const Survey_1 = require("../models/Survey");
class SurveyController {
    /**
     * GET /api/surveys - List all surveys
     */
    list(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const employeeId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.employeeId) !== null && _b !== void 0 ? _b : null;
                const surveys = yield SurveyService_1.default.listSurveys(employeeId);
                res.json(surveys);
            }
            catch (error) {
                console.error("Error listing surveys:", error);
                res.status(500).json({ error: "Failed to list surveys" });
            }
        });
    }
    /**
     * GET /api/surveys/sentiment - Sentiment overview
     */
    sentiment(_req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const overview = yield SurveyService_1.default.getSentimentOverview();
                res.json(overview);
            }
            catch (error) {
                console.error("Error fetching sentiment:", error);
                res.status(500).json({ error: "Failed to fetch sentiment data" });
            }
        });
    }
    /**
     * GET /api/surveys/:id - Survey detail with questions
     */
    detail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const employeeId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.employeeId) !== null && _b !== void 0 ? _b : null;
                const survey = yield SurveyService_1.default.getSurveyDetail(req.params.id, employeeId);
                if (!survey) {
                    res.status(404).json({ error: "Survey not found" });
                    return;
                }
                res.json(survey);
            }
            catch (error) {
                console.error("Error fetching survey:", error);
                res.status(500).json({ error: "Failed to fetch survey" });
            }
        });
    }
    /**
     * POST /api/surveys - Create survey (admin)
     */
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { title, questions } = req.body;
                if (!title || typeof title !== "string" || title.trim() === "") {
                    res.status(400).json({ error: "Title is required" });
                    return;
                }
                if (!Array.isArray(questions) || questions.length === 0) {
                    res.status(400).json({ error: "At least one question is required" });
                    return;
                }
                const validCategories = new Set(Survey_1.SURVEY_CATEGORIES);
                for (const q of questions) {
                    if (!q.questionText || typeof q.questionText !== "string" || q.questionText.trim() === "") {
                        res.status(400).json({ error: "Each question must have questionText" });
                        return;
                    }
                    if (!validCategories.has(q.category)) {
                        res.status(400).json({
                            error: `Invalid category "${q.category}". Must be one of: ${Survey_1.SURVEY_CATEGORIES.join(", ")}`,
                        });
                        return;
                    }
                }
                const normalizedQuestions = questions.map((q, i) => {
                    var _a;
                    return ({
                        questionText: q.questionText.trim(),
                        category: q.category,
                        sortOrder: (_a = q.sortOrder) !== null && _a !== void 0 ? _a : i,
                    });
                });
                const result = yield SurveyService_1.default.createSurvey(req.user.userId, {
                    title: title.trim(),
                    questions: normalizedQuestions,
                });
                res.status(201).json(result);
            }
            catch (error) {
                console.error("Error creating survey:", error);
                res.status(500).json({ error: "Failed to create survey" });
            }
        });
    }
    /**
     * POST /api/surveys/:id/respond - Submit anonymous response
     */
    respond(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const employeeId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.employeeId;
                if (!employeeId) {
                    res.status(400).json({ error: "Employee ID is required" });
                    return;
                }
                const { responses } = req.body;
                if (!Array.isArray(responses) || responses.length === 0) {
                    res.status(400).json({ error: "At least one response is required" });
                    return;
                }
                for (const r of responses) {
                    if (!r.questionId) {
                        res.status(400).json({ error: "Each response must have questionId" });
                        return;
                    }
                    if (typeof r.rating !== "number" || r.rating < 1 || r.rating > 5) {
                        res.status(400).json({ error: "Rating must be between 1 and 5" });
                        return;
                    }
                }
                yield SurveyService_1.default.submitResponse(req.params.id, employeeId, { responses });
                res.json({ message: "Response submitted successfully" });
            }
            catch (error) {
                if (error.status === 409) {
                    res.status(409).json({ error: error.message });
                    return;
                }
                console.error("Error submitting survey response:", error);
                res.status(500).json({ error: "Failed to submit response" });
            }
        });
    }
    /**
     * PATCH /api/surveys/:id/close - Close survey (admin)
     */
    close(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const closed = yield SurveyService_1.default.closeSurvey(req.params.id);
                if (!closed) {
                    res.status(404).json({ error: "Survey not found or already closed" });
                    return;
                }
                res.json({ message: "Survey closed successfully" });
            }
            catch (error) {
                console.error("Error closing survey:", error);
                res.status(500).json({ error: "Failed to close survey" });
            }
        });
    }
    /**
     * PATCH /api/surveys/:id/reopen - Reopen closed survey (admin)
     */
    reopen(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reopened = yield SurveyService_1.default.reopenSurvey(req.params.id);
                if (!reopened) {
                    res.status(404).json({ error: "Survey not found or already active" });
                    return;
                }
                res.json({ message: "Survey reopened successfully" });
            }
            catch (error) {
                console.error("Error reopening survey:", error);
                res.status(500).json({ error: "Failed to reopen survey" });
            }
        });
    }
    /**
     * DELETE /api/surveys/:id - Delete survey (admin)
     */
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const deleted = yield SurveyService_1.default.deleteSurvey(req.params.id);
                if (!deleted) {
                    res.status(404).json({ error: "Survey not found" });
                    return;
                }
                res.json({ message: "Survey deleted successfully" });
            }
            catch (error) {
                console.error("Error deleting survey:", error);
                res.status(500).json({ error: "Failed to delete survey" });
            }
        });
    }
}
exports.SurveyController = SurveyController;
exports.default = new SurveyController();
