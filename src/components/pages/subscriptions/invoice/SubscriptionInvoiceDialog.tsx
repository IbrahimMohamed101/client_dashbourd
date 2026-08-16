import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Loader2, Printer, QrCode, ShieldCheck, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import api from "@/lib/apis";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/apiErrors";

type InvoiceLineItem = {
  kind: string;
  labelAr: string;
  amountHalala: number;
};

type InvoiceData = {
  invoiceNumber: string;
  issuedAt: string | null;
  invoiceType: "simplified_tax_invoice" | "subscription_invoice";
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
    paidAmountHalala: number | null;
    totalHalala: number | null;
  };
  payment: {
    id: string;
    status: string;
    method: string | null;
    provider: string;
    paidAt: string | null;
    refunded: boolean;
  } | null;
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
    second: "2-digit",
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

function deliveryModeLabel(mode: string) {
  if (mode === "delivery") return "توصيل";
  if (mode === "pickup") return "استلام من الفرع";
  return mode || "—";
}

function statusLabel(status: string) {
  if (status === "active") return "نشط";
  if (status === "pending_payment") return "بانتظار الدفع";
  if (status === "frozen") return "مجمّد";
  if (status === "expired" || status === "completed" || status === "ended") return "منتهي";
  if (status === "canceled") return "ملغى";
  return status || "—";
}

function InfoItem({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="shrink-0 text-xs font-medium text-slate-500">{label}</span>
      <span
        className={`text-left text-sm font-semibold text-slate-800 ${mono ? "font-mono tracking-wide" : ""}`}
        dir="auto"
      >
        {value || "—"}
      </span>
    </div>
  );
}

