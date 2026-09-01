import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Loader2, Printer, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import api from "@/lib/apis";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/apiErrors";

type InvoiceLineItem = {
  kind: string;
  labelAr: string;
  amountHalala: number;
};

type InvoicePaymentOption = {
  id: string;
  type: string;
  status: string;
  amountHalala: number;
  currency: string;
  provider: string;
  method: string | null;
  paidAt: string | null;
};

type InvoiceRefundRow = {
  id: string;
  amountHalala: number;
  vatHalala: number;
  status: string;
  executionMode: string;
  refundChannel: string;
  refundedAt: string | null;
  settledAmountHalala: number;
  settlementStatus: string;
  settlementMethod: string;
  settledAt: string | null;
  reference: string;
};

type InvoiceData = {
  invoiceNumber: string;
  issuedAt: string | null;
  invoiceType: "simplified_tax_invoice" | "subscription_invoice";
  selectedPaymentId: string | null;
  availablePayments: InvoicePaymentOption[];
  seller: {
    legalNameAr: string;
    legalNameEn: string;
    vatRegistrationNumber: string;
    crNumber: string;
    addressAr: string;
    addressEn: string;
  };
  tax: {
    taxInvoiceEligible: boolean;
    registrationEffective: boolean;
    registrationEffectiveAt: string;
    vatPercentage: number;
    priceIncludesVat: boolean;
    subtotalExcludingVatHalala: number | null;
    vatHalala: number;
    totalIncludingVatHalala: number | null;
    qr: {
      payloadBase64: string;
      encoding: "TLV_BASE64";
      generatedLocally: boolean;
      zatcaIntegration: boolean;
      fields: string[];
    } | null;
  };
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  subscription: {
    id: string;
    displayId: string;
    status: string;
    planName: { ar: string; en: string };
    startDate: string | null;
    endDate: string | null;
    validityEndDate: string | null;
    selectedGrams: number | null;
    selectedMealsPerDay: number | null;
    totalMeals: number | null;
    deliveryMode: string;
    deliveryZoneName: string;
  };
  financial: {
    currency: string;
    source: "payment" | "subscription_snapshot" | "unavailable";
    snapshotSource?: string;
    financialDataComplete: boolean;
    reconciliationStatus: string;
    lineItems: InvoiceLineItem[];
    discountHalala: number;
    deliveryFeeHalala: number;
    subtotalHalala: number | null;
    subtotalBeforeVatHalala: number | null;
    vatPercentage: number;
    vatHalala: number;
    priceIncludesVat: boolean;
    subscriptionTotalHalala: number | null;
    checkoutDraftTotalHalala?: number | null;
    paidAmountHalala: number | null;
    totalHalala: number | null;
  };
  payment: {
    id: string;
    type?: string;
    status: string;
    method: string | null;
    provider: string;
    paidAt: string | null;
    refunded: boolean;
  } | null;
  refunds: {
    recognizedAmountHalala: number;
    settledAmountHalala: number;
    pendingSettlementAmountHalala: number;
    rows: InvoiceRefundRow[];
  };
  createdBy: {
    id: string | null;
    email: string;
    role: string;
  } | null;
  warnings: Array<{ code: string; messageAr: string }>;
};

type InvoiceResponse = {
  status: boolean;
  data: InvoiceData;
};

type Props = {
  subscriptionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const RIYADH_TIME_ZONE = "Asia/Riyadh";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: RIYADH_TIME_ZONE,
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: RIYADH_TIME_ZONE,
  }).format(date);
}

function formatMoney(halala: number | null, currency: string) {
  if (halala === null || halala === undefined) return "—";
  try {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: currency || "SAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(halala) / 100);
  } catch {
    return `${(Math.abs(halala) / 100).toFixed(2)} ${currency || "SAR"}`;
  }
}

function paymentMethodLabel(method: string | null, provider: string) {
  if (method === "cash") return "نقدي";
  if (method === "visa") return "فيزا / بطاقة";
  if (method === "moyasar" || provider === "moyasar") return "ميسر";
  return method || provider || "غير محدد";
}

function paymentStatusLabel(status: string | undefined) {
  if (status === "paid") return "مدفوع";
  if (status === "refunded") return "مسترد";
  if (status === "failed") return "فشل الدفع";
  if (status === "canceled") return "ملغى";
  return status || "غير محدد";
}

function paymentTypeLabel(type: string) {
  if (type === "subscription_activation") return "اشتراك جديد";
  if (type === "subscription_renewal") return "تجديد / شراء إضافي";
  return "عملية شراء";
}

