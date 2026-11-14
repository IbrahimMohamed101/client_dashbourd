import api from "@/lib/apis";

export interface PosAccountingTotals {
  invoiceCount: number;
  grossHalalas: number;
  vatHalalas: number;
  netBeforeVatHalalas: number;
  cashGrossHalalas: number;
  networkGrossHalalas: number;
  appReceivableGrossHalalas: number;
  otherTenderGrossHalalas: number;
  refundCount: number;
  refundDocumentsHalalas: number;
  refundVatHalalas: number;
  cashRefundDocumentsHalalas: number;
  networkRefundDocumentsHalalas: number;
  externalRefundDocumentsHalalas: number;
  netAfterRefundDocumentsHalalas: number;
}
export interface PosAccountingChannel {
  channel: string;
  invoiceCount: number;
  grossHalalas: number;
  vatHalalas: number;
  cashGrossHalalas: number;
  networkGrossHalalas: number;
  appReceivableGrossHalalas: number;
  refundCount: number;
  refundDocumentsHalalas: number;
  refundVatHalalas: number;
  netAfterRefundDocumentsHalalas: number;
}
export interface PosAccountingDaily {
  businessDate: string;
  grossHalalas: number;
  refundDocumentsHalalas: number;
  invoiceCount: number;
  refundCount: number;
  netAfterRefundDocumentsHalalas: number;
}
export interface PosAccountingInvoice {
  number: string;
  businessDate: string;
  issuedAt: string;
  channel: string;
  externalOrderNumber?: string | null;
  appPaymentStatus?: string | null;
  documentType: string;
  tender: { method: "cash" | "network" | "app_receivable" | string };
  totals: { grossHalalas: number; vatHalalas: number; netHalalas: number };
}
export interface PosAccountingRefund {
  number: string;
  invoiceNumber: string;
  businessDate: string;
  recordedAt: string;
  channel: string;
  method: "cash" | "network" | "external" | string;
  reason: string;
  totals: { grossHalalas: number; vatHalalas: number; netHalalas: number };
}
export interface PosAccountingRange {
  reportType: "pos-range";
  range: { from: string; to: string; days: number; timezone: "Asia/Riyadh"; basis: string };
  summary: PosAccountingTotals;
  channels: PosAccountingChannel[];
  daily: PosAccountingDaily[];
  invoices: PosAccountingInvoice[];
  refunds: PosAccountingRefund[];
  pagination: {
    offset: number;
    limit: number;
    invoicesTotal: number;
    refundsTotal: number;
    invoicesHasMore: boolean;
    refundsHasMore: boolean;
  };
  generatedAt: string;
  notes: string[];
}
export async function fetchPosAccountingRange(params: {
  from: string; to: string; offset?: number; limit?: number;
}): Promise<PosAccountingRange> {
  const response = await api.get<{ status: true; data: PosAccountingRange }>(
    "/api/dashboard/accounting/pos/range", { params });
  return response.data.data;
}
