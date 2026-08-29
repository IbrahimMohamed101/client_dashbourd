import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Search, Utensils, UserRound } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import api from "@/lib/apis";
import { getApiErrorMessage } from "@/lib/apiErrors";

type SearchSubscription = {
  id: string;
  status: string;
  fulfillmentMethod: string;
  remainingMeals: number;
  selectedMealsPerDay: number;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
};

type QuickBatch = {
  id: string;
  planId: string;
  planName?: { ar?: string; en?: string } | string | null;
  status: string;
  mealsPerDay: number;
  proteinGrams: number;
  totalMeals: number;
  remainingMeals: number;
  reservedMeals: number;
  deductibleMeals?: number;
  consumedMeals: number;
  effectiveStartDate?: string;
  validityEndDate?: string;
};

type OptionsResponse = {
  status: boolean;
  data: {
    subscriptionId: string;
    businessDate: string;
    batches: QuickBatch[];
  };
};

type DeductionResponse = {
  status: boolean;
  data: {
    id: string | null;
    idempotent: boolean;
    source: string;
    subscriptionId: string;
    batchId: string;
    businessDate: string;
    days: number;
    mealsPerDay: number;
    mealsDeducted: number;
  };
};

function planNameOf(batch: QuickBatch) {
  if (typeof batch.planName === "string") return batch.planName;
  return batch.planName?.ar ?? batch.planName?.en ?? "باقة اشتراك";
}

function deductibleMealsOf(batch: QuickBatch) {
  return batch.deductibleMeals ?? Math.max(0, batch.remainingMeals) + Math.max(0, batch.reservedMeals);
}

function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pickup-quick:${crypto.randomUUID()}`;
  }
  return `pickup-quick:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

