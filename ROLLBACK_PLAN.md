# Rollback Plan - VAT Dashboard Auth System

## Emergency Bypass (Feature Flag)

### Quick Disable Auth Protection

Add this environment variable to immediately bypass all auth requirements:

```env
DISABLE_AUTH=true
```

### Implementation

Add to `src/lib/auth.ts` in the `requireAdmin` function:

```typescript
export function requireAdmin(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Emergency bypass
    if (process.env.DISABLE_AUTH === "true") {
      console.warn("⚠️  AUTH DISABLED - All requests allowed");
      return handler(request);
    }

    // ... rest of auth logic
  };
}
```

## Database Rollback Steps

### 1. Remove Auth Tables (Complete Rollback)

```sql
-- Drop foreign key constraints first
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_created_by_users_id_fk;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_users_id_fk;

-- Drop tables
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS users;

-- Remove column from sales
ALTER TABLE sales DROP COLUMN IF EXISTS created_by;

-- Drop enum type
DROP TYPE IF EXISTS role;
```

### 2. Partial Rollback (Keep Tables, Remove Constraints)

```sql
-- Just remove the foreign key constraints
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_created_by_users_id_fk;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_users_id_fk;

-- Optionally remove the created_by column
ALTER TABLE sales DROP COLUMN IF EXISTS created_by;
```

## Code Rollback Steps

### 1. Remove Auth Imports

Remove these imports from protected route files:

```typescript
// Remove this line
import { requireAdmin } from "@/lib/auth";
```

### 2. Restore Original Route Handlers

Change from:

```typescript
export const POST = requireAdmin(async (request: NextRequest) => {
  // handler code
});
```

Back to:

```typescript
export async function POST(request: NextRequest) {
  // handler code
}
```

### 3. Remove Auth Files

```bash
rm -rf src/lib/auth.ts
rm -rf src/app/api/auth/
rm -rf src/app/admin/
rm -rf middleware.ts
```

### 4. Remove Auth Dependencies

```bash
npm uninstall jose argon2 cookie ua-parser-js
```

## Automated Rollback Script

### Create Rollback Script

```bash
# scripts/rollback-auth.ts
import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function rollbackAuth() {
  try {
    console.log('Rolling back auth system...');

    // Remove foreign key constraints
    await db.execute(sql`
      ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_created_by_users_id_fk;
    `);

    await db.execute(sql`
      ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_users_id_fk;
    `);

    // Drop tables
    await db.execute(sql`DROP TABLE IF EXISTS audit_logs;`);
    await db.execute(sql`DROP TABLE IF EXISTS users;`);

    // Remove column
    await db.execute(sql`
      ALTER TABLE sales DROP COLUMN IF EXISTS created_by;
    `);

    // Drop enum
    await db.execute(sql`DROP TYPE IF EXISTS role;`);

    console.log('Auth system rollback completed successfully!');
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  }
}

rollbackAuth();
```

### Run Rollback

```bash
npx tsx scripts/rollback-auth.ts
```

## Verification Steps

### 1. Test Public Access

```bash
curl http://localhost:3000/api/sales
# Should return data without 401 error
```

### 2. Test Write Operations

```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
# Should work without authentication
```

### 3. Check Database

```sql
-- Verify tables are removed
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('users', 'audit_logs');
-- Should return no rows

-- Verify column is removed
SELECT column_name FROM information_schema.columns
WHERE table_name = 'sales' AND column_name = 'created_by';
-- Should return no rows
```

## Recovery Steps (If Rollback Fails)

### 1. Database Recovery

```sql
-- If rollback fails, you can restore from backup
-- Or recreate tables manually if needed
```

### 2. Code Recovery

```bash
# Restore from git
git checkout HEAD~1 -- src/app/api/sales/route.ts
git checkout HEAD~1 -- src/app/api/products/route.ts
git checkout HEAD~1 -- src/app/api/customers/route.ts
```

### 3. Emergency Access

If completely locked out:

1. Set `DISABLE_AUTH=true` in environment
2. Restart application
3. All endpoints will be accessible
4. Fix issues and re-enable auth

## Prevention Measures

### 1. Backup Before Changes

```bash
# Always backup database before major changes
pg_dump $DATABASE_URL > backup_before_auth.sql
```

### 2. Test in Staging

- Deploy to staging environment first
- Test all critical workflows
- Verify rollback procedures work

### 3. Gradual Rollout

- Enable auth on non-critical endpoints first
- Monitor for issues
- Gradually protect more endpoints

### 4. Monitoring

- Set up alerts for 401/403 errors
- Monitor login success/failure rates
- Track API response times

## Emergency Contacts

- Database Admin: [contact info]
- DevOps Team: [contact info]
- Security Team: [contact info]

## Rollback Decision Matrix

| Issue                 | Severity | Action                   |
| --------------------- | -------- | ------------------------ |
| Users can't login     | High     | Enable DISABLE_AUTH flag |
| Some endpoints broken | Medium   | Rollback specific routes |
| Database corruption   | Critical | Full database restore    |
| Performance issues    | Medium   | Disable audit logging    |
| Security breach       | Critical | Full system rollback     |

Remember: Always test rollback procedures in a staging environment before production deployment.
