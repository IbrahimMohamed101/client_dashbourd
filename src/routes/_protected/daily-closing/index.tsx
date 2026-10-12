import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Check, CheckCircle2, ChevronDown, ChevronUp, FileCheck2, Info, Plus, RefreshCw, Save, Send, ShoppingBag, Store, Trash2, Wallet, CreditCard } from "lucide-react";

import api from "@/lib/apis";
import { useAuth } from "@/hooks/useAuth";
import { getTodayKSADate } from "@/utils/ksaDate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_protected/daily-closing/")({
  component: DailyClosingPage,
});

type OtherChannel = { name: string; amountHalala: number };
type ClosingValues = {
  channels: { restaurantHalala: number; hungerstationHalala: number; keetaHalala: number; other: OtherChannel[] };
  collections: { cashHalala: number; cardHalala: number };
  confirmedSubscriptionCount: number | null;
  discrepancyReason: string;
  notes: string;
};
type PaymentRow = {
  paymentId: string;
  subscriptionId: string | null;
  subscriptionStatus?: string;
  customerName?: string;
  amountHalala: number;
  method: string;
  paymentType?: string;
  paymentTypeLabelAr?: string;
  paymentStatus?: string;
  sourceChannel?: string;
  paidAt?: string;
  reference?: string;
  reviewReasons?: string[];
};
type Automatic = {
  count: number;
  newSubscriptionsCount?: number;
  paymentCount?: number;
  renewalPaymentsCount?: number;
  distinctSubscriptionsCount?: number;
  orphanPaymentsCount?: number;
  reviewPaymentsCount?: number;
  issues?: { paymentId: string; reasons: string[] }[];
  amountHalala: number;
  grossCollectionsHalala?: number;
  accountingNetHalala?: number;
  refundsHalala?: number;
  refundCount?: number;
  cashHalala: number;
  cardHalala: number;
  moyasarHalala: number;
  unknownHalala: number;
  inferredPaymentDatesCount: number;
  rows: PaymentRow[];
};
type Summary = {
  totalSalesHalala: number; appReceivablesHalala: number; localExpectedHalala: number;
  localRecordedHalala: number; localDifferenceHalala: number; overallDifferenceHalala: number;
  recordedPlusReceivablesHalala: number; subscriptionCountDifference: number;
};
type ClosingView = ClosingValues & {
  businessDate: string; status: "new" | "draft" | "submitted" | "approved";
  automatic: Automatic; summary: Summary; submittedAt: string | null; approvedAt: string | null;
  history: { actor: string; action: string; reason: string; at: string }[];
};
type ClosingResponse = { status: boolean; data: ClosingView };

type FormState = {
  restaurant: string; hungerstation: string; keeta: string;
  other: { name: string; amount: string }[];
  cash: string; card: string;
  confirmedCount: string; discrepancyReason: string; notes: string;
};

const moneySar = (halala: number) =>
  new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", minimumFractionDigits: 2 }).format(halala / 100);
const inputSar = (halala: number) => (halala / 100).toFixed(2);
const toHalala = (value: string) => Math.round(Number(value) * 100);
const defaultForm: FormState = {
  restaurant: "0", hungerstation: "0", keeta: "0", other: [], cash: "0", card: "0",
  confirmedCount: "", discrepancyReason: "", notes: "",
};

