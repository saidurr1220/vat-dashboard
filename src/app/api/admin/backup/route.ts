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
                AND table_name = 'system_backups'
            )
        `);

        if (!tableExists.rows[0].exists) {
            return NextResponse.json({
                error: 'Backup system not initialized',
                message: 'Please initialize the backup system first by calling /api/admin/init-backup-tables',
                action_required: 'init_backup_tables'
            }, { status: 400 });
        }

        const { type = 'full', tables = [], description = '' } = await request.json();

        // Get all table names if full backup
        let tablesToBackup = tables;
        if (type === 'full' || tables.length === 0) {
            const tablesResult = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'drizzle%'
        ORDER BY table_name
      `);
            tablesToBackup = tablesResult.rows.map((row: any) => row.table_name);
        }

        // Create backup data
        const backupData: any = {
            metadata: {
                created_at: new Date().toISOString(),
                type,
                description,
                tables: tablesToBackup,
                version: '1.0',
                total_tables: tablesToBackup.length
            },
            data: {}
        };

        let totalRecords = 0;

        // Backup each table
        for (const tableName of tablesToBackup) {
            try {
                const tableData = await db.execute(sql.raw(`SELECT * FROM ${tableName} ORDER BY id`));
                backupData.data[tableName] = {
                    records: tableData.rows,
                    count: tableData.rows.length,
                    backed_up_at: new Date().toISOString()
                };
                totalRecords += tableData.rows.length;
            } catch (error) {
                console.error(`Error backing up table ${tableName}:`, error);
                backupData.data[tableName] = {
                    error: `Failed to backup: ${error}`,
                    count: 0,
                    backed_up_at: new Date().toISOString()
                };
            }
        }

        backupData.metadata.total_records = totalRecords;

        // Compress backup data
        const backupJson = JSON.stringify(backupData);
        const compressedSize = Buffer.byteLength(backupJson, 'utf8');

        // Store backup in database
        const backupName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}${type === 'full' ? '_full' : '_partial'}`;
        const backupDescription = description || `${type} backup created on ${new Date().toLocaleDateString()}`;

        const backupRecord = await db.execute(sql`
      INSERT INTO system_backups (
        backup_name,
        backup_type,
        description,
        backup_data,
        file_size,
        table_count,
        record_count,
        created_by,
        created_at
      ) VALUES (
        ${backupName},
        ${type},
        ${backupDescription},
        ${sql.raw(`'${backupJson.replace(/'/g, "''")}'::jsonb`)},
        ${compressedSize},
        ${tablesToBackup.length},
        ${totalRecords},
        'admin',
        NOW()
      ) RETURNING id, backup_name, created_at
    `);

        return NextResponse.json({
            success: true,
            backup: {
                id: backupRecord.rows[0].id,
                name: backupRecord.rows[0].backup_name,
                created_at: backupRecord.rows[0].created_at,
                type,
                tables: tablesToBackup.length,
                records: totalRecords,
                size: `${(compressedSize / 1024 / 1024).toFixed(2)} MB`
            },
            downloadable: true
        });

    } catch (error) {
        console.error('Backup creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create backup' },
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
                AND table_name = 'system_backups'
            )
        `);

        if (!tableExists.rows[0].exists) {
            return NextResponse.json({
                error: 'Backup system not initialized',
                message: 'Please initialize the backup system first by calling /api/admin/init-backup-tables',
                action_required: 'init_backup_tables',
                backups: []
            }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const backupId = searchParams.get('id');
        const download = searchParams.get('download');

        if (backupId && download === 'true') {
            // Download specific backup
            const backup = await db.execute(sql`
        SELECT backup_name, backup_data, created_at, backup_type
        FROM system_backups 
        WHERE id = ${parseInt(backupId)}
      `);

            if (backup.rows.length === 0) {
                return NextResponse.json({ error: 'Backup not found' }, { status: 404 });
            }

            const backupData = backup.rows[0];
            const filename = `${backupData.backup_name}.json`;

            // Convert JSONB to string if needed
            const jsonData = typeof backupData.backup_data === 'string'
                ? backupData.backup_data
                : JSON.stringify(backupData.backup_data, null, 2);

            return new NextResponse(jsonData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            });
        }

        // List all backups
        const backups = await db.execute(sql`
      SELECT 
        id,
        backup_name,
        backup_type,
        description,
        file_size,
        table_count,
        record_count,
        created_by,
        created_at
      FROM system_backups 
      ORDER BY created_at DESC
      LIMIT 50
    `);

        return NextResponse.json({
            backups: backups.rows.map((backup: any) => ({
                ...backup,
                size: `${(backup.file_size / 1024 / 1024).toFixed(2)} MB`,
                created_at: new Date(backup.created_at).toLocaleString()
            }))
        });

    } catch (error) {
        console.error('Backup list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch backups' },
            { status: 500 }
        );
    }
}