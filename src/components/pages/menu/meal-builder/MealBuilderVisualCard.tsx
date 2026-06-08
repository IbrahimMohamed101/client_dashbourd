import { AlertTriangle, CheckCircle2, Package, Pencil, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MenuKeyBadge } from "@/components/pages/menu/MenuTabScaffold";
import { IssueRow } from "./MealBuilderBadges";
import type { MealBuilderVisualCard as VisualCard } from "./mealBuilderVisualModel";

export function MealBuilderVisualCard({
  card,
  onEdit,
}: {
  card: VisualCard;
  onEdit: () => void;
}) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {card.sortOrder}
              </Badge>
              <CardTitle className="text-base">{card.labelAr}</CardTitle>
              <CardDescription>{card.labelEn}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <MenuKeyBadge value={card.key} />
              {card.sourceKinds.map((kind) => (
                <Badge key={kind} variant="secondary">
                  {sourceKindLabel(kind)}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <CardState card={card} />
            <Button type="button" variant="outline" onClick={onEdit}>
              <Pencil data-icon="inline-start" />
              تعديل البطاقة
            </Button>
          </div>
        </div>
        {card.rules.length ? (
          <div className="flex flex-wrap gap-2">
            {card.rules.map((rule) => (
              <Badge key={rule} variant="outline">
                {rule}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {card.errors.map((error) => (
          <div
            key={error}
            className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ))}

        {card.warnings.map((warning) => (
          <div
            key={warning}
            className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{warning}</span>
          </div>
        ))}

        {card.backendIssues.map((issue, index) => (
          <IssueRow key={`${issue.code ?? "issue"}-${index}`} issue={issue} />
        ))}

        {card.items.length ? (
          <div className="grid gap-2">
            {card.items.map((item) => (
              <div
                key={`${item.kind}:${item.id}`}
                className="flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Package className="size-4 text-muted-foreground" />
                    <span className="font-medium">{item.name}</span>
                    <MenuKeyBadge value={item.key} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {item.kind === "product" ? "منتج" : "خيار"}
                    </Badge>
                    <Badge variant={item.active ? "secondary" : "destructive"}>
                      {item.active ? "متاح" : "غير متاح"}
                    </Badge>
                    <Badge variant="outline">{sourceKindLabel(item.sourceSectionType)}</Badge>
                    {item.kind === "product" ? (
                      <>
                        <Badge variant="outline">
                          selectionType={item.selectionType}
                        </Badge>
                        <Badge variant="outline">
                          requiresBuilder={String(item.requiresBuilder)}
                        </Badge>
                        <Badge variant="outline">
                          treatAsFullMeal={String(item.treatAsFullMeal)}
                        </Badge>
                      </>
                    ) : null}
                    {isPremiumVisualItem(card.key, item.key) ? (
                      <>
                        <Badge variant="secondary">مميز</Badge>
                        <Badge variant="outline">يستخدم تسعير الباكند</Badge>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            لا توجد عناصر كتالوج ظاهرة داخل هذه البطاقة الآن.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CardState({ card }: { card: VisualCard }) {
  if (card.errors.length || card.backendIssues.length) {
    return (
      <Badge variant="destructive">
        <ShieldAlert data-icon="inline-start" />
        يحتاج مراجعة
      </Badge>
    );
  }
  if (card.warnings.length) {
    return (
      <Badge variant="secondary">
        <AlertTriangle data-icon="inline-start" />
        تحذير
      </Badge>
    );
  }
  return (
    <Badge variant="default">
      <CheckCircle2 data-icon="inline-start" />
      جاهز
    </Badge>
  );
}

function sourceKindLabel(kind: string) {
  if (kind === "option_group") return "مجموعة خيارات";
  if (kind === "product_category") return "تصنيف منتجات";
  if (kind === "product_list") return "قائمة منتجات";
  return kind;
}

function isPremiumVisualItem(cardKey: string, itemKey: string) {
  return (
    cardKey === "premium" ||
    itemKey === "beef_steak" ||
    itemKey === "shrimp" ||
    itemKey === "salmon" ||
    itemKey === "premium_large_salad"
  );
}