function formFromView(view: ClosingView): FormState {
  return {
    restaurant: inputSar(view.channels.restaurantHalala),
    hungerstation: inputSar(view.channels.hungerstationHalala),
    keeta: inputSar(view.channels.keetaHalala),
    other: view.channels.other.map((x) => ({ name: x.name, amount: inputSar(x.amountHalala) })),
    cash: inputSar(view.collections.cashHalala),
    card: inputSar(view.collections.cardHalala),
    confirmedCount: view.confirmedSubscriptionCount === null ? "" : String(view.confirmedSubscriptionCount),
    discrepancyReason: view.discrepancyReason, notes: view.notes,
  };
}
function parseForm(form: FormState): ClosingValues {
  const all = [form.restaurant, form.hungerstation, form.keeta, form.cash, form.card, ...form.other.map(x => x.amount)];
  if (all.some(v => !v.trim() || !/^\d+(?:\.\d{1,2})?$/.test(v) || !Number.isSafeInteger(toHalala(v)) || toHalala(v) > 1e12))
    throw new Error("يجب إدخال مبالغ صحيحة بالريال، بحد أقصى منزلتين عشريتين");
  if (form.other.some(x => !x.name.trim())) throw new Error("اكتب اسم التطبيق الإضافي");
  if (form.confirmedCount.trim() && (!/^\d+$/.test(form.confirmedCount) || !Number.isSafeInteger(Number(form.confirmedCount))))
    throw new Error("عدد الاشتراكات المؤكد يجب أن يكون رقمًا صحيحًا");
  return {
    channels: {
      restaurantHalala: toHalala(form.restaurant),
      hungerstationHalala: toHalala(form.hungerstation),
      keetaHalala: toHalala(form.keeta),
      other: form.other.map(x => ({ name: x.name.trim(), amountHalala: toHalala(x.amount) })),
    },
    collections: { cashHalala: toHalala(form.cash), cardHalala: toHalala(form.card) },
    confirmedSubscriptionCount: form.confirmedCount.trim() ? Number(form.confirmedCount) : null,
    discrepancyReason: form.discrepancyReason.trim(), notes: form.notes.trim(),
  };
}
function formatError(error: unknown) {
  const e = error as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || "تعذر تنفيذ العملية";
}

