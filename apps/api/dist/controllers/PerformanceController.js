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
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db");
class PerformanceController {
    // GET /api/performance/reviews
    getPerformanceReviews(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { employeeId } = req.query;
            try {
                let queryText = "SELECT * FROM performance_reviews";
                const params = [];
                if (employeeId) {
                    queryText += " WHERE employee_id = $1";
                    params.push(employeeId);
                }
                queryText += " ORDER BY date DESC";
                const result = yield (0, db_1.query)(queryText, params);
                const reviews = result.rows.map((row) => ({
                    id: row.id,
                    employeeId: row.employee_id,
                    date: row.date,
                    rating: row.rating,
                    notes: row.notes,
                }));
                res.json(reviews);
            }
            catch (err) {
                console.error("Error fetching performance reviews:", err);
                res.status(500).json({ error: "Failed to fetch performance reviews" });
            }
        });
    }
}
exports.default = new PerformanceController();