function deliveryModeLabel(mode: string) {
  if (mode === "delivery") return "توصيل";
  if (mode === "pickup") return "استلام من الفرع";
  return mode || "—";
}

function ReceiptRow({
  label,
  value,
  strong = false,
  negative = false,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
  negative?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 py-1.5 ${
        strong ? "border-y-2 border-black py-2 text-[13px] font-black" : "text-[11px]"
      }`}
    >
      <span className={strong ? "font-black" : "font-medium"}>{label}</span>
      <span className={strong ? "font-black" : "font-semibold"} dir="auto">
        {negative ? "- " : ""}
        {value || "—"}
      </span>
    </div>
  );
}

function DashedDivider() {
  return <div className="my-2 border-t border-dashed border-black" aria-hidden="true" />;
}

export function SubscriptionInvoiceDialog({
  subscriptionId,
  open,
  onOpenChange,
}: Props) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSelection, setPaymentSelection] = useState<{
    subscriptionId: string;
    paymentId: string;
  } | null>(null);

  const requestedPaymentId =
    paymentSelection?.subscriptionId === subscriptionId
      ? paymentSelection.paymentId
      : null;

  useEffect(() => {
    if (!open || !subscriptionId) return;
    let active = true;
    setLoading(true);
    setError(null);

    const paymentQuery = requestedPaymentId
      ? `?paymentId=${encodeURIComponent(requestedPaymentId)}`
      : "";

    api
      .get<InvoiceResponse>(
        `/api/dashboard/subscriptions/${subscriptionId}/invoice${paymentQuery}`
      )
      .then((response) => {
        if (active) setInvoice(response.data.data);
      })
      .catch((err: unknown) => {
        if (active) setError(getApiErrorMessage(err) || "تعذر تحميل الفاتورة");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, subscriptionId, requestedPaymentId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const currency = invoice?.financial.currency || "SAR";
  const financial = invoice?.financial;
  const tax = invoice?.tax;
  const lineItems = financial?.lineItems || [];
  const hasDeliveryLineItem = lineItems.some((item) => item.kind === "delivery");
  const hasDiscountLineItem = lineItems.some((item) => item.kind === "discount");
  const isTaxInvoice = Boolean(invoice?.tax.taxInvoiceEligible);
  const hasInternalMismatch = Boolean(
    financial?.reconciliationStatus?.includes("mismatch")
  );
  const preVatWarning = invoice?.warnings.find(
    (warning) => warning.code === "PRE_VAT_EFFECTIVE_DATE"
  );
  const breakdownWarning = invoice?.warnings.find(
    (warning) =>
      warning.code === "PAYMENT_BREAKDOWN_UNAVAILABLE" ||
      warning.code === "PAYMENT_SNAPSHOT_MISMATCH"
  );
  const multiplePayments = (invoice?.availablePayments?.length || 0) > 1;
  const recognizedRefundHalala = invoice?.refunds?.recognizedAmountHalala || 0;
  const settledRefundHalala = invoice?.refunds?.settledAmountHalala || 0;
  const pendingRefundHalala = invoice?.refunds?.pendingSettlementAmountHalala || 0;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 p-3 sm:p-5"
      dir="rtl"
    >
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body * {
            visibility: hidden !important;
          }
          .subscription-invoice-print-root,
          .subscription-invoice-print-root * {
            visibility: visible !important;
          }
          .subscription-invoice-print-root {
            position: absolute !important;
            top: 0 !important;
            right: 0 !important;
            width: 100% !important;
            max-width: 80mm !important;
            min-height: 0 !important;
            margin: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-no-print {
            display: none !important;
          }
          @page {
            margin: 0;
          }
        }
      `}</style>

      <div className="invoice-no-print mx-auto mb-3 flex w-full max-w-[80mm] flex-col gap-3 rounded-xl bg-white p-3 shadow-xl">
        <div>
          <p className="font-bold text-black">معاينة فاتورة الكاشير</p>
          <p className="mt-1 text-xs text-neutral-600">
            فاتورة حرارية 80mm بتصميم أبيض وأسود ومختصر. تتكيف مع عرض ورق الطابعة عند الطباعة.
          </p>
        </div>

        {multiplePayments && invoice ? (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
            <label
              htmlFor={`invoice-payment-${subscriptionId}`}
              className="mb-1.5 block text-xs font-bold text-neutral-900"
            >
              عملية الشراء / الفاتورة
            </label>
            <select
              id={`invoice-payment-${subscriptionId}`}
              value={invoice.selectedPaymentId || ""}
              onChange={(event) =>
                setPaymentSelection({
                  subscriptionId,
                  paymentId: event.target.value,
                })
              }
              disabled={loading}
              className="w-full rounded-md border border-neutral-300 bg-white px-2 py-2 text-xs text-neutral-950"
            >
              {invoice.availablePayments.map((payment) => (
                <option key={payment.id} value={payment.id}>
                  {paymentTypeLabel(payment.type)} — {formatDateTime(payment.paidAt)} — {formatMoney(
                    payment.amountHalala,
                    payment.currency
                  )}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-neutral-600">
              كل عملية دفع لها فاتورة مستقلة بسعرها التاريخي وقت الشراء.
            </p>
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => window.print()}
            disabled={!invoice || loading || !financial?.financialDataComplete}
            className="flex-1 gap-2"
          >
            <Printer className="size-4" />
            طباعة
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {hasInternalMismatch ? (
        <div className="invoice-no-print mx-auto mb-3 flex w-full max-w-[80mm] items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            يوجد اختلاف تاريخي بين تفاصيل السعر وسجل الدفع. المبلغ المطبوع هو المبلغ المدفوع الفعلي المعتمد، وأي فرق ظاهر كتسوية صريحة داخل الفاتورة.
          </span>
        </div>
      ) : null}

      {breakdownWarning ? (
        <div className="invoice-no-print mx-auto mb-3 flex w-full max-w-[80mm] items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{breakdownWarning.messageAr}</span>
        </div>
      ) : null}

      {preVatWarning ? (
        <div className="invoice-no-print mx-auto mb-3 flex w-full max-w-[80mm] items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{preVatWarning.messageAr}</span>
        </div>
      ) : null}

      <div
        className="subscription-invoice-print-root mx-auto w-full max-w-[80mm] overflow-hidden bg-white text-black shadow-2xl"
        data-print-format="thermal-80mm"
      >
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 p-6 text-sm">
            <Loader2 className="size-5 animate-spin" />
            جاري تجهيز الفاتورة...
          </div>
        ) : error ? (
          <div className="min-h-64 p-6 text-center text-sm font-semibold">{error}</div>
        ) : invoice ? (
          <article className="thermal-receipt px-[4mm] py-[4mm] font-sans text-black">
            <header className="text-center">
              <h1 className="text-[17px] font-black leading-tight">
                {invoice.seller.legalNameAr || "Basic Diet"}
              </h1>
              {invoice.seller.legalNameEn ? (
                <p className="mt-0.5 text-[10px] font-semibold" dir="ltr">
                  {invoice.seller.legalNameEn}
                </p>
              ) : null}
              <p className="mt-2 text-[12px] font-black">
                {isTaxInvoice ? "فاتورة ضريبية" : "فاتورة اشتراك"}
              </p>
              {isTaxInvoice ? (
                <p className="text-[9px] font-semibold" dir="ltr">
                  Tax Invoice
                </p>
              ) : null}
              {invoice.seller.vatRegistrationNumber ? (
                <p className="mt-1 text-[10px]">
                  الرقم الضريبي: <span dir="ltr">{invoice.seller.vatRegistrationNumber}</span>
                </p>
              ) : null}
              {invoice.seller.crNumber ? (
                <p className="text-[10px]">
                  السجل التجاري: <span dir="ltr">{invoice.seller.crNumber}</span>
                </p>
              ) : null}
              {invoice.seller.addressAr ? (
                <p className="mt-1 text-[9px] leading-4">{invoice.seller.addressAr}</p>
              ) : null}
            </header>

            <DashedDivider />

            <ReceiptRow label="رقم الفاتورة" value={invoice.invoiceNumber} />
            <ReceiptRow label="التاريخ" value={formatDateTime(invoice.issuedAt)} />
            <ReceiptRow label="رقم الاشتراك" value={invoice.subscription.displayId} />

            <DashedDivider />

            <ReceiptRow label="العميل" value={invoice.customer.name} />
            <ReceiptRow label="الجوال" value={invoice.customer.phone} />
            <ReceiptRow
              label="الباقة"
              value={invoice.subscription.planName.ar || invoice.subscription.planName.en}
            />
            {invoice.subscription.totalMeals !== null ? (
              <ReceiptRow label="عدد الوجبات" value={invoice.subscription.totalMeals} />
            ) : null}
            <ReceiptRow
              label="الفترة"
              value={`${formatDate(invoice.subscription.startDate)} — ${formatDate(
                invoice.subscription.endDate
              )}`}
            />
            <ReceiptRow
              label="الاستلام"
              value={deliveryModeLabel(invoice.subscription.deliveryMode)}
            />

            <DashedDivider />

            <div className="text-[11px] font-black">ملخص المبلغ</div>
            <div className="mt-1">
              {lineItems.length ? (
                lineItems.map((item, index) => (
                  <ReceiptRow
                    key={`${item.kind}-${index}`}
                    label={item.labelAr}
                    value={formatMoney(item.amountHalala, currency)}
                    negative={item.amountHalala < 0}
                  />
                ))
              ) : financial?.subtotalHalala !== null &&
                financial?.subtotalHalala !== undefined ? (
                <ReceiptRow
                  label="قيمة الاشتراك"
                  value={formatMoney(financial.subtotalHalala, currency)}
                />
              ) : null}

              {financial && financial.discountHalala > 0 && !hasDiscountLineItem ? (
                <ReceiptRow
                  label="الخصم"
                  value={formatMoney(financial.discountHalala, currency)}
                  negative
                />
              ) : null}

              {financial && financial.deliveryFeeHalala > 0 && !hasDeliveryLineItem ? (
                <ReceiptRow
                  label="رسوم التوصيل"
                  value={formatMoney(financial.deliveryFeeHalala, currency)}
                />
              ) : null}

              {isTaxInvoice && tax?.subtotalExcludingVatHalala !== null ? (
                <ReceiptRow
                  label="قبل الضريبة"
                  value={formatMoney(tax?.subtotalExcludingVatHalala ?? null, currency)}
                />
              ) : null}

              {isTaxInvoice ? (
                <ReceiptRow
                  label={`ضريبة القيمة المضافة ${tax?.vatPercentage ?? financial?.vatPercentage ?? 0}%`}
                  value={formatMoney(tax?.vatHalala ?? financial?.vatHalala ?? 0, currency)}
                />
              ) : null}

              <ReceiptRow
                label="إجمالي الفاتورة الأصلي"
                value={formatMoney(financial?.totalHalala ?? null, currency)}
                strong
              />
            </div>

            <div className="mt-2">
              <ReceiptRow
                label="طريقة الدفع"
                value={paymentMethodLabel(
                  invoice.payment?.method ?? null,
                  invoice.payment?.provider ?? ""
                )}
              />
              <ReceiptRow
                label="حالة الدفع"
                value={paymentStatusLabel(invoice.payment?.status)}
              />
              {invoice.payment?.paidAt ? (
                <ReceiptRow label="وقت الدفع" value={formatDateTime(invoice.payment.paidAt)} />
              ) : null}
            </div>

            {recognizedRefundHalala > 0 ? (
              <>
                <DashedDivider />
                <div className="text-[11px] font-black">استرجاعات لاحقة</div>
                <p className="mb-1 mt-0.5 text-[9px] leading-4">
                  الاسترجاع المالي سجل مستقل ولا يغيّر قيمة الفاتورة الأصلية أعلاه.
                </p>
                <ReceiptRow
                  label="استرجاع مسجل"
                  value={formatMoney(recognizedRefundHalala, currency)}
                  negative
                />
                <ReceiptRow
                  label="تمت تسويته فعلياً"
                  value={formatMoney(settledRefundHalala, currency)}
                />
                {pendingRefundHalala > 0 ? (
                  <ReceiptRow
                    label="بانتظار التسوية"
                    value={formatMoney(pendingRefundHalala, currency)}
                  />
                ) : null}
              </>
            ) : null}

            {isTaxInvoice && tax?.qr?.payloadBase64 ? (
              <>
                <DashedDivider />
                <div className="flex flex-col items-center text-center">
                  <QRCodeSVG
                    value={tax.qr.payloadBase64}
                    size={94}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#000000"
                    title="QR الفاتورة الضريبية"
                  />
                  <span className="mt-1 text-[9px]">QR الفاتورة الضريبية</span>
                </div>
              </>
            ) : null}

            <DashedDivider />

            <footer className="text-center text-[9px] leading-4">
              <p className="font-bold">شكراً لاختياركم Basic Diet</p>
              <p>احتفظ بالفاتورة للرجوع إليها عند الحاجة.</p>
            </footer>
          </article>
        ) : null}
      </div>
    </div>
  );
}