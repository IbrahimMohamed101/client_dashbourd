import type { SubscriptionPaymentRangeReportData } from "./accountingRangeTypes";
import type { PosAccountingRange, PosAccountingInvoice, PosAccountingRefund } from "./posAccountingApi";
import type { AccountingExcelSheet } from "./accountingXlsx";
import { posChannelLabel } from "@/features/pos/posSaleChannels";
import type { PosChannel } from "@/features/pos/previewCatalog";

const sar = (halalas: number | null | undefined) =>
  typeof halalas === "number" && Number.isFinite(halalas) ? halalas / 100 : null;
const value = (source: string | null | undefined) => source || "—";
const payMethod = (method: string) => ({
  cash: "كاش", network: "شبكة", app_receivable: "مستحق على التطبيق",
  card: "بطاقة", bank_transfer: "تحويل", external: "خارجي",
}[method] ?? method);
const saleRows = (invoices: PosAccountingInvoice[], channels?: readonly PosChannel[]) =>
  invoices.map((item) => [
    item.number, item.businessDate, posChannelLabel(item.channel, channels),
    sar(item.totals.grossHalalas), sar(item.totals.netHalalas),
    sar(item.totals.vatHalalas), payMethod(item.tender.method),
    value(item.externalOrderNumber), value(item.appPaymentStatus),
  ]);
const refundRows = (refunds: PosAccountingRefund[], channels?: readonly PosChannel[]) =>
  refunds.map((item) => [
    item.number, item.invoiceNumber, item.businessDate, posChannelLabel(item.channel, channels),
    sar(item.totals.grossHalalas), sar(item.totals.vatHalalas),
    payMethod(item.method), item.reason,
  ]);
