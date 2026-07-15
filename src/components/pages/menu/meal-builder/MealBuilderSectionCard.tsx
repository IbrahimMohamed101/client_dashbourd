import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MenuKeyBadge } from "@/components/pages/menu/MenuTabScaffold";
import type {
  MenuCategory,
  MenuOption,
  MenuOptionGroup,
  MenuProduct,
} from "@/types/menuTypes";
import type {
  MealBuilderCheck,
  MealBuilderSection,
} from "@/types/mealBuilderTypes";
import { SECTION_LABELS } from "./mealBuilderConstants";
import { SECTION_RULE_BADGES } from "./mealBuilderConstants";
import { IssueRow, PremiumBadge } from "./MealBuilderBadges";
import {
  nameOf,
  sectionTitle,
  selectionLabel,
  visualSectionKey,
  visualSectionLabel,
} from "./mealBuilderUtils";

export function MealBuilderSectionCard({
  section,
  index,
  products,
  categories,
  groups,
  options,
  issues,
  onEdit,
  onDelete,
  onMove,
}: {
  section: MealBuilderSection;
  index: number;
  products: MenuProduct[];
  categories: MenuCategory[];
  groups: MenuOptionGroup[];
  options: MenuOption[];
  issues: MealBuilderCheck[];
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
}) {
  const product = products.find((item) => item.id === section.productContextId);
  const category = categories.find((item) => item.id === section.sourceCategoryId);
  const group = groups.find((item) => item.id === section.sourceGroupId);
  const selectedProducts = products.filter((item) => section.selectedProductIds.includes(item.id));
  const selectedOptions = options.filter((item) => section.selectedOptionIds.includes(item.id));
  const visualKey = visualSectionKey(section, options, products);
  const visualLabel = visualSectionLabel(visualKey);

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">#{index + 1}</Badge>
            <MenuKeyBadge value={visualKey} />
            <Badge>{SECTION_LABELS[section.sectionType]}</Badge>
            <Badge variant={section.visible ? "secondary" : "outline"}>
              {section.visible ? "ظاهر" : "مخفي"}
            </Badge>
            <PremiumBadge selectionType={section.selectionType} />
          </div>
          <h3 className="text-base font-semibold">
            {sectionTitle(section, group, category, visualKey)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {visualLabel.en} · {selectionLabel(section.selectionType)} · {section.required ? "إجباري" : "اختياري"} · الحد الأدنى {section.minSelections} · الحد الأقصى {section.maxSelections ?? "بدون"}
          </p>
          <div className="flex flex-wrap gap-2">
            {product ? <MenuKeyBadge value={`product:${product.key}`} /> : null}
            {group ? <MenuKeyBadge value={`group:${group.key}`} /> : null}
            {category ? <MenuKeyBadge value={`category:${category.key}`} /> : null}
          </div>
          {SECTION_RULE_BADGES[visualKey]?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {SECTION_RULE_BADGES[visualKey].map((rule) => (
                <Badge key={rule} variant="outline">{rule}</Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={() => onMove("up")}>
            <ArrowUp />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => onMove("down")}>
            <ArrowDown />
          </Button>
          <Button type="button" variant="outline" onClick={onEdit}>
            تعديل
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <MiniList title="الخيارات المحددة" items={selectedOptions} fallback={section.sectionType === "option_group" ? "كل خيارات العلاقة" : "لا يوجد"} />
        <MiniList title="المنتجات المحددة" items={selectedProducts} fallback={section.includeMode === "all" ? "كل المنتجات المؤهلة" : "لا يوجد"} />
      </div>

      {issues.length ? (
        <div className="mt-4 space-y-2">
          {issues.slice(0, 3).map((issue, issueIndex) => (
            <IssueRow key={issueIndex} issue={issue} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MiniList({
  title,
  items,
  fallback,
}: {
  title: string;
  items: Array<MenuProduct | MenuOption>;
  fallback: string;
}) {
  return (
    <div className="rounded-md bg-muted/30 p-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      {items.length ? (
        <div className="flex flex-wrap gap-1.5">
          {items.slice(0, 8).map((item) => (
            <Badge key={item.id} variant="secondary">
              {nameOf(item)}
            </Badge>
          ))}
          {items.length > 8 ? <Badge variant="outline">+{items.length - 8}</Badge> : null}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{fallback}</p>
      )}
    </div>
  );
}
