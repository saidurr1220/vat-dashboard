import { pgTable, serial, text, integer, timestamp, numeric, boolean, date, unique, index, foreignKey } from "drizzle-orm/pg-core";

// Product Groups for merging similar products
export const productGroups = pgTable("product_groups", {
    id: serial("id").primaryKey(),
    groupName: text("group_name").notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
});

// Product Group Members (many-to-many with products)
export const productGroupMembers = pgTable("product_group_members", {
    id: serial("id").primaryKey(),
    groupId: integer("group_id").notNull().references(() => productGroups.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").default(false),
    createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
    groupProductUnique: unique("group_product_unique").on(table.groupId, table.productId),
    groupIdIdx: index("product_group_members_group_id_idx").on(table.groupId),
    productIdIdx: index("product_group_members_product_id_idx").on(table.productId)
}));

// Product Aliases for BoE description normalization
export const productAliases = pgTable("product_aliases", {
    id: serial("id").primaryKey(),
    aliasText: text("alias_text").notNull(),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
    aliasTextIdx: index("product_aliases_alias_text_idx").on(table.aliasText),
    productIdIdx: index("product_aliases_product_id_idx").on(table.productId)
}));

// BoE Lots (FIFO stock tracking)
export const boeLots = pgTable("boe_lots", {
    id: serial("id").primaryKey(),
    lotId: text("lot_id").notNull().unique(), // BoENumber-BoEItemNo
    boeNumber: integer("boe_number").notNull(),
    boeItemNo: integer("boe_item_no").notNull(),
    boeDate: date("boe_date").notNull(),
    productId: integer("product_id").notNull().references(() => products.id),
    description: text("description").notNull(),
    hsCode: text("hs_code"),
    baseValue: numeric("base_value", { precision: 12, scale: 2 }),
    sdValue: numeric("sd_value", { precision: 12, scale: 2 }),
    unitPurchaseCost: numeric("unit_purchase_cost", { precision: 10, scale: 2 }),
    category: text("category").notNull(),
    month: text("month").notNull(), // YYYY-MM format
    cartonSize: integer("carton_size"),
    openingPairs: integer("opening_pairs").notNull(),
    closingPairs: integer("closing_pairs").notNull(),
    declaredUnitValue: numeric("declared_unit_value", { precision: 10, scale: 4 }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
    boeNumberItemIdx: index("boe_lots_boe_number_item_idx").on(table.boeNumber, table.boeItemNo),
    boeDateIdx: index("boe_lots_boe_date_idx").on(table.boeDate),
    productIdIdx: index("boe_lots_product_id_idx").on(table.productId),
    categoryIdx: index("boe_lots_category_idx").on(table.category),
    monthIdx: index("boe_lots_month_idx").on(table.month)
}));

// Sale Line Allocations (FIFO tracking)
export const saleLineAllocations = pgTable("sale_line_allocations", {
    id: serial("id").primaryKey(),
    saleLineId: integer("sale_line_id").notNull().references(() => salesLines.id, { onDelete: "cascade" }),
    boeLotId: integer("boe_lot_id").notNull().references(() => boeLots.id),
    allocatedPairs: integer("allocated_pairs").notNull(),
    overrideBeforeBoe: boolean("override_before_boe").default(false),
    createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
    saleLineIdIdx: index("sale_line_allocations_sale_line_id_idx").on(table.saleLineId),
    boeLotIdIdx: index("sale_line_allocations_boe_lot_id_idx").on(table.boeLotId)
}));

// VAT Summary (month-wise)
export const vatSummary = pgTable("vat_summary", {
    id: serial("id").primaryKey(),
    month: text("month").notNull().unique(), // YYYY-MM format
    salesValueExVat: numeric("sales_value_ex_vat", { precision: 12, scale: 2 }).default("0"),
    outputVat: numeric("output_vat", { precision: 12, scale: 2 }).default("0"),
    invoiceCount: integer("invoice_count").default(0),
    adjustments: numeric("adjustments", { precision: 12, scale: 2 }).default("0"),
    status: text("status").default("open"), // open, closed
    closedAt: timestamp("closed_at"),
    closedBy: text("closed_by"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
    monthIdx: index("vat_summary_month_idx").on(table.month),
    statusIdx: index("vat_summary_status_idx").on(table.status)
}));

// Price Memory (for auto-suggestions)
export const priceMemory = pgTable("price_memory", {
    id: serial("id").primaryKey(),
    productId: integer("product_id").references(() => products.id),
    groupId: integer("group_id").references(() => productGroups.id),
    lastSalePrice: numeric("last_sale_price", { precision: 10, scale: 2 }),
    lastSaleDate: timestamp("last_sale_date"),
    saleCount: integer("sale_count").default(0),
    updatedAt: timestamp("updated_at").defaultNow()
}, (table) => ({
    productIdIdx: index("price_memory_product_id_idx").on(table.productId),
    groupIdIdx: index("price_memory_group_id_idx").on(table.groupId)
}));

// Audit Log
export const auditLog = pgTable("audit_log", {
    id: serial("id").primaryKey(),
    action: text("action").notNull(), // merge, unmerge, override, edit, etc.
    entityType: text("entity_type").notNull(), // product_group, sale, vat_summary, etc.
    entityId: integer("entity_id"),
    oldValues: text("old_values"), // JSON
    newValues: text("new_values"), // JSON
    userId: text("user_id"),
    timestamp: timestamp("timestamp").defaultNow(),
    notes: text("notes")
}, (table) => ({
    actionIdx: index("audit_log_action_idx").on(table.action),
    entityTypeIdx: index("audit_log_entity_type_idx").on(table.entityType),
    timestampIdx: index("audit_log_timestamp_idx").on(table.timestamp)
}));

// Import the existing schema
import { products, salesLines } from "./schema";