# Monthly Bulk Sale Feature

## Overview

এই feature টি আপনাকে পুরো মাসের cash sales একটি bulk invoice এ record করতে দেয়। এটি বিশেষভাবে cash customers এর জন্য যাদের individual tracking প্রয়োজন নেই।

## Key Features

### 1. **Monthly Bulk Invoice Creation**

- একটি মাস select করে সেই মাসের সব cash sales একসাথে record করুন
- Automatic invoice numbering: `BULK-[next_invoice_no]`
- Customer name automatically set হয় month অনুযায়ী (e.g., "Monthly Cash Sales - October 2025")

### 2. **Product Management**

- Current stock থেকে products select করুন
- Real-time stock checking
- Same product multiple times add করলে quantity automatically merge হয়
- **Price Input Options**:
  - Default price: Product এর standard selling price ব্যবহার করুন
  - Custom price: Manual price input করার option
  - Price memory: Previous prices এর history দেখুন
- Editable quantity এবং unit price (inline editing)

### 3. **VAT Calculation**

- VAT Exclusive (default): 15% VAT automatically added
- VAT Inclusive: VAT already included in price
- Real-time calculation display

### 4. **Stock Management**

- Stock automatically deducted when sale is created
- Footwear products: BOE lots থেকে FIFO basis এ deduct
- Other products: Stock ledger এ entry

## How to Use

### Step 1: Access Monthly Bulk Sale

- Navigate to **Sales** → **Monthly Bulk Sale**
- Or use sidebar: **Monthly Bulk Sale**

### Step 2: Set Month & Invoice Details

- Select the month for which you're creating bulk sale
- Invoice number auto-generated (can be edited)
- Choose VAT type (Exclusive recommended)
- Add notes if needed

### Step 3: Add Products

- Select product from dropdown (shows current stock)
- Enter quantity sold in that month
- **Choose Price Option**:
  - Keep default price (product's standard selling price)
  - Enable "Custom Price" checkbox to input manual price
  - View last used price in price memory
- Click "Add Product"
- Repeat for all products sold in that month

### Step 4: Review & Submit

- Review all line items
- Edit quantities/prices if needed
- Check total calculations
- Click "Create Monthly Sale"

## Benefits

### 1. **Simplified Cash Sales Tracking**

- No need to create individual invoices for each cash customer
- Track monthly sales volume by product
- Maintain proper VAT records

### 2. **Stock Accuracy**

- Stock levels automatically updated
- Proper inventory tracking
- Historical sales data maintained

### 3. **VAT Compliance**

- Proper VAT calculation and recording
- Monthly sales reports
- Audit trail maintained

### 4. **Time Saving**

- Bulk entry instead of individual sales
- Automatic calculations
- Streamlined process

## Example Use Case

**Scenario**: আপনার October 2025 এ cash sales হয়েছে:

- Product A: 50 pairs @ 500 tk each
- Product B: 30 pairs @ 750 tk each
- Product C: 20 pairs @ 1000 tk each

**Process**:

1. Select "2025-10" as month
2. Add Product A, qty: 50 (default price: 500 tk)
3. Add Product B, qty: 30 (custom price: 800 tk instead of 750 tk)
4. Add Product C, qty: 20 (default price: 1000 tk)
5. Review total: 69,000 tk + VAT = 79,350 tk
6. Submit

**Result**:

- One invoice: "BULK-001"
- Customer: "Monthly Cash Sales - October 2025"
- Stock automatically deducted
- VAT properly calculated and recorded

## Technical Details

### Database Impact

- Creates one sale record with `isMonthlyBulk: true` flag
- Multiple sale lines for each product
- Stock ledger entries for inventory tracking
- Proper VAT calculations stored

### API Endpoints Used

- `POST /api/sales` - Creates the bulk sale
- `GET /api/products` - Fetches available products
- `GET /api/sales/next-invoice` - Gets next invoice number

### File Locations

- Page: `src/app/sales/monthly/page.tsx`
- API: `src/app/api/sales/route.ts` (enhanced)
- Navigation: `src/components/ModernNavigation.tsx`

## Notes

- Sale date is set to last day of selected month
- Customer ID is null (no specific customer)
- Notes automatically include "Monthly bulk cash sales - Bulk Invoice"
- Stock checking ensures no overselling
