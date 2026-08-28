import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  Utensils,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

type DeductionMutationResult = {
  response: DeductionResponse;
  signature: string;
  customerName: string;
  planName: string;
  proteinGrams: number;
};

type LastDeduction = {
  signature: string;
  customerName: string;
  planName: string;
  proteinGrams: number;
  days: number;
  mealsDeducted: number;
  idempotent: boolean;
};

function planNameOf(batch: QuickBatch) {
  if (typeof batch.planName === "string") return batch.planName;
  return batch.planName?.ar ?? batch.planName?.en ?? "باقة اشتراك";
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
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const [lastDeduction, setLastDeduction] = React.useState<LastDeduction | null>(null);
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
  const mealsToDeduct = selectedBatch ? days * selectedBatch.mealsPerDay : 0;
  const currentSignature = selectedBatch
    ? `${selectedSubscriptionId}:${selectedBatch.id}:${days}`
    : "";
  const isSameCompletedOperation = Boolean(
    currentSignature && lastDeduction?.signature === currentSignature
  );
  const hasValidSelection = Boolean(
    selectedSubscriptionId
      && selectedBatch
      && Number.isInteger(days)
      && days > 0
      && mealsToDeduct > 0
      && mealsToDeduct <= selectedBatch.remainingMeals
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
    setConfirmationOpen(false);
  }, [selectedSubscriptionId, selectedBatchId, days]);

  const deductionMutation = useMutation<DeductionMutationResult>({
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

      return {
        response: response.data as DeductionResponse,
        signature,
        customerName: selectedSubscription.customer.name || "مشترك",
        planName: planNameOf(selectedBatch),
        proteinGrams: selectedBatch.proteinGrams,
      };
    },
    onSuccess: async (result) => {
      const { response } = result;
      setLastDeduction({
        signature: result.signature,
        customerName: result.customerName,
        planName: result.planName,
        proteinGrams: result.proteinGrams,
        days: response.data.days,
        mealsDeducted: response.data.mealsDeducted,
        idempotent: response.data.idempotent,
      });
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
      toast.error(getApiErrorMessage(error) || "تعذر تنفيذ الخصم اليومي");
    },
  });

  const interactionLocked = deductionMutation.isPending;

  const selectSubscription = (row: SearchSubscription) => {
    if (interactionLocked) return;
    setSelectedSubscription(row);
    setSelectedBatchId("");
    setDays(1);
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
        {deductionMutation.isPending && (
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

        {lastDeduction && !deductionMutation.isPending && (
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
                  {lastDeduction.customerName} · {lastDeduction.planName} ({lastDeduction.proteinGrams}g) · {lastDeduction.days} {lastDeduction.days === 1 ? "يوم" : "أيام"} · {lastDeduction.mealsDeducted} وجبة
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
                onClick={() => setLastDeduction(null)}
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
                لا توجد باقة مؤهلة للخصم اليومي. استخدم الخصم اليدوي فقط للحالات الخاصة بعد المراجعة.
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
                            {batch.mealsPerDay} وجبة/يوم · متبقي {batch.remainingMeals} وجبة
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedBatch && (
                  <div className="grid gap-3 rounded-xl bg-muted/30 p-3 md:grid-cols-[1fr_auto] md:items-end">
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
                      {mealsToDeduct > selectedBatch.remainingMeals && (
                        <p className="mt-1 text-sm text-destructive">
                          الرصيد المتبقي في هذه الباقة لا يكفي.
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      disabled={!canSubmit || interactionLocked}
                      onClick={() => setConfirmationOpen(true)}
                      className="min-w-44 gap-2"
                    >
                      {deductionMutation.isPending ? (
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
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={confirmationOpen}
        onOpenChange={(open) => {
          if (!interactionLocked) setConfirmationOpen(open);
        }}
      >
        <AlertDialogContent dir="rtl" className="text-right">
          <AlertDialogHeader className="place-items-start text-right sm:text-right">
            <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-6" />
            </div>
            <AlertDialogTitle>راجع الخصم قبل التنفيذ</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              تأكد من العميل والباقة وعدد الوجبات. بعد التأكيد سيبدأ الخصم فورًا.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedSubscription && selectedBatch && (
            <div className="space-y-2 rounded-xl border bg-muted/30 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">العميل</span>
                <strong>{selectedSubscription.customer.name || "مشترك"}</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">الباقة</span>
                <strong>{planNameOf(selectedBatch)} · {selectedBatch.proteinGrams}g</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">عدد الأيام</span>
                <strong>{days} {days === 1 ? "يوم" : "أيام"}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-2 text-base">
                <span>سيتم خصم</span>
                <strong className="text-primary">{mealsToDeduct} وجبة</strong>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={interactionLocked}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={!canSubmit || interactionLocked}
              onClick={() => deductionMutation.mutate()}
              className="gap-2"
            >
              <ShieldCheck className="size-4" />
              نعم، خصم {mealsToDeduct} وجبة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
