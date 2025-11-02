import { pgTable, serial, text, integer, timestamp, numeric, pgEnum, boolean, jsonb, unique, index } from "drizzle-orm/pg-core";

// Enums
export const amountTypeEnum = pgEnum("amount_type", ["INCL", "EXCL"]);
export const paymentMethodEnum = pgEnum("payment_method", ["CASH", "BANK", "CARD", "MOBILE"]);
export const refTypeEnum = pgEnum("ref_type", ["OPENING", "IMPORT", "SALE", "ADJUST"]);
export const categoryEnum = pgEnum("category", ["Footwear", "Fan", "BioShield", "Instrument", "Appliance Parts", "Reagent"]);
export const roleEnum = pgEnum("role", ["ADMIN", "USER"]);

// Settings table (singleton)
export const settings = pgTable("settings", {
    id: serial("id").primaryKey(),
    bin: text("bin").notNull(),
    taxpayerName: text("taxpayer_name").notNull(),
    address: text("address").notNull(),
    vatRateDefault: numeric("vat_rate_default", { precision: 5, scale: 4 }).notNull().default("0.15"),
    currency: text("currency").notNull().default("BDT"),
    testsPerKitDefault: integer("tests_per_kit_default").notNull().default(120),
    simpleChalanThreshold: numeric("simple_chalan_threshold").notNull().default("200000"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
});

// Products table
export const products = pgTable("products", {
    id: serial("id").primaryKey(),
    sku: text("sku"),
    name: text("name").notNull(),
    hsCode: text("hs_code"),
    category: categoryEnum("category"),
    unit: text("unit").notNull(),
    testsPerKit: integer("tests_per_kit"), // for BioShield products
    costExVat: numeric("cost_ex_vat"),
    sellExVat: numeric("sell_ex_vat"),
    stockOnHand: numeric("stock_on_hand").default("0").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
    skuIdx: index("products_sku_idx").on(table.sku),
    categoryIdx: index("products_category_idx").on(table.category),
    hsCodeIdx: index("products_hs_code_idx").on(table.hsCode)
}));

// Import entries from BoE
export const importsBoe = pgTable("imports_boe", {
    id: serial("id").primaryKey(),
    boeNo: text("boe_no").notNull(),
    boeDate: timestamp("boe_date").notNull(),
    officeCode: text("office_code"),
    itemNo: text("item_no").notNull(),
    hsCode: text("hs_code"),
    description: text("description"),
    assessableValue: numeric("assessable_value"),
    baseVat: numeric("base_vat"),
    sd: numeric("sd"),
    vat: numeric("vat"),
    at: numeric("at"),
    qty: numeric("qty"),
    unit: text("unit"),
    createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
    boeItemUnique: unique("imports_boe_no_item_unique").on(table.boeNo, table.itemNo),
    boeNoIdx: index("imports_boe_no_idx").on(table.boeNo),
    boeDateIdx: index("imports_boe_date_idx").on(table.boeDate),
    hsCodeIdx: index("imports_hs_code_idx").on(table.hsCode)
}));

// Stock ledger table
export const stockLedger = pgTable("stock_ledger", {
    id: serial("id").primaryKey(),
    dt: timestamp("dt").notNull(),
    productId: integer("product_id").notNull().references(() => products.id),
    refType: refTypeEnum("ref_type").notNull(),
    refNo: text("ref_no"),
    qtyIn: numeric("qty_in").default("0"),
    qtyOut: numeric("qty_out").default("0"),
    unitCostExVat: numeric("unit_cost_ex_vat"),
    createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
    productDateIdx: index("stock_ledger_product_date_idx").on(table.productId, table.dt),
    refTypeIdx: index("stock_ledger_ref_type_idx").on(table.refType)
}));

// Sales table
export const sales = pgTable("sales", {
    id: serial("id").primaryKey(),
    invoiceNo: text("invoice_no").notNull(),
    dt: timestamp("dt").notNull(),
    customer: text("customer").notNull(),
    customerId: integer("customer_id").references(() => customers.id),
    createdBy: integer("created_by").references(() => users.id),
    totalValue: numeric("total_value").notNull(),
    amountType: amountTypeEnum("amount_type").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
    invoiceNoUnique: unique("sales_invoice_no_unique").on(table.invoiceNo),
    dtIdx: index("sales_dt_idx").on(table.dt)
}));

