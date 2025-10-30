import { db } from "@/db/client";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getCustomer(id: string) {
  try {
    const customerId = parseInt(id);

    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customer.length === 0) {
      return null;
    }

    return customer[0];
  } catch (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Customer Details
              </h1>
              <p className="text-gray-600 mt-1">
                View customer information and details
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/customers/${customer.id}/edit`}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                ✏️ Edit Customer
              </Link>
              <Link
                href="/customers"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                ← Back to Customers
              </Link>
            </div>
          </div>
        </div>

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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Customer Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Name
              </label>
              <div className="text-xl font-bold text-gray-900 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                {customer.name}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone
              </label>
              <div className="text-lg text-gray-900 bg-gray-50 rounded-lg p-4">
                {customer.phone ? (
                  <span className="flex items-center gap-2">
                    📞 {customer.phone}
                  </span>
                ) : (
                  <span className="text-gray-500 italic">Not provided</span>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address
              </label>
              <div className="text-lg text-gray-900 bg-gray-50 rounded-lg p-4 min-h-[80px]">
                {customer.address ? (
                  <span className="flex items-start gap-2">
                    📍 {customer.address}
                  </span>
                ) : (
                  <span className="text-gray-500 italic">Not provided</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                BIN (Business Identification Number)
              </label>
              <div className="text-lg text-gray-900 bg-blue-50 rounded-lg p-4 border border-blue-200">
                {customer.bin ? (
                  <span className="flex items-center gap-2 font-mono">
                    🏢 {customer.bin}
                  </span>
                ) : (
                  <span className="text-gray-500 italic">Not provided</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                NID (National ID Number)
              </label>
              <div className="text-lg text-gray-900 bg-purple-50 rounded-lg p-4 border border-purple-200">
                {customer.nid ? (
                  <span className="flex items-center gap-2 font-mono">
                    🆔 {customer.nid}
                  </span>
                ) : (
                  <span className="text-gray-500 italic">Not provided</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Created Date
              </label>
              <div className="text-lg text-gray-900 bg-gray-50 rounded-lg p-4">
                <span className="flex items-center gap-2">
                  📅 {new Date(customer.createdAt!).toLocaleDateString("en-GB")}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last Updated
              </label>
              <div className="text-lg text-gray-900 bg-gray-50 rounded-lg p-4">
                <span className="flex items-center gap-2">
                  🔄 {new Date(customer.updatedAt!).toLocaleDateString("en-GB")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
