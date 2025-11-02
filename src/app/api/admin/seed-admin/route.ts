import { NextRequest, NextResponse } from 'next/server';
import { seedAdmin } from '../../../../../scripts/seed-admin';

export async function POST(request: NextRequest) {
    try {
        // Only allow in development or with specific header
        if (process.env.NODE_ENV === 'production') {
            const authHeader = request.headers.get('x-admin-seed-key');
            if (authHeader !== process.env.ADMIN_SEED_KEY) {
                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
        }

        await seedAdmin();

        return NextResponse.json({
            success: true,
            message: 'Admin user seeded successfully'
        });
    } catch (error) {
        console.error('Admin seed error:', error);
        return NextResponse.json(
            { error: 'Failed to seed admin user' },
            { status: 500 }
        );
    }
}