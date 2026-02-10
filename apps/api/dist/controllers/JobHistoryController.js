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
class JobHistoryController {
    // GET /api/job-history
    getJobHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { employeeId } = req.query;
            try {
                let queryText = "SELECT * FROM job_history";
                const params = [];
                if (employeeId) {
                    queryText += " WHERE employee_id = $1";
                    params.push(employeeId);
                }
                queryText += " ORDER BY start_date DESC";
                const result = yield (0, db_1.query)(queryText, params);
                const history = result.rows.map((row) => ({
                    id: row.id,
                    role: row.role,
                    department: row.department,
                    startDate: row.start_date,
                    endDate: row.end_date || "Present",
                    description: row.description,
                }));
                res.json(history);
            }
            catch (err) {
                console.error("Error fetching job history:", err);
                res.status(500).json({ error: "Failed to fetch job history" });
            }
        });
    }
    // POST /api/job-history - Add new job history entry
    createJobHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { employeeId, role, department, startDate, endDate, description } = req.body;
            if (!employeeId || !role || !department || !startDate) {
                res.status(400).json({ error: "Employee ID, role, department, and start date are required" });
                return;
            }
            try {
                const result = yield (0, db_1.query)(`INSERT INTO job_history (employee_id, role, department, start_date, end_date, description)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`, [employeeId, role, department, startDate, endDate && endDate !== "Present" ? endDate : null, description || null]);
                const newHistory = result.rows[0];
                res.status(201).json({
                    id: newHistory.id,
                    role: newHistory.role,
                    department: newHistory.department,
                    startDate: newHistory.start_date,
                    endDate: newHistory.end_date || "Present",
                    description: newHistory.description,
                });
            }
            catch (err) {
                console.error("Error creating job history:", err);
                res.status(500).json({ error: "Failed to create job history" });
            }
        });
    }
}
exports.default = new JobHistoryController();
