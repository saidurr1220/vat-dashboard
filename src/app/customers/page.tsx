import { db } from "@/db/client";
import { customers, sales } from "@/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import Link from "next/link";

// Force dynamic rendering to avoid build-time database queries
export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Plus,
  User,
  Phone,
  MapPin,
  FileText,
  Eye,
  Edit,
  Calendar,
  TrendingUp,
  Building,
} from "lucide-react";

async function getCustomers() {
  try {
    const customerList = await db
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt))
      .limit(100);

    return customerList;
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

async function getCustomerStats() {
  try {
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN c.bin IS NOT NULL AND c.bin != '' THEN 1 END) as customers_with_bin,
        COUNT(CASE WHEN c.phone IS NOT NULL AND c.phone != '' THEN 1 END) as customers_with_phone,
        COUNT(CASE WHEN c.created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as new_this_month
      FROM customers c
    `);

    const stats = result.rows[0] as any;
    return {
      totalCustomers: parseInt(stats?.total_customers || "0"),
      customersWithBin: parseInt(stats?.customers_with_bin || "0"),
      customersWithPhone: parseInt(stats?.customers_with_phone || "0"),
      newThisMonth: parseInt(stats?.new_this_month || "0"),
    };
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    return {
      totalCustomers: 0,
      customersWithBin: 0,
      customersWithPhone: 0,
      newThisMonth: 0,
    };
  }
}

export default async function CustomersPage() {
  const customerList = await getCustomers();
  const stats = await getCustomerStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Customer Management
          </h1>
          <p className="text-muted-foreground">
            Manage customer information and relationships
          </p>
        </div>
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Total Customers
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.totalCustomers}
                </p>
                <p className="text-xs text-blue-700">All Records</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">With BIN</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.customersWithBin}
                </p>
                <p className="text-xs text-green-700">Business Customers</p>
              </div>
              <Building className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">
                  With Phone
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.customersWithPhone}
                </p>
                <p className="text-xs text-purple-700">Contact Available</p>
              </div>
              <Phone className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">
                  New This Month
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.newThisMonth}
                </p>
                <p className="text-xs text-orange-700">Recent Additions</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customerList.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No customers found</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first customer
              </p>
              <Button asChild>
                <Link href="/customers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Customer
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      Customer
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      Contact
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      Address
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      Business Info
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      Created
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customerList.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{customer.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {customer.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{customer.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {customer.address ? (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-sm max-w-xs truncate">
                              {customer.address}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            -
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {customer.bin ? (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-mono">
                                {customer.bin}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              No BIN
                            </span>
                          )}
                          {customer.nid && (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground font-mono">
                                NID: {customer.nid}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(customer.createdAt!).toLocaleDateString(
                              "en-GB"
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/customers/${customer.id}`}>
                              <Eye className="h-3 w-3" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/customers/${customer.id}/edit`}>
                              <Edit className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
