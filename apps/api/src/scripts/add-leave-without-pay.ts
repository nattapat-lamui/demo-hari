import { query } from '../db';

/**
 * Adds "Leave Without Pay" to the existing system_configs leave quotas.
 * Unlimited quota (total: -1) — requires manager approval.
 */
async function addLeaveWithoutPay() {
    console.log('Adding "Leave Without Pay" to system_configs...');

    try {
        // Fetch current quotas
        const result = await query(
            `SELECT value FROM system_configs WHERE category = 'leave' AND key = 'quotas'`
        );

        if (result.rows.length === 0) {
            console.error('❌ No leave quotas config found. Run create-system-configs first.');
            process.exit(1);
        }

        const quotas: { type: string; total: number }[] = JSON.parse(result.rows[0].value);
        console.log(`  Current quotas: ${quotas.map(q => q.type).join(', ')}`);

        if (quotas.find(q => q.type === 'Leave Without Pay')) {
            console.log('\n✅ "Leave Without Pay" already exists. No changes needed.');
            return;
        }

        quotas.push({ type: 'Leave Without Pay', total: -1 });
        console.log('  ✅ Added Leave Without Pay (unlimited)');

        await query(
            `UPDATE system_configs SET value = $1, updated_at = CURRENT_TIMESTAMP
             WHERE category = 'leave' AND key = 'quotas'`,
            [JSON.stringify(quotas)]
        );
        console.log('\n✅ Updated leave quotas with Leave Without Pay.');
    } catch (error) {
        console.error('❌ Error adding Leave Without Pay:', error);
        throw error;
    }
}

if (require.main === module) {
    addLeaveWithoutPay()
        .then(() => {
            console.log('\n✅ Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Migration failed:', error);
            process.exit(1);
        });
}

export default addLeaveWithoutPay;
