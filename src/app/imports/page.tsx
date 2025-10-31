import { db } from "@/db/client";
import { importsBoe } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { safeQuery } from "@/lib/db-utils";
import Link from "next/link";

// Force dynamic rendering to avoid build-time database queries
export const dynamic = "force-dynamic";

async function getImports() {
  return await safeQuery(async () => {
    const importsData = await db
      .select({
        id: importsBoe.id,
        boeNo: importsBoe.boeNo,
        boeDate: importsBoe.boeDate,
        officeCode: importsBoe.officeCode,
        itemNo: importsBoe.itemNo,
        hsCode: importsBoe.hsCode,
        description: importsBoe.description,
        assessableValue: importsBoe.assessableValue,
        baseVat: importsBoe.baseVat,
        sd: importsBoe.sd,
        vat: importsBoe.vat,
        at: importsBoe.at,
        qty: importsBoe.qty,
        unit: importsBoe.unit,
      })
      .from(importsBoe)
      .orderBy(desc(importsBoe.boeDate))
      .limit(100);

    return importsData;
  }, []); // Return empty array as fallback
}

export default async function ImportsPage() {
  const importsData = await getImports();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Imports (BoE)</h1>
          <p className="text-gray-600">
            Bill of Entry records and cost breakdown
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/imports/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add Single BoE
          </Link>
          <Link
            href="/imports/upload"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Bulk Import
          </Link>
          <Link
            href="/api/imports/export"
            className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Export CSV
          </Link>
        </div>
      </div>

      {/* Import Records */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Import Records
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Recent Bill of Entry records
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BoE No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Office
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  HS Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessable
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VAT
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {importsData.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No import records found.{" "}
                    <Link
                      href="/imports/upload"
                      className="text-blue-600 hover:underline"
                    >
                      Import BoE data
                    </Link>
                  </td>
                </tr>
              ) : (
                importsData.map((record) => {
                  const totalCost =
                    Number(record.assessableValue || 0) +
                    Number(record.baseVat || 0) +
                    Number(record.sd || 0) +
                    Number(record.vat || 0) +
                    Number(record.at || 0);

                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.boeNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.boeDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.officeCode || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.hsCode || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {record.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {Number(record.qty || 0).toLocaleString()}{" "}
                        {record.unit || ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ৳{Number(record.assessableValue || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ৳{Number(record.vat || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        ৳{totalCost.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {importsData.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Showing {importsData.length} import records</span>
              <span>
                Page Total: ৳
                {importsData
                  .reduce((sum, record) => {
                    const totalCost =
                      Number(record.assessableValue || 0) +
                      Number(record.baseVat || 0) +
                      Number(record.sd || 0) +
                      Number(record.vat || 0) +
                      Number(record.at || 0);
                    return sum + totalCost;
                  }, 0)
                  .toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Cost Breakdown Info */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Cost Breakdown Components
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div className="font-medium text-gray-900">Assessable Value</div>
            <div className="text-gray-600 text-xs mt-1">Base import value</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div className="font-medium text-gray-900">Base VAT</div>
            <div className="text-gray-600 text-xs mt-1">Base VAT amount</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div className="font-medium text-gray-900">SD</div>
            <div className="text-gray-600 text-xs mt-1">Supplementary Duty</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div className="font-medium text-gray-900">VAT</div>
            <div className="text-gray-600 text-xs mt-1">Value Added Tax</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div className="font-medium text-gray-900">AT</div>
            <div className="text-gray-600 text-xs mt-1">Advance Tax</div>
          </div>
        </div>
      </div>
    </div>
  );
}
