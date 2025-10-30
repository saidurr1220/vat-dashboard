# New Features Added

## 1. Customer Management

- **Customer Database**: New customers table with name, address, phone, BIN, NID fields
- **Customer Selection**: Dropdown in sales form to select existing customers
- **New Customer Form**: Add new customers directly from sales form
- **Customer List Page**: View and manage all customers at `/customers`

## 2. Enhanced Sales Features

- **Auto Invoice Numbers**: Automatically generates sequential invoice numbers (INV-000001, etc.)
- **Stock Validation**: Shows current stock while selling, prevents overselling
- **Customer Integration**: Links sales to customer records
- **Print Invoice**: Professional invoice layout with print functionality
- **Sales History**: Comprehensive sales history with filtering by year/month
- **Fixed Sales View**: Proper sales listing with customer information

## 3. Stock Management Improvements

- **Current Stock Display**: Shows available stock when selecting products
- **Stock Validation**: Prevents selling more than available stock
- **Stock Summary**: Dashboard widget showing total stock values with corrected calculations
- **Stock Value Calculation**: Uses weighted average cost from actual stock movements
- **Stock Adjustment**: Manual stock adjustment page for corrections

## 4. Product Management

- **Product Edit**: Full product editing functionality at `/products/[id]/edit`
- **Stock Adjustment Page**: Dedicated page for stock level adjustments at `/products/stock/adjust`
- **Improved Stock Calculations**: Uses actual costs from stock ledger entries

## 5. Invoice & Printing

- **Professional Invoice Layout**: Clean, printable invoice format
- **Customer Details**: Shows customer address, phone, BIN, NID on invoice
- **Print Optimization**: Print-friendly CSS with proper margins
- **Invoice Numbering**: Sequential auto-generated invoice numbers

## 6. API Enhancements

- **Customer API**: CRUD operations for customers
- **Enhanced Sales API**: Handles customer creation and stock updates
- **Stock Summary API**: Corrected stock valuation using weighted average costs
- **Invoice Number API**: Generates next available invoice number
- **Sales History API**: Filtered sales data with analytics
- **Product Edit API**: Full product CRUD operations

## 7. Dashboard Improvements

- **Stock Summary Widget**: Shows total stock values and VAT (corrected calculations)
- **Real-time Data**: Updated stock and sales information
- **VAT Calculations**: Proper VAT computation for all transactions

## 8. Historical Data Support

- **Sales History Page**: View historical sales with filtering at `/sales/history`
- **Analytics**: Sales summaries and statistics
- **Sample Data**: Script to add sample historical sales data

## Fixed Issues

- **Stock Value Calculation**: Now uses weighted average cost from actual stock movements instead of fixed product costs
- **Sales View**: Fixed broken sales view functionality
- **Stock Display**: Shows current stock levels during product selection
- **Customer Integration**: Proper customer linking and display

## Database Changes Required

1. Run `scripts/add-customers-table.sql` to add customers table
2. Optionally run `scripts/add-sample-sales.sql` for sample historical data

## Usage

1. Navigate to Sales → New Sale
2. Select existing customer or add new customer
3. Add products (stock levels are shown and validated)
4. System prevents overselling with real-time stock checks
5. Generate invoice with auto-number
6. Print professional invoice with customer details
7. View sales history with comprehensive filtering
8. Edit products and adjust stock levels
9. Monitor accurate stock values on dashboard
