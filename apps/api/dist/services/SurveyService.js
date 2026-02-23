"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurveyService = void 0;
const db_1 = __importStar(require("../db"));
class SurveyService {
    createSurvey(createdBy, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query("BEGIN");
                const surveyResult = yield client.query(`INSERT INTO surveys (title, created_by) VALUES ($1, $2) RETURNING id`, [data.title, createdBy]);
                const surveyId = surveyResult.rows[0].id;
                if (data.questions.length > 0) {
                    const values = [];
                    const placeholders = [];
                    data.questions.forEach((q, i) => {
                        const offset = i * 4;
                        placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);
                        values.push(surveyId, q.questionText, q.category, q.sortOrder);
                    });
                    yield client.query(`INSERT INTO survey_questions (survey_id, question_text, category, sort_order) VALUES ${placeholders.join(", ")}`, values);
                }
                yield client.query("COMMIT");
                return { id: surveyId };
            }
            catch (err) {
                yield client.query("ROLLBACK");
                throw err;
            }
            finally {
                client.release();
            }
        });
    }
    listSurveys(employeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield (0, db_1.query)(`SELECT
         s.id,
         s.title,
         s.status,
         s.created_at,
         s.closed_at,
         COUNT(DISTINCT sq.id)::int AS question_count,
         (SELECT COUNT(DISTINCT sc2.employee_id)::int
          FROM survey_completions sc2
          WHERE sc2.survey_id = s.id) AS response_count,
         CASE WHEN $1::uuid IS NOT NULL
           THEN EXISTS(
             SELECT 1 FROM survey_completions sc
             WHERE sc.survey_id = s.id AND sc.employee_id = $1
           )
           ELSE false
         END AS has_completed
       FROM surveys s
       LEFT JOIN survey_questions sq ON sq.survey_id = s.id
       GROUP BY s.id
       ORDER BY s.created_at DESC`, [employeeId]);
            return result.rows.map((r) => ({
                id: r.id,
                title: r.title,
                status: r.status,
                createdAt: r.created_at,
                closedAt: r.closed_at,
                questionCount: r.question_count,
                responseCount: r.response_count,
                hasCompleted: r.has_completed,
            }));
        });
    }
    getSurveyDetail(surveyId, employeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const surveyResult = yield (0, db_1.query)(`SELECT
         s.id, s.title, s.status, s.created_at, s.closed_at,
         CASE WHEN $2::uuid IS NOT NULL
           THEN EXISTS(
             SELECT 1 FROM survey_completions sc
             WHERE sc.survey_id = s.id AND sc.employee_id = $2
           )
           ELSE false
         END AS has_completed
       FROM surveys s
       WHERE s.id = $1`, [surveyId, employeeId]);
            if (surveyResult.rows.length === 0)
                return null;
            const survey = surveyResult.rows[0];
            const questionsResult = yield (0, db_1.query)(`SELECT id, question_text, category, sort_order
       FROM survey_questions
       WHERE survey_id = $1
       ORDER BY sort_order, id`, [surveyId]);
            return {
                id: survey.id,
                title: survey.title,
                status: survey.status,
                createdAt: survey.created_at,
                closedAt: survey.closed_at,
                hasCompleted: survey.has_completed,
                questions: questionsResult.rows.map((q) => ({
                    id: q.id,
                    questionText: q.question_text,
                    category: q.category,
                    sortOrder: q.sort_order,
                })),
            };
        });
    }
    submitResponse(surveyId, employeeId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield db_1.default.connect();
            try {
                yield client.query("BEGIN");
                // Insert anonymous responses
                if (data.responses.length > 0) {
                    const values = [];
                    const placeholders = [];
                    data.responses.forEach((r, i) => {
                        const offset = i * 2;
                        placeholders.push(`($${offset + 1}, $${offset + 2})`);
                        values.push(r.questionId, r.rating);
                    });
                    yield client.query(`INSERT INTO survey_responses (question_id, rating) VALUES ${placeholders.join(", ")}`, values);
                }
                // Record completion (unique constraint prevents double-submit)
                yield client.query(`INSERT INTO survey_completions (survey_id, employee_id) VALUES ($1, $2)`, [surveyId, employeeId]);
                yield client.query("COMMIT");
            }
            catch (err) {
                yield client.query("ROLLBACK");
                // Unique constraint violation = already completed
                if (err.code === "23505") {
                    throw Object.assign(new Error("You have already completed this survey"), { status: 409 });
                }
                throw err;
            }
            finally {
                client.release();
            }
        });
    }
    closeSurvey(surveyId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = yield (0, db_1.query)(`UPDATE surveys SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'active' RETURNING id`, [surveyId]);
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        });
    }
    reopenSurvey(surveyId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = yield (0, db_1.query)(`UPDATE surveys SET status = 'active', closed_at = NULL WHERE id = $1 AND status = 'closed' RETURNING id`, [surveyId]);
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        });
    }
    deleteSurvey(surveyId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = yield (0, db_1.query)(`DELETE FROM surveys WHERE id = $1 RETURNING id`, [surveyId]);
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        });
    }
    getSentimentOverview() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            // Category breakdown: average rating per category across ALL surveys
            const catResult = yield (0, db_1.query)(`SELECT
         sq.category,
         ROUND(AVG(sr.rating) * 20)::int AS score,
         COUNT(sr.id)::int AS response_count
       FROM survey_responses sr
       JOIN survey_questions sq ON sq.id = sr.question_id
       GROUP BY sq.category
       ORDER BY sq.category`);
            // Total unique respondents (across all surveys)
            const respondentsResult = yield (0, db_1.query)(`SELECT COUNT(DISTINCT employee_id)::int AS total FROM survey_completions`);
            // Total active employees
            const employeesResult = yield (0, db_1.query)(`SELECT COUNT(*)::int AS total FROM employees WHERE status = 'Active'`);
            const totalResponses = (_b = (_a = respondentsResult.rows[0]) === null || _a === void 0 ? void 0 : _a.total) !== null && _b !== void 0 ? _b : 0;
            const totalEmployees = (_d = (_c = employeesResult.rows[0]) === null || _c === void 0 ? void 0 : _c.total) !== null && _d !== void 0 ? _d : 0;
            const categoryBreakdown = catResult.rows.map((r) => ({
                category: r.category,
                score: r.score,
                responseCount: r.response_count,
            }));
            const overallScore = categoryBreakdown.length > 0
                ? Math.round(categoryBreakdown.reduce((sum, c) => sum + c.score, 0) /
                    categoryBreakdown.length)
                : 0;
            const responseRate = totalEmployees > 0 ? Math.round((totalResponses / totalEmployees) * 100) : 0;
            // Sentiment distribution: positive (4-5), neutral (3), negative (1-2)
            const distResult = yield (0, db_1.query)(`SELECT
         COUNT(*) FILTER (WHERE sr.rating >= 4)::int AS positive,
         COUNT(*) FILTER (WHERE sr.rating = 3)::int  AS neutral,
         COUNT(*) FILTER (WHERE sr.rating <= 2)::int  AS negative,
         COUNT(*)::int AS total
       FROM survey_responses sr`);
            const dist = distResult.rows[0];
            const distTotal = (_e = dist === null || dist === void 0 ? void 0 : dist.total) !== null && _e !== void 0 ? _e : 0;
            const distribution = distTotal > 0
                ? {
                    positive: Math.round((dist.positive / distTotal) * 100),
                    neutral: Math.round((dist.neutral / distTotal) * 100),
                    negative: Math.round((dist.negative / distTotal) * 100),
                }
                : { positive: 0, neutral: 0, negative: 0 };
            return {
                overallScore,
                responseRate,
                totalResponses,
                totalEmployees,
                categoryBreakdown,
                distribution,
            };
        });
    }
}
exports.SurveyService = SurveyService;
exports.default = new SurveyService();
