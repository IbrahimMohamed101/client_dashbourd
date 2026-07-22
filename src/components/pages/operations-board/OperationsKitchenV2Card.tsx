import { Badge } from "@/components/ui/badge";
import type {
  PresentedKitchenCard,
  PresentedKitchenComponent,
} from "@/lib/operationsKitchenV2Presentation";
import { OperationsKitchenSectionList } from "./OperationsKitchenSectionList";
import { OperationsKitchenWarnings } from "./OperationsKitchenWarnings";

function ComponentRow({
  label,
  component,
}: {
  label: string;
  component: PresentedKitchenComponent;
}) {
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm">
      <p className="break-words font-semibold">
        {label}: {component.name}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge variant="outline">الكمية: {component.quantity}</Badge>
        {component.grams !== null ? (
          <Badge variant="secondary">الوزن: {component.grams} جم</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            الوزن غير محدد
          </Badge>
        )}
      </div>
    </div>
  );
}

export function OperationsKitchenV2Card({
  card,
  compact = false,
}: {
  card: PresentedKitchenCard;
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-bold">{card.title}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {card.badge ? <Badge variant="secondary">{card.badge}</Badge> : null}
            <Badge variant="outline">الكمية: {card.quantity}</Badge>
            {card.sectionCount > 0 ? (
              <Badge variant="outline">{card.sectionCount} أقسام</Badge>
            ) : null}
            {card.itemCount > 0 ? (
              <Badge variant="outline">{card.itemCount} مكوّن</Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {card.product ? (
          <ComponentRow label="الصنف المطلوب" component={card.product} />
        ) : null}
        {card.protein ? (
          <ComponentRow label="البروتين" component={card.protein} />
        ) : null}
        {card.carbs.slice(0, compact ? 2 : undefined).map((carb, index) => (
          <ComponentRow
            key={`${card.key}-carb-${index}`}
            label={`الكارب ${index + 1} من ${card.carbs.length}`}
            component={carb}
          />
        ))}
      </div>

      {compact && card.carbs.length > 2 ? (
        <p className="mt-2 text-xs font-semibold text-muted-foreground">
          +{card.carbs.length - 2} اختيارات كارب أخرى في التفاصيل
        </p>
      ) : null}

      {card.notes && !compact ? (
        <p className="mt-3 rounded-lg bg-muted/35 px-3 py-2 text-sm">
          {card.notes}
        </p>
      ) : null}

      {!compact ? (
        <div className="mt-3 space-y-3">
          <OperationsKitchenSectionList sections={card.sections} />
          <OperationsKitchenWarnings warnings={card.warnings} />
        </div>
      ) : null}
    </div>
  );
}
