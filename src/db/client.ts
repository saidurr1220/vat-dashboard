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
    // Neon-specific settings optimized for serverless
    max: 5, // Smaller pool for better connection management
    min: 0, // Allow pool to scale to zero
    idleTimeoutMillis: 10000, // Shorter idle timeout
    connectionTimeoutMillis: 15000, // Longer connection timeout
    // SSL is required for Neon
    ssl: getDatabaseUrl().includes('neon.tech') ? { rejectUnauthorized: false } :
        process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
