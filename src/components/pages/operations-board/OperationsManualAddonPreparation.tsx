import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import api from "@/lib/apis";
import { resolveOperationsLocalizedText } from "@/lib/operationsKitchenV2Presentation";
import type { OperationAddonPlan, UnifiedQueueItem } from "@/types/dashboardOpsTypes";

function planLabel(plan: OperationAddonPlan) {
  return resolveOperationsLocalizedText({ labelI18n: plan.labelI18n, label: plan.label }, "إضافة");
}

function blockedReason(plan: OperationAddonPlan) {
  switch (plan.blockReason) {
    case "NO_ADDON_BALANCE": return "رصيد الإضافة انتهى";
    case "ADDON_BALANCE_MISSING": return "الرصيد غير متاح — يحتاج مراجعة";
    case "STACKING_EXTRA_MANAGED_SEPARATELY": return "رصيد التجديد المجمع له معالجة مستقلة — يحتاج مراجعة";
    case "UNRESOLVED_OLDER_RESERVATION": return "حجز قديم يحتاج مراجعة قبل التجهيز";
    case "ALREADY_SELECTED_FOR_TODAY": return "تم تحديد حصة اليوم";
    case "DAY_NOT_PREPARABLE": return "التجهيز متاح فقط أثناء تحضير طلب اليوم";
    case "PRODUCT_CATALOG_MISSING": return "أسماء أصناف الباقة غير متاحة — يحتاج مراجعة";
    default: return "";
  }
}

export function OperationsManualAddonPreparation({ item }: { item: UnifiedQueueItem }) {
  const queryClient = useQueryClient();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const prepare = useMutation({
    mutationFn: ({ balanceBucketId, productId }: { balanceBucketId: string; productId: string }) =>
      api.post("/api/dashboard/ops/subscription-days/" + item.entityId + "/addons/prepare", {
        balanceBucketId,
        productId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["operations-board", "queue"], refetchType: "active" });
      toast.success("تم حجز حصة الإضافة للتحضير. الخصم النهائي عند التسليم.");
    },
    onError: (error: unknown) => {
      const response = error && typeof error === "object" && "response" in error
        ? (error as { response?: { data?: { message?: string; error?: { message?: string } } } }).response : null;
      toast.error(response?.data?.message || response?.data?.error?.message || "تعذر تجهيز الإضافة؛ راجع الرصيد أو أعد تحميل الطلب.");
    },
  });
  const plans = item.addonPlans || [];
  if (!plans.length) return null;

  return (
    <div className="mt-2 space-y-2" aria-label="تجهيز الباقات الإضافية يدويًا">
      {plans.map((plan, index) => {
        const bucketId = plan.balanceBucketId || "";
        const key = bucketId || plan.addonPlanId || String(index);
        const products = plan.products || [];
        const selected = selections[key] || (products.length === 1 ? products[0].productId : "");
        const canSubmit = Boolean(plan.canPrepare && bucketId && selected && !prepare.isPending);
        const warning = blockedReason(plan);
        return (
          <div key={key} className="rounded-lg border bg-background px-3 py-2.5">
            <p className="text-sm font-bold">{planLabel(plan)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              الرصيد: {plan.remainingQty ?? "—"} متاح، {plan.reservedQty ?? "—"} محجوز، {plan.consumedQty ?? "—"} مستهلك
            </p>
            {Number(plan.selectedTodayQty || 0) > 0 ? (
              <p className="mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                تم اختيار {plan.selectedTodayQty} لليوم
              </p>
            ) : null}
            {plan.canPrepare ? (
              <div className="mt-2 space-y-2">
                {products.length > 1 ? (
                  <label className="block space-y-1 text-xs font-semibold">
                    <span>حدد الصنف المطلوب</span>
                    <select
                      aria-label={"اختيار صنف " + planLabel(plan)}
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={selected}
                      onChange={(event) => setSelections((s) => ({ ...s, [key]: event.target.value }))}
                    >
                      <option value="">اختر صنفًا</option>
                      {products.map((product) => (
                        <option key={product.productId} value={product.productId}>{product.name}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <Button
                  size="sm"
                  className="h-9 w-full sm:w-auto"
                  disabled={!canSubmit}
                  onClick={() => prepare.mutate({ balanceBucketId: bucketId, productId: selected })}
                >
                  {prepare.isPending && prepare.variables?.balanceBucketId === bucketId
                    ? "جارٍ حجز الإضافة..."
                    : "تجهيز حصة من " + planLabel(plan)}
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  حجز فقط؛ لا يُخصم نهائيًا إلا عند تأكيد التسليم.
                </p>
              </div>
            ) : warning ? (
              <p className="mt-1 text-xs font-medium text-muted-foreground">{warning}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
