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
exports.withTransaction = withTransaction;
exports.executeInTransaction = executeInTransaction;
const db_1 = require("../db");
/**
 * Execute a callback within a database transaction
 * Automatically commits on success or rolls back on error
 *
 * @example
 * await withTransaction(async () => {
 *   await query('INSERT INTO employees ...');
 *   await query('INSERT INTO users ...');
 * });
 */
function withTransaction(callback) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, db_1.query)('BEGIN');
            const result = yield callback();
            yield (0, db_1.query)('COMMIT');
            return result;
        }
        catch (error) {
            yield (0, db_1.query)('ROLLBACK');
            console.error('Transaction rolled back:', error);
            throw error;
        }
    });
}
/**
 * Execute multiple queries within a transaction
 *
 * @example
 * await executeInTransaction([
 *   { sql: 'INSERT INTO ...', params: [1, 2] },
 *   { sql: 'UPDATE ...', params: [3] },
 * ]);
 */
function executeInTransaction(queries) {
    return __awaiter(this, void 0, void 0, function* () {
        yield withTransaction(() => __awaiter(this, void 0, void 0, function* () {
            for (const { sql, params } of queries) {
                yield (0, db_1.query)(sql, params);
            }
        }));
    });
}
