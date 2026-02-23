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
exports.EmployeeLeaveQuotaService = void 0;
const db_1 = require("../db");
const SystemConfigService_1 = __importDefault(require("./SystemConfigService"));
class EmployeeLeaveQuotaService {
    /**
     * Get effective quotas for an employee: per-employee override merged with global defaults
     */
    getEffectiveQuotas(employeeId) {
        return __awaiter(this, void 0, void 0, function* () {
            const [globalQuotas, overridesResult] = yield Promise.all([
                SystemConfigService_1.default.getLeaveQuotas(),
                (0, db_1.query)('SELECT leave_type, total FROM employee_leave_quotas WHERE employee_id = $1', [employeeId]),
            ]);
            const overrideMap = new Map();
            for (const row of overridesResult.rows) {
                overrideMap.set(row.leave_type, parseInt(row.total, 10));
            }
            return globalQuotas.map(({ type, total: defaultTotal }) => {
                const hasOverride = overrideMap.has(type);
                return {
                    type,
                    total: hasOverride ? overrideMap.get(type) : defaultTotal,
                    isOverride: hasOverride,
                    defaultTotal,
                };
            });
        });
    }
    /**
     * Upsert (insert or update) override quotas for an employee
     */
    upsertOverrides(employeeId, overrides) {
        return __awaiter(this, void 0, void 0, function* () {
            if (overrides.length === 0) {
                return this.getEffectiveQuotas(employeeId);
            }
            // Validate leave types against global config
            const globalQuotas = yield SystemConfigService_1.default.getLeaveQuotas();
            const validTypes = new Set(globalQuotas.map(q => q.type));
            for (const o of overrides) {
                if (!validTypes.has(o.leaveType)) {
                    const err = new Error(`Invalid leave type: ${o.leaveType}`);
                    err.statusCode = 400;
                    throw err;
                }
                if (o.total < -1) {
                    const err = new Error(`Invalid total for ${o.leaveType}: must be >= -1`);
                    err.statusCode = 400;
                    throw err;
                }
            }
            // PostgreSQL UPSERT using ON CONFLICT
            for (const { leaveType, total } of overrides) {
                yield (0, db_1.query)(`INSERT INTO employee_leave_quotas (employee_id, leave_type, total)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (employee_id, leave_type)
                 DO UPDATE SET total = $3, updated_at = CURRENT_TIMESTAMP`, [employeeId, leaveType, total]);
            }
            return this.getEffectiveQuotas(employeeId);
        });
    }
    /**
     * Delete a single override, reverting that leave type to the global default
     */
    deleteOverride(employeeId, leaveType) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, db_1.query)('DELETE FROM employee_leave_quotas WHERE employee_id = $1 AND leave_type = $2', [employeeId, leaveType]);
            return this.getEffectiveQuotas(employeeId);
        });
    }
}
exports.EmployeeLeaveQuotaService = EmployeeLeaveQuotaService;
exports.default = new EmployeeLeaveQuotaService();