function AmountRow({
  label,
  value,
  strong = false,
  negative = false,
  muted = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  negative?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-0 ${
        strong ? "bg-emerald-50/80 text-base" : "text-sm"
      }`}
    >
      <span className={strong ? "font-bold text-emerald-950" : muted ? "text-slate-500" : "text-slate-600"}>
        {label}
      </span>
      <span
        className={`${strong ? "text-xl font-black text-emerald-800" : "font-semibold text-slate-900"} ${
          negative ? "text-rose-600" : ""
        }`}
        dir="ltr"
      >
        {negative && value !== "—" ? `- ${value}` : value}
      </span>
    </div>
  );
}

export function SubscriptionInvoiceDialog({ subscriptionId, open, onOpenChange }: Props) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !subscriptionId) return;
    let active = true;
    setLoading(true);
    setError(null);

    api
      .get<InvoiceResponse>(`/api/dashboard/subscriptions/${subscriptionId}/invoice`)
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
  }, [open, subscriptionId]);

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
  const printedTotal = financial?.totalHalala ?? null;
  const hasInternalMismatch = financial?.reconciliationStatus === "payment_authoritative_mismatch";
  const lineItems = financial?.lineItems || [];
  const isTaxInvoice = Boolean(invoice?.tax.taxInvoiceEligible);
  const preVatWarning = invoice?.warnings.find((warning) => warning.code === "PRE_VAT_EFFECTIVE_DATE");

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6" dir="rtl">
      <style>{`
        @media print {
          html, body { background: white !important; }
          body * { visibility: hidden !important; }
          .subscription-invoice-print-root,
          .subscription-invoice-print-root * { visibility: visible !important; }
          .subscription-invoice-print-root {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            max-width: none !important;
            min-height: auto !important;
            margin: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-no-print { display: none !important; }
          @page { size: A4; margin: 8mm; }
        }
      `}</style>

      <div className="invoice-no-print mx-auto mb-3 flex w-full max-w-[210mm] items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-900">
              {isTaxInvoice ? "معاينة الفاتورة الضريبية المبسطة" : "معاينة فاتورة الاشتراك"}
            </p>
            {isTaxInvoice ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800">
                <QrCode className="size-3" /> QR محلي
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {isTaxInvoice
              ? "الـQR يُولد داخل النظام من بيانات الفاتورة بدون إرسالها إلى خدمة QR خارجية أو ربط مباشر مع ZATCA."
              : "راجع البيانات ثم اطبع نسخة العميل."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={() => window.print()}
            disabled={!invoice || loading || !financial?.financialDataComplete}
            className="gap-2"
          >
            <Printer className="size-4" />
            طباعة الفاتورة
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {hasInternalMismatch ? (
        <div className="invoice-no-print mx-auto mb-3 flex w-full max-w-[210mm] items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>يوجد اختلاف تاريخي بين إجمالي الاشتراك وسجل الدفع. تم اعتماد المبلغ المدفوع الفعلي في الفاتورة.</span>
        </div>
      ) : null}

      {preVatWarning ? (
        <div className="invoice-no-print mx-auto mb-3 flex w-full max-w-[210mm] items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{preVatWarning.messageAr}</span>
        </div>
      ) : null}

      <div className="subscription-invoice-print-root mx-auto min-h-[270mm] w-full max-w-[210mm] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {loading ? (
          <div className="flex min-h-[500px] items-center justify-center gap-3 text-slate-600">
            <Loader2 className="size-6 animate-spin" />
            جاري تجهيز الفاتورة...
          </div>
        ) : error ? (
          <div className="flex min-h-[500px] items-center justify-center p-8 text-center text-rose-600">{error}</div>
        ) : invoice ? (
          <div className="flex min-h-[270mm] flex-col bg-white text-slate-900">
            <header className="border-b-4 border-emerald-800 bg-gradient-to-l from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-5 text-white sm:px-9">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
                    <img src="/logo.png" alt="Basic Diet" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xl font-black tracking-tight">{invoice.seller.legalNameAr}</p>
                    <p className="mt-1 text-sm text-emerald-100" dir="ltr">{invoice.seller.legalNameEn}</p>
                  </div>
                </div>
                <div className="text-left" dir="rtl">
                  <h1 className="text-2xl font-black sm:text-3xl">
                    {isTaxInvoice ? "فاتورة ضريبية مبسطة" : "فاتورة اشتراك"}
                  </h1>
                  <p className="mt-1 text-[10px] font-semibold tracking-[0.13em] text-emerald-100" dir="ltr">
                    {isTaxInvoice ? "SIMPLIFIED TAX INVOICE" : "SUBSCRIPTION INVOICE"}
                  </p>
                </div>
              </div>
            </header>

            {!financial?.financialDataComplete ? (
              <div className="m-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:mx-9">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-bold">البيانات المالية التاريخية غير مكتملة</p>
                  <p className="mt-1">لن يتم طباعة مبلغ تقديري. يلزم وجود سجل دفع أو إجمالي تاريخي موثوق للاشتراك.</p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 px-6 pt-6 sm:grid-cols-[1.15fr_1fr_150px] sm:px-9">
              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h2 className="mb-2 border-b border-emerald-200 pb-2 text-sm font-black text-emerald-900">بيانات المورد</h2>
                <InfoItem label="الاسم" value={invoice.seller.legalNameAr} />
                <InfoItem label="الرقم الضريبي" value={invoice.seller.vatRegistrationNumber} mono />
                <InfoItem label="السجل التجاري" value={invoice.seller.crNumber} mono />
                <InfoItem label="العنوان" value={invoice.seller.addressAr} />
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h2 className="mb-2 border-b border-emerald-200 pb-2 text-sm font-black text-emerald-900">بيانات الفاتورة</h2>
                <InfoItem label="رقم الفاتورة" value={invoice.invoiceNumber} mono />
                <InfoItem label="رقم الاشتراك" value={invoice.subscription.displayId} mono />
                <InfoItem label="تاريخ الإصدار" value={formatDateTime(invoice.issuedAt)} />
                <InfoItem label="الحالة" value={paymentStatusLabel(invoice.payment?.status)} />
              </section>

              <section className="flex min-h-[150px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-3 text-center">
                {isTaxInvoice && tax?.qr?.payloadBase64 ? (
                  <>
                    <QRCodeSVG
                      value={tax.qr.payloadBase64}
                      size={126}
                      level="M"
                      aria-label="Tax invoice QR code"
                    />
                    <p className="mt-2 text-[10px] font-bold text-slate-600">QR الفاتورة الضريبية</p>
                  </>
                ) : (
                  <>
                    <QrCode className="size-10 text-slate-300" />
                    <p className="mt-2 text-[10px] text-slate-400">لا يوجد QR ضريبي لهذه الفاتورة</p>
                  </>
                )}
              </section>
            </div>

            <div className="grid gap-4 px-6 py-4 sm:grid-cols-2 sm:px-9">
              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h2 className="mb-2 border-b border-emerald-200 pb-2 text-sm font-black text-emerald-900">معلومات العميل</h2>
                <InfoItem label="الاسم" value={invoice.customer.name || "—"} />
                <InfoItem label="الجوال" value={invoice.customer.phone || "—"} />
                {invoice.customer.email ? <InfoItem label="البريد" value={invoice.customer.email} /> : null}
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h2 className="mb-2 border-b border-emerald-200 pb-2 text-sm font-black text-emerald-900">تفاصيل الاشتراك</h2>
                <InfoItem label="الباقة" value={invoice.subscription.planName.ar || invoice.subscription.planName.en || "—"} />
                <InfoItem label="حالة الاشتراك" value={statusLabel(invoice.subscription.status)} />
                <InfoItem label="الاستلام" value={deliveryModeLabel(invoice.subscription.deliveryMode)} />
                <InfoItem label="الفترة" value={`${formatDate(invoice.subscription.startDate)} — ${formatDate(invoice.subscription.endDate)}`} />
              </section>
            </div>

            <div className="px-6 sm:px-9">
              <section className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between bg-emerald-900 px-4 py-3 text-white">
                  <div>
                    <h2 className="font-black">التفاصيل المالية</h2>
                    {isTaxInvoice ? <p className="mt-0.5 text-[10px] text-emerald-100">الأسعار شاملة ضريبة القيمة المضافة</p> : null}
                  </div>
                  <span className="text-xs text-emerald-100">العملة: {currency}</span>
                </div>

                <div>
                  {lineItems.map((item, index) => (
                    <AmountRow
                      key={`${item.kind}-${index}`}
                      label={item.labelAr}
                      value={formatMoney(item.amountHalala, currency)}
                      negative={item.amountHalala < 0}
                    />
                  ))}
                </div>

                {isTaxInvoice ? (
                  <div className="border-t-2 border-emerald-800 bg-slate-50">
                    <AmountRow
                      label="الإجمالي قبل ضريبة القيمة المضافة"
                      value={formatMoney(tax?.subtotalExcludingVatHalala ?? null, currency)}
                      muted
                    />
                    <AmountRow
                      label={`ضريبة القيمة المضافة (${tax?.vatPercentage ?? 15}%)`}
                      value={formatMoney(tax?.vatHalala ?? null, currency)}
                    />
                    <AmountRow
                      label={invoice.payment ? "الإجمالي المدفوع شامل الضريبة" : "الإجمالي شامل الضريبة"}
                      value={formatMoney(printedTotal, currency)}
                      strong
                    />
                  </div>
                ) : (
                  <AmountRow
                    label={invoice.payment ? "الإجمالي المدفوع" : "الإجمالي النهائي"}
                    value={formatMoney(printedTotal, currency)}
                    strong
                  />
                )}
              </section>
            </div>

            <div className="grid gap-4 px-6 py-4 sm:grid-cols-2 sm:px-9">
              <section className="rounded-xl border border-slate-200 p-4">
                <h2 className="text-sm font-black text-emerald-900">طريقة الدفع</h2>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {paymentMethodLabel(invoice.payment?.method || null, invoice.payment?.provider || "")}
                </p>
                <p className="mt-1 text-xs text-slate-500">تاريخ الدفع: {formatDateTime(invoice.payment?.paidAt || invoice.issuedAt)}</p>
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <h2 className="text-sm font-black text-emerald-900">ملخص الخدمة</h2>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-slate-500">عدد الوجبات:</span> <b>{invoice.subscription.totalMeals ?? "—"}</b></div>
                  <div><span className="text-slate-500">وجبات/يوم:</span> <b>{invoice.subscription.selectedMealsPerDay ?? "—"}</b></div>
                  <div><span className="text-slate-500">الجرامات:</span> <b>{invoice.subscription.selectedGrams ? `${invoice.subscription.selectedGrams} جم` : "—"}</b></div>
                  <div><span className="text-slate-500">طريقة الاستلام:</span> <b>{deliveryModeLabel(invoice.subscription.deliveryMode)}</b></div>
                </div>
              </section>
            </div>

            {isTaxInvoice ? (
              <div className="mx-6 mb-4 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-4 py-2 text-xs text-emerald-900 sm:mx-9">
                <ShieldCheck className="size-4 shrink-0" />
                <span>الأسعار في هذه الفاتورة شاملة ضريبة القيمة المضافة بنسبة {tax?.vatPercentage ?? 15}%.</span>
              </div>
            ) : null}

            <footer className="mt-auto border-t border-slate-200 bg-slate-50 px-6 py-4 text-center sm:px-9">
              <p className="font-bold text-emerald-900">شكراً لاختياركم Basic Diet</p>
              <p className="mt-1 text-xs text-slate-500">
                {isTaxInvoice
                  ? "فاتورة ضريبية مبسطة مرتبطة بسجل الاشتراك والدفع المحفوظ في النظام."
                  : "هذه الفاتورة مرتبطة بسجل الاشتراك والدفع المحفوظ في النظام."}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-slate-400">
                <span dir="ltr">{invoice.invoiceNumber}</span>
                <span dir="ltr">{invoice.subscription.displayId}</span>
                {isTaxInvoice ? <span dir="ltr">VAT {invoice.seller.vatRegistrationNumber}</span> : null}
                <span>{formatDate(invoice.issuedAt)}</span>
              </div>
            </footer>
          </div>
        ) : null}
      </div>
    </div>
  );
}
