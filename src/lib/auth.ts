import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import * as argon2 from 'argon2';
import { UAParser } from 'ua-parser-js';
import { db } from '@/db/client';
import { users, auditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'change_me_in_production'
);

const COOKIE_NAME = process.env.COOKIE_NAME || 'auth';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

export interface AuthUser {
    uid: number;
    email: string;
    role: 'ADMIN' | 'USER';
}

export interface AuthSession {
    user: AuthUser;
    csrfToken: string;
}

// JWT utilities
export async function signJwt(payload: any): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRES_IN)
        .sign(JWT_SECRET);
}

export async function verifyJwt(token: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
    // Temporarily disable pepper for debugging
    // const pepper = process.env.PEPPER || '';
    return await argon2.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
        // Temporarily disable pepper for debugging
        // const pepper = process.env.PEPPER || '';
        return await argon2.verify(hash, password);
    } catch (error) {
        return false;
    }
}

// Session management
export async function getSession(): Promise<AuthSession | null> {
    try {
        const cookieStore = await cookies();
        const authCookie = cookieStore.get(COOKIE_NAME);
        const csrfCookie = cookieStore.get('csrf');

        if (!authCookie?.value || !csrfCookie?.value) {
            return null;
        }

        const payload = await verifyJwt(authCookie.value);
        if (!payload) {
            return null;
        }

        // Verify user still exists and is active
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, payload.uid))
            .limit(1);

        if (!user || !user.isActive) {
            return null;
        }

        return {
            user: {
                uid: user.id,
                email: user.email,
                role: user.role as 'ADMIN' | 'USER'
            },
            csrfToken: csrfCookie.value
        };
    } catch (error) {
        console.error('Session verification error:', error);
        return null;
    }
}

// Generate CSRF token
export function generateCsrfToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Set auth cookies
export function setAuthCookies(response: NextResponse, token: string, csrfToken: string) {
    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 2 * 60 * 60, // 2 hours
        ...(COOKIE_DOMAIN && { domain: COOKIE_DOMAIN })
    };

    response.cookies.set(COOKIE_NAME, token, cookieOptions);
    response.cookies.set('csrf', csrfToken, {
        ...cookieOptions,
        httpOnly: false // CSRF token needs to be readable by client
    });
}

// Clear auth cookies
export function clearAuthCookies(response: NextResponse) {
    const cookieOptions = {
        path: '/',
        maxAge: 0,
        ...(COOKIE_DOMAIN && { domain: COOKIE_DOMAIN })
    };

    response.cookies.set(COOKIE_NAME, '', cookieOptions);
    response.cookies.set('csrf', '', cookieOptions);
}

// Audit logging
export async function logAudit(
    userId: number,
    action: string,
    resource: string,
    meta: any,
    request: NextRequest
) {
    try {
        const ua = new UAParser(request.headers.get('user-agent') || '');
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        await db.insert(auditLogs).values({
            userId,
            action,
            resource,
            meta: JSON.stringify(meta),
            ip,
            ua: ua.getResult().ua || 'unknown'
        });
    } catch (error) {
        console.error('Audit logging failed:', error);
    }
}

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60000): boolean {
    const now = Date.now();
    const key = `rate_limit:${ip}`;

    const current = rateLimitMap.get(key);

    if (!current || now > current.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (current.count >= maxRequests) {
        return false;
    }

    current.count++;
    return true;
}

// Admin guard middleware
export function requireAdmin(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
        try {
            // Emergency bypass for development
            if (process.env.DISABLE_AUTH === 'true') {
                console.warn('⚠️  AUTH DISABLED - All requests allowed');
                return handler(request);
            }

            // Check if it's a write operation
            const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);

            if (!isWriteOperation) {
                return handler(request);
            }

            // Get session
            const session = await getSession();

            if (!session) {
                return NextResponse.json(
                    { error: 'Authentication required' },
                    { status: 401 }
                );
            }

            // Check admin role
            if (session.user.role !== 'ADMIN') {
                return NextResponse.json(
                    { error: 'Admin access required' },
                    { status: 403 }
                );
            }

            // Verify CSRF token for write operations
            const csrfHeader = request.headers.get('x-csrf-token');
            if (!csrfHeader || csrfHeader !== session.csrfToken) {
                return NextResponse.json(
                    { error: 'Invalid CSRF token' },
                    { status: 403 }
                );
            }

            // Add user info to request for audit logging
            (request as any).user = session.user;

            const response = await handler(request);

            // Log successful write operations
            if (response.status < 400) {
                const url = new URL(request.url);
                await logAudit(
                    session.user.uid,
                    request.method,
                    url.pathname,
                    { status: response.status },
                    request
                );
            }

            return response;
        } catch (error) {
            console.error('Auth middleware error:', error);
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
    };
}