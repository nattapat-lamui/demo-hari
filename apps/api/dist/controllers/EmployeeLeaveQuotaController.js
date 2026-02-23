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
exports.EmployeeLeaveQuotaController = void 0;
const EmployeeLeaveQuotaService_1 = __importDefault(require("../services/EmployeeLeaveQuotaService"));
class EmployeeLeaveQuotaController {
    getEffectiveQuotas(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const quotas = yield EmployeeLeaveQuotaService_1.default.getEffectiveQuotas(id);
                res.json(quotas);
            }
            catch (error) {
                const statusCode = error.statusCode || 500;
                res.status(statusCode).json({ error: error.message || 'Failed to get leave quotas' });
            }
        });
    }
    upsertOverrides(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const { overrides } = req.body;
                if (!Array.isArray(overrides)) {
                    res.status(400).json({ error: 'overrides must be an array' });
                    return;
                }
                const quotas = yield EmployeeLeaveQuotaService_1.default.upsertOverrides(id, overrides);
                res.json(quotas);
            }
            catch (error) {
                const statusCode = error.statusCode || 500;
                res.status(statusCode).json({ error: error.message || 'Failed to update leave quotas' });
            }
        });
    }
    deleteOverride(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id, type } = req.params;
                const quotas = yield EmployeeLeaveQuotaService_1.default.deleteOverride(id, type);
                res.json(quotas);
            }
            catch (error) {
                const statusCode = error.statusCode || 500;
                res.status(statusCode).json({ error: error.message || 'Failed to delete leave quota override' });
            }
        });
    }
}
exports.EmployeeLeaveQuotaController = EmployeeLeaveQuotaController;
exports.default = new EmployeeLeaveQuotaController();
