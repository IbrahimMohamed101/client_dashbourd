import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, FileCheck2, Plus, RefreshCw, Save, Send, Trash2 } from "lucide-react";

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
  useEffect(() => { if (view) setForm(formFromView(view)); }, [view]);
  const change = (key: keyof FormState, value: string) => setForm(f => ({ ...f, [key]: value }));
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
  const statusLabels = { new: "لم تُحفظ", draft: "مسودة", submitted: "بانتظار الاعتماد", approved: "معتمدة" };

  const amountField = (label: string, id: keyof FormState, hint?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input dir="ltr" className="text-left" id={id} inputMode="decimal" type="number" min="0" step="0.01"
          value={form[id] as string} disabled={locked || action.isPending} onChange={e => change(id, e.target.value)} />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-3 py-5 text-right md:px-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">تقفيلة الكاشير اليومية</h1>
          <p className="mt-1 text-sm text-muted-foreground">المبيعات والمبالغ المحصلة والمستحقة — الريال السعودي</p>
        </div>
        <Badge variant="outline">{statusLabels[status]}</Badge>
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-5">
          <div className="space-y-1.5">
            <Label htmlFor="business-date">تاريخ يوم العمل (توقيت السعودية)</Label>
            <Input id="business-date" type="date" dir="ltr" value={date}
              onChange={e => { setDate(e.target.value); setForm(defaultForm); }} />
          </div>
          <Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className="size-4" /> تحديث الاشتراكات</Button>
          <p className="text-xs text-muted-foreground">التاريخ مرتبط بمواعيد عمل المطعم، وقد يمتد لما بعد منتصف الليل.</p>
        </CardContent>
      </Card>
      {query.isLoading ? <Card><CardContent className="p-6">جاري تحميل التقفيلة...</CardContent></Card>
        : query.isError ? <Card><CardContent className="p-6 text-destructive">{formatError(query.error)}</CardContent></Card>
        : view ? <>
          <Card>
            <CardHeader><CardTitle>1. المبيعات حسب المصدر</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {amountField("مبيعات المطعم", "restaurant", "مبيعات الوجبات المباشرة فقط؛ الاشتراكات تظهر تلقائيًا أدناه.")}
                {amountField("مبيعات هنجرستيشن", "hungerstation")}
                {amountField("مبيعات كيتا", "keeta")}
              </div>
              {form.other.map((item, i) =>
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-36 flex-1 space-y-1.5">
                    <Label>اسم التطبيق الإضافي</Label>
                    <Input value={item.name} disabled={locked} onChange={e => setForm(f => ({ ...f, other: f.other.map((x, j) => i === j ? { ...x, name: e.target.value } : x) }))} />
                  </div>
                  <div className="min-w-36 flex-1 space-y-1.5">
                    <Label>المبيعات (ر.س)</Label>
                    <Input dir="ltr" inputMode="decimal" type="number" min="0" step="0.01" value={item.amount} disabled={locked}
                      onChange={e => setForm(f => ({ ...f, other: f.other.map((x, j) => i === j ? { ...x, amount: e.target.value } : x) }))} />
                  </div>
                  {!locked && <Button variant="outline" size="icon" aria-label="حذف التطبيق" onClick={() => setForm(f => ({ ...f, other: f.other.filter((_, j) => i !== j) }))}><Trash2 className="size-4" /></Button>}
                </div>
              )}
              {!locked && form.other.length < 12 && <Button variant="outline" onClick={() => setForm(f => ({ ...f, other: [...f.other, { name: "", amount: "0" }] }))}><Plus className="size-4" /> إضافة تطبيق آخر</Button>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>2. تحصيل الاشتراكات — من النظام مباشرة</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                عدد عمليات الدفع ليس بالضرورة عدد الاشتراكات. التفعيل الجديد يُحسب مرة لكل اشتراك مرتبط،
                والتجديدات تظهر منفصلة. المبالغ بالريال بعد تحويلها من الهللات.
              </p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Value label="اشتراكات جديدة (مميزة)" value={String(automatic?.count ?? 0)} />
                <Value label="عدد عمليات الدفع" value={String(automatic?.paymentCount ?? automatic?.rows.length ?? 0)} />
                <Value label="عمليات تجديد الاشتراكات" value={String(automatic?.renewalPaymentsCount ?? 0)} />
                <Value label="إجمالي تحصيل الاشتراكات قبل الاسترداد" value={moneySar(automatic?.amountHalala ?? 0)} />
                <Value label="ميسر / التطبيق" value={moneySar(automatic?.moyasarHalala ?? 0)} />
                <Value label="تحصيل اشتراكات كاش" value={moneySar(automatic?.cashHalala ?? 0)} />
                <Value label="تحصيل اشتراكات شبكة" value={moneySar(automatic?.cardHalala ?? 0)} />
                <Value label="استردادات مثبتة محاسبيًا" value={moneySar(automatic?.refundsHalala ?? 0)}
                  warning={(automatic?.refundsHalala ?? 0) > 0} />
              </div>
              <Value label="صافي تحصيل الاشتراكات المحاسبي بعد الاستردادات" value={moneySar(automatic?.accountingNetHalala ?? automatic?.amountHalala ?? 0)} />
              {(automatic?.refundsHalala ?? 0) > 0 && <p className="text-sm text-amber-700">
                الاسترداد المسجل محاسبيًا لا يعني بالضرورة أن المبلغ خرج فعليًا من البنك أو الصندوق؛ راجع حالة التسوية في صفحة المحاسبة.
              </p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="confirmed-count">الاشتراكات الجديدة المؤكدة من الكاشير (اختياري)</Label>
                  <Input id="confirmed-count" dir="ltr" type="number" min="0" step="1" placeholder={String(automatic?.count ?? 0)}
                    disabled={locked} value={form.confirmedCount} onChange={e => change("confirmedCount", e.target.value)} />
                </div>
                <Value label="فرق عدد الاشتراكات الجديدة" value={String(countDiff)} warning={countDiff !== 0} />
              </div>
              {(automatic?.rows.length ?? 0) > 0 && <div className="rounded-xl border p-3">
                <p className="mb-2 font-medium">تفاصيل حركات الدفع للمطابقة</p>
                <div className="max-h-80 space-y-3 overflow-auto text-sm">
                  {automatic?.rows.map(row => <div key={row.paymentId} className="space-y-1 border-b pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong>{row.paymentTypeLabelAr || (row.paymentType === "subscription_renewal" ? "تجديد اشتراك" : "عملية دفع اشتراك")}</strong>
                      <strong>{moneySar(row.amountHalala)}</strong>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{row.method === "moyasar" ? "ميسر" : row.method === "cash" ? "كاش" : row.method === "card" ? "شبكة" : "غير محدد"}</span>
                      <span>{row.customerName || "العميل غير معروف"}</span>
                      <span>حالة الاشتراك: {row.subscriptionStatus || "غير متاحة"}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span>رقم الاشتراك:</span>
                      <code dir="ltr" className="select-all">{row.subscriptionId || "لا يوجد اشتراك مرتبط"}</code>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span>مرجع الدفع:</span>
                      <code dir="ltr" className="select-all">{row.reference || row.paymentId}</code>
                    </div>
                    {(row.reviewReasons?.length ?? 0) > 0 && <div className="rounded-md border border-amber-300 bg-amber-50 p-2 text-amber-900">
                      {row.reviewReasons?.map((reason, i) => <p key={i}>{reason}</p>)}
                    </div>}
                  </div>)}
                </div>
              </div>}
              {(automatic?.reviewPaymentsCount ?? 0) > 0 && <p className="flex items-center gap-2 rounded-lg border border-amber-300 p-3 text-sm text-amber-800">
                <AlertTriangle className="size-4 shrink-0" /> يوجد {automatic?.reviewPaymentsCount} حركة دفع تحتاج مراجعة وسببًا مكتوبًا قبل اعتماد التقفيلة.
              </p>}
              {(automatic?.unknownHalala ?? 0) > 0 && <p className="flex items-center gap-2 text-sm text-amber-700">
                <AlertTriangle className="size-4" /> يوجد دفع اشتراك غير مصنف: {moneySar(automatic?.unknownHalala ?? 0)}
              </p>}
              {(automatic?.inferredPaymentDatesCount ?? 0) > 0 && <p className="text-sm text-amber-700">
                بعض المدفوعات لا تحتوي تاريخ تحصيل، واستُخدم تاريخ إنشائها مؤقتًا.
              </p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>3. التحصيل ومطابقة المبالغ</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">اكتب إجمالي الكاش والشبكة الفعليين لدى الكاشير بما فيهما اشتراكات المطعم المسجلة يدويًا؛ ميسر يُسحب تلقائيًا ولا تكتبه مرة أخرى.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {amountField("التحصيل النقدي — كاش", "cash")}
                {amountField("التحصيل بالشبكة", "card")}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Value label="ميسر — تلقائي" value={moneySar(automatic?.moyasarHalala ?? 0)} />
                <Value label="مستحقات تطبيقات التوصيل" value={moneySar(apps)} />
                <Value label="التحصيل المتوقع في المطعم" value={moneySar(expected)} />
                <Value label="فرق كاش + شبكة" value={moneySar(collected - expected)} warning={collected !== expected} />
                <Value label="إجمالي مبيعات اليوم" value={moneySar(sales)} />
                <Value label="المبيعات بعد الاستردادات المسجلة محاسبيًا" value={moneySar(sales - (automatic?.refundsHalala ?? 0))} />
                <Value label="التحصيل + المستحقات" value={moneySar(receivedAndDue)} />
              </div>
              <Value label="فرق التقفيلة النهائي" value={moneySar(overallDifference)} warning={overallDifference !== 0} />
              <p className="text-xs text-muted-foreground">إجمالي المطابقة الأول يشمل التحصيل قبل خصم الاستردادات؛ لذلك عند وجود استرداد يُراجع تدفقه النقدي منفصلًا. مستحقات هنجرستيشن وكيتا ليست بالضرورة أموالًا وصلت للبنك اليوم. المبيعات ليست صافي الربح بعد العمولات والضرائب والمصاريف.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>4. المراجعة والحفظ</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="discrepancy-reason">سبب أي اختلاف في العدد أو المبالغ</Label>
                <Textarea id="discrepancy-reason" rows={3} disabled={locked} placeholder="مثلاً: اشتراك مكرر، دفع غير مكتمل، اختلاف في كشف الشبكة..."
                  value={form.discrepancyReason} onChange={e => change("discrepancyReason", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Textarea id="notes" rows={2} disabled={locked} value={form.notes} onChange={e => change("notes", e.target.value)} />
              </div>
              {!locked && <div className="flex flex-wrap gap-2">
                <Button onClick={() => { try { parseForm(form); action.mutate("save"); } catch (e) { toast.error(formatError(e)); } }} disabled={action.isPending}><Save className="size-4" /> حفظ مسودة</Button>
                <Button variant="secondary" disabled={action.isPending} onClick={() => action.mutate("submit")}><Send className="size-4" /> حفظ وإرسال للمراجعة</Button>
              </div>}
              {view.status === "new" && <p className="text-xs text-muted-foreground">يمكنك حفظ مسودة أو إرسال التقفيلة مباشرة للمراجعة.</p>}
              {status === "submitted" && <div className="rounded-lg border p-4 space-y-3">
                <p className="flex items-center gap-2 text-sm"><FileCheck2 className="size-4" /> التقفيلة بانتظار موافقة المدير، ولا يمكن تعديلها الآن.</p>
                {canApprove && <>
                  <Button disabled={action.isPending} onClick={() => action.mutate("approve")}><CheckCircle2 className="size-4" /> اعتماد التقفيلة</Button>
                  <div className="space-y-2">
                    <Label htmlFor="return-reason">سبب إرجاع التقفيلة</Label>
                    <Textarea id="return-reason" value={returnReason} onChange={e => setReturnReason(e.target.value)} />
                    <Button variant="outline" disabled={action.isPending || !returnReason.trim()} onClick={() => action.mutate("return")}>إرجاع للتعديل</Button>
                  </div>
                </>}
              </div>}
              {status === "approved" && <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4" /> التقفيلة معتمدة ومقفلة. التعديلات اللاحقة تتطلب إجراء تصحيح إداري مستقل.</p>}
              {view.history.length > 0 && <details className="text-sm"><summary className="cursor-pointer font-medium">سجل الإجراءات ({view.history.length})</summary>
                <div className="mt-2 space-y-2">{view.history.map((entry, i) =>
                  <div key={i} className="border-b py-2">
                    <span>{entry.action} — {new Date(entry.at).toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}</span>
                    {entry.reason && <p className="text-muted-foreground">{entry.reason}</p>}
                  </div>)}</div>
              </details>}
            </CardContent>
          </Card>
        </> : null}
    </div>
  );
}

function Value({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <div className={`rounded-xl border p-3 ${warning ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20" : "bg-muted/20"}`}>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 text-lg font-semibold" dir="auto">{value}</div>
  </div>;
}