// Sales lines table
export const salesLines = pgTable("sales_lines", {
    id: serial("id").primaryKey(),
    saleId: integer("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id),
    unit: text("unit").notNull(),
    qty: numeric("qty").notNull(),
    unitPriceValue: numeric("unit_price_value").notNull(),
    amountType: amountTypeEnum("amount_type").notNull(),
    lineTotalCalc: numeric("line_total_calc").notNull()
}, (table) => ({
    saleProductUnique: unique("sales_lines_sale_product_unique").on(table.saleId, table.productId),
    saleIdIdx: index("sales_lines_sale_id_idx").on(table.saleId)
}));

// Treasury challans table
export const treasuryChallans = pgTable("treasury_challans", {
    id: serial("id").primaryKey(),
    voucherNo: text("voucher_no"),
    tokenNo: text("token_no").notNull(),
    bank: text("bank").notNull(),
    branch: text("branch").notNull(),
    date: timestamp("date").notNull(),
    accountCode: text("account_code").notNull(),
    amountBdt: numeric("amount_bdt").notNull(),
    periodYear: integer("period_year").notNull(),
    periodMonth: integer("period_month").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
    voucherNoUnique: unique("treasury_challans_voucher_no_unique").on(table.voucherNo),
    periodIdx: index("treasury_challans_period_idx").on(table.periodYear, table.periodMonth)
}));

// VAT ledger table
export const vatLedger = pgTable("vat_ledger", {
    id: serial("id").primaryKey(),
    periodYear: integer("period_year").notNull(),
    periodMonth: integer("period_month").notNull(),
    grossSales: numeric("gross_sales").notNull(),
    netSalesExVat: numeric("net_sales_ex_vat").notNull(),
    vatRate: numeric("vat_rate", { precision: 5, scale: 4 }).notNull(),
    vatPayable: numeric("vat_payable").notNull(),
    usedFromClosingBalance: numeric("used_from_closing_balance").notNull().default("0"),
    treasuryNeeded: numeric("treasury_needed").notNull().default("0"),
    locked: boolean("locked").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
    periodUnique: unique("vat_ledger_period_unique").on(table.periodYear, table.periodMonth)
}));

// Closing balance table - like bank statement
export const closingBalance = pgTable("closing_balance", {
    id: serial("id").primaryKey(),
    periodYear: integer("period_year").notNull(),
    periodMonth: integer("period_month").notNull(),
    openingBalance: numeric("opening_balance").notNull().default("0"), // Previous month's closing
    currentMonthAddition: numeric("current_month_addition").notNull().default("0"), // This month's addition
    usedAmount: numeric("used_amount").notNull().default("0"), // Amount used this month
    closingBalance: numeric("closing_balance").notNull().default("0"), // Final balance
    notes: text("notes"), // For tracking source of additions
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
    periodUnique: unique("closing_balance_period_unique").on(table.periodYear, table.periodMonth)
}));

// Customers table
export const customers = pgTable("customers", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    address: text("address"),
    phone: text("phone"),
    bin: text("bin"),
    nid: text("nid"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
    nameIdx: index("customers_name_idx").on(table.name),
    binIdx: index("customers_bin_idx").on(table.bin)
}));

// Staging table for raw imports
export const stagingRaw = pgTable("staging_raw", {
    id: serial("id").primaryKey(),
    source: text("source").notNull(),
    rowHash: text("row_hash").notNull(),
    payload: jsonb("payload").notNull(),
    importedAt: timestamp("imported_at").defaultNow()
}, (table) => ({
    rowHashUnique: unique("staging_raw_row_hash_unique").on(table.rowHash),
    sourceIdx: index("staging_raw_source_idx").on(table.source)
}));

// Price memory table for remembering last used prices
export const priceMemory = pgTable("price_memory", {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => products.id),
    lastPrice: numeric("last_price", { precision: 10, scale: 2 }).notNull(),
    lastUsed: timestamp("last_used").defaultNow(),
    createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
    productIdUnique: unique("price_memory_product_id_unique").on(table.productId),
    lastUsedIdx: index("price_memory_last_used_idx").on(table.lastUsed)
}));

// Users table for authentication
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("ADMIN"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
    emailIdx: index("users_email_idx").on(table.email)
}));

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id),
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    meta: jsonb("meta"),
    ip: text("ip"),
    ua: text("ua"),
    createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt)
}));