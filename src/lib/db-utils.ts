import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

// Retry function for database operations
export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error');

            console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, lastError.message);

            if (attempt === maxRetries) {
                throw lastError;
            }

            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
    }

    throw lastError!;
}

// Test database connectivity
export async function testConnection(): Promise<boolean> {
    try {
        await withRetry(async () => {
            const result = await db.execute(sql`SELECT 1 as test`);
            return result;
        });
        return true;
    } catch (error) {
        console.error('Database connection test failed:', error);
        return false;
    }
}

// Safe database query wrapper
export async function safeQuery<T>(
    queryFn: () => Promise<T>,
    fallback: T
): Promise<T> {
    try {
        return await withRetry(queryFn);
    } catch (error) {
        console.error('Database query failed, using fallback:', error);
        return fallback;
    }
}