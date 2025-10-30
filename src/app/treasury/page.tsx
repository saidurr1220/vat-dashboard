import { db } from "@/db/client";
import { treasuryChallans } from "@/db/schema";
import { desc } from "drizzle-orm";

// Force dynamic rendering to avoid build-time database queries
export const dynamic = "force-dynamic";

async function getTreasuryChallans() {
  try {
    const challans = await db
      .select()
      .from(treasuryChallans)
      .orderBy(desc(treasuryChallans.date))
      .limit(50);

    return challans;
  } catch (error) {
    console.error("Error fetching treasury challans:", error);
    return [];
  }
}

export default async function TreasuryPage() {
  const challans = await getTreasuryChallans();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Treasury Challans
          </h1>
          <p className="text-gray-600">VAT payment records and challans</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Payment Records</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token/Challan No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Code
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount (৳)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {challans.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No treasury challans found.
                  </td>
                </tr>
              ) : (
                challans.map((challan) => (
                  <tr key={challan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(challan.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {challan.tokenNo}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {challan.bank}
                      <br />
                      <span className="text-xs text-gray-500">
                        {challan.branch}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {challan.accountCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      ৳{Number(challan.amountBdt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {challan.voucherNo || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Challans</p>
            <p className="text-2xl font-bold text-gray-900">
              {challans.length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900">
              ৳
              {challans
                .reduce((sum, c) => sum + Number(c.amountBdt), 0)
                .toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600">This Year</p>
            <p className="text-2xl font-bold text-gray-900">
              ৳
              {challans
                .filter((c) => new Date(c.date).getFullYear() === 2025)
                .reduce((sum, c) => sum + Number(c.amountBdt), 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
