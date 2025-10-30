interface DashboardCardsProps {
  data: {
    salesSummary: {
      totalGross: number;
      totalVAT: number;
      totalNet: number;
      count: number;
    };
    vatLedgerEntry: any;
    closingBalance: any;
    treasuryChallanSum: number;
  };
}

export default function DashboardCards({ data }: DashboardCardsProps) {
  const cards = [
    {
      title: "Gross Sales (Oct 2025)",
      value: `৳${Number(data.salesSummary.totalGross).toLocaleString()}`,
      subtitle: `${data.salesSummary.count} invoices`,
      color: "bg-blue-500",
    },
    {
      title: "Net Sales (Ex-VAT)",
      value: `৳${Number(data.salesSummary.totalNet).toLocaleString()}`,
      subtitle: "After VAT deduction",
      color: "bg-green-500",
    },
    {
      title: "VAT Payable",
      value: data.vatLedgerEntry
        ? `৳${Number(data.vatLedgerEntry.vatPayable).toLocaleString()}`
        : "Not computed",
      subtitle: "15% on period total",
      color: "bg-red-500",
    },
    {
      title: "Closing Balance Used",
      value: data.vatLedgerEntry
        ? `৳${Number(
            data.vatLedgerEntry.usedFromClosingBalance
          ).toLocaleString()}`
        : "৳0",
      subtitle: "From previous periods",
      color: "bg-purple-500",
    },
    {
      title: "Treasury Challan Needed",
      value: data.vatLedgerEntry
        ? `৳${Number(data.vatLedgerEntry.treasuryNeeded).toLocaleString()}`
        : "৳0",
      subtitle: "Remaining payment",
      color: "bg-orange-500",
    },
    {
      title: "Available Balance",
      value: `৳${
        data.closingBalance ? Number(data.closingBalance).toLocaleString() : "0"
      }`,
      subtitle: "Current period",
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div
              className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}
            >
              <div className="w-6 h-6 bg-white rounded opacity-80"></div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.subtitle}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
