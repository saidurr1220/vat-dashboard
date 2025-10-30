import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { treasuryChallans } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
    try {
        const challans = await db
            .select()
            .from(treasuryChallans)
            .orderBy(desc(treasuryChallans.date));

        return NextResponse.json(challans);
    } catch (error) {
        console.error('Error fetching treasury challans:', error);
        return NextResponse.json(
            { error: 'Failed to fetch treasury challans' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const {
            tokenNo,
            bank,
            branch,
            date,
            accountCode,
            amountBdt,
            periodYear,
            periodMonth
        } = await request.json();

        if (!tokenNo || !amountBdt) {
            return NextResponse.json(
                { error: 'Token number and amount are required' },
                { status: 400 }
            );
        }

        const newChallan = await db
            .insert(treasuryChallans)
            .values({
                tokenNo,
                bank: bank || 'Sonali Bank Ltd.',
                branch: branch || 'Local Office',
                date: new Date(date),
                accountCode: accountCode || '1/1143/0016/0311',
                amountBdt: amountBdt.toString(),
                periodYear: periodYear || new Date().getFullYear(),
                periodMonth: periodMonth || new Date().getMonth() + 1,
            })
            .returning();

        return NextResponse.json(newChallan[0]);
    } catch (error) {
        console.error('Error creating treasury challan:', error);
        return NextResponse.json(
            { error: 'Failed to create treasury challan' },
            { status: 500 }
        );
    }
}