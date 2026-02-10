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
class TrainingController {
    // GET /api/training/modules
    getAllModules(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, db_1.query)("SELECT * FROM training_modules");
                res.json(result.rows);
            }
            catch (err) {
                console.error("Error fetching training modules:", err);
                res.status(500).json({ error: "Failed to fetch modules" });
            }
        });
    }
    // GET /api/training/employee/:employeeId
    getEmployeeTraining(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { employeeId } = req.params;
            try {
                const result = yield (0, db_1.query)(`SELECT et.id, et.title, et.duration, et.status, et.completion_date, et.score,
                tm.type, tm.thumbnail, tm.progress as module_progress
         FROM employee_training et
         LEFT JOIN training_modules tm ON et.module_id = tm.id
         WHERE et.employee_id = $1
         ORDER BY et.completion_date DESC NULLS LAST`, [employeeId]);
                const training = result.rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    duration: row.duration,
                    status: row.status,
                    completedDate: row.completion_date,
                    score: row.score,
                    type: row.type || "Course",
                    thumbnail: row.thumbnail,
                    progress: row.module_progress || 0,
                }));
                res.json(training);
            }
            catch (err) {
                console.error("Error fetching employee training:", err);
                res.status(500).json({ error: "Failed to fetch training records" });
            }
        });
    }
    // POST /api/training/assign
    assignTraining(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { employeeId, moduleId, title, duration } = req.body;
            if (!employeeId) {
                res.status(400).json({ error: "employeeId required" });
                return;
            }
            try {
                const result = yield (0, db_1.query)(`INSERT INTO employee_training (employee_id, module_id, title, duration, status)
         VALUES ($1, $2, $3, $4, 'Not Started')
         RETURNING *`, [
                    employeeId,
                    moduleId || null,
                    title || "Untitled Training",
                    duration || "1h",
                ]);
                res.status(201).json(result.rows[0]);
            }
            catch (err) {
                console.error("Error assigning training:", err);
                res.status(500).json({ error: "Failed to assign training" });
            }
        });
    }
    // PATCH /api/training/:id
    updateTraining(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { status, score } = req.body;
            try {
                const completionDate = status === "Completed" ? new Date() : null;
                const result = yield (0, db_1.query)(`UPDATE employee_training
         SET status = COALESCE($1, status),
             score = COALESCE($2, score),
             completion_date = COALESCE($3, completion_date)
         WHERE id = $4
         RETURNING *`, [status, score, completionDate, id]);
                if (result.rows.length === 0) {
                    res.status(404).json({ error: "Training record not found" });
                    return;
                }
                res.json(result.rows[0]);
            }
            catch (err) {
                console.error("Error updating training:", err);
                res.status(500).json({ error: "Failed to update training" });
            }
        });
    }
}
exports.default = new TrainingController();
