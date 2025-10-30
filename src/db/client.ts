import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Get database URL with fallback
const getDatabaseUrl = () => {
    return process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        'postgresql://postgres:2155@127.0.0.1:5432/mydb';
};

// Neon-optimized connection pool configuration
const pool = new Pool({
    connectionString: getDatabaseUrl(),
    // Neon-specific settings
    max: 10, // Neon works well with smaller pools
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 10000,
    // SSL is required for Neon
    ssl: getDatabaseUrl().includes('neon.tech') ? { rejectUnauthorized: false } :
        process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
