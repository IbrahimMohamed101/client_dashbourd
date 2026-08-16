import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Loader2, Printer, X } from "lucide-react";
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
    vatPercentage: number | null;
    vatHalala: number;
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

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
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
  if (status === "expired" || status === "completed") return "منتهي";
  if (status === "canceled") return "ملغى";
  return status || "—";
}

function InfoItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="shrink-0 text-xs font-medium text-slate-500">{label}</span>
      <span className="text-left text-sm font-semibold text-slate-800" dir="auto">
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
}: {
  label: string;
  value: string;
  strong?: boolean;
  negative?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-0 ${
        strong ? "bg-emerald-50/70 text-base" : "text-sm"
      }`}
    >
      <span className={strong ? "font-bold text-emerald-950" : "text-slate-600"}>{label}</span>
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
  const printedTotal = financial?.totalHalala ?? null;
  const hasInternalMismatch = financial?.reconciliationStatus === "payment_authoritative_mismatch";
  const lineItems = financial?.lineItems || [];

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6" dir="rtl">
      <style>{`
        @media print {
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
          }
          .invoice-no-print { display: none !important; }
          @page { size: A4; margin: 9mm; }
        }
      `}</style>

      <div className="invoice-no-print mx-auto mb-3 flex w-full max-w-[210mm] items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-xl">
        <div>
          <p className="font-bold text-slate-900">معاينة فاتورة الاشتراك</p>
          <p className="text-xs text-slate-500">راجع البيانات ثم اطبع نسخة العميل.</p>
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
            <div className="border-b-4 border-emerald-800 bg-gradient-to-l from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-6 text-white sm:px-10">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
                    <img src="/logo.png" alt="Basic Diet" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <p className="text-2xl font-black tracking-tight">Basic Diet</p>
                    <p className="mt-1 text-sm text-emerald-100">بيسك دايت</p>
                  </div>
                </div>
                <div className="text-left" dir="rtl">
                  <h1 className="text-3xl font-black">فاتورة اشتراك</h1>
                  <p className="mt-1 text-xs font-medium tracking-[0.18em] text-emerald-100" dir="ltr">
                    SUBSCRIPTION INVOICE
                  </p>
                </div>
              </div>
            </div>

            {!financial?.financialDataComplete ? (
              <div className="m-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:mx-10">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="font-bold">البيانات المالية التاريخية غير مكتملة</p>
                  <p className="mt-1">لن يتم طباعة مبلغ تقديري. يلزم وجود سجل دفع أو إجمالي تاريخي موثوق للاشتراك.</p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-10">
              <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <h2 className="mb-2 border-b border-emerald-200 pb-2 text-sm font-black text-emerald-900">ملخص الفاتورة</h2>
                <InfoItem label="رقم الفاتورة" value={invoice.invoiceNumber} />
                <InfoItem label="رقم الاشتراك" value={invoice.subscription.displayId} />
                <InfoItem label="تاريخ الإصدار" value={formatDateTime(invoice.issuedAt)} />
                <InfoItem label="الحالة" value={paymentStatusLabel(invoice.payment?.status)} />
              </section>

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
                <InfoItem label="البداية" value={formatDate(invoice.subscription.startDate)} />
                <InfoItem label="النهاية" value={formatDate(invoice.subscription.endDate)} />
              </section>
            </div>

            <div className="px-6 sm:px-10">
              <section className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex items-center justify-between bg-emerald-900 px-4 py-3 text-white">
                  <h2 className="font-black">التفاصيل المالية</h2>
                  <span className="text-xs text-emerald-100">العملة: {currency}</span>
                </div>
                <div>
                  {lineItems.map((item, index) => (
                    <AmountRow
                      key={`${item.kind}-${index}`}
                      label={
                        item.kind === "vat" && financial?.vatPercentage !== null
                          ? `${item.labelAr} (${financial?.vatPercentage}%) — ضمن الإجمالي`
                          : item.kind === "vat"
                            ? `${item.labelAr} — ضمن الإجمالي`
                            : item.labelAr
                      }
                      value={formatMoney(item.amountHalala, currency)}
                      negative={item.amountHalala < 0}
                    />
                  ))}
                  <AmountRow
                    label={invoice.payment ? "الإجمالي المدفوع" : "الإجمالي النهائي"}
                    value={formatMoney(printedTotal, currency)}
                    strong
                  />
                </div>
              </section>
            </div>

            <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-10">
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

            <div className="mt-auto border-t border-slate-200 bg-slate-50 px-6 py-5 text-center sm:px-10">
              <p className="font-bold text-emerald-900">شكراً لاختياركم Basic Diet</p>
              <p className="mt-1 text-xs text-slate-500">هذه الفاتورة مرتبطة بسجل الاشتراك والدفع المحفوظ في النظام.</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-slate-400">
                <span dir="ltr">{invoice.invoiceNumber}</span>
                <span dir="ltr">{invoice.subscription.displayId}</span>
                <span>{formatDate(invoice.issuedAt)}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
