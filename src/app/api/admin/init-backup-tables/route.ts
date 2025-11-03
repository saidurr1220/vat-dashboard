import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check

    // Check if tables already exist
    const tablesExist = await db.execute(sql`
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_backups') as backups_exist,
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'backup_schedule') as schedule_exist
    `);

    const { backups_exist, schedule_exist } = tablesExist.rows[0];

    if (backups_exist && schedule_exist) {
      return NextResponse.json({
        success: true,
        message: 'Backup system is already initialized',
        status: 'already_initialized',
        tables: [
          'system_backups',
          'system_restore_log',
          'backup_schedule',
          'backup_cleanup_log'
        ]
      });
    }

    // Create system_backups table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS system_backups (
        id SERIAL PRIMARY KEY,
        backup_name VARCHAR(255) NOT NULL UNIQUE,
        backup_type VARCHAR(50) NOT NULL DEFAULT 'manual',
        description TEXT,
        backup_data JSONB NOT NULL,
        file_size BIGINT NOT NULL DEFAULT 0,
        table_count INTEGER NOT NULL DEFAULT 0,
        record_count INTEGER NOT NULL DEFAULT 0,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Indexes for better performance
        CONSTRAINT backup_name_unique UNIQUE (backup_name)
      )
    `);

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_system_backups_created_at ON system_backups(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_system_backups_type ON system_backups(backup_type);
      CREATE INDEX IF NOT EXISTS idx_system_backups_created_by ON system_backups(created_by);
    `);

    // Create system_restore_log table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS system_restore_log (
        id SERIAL PRIMARY KEY,
        backup_id INTEGER REFERENCES system_backups(id) ON DELETE CASCADE,
        restore_type VARCHAR(50) NOT NULL,
        tables_restored INTEGER NOT NULL DEFAULT 0,
        records_restored INTEGER NOT NULL DEFAULT 0,
        pre_restore_backup_id INTEGER REFERENCES system_backups(id) ON DELETE SET NULL,
        restored_by VARCHAR(255) NOT NULL,
        restored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        restoration_results JSONB,
        
        -- Indexes
        CONSTRAINT fk_backup_id FOREIGN KEY (backup_id) REFERENCES system_backups(id),
        CONSTRAINT fk_pre_restore_backup FOREIGN KEY (pre_restore_backup_id) REFERENCES system_backups(id)
      )
    `);

    // Create indexes for restore log
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_restore_log_restored_at ON system_restore_log(restored_at DESC);
      CREATE INDEX IF NOT EXISTS idx_restore_log_backup_id ON system_restore_log(backup_id);
    `);

    // Create backup_schedule table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS backup_schedule (
        id SERIAL PRIMARY KEY,
        enabled BOOLEAN NOT NULL DEFAULT true,
        frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
        scheduled_time TIME NOT NULL DEFAULT '02:00:00',
        retention_days INTEGER NOT NULL DEFAULT 30,
        max_backups INTEGER NOT NULL DEFAULT 50,
        last_run TIMESTAMP WITH TIME ZONE,
        next_run TIMESTAMP WITH TIME ZONE,
        updated_by VARCHAR(255) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create backup_cleanup_log table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS backup_cleanup_log (
        id SERIAL PRIMARY KEY,
        cleanup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        backups_deleted INTEGER NOT NULL DEFAULT 0,
        space_freed BIGINT NOT NULL DEFAULT 0,
        cleanup_reason VARCHAR(100) NOT NULL,
        performed_by VARCHAR(255) NOT NULL
      )
    `);

    // Insert default schedule if none exists
    await db.execute(sql`
      INSERT INTO backup_schedule (
        enabled, frequency, scheduled_time, retention_days, max_backups, updated_by
      ) 
      SELECT true, 'daily', '02:00:00', 30, 50, 'system'
      WHERE NOT EXISTS (SELECT 1 FROM backup_schedule)
    `);

    return NextResponse.json({
      success: true,
      message: 'Backup system tables created successfully',
      status: 'initialized',
      tables: [
        'system_backups',
        'system_restore_log',
        'backup_schedule',
        'backup_cleanup_log'
      ],
      next_steps: [
        'You can now create backups using /api/admin/backup',
        'Configure backup schedule using /api/admin/backup/schedule',
        'Check backup status using /api/admin/backup/status'
      ]
    });

  } catch (error) {
    console.error('Backup tables creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create backup system tables' },
      { status: 500 }
    );
  }
}