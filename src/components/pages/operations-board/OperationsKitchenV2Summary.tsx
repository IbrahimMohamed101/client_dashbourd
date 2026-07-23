import { AlertTriangle, ChefHat, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatOperationsSar,
  type PresentedKitchenV2,
} from "@/lib/operationsKitchenV2Presentation";
import { OperationsKitchenAddonGroups } from "./OperationsKitchenAddonGroups";
import { OperationsKitchenV2Card } from "./OperationsKitchenV2Card";
import { OperationsKitchenWarnings } from "./OperationsKitchenWarnings";

function dedupeValues(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function OperationsKitchenV2Summary({
  presentation,
  compact = true,
}: {
  presentation: PresentedKitchenV2;
  compact?: boolean;
}) {
  if (!presentation.supported) {
    return (
      <div className="flex gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-900 dark:text-amber-300">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{presentation.unsupportedMessage}</span>
      </div>
    );
  }

  const compactWarnings = dedupeValues([
    ...presentation.cards.flatMap((card) => card.warnings),
    ...presentation.warningMessages,
  ]);

  if (compact) {
    const visibleTitles = presentation.cards
      .map((card) => card.title.trim())
      .filter(Boolean)
      .slice(0, 2);
    const hiddenTitleCount = Math.max(presentation.cards.length - visibleTitles.length, 0);

    return (
      <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex items-center gap-1.5 text-sm font-black">
            <ChefHat className="h-4 w-4 text-primary" />
            {presentation.mealCount} وجبة
          </p>
          <Badge variant="outline">{presentation.cardCount} كروت تحضير</Badge>
          {presentation.addonItemCount > 0 ? (
            <Badge variant="outline" className="gap-1">
              <PlusCircle className="h-3 w-3" />
              {presentation.addonItemCount} إضافات
            </Badge>
          ) : null}
          {compactWarnings.length ? (
            <Badge className="border-amber-500/25 bg-amber-500/10 text-amber-800 hover:bg-amber-500/10 dark:text-amber-300">
              {compactWarnings.length} تنبيه
            </Badge>
          ) : null}
          {presentation.isEmptyKitchenDay ? (
            <Badge variant="secondary">بدون تحضير مطبخ</Badge>
          ) : null}
        </div>

        {visibleTitles.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold text-foreground/80">
            {visibleTitles.map((title) => (
              <span
                key={title}
                className="max-w-full truncate rounded-md bg-background/80 px-2 py-1"
                title={title}
              >
                {title}
              </span>
            ))}
            {hiddenTitleCount > 0 ? (
              <span className="rounded-md bg-background/80 px-2 py-1 text-muted-foreground">
                +{hiddenTitleCount} أخرى
              </span>
            ) : null}
          </div>
        ) : null}

        <p className="mt-2 text-xs font-medium text-muted-foreground">
          افتح التفاصيل لمعرفة المكونات، الأوزان، الإضافات وتعليمات التحضير كاملة.
        </p>
      </div>
    );
  }

  const visibleCards = presentation.cards;
  const hiddenCards: typeof presentation.cards = [];
  const hiddenPaidSelections = hiddenCards.flatMap((card) =>
    card.sections.flatMap((section) =>
      section.items
        .filter((item) => item.paidAmountHalala)
        .map((item) => ({
          key: `${card.key}-${section.key}-${item.name}-${item.paidAmountHalala}`,
          label: `${item.name} - ${formatOperationsSar(item.paidAmountHalala)}`,
        }))
    )
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-primary/10 bg-primary/5 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <ChefHat className="h-4 w-4 text-primary" />
            الوجبات المطلوبة: {presentation.mealCount} وجبة
          </p>
          <Badge variant="outline">{presentation.cardCount} بطاقات</Badge>
          <Badge variant="outline" className="gap-1">
            <PlusCircle className="h-3 w-3" />
            {presentation.addonItemCount} إضافات
          </Badge>
          {presentation.isEmptyKitchenDay ? (
            <Badge variant="secondary">يوم بدون تحضير مطبخ</Badge>
          ) : null}
        </div>
      </div>

      {presentation.cards.length ? (
        <div className="grid gap-2">
          {visibleCards.map((card) => (
            <OperationsKitchenV2Card
              key={card.key}
              card={card}
              compact={false}
            />
          ))}
          {hiddenCards.length ? (
            <div className="space-y-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground">
              <p>+{hiddenCards.length} بطاقات تحضير أخرى</p>
              {hiddenPaidSelections.slice(0, 2).map((selection) => (
                <p key={selection.key}>{selection.label}</p>
              ))}
              {hiddenPaidSelections.length > 2 ? (
                <p>+{hiddenPaidSelections.length - 2} إضافات مدفوعة أخرى</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <OperationsKitchenAddonGroups
        groups={presentation.addonGroups}
        compact={false}
      />
      <OperationsKitchenWarnings warnings={presentation.warningMessages} />
    </div>
  );
}
