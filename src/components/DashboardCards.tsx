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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
        >
          <div className="flex items-center">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 ${card.color} rounded-lg flex items-center justify-center flex-shrink-0`}
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded opacity-80"></div>
            </div>
            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                {card.title}
              </p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                {card.value}
              </p>
              <p className="text-xs text-gray-500 truncate">{card.subtitle}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
