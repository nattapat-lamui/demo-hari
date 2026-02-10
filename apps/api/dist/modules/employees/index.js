"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobHistoryController = exports.employeeRoutes = exports.EmployeeService = exports.EmployeeController = void 0;
var employee_controller_1 = require("./employee.controller");
Object.defineProperty(exports, "EmployeeController", { enumerable: true, get: function () { return employee_controller_1.EmployeeController; } });
var employee_service_1 = require("./employee.service");
Object.defineProperty(exports, "EmployeeService", { enumerable: true, get: function () { return employee_service_1.EmployeeService; } });
var employee_routes_1 = require("./employee.routes");
Object.defineProperty(exports, "employeeRoutes", { enumerable: true, get: function () { return __importDefault(employee_routes_1).default; } });
var job_history_controller_1 = require("./job-history.controller");
Object.defineProperty(exports, "JobHistoryController", { enumerable: true, get: function () { return __importDefault(job_history_controller_1).default; } });
