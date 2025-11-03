import { NextRequest, NextResponse } from 'next/server';
import { checkBackupSystemInitialized } from '@/lib/backup-utils';

export async function GET(request: NextRequest) {
    try {
        const isInitialized = await checkBackupSystemInitialized();

        return NextResponse.json({
            initialized: isInitialized,
            message: isInitialized
                ? 'Backup system is ready'
                : 'Backup system needs initialization',
            ...(isInitialized ? {} : {
                action_required: 'init_backup_tables',
                initialization_url: '/api/admin/init-backup-tables'
            })
        });
    } catch (error) {
        console.error('Backup status check error:', error);
        return NextResponse.json(
            {
                error: 'Failed to check backup system status',
                initialized: false
            },
            { status: 500 }
        );
    }
}