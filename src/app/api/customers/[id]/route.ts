import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { customers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = parseInt(id);

        const customer = await db
            .select()
            .from(customers)
            .where(eq(customers.id, customerId))
            .limit(1);

        if (customer.length === 0) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(customer[0]);
    } catch (error) {
        console.error('Error fetching customer:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customer' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = parseInt(id);
        const body = await request.json();

        const { name, address, phone, bin, nid } = body;

        if (!name?.trim()) {
            return NextResponse.json(
                { error: 'Customer name is required' },
                { status: 400 }
            );
        }

        const updatedCustomer = await db
            .update(customers)
            .set({
                name: name.trim(),
                address: address?.trim() || null,
                phone: phone?.trim() || null,
                bin: bin?.trim() || null,
                nid: nid?.trim() || null,
                updatedAt: new Date(),
            })
            .where(eq(customers.id, customerId))
            .returning();

        if (updatedCustomer.length === 0) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedCustomer[0]);
    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json(
            { error: 'Failed to update customer' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const customerId = parseInt(id);

        const deletedCustomer = await db
            .delete(customers)
            .where(eq(customers.id, customerId))
            .returning();

        if (deletedCustomer.length === 0) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting customer:', error);
        return NextResponse.json(
            { error: 'Failed to delete customer' },
            { status: 500 }
        );
    }
}