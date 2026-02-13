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
/**
 * Adds Maternity Leave, Compensatory Leave, and Military Leave
 * to the existing system_configs leave quotas.
 */
function addSpecialLeaveTypes() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Adding special leave types to system_configs...');
        try {
            // Fetch current quotas
            const result = yield (0, db_1.query)(`SELECT value FROM system_configs WHERE category = 'leave' AND key = 'quotas'`);
            if (result.rows.length === 0) {
                console.error('❌ No leave quotas config found. Run create-system-configs first.');
                process.exit(1);
            }
            const quotas = JSON.parse(result.rows[0].value);
            console.log(`  Current quotas: ${quotas.map(q => q.type).join(', ')}`);
            const newTypes = [
                { type: 'Maternity Leave', total: 120 },
                { type: 'Compensatory Leave', total: -1 },
                { type: 'Military Leave', total: 60 },
            ];
            let added = 0;
            for (const nt of newTypes) {
                if (!quotas.find(q => q.type === nt.type)) {
                    quotas.push(nt);
                    added++;
                    console.log(`  ✅ Added ${nt.type} (${nt.total === -1 ? 'unlimited' : nt.total + ' days'})`);
                }
                else {
                    console.log(`  ⏭  ${nt.type} already exists, skipping`);
                }
            }
            if (added > 0) {
                yield (0, db_1.query)(`UPDATE system_configs SET value = $1, updated_at = CURRENT_TIMESTAMP
                 WHERE category = 'leave' AND key = 'quotas'`, [JSON.stringify(quotas)]);
                console.log(`\n✅ Updated leave quotas with ${added} new type(s).`);
            }
            else {
                console.log('\n✅ All special leave types already exist. No changes needed.');
            }
        }
        catch (error) {
            console.error('❌ Error adding special leave types:', error);
            throw error;
        }
    });
}
if (require.main === module) {
    addSpecialLeaveTypes()
        .then(() => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
}
exports.default = addSpecialLeaveTypes;
