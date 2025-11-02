import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, getSession, logAudit } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Get current session for audit logging
        const session = await getSession();

        const response = NextResponse.json({ success: true });
        clearAuthCookies(response);

        // Log logout if user was authenticated
        if (session) {
            await logAudit(
                session.user.uid,
                'LOGOUT',
                '/api/auth/logout',
                { success: true },
                request
            );
        }

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        const response = NextResponse.json({ success: true }); // Always succeed logout
        clearAuthCookies(response);
        return response;
    }
}

// Only allow POST requests
export async function GET() {
    return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
    );
}