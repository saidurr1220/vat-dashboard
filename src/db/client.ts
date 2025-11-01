import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Get database URL with fallback
const getDatabaseUrl = () => {
    return process.env.DATABASE_URL ||
        process.env.POSTGRES_URL ||
        'postgresql://postgres:2155@127.0.0.1:5432/mydb';
};

// Enhanced Neon-optimized connection pool configuration
const pool = new Pool({
    connectionString: getDatabaseUrl(),
    // Optimized settings for Vercel/Neon deployment
    max: process.env.NODE_ENV === 'production' ? 1 : 3, // Single connection for serverless
    min: 0, // Allow pool to scale to zero
    idleTimeoutMillis: process.env.NODE_ENV === 'production' ? 1000 : 5000,
    connectionTimeoutMillis: 10000, // Longer timeout for cold starts
    // SSL configuration for Neon
    ssl: getDatabaseUrl().includes('neon.tech') || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Database pool error:', err);
});

pool.on('connect', () => {
    console.log('Database connection established');
});

export const db = drizzle(pool, { schema });

// Export pool for direct access if needed
export { pool };