export function buildFinancialCenterSheets(
  subscriptions: SubscriptionPaymentRangeReportData,
  pos: PosAccountingRange,
  invoices: PosAccountingInvoice[],
  refunds: PosAccountingRefund[],
  channels?: readonly PosChannel[],
): AccountingExcelSheet[] {
  if (pos.pagination.invoicesTotal !== invoices.length ||
      pos.pagination.refundsTotal !== refunds.length ||
      !subscriptions.items ||
      typeof subscriptions.summary?.netCollectionHalala !== "number") {
    throw new Error("لا يمكن تصدير تقرير غير مكتمل؛ أعد تحميل الحركات قبل التنزيل.");
  }
  const subscriptionNet = subscriptions.summary.netCollectionHalala;
  const days = new Map<string, {
    date: string; posGross: number; posRefund: number; posNet: number; subscriptionNet: number;
  }>();
  for (const item of pos.daily) {
    days.set(item.businessDate, { date: item.businessDate,
      posGross: item.grossHalalas, posRefund: item.refundDocumentsHalalas,
      posNet: item.netAfterRefundDocumentsHalalas, subscriptionNet: 0 });
  }
  for (const item of subscriptions.dailyBreakdown ?? []) {
    const date = item.businessDate;
    if (!date) continue;
    const record = days.get(date) ?? {
      date, posGross: 0, posRefund: 0, posNet: 0, subscriptionNet: 0,
    };
    record.subscriptionNet = item.netCollectionHalala ?? 0;
    days.set(date, record);
  }
  const daily = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  return [
    { name: "الملخص المالي", columns: [
      { label: "المؤشر", width: 42 }, { label: "المبلغ (ريال)", width: 22, money: true },
      { label: "تفسير محاسبي", width: 55 },
    ], rows: [
      ["صافي تحصيل الاشتراكات", sar(subscriptionNet), "تحصيلات بعد المرتجعات كما يحددها تقرير الاشتراكات"],
      ["مبيعات نقطة البيع المسجلة", sar(pos.summary.grossHalalas), "إجمالي الفواتير المصدرة من POS"],
      ["الكاش المباشر", sar(pos.summary.cashGrossHalalas), "فواتير POS المسجلة نقدًا، قبل إشعارات المرتجع"],
      ["الشبكة المباشرة", sar(pos.summary.networkGrossHalalas), "فواتير POS المسجلة بالشبكة، قبل إشعارات المرتجع"],
      ["مستحقات تطبيقات التوصيل", sar(pos.summary.appReceivableGrossHalalas),
        "مستحقات على المنصات؛ ليست نقدًا في درج المطعم ولا إثبات تسوية"],
      ["إشعارات مرتجع POS", sar(pos.summary.refundDocumentsHalalas),
        "مستندات مرتجع مسجلة؛ ليست إثباتًا لرد الأموال فعليًا"],
      ["صافي فواتير POS بعد الإشعارات", sar(pos.summary.netAfterRefundDocumentsHalalas),
        "فواتير POS ناقص إشعارات المرتجع المسجلة"],
      ["صافي الحركات المالية المسجلة", sar(subscriptionNet + pos.summary.netAfterRefundDocumentsHalalas),
        "مجموع حركات الاشتراكات وصافي POS؛ ليس صافي الربح ولا كشف البنك"],
    ] },
    { name: "القنوات", columns: [
      { label: "قناة البيع", width: 25 }, { label: "الفواتير", width: 15 },
      { label: "الإجمالي (ريال)", width: 22, money: true },
      { label: "المرتجعات المسجلة (ريال)", width: 27, money: true },
      { label: "الصافي المسجل (ريال)", width: 25, money: true },
      { label: "الكاش (ريال)", width: 20, money: true },
      { label: "الشبكة (ريال)", width: 20, money: true },
      { label: "مستحق التطبيق (ريال)", width: 25, money: true },
    ], rows: pos.channels.map(item => [
      posChannelLabel(item.channel, channels), item.invoiceCount,
      sar(item.grossHalalas), sar(item.refundDocumentsHalalas),
      sar(item.netAfterRefundDocumentsHalalas), sar(item.cashGrossHalalas),
      sar(item.networkGrossHalalas), sar(item.appReceivableGrossHalalas),
    ]) },
    { name: "فواتير الكاشير", columns: [
      { label: "رقم الفاتورة", width: 24 }, { label: "اليوم المالي", width: 18 },
      { label: "القناة", width: 25 },
      { label: "الإجمالي (ريال)", width: 22, money: true },
      { label: "قبل الضريبة (ريال)", width: 22, money: true },
      { label: "الضريبة (ريال)", width: 20, money: true },
      { label: "طريقة التسجيل", width: 25 }, { label: "مرجع التطبيق", width: 24 },
      { label: "حالة التطبيق", width: 20 },
    ], rows: saleRows(invoices, channels) },
    { name: "إشعارات المرتجع", columns: [
      { label: "رقم الإشعار", width: 24 }, { label: "الفاتورة الأصلية", width: 26 },
      { label: "اليوم المالي", width: 20 }, { label: "القناة", width: 23 },
      { label: "المبلغ (ريال)", width: 22, money: true },
      { label: "الضريبة (ريال)", width: 20, money: true },
      { label: "طريقة الرد المختارة", width: 26 }, { label: "السبب", width: 48 },
    ], rows: refundRows(refunds, channels) },
    { name: "تحصيل الاشتراكات", columns: [
      { label: "المرجع", width: 28 }, { label: "اليوم المالي", width: 20 },
      { label: "نوع الحركة", width: 23 }, { label: "العميل", width: 30 },
      { label: "المبلغ (ريال)", width: 22, money: true },
      { label: "الصافي المحاسبي (ريال)", width: 26, money: true },
      { label: "طريقة الدفع", width: 23 }, { label: "مصدر الطلب", width: 22 },
      { label: "مزود الدفع", width: 24 }, { label: "حالة المراجعة", width: 24 },
    ], rows: subscriptions.items.map(item => [
      value(item.paymentReference ?? item.movementId), value(item.businessDate),
      value(item.movementTypeLabelAr ?? item.movementType), value(item.customerName),
      sar(item.amountHalala), sar(item.netMovementHalala),
      value(item.paymentMethodLabelAr ?? item.paymentMethod),
      value(item.sourceChannelLabelAr ?? item.sourceChannel),
      value(item.paymentProviderLabelAr ?? item.paymentProvider),
      item.needsReview ? "تحتاج مراجعة" : "—",
    ]) },
    { name: "الحركة اليومية", columns: [
      { label: "اليوم المالي", width: 20 },
      { label: "فواتير POS (ريال)", width: 24, money: true },
      { label: "إشعارات POS (ريال)", width: 25, money: true },
      { label: "صافي POS (ريال)", width: 23, money: true },
      { label: "صافي تحصيل الاشتراكات (ريال)", width: 33, money: true },
      { label: "صافي الحركات (ريال)", width: 26, money: true },
    ], rows: daily.map(item => [
      item.date, sar(item.posGross), sar(item.posRefund), sar(item.posNet),
      sar(item.subscriptionNet), sar(item.posNet + item.subscriptionNet),
    ]) },
    { name: "تعريف التقرير", columns: [
      { label: "البند", width: 32 }, { label: "القيمة", width: 55 },
    ], rows: [
      ["اسم التقرير", "بيسك دايت — المركز المالي للإدارة العليا"],
      ["من", pos.range.from], ["إلى", pos.range.to],
      ["المنطقة الزمنية", "Asia/Riyadh"],
      ["مصدر فواتير POS", "فواتير وإشعارات دائنة مثبتة على السيرفر حسب businessDate"],
      ["مصدر الاشتراكات", "تقرير تحصيل الاشتراكات حسب الفترة من واجهة المحاسبة الرسمية"],
      ["المستحقات الخارجية", "لا تُدرج ضمن كاش المطعم حتى إذا كانت حالة التطبيق كاش"],
      ["المرتجعات", "المرتجع مستند مسجل؛ لا يثبت دفع الأموال للعميل"],
      ["سياسة الإجمالي", "صافي الحركات المسجلة ≠ الربح أو التسوية البنكية"],
      ["إكتمال الصفحات", "جميع صفحات فواتير POS وإشعارات المرتجع للفترة محمّلة"],
      ["العملة", "ريال سعودي — الخلايا المالية أرقام لا نصوص"],
    ] },
  ];
}
