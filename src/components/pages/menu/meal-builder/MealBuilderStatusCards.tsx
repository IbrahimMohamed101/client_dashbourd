import {
  Card,
  CardContent,
} from "@/components/ui/card";
import type { MealBuilderConfig, MealBuilderValidation } from "@/types/mealBuilderTypes";
import { formatDate, readinessLabel } from "./mealBuilderUtils";

export function MealBuilderStatusCards({
  draft,
  published,
  readiness,
}: {
  draft: MealBuilderConfig | null;
  published: MealBuilderConfig | null;
  readiness: MealBuilderValidation | null;
}) {
  const cards = [
    ["المسودة", draft ? "موجودة" : "غير موجودة"],
    ["المنشور", published ? "منشور" : "غير منشور"],
    ["كود المراجعة", published?.revisionHash || "لا يوجد"],
    ["تاريخ النشر", formatDate(published?.publishedAt)],
    ["الجاهزية", readinessLabel(readiness)],
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {cards.map(([label, value]) => (
        <Card key={label} className="border-border/80 shadow-none">
          <CardContent className="space-y-2 pt-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="truncate text-sm font-semibold" title={value}>
              {value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
