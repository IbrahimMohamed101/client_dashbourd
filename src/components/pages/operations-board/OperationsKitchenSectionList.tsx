import { Badge } from "@/components/ui/badge";
import type { PresentedKitchenSection } from "@/lib/operationsKitchenV2Presentation";

export function OperationsKitchenSectionList({
  sections,
}: {
  sections: PresentedKitchenSection[];
}) {
  if (!sections.length) return null;

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <div key={section.key} className="rounded-xl border bg-muted/20 p-3">
          <p className="mb-2 text-sm font-bold">{section.label}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {section.items.map((item, index) => (
              <div
                key={`${section.key}-${item.name}-${index}`}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <span className="break-words font-semibold">{item.name}</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="outline">الكمية: {item.quantity}</Badge>
                  {item.grams !== null ? (
                    <Badge variant="secondary">الوزن: {item.grams} جم</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      الوزن غير محدد
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
