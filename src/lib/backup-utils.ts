import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function checkBackupSystemInitialized() {
    try {
        const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_backups'
      )
    `);

        return tableExists.rows[0].exists;
    } catch (error) {
        console.error('Error checking backup system initialization:', error);
        return false;
    }
}

export function createBackupNotInitializedResponse() {
    return {
        error: 'Backup system not initialized',
        message: 'Please initialize the backup system first by calling /api/admin/init-backup-tables',
        action_required: 'init_backup_tables',
        initialization_url: '/api/admin/init-backup-tables'
    };
}