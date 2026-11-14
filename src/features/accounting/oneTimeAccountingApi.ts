import api from "@/lib/apis";

export interface OneTimeAccountingOrder {
  number: string;
  businessDate: string | null;
  createdAt: string;
  paymentStatus: "paid" | "refunded";
  status: string;
  fulfillmentMethod: string;
  grossHalalas: number;
}
export interface OneTimeAccountingRange {
  reportType: "one-time-range";
  range: {
    from: string; to: string; days: number; timezone: string; basis: string;
  };
  summary: {
    paidCount: number;
    paidGrossHalalas: number;
    refundedStatusCount: number;
    refundedStatusGrossHalalas: number;
    unpricedPaidCount: number;
  };
  daily: Array<{
    businessDate: string;
    paidCount: number;
    paidGrossHalalas: number;
    refundedStatusCount: number;
    refundedStatusGrossHalalas: number;
    unpricedPaidCount: number;
  }>;
  items: OneTimeAccountingOrder[];
  pagination: { offset: number; limit: number; total: number; hasMore: boolean };
  generatedAt: string;
  notes: string[];
}
export async function fetchOneTimeAccountingRange(params: {
  from: string; to: string; offset?: number; limit?: number;
}): Promise<OneTimeAccountingRange> {
  const response = await api.get<{ status: true; data: OneTimeAccountingRange }>(
    "/api/dashboard/accounting/one-time/range", { params });
  return response.data.data;
}
