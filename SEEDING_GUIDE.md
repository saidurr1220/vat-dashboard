# BoE Data Seeding Guide

This guide explains how to seed your Neon database with the BoE (Bill of Entry) data from the `footwear_boe_import.json` file.

## Prerequisites

1. Ensure your Neon database is set up and connected
2. Make sure all database schemas are migrated
3. Have the `footwear_boe_import.json` file in your project root

## Seeding Methods

### Method 1: Command Line (Recommended)

Run the seeding script directly:

```bash
npm run seed:boe
```

Or use the Node.js wrapper:

```bash
node seed-boe.js
```

### Method 2: Web Interface

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Navigate to the Footwear System: `http://localhost:3000/footwear`

3. Go to the "Import/Export" tab

4. Click the "Seed Database" button in the Quick Import section

### Method 3: API Endpoint

Make a POST request to the seeding endpoint:

```bash
curl -X POST http://localhost:3000/api/seed/boe
```

## What Gets Seeded

The seeding process will:

1. **Create Products**: Automatically create footwear products from BoE descriptions
2. **Import BoE Records**: Add entries to the `imports_boe` table
3. **Create BoE Lots**: Set up FIFO tracking lots in the `boe_lots` table
4. **Update Stock Ledger**: Add stock movements to the `stock_ledger` table
5. **Create Product Aliases**: Add normalized product names for better matching

## Data Structure

The JSON file contains BoE entries with the following structure:

```json
{
  "BoEDate": "2024-01-01",
  "BoENumber": 10433,
  "BoEItemNo": 3,
  "Description": "LADIES KEDS SZ 37-41 G.B NM",
  "HS": "6405.90.00",
  "Base": 806497.8,
  "SD": 250292.4,
  "UnitPurchase": 297.94,
  "Category": "ladies",
  "Month": "2024-01",
  "CartonSize": 90,
  "PairsFinal": 3300,
  "DeclaredUnitValue": 417.116
}
```

## Expected Results

After successful seeding, you should see:

- **Products**: New footwear products created with proper categorization
- **Stock**: Inventory levels updated with imported quantities
- **BoE Tracking**: Full FIFO cost tracking for footwear items
- **VAT Calculations**: Proper VAT calculations based on import costs

## Verification

1. Check the Products page: `http://localhost:3000/products`
2. View the Footwear System: `http://localhost:3000/footwear`
3. Inspect individual product BoE data by clicking on footwear products

## Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Verify your `.env.local` file has the correct `DATABASE_URL`
   - Ensure your Neon database is accessible

2. **Schema Not Found**

   - Run database migrations: `npm run db:push`
   - Ensure footwear schema is set up

3. **Duplicate Data**

   - The seeding process skips duplicates automatically
   - Check the console output for skipped entries

4. **File Not Found**
   - Ensure `footwear_boe_import.json` is in the project root
   - For web interface, the file should also be in the `public/` directory

### Logs and Debugging

The seeding process provides detailed logs:

- ✅ Successfully imported entries
- ⚠️ Skipped duplicates
- ❌ Errors with specific row numbers
- 📊 Final statistics

## Database Tables Affected

- `products` - New footwear products
- `imports_boe` - BoE import records
- `boe_lots` - FIFO tracking lots
- `stock_ledger` - Stock movements
- `product_aliases` - Product name normalization
- `audit_log` - Import audit trail

## Performance

The seeding process handles:

- **55 BoE entries** from the sample file
- **Automatic product creation** for new items
- **Duplicate detection** to prevent data conflicts
- **Transaction safety** for data integrity

## Next Steps

After seeding:

1. Explore the Footwear System dashboard
2. Check individual product BoE histories
3. Verify VAT calculations
4. Test the import/export functionality

## Support

If you encounter issues:

1. Check the console logs for detailed error messages
2. Verify your database connection
3. Ensure all required environment variables are set
4. Review the audit log in the database for import history
