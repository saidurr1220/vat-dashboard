import { db } from '@/db/client';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function setupSchema() {
    console.log('🏗️ Setting up database schema...');

    try {
        // Push the schema to the database
        console.log('📋 Creating tables and indexes...');

        // This will create all tables defined in schema.ts
        await db.execute(sql`
            -- Create enums if they don't exist
            DO $$ BEGIN
                CREATE TYPE amount_type AS ENUM ('INCL', 'EXCL');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                CREATE TYPE payment_method AS ENUM ('CASH', 'BANK', 'CARD', 'MOBILE');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                CREATE TYPE ref_type AS ENUM ('OPENING', 'IMPORT', 'SALE', 'ADJUST');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;

            DO $$ BEGIN
                CREATE TYPE category AS ENUM ('Footwear', 'Fan', 'BioShield', 'Instrument');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        console.log('✅ Schema setup completed!');
        console.log('💡 Now run: npm run db:push to create the actual tables');

    } catch (error) {
        console.error('❌ Schema setup failed:', error);
        throw error;
    }
}

setupSchema();