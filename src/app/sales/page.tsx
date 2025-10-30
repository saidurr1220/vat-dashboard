import { db } from "@/db/client";
import { sales, salesLines, products, customers } from "@/db/schema";
import { desc, eq, sql, gte } from "drizzle-orm";
import Link from "next/link";

// Force dynamic rendering to avoid build-time database queries
export const dynamic = "force-dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Plus,
  History,
  TrendingUp,
  Eye,
  Edit,
  Calendar,
  User,
  Receipt,
  DollarSign,
} from "lucide-react";

async function getSales() {
  try {
    // First, try to get sales without the join to see if that works
    const result = await db
      .select()
      .from(sales)
      .orderBy(desc(sales.dt), desc(sales.id))
      .limit(50);

    // Use stored total value as final amount - don't recalculate VAT
    return result.map((sale) => {
      const totalValue = Number(sale.totalValue);
      const grandTotal = totalValue; // This is already the final amount including VAT

      // Calculate VAT breakdown for display purposes only
      let vatAmount = 0;
      let netOfVat = 0;

      if (sale.amountType === "INCL") {
        // VAT Inclusive: extract VAT from total
        vatAmount = (totalValue * 15) / 115;
        netOfVat = totalValue - vatAmount;
      } else {
        // VAT Exclusive: total already includes added VAT
        netOfVat = totalValue / 1.15; // Back-calculate the ex-VAT amount
        vatAmount = totalValue - netOfVat;
      }

      return {
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        date: sale.dt,
        customer: sale.customer,
        amountType: sale.amountType,
        totalValue: sale.totalValue,
        notes: sale.notes,
        customerName: null, // We'll add this back once the basic query works
        outputVat15: vatAmount.toFixed(2),
        netOfVat: netOfVat.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        customerDisplay: sale.customer, // Use the customer field directly for now
      };
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
}

async function getSalesStats() {
  try {
    // Get all sales for this month - simplified approach
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await db
      .select()
      .from(sales)
      .where(gte(sales.dt, firstDayOfMonth));

    let totalSales = 0;
    let totalGross = 0;
    let totalVAT = 0;
    let totalNet = 0;

    result.forEach((sale) => {
      totalSales++;
      const totalValue = Number(sale.totalValue);

      if (sale.amountType === "INCL") {
        // VAT Inclusive
        totalGross += totalValue;
        const vatAmount = (totalValue * 15) / 115;
        totalVAT += vatAmount;
        totalNet += totalValue - vatAmount;
      } else {
        // VAT Exclusive - total_value is the net amount
        totalNet += totalValue;
        const vatAmount = totalValue * 0.15;
        totalVAT += vatAmount;
        totalGross += totalValue + vatAmount;
      }
    });

    return {
      totalSales,
      totalGross: Math.round(totalGross * 100) / 100,
      totalVAT: Math.round(totalVAT * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
    };
  } catch (error) {
    console.error("Error fetching sales stats:", error);
    return {
      totalSales: 0,
      totalGross: 0,
      totalVAT: 0,
      totalNet: 0,
    };
  }
}

export default async function SalesPage() {
  const salesData = await getSales();
  const stats = await getSalesStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Sales Management
          </h1>
          <p className="text-muted-foreground">
            Manage invoices, track sales, and monitor revenue
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/sales/history">
              <History className="mr-2 h-4 w-4" />
              Sales History
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/sales/monthly">
              <Calendar className="mr-2 h-4 w-4" />
              Monthly Bulk Sale
            </Link>
          </Button>
          <Button asChild>
            <Link href="/sales/new">
              <Plus className="mr-2 h-4 w-4" />
              New Sale
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">This Month</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.totalSales}
                </p>
                <p className="text-xs text-blue-700">Total Sales</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  Gross Revenue
                </p>
                <p className="text-2xl font-bold text-green-900">
                  ৳{stats.totalGross.toLocaleString()}
                </p>
                <p className="text-xs text-green-700">Including VAT</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">
                  Net Revenue
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  ৳{stats.totalNet.toLocaleString()}
                </p>
                <p className="text-xs text-purple-700">Excluding VAT</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-800">
                  VAT Collected
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  ৳{stats.totalVAT.toLocaleString()}
                </p>
                <p className="text-xs text-orange-700">15% VAT</p>
              </div>
              <Receipt className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Recent Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {salesData.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No sales records found
              </h3>
              <p className="text-muted-foreground mb-4">
                Start by creating your first sale
              </p>
              <Button asChild>
                <Link href="/sales/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Sale
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      Invoice No
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      Customer
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                      Grand Total
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                      VAT (15%)
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                      Net Amount
                    </th>
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {salesData.map((sale) => (
                    <tr key={sale.id} className="hover:bg-muted/50">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(sale.date).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-medium">{sale.invoiceNo}</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {sale.customerDisplay}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={
                            sale.amountType === "INCL" ? "default" : "secondary"
                          }
                        >
                          {sale.amountType === "INCL"
                            ? "VAT Incl."
                            : "VAT Excl."}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-medium">
                        ৳{Number(sale.grandTotal).toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-orange-600">
                        ৳{Number(sale.outputVat15).toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-green-600">
                        ৳{Number(sale.netOfVat).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/sales/${sale.id}`}>
                              <Eye className="h-3 w-3" />
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/sales/${sale.id}/edit`}>
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
