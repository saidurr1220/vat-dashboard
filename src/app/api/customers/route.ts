import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { customers } from '@/db/schema';
import { eq, ilike, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        let customerList;

        if (search) {
            customerList = await db
                .select()
                .from(customers)
                .where(
                    or(
                        ilike(customers.name, `%${search}%`),
                        ilike(customers.phone, `%${search}%`),
                        ilike(customers.bin, `%${search}%`)
                    )
                )
                .limit(50);
        } else {
            customerList = await db
                .select()
                .from(customers)
                .limit(50);
        }

        return NextResponse.json(customerList);
    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customers' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { name, address, phone, bin, nid } = await request.json();

        if (!name?.trim()) {
            return NextResponse.json(
                { error: 'Customer name is required' },
                { status: 400 }
            );
        }

        const newCustomer = await db
            .insert(customers)
            .values({
                name: name.trim(),
                address: address?.trim() || null,
                phone: phone?.trim() || null,
                bin: bin?.trim() || null,
                nid: nid?.trim() || null,
            })
            .returning();

        return NextResponse.json(newCustomer[0]);
    } catch (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json(
            { error: 'Failed to create customer' },
            { status: 500 }
        );
    }
}