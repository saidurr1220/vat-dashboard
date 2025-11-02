import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { treasuryChallans } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const summary = searchParams.get('summary');

        if (summary === 'true') {
            // Return summary data for dashboard
            const result = await db.execute(sql`
        SELECT 
          token_no,
          amount_bdt,
          date,
          bank,
          period_year,
          period_month
        FROM treasury_challans 
        ORDER BY date DESC
      `);

            return NextResponse.json(result.rows);
        }

        // Regular treasury data fetch
        const challans = await db.select().from(treasuryChallans).orderBy(treasuryChallans.date);
        return NextResponse.json(challans);
    } catch (error) {
        console.error('Error fetching treasury data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch treasury data' },
            { status: 500 }
        );
    }
}