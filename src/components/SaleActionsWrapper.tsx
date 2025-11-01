"use client";

import SaleActions from "./SaleActions";

interface SaleActionsWrapperProps {
  sale: {
    id: number;
    invoiceNo: string;
    dt: string;
    customer: string;
    customerName?: string;
    customerAddress?: string;
    customerPhone?: string;
    customerBin?: string;
    saleLines: any[];
    netOfVat: number;
    vatAmount: number;
    grandTotal: number;
  };
}

export default function SaleActionsWrapper({ sale }: SaleActionsWrapperProps) {
  return <SaleActions sale={sale} />;
}
