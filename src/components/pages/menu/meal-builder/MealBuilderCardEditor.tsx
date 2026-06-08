import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type {
  MenuCategory,
  MenuOption,
  MenuOptionGroup,
  MenuProduct,
} from "@/types/menuTypes";
import type { MealBuilderSection } from "@/types/mealBuilderTypes";
import { MenuKeyBadge } from "@/components/pages/menu/MenuTabScaffold";
import {
  VISUAL_SECTION_LABELS,
} from "./mealBuilderConstants";
import {
  availableLabel,
  emptySection,
  matches,
  nameOf,
  orderSections,
  toggle,
} from "./mealBuilderUtils";
import type {
  MealBuilderVisualCard,
  MealBuilderVisualItem,
} from "./mealBuilderVisualModel";
import {
  buildMealBuilderVisualCards,
  optionMatchesVisualCard,
  productMatchesVisualCard,
} from "./mealBuilderVisualModel";

type Catalog = {
  products: MenuProduct[];
  categories: MenuCategory[];
  groups: MenuOptionGroup[];
  options: MenuOption[];
};

export function MealBuilderCardEditor({
  open,
  card,
  sections,
  catalog,
  onClose,
  onSave,
}: {
  open: boolean;
  card: MealBuilderVisualCard;
  sections: MealBuilderSection[];
  catalog: Catalog;
  onClose: () => void;
  onSave: (sections: MealBuilderSection[]) => void;
}) {
  const [draftSections, setDraftSections] = useState(() => orderSections(sections));
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const liveCard = rebuildCard(card.key, draftSections, catalog, card);
  const primaryIndex = findPrimarySectionIndex(liveCard.key, draftSections, catalog);
  const primarySection = primaryIndex == null ? null : draftSections[primaryIndex];
  const candidates = getCandidates(liveCard.key, draftSections, catalog).filter((item) =>
    matches(item, query)
  );

  function patchPrimary(change: Partial<MealBuilderSection>) {
    setDraftSections((current) => {
      const index = findPrimarySectionIndex(liveCard.key, current, catalog);
      if (index == null) return current;
      return current.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, ...change } : section
      );
    });
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            تعديل بطاقة {liveCard.labelAr}
          </DialogTitle>
          <DialogDescription>
            يتم تعديل بيانات المسودة الحقيقية فقط، ثم يرسل زر الحفظ نفس شكل الباكند.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-2">
          <ReadonlyField label="المفتاح" value={liveCard.key} />
          <ReadonlyField label="الترتيب المرئي" value={String(liveCard.sortOrder)} />
          <TextField
            label="عنوان القسم بالعربي"
            value={primarySection?.titleOverride.ar ?? VISUAL_SECTION_LABELS[liveCard.key]?.ar ?? ""}
            onChange={(value) =>
              patchPrimary({
                titleOverride: {
                  ar: value,
                  en: primarySection?.titleOverride.en ?? "",
                },
              })
            }
            disabled={!primarySection}
          />
          <TextField
            label="عنوان القسم بالإنجليزي"
            value={primarySection?.titleOverride.en ?? VISUAL_SECTION_LABELS[liveCard.key]?.en ?? ""}
            onChange={(value) =>
              patchPrimary({
                titleOverride: {
                  ar: primarySection?.titleOverride.ar ?? "",
                  en: value,
                },
              })
            }
            disabled={!primarySection}
          />
          <NumberField
            label="الحد الأدنى"
            value={primarySection?.minSelections ?? 0}
            disabled={!primarySection}
            onChange={(value) => patchPrimary({ minSelections: value === "" ? 0 : value })}
          />
          <NumberField
            label="الحد الأقصى"
            value={primarySection?.maxSelections ?? ""}
            disabled={!primarySection}
            onChange={(value) => patchPrimary({ maxSelections: value === "" ? null : value })}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SwitchLine
            label="ظاهر"
            checked={primarySection?.visible ?? true}
            disabled={!primarySection}
            onChange={(visible) => patchPrimary({ visible })}
          />
          <SwitchLine
            label="إجباري"
            checked={primarySection?.required ?? false}
            disabled={!primarySection}
            onChange={(required) => patchPrimary({ required })}
          />
          <SwitchLine
            label="اختيار متعدد"
            checked={primarySection?.multiSelect ?? false}
            disabled={!primarySection}
            onChange={(multiSelect) => patchPrimary({ multiSelect })}
          />
        </div>

        <div className="space-y-2">
          <Label>العناصر المختارة</Label>
          <div className="divide-y rounded-lg border">
            {liveCard.items.length ? (
              liveCard.items.map((item, index) => (
                <SelectedItemRow
                  key={`${item.kind}:${item.id}`}
                  item={item}
                  first={index === 0}
                  last={index === liveCard.items.length - 1}
                  onMove={(direction) =>
                    setDraftSections((current) =>
                      moveItem(current, liveCard.items, item, direction, catalog)
                    )
                  }
                  onRemove={() =>
                    setDraftSections((current) => removeItem(current, item, catalog))
                  }
                />
              ))
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                لا توجد عناصر مختارة داخل هذه البطاقة.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label>إضافة عناصر من الكتالوج</Label>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث بالاسم أو المفتاح"
              />
            </div>
            <Button
              type="button"
              disabled={!selectedIds.length}
              onClick={() => {
                setDraftSections((current) =>
                  addItemsToCard(current, liveCard.key, selectedIds, catalog)
                );
                setSelectedIds([]);
                setQuery("");
              }}
            >
              <Plus data-icon="inline-start" />
              إضافة
            </Button>
          </div>

          <div className="max-h-72 overflow-auto rounded-lg border">
            {candidates.length ? (
              <div className="divide-y">
                {candidates.map((item) => (
                  <button
                    key={`${item.kind}:${item.id}`}
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-right hover:bg-muted/50"
                    onClick={() => setSelectedIds((current) => toggle(current, encodeItem(item)))}
                  >
                    <Checkbox checked={selectedIds.includes(encodeItem(item))} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{nameOf(item)}</span>
                      <span className="block text-xs text-muted-foreground">
                        {item.key} · {availableLabel(item)}
                      </span>
                    </span>
                    <Badge variant="outline">
                      {item.kind === "product" ? "منتج" : "خيار"}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                لا توجد عناصر مؤهلة لهذه البطاقة.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" onClick={() => onSave(draftSections)}>
            حفظ تغييرات البطاقة
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SelectedItemRow({
  item,
  first,
  last,
  onMove,
  onRemove,
}: {
  item: MealBuilderVisualItem;
  first: boolean;
  last: boolean;
  onMove: (direction: "up" | "down") => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{item.name}</span>
          <MenuKeyBadge value={item.key} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{item.kind === "product" ? "منتج" : "خيار"}</Badge>
          <Badge variant={item.active ? "secondary" : "destructive"}>
            {item.active ? "متاح" : "غير متاح"}
          </Badge>
          {item.kind === "product" ? (
            <Badge variant="outline">selectionType={item.selectionType}</Badge>
          ) : null}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="icon" disabled={first} onClick={() => onMove("up")}>
          <ArrowUp className="size-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" disabled={last} onClick={() => onMove("down")}>
          <ArrowDown className="size-4" />
        </Button>
        <Button type="button" variant="outline" size="icon" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

type Candidate =
  | (MenuOption & { kind: "option" })
  | (MenuProduct & { kind: "product" });

function getCandidates(
  cardKey: string,
  sections: MealBuilderSection[],
  catalog: Catalog
): Candidate[] {
  const selected = selectedKeysForCard(cardKey, sections, catalog);
  const optionCandidates =
    ["premium", "chicken", "beef", "fish", "eggs", "carbs"].includes(cardKey)
      ? catalog.options
          .filter((option) => optionMatchesVisualCard(option, cardKey))
          .filter((option) => !selected.has(`option:${option.id}`))
          .map((option) => ({ ...option, kind: "option" as const }))
      : [];
  const productCandidates =
    ["premium", "sandwich"].includes(cardKey)
      ? catalog.products
          .filter((product) => productMatchesVisualCard(product, cardKey, catalog.categories))
          .filter((product) => !selected.has(`product:${product.id}`))
          .map((product) => ({ ...product, kind: "product" as const }))
      : [];
  return [...optionCandidates, ...productCandidates].sort((a, b) => a.sortOrder - b.sortOrder);
}

function selectedKeysForCard(
  cardKey: string,
  sections: MealBuilderSection[],
  catalog: Catalog
) {
  const card = rebuildCard(cardKey, sections, catalog);
  return new Set(card.items.map((item) => `${item.kind}:${item.id}`));
}

function rebuildCard(
  cardKey: string,
  sections: MealBuilderSection[],
  catalog: Catalog,
  fallback?: MealBuilderVisualCard
) {
  return (
    buildMealBuilderVisualCards({
      sections,
      products: catalog.products,
      categories: catalog.categories,
      options: catalog.options,
      issues: [],
    }).find((item) => item.key === cardKey) ??
    fallback!
  );
}

function addItemsToCard(
  sections: MealBuilderSection[],
  cardKey: string,
  encodedIds: string[],
  catalog: Catalog
): MealBuilderSection[] {
  return encodedIds.reduce<MealBuilderSection[]>((current, encoded) => {
    const [kind, id] = encoded.split(":");
    if (kind === "option") return addOptionToCard(current, cardKey, id, catalog);
    return addProductToCard(current, cardKey, id, catalog);
  }, sections);
}

function addOptionToCard(
  sections: MealBuilderSection[],
  cardKey: string,
  optionId: string,
  catalog: Catalog
): MealBuilderSection[] {
  const index = ensureOptionSectionIndex(sections, cardKey, catalog);
  const next = index.sections;
  const section = next[index.index];
  if (section.selectedOptionIds.includes(optionId)) return next;
  return next.map((item, itemIndex) =>
    itemIndex === index.index
      ? { ...item, selectedOptionIds: [...item.selectedOptionIds, optionId] }
      : item
  );
}

function addProductToCard(
  sections: MealBuilderSection[],
  cardKey: string,
  productId: string,
  catalog: Catalog
): MealBuilderSection[] {
  const ensured = ensureProductSectionIndex(sections, cardKey, catalog);
  const section = ensured.sections[ensured.index];
  if (section.selectedProductIds.includes(productId)) return ensured.sections;
  return ensured.sections.map((item, itemIndex) =>
    itemIndex === ensured.index
      ? {
          ...item,
          includeMode: "selected" as const,
          selectedProductIds: [...item.selectedProductIds, productId],
        }
      : item
  );
}

function removeItem(
  sections: MealBuilderSection[],
  item: MealBuilderVisualItem,
  catalog: Catalog
): MealBuilderSection[] {
  return sections.map((section, index) => {
    if (index !== item.sourceSectionIndex) return section;
    if (item.kind === "option") {
      return {
        ...section,
        selectedOptionIds: section.selectedOptionIds.filter((id) => id !== item.id),
      };
    }
    const selectedIds =
      section.includeMode === "all" && section.sourceCategoryId
        ? catalog.products
            .filter((product) => product.categoryId === section.sourceCategoryId)
            .map((product) => product.id)
        : section.selectedProductIds;
    return {
      ...section,
      includeMode: "selected" as const,
      selectedProductIds: selectedIds.filter((id) => id !== item.id),
    };
  });
}

function moveItem(
  sections: MealBuilderSection[],
  cardItems: MealBuilderVisualItem[],
  item: MealBuilderVisualItem,
  direction: "up" | "down",
  catalog: Catalog
): MealBuilderSection[] {
  const cardIndex = cardItems.findIndex((entry) => entry.id === item.id && entry.kind === item.kind);
  const targetCardItem = cardItems[direction === "up" ? cardIndex - 1 : cardIndex + 1];
  if (!targetCardItem || targetCardItem.sourceSectionIndex !== item.sourceSectionIndex) return sections;

  return sections.map((section, sectionIndex) => {
    if (sectionIndex !== item.sourceSectionIndex) return section;
    const ids =
      item.kind === "product" && section.includeMode === "all" && section.sourceCategoryId
        ? catalog.products
            .filter((product) => product.categoryId === section.sourceCategoryId)
            .map((product) => product.id)
        : item.kind === "product"
          ? section.selectedProductIds
          : section.selectedOptionIds;
    const nextIds = swapIds(ids, item.id, targetCardItem.id);
    return item.kind === "product"
      ? { ...section, includeMode: "selected" as const, selectedProductIds: nextIds }
      : { ...section, selectedOptionIds: nextIds };
  });
}

function swapIds(ids: string[], currentId: string, targetId: string) {
  const next = [...ids];
  const currentIndex = next.indexOf(currentId);
  const targetIndex = next.indexOf(targetId);
  if (currentIndex < 0 || targetIndex < 0) return ids;
  [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
  return next;
}

function ensureOptionSectionIndex(
  sections: MealBuilderSection[],
  cardKey: string,
  catalog: Catalog
) {
  const groupKey = cardKey === "carbs" ? "carbs" : "proteins";
  const selectionType = cardKey === "premium" ? "premium_meal" : "standard_meal";
  const existingIndex = sections.findIndex(
    (section) =>
      section.sectionType === "option_group" &&
      section.selectionType === selectionType &&
      catalog.groups.find((group) => group.id === section.sourceGroupId)?.key === groupKey
  );
  if (existingIndex >= 0) return { sections, index: existingIndex };

  const group = catalog.groups.find((item) => item.key === groupKey);
  const product = catalog.products.find((item) => item.key === "basic_meal") ?? catalog.products[0];
  const label = VISUAL_SECTION_LABELS[cardKey];
  const nextSection: MealBuilderSection = {
    ...emptySection("option_group"),
    productContextId: product?.id ?? null,
    sourceGroupId: group?.id ?? null,
    selectionType,
    titleOverride: { ar: label?.ar ?? "", en: label?.en ?? "" },
    sortOrder: sections.length + 1,
    required: cardKey !== "premium",
    minSelections: cardKey === "premium" ? 0 : 1,
    maxSelections: cardKey === "carbs" ? 2 : 1,
    multiSelect: cardKey === "carbs",
  };
  return { sections: [...sections, nextSection], index: sections.length };
}

function ensureProductSectionIndex(
  sections: MealBuilderSection[],
  cardKey: string,
  catalog: Catalog
) {
  const selectionType = cardKey === "premium" ? "premium_large_salad" : "sandwich";
  const existingIndex = sections.findIndex(
    (section) =>
      (section.sectionType === "product_category" || section.sectionType === "product_list") &&
      section.selectionType === selectionType
  );
  if (existingIndex >= 0) return { sections, index: existingIndex };

  const label = VISUAL_SECTION_LABELS[cardKey];
  const sandwichCategory = catalog.categories.find((item) => item.key === "cold_sandwiches");
  const type = cardKey === "sandwich" ? "product_category" : "product_list";
  const nextSection: MealBuilderSection = {
    ...emptySection(type),
    sourceCategoryId: cardKey === "sandwich" ? sandwichCategory?.id ?? null : null,
    includeMode: "selected",
    selectionType,
    titleOverride: { ar: label?.ar ?? "", en: label?.en ?? "" },
    sortOrder: sections.length + 1,
    required: false,
    minSelections: 0,
    maxSelections: 1,
    multiSelect: false,
  };
  return { sections: [...sections, nextSection], index: sections.length };
}

function findPrimarySectionIndex(
  cardKey: string,
  sections: MealBuilderSection[],
  catalog: Catalog
) {
  if (["chicken", "beef", "fish", "eggs", "carbs"].includes(cardKey)) {
    return ensureOptionSectionIndex(sections, cardKey, catalog).index;
  }
  if (["premium", "sandwich"].includes(cardKey)) {
    return ensureProductSectionIndex(sections, cardKey, catalog).index;
  }
  return null;
}

function encodeItem(item: Candidate) {
  return `${item.kind}:${item.id}`;
}

function TextField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} readOnly />
    </div>
  );
}

function NumberField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number | "";
  disabled?: boolean;
  onChange: (value: number | "") => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min="0"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))}
      />
    </div>
  );
}

function SwitchLine({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} />
    </div>
  );
}
