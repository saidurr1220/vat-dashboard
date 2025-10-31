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
    // Optimized settings for better performance
    max: 3, // Smaller pool for Neon's connection limits
    min: 0, // Allow pool to scale to zero
    idleTimeoutMillis: 5000, // Shorter idle timeout for faster cleanup
    connectionTimeoutMillis: 10000, // Shorter connection timeout
    acquireTimeoutMillis: 8000, // Timeout for acquiring connections
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
