import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { settings } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
    try {
        const result = await db.execute(sql`
      SELECT * FROM settings ORDER BY id LIMIT 1
    `);

        if (result.rows.length === 0) {
            // Create default settings if none exist
            const defaultSettings = await db.execute(sql`
        INSERT INTO settings (bin, taxpayer_name, address, vat_rate_default, currency, tests_per_kit_default, simple_chalan_threshold)
        VALUES ('004223577-0205', 'M S RAHMAN TRADERS', '174. Siddique Bazar, Dhaka', 0.15, 'BDT', 120, 200000)
        RETURNING *
      `);
            return NextResponse.json(defaultSettings.rows[0]);
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            bin,
            taxpayerName,
            address,
            vatRateDefault,
            currency,
            testsPerKitDefault,
            simpleChalanThreshold
        } = body;

        if (!bin?.trim() || !taxpayerName?.trim() || !address?.trim()) {
            return NextResponse.json(
                { error: 'BIN, taxpayer name, and address are required' },
                { status: 400 }
            );
        }

        // Check if settings exist
        const existingSettings = await db.execute(sql`
      SELECT id FROM settings ORDER BY id LIMIT 1
    `);

        let result;
        if (existingSettings.rows.length === 0) {
            // Create new settings
            result = await db.execute(sql`
        INSERT INTO settings (bin, taxpayer_name, address, vat_rate_default, currency, tests_per_kit_default, simple_chalan_threshold)
        VALUES (${bin}, ${taxpayerName}, ${address}, ${parseFloat(vatRateDefault)}, ${currency}, ${testsPerKitDefault}, ${parseFloat(simpleChalanThreshold)})
        RETURNING *
      `);
        } else {
            // Update existing settings
            result = await db.execute(sql`
        UPDATE settings SET
          bin = ${bin},
          taxpayer_name = ${taxpayerName},
          address = ${address},
          vat_rate_default = ${parseFloat(vatRateDefault)},
          currency = ${currency},
          tests_per_kit_default = ${testsPerKitDefault},
          simple_chalan_threshold = ${parseFloat(simpleChalanThreshold)},
          updated_at = NOW()
        WHERE id = ${existingSettings.rows[0].id}
        RETURNING *
      `);
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}