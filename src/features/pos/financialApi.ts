import api from "@/lib/apis";
import type { Channel } from "./previewCatalog";

export type PosDiscount = { type: "percent" | "fixed"; value: number } | null;
export type PosFinanceLineInput = {
  productId: string;
  variantId: string;
  quantity: number;
  discount?: PosDiscount;
  addons: { productId: string; quantity: number; discount?: PosDiscount }[];
};
export type PosFinanceQuoteRequest = {
  revision: number;
  channel: Channel;
  items: PosFinanceLineInput[];
  invoiceDiscount?: PosDiscount;
};
export type PosFinanceLine = {
  id: string;
  parentLineId: string | null;
  kind: "product" | "addon";
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  quantity: number;
  perMealAddonQuantity?: number;
  unitPriceHalalas: number;
  beforeDiscountHalalas: number;
  lineDiscountHalalas: number;
  invoiceDiscountPartHalalas: number;
  grossHalalas: number;
  vatHalalas: number;
  netHalalas: number;
  discount: PosDiscount;
};
export type PosFinanceTotals = {
  beforeDiscountHalalas: number;
  lineDiscountHalalas: number;
  invoiceDiscountHalalas: number;
  totalDiscountHalalas: number;
  grossHalalas: number;
  vatHalalas: number;
  netHalalas: number;
};
export type PosFinanceQuote = {
  revision: number;
  channel: Channel;
  currency: "SAR";
  lines: PosFinanceLine[];
  totals: PosFinanceTotals;
  rounding: "HALF_UP_PER_LINE";
  vatRate: "15%";
  invoiceDiscount: PosDiscount;
  kind: "STAGING_TEST_NON_TAX";
  note: string;
};
export type PosSaleIntent = PosFinanceQuoteRequest & {
  serviceMode?: "restaurant" | "dine-in" | "takeaway" | "delivery";
  externalOrderNumber?: string;
  appPaymentStatus?: "paid" | "cash";
  tender?: { method: "cash"; receivedHalalas: number } | { method: "network" };
};
export type PosActor = { id: string; name: string | null; email: string; role: string };
export type PosSeller = {
  legalNameAr: string; legalNameEn: string; vatRegistrationNumber: string;
  crNumber: string; addressAr: string; addressEn: string;
};
export type PosInvoice = {
  _id: string;
  number: string;
  sequence: number;
  documentKind?: "SIMPLIFIED_TAX_INVOICE" | "STAGING_TEST_NON_TAX";
  documentType?: "SIMPLIFIED_TAX_INVOICE" | "STAGING_TEST_NON_TAX";
  seller?: PosSeller;
  qrPayloadBase64?: string | null;
  publishedRevision: number;
  channel: Channel;
  serviceMode: string;
  actor: PosActor;
  issuedAt: string;
  note: string;
  lines: PosFinanceLine[];
  totals: PosFinanceTotals;
  tender: {
    method: "cash" | "network" | "app_receivable";
    receivedHalalas?: number | null;
    changeHalalas?: number | null;
    reportedStatus?: "paid" | "cash";
  };
  externalOrderNumber: string | null;
  appPaymentStatus: "paid" | "cash" | null;
};
export type PosRefund = {
  _id: string;
  documentKind?: "CREDIT_NOTE" | "STAGING_TEST_NON_TAX";
  documentType?: "CREDIT_NOTE" | "STAGING_TEST_NON_TAX";
  seller?: PosSeller;
  qrPayloadBase64?: string | null;
  number: string;
  invoiceId: string;
  invoiceNumber: string;
  reason: string;
  method: "cash" | "network" | "external";
  lines: { lineId: string; name: string; variantLabel: string; quantity: number;
    grossHalalas: number; vatHalalas: number; netHalalas: number }[];
  totals: { grossHalalas: number; vatHalalas: number; netHalalas: number };
  actor: PosActor;
  recordedAt: string;
  note: string;
};
export type PosRefundRequest = {
  invoiceId: string;
  reason: string;
  method: "cash" | "network" | "external";
  lines: { lineId: string; quantity: number }[];
};
const base = "/api/dashboard/pos";

export async function fetchFinancialQuote(body: PosFinanceQuoteRequest): Promise<PosFinanceQuote> {
  const res = await api.post<{ data: PosFinanceQuote }>(base + "/checkout/quote", body);
  return res.data.data;
}
export async function issuePosSale(body: PosSaleIntent, key: string): Promise<PosInvoice> {
  const res = await api.post<{ data: PosInvoice }>(base + "/sales", body, {
    headers: { "Idempotency-Key": key },
  });
  return res.data.data;
}
export async function listPosSales(): Promise<PosInvoice[]> {
  const res = await api.get<{ data: PosInvoice[] }>(base + "/sales");
  return res.data.data;
}
export async function getPosSale(id: string): Promise<PosInvoice> {
  const res = await api.get<{ data: PosInvoice }>(base + "/sales/" + encodeURIComponent(id));
  return res.data.data;
}
export async function listPosRefunds(invoiceId: string): Promise<PosRefund[]> {
  const res = await api.get<{ data: PosRefund[] }>(
    base + "/sales/" + encodeURIComponent(invoiceId) + "/refunds"
  );
  return res.data.data;
}
export async function getPosRefund(id: string): Promise<PosRefund> {
  const res = await api.get<{ data: PosRefund }>(base + "/refunds/" + encodeURIComponent(id));
  return res.data.data;
}
export async function recordPosRefund(body: PosRefundRequest, key: string): Promise<PosRefund> {
  const res = await api.post<{ data: PosRefund }>(base + "/refunds", body, {
    headers: { "Idempotency-Key": key },
  });
  return res.data.data;
}

export type PosOperationState = {
  status: "pending" | "committed" | "rejected" | "abandoned";
  kind: "sale" | "refund";
  resultId: string | null;
  resultNumber: string | null;
  errorCode: string | null;
};
export async function getPosOperation(key: string): Promise<PosOperationState | null> {
  try {
    const res = await api.get<{ data: PosOperationState }>(
      base + "/operations/" + encodeURIComponent(key)
    );
    return res.data.data;
  } catch (cause) {
    // 404 is only a display state, NEVER permission to create another key.
    const { parseApiError } = await import("@/lib/apiErrors");
    if (parseApiError(cause).status === 404) return null;
    throw cause;
  }
}
export async function getActivePosOperation(kind: "sale" | "refund"): Promise<{
  key: string; status: string; kind: string;
} | null> {
  const res = await api.get<{ data: { key: string; status: string; kind: string } | null }>(
    base + "/operations/active/" + kind
  );
  return res.data.data;
}
export async function abandonPosOperation(
  key: string, kind: "sale" | "refund"
): Promise<PosOperationState> {
  const res = await api.post<{ data: PosOperationState }>(
    base + "/operations/" + encodeURIComponent(key) + "/abandon", { kind }
  );
  return res.data.data;
}
