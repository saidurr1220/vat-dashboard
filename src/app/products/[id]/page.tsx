import { db } from "@/db/client";
import { sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import BoEDataDisplay from "@/components/BoEDataDisplay";
import ProductDetailsClient from "@/components/ProductDetailsClient";

async function getProductDetails(id: string) {
  try {
    const productId = parseInt(id);

    // Get product details with stock information
    const result = await db.execute(sql`
      SELECT 
        p.id,
        p.sku,
        p.name,
        p.hs_code as "hsCode",
        p.category,
        p.unit,
        p.tests_per_kit as "testsPerKit",
        p.cost_ex_vat as "costExVat",
        p.sell_ex_vat as "sellExVat",
        p.created_at as "createdAt",
        p.updated_at as "updatedAt",
        COALESCE(p.stock_on_hand::numeric, 0) as "stockOnHand",
        COALESCE((
          SELECT 
            CASE 
              WHEN SUM(sl2.qty_in::numeric) > 0 THEN
                SUM(sl2.qty_in::numeric * sl2.unit_cost_ex_vat::numeric) / SUM(sl2.qty_in::numeric)
              ELSE p.cost_ex_vat::numeric
            END
          FROM stock_ledger sl2 
          WHERE sl2.product_id = p.id AND sl2.qty_in > 0
        ), p.cost_ex_vat::numeric) as "avgCostExVat"
      FROM products p
      WHERE p.id = ${productId}
    `);

    if (result.rows.length === 0) {
      return null;
    }

    const product = result.rows[0];

    // Get recent stock movements (with error handling)
    let stockMovements = { rows: [] };
    try {
      stockMovements = await db.execute(sql`
        SELECT 
          sl.dt,
          sl.ref_type as "refType",
          sl.ref_no as "refNo",
          sl.qty_in as "qtyIn",
          sl.qty_out as "qtyOut",
          sl.unit_cost_ex_vat as "unitCostExVat"
        FROM stock_ledger sl
        WHERE sl.product_id = ${productId}
        ORDER BY sl.dt DESC, sl.id DESC
        LIMIT 10
      `);
    } catch (error) {
      console.log(
        "Stock ledger table not available:",
        error instanceof Error ? error.message : "Unknown error"
      );
      // Return empty stock movements if table doesn't exist
      stockMovements = { rows: [] };
    }

    return {
      ...product,
      stockMovements: stockMovements.rows,
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productData = await getProductDetails(id);

  if (!productData) {
    notFound();
  }

  // Type assertion for easier access
  const product = productData as any;

  const stockOnHand = Number(product.stockOnHand || 0);
  const avgCost = Number(product.avgCostExVat || 0);
  const sellPrice = Number(product.sellExVat || 0);
  const stockValue = stockOnHand * avgCost;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Product Details
              </h1>
              <p className="text-gray-600 mt-1">{product.name}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/products/${product.id}/edit`}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                ✏️ Edit Product
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                ← Back to Products
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Product Information
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Name
                </label>
                <div className="text-xl font-bold text-gray-900 bg-gray-50 rounded-lg p-3">
                  {product.name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    SKU
                  </label>
                  <div className="text-gray-900 bg-gray-50 rounded-lg p-3">
                    {product.sku || "Not set"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    HS Code
                  </label>
                  <div className="text-gray-900 bg-gray-50 rounded-lg p-3">
                    {product.hsCode || "Not set"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span
                      className={`inline-flex px-3 py-1.5 text-sm font-semibold rounded-full ${
                        product.category === "Footwear"
                          ? "bg-blue-100 text-blue-800"
                          : product.category === "Fan"
                          ? "bg-green-100 text-green-800"
                          : product.category === "BioShield"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {product.category === "Footwear" && "👟 "}
                      {product.category === "Fan" && "🌀 "}
                      {product.category === "BioShield" && "🛡️ "}
                      {product.category === "Instrument" && "🔧 "}
                      {product.category || "Uncategorized"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Unit
                  </label>
                  <div className="text-gray-900 bg-gray-50 rounded-lg p-3 font-medium">
                    {product.unit}
                  </div>
                </div>
              </div>

              {product.testsPerKit && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tests per Kit
                  </label>
                  <div className="text-gray-900 bg-gray-50 rounded-lg p-3 font-medium">
                    {product.testsPerKit}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Created Date
                  </label>
                  <div className="text-gray-900 bg-gray-50 rounded-lg p-3">
                    {new Date(product.createdAt).toLocaleDateString("en-GB")}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Updated
                  </label>
                  <div className="text-gray-900 bg-gray-50 rounded-lg p-3">
                    {new Date(product.updatedAt).toLocaleDateString("en-GB")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock & Pricing */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Stock & Pricing
              </h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Stock
                </label>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-3xl font-bold text-gray-900">
                    {stockOnHand.toLocaleString()}{" "}
                    <span className="text-lg text-gray-600">
                      {product.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Average Cost (Ex VAT)
                  </label>
                  <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <div className="text-xl font-bold text-orange-800">
                      ৳{avgCost.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Selling Price (Ex VAT)
                  </label>
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <div className="text-xl font-bold text-purple-800">
                      ৳{sellPrice.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Value (Ex VAT)
                </label>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-700">
                    ৳{stockValue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Stock Value (Inc VAT)
                </label>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">
                    ৳{(stockValue * 1.15).toLocaleString()}
                  </div>
                </div>
              </div>

              {product.category === "BioShield" && product.testsPerKit && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🛡️</span>
                    <h3 className="font-bold text-purple-900 text-lg">
                      BioShield Calculations
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700 font-medium">
                        Per-test price:
                      </span>
                      <span className="text-purple-900 font-bold text-lg">
                        ৳{(sellPrice / product.testsPerKit).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700 font-medium">
                        Total tests available:
                      </span>
                      <span className="text-purple-900 font-bold text-lg">
                        {(stockOnHand * product.testsPerKit).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BoE Data Section - Only for Footwear */}
        {product.category === "Footwear" && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  BoE Import History
                </h2>
              </div>
            </div>
            <div className="p-8">
              <BoEDataDisplay
                productId={product.id}
                productName={product.name}
              />
            </div>
          </div>
        )}

        {/* Recent Stock Movements */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Stock Movements
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Qty In
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Qty Out
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Unit Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {product.stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          No Stock Movements
                        </h3>
                        <p className="text-gray-500">
                          No stock movements found for this product
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  product.stockMovements.map((movement: any, index: number) => (
                    <tr
                      key={index}
                      className="hover:bg-blue-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(movement.dt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                            movement.refType === "OPENING"
                              ? "bg-green-100 text-green-800"
                              : movement.refType === "IMPORT"
                              ? "bg-blue-100 text-blue-800"
                              : movement.refType === "SALE"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {movement.refType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {movement.refNo || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                        {Number(movement.qtyIn || 0) > 0 && (
                          <span className="text-green-600">
                            +{Number(movement.qtyIn || 0).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                        {Number(movement.qtyOut || 0) > 0 && (
                          <span className="text-red-600">
                            -{Number(movement.qtyOut || 0).toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                        ৳{Number(movement.unitCostExVat || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client-side components for stock adjustment and sales history */}
        <ProductDetailsClient
          product={{
            id: product.id,
            name: product.name,
            stockOnHand: stockOnHand,
          }}
        />
      </div>
    </div>
  );
}
