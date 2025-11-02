import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    // CORS handling
    const origin = request.headers.get('origin');
    const productionOrigin = process.env.PRODUCTION_ORIGIN;

    // Allow requests from production origin or same origin
    const allowedOrigins = [
        productionOrigin,
        'http://localhost:3000',
        'https://localhost:3000'
    ].filter(Boolean);

    const response = NextResponse.next();

    // Set CORS headers for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        if (origin && allowedOrigins.includes(origin)) {
            response.headers.set('Access-Control-Allow-Origin', origin);
        }

        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, DELETE, OPTIONS'
        );
        response.headers.set(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, x-csrf-token'
        );

        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 200, headers: response.headers });
        }
    }

    // Redirect /admin to /admin/login if not authenticated
    if (request.nextUrl.pathname === '/admin') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Add security headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

export const config = {
    matcher: [
        '/api/:path*',
        '/admin/:path*'
    ]
};