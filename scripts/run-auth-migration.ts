import { db } from '../src/db/client';
import { sql } from 'drizzle-orm';

async function runAuthMigration() {
    try {
        console.log('Running auth migration...');

        // Create role enum
        await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE "public"."role" AS ENUM('ADMIN', 'USER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

        // Create users table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY NOT NULL,
        "email" text NOT NULL,
        "password_hash" text NOT NULL,
        "role" "role" DEFAULT 'ADMIN' NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "users_email_unique" UNIQUE("email")
      );
    `);

        // Create audit_logs table
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "action" text NOT NULL,
        "resource" text NOT NULL,
        "meta" jsonb,
        "ip" text,
        "ua" text,
        "created_at" timestamp DEFAULT now()
      );
    `);

        // Add created_by column to sales table
        await db.execute(sql`
      ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "created_by" integer;
    `);

        // Create indexes
        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
    `);

        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");
    `);

        await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
    `);

        // Add foreign key constraints
        await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" 
        FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

        await db.execute(sql`
      DO $$ BEGIN
        ALTER TABLE "sales" ADD CONSTRAINT "sales_created_by_users_id_fk" 
        FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

        console.log('Auth migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runAuthMigration();