export function PickupQuickDayDeductionCard() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebounce(search.trim(), 400);
  const [selectedSubscription, setSelectedSubscription] =
    React.useState<SearchSubscription | null>(null);
  const [selectedBatchId, setSelectedBatchId] = React.useState("");
  const [days, setDays] = React.useState(1);
  const [confirming, setConfirming] = React.useState(false);
  const [lastDeduction, setLastDeduction] = React.useState<DeductionResponse["data"] | null>(null);
  const [lastSuccessSignature, setLastSuccessSignature] = React.useState("");
  const requestRef = React.useRef<{ signature: string; key: string } | null>(null);

  const selectedSubscriptionId = selectedSubscription?.id ?? "";

  const searchQuery = useQuery<SearchSubscription[]>({
    queryKey: ["pickup-quick-subscription-search", debouncedSearch],
    enabled: debouncedSearch.length >= 2,
    retry: false,
    staleTime: 30_000,
    queryFn: async () => {
      const params = new URLSearchParams({ q: debouncedSearch, limit: "10" });
      const response = await api.get(
        `/api/dashboard/subscriptions/quick-day-deduction/search?${params}`
      );
      return (response.data?.data ?? []) as SearchSubscription[];
    },
  });

  const optionsQuery = useQuery<OptionsResponse>({
    queryKey: ["pickup-quick-day-deduction-options", selectedSubscriptionId],
    enabled: Boolean(selectedSubscriptionId),
    retry: false,
    queryFn: async () => {
      const response = await api.get(
        `/api/dashboard/subscriptions/${selectedSubscriptionId}/quick-day-deduction/options`
      );
      return response.data as OptionsResponse;
    },
  });

  const batches = optionsQuery.data?.data?.batches ?? [];
  const selectedBatch = batches.find((batch) => batch.id === selectedBatchId) ?? null;
  const selectedBatchDeductibleMeals = selectedBatch ? deductibleMealsOf(selectedBatch) : 0;
  const mealsToDeduct = selectedBatch ? days * selectedBatch.mealsPerDay : 0;
  const currentSignature = selectedBatch
    ? `${selectedSubscriptionId}:${selectedBatch.id}:${days}`
    : "";
  const isSameCompletedOperation = Boolean(
    currentSignature && currentSignature === lastSuccessSignature
  );
  const hasValidSelection = Boolean(
    selectedSubscriptionId
      && selectedBatch
      && Number.isInteger(days)
      && days > 0
      && mealsToDeduct > 0
      && mealsToDeduct <= selectedBatchDeductibleMeals
  );
  const canSubmit = hasValidSelection && !isSameCompletedOperation;

  React.useEffect(() => {
    if (batches.length === 1) {
      setSelectedBatchId(batches[0].id);
    } else if (!batches.some((batch) => batch.id === selectedBatchId)) {
      setSelectedBatchId("");
    }
  }, [batches, selectedBatchId]);

  React.useEffect(() => {
    requestRef.current = null;
    setConfirming(false);
  }, [selectedSubscriptionId, selectedBatchId, days]);

  const deductionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubscriptionId || !selectedBatch || !canSubmit) {
        throw new Error("اختر الاشتراك والباقة وعدد الأيام أولًا");
      }
      const signature = `${selectedSubscriptionId}:${selectedBatch.id}:${days}`;
      if (!requestRef.current || requestRef.current.signature !== signature) {
        requestRef.current = { signature, key: makeIdempotencyKey() };
      }
      const response = await api.post(
        `/api/dashboard/subscriptions/${selectedSubscriptionId}/quick-day-deduction`,
        { batchId: selectedBatch.id, days },
        { headers: { "Idempotency-Key": requestRef.current.key } }
      );
      return response.data as DeductionResponse;
    },
    onSuccess: async (response) => {
      const completedSignature = `${response.data.subscriptionId}:${response.data.batchId}:${response.data.days}`;
      setLastDeduction(response.data);
      setLastSuccessSignature(completedSignature);
      setConfirming(false);
      toast.success(
        response.data.idempotent
          ? `الخصم اليومي مسجل بالفعل — ${response.data.days} يوم / ${response.data.mealsDeducted} وجبة`
          : `تم خصم ${response.data.days} يوم — ${response.data.mealsDeducted} وجبة بنجاح`
      );
      requestRef.current = null;
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["pickup-quick-day-deduction-options", selectedSubscriptionId],
        }),
        queryClient.invalidateQueries({ queryKey: ["subscriptions-list"] }),
        queryClient.invalidateQueries({ queryKey: ["operations-board"] }),
      ]);
    },
    onError: (error: unknown) => {
      setConfirming(false);
      toast.error(getApiErrorMessage(error) || "تعذر تنفيذ الخصم اليومي");
    },
  });

  const interactionLocked = deductionMutation.isPending;

  const selectSubscription = (row: SearchSubscription) => {
    if (interactionLocked) return;
    setSelectedSubscription(row);
    setSelectedBatchId("");
    setDays(1);
    setConfirming(false);
    requestRef.current = null;
  };

  const startNewSameDeduction = () => {
    setLastSuccessSignature("");
    setConfirming(false);
    requestRef.current = null;
  };

  return (
    <Card dir="rtl" className="border-primary/20">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Utensils className="size-5" />
              خصم أيام الاشتراك
            </CardTitle>
            <CardDescription className="mt-1">
              خصم يومي: اختر العميل والباقة وعدد الأيام، والنظام يحسب عدد الوجبات من الباقة تلقائيًا.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/manual-deduction">خصم يدوي لحالة خاصة</a>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {interactionLocked && (
          <div
            className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4"
            role="status"
            aria-live="assertive"
          >
            <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-primary" />
            <div>
              <p className="font-bold text-primary">جارٍ تنفيذ الخصم الآن...</p>
              <p className="mt-1 text-sm text-muted-foreground">
                لا تضغط مرة أخرى ولا تغيّر البيانات. ننتظر تأكيد العملية من النظام.
              </p>
            </div>
          </div>
        )}

        {lastDeduction && !interactionLocked && (
          <div
            className="flex flex-col gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 sm:flex-row sm:items-center sm:justify-between"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold">
                  {lastDeduction.idempotent ? "العملية كانت مسجلة بالفعل" : "تم الخصم بنجاح"}
                </p>
                <p className="mt-1 text-sm">
                  تم خصم {lastDeduction.days} {lastDeduction.days === 1 ? "يوم" : "أيام"} — {lastDeduction.mealsDeducted} وجبة.
                </p>
                {isSameCompletedOperation && (
                  <p className="mt-1 text-xs font-medium text-emerald-800">
                    تم قفل نفس العملية لمنع الخصم بالخطأ مرة ثانية.
                  </p>
                )}
              </div>
            </div>
            {isSameCompletedOperation && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100"
                onClick={startNewSameDeduction}
              >
                بدء خصم جديد بنفس البيانات
              </Button>
            )}
          </div>
        )}

        <div className="relative">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث باسم العميل أو رقم الجوال"
            className="pr-9"
            disabled={interactionLocked}
          />
        </div>

        {debouncedSearch.length >= 2 && !selectedSubscription && (
          <div className="rounded-xl border bg-muted/20 p-2">
            {searchQuery.isLoading ? (
              <p className="p-3 text-sm text-muted-foreground">جاري البحث...</p>
            ) : searchQuery.isError ? (
              <p className="p-3 text-sm text-destructive">
                {getApiErrorMessage(searchQuery.error) || "تعذر البحث عن العميل"}
              </p>
            ) : searchQuery.data?.length ? (
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {searchQuery.data.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => selectSubscription(row)}
                    disabled={interactionLocked}
                    className="rounded-lg border bg-background p-3 text-right transition hover:border-primary/50 hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-60"
                  >
                    <div className="flex items-start gap-2">
                      <UserRound className="mt-0.5 size-4 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{row.customer.name || "مشترك"}</p>
                        <p className="text-sm text-muted-foreground">{row.customer.phone || "—"}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="p-3 text-sm text-muted-foreground">لا توجد اشتراكات استلام نشطة مطابقة.</p>
            )}
          </div>
        )}

        {selectedSubscription && (
          <div className="space-y-4 rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{selectedSubscription.customer.name || "مشترك"}</p>
                <p className="text-sm text-muted-foreground">{selectedSubscription.customer.phone || "—"}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={interactionLocked}
                onClick={() => {
                  setSelectedSubscription(null);
                  setSelectedBatchId("");
                  setConfirming(false);
                }}
              >
                تغيير العميل
              </Button>
            </div>

            {optionsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">جاري تحميل باقات العميل...</p>
            ) : optionsQuery.isError ? (
              <p className="text-sm text-destructive">
                {getApiErrorMessage(optionsQuery.error) || "تعذر تحميل الباقات"}
              </p>
            ) : batches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                لا توجد باقة مؤهلة للخصم اليومي بعد استبعاد الوجبات المستلمة فعليًا.
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-sm font-semibold">
                    {batches.length > 1 ? "اختر الباقة التي سيُخصم منها" : "الباقة"}
                  </p>
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {batches.map((batch) => {
                      const selected = batch.id === selectedBatchId;
                      const deductibleMeals = deductibleMealsOf(batch);
                      return (
                        <button
                          key={batch.id}
                          type="button"
                          onClick={() => setSelectedBatchId(batch.id)}
                          disabled={interactionLocked}
                          className={`rounded-xl border p-3 text-right transition disabled:pointer-events-none disabled:opacity-60 ${
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                              : "bg-background hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold">{planNameOf(batch)}</span>
                            <Badge variant="secondary">{batch.proteinGrams}g</Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {batch.mealsPerDay} وجبة/يوم · قابل للخصم {deductibleMeals} وجبة
                          </p>
                          {batch.reservedMeals > 0 && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              منها {batch.reservedMeals} محجوزة؛ الحجز اختيار مسبق وليس استلامًا.
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedBatch && (
                  <div className="space-y-3 rounded-xl bg-muted/30 p-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                      <div>
                        <p className="mb-2 text-sm font-semibold">عدد الأيام المراد خصمها</p>
                        <div className="flex flex-wrap gap-2">
                          {[1, 2, 3].map((value) => (
                            <Button
                              key={value}
                              type="button"
                              variant={days === value ? "default" : "outline"}
                              size="sm"
                              disabled={interactionLocked}
                              onClick={() => setDays(value)}
                            >
                              {value === 1 ? "يوم" : `${value} أيام`}
                            </Button>
                          ))}
                          <Input
                            type="number"
                            min={1}
                            max={31}
                            step={1}
                            value={days}
                            onChange={(event) => setDays(Number(event.target.value))}
                            className="w-24"
                            aria-label="عدد الأيام"
                            disabled={interactionLocked}
                          />
                        </div>
                        <p className="mt-2 text-sm">
                          الخصم اليومي سيستهلك <strong>{mealsToDeduct}</strong> وجبة
                          <span className="text-muted-foreground">
                            {` (${days || 0} يوم × ${selectedBatch.mealsPerDay} وجبة/يوم)`}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          المتاح غير المحجوز {selectedBatch.remainingMeals} + المحجوز {selectedBatch.reservedMeals} = {selectedBatchDeductibleMeals} وجبة غير مستلمة.
                        </p>
                        {mealsToDeduct > selectedBatchDeductibleMeals && (
                          <p className="mt-1 text-sm text-destructive">
                            عدد الوجبات غير المستلمة في هذه الباقة لا يكفي.
                          </p>
                        )}
                      </div>

                      <Button
                        type="button"
                        disabled={!canSubmit || interactionLocked}
                        onClick={() => setConfirming(true)}
                        className="min-w-44 gap-2"
                      >
                        {interactionLocked ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            جارٍ تنفيذ الخصم...
                          </>
                        ) : isSameCompletedOperation ? (
                          <>
                            <CheckCircle2 className="size-4" />
                            تم الخصم بنجاح
                          </>
                        ) : (
                          "مراجعة وتأكيد الخصم"
                        )}
                      </Button>
                    </div>

                    {confirming && canSubmit && !interactionLocked && (
                      <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-bold">تأكيد نهائي قبل الخصم</p>
                          <p className="mt-1 text-sm">
                            سيتم خصم <strong>{days} {days === 1 ? "يوم" : "أيام"}</strong> = <strong>{mealsToDeduct} وجبة</strong> من باقة {planNameOf(selectedBatch)} ({selectedBatch.proteinGrams}g) للعميل {selectedSubscription.customer.name || "مشترك"}.
                          </p>
                          {selectedBatch.reservedMeals > 0 && (
                            <p className="mt-1 text-xs">
                              سيحوّل النظام الحجوزات الموجودة إلى مستلمة أولًا، ولن يخصمها مرة ثانية من الرصيد.
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirming(false)}
                          >
                            إلغاء
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => deductionMutation.mutate()}
                          >
                            نعم، نفّذ الخصم
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
