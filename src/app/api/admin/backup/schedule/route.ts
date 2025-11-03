import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
    try {
        // TODO: Add admin authentication check

        // Check if backup system tables exist
        const tableExists = await db.execute(sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'backup_schedule'
            )
        `);

        if (!tableExists.rows[0].exists) {
            return NextResponse.json({
                error: 'Backup system not initialized',
                message: 'Please initialize the backup system first by calling /api/admin/init-backup-tables',
                action_required: 'init_backup_tables'
            }, { status: 400 });
        }

        const {
            enabled = true,
            frequency = 'daily',
            time = '02:00',
            retentionDays = 30,
            maxBackups = 50
        } = await request.json();

        // Update or create backup schedule
        await db.execute(sql`
      INSERT INTO backup_schedule (
        enabled,
        frequency,
        scheduled_time,
        retention_days,
        max_backups,
        updated_by,
        updated_at
      ) VALUES (
        ${enabled},
        ${frequency},
        ${time},
        ${retentionDays},
        ${maxBackups},
        ${'admin'},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        enabled = EXCLUDED.enabled,
        frequency = EXCLUDED.frequency,
        scheduled_time = EXCLUDED.scheduled_time,
        retention_days = EXCLUDED.retention_days,
        max_backups = EXCLUDED.max_backups,
        updated_by = EXCLUDED.updated_by,
        updated_at = EXCLUDED.updated_at
    `);

        return NextResponse.json({
            success: true,
            message: 'Backup schedule updated successfully',
            schedule: {
                enabled,
                frequency,
                time,
                retentionDays,
                maxBackups
            }
        });

    } catch (error) {
        console.error('Schedule update error:', error);
        return NextResponse.json(
            { error: 'Failed to update backup schedule' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // TODO: Add admin authentication check

        // Check if backup system tables exist
        const tableExists = await db.execute(sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'backup_schedule'
            )
        `);

        if (!tableExists.rows[0].exists) {
            return NextResponse.json({
                error: 'Backup system not initialized',
                message: 'Please initialize the backup system first by calling /api/admin/init-backup-tables',
                action_required: 'init_backup_tables',
                schedule: null,
                statistics: null
            }, { status: 400 });
        }

        // Get current schedule
        const schedule = await db.execute(sql`
      SELECT * FROM backup_schedule ORDER BY updated_at DESC LIMIT 1
    `);

        // Get backup statistics
        const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_backups,
        SUM(file_size) as total_size,
        MAX(created_at) as last_backup,
        COUNT(CASE WHEN backup_type = 'auto' THEN 1 END) as auto_backups,
        COUNT(CASE WHEN backup_type = 'manual' THEN 1 END) as manual_backups
      FROM system_backups
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

        return NextResponse.json({
            schedule: schedule.rows[0] || {
                enabled: false,
                frequency: 'daily',
                scheduled_time: '02:00',
                retention_days: 30,
                max_backups: 50
            },
            statistics: {
                totalBackups: stats.rows[0]?.total_backups || 0,
                totalSize: `${((Number(stats.rows[0]?.total_size) || 0) / 1024 / 1024).toFixed(2)} MB`,
                lastBackup: stats.rows[0]?.last_backup ? new Date(stats.rows[0].last_backup as string).toLocaleString() : 'Never',
                autoBackups: stats.rows[0]?.auto_backups || 0,
                manualBackups: stats.rows[0]?.manual_backups || 0
            }
        });

    } catch (error) {
        console.error('Schedule fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch backup schedule' },
            { status: 500 }
        );
    }
}