import { describe, expect, it } from "vitest";
import { buildFinancialCenterSheets } from "./buildFinancialCenterSheets";
import type { SubscriptionPaymentRangeReportData } from "./accountingRangeTypes";
import type { PosAccountingRange } from "./posAccountingApi";
import type { OneTimeAccountingRange } from "./oneTimeAccountingApi";

const subscriptions = {
  reportType: "monthly",
  sourceReportType: "range",
  range: { from: "2026-11-15", to: "2026-11-15", days: 1 },
  summary: { netCollectionHalala: 120000, totalPaymentsCount: 1 },
  dailyBreakdown: [{ businessDate: "2026-11-15", netCollectionHalala: 120000 }],
  items: [{ movementId: "SYN-1", businessDate: "2026-11-15",
    movementType: "collection", customerName: "عميل صناعي",
    paymentTypeLabelAr: "جديد", amountHalala: 120000,
    netMovementHalala: 120000, paymentMethod: "cash" }],
} as SubscriptionPaymentRangeReportData;

const invoice = {
  number: "SYN-000001", businessDate: "2026-11-15",
  issuedAt: "2026-11-15T10:00:00Z", channel: "jahez",
  documentType: "SIMPLIFIED_TAX_INVOICE",
  tender: { method: "app_receivable" as const },
  totals: { grossHalalas: 900, vatHalalas: 117, netHalalas: 783 },
};
const refund = {
  number: "SYN-R-000001", invoiceNumber: "SYN-000001",
  businessDate: "2026-11-15", recordedAt: "2026-11-15T11:00:00Z",
  channel: "jahez", method: "external" as const, reason: "اختبار",
  totals: { grossHalalas: 300, vatHalalas: 39, netHalalas: 261 },
};
const pos = {
  reportType: "pos-range",
  range: { from: "2026-11-15", to: "2026-11-15", days: 1,
    timezone: "Asia/Riyadh", basis: "immutable POS businessDate" },
  summary: {
    invoiceCount: 1, grossHalalas: 900, vatHalalas: 117,
    netBeforeVatHalalas: 783, cashGrossHalalas: 0,
    networkGrossHalalas: 0, appReceivableGrossHalalas: 900,
    otherTenderGrossHalalas: 0, refundCount: 1,
    refundDocumentsHalalas: 300, refundVatHalalas: 39,
    cashRefundDocumentsHalalas: 0, networkRefundDocumentsHalalas: 0,
    externalRefundDocumentsHalalas: 300, netAfterRefundDocumentsHalalas: 600,
  },
  channels: [{
    channel: "jahez", invoiceCount: 1, grossHalalas: 900,
    vatHalalas: 117, cashGrossHalalas: 0, networkGrossHalalas: 0,
    appReceivableGrossHalalas: 900, refundCount: 1,
    refundDocumentsHalalas: 300, refundVatHalalas: 39,
    netAfterRefundDocumentsHalalas: 600,
  }],
  daily: [{ businessDate: "2026-11-15", grossHalalas: 900,
    refundDocumentsHalalas: 300, invoiceCount: 1, refundCount: 1,
    netAfterRefundDocumentsHalalas: 600 }],
  invoices: [invoice], refunds: [refund],
  pagination: { offset: 0, limit: 100, invoicesTotal: 1,
    refundsTotal: 1, invoicesHasMore: false, refundsHasMore: false },
  generatedAt: "2026-11-15T12:00:00Z", notes: [],
} satisfies PosAccountingRange;

const onlineOrder = { number: "SYN-ONLINE-1", businessDate: "2026-11-15",
  createdAt: "2026-11-15T10:00:00Z", paymentStatus: "paid" as const,
  status: "fulfilled", fulfillmentMethod: "pickup", grossHalalas: 1700 };
const online: OneTimeAccountingRange = {
  reportType: "one-time-range",
  range: { from: "2026-11-15", to: "2026-11-15", days: 1,
    timezone: "Asia/Riyadh", basis: "historical cutoff" },
  summary: { paidCount: 1, paidGrossHalalas: 1700,
    refundedStatusCount: 0, refundedStatusGrossHalalas: 0, unpricedPaidCount: 0 },
  daily: [{ businessDate: "2026-11-15", paidCount: 1, paidGrossHalalas: 1700,
    refundedStatusCount: 0, refundedStatusGrossHalalas: 0, unpricedPaidCount: 0 }],
  items: [onlineOrder], pagination: { offset: 0, limit: 100, total: 1, hasMore: false },
  generatedAt: "2026-11-15T12:00:00Z", notes: [],
};
describe("superadmin financial workbook", () => {
  it("keeps external app receivables separate from cashier cash", () => {
    const sheets = buildFinancialCenterSheets(subscriptions, pos, [invoice], [refund], online, [onlineOrder],
      [{ id: "jahez", label: "جاهز منشور" }]);
    expect(sheets).toHaveLength(8);
    const summary = sheets[0].rows;
    expect(summary.find(row => row[0] === "الكاش المباشر")?.[1]).toBe(0);
    expect(summary.find(row => row[0] === "مستحقات تطبيقات التوصيل")?.[1]).toBe(9);
    expect(summary.find(row => row[0] === "صافي الحركات المالية المسجلة")?.[1]).toBe(1223);
    expect(summary.find(row => row[0] === "مدفوعات الطلبات الفورية أونلاين")?.[1]).toBe(17);
    expect(sheets[1].rows[0][0]).toBe("جاهز منشور");
    expect(sheets[2].rows[0][6]).toBe("مستحق على التطبيق");
    expect(sheets[3].rows[0][4]).toBe(3);
    expect(sheets[4].rows[0][0]).toBe("SYN-ONLINE-1");
    expect(sheets[5].rows[0]).toContain("جديد");
  });
  it("rejects a truncated invoice/refund export rather than silently omitting rows", () => {
    expect(() => buildFinancialCenterSheets(subscriptions, pos, [invoice], [refund], online, []))
      .toThrow(/غير مكتمل/);
    expect(() => buildFinancialCenterSheets(subscriptions, pos, [], [refund], online, [onlineOrder]))
      .toThrow(/غير مكتمل/);
    expect(() => buildFinancialCenterSheets(subscriptions, pos, [invoice], [], online, [onlineOrder]))
      .toThrow(/غير مكتمل/);
  });
});
