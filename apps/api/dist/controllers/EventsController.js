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
class EventsController {
    // GET /api/events
    getAllEvents(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, db_1.query)("SELECT * FROM events");
                const events = result.rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    date: row.date_str,
                    type: row.type,
                    avatar: row.avatar,
                    color: row.color,
                }));
                res.json(events);
            }
            catch (err) {
                console.error("Error fetching events:", err);
                res.status(500).json({ error: "Failed to fetch events" });
            }
        });
    }
    // GET /api/events/upcoming
    getUpcomingEvents(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield (0, db_1.query)("SELECT * FROM upcoming_events ORDER BY date ASC");
                const events = result.rows.map((row) => ({
                    id: row.id,
                    title: row.title,
                    date: row.date,
                    type: row.type,
                    avatar: row.avatar,
                    color: row.color,
                }));
                res.json(events);
            }
            catch (err) {
                console.error("Error fetching upcoming events:", err);
                res.status(500).json({ error: "Failed to fetch upcoming events" });
            }
        });
    }
    // POST /api/events/upcoming - Create new upcoming event
    createUpcomingEvent(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { title, date, type } = req.body;
            // Validation
            if (!title || !date) {
                res.status(400).json({ error: "Title and date are required" });
                return;
            }
            const validTypes = ['Birthday', 'Meeting', 'Social', 'Training', 'Holiday', 'Deadline', 'Company Event'];
            if (type && !validTypes.includes(type)) {
                res.status(400).json({ error: "Invalid event type" });
                return;
            }
            try {
                const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || null;
                const result = yield (0, db_1.query)(`INSERT INTO upcoming_events (title, date, type, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`, [title, date, type || 'Meeting', userId]);
                const newEvent = result.rows[0];
                res.status(201).json({
                    id: newEvent.id,
                    title: newEvent.title,
                    date: newEvent.date,
                    type: newEvent.type,
                    avatar: newEvent.avatar,
                    color: newEvent.color,
                });
            }
            catch (err) {
                console.error("Error creating upcoming event:", err);
                res.status(500).json({ error: "Failed to create upcoming event" });
            }
        });
    }
    // DELETE /api/events/upcoming/:id - Delete an upcoming event
    deleteUpcomingEvent(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const result = yield (0, db_1.query)("DELETE FROM upcoming_events WHERE id = $1", [id]);
                if (result.rowCount === 0) {
                    res.status(404).json({ error: "Event not found" });
                    return;
                }
                res.json({ message: "Event deleted successfully" });
            }
            catch (err) {
                console.error("Error deleting upcoming event:", err);
                res.status(500).json({ error: "Failed to delete upcoming event" });
            }
        });
    }
}
exports.default = new EventsController();
