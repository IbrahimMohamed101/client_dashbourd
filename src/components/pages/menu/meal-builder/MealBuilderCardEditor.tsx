import { useDeferredValue, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

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
import { useMealBuilderPickerQuery } from "@/hooks/menu";
import type {
  MenuCategory,
  MenuOption,
  MenuOptionGroup,
  MenuProduct,
} from "@/types/menuTypes";
import type {
  MealBuilderHydratedItem,
  MealBuilderSection,
} from "@/types/mealBuilderTypes";
import {
  isAutomaticMealBuilderItem,
  isMealBuilderCandidateSelectable,
  mealBuilderErrorMessage,
  toEditableMealBuilderSection,
  toEditableMealBuilderSections,
  validateMealBuilderSectionDraft,
} from "./mealBuilderFrontendUtils";
import { orderSections, toggle } from "./mealBuilderUtils";
import type {
  MealBuilderVisualCard,
  MealBuilderVisualItem,
} from "./mealBuilderVisualModel";
import { buildMealBuilderVisualCards } from "./mealBuilderVisualModel";

type Catalog = {
  products: MenuProduct[];
  categories: MenuCategory[];
  groups: MenuOptionGroup[];
  options: MenuOption[];
};

const PICKER_PAGE_SIZE = 50;

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
  const [draftSections, setDraftSections] = useState(() =>
    orderSections(sections).map(toEditableMealBuilderSection)
  );
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [includeUnavailable, setIncludeUnavailable] = useState(false);
  const [includeNotLinked, setIncludeNotLinked] = useState(true);
  const [page, setPage] = useState(1);

  const sectionIndex = findSectionIndex(card, draftSections);
  const section = sectionIndex >= 0 ? draftSections[sectionIndex] : null;
  const liveCard = rebuildCard(card.key, draftSections, catalog, card);
  const sectionError = section ? validateMealBuilderSectionDraft(section) : null;

  const pickerQuery = useMealBuilderPickerQuery(card.key, {
    q: deferredQuery || undefined,
    includeUnavailable,
    includeNotLinked,
    page,
    limit: PICKER_PAGE_SIZE,
  });
  const picker = pickerQuery.data?.data ?? null;
  const candidates = (picker?.candidates ?? []).filter(
    (item) => typeof item.id === "string" && item.id.length > 0
  );
  const selectedItemKeys = useMemo(
    () => new Set(liveCard.items.map((item) => `${item.kind}:${item.id}`)),
    [liveCard.items]
  );
  const validSelectedIds = selectedIds.filter((encoded) => {
    const candidate = candidates.find((item) => encodeItem(item) === encoded);
    return candidate ? isMealBuilderCandidateSelectable(candidate) : false;
  });
  const totalPages = Math.max(1, picker?.meta?.pages ?? 1);

  function patchSection(change: Partial<MealBuilderSection>) {
    if (sectionIndex < 0) return;
    setDraftSections((current) =>
      current.map((item, index) =>
        index === sectionIndex
          ? { ...toEditableMealBuilderSection(item), ...change }
          : item
      )
    );
  }

  function toggleCandidate(item: MealBuilderHydratedItem) {
    if (!isMealBuilderCandidateSelectable(item)) return;
    const encoded = encodeItem(item);
    if (selectedItemKeys.has(encoded)) return;
    setSelectedIds((current) => toggle(current, encoded));
  }

  function addSelectedItems() {
    if (sectionIndex < 0 || !validSelectedIds.length) return;
    setDraftSections((current) =>
      current.map((currentSection, index) => {
        if (index !== sectionIndex) return currentSection;
        const editable = toEditableMealBuilderSection(currentSection);
        const optionIds = new Set(editable.selectedOptionIds);
        const productIds = new Set(editable.selectedProductIds);
        for (const encoded of validSelectedIds) {
          const separator = encoded.indexOf(":");
          const kind = encoded.slice(0, separator);
          const id = encoded.slice(separator + 1);
          if (kind === "product") productIds.add(id);
          else optionIds.add(id);
        }
        return {
          ...editable,
          includeMode: "selected" as const,
          selectedOptionIds: [...optionIds],
          selectedProductIds: [...productIds],
        };
      })
    );
    setSelectedIds([]);
    setQuery("");
  }

  function removeItem(item: MealBuilderVisualItem) {
    if (isAutomaticMealBuilderItem(item)) return;
    setDraftSections((current) =>
      current.map((currentSection, index) => {
        if (index !== item.sourceSectionIndex) return currentSection;
        const editable = toEditableMealBuilderSection(currentSection);
        return item.kind === "product"
          ? {
              ...editable,
              includeMode: "selected" as const,
              selectedProductIds: editable.selectedProductIds.filter(
                (id) => id !== item.id
              ),
            }
          : {
              ...editable,
              selectedOptionIds: editable.selectedOptionIds.filter(
                (id) => id !== item.id
              ),
            };
      })
    );
  }

  function saveEditor() {
    if (!section || sectionError) return;
    onSave(toEditableMealBuilderSections(draftSections));
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        className="grid max-h-[92dvh] w-[calc(100%-1rem)] max-w-6xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0"
        dir="rtl"
      >
        <DialogHeader className="border-b px-4 py-4 sm:px-6">
          <DialogTitle>تعديل بطاقة {liveCard.labelAr}</DialogTitle>
          <DialogDescription>
            البطاقة مبنية من القسم المحفوظ نفسه، بدون افتراض أسماء أو مجموعات ثابتة.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
          {!section ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              لم يعد القسم موجودًا في المسودة. أغلق النافذة وحدّث البيانات.
            </div>
          ) : (
            <div className="space-y-4">
              <section className="space-y-3 rounded-lg border bg-muted/10 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField
                    label="عنوان القسم بالعربي"
                    value={section.titleOverride.ar}
                    onChange={(ar) =>
                      patchSection({
                        titleOverride: { ...section.titleOverride, ar },
                      })
                    }
                  />
                  <TextField
                    label="عنوان القسم بالإنجليزي"
                    value={section.titleOverride.en}
                    dir="ltr"
                    onChange={(en) =>
                      patchSection({
                        titleOverride: { ...section.titleOverride, en },
                      })
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <SwitchLine
                    label="ظاهر للعميل"
                    checked={section.visible}
                    onChange={(visible) => patchSection({ visible })}
                  />
                  <SwitchLine
                    label="إجباري"
                    checked={section.required}
                    onChange={(required) => patchSection({ required })}
                  />
                  <SwitchLine
                    label="اختيار متعدد"
                    checked={section.multiSelect}
                    onChange={(multiSelect) => patchSection({ multiSelect })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <NumberField
                    label="الحد الأدنى"
                    value={section.minSelections}
                    onChange={(minSelections) => patchSection({ minSelections })}
                  />
                  <NumberField
                    label="الحد الأقصى"
                    value={section.maxSelections}
                    nullable
                    onChange={(maxSelections) => patchSection({ maxSelections })}
                  />
                </div>
                {sectionError ? (
                  <p className="text-sm text-destructive">{sectionError}</p>
                ) : null}
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-lg border p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <Label>العناصر الموجودة</Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        الحذف يزيل العنصر من هذا القسم فقط ولا يحذفه من المنيو.
                      </p>
                    </div>
                    <Badge variant="outline">{liveCard.items.length}</Badge>
                  </div>
                  <div className="max-h-[28rem] divide-y overflow-auto rounded-lg border">
                    {liveCard.items.length ? (
                      liveCard.items.map((item) => (
                        <div
                          key={`${item.kind}:${item.id}`}
                          className="flex items-center justify-between gap-3 p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{item.name}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              <Badge variant="outline">
                                {item.kind === "product" ? "منتج" : "خيار"}
                              </Badge>
                              {item.eligible ? (
                                <Badge variant="secondary">جاهز</Badge>
                              ) : (
                                <Badge variant="outline">يحتاج تجهيز</Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            disabled={isAutomaticMealBuilderItem(item)}
                            onClick={() => removeItem(item)}
                            aria-label={`حذف ${item.name} من القسم`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-sm text-muted-foreground">
                        لا توجد عناصر مختارة داخل هذا القسم.
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-lg border p-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label>إضافة من الكتالوج</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pickerQuery.isFetching}
                        onClick={() => pickerQuery.refetch()}
                      >
                        {pickerQuery.isFetching ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RefreshCw className="size-4" />
                        )}
                        تحديث
                      </Button>
                    </div>
                    <Input
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setPage(1);
                      }}
                      placeholder="ابحث بالاسم أو المفتاح"
                    />
                    <div className="flex flex-wrap gap-4">
                      <SwitchLine
                        label="إظهار غير الجاهز"
                        checked={includeUnavailable}
                        compact
                        onChange={(value) => {
                          setIncludeUnavailable(value);
                          setPage(1);
                        }}
                      />
                      <SwitchLine
                        label="إظهار غير المرتبط"
                        checked={includeNotLinked}
                        compact
                        onChange={(value) => {
                          setIncludeNotLinked(value);
                          setPage(1);
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 max-h-[23rem] divide-y overflow-auto rounded-lg border">
                    {pickerQuery.isLoading ? (
                      <Message>جاري تحميل الكتالوج...</Message>
                    ) : pickerQuery.isError ? (
                      <Message error>
                        {mealBuilderErrorMessage(
                          pickerQuery.error,
                          "تعذر تحميل عناصر القسم"
                        )}
                      </Message>
                    ) : candidates.length ? (
                      candidates.map((item) => {
                        const encoded = encodeItem(item);
                        const alreadyAdded = selectedItemKeys.has(encoded);
                        const selectable =
                          !alreadyAdded && isMealBuilderCandidateSelectable(item);
                        return (
                          <button
                            key={`${item.type}:${item.id}`}
                            type="button"
                            disabled={!selectable}
                            onClick={() => toggleCandidate(item)}
                            className="flex w-full items-start gap-3 p-3 text-right disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Checkbox
                              checked={alreadyAdded || selectedIds.includes(encoded)}
                              disabled={!selectable}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium">
                                {hydratedItemName(item)}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {alreadyAdded
                                  ? "موجود بالفعل"
                                  : item.eligible
                                    ? "جاهز للإضافة"
                                    : (item.reasonCodes ?? []).join("، ") ||
                                      "غير جاهز"}
                              </span>
                            </span>
                            <Badge variant="outline">
                              {item.type?.includes("product") ? "منتج" : "خيار"}
                            </Badge>
                          </button>
                        );
                      })
                    ) : (
                      <Message>لا توجد نتائج مطابقة.</Message>
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-muted-foreground">
                      {picker?.meta?.total ?? candidates.length} نتيجة · صفحة{" "}
                      {picker?.meta?.page ?? page} من {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pickerQuery.isFetching || page <= 1}
                        onClick={() => setPage((value) => value - 1)}
                      >
                        <ChevronRight className="size-4" /> السابق
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pickerQuery.isFetching || page >= totalPages}
                        onClick={() => setPage((value) => value + 1)}
                      >
                        التالي <ChevronLeft className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="mt-3 w-full"
                    disabled={!validSelectedIds.length}
                    onClick={addSelectedItems}
                  >
                    <Plus className="size-4" /> إضافة المحدد
                  </Button>
                </section>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t px-4 py-3 sm:justify-start sm:px-6">
          <Button
            type="button"
            disabled={!section || Boolean(sectionError)}
            onClick={saveEditor}
          >
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

function findSectionIndex(
  card: MealBuilderVisualCard,
  sections: MealBuilderSection[]
) {
  const sourceIndex = card.items.find(
    (item) => item.sourceSectionIndex >= 0
  )?.sourceSectionIndex;
  if (sourceIndex !== undefined && sections[sourceIndex]) return sourceIndex;
  return sections.findIndex(
    (section) => String(section.key || "").trim() === card.key
  );
}

function rebuildCard(
  cardKey: string,
  sections: MealBuilderSection[],
  catalog: Catalog,
  fallback: MealBuilderVisualCard
) {
  return (
    buildMealBuilderVisualCards({
      sections,
      products: catalog.products,
      categories: catalog.categories,
      options: catalog.options,
      issues: [],
    }).find((item) => item.key === cardKey) ?? fallback
  );
}

function encodeItem(item: MealBuilderHydratedItem) {
  const kind = item.type?.includes("product") ? "product" : "option";
  return `${kind}:${item.id}`;
}

function hydratedItemName(item: MealBuilderHydratedItem) {
  return item.label || item.name?.ar || item.name?.en || item.key || "عنصر";
}

function TextField({
  label,
  value,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        dir={dir}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  nullable = false,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  nullable?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min="0"
        step="1"
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value === ""
              ? nullable
                ? null
                : 0
              : Math.max(0, Number(event.target.value))
          )
        }
      />
    </div>
  );
}

function SwitchLine({
  label,
  checked,
  onChange,
  compact = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  compact?: boolean;
}) {
  return (
    <label
      className={
        compact
          ? "flex items-center gap-2 text-sm"
          : "flex items-center justify-between rounded-lg border p-3 text-sm"
      }
    >
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function Message({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <p className={`p-4 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>
      {children}
    </p>
  );
}
