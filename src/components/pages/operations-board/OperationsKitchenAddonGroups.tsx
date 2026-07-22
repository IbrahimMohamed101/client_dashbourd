import { Badge } from "@/components/ui/badge";
import type { PresentedKitchenAddonGroup } from "@/lib/operationsKitchenV2Presentation";

export function OperationsKitchenAddonGroups({
  groups,
  compact = false,
}: {
  groups: PresentedKitchenAddonGroup[];
  compact?: boolean;
}) {
  if (!groups.length) return null;

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.key} className="rounded-xl border bg-muted/20 p-3">
          <p className="mb-2 text-sm font-bold">{group.label}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.items.slice(0, compact ? 4 : undefined).map((item, index) => (
              <div
                key={`${group.key}-${item.name}-${index}`}
                className="rounded-lg border bg-background px-3 py-2"
              >
                <p className="break-words text-sm font-semibold">{item.name}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="outline">الكمية: {item.quantity}</Badge>
                  {item.grams !== null ? (
                    <Badge variant="secondary">الوزن: {item.grams} جم</Badge>
                  ) : !compact ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      الوزن غير محدد
                    </Badge>
                  ) : null}
                </div>
              </div>
            ))}
            {compact && group.items.length > 4 ? (
              <Badge variant="outline">+{group.items.length - 4}</Badge>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
