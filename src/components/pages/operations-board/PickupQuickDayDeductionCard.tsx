import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Utensils, UserRound } from "lucide-react";
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
  const canSubmit = Boolean(
    selectedSubscriptionId
      && selectedBatch
      && Number.isInteger(days)
      && days > 0
      && mealsToDeduct > 0
      && mealsToDeduct <= selectedBatch.remainingMeals
  );

  React.useEffect(() => {
    if (batches.length === 1) {
      setSelectedBatchId(batches[0].id);
    } else if (!batches.some((batch) => batch.id === selectedBatchId)) {
      setSelectedBatchId("");
    }
  }, [batches, selectedBatchId]);

  React.useEffect(() => {
    requestRef.current = null;
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
      toast.success(
        response.data.idempotent
          ? `العملية مسجلة بالفعل — ${response.data.mealsDeducted} وجبة`
          : `تم خصم ${response.data.mealsDeducted} وجبة بنجاح`
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
      toast.error(getApiErrorMessage(error) || "تعذر تنفيذ الخصم");
    },
  });

  const selectSubscription = (row: SearchSubscription) => {
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
              خصم وجبات سريع
            </CardTitle>
            <CardDescription className="mt-1">
              اختر العميل والباقة ثم عدد الأيام. عدد الوجبات يُحسب من الباقة تلقائيًا.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="/manual-deduction">خصم يدوي لحالة خاصة</a>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث باسم العميل أو رقم الجوال"
            className="pr-9"
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
                    className="rounded-lg border bg-background p-3 text-right transition hover:border-primary/50 hover:bg-primary/5"
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
                لا توجد باقة مؤهلة للخصم السريع اليوم. استخدم الخصم اليدوي فقط بعد المراجعة.
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
                          className={`rounded-xl border p-3 text-right transition ${
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
                      <p className="mb-2 text-sm font-semibold">عدد الأيام</p>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3].map((value) => (
                          <Button
                            key={value}
                            type="button"
                            variant={days === value ? "default" : "outline"}
                            size="sm"
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
                        />
                      </div>
                      <p className="mt-2 text-sm">
                        سيتم خصم <strong>{mealsToDeduct}</strong> وجبة
                        <span className="text-muted-foreground">
                          {` (${days || 0} × ${selectedBatch.mealsPerDay})`}
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
                      disabled={!canSubmit || deductionMutation.isPending}
                      onClick={() => deductionMutation.mutate()}
                      className="min-w-36"
                    >
                      {deductionMutation.isPending ? "جاري الخصم..." : "تأكيد الخصم"}
                    </Button>
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
