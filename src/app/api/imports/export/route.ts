import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { importsBoe } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
    try {
        const importsData = await db
            .select()
            .from(importsBoe)
            .orderBy(desc(importsBoe.boeDate));

        // Create CSV content
        const headers = [
            'BoE No',
            'BoE Date',
            'Office Code',
            'Item No',
            'HS Code',
            'Description',
            'Assessable Value',
            'Base VAT',
            'SD',
            'VAT',
            'AT',
            'Qty',
            'Unit'
        ];

        const csvRows = [
            headers.join(','),
            ...importsData.map(record => [
                `"${record.boeNo || ''}"`,
                `"${record.boeDate ? new Date(record.boeDate).toISOString().split('T')[0] : ''}"`,
                `"${record.officeCode || ''}"`,
                `"${record.itemNo || ''}"`,
                `"${record.hsCode || ''}"`,
                `"${(record.description || '').replace(/"/g, '""')}"`,
                `"${record.assessableValue || 0}"`,
                `"${record.baseVat || 0}"`,
                `"${record.sd || 0}"`,
                `"${record.vat || 0}"`,
                `"${record.at || 0}"`,
                `"${record.qty || 0}"`,
                `"${record.unit || ''}"`
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');

        // Create response with CSV content
        const response = new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="imports_boe_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });

        return response;
    } catch (error) {
        console.error('Error exporting imports:', error);
        return NextResponse.json(
            { error: 'Failed to export imports data' },
            { status: 500 }
        );
    }
}