function DailyClosingPage() {
  const { user } = useAuth();
  const canApprove = user?.role === "admin" || user?.role === "superadmin";
  const [date, setDate] = useState(getTodayKSADate());
  const [form, setForm] = useState<FormState>(defaultForm);
  const [returnReason, setReturnReason] = useState("");
  const [edited, setEdited] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showCountCorrection, setShowCountCorrection] = useState(false);
  const [showExtraNotes, setShowExtraNotes] = useState(false);
  const queryClient = useQueryClient();
  const key = ["daily-cash-closing", date];
  const query = useQuery({
    queryKey: key,
    queryFn: async () => (await api.get<ClosingResponse>(`/api/dashboard/daily-closings/${date}`)).data.data,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const view = query.data;
  const locked = view?.status === "submitted" || view?.status === "approved";
  useEffect(() => {
    if (view && !edited) {
      setForm(formFromView(view));
      if (view.confirmedSubscriptionCount !== null) setShowCountCorrection(true);
      if (view.notes) setShowExtraNotes(true);
    }
  }, [view, edited]);
  useEffect(() => {
    if (!edited) return;
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [edited]);
  const change = (key: keyof FormState, value: string) => {
    setEdited(true);
    setForm(f => ({ ...f, [key]: value }));
  };
  const updateOther = (next: (current: FormState["other"]) => FormState["other"]) => {
    setEdited(true);
    setForm(f => ({ ...f, other: next(f.other) }));
  };
  const changeDate = (nextDate: string) => {
    if (!nextDate || nextDate === date) return;
    if (edited && !window.confirm("فيه تعديلات لسه متحفظتش. عايز تغير التاريخ وتلغي التعديلات؟")) return;
    setEdited(false);
    setDate(nextDate);
    setForm(defaultForm);
    setShowPayments(false);
    setShowCountCorrection(false);
    setShowExtraNotes(false);
  };
  const action = useMutation({
    mutationFn: async (kind: "save" | "submit" | "approve" | "return") => {
      if (kind === "save" || kind === "submit") {
        const saved = (await api.put<ClosingResponse>(`/api/dashboard/daily-closings/${date}`, parseForm(form))).data.data;
        if (kind === "save") return saved;
      }
      return (await api.post<ClosingResponse>(`/api/dashboard/daily-closings/${date}/${kind}`,
        kind === "return" ? { reason: returnReason } : {})).data.data;
    },
    onSuccess: (value, kind) => {
      queryClient.setQueryData(key, value);
      setEdited(false);
      setReturnReason("");
      toast.success({ save: "تم حفظ المسودة", submit: "تم إرسال التقفيلة للمراجعة", approve: "تم اعتماد التقفيلة", return: "تمت إعادة التقفيلة للتعديل" }[kind]);
    },
    onError: (e) => toast.error(formatError(e)),
  });

  const automatic = view?.automatic;
  const asHalala = (value: string) => Number.isFinite(Number(value)) ? Math.round(Number(value) * 100) : 0;
  const restaurant = asHalala(form.restaurant);
  const apps = asHalala(form.hungerstation) + asHalala(form.keeta) + form.other.reduce((s, x) => s + asHalala(x.amount), 0);
  const sales = restaurant + apps + (automatic?.amountHalala ?? 0);
  const collected = asHalala(form.cash) + asHalala(form.card);
  const expected = restaurant + (automatic?.cashHalala ?? 0) + (automatic?.cardHalala ?? 0);
  const receivedAndDue = collected + apps + (automatic?.moyasarHalala ?? 0);
  const overallDifference = receivedAndDue - sales;
  const count = form.confirmedCount.trim() ? Number(form.confirmedCount) : automatic?.count ?? 0;
  const countDiff = count - (automatic?.count ?? 0);
  const status = view?.status || "new";
  const statusLabels = { new: "لم تُحفظ", draft: "مسودة محفوظة", submitted: "بانتظار اعتماد المدير", approved: "معتمدة" };
  const reviewNeeded = countDiff !== 0 || collected !== expected || overallDifference !== 0 ||
    (automatic?.reviewPaymentsCount ?? 0) > 0 ||
    (automatic?.unknownHalala ?? 0) > 0 || (automatic?.refundsHalala ?? 0) > 0;
  const totalChannelSales = restaurant + apps;
  const differenceLabel = overallDifference === 0 ? (reviewNeeded ? "توجد ملاحظات للمراجعة" : "المبالغ متطابقة") : overallDifference < 0 ? "يوجد عجز" : "يوجد زيادة";
  const canEdit = !locked && !action.isPending;

  const amountField = (label: string, id: "restaurant" | "hungerstation" | "keeta" | "cash" | "card", hint?: string) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input id={id} dir="ltr" inputMode="decimal" type="number" min="0" step="0.01"
          onFocus={e => e.currentTarget.select()} disabled={!canEdit} value={form[id]}
          onChange={e => change(id, e.target.value)}
          className="h-12 rounded-xl border-border/70 bg-background ps-4 pe-14 text-left text-lg font-semibold tabular-nums shadow-none focus-visible:ring-2" />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">ر.س</span>
      </div>
      {hint && <p className="text-xs leading-5 text-muted-foreground">{hint}</p>}
    </div>
  );
  const errorNotice = (message: string) => (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{message}</div>
  );


  return (
    <div dir="rtl" className="mx-auto w-full max-w-5xl space-y-5 px-3 pb-32 pt-2 text-right sm:px-5 md:space-y-6 md:px-7">
      <header className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-l from-primary/10 via-background to-background p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardCheck className="size-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">بيسك دايت / حسابات المطعم</p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">تقفيلة اليوم</h1>
              <p className="max-w-lg text-sm leading-6 text-muted-foreground">سجّل مبيعات كل مصدر، ثم طابق الكاش والشبكة مع إجمالي اليوم.</p>
            </div>
          </div>
          <Badge variant="outline" className="h-8 rounded-full bg-background px-3 text-xs font-medium">
            {status === "approved" && <CheckCircle2 className="ms-1 size-3.5 text-emerald-600" aria-hidden="true" />}
            {statusLabels[status]}
          </Badge>
        </div>
        <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-border/50 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="business-date" className="text-xs text-muted-foreground">تاريخ يوم العمل — السعودية</Label>
            <Input id="business-date" dir="ltr" type="date" className="h-11 w-44 rounded-xl bg-background" value={date}
              disabled={action.isPending} onChange={e => changeDate(e.target.value)} />
          </div>
          <Button variant="outline" className="h-11 rounded-xl bg-background" disabled={query.isFetching || action.isPending}
            onClick={() => query.refetch()}>
            <RefreshCw className={query.isFetching ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
            تحديث البيانات
          </Button>
          {edited && <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">تعديلات غير محفوظة</span>}
        </div>
      </header>

      {query.isLoading
        ? <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground" role="status">جاري تحميل تقفيلة اليوم...</div>
        : query.isError
          ? errorNotice(formatError(query.error))
          : view ? (
            <>
              <section aria-label="ملخص التقفيلة" className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">إجمالي مبيعات اليوم</p>
                    <p className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl" dir="ltr">{moneySar(sales)}</p>
                    <p className="text-xs leading-5 text-muted-foreground">المطعم + التطبيقات + تحصيل الاشتراكات قبل الاستردادات</p>
                  </div>
                  <div className={!reviewNeeded
                    ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                    : "rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"}>
                    <p className="flex items-center gap-2 text-xs font-semibold">
                      {!reviewNeeded ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
                      {differenceLabel}
                    </p>
                    <p dir="ltr" className="mt-1 text-xl font-bold tabular-nums">{moneySar(overallDifference)}</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 border-t pt-4 sm:grid-cols-4">
                  <Value label="مبيعات القنوات" value={moneySar(totalChannelSales)} />
                  <Value label="تحصيل الاشتراكات" value={moneySar(automatic?.amountHalala ?? 0)} />
                  <Value label="المحصّل كاش + شبكة" value={moneySar(collected)} />
                  <Value label="مستحقات التطبيقات" value={moneySar(apps)} />
                </div>
              </section>

              <section id="closing-sales" aria-labelledby="closing-sales-title" className="scroll-mt-5">
                <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 shadow-sm">
                  <CardHeader className="border-b border-border/60 bg-muted/20 px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Store className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <CardTitle id="closing-sales-title" className="text-base sm:text-lg">1. المبيعات</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">انقل الإجماليات من تقارير المطعم وتطبيقات التوصيل.</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 px-4 py-5 sm:px-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-primary/20 bg-primary/[0.035] p-4">
                        {amountField("مبيعات المطعم", "restaurant", "الطلبات المباشرة فقط، بدون الاشتراكات.")}
                      </div>
                      <div className="rounded-2xl border border-border/70 p-4">
                        {amountField("مبيعات هنجرستيشن", "hungerstation")}
                      </div>
                      <div className="rounded-2xl border border-border/70 p-4">
                        {amountField("مبيعات كيتا", "keeta")}
                      </div>
                      {form.other.map((app, index) => (
                        <div key={index} className="rounded-2xl border border-border/70 p-4">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <Label htmlFor={"extra-name-" + index}>اسم التطبيق الإضافي</Label>
                            {canEdit && <Button variant="ghost" size="icon" type="button" aria-label="حذف التطبيق"
                              onClick={() => updateOther(items => items.filter((_, i) => i !== index))}>
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>}
                          </div>
                          <Input id={"extra-name-" + index} className="mb-3 h-11 rounded-xl" value={app.name}
                            placeholder="مثال: تطبيق توصيل" disabled={!canEdit}
                            onChange={e => updateOther(items => items.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} />
                          <Label htmlFor={"extra-amount-" + index} className="mb-2 block">إجمالي المبيعات (ر.س)</Label>
                          <Input id={"extra-amount-" + index} type="number" min="0" step="0.01" dir="ltr"
                            className="h-12 rounded-xl text-left text-lg font-semibold tabular-nums"
                            disabled={!canEdit} value={app.amount} onFocus={e => e.currentTarget.select()}
                            onChange={e => updateOther(items => items.map((item, i) => i === index ? { ...item, amount: e.target.value } : item))} />
                        </div>
                      ))}
                    </div>
                    {canEdit && form.other.length < 12 && <Button variant="outline" className="w-full rounded-xl border-dashed sm:w-auto" type="button"
                      onClick={() => updateOther(items => [...items, { name: "", amount: "0" }])}>
                      <Plus className="size-4" aria-hidden="true" /> إضافة تطبيق توصيل
                    </Button>}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/50 px-4 py-3">
                      <span className="text-sm font-medium">إجمالي مبيعات المطعم والتطبيقات</span>
                      <strong dir="ltr" className="text-lg tabular-nums">{moneySar(totalChannelSales)}</strong>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="closing-collections" aria-labelledby="closing-collections-title">
                <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 shadow-sm">
                  <CardHeader className="border-b border-border/60 bg-muted/20 px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Wallet className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <CardTitle id="closing-collections-title" className="text-base sm:text-lg">2. التحصيل</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">اكتب اللي اتحصّل بالفعل من الكاشير، مش إجمالي كل المبيعات.</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5 px-4 py-5 sm:px-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-border/70 p-4">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                          <Wallet className="size-4" aria-hidden="true" /><span className="text-xs">الخزنة / الدرج</span>
                        </div>
                        {amountField("المدفوع كاش", "cash")}
                      </div>
                      <div className="rounded-2xl border border-border/70 p-4">
                        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                          <CreditCard className="size-4" aria-hidden="true" /><span className="text-xs">جهاز نقاط البيع</span>
                        </div>
                        {amountField("المدفوع شبكة", "card")}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Check className="size-4 text-primary" aria-hidden="true" />
                        <div>
                          <p className="text-sm font-semibold">ميسر — محسوب تلقائيًا</p>
                          <p className="text-xs text-muted-foreground">لا تضيف مبلغ ميسر للكاش أو الشبكة مرة ثانية.</p>
                        </div>
                      </div>
                      <strong dir="ltr" className="text-lg tabular-nums">{moneySar(automatic?.moyasarHalala ?? 0)}</strong>
                    </div>
                    <div className="space-y-3 rounded-2xl bg-muted/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span>المفروض يتحصّل كاش وشبكة</span>
                        <strong dir="ltr" className="tabular-nums">{moneySar(expected)}</strong>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span>المسجّل فعليًا كاش وشبكة</span>
                        <strong dir="ltr" className="tabular-nums">{moneySar(collected)}</strong>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                        <span className="font-semibold">الفرق</span>
                        <strong dir="ltr" className={collected === expected ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}>
                          {moneySar(collected - expected)}
                        </strong>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section id="closing-subscriptions" aria-labelledby="closing-subscriptions-title">
                <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 shadow-sm">
                  <CardHeader className="border-b border-border/60 bg-muted/20 px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ShoppingBag className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <CardTitle id="closing-subscriptions-title" className="text-base sm:text-lg">3. الاشتراكات</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">البيانات بتتحسب من المدفوعات المسجلة في النظام تلقائيًا.</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 py-5 sm:px-6">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <Value label="اشتراكات جديدة" value={String(automatic?.count ?? 0)} />
                      <Value label="تحصيل الاشتراكات" value={moneySar(automatic?.amountHalala ?? 0)} />
                      <Value label="عدد عمليات الدفع" value={String(automatic?.paymentCount ?? automatic?.rows.length ?? 0)} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3">
                      <div>
                        <p className="font-medium">مراجعة عمليات الاشتراكات</p>
                        <p className="text-xs text-muted-foreground">
                          {(automatic?.renewalPaymentsCount ?? 0)} تجديدات • {(automatic?.reviewPaymentsCount ?? 0)} عمليات تحتاج مراجعة
                        </p>
                      </div>
                      <Button variant="outline" type="button" className="rounded-xl" aria-expanded={showPayments}
                        aria-controls="closing-payment-details" onClick={() => setShowPayments(v => !v)}>
                        {showPayments ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                        {showPayments ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </Button>
                    </div>
                    {((automatic?.reviewPaymentsCount ?? 0) > 0 || (automatic?.unknownHalala ?? 0) > 0) &&
                      <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        توجد عمليات تحتاج مراجعة؛ افتح التفاصيل وتأكد منها قبل الإرسال.
                      </div>}
                    {showPayments && <div id="closing-payment-details" className="space-y-4 rounded-xl border p-4">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Value label="تجديد الاشتراكات" value={String(automatic?.renewalPaymentsCount ?? 0)} />
                        <Value label="اشتراكات كاش" value={moneySar(automatic?.cashHalala ?? 0)} />
                        <Value label="اشتراكات شبكة" value={moneySar(automatic?.cardHalala ?? 0)} />
                        <Value label="استردادات محاسبية" value={moneySar(automatic?.refundsHalala ?? 0)} warning={(automatic?.refundsHalala ?? 0) > 0} />
                      </div>
                      <div className="flex justify-between gap-3 rounded-lg bg-muted/40 p-3 text-sm">
                        <span>صافي التحصيل المحاسبي بعد الاستردادات</span>
                        <strong dir="ltr">{moneySar(automatic?.accountingNetHalala ?? automatic?.amountHalala ?? 0)}</strong>
                      </div>
                      {(automatic?.refundsHalala ?? 0) > 0 && <p className="text-xs text-amber-700">
                        الاسترداد المحاسبي ليس دليلًا على خروج المبلغ فعليًا؛ تُراجع التسوية مع المدير.
                      </p>}
                      <div className="max-h-80 space-y-3 overflow-auto" aria-label="حركات دفع الاشتراكات">
                        {(automatic?.rows ?? []).length === 0 && <p className="py-3 text-center text-sm text-muted-foreground">لا توجد عمليات مدفوعة في هذا اليوم.</p>}
                        {(automatic?.rows ?? []).map(row => <div key={row.paymentId} className="space-y-2 border-b pb-3 text-sm last:border-b-0">
                          <div className="flex flex-wrap justify-between gap-2">
                            <strong>{row.paymentTypeLabelAr || "دفعة اشتراك"}</strong>
                            <strong dir="ltr" className="tabular-nums">{moneySar(row.amountHalala)}</strong>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{row.customerName || "عميل غير معروف"}</span>
                            <span>{row.method === "moyasar" ? "ميسر" : row.method === "cash" ? "كاش" : row.method === "card" ? "شبكة" : "غير محدد"}</span>
                            <span>{row.sourceChannel === "app" ? "من التطبيق" : row.sourceChannel === "dashboard" ? "من الداشبورد" : "مصدر غير محدد"}</span>
                            <span>حالة الاشتراك: {row.subscriptionStatus || "غير متاحة"}</span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <p>الاشتراك: <code dir="ltr" className="select-all break-all">{row.subscriptionId || "غير مرتبط"}</code></p>
                            <p>مرجع الدفع: <code dir="ltr" className="select-all break-all">{row.reference || row.paymentId}</code></p>
                          </div>
                          {(row.reviewReasons?.length ?? 0) > 0 && <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                            {row.reviewReasons?.map((reason, i) => <p key={i}>{reason}</p>)}
                          </div>}
                        </div>)}
                      </div>
                    </div>}
                    <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                      aria-expanded={showCountCorrection} onClick={() => setShowCountCorrection(v => !v)}>
                      عدد الاشتراكات عند الموظف مختلف؟
                      {showCountCorrection ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                    {showCountCorrection && <div className="space-y-2 rounded-xl border p-4">
                      <Label htmlFor="confirmed-count">عدد الاشتراكات الجديدة المؤكد من الموظف</Label>
                      <Input id="confirmed-count" dir="ltr" type="number" min="0" step="1" className="h-11 max-w-xs rounded-xl text-left"
                        disabled={!canEdit} placeholder={String(automatic?.count ?? 0)} value={form.confirmedCount}
                        onChange={e => change("confirmedCount", e.target.value)} />
                      <p className="text-xs text-muted-foreground">
                        سيظل رقم النظام كما هو. سجّل العدد الفعلي لو مختلف، واكتب السبب في المراجعة.
                      </p>
                      <p className={countDiff === 0 ? "text-xs text-emerald-700" : "text-xs text-amber-700"}>
                        فرق العدد: {countDiff}
                      </p>
                    </div>}
                  </CardContent>
                </Card>
              </section>

              <section id="closing-review" aria-labelledby="closing-review-title">
                <Card className="gap-0 overflow-hidden rounded-2xl border-border/70 shadow-sm">
                  <CardHeader className="border-b border-border/60 bg-muted/20 px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FileCheck2 className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <CardTitle id="closing-review-title" className="text-base sm:text-lg">4. مراجعة التقفيلة</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">راجع الفرق واكتب السبب لو فيه أي اختلاف.</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 py-5 sm:px-6">
                    <div className="space-y-2 rounded-2xl bg-muted/40 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span>إجمالي المبيعات</span><strong dir="ltr">{moneySar(sales)}</strong>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span>تحصيل + ميسر + مستحقات التطبيقات</span><strong dir="ltr">{moneySar(receivedAndDue)}</strong>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-base">
                        <span className="font-semibold">فرق التقفيلة</span>
                        <strong dir="ltr" className={overallDifference === 0 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}>
                          {moneySar(overallDifference)}
                        </strong>
                      </div>
                    </div>
                    {reviewNeeded ? <div role="alert" className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      فيه فرق في المبالغ أو الاشتراكات، أو حركة محتاجة مراجعة. اكتب السبب قبل إرسال التقفيلة.
                    </div> : <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                      المبالغ متطابقة ولا توجد ملاحظات تستدعي التوضيح حسب البيانات الحالية.
                    </div>}
                    <div className="space-y-2">
                      <Label htmlFor="discrepancy-reason">
                        {reviewNeeded ? "سبب الفرق أو الملاحظة (مطلوب)" : "سبب الفرق أو الملاحظة (اختياري)"}
                      </Label>
                      <Textarea id="discrepancy-reason" disabled={!canEdit} rows={3} className="min-h-24 rounded-xl"
                        placeholder="مثلاً: يوجد اشتراك ملغي، أو مبلغ الشبكة لم يظهر في التقرير..."
                        value={form.discrepancyReason} onChange={e => change("discrepancyReason", e.target.value)} />
                      {reviewNeeded && !form.discrepancyReason.trim() && <p className="text-xs text-amber-700">اكتب سبب الاختلاف لتقدر ترسل التقفيلة للمراجعة.</p>}
                    </div>
                    <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      aria-expanded={showExtraNotes} onClick={() => setShowExtraNotes(v => !v)}>
                      ملاحظات إضافية (اختياري) {showExtraNotes ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                    {showExtraNotes && <div className="space-y-2">
                      <Label htmlFor="closing-notes">ملاحظات الموظف</Label>
                      <Textarea id="closing-notes" disabled={!canEdit} rows={2} className="rounded-xl" value={form.notes}
                        onChange={e => change("notes", e.target.value)} placeholder="أي تفاصيل تفيد المدير عند المراجعة..." />
                    </div>}
                    <div className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
                      <Info className="mt-1 size-4 shrink-0" aria-hidden="true" />
                      هنجرستيشن وكيتا مستحقات وليست بالضرورة أموالًا وصلت البنك. المبيعات لا تعني صافي الربح.
                    </div>
                    {view.history.length > 0 && <details className="rounded-xl border p-3 text-sm">
                      <summary className="cursor-pointer font-medium">سجل الإجراءات ({view.history.length})</summary>
                      <div className="mt-3 space-y-2">{view.history.map((entry, i) =>
                        <div key={i} className="border-b py-2 last:border-b-0">
                          <span>{entry.action} — {new Date(entry.at).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}</span>
                          {entry.reason && <p className="text-muted-foreground">{entry.reason}</p>}
                        </div>)}</div>
                    </details>}
                  </CardContent>
                </Card>
              </section>

              {status === "submitted" && <Card className="rounded-2xl border-border/70">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start gap-2 text-sm">
                    <FileCheck2 className="size-5 shrink-0 text-primary" aria-hidden="true" />
                    تم إرسال التقفيلة، وهي الآن مقفلة بانتظار اعتماد المدير.
                  </div>
                  {canApprove && <div className="space-y-3">
                    <Button disabled={action.isPending} className="h-11 rounded-xl" onClick={() => action.mutate("approve")}>
                      <CheckCircle2 className="size-4" aria-hidden="true" /> اعتماد التقفيلة
                    </Button>
                    <div className="space-y-2 border-t pt-3">
                      <Label htmlFor="return-reason">أو إرجاع التقفيلة للموظف مع السبب</Label>
                      <Textarea id="return-reason" className="rounded-xl" value={returnReason} onChange={e => setReturnReason(e.target.value)} />
                      <Button variant="outline" disabled={action.isPending || !returnReason.trim()} className="rounded-xl" onClick={() => action.mutate("return")}>إرجاع للتعديل</Button>
                    </div>
                  </div>}
                </CardContent>
              </Card>}
              {status === "approved" && <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
                <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
                التقفيلة معتمدة ومقفلة. أي تصحيح مالي بعد الاعتماد يحتاج إجراء إداري منفصل.
              </div>}

              {!locked && <div className="sticky bottom-3 z-20 rounded-2xl border border-border/70 bg-background/95 p-3 shadow-lg shadow-black/10 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{edited ? "فيه بيانات جديدة لسه متحفظتش" : "جاهز للحفظ أو الإرسال"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">يمكنك حفظ مسودة وترجع تكمل في أي وقت.</p>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto">
                    <Button variant="outline" className="h-11 flex-1 rounded-xl sm:flex-initial"
                      disabled={action.isPending} onClick={() => {
                        try { parseForm(form); action.mutate("save"); } catch (e) { toast.error(formatError(e)); }
                      }}>
                      <Save className="size-4" aria-hidden="true" /> حفظ مسودة
                    </Button>
                    <Button className="h-11 flex-1 rounded-xl sm:flex-initial" disabled={action.isPending}
                      onClick={() => {
                        try {
                          parseForm(form);
                          if (reviewNeeded && !form.discrepancyReason.trim()) {
                            toast.error("اكتب سبب الاختلاف في قسم مراجعة التقفيلة قبل الإرسال");
                            document.getElementById("closing-review")?.scrollIntoView({ behavior: "smooth", block: "start" });
                            return;
                          }
                          action.mutate("submit");
                        } catch (e) { toast.error(formatError(e)); }
                      }}>
                      <Send className="size-4" aria-hidden="true" />
                      {action.isPending ? "جارٍ الحفظ..." : "حفظ وإرسال"}
                    </Button>
                  </div>
                </div>
              </div>}
            </>
          ) : null}
    </div>
  );
}

function Value({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <div className={`rounded-xl border p-3 ${warning ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20" : "bg-muted/20"}`}>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 text-lg font-semibold" dir="auto">{value}</div>
  </div>;
}
