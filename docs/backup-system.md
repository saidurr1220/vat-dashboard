# Backup System API

The backup system provides comprehensive database backup and restore functionality for your application.

## Quick Start

### 1. Initialize the Backup System

Before using any backup features, you must initialize the backup system tables:

```bash
POST /api/admin/init-backup-tables
```

This creates the necessary database tables:

- `system_backups` - Stores backup data and metadata
- `system_restore_log` - Tracks restoration operations
- `backup_schedule` - Manages automated backup schedules
- `backup_cleanup_log` - Logs cleanup operations

### 2. Check System Status

Verify the backup system is ready:

```bash
GET /api/admin/backup/status
```

Response:

```json
{
  "initialized": true,
  "message": "Backup system is ready"
}
```

## API Endpoints

### Backup Operations

#### Create Backup

```bash
POST /api/admin/backup
Content-Type: application/json

{
  "type": "full",           // "full" or "partial"
  "tables": [],             // specific tables (empty for all)
  "description": "Manual backup"
}
```

#### List Backups

```bash
GET /api/admin/backup
```

#### Download Backup

```bash
GET /api/admin/backup?id=123&download=true
```

### Schedule Management

#### Get Schedule

```bash
GET /api/admin/backup/schedule
```

#### Update Schedule

```bash
POST /api/admin/backup/schedule
Content-Type: application/json

{
  "enabled": true,
  "frequency": "daily",
  "time": "02:00",
  "retentionDays": 30,
  "maxBackups": 50
}
```

### Restore Operations

#### Restore Backup

```bash
POST /api/admin/restore
Content-Type: application/json

{
  "backupId": 123,
  "restoreType": "full"
}
```

## Error Handling

If the backup system is not initialized, all endpoints will return:

```json
{
  "error": "Backup system not initialized",
  "message": "Please initialize the backup system first by calling /api/admin/init-backup-tables",
  "action_required": "init_backup_tables",
  "initialization_url": "/api/admin/init-backup-tables"
}
```

## Usage Flow

1. **Initialize**: Call `/api/admin/init-backup-tables`
2. **Verify**: Check `/api/admin/backup/status`
3. **Configure**: Set up schedule via `/api/admin/backup/schedule`
4. **Backup**: Create backups via `/api/admin/backup`
5. **Monitor**: List and download backups as needed

## Security Notes

- All endpoints require admin authentication (TODO: implement)
- Backup data is stored as compressed JSONB in the database
- Sensitive data should be handled according to your security policies
