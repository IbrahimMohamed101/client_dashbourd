import { AlertTriangle, ChefHat, PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OperationsManualAddonPreparation } from "./OperationsManualAddonPreparation";
import {
  resolveOperationsLocalizedText,
  type PresentedKitchenV2,
} from "@/lib/operationsKitchenV2Presentation";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";

function countSelectedItems(group: PresentedKitchenV2["addonGroups"][number]): number {
  return group.items.reduce((sum, item) => sum + item.quantity, 0);
}

function selectedMealDetails(card: PresentedKitchenV2["cards"][number]): string[] {
  const details = [
    card.product ? `الصنف: ${card.product.name}${card.product.grams ? ` (${card.product.grams} جم)` : ""}` : null,
    card.protein ? `البروتين: ${card.protein.name}${card.protein.grams ? ` (${card.protein.grams} جم)` : ""}` : null,
    ...card.carbs.map((carb) => `الكارب: ${carb.name}${carb.grams ? ` (${carb.grams} جم)` : ""}`),
    card.salad ? `السلطة: ${card.salad.name}` : null,
    ...card.sections.flatMap((section) =>
      section.items.map((item) =>
        `${section.label}: ${item.name} ×${item.quantity}${item.grams ? ` (${item.grams} جم)` : ""}`
      )
    ),
    ...card.lines,
  ];
  return [...new Set(details.filter((line): line is string => Boolean(line?.trim())))];
}

export function OperationsDeliveryAddonBadges({
  item,
  presentation,
}: {
  item: UnifiedQueueItem;
  presentation: PresentedKitchenV2;
}) {
  const planLabels = [...new Set(
    (item.addonPlans || [])
      .map((plan) =>
        resolveOperationsLocalizedText(
          { labelI18n: plan.labelI18n, label: plan.label },
          ""
        ).trim()
      )
      .filter(Boolean)
  )];

  if (!planLabels.length && !presentation.addonGroups.length) return null;

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5" aria-label="الباقات والإضافات">
      {planLabels.length ? (
        <div>
          <p className="mb-1.5 text-xs font-bold text-foreground">الباقات الإضافية المشترك بها</p>
          <div className="flex flex-wrap gap-1.5">
            {planLabels.map((label) => (
              <Badge key={label} variant="outline" className="border-amber-500/40 bg-background text-xs font-bold">
                مشترك في {label}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
      {presentation.supported && item.source === "subscription" ? (
        <OperationsManualAddonPreparation item={item} />
      ) : null}
      {presentation.addonGroups.length ? (
        <div>
          <p className="mb-1.5 text-xs font-bold text-foreground">إضافات مطلوب تجهيزها اليوم</p>
          <div className="flex flex-wrap gap-1.5">
            {presentation.addonGroups.map((group) => (
              <Badge key={group.key} variant="secondary" className="text-xs font-bold">
                {group.label} ×{countSelectedItems(group)}
              </Badge>
            ))}
          </div>
        </div>
      ) : planLabels.length ? (
        <p className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {presentation.supported
            ? "لا توجد إضافات مختارة للتحضير اليوم؛ الاشتراك وحده ليس طلب تجهيز."
            : "تعذر التحقق من اختيارات الإضافات اليوم؛ راجع بيانات التحضير قبل التجهيز."}
        </p>
      ) : null}
    </div>
  );
}

export function OperationsDeliveryPreparationDetails({
  presentation,
}: {
  presentation: PresentedKitchenV2;
}) {
  if (!presentation.supported) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm font-semibold" role="alert">
        {presentation.unsupportedMessage}
      </div>
    );
  }

  return (
    <section className="space-y-2" aria-label="الأصناف المطلوب تجهيزها اليوم">
      <h4 className="flex items-center gap-1.5 text-sm font-black">
        <ChefHat className="h-4 w-4 text-primary" />
        المطلوب تجهيزه اليوم ({presentation.mealCount} وجبة، {presentation.addonItemCount} إضافة)
      </h4>

      {presentation.cards.map((card) => (
        <div key={card.key} className="rounded-lg border bg-background p-3">
          <p className="text-sm font-bold">{card.title} ×{card.quantity}</p>
          <div className="mt-1.5 space-y-1 text-xs leading-5 text-foreground/80">
            {selectedMealDetails(card).map((detail, index) => (
              <p key={`${card.key}-detail-${index}`} className="break-words">{detail}</p>
            ))}
            {card.notes ? <p className="font-semibold">ملاحظة: {card.notes}</p> : null}
            {card.warnings.map((warning, index) => (
              <p key={`${card.key}-warning-${index}`} className="text-amber-700 dark:text-amber-300">{warning}</p>
            ))}
          </div>
        </div>
      ))}

      {presentation.addonGroups.map((group) => (
        <div key={group.key} className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <PackagePlus className="h-4 w-4" />
            {group.label} — مطلوب اليوم
          </p>
          <div className="mt-1.5 space-y-1.5 text-sm">
            {group.items.map((addon, index) => (
              <p key={`${group.key}-${addon.name}-${index}`} className="break-words font-medium">
                {addon.name} ×{addon.quantity}{addon.grams ? ` — ${addon.grams} جم` : ""}
              </p>
            ))}
          </div>
        </div>
      ))}

      {presentation.warningMessages.map((warning, index) => (
        <p key={index} className="text-xs font-bold text-amber-700 dark:text-amber-300">
          تنبيه: {warning}
        </p>
      ))}

      {presentation.isEmptyKitchenDay ? (
        <p className="text-xs text-muted-foreground">لا توجد أصناف مسجلة للتحضير لهذا اليوم.</p>
      ) : null}
    </section>
  );
}
