import * as dotenv from 'dotenv';
import * as path from 'path';
import { execSync } from 'child_process';
import * as fs from 'fs';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const BACKUP_DIR = path.resolve(__dirname, '../../backups');

async function backupDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup-${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);

  try {
    console.log(`Starting database backup...`);
    console.log(`Output: ${filepath}`);

    execSync(`pg_dump "${dbUrl}" --no-owner --no-acl > "${filepath}"`, {
      stdio: 'inherit',
    });

    // Check file size
    const stats = fs.statSync(filepath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`Backup completed: ${filename} (${sizeMB} MB)`);

    // Cleanup old backups (keep last 10)
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
      .sort()
      .reverse();

    if (backups.length > 10) {
      for (const old of backups.slice(10)) {
        fs.unlinkSync(path.join(BACKUP_DIR, old));
        console.log(`Deleted old backup: ${old}`);
      }
    }

    return filepath;
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

// Also create a restore function
async function restoreDatabase(backupFile: string) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  if (!fs.existsSync(backupFile)) {
    console.error(`Backup file not found: ${backupFile}`);
    process.exit(1);
  }

  try {
    console.log(`Restoring from: ${backupFile}`);
    console.log('WARNING: This will overwrite the current database!');

    execSync(`psql "${dbUrl}" < "${backupFile}"`, {
      stdio: 'inherit',
    });

    console.log('Restore completed successfully');
  } catch (error) {
    console.error('Restore failed:', error);
    process.exit(1);
  }
}

// CLI usage
const command = process.argv[2];
if (command === 'restore') {
  const file = process.argv[3];
  if (!file) {
    console.error('Usage: npx ts-node src/scripts/backup-db.ts restore <backup-file>');
    process.exit(1);
  }
  restoreDatabase(file);
} else {
  backupDatabase();
}
