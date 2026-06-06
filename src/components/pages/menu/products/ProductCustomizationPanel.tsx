import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ListChecks,
  PackagePlus,
  Plus,
  Save,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { MenuEmptyState, MenuKeyBadge } from "@/components/pages/menu/MenuTabScaffold";
import {
  useCustomizationLibraryQuery,
  useProductCustomizationQuery,
  useSaveProductCustomizationMutation,
} from "@/hooks/menu";
import type {
  CustomizationLibraryGroup,
  CustomizationLibraryOption,
  ProductCustomizationGroup,
  SaveProductCustomizationPayload,
} from "@/types/menuCustomizationTypes";

interface ProductCustomizationPanelProps {
  productId: string;
  isCustomizable: boolean;
  onEnableCustomization: () => void;
}

const displayStyleLabels: Record<string, string> = {
  chips: "شرائح",
  radio_cards: "بطاقات اختيار",
  checkbox_grid: "شبكة متعددة",
  dropdown: "قائمة",
  stepper: "عداد",
};

export function ProductCustomizationPanel({
  productId,
  isCustomizable,
  onEnableCustomization,
}: ProductCustomizationPanelProps) {
  const { data: libraryData, isLoading: isLibraryLoading } =
    useCustomizationLibraryQuery();
  const { data: customizationData, isLoading: isCustomizationLoading } =
    useProductCustomizationQuery(productId);
  const saveCustomization = useSaveProductCustomizationMutation();

  const libraryGroups = libraryData?.data.groups ?? [];
  const libraryOptions = libraryData?.data.options ?? [];
  const enabledLibraryOptions = useMemo(
    () => libraryOptions.filter((option) => option.enabled !== false),
    [libraryOptions]
  );
  const allowedOptionIds = useMemo(
    () => enabledLibraryOptions.map((option) => option.id),
    [enabledLibraryOptions]
  );
  const [enabled, setEnabled] = useState(isCustomizable);
  const [groups, setGroups] = useState<ProductCustomizationGroup[]>([]);
  const [isAddGroupsOpen, setIsAddGroupsOpen] = useState(false);
  const [optionsGroupId, setOptionsGroupId] = useState<string | null>(null);
  const [rulesGroupId, setRulesGroupId] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(isCustomizable || Boolean(customizationData?.data.customization.enabled));
  }, [customizationData?.data.customization.enabled, isCustomizable]);

  useEffect(() => {
    if (customizationData?.data.customization.groups) {
      setGroups(customizationData.data.customization.groups);
    }
  }, [customizationData?.data.customization.groups]);

  const selectedGroupIds = useMemo(
    () => new Set(groups.map((group) => group.groupId)),
    [groups]
  );

  const removeGroup = (groupId: string) => {
    setGroups((current) => current.filter((group) => group.groupId !== groupId));
  };

  const updateGroup = (nextGroup: ProductCustomizationGroup) => {
    setGroups((current) =>
      current.map((group) =>
        group.groupId === nextGroup.groupId ? nextGroup : group
      )
    );
  };

  const handleEnable = () => {
    setEnabled(true);
    onEnableCustomization();
  };

  const payload: SaveProductCustomizationPayload = {
    isCustomizable: enabled,
    allowedOptionIds: libraryData ? allowedOptionIds : undefined,
    currentGroups: customizationData?.data.customization.groups,
    groups: enabled
      ? groups.map((group) => ({
          groupId: group.groupId,
          rules: group.rules,
          enabled:
            group.status?.isActive !== false &&
            group.status?.isVisible !== false &&
            group.status?.isAvailable !== false,
          sortOrder: group.sortOrder ?? 0,
          optionIds: group.options.map((option) => option.optionId),
          options: group.options.map((option) => ({
            optionId: option.optionId,
            extraPriceHalala: option.overridePricing?.extraPriceHalala,
            extraWeightUnitGrams: option.overridePricing?.extraWeightUnitGrams,
            extraWeightPriceHalala: option.overridePricing?.extraWeightPriceHalala,
            enabled:
              option.status?.isActive !== false &&
              option.status?.isVisible !== false &&
              option.status?.isAvailable !== false,
            sortOrder: option.sortOrder ?? 0,
          })),
        }))
      : [],
  };

  const handleSave = () =>
    saveCustomization.mutate({
      productId,
      payload,
    });

  const isLoading = isLibraryLoading || isCustomizationLoading;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>تخصيص المنتج</CardTitle>
          <CardDescription>
            المجموعات والخيارات هنا تخص هذا المنتج فقط ولا تغير المكتبة العامة.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <Switch
              checked={enabled}
              onCheckedChange={(checked) => {
                setEnabled(checked);
                if (checked) onEnableCustomization();
              }}
            />
            <span className="text-sm font-medium">قابل للتخصيص</span>
          </div>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saveCustomization.isPending || isLoading}
          >
            <Save data-icon="inline-start" />
            حفظ التخصيص
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!enabled ? (
          <div className="space-y-4">
            <MenuEmptyState
              title="هذا المنتج غير قابل للتخصيص"
              description="قم بتفعيل التخصيص لإضافة مجموعات وخيارات لهذا المنتج فقط."
            />
            <div className="flex justify-center">
              <Button type="button" onClick={handleEnable}>
                <Plus data-icon="inline-start" />
                تفعيل التخصيص
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{groups.length} مجموعات</Badge>
                <Badge variant="outline">
                  {groups.reduce((sum, group) => sum + group.options.length, 0)} خيارات
                </Badge>
              </div>
              <Button type="button" onClick={() => setIsAddGroupsOpen(true)}>
                <PackagePlus data-icon="inline-start" />
                إضافة مجموعات خيارات
              </Button>
            </div>

            {groups.length ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {groups.map((group) => (
                  <LinkedGroupCard
                    key={group.groupId}
                    group={group}
                    onChooseOptions={() => setOptionsGroupId(group.groupId)}
                    onEditRules={() => setRulesGroupId(group.groupId)}
                    onRemove={() => removeGroup(group.groupId)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <MenuEmptyState
                  title="لا توجد مجموعات لهذا المنتج"
                  description="اختر مجموعات من المكتبة العامة، ثم حدد الخيارات المناسبة لهذا المنتج."
                />
                <div className="flex justify-center">
                  <Button type="button" onClick={() => setIsAddGroupsOpen(true)}>
                    <PackagePlus data-icon="inline-start" />
                    إضافة مجموعات خيارات
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      <AddOptionGroupsDialog
        open={isAddGroupsOpen}
        onOpenChange={setIsAddGroupsOpen}
        libraryGroups={libraryGroups}
        selectedGroupIds={selectedGroupIds}
        onAdd={(selected) => {
          setGroups((current) => [
            ...current,
            ...selected.map((group, index) => toProductGroup(group, current.length + index)),
          ]);
        }}
      />

      <ChooseOptionsDialog
        group={groups.find((group) => group.groupId === optionsGroupId) ?? null}
        libraryOptions={enabledLibraryOptions}
        open={Boolean(optionsGroupId)}
        onOpenChange={(open) => !open && setOptionsGroupId(null)}
        onSave={updateGroup}
      />

      <EditGroupRulesDialog
        group={groups.find((group) => group.groupId === rulesGroupId) ?? null}
        open={Boolean(rulesGroupId)}
        onOpenChange={(open) => !open && setRulesGroupId(null)}
        onSave={updateGroup}
      />
    </Card>
  );
}

function toProductGroup(
  group: CustomizationLibraryGroup,
  index: number
): ProductCustomizationGroup {
  return {
    productGroupId: null,
    groupId: group.id,
    key: group.key,
    name: group.name,
    displayStyle: group.displayStyle,
    rules: {
      minSelections: 0,
      maxSelections: null,
      isRequired: false,
    },
    status: {
      isActive: true,
      isVisible: true,
      isAvailable: true,
    },
    sortOrder: group.sortOrder ?? index,
    options: [],
  };
}

function LinkedGroupCard({
  group,
  onChooseOptions,
  onEditRules,
  onRemove,
}: {
  group: ProductCustomizationGroup;
  onChooseOptions: () => void;
  onEditRules: () => void;
  onRemove: () => void;
}) {
  const enabled =
    group.status?.isActive !== false &&
    group.status?.isVisible !== false &&
    group.status?.isAvailable !== false;

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">
              {group.name.ar || group.name.en || group.key}
            </h3>
            <MenuKeyBadge value={group.key} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={enabled ? "secondary" : "outline"}>
              {enabled ? "مفعل" : "معطل"}
            </Badge>
            <Badge variant="outline">
              {displayStyleLabels[group.displayStyle || ""] || group.displayStyle || "عرض عادي"}
            </Badge>
            <Badge variant={group.rules.isRequired ? "default" : "outline"}>
              {group.rules.isRequired ? "إجباري" : "اختياري"}
            </Badge>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>

      <p className="mb-3 text-sm text-muted-foreground">
        {group.rules.minSelections} - {group.rules.maxSelections ?? "بدون حد"} اختيارات ·{" "}
        {group.options.length} خيار محدد
      </p>

      {group.options.length ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {group.options.slice(0, 12).map((option) => (
            <Badge key={option.optionId} variant="secondary">
              {option.name.ar || option.name.en || option.key}
            </Badge>
          ))}
          {group.options.length > 12 ? (
            <Badge variant="outline">+{group.options.length - 12}</Badge>
          ) : null}
        </div>
      ) : (
        <p className="mb-4 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          لم يتم اختيار خيارات لهذه المجموعة بعد.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onChooseOptions}>
          <ListChecks data-icon="inline-start" />
          اختيار الخيارات
        </Button>
        <Button type="button" variant="outline" onClick={onEditRules}>
          <Settings2 data-icon="inline-start" />
          تعديل القواعد
        </Button>
      </div>
    </div>
  );
}

function AddOptionGroupsDialog({
  open,
  onOpenChange,
  libraryGroups,
  selectedGroupIds,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  libraryGroups: CustomizationLibraryGroup[];
  selectedGroupIds: Set<string>;
  onAdd: (groups: CustomizationLibraryGroup[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const availableGroups = libraryGroups.filter((group) => {
    if (selectedGroupIds.has(group.id)) return false;
    const haystack = `${group.key} ${group.name.ar} ${group.name.en}`.toLowerCase();
    return !query.trim() || haystack.includes(query.trim().toLowerCase());
  });

  const toggle = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );

  const handleAdd = () => {
    onAdd(libraryGroups.filter((group) => selectedIds.includes(group.id)));
    setSelectedIds([]);
    setQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة مجموعات خيارات</DialogTitle>
          <DialogDescription>
            اختر من المجموعات العامة الموجودة. إنشاء المجموعات يتم من صفحة مجموعات الخيارات.
          </DialogDescription>
        </DialogHeader>
        <SearchInput value={query} onChange={setQuery} placeholder="ابحث عن مجموعة" />
        <div className="max-h-96 overflow-auto rounded-lg border">
          {availableGroups.length ? (
            <div className="divide-y">
              {availableGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-right hover:bg-muted/50"
                  onClick={() => toggle(group.id)}
                >
                  <Checkbox checked={selectedIds.includes(group.id)} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {group.name.ar || group.name.en || group.key}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {group.key} · {displayStyleLabels[group.displayStyle || ""] || group.displayStyle}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">لا توجد مجموعات متاحة للإضافة.</p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" onClick={handleAdd} disabled={!selectedIds.length}>
            إضافة {selectedIds.length ? `(${selectedIds.length})` : ""}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChooseOptionsDialog({
  group,
  libraryOptions,
  open,
  onOpenChange,
  onSave,
}: {
  group: ProductCustomizationGroup | null;
  libraryOptions: CustomizationLibraryOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (group: ProductCustomizationGroup) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds(group?.options.map((option) => option.optionId) ?? []);
    setQuery("");
  }, [group]);

  const options = libraryOptions.filter((option) => {
    const isSuggested = !group || option.suggestedGroupId === group.groupId;
    const haystack = `${option.key} ${option.name.ar} ${option.name.en}`.toLowerCase();
    return isSuggested && (!query.trim() || haystack.includes(query.trim().toLowerCase()));
  });

  const toggle = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );

  const handleSave = () => {
    if (!group) return;
    const existingById = new Map(group.options.map((option) => [option.optionId, option]));
    const nextOptions = selectedIds
      .map((id) => {
        const existing = existingById.get(id);
        if (existing) return existing;
        const libraryOption = libraryOptions.find((option) => option.id === id);
        if (!libraryOption) return null;
        return {
          productOptionId: null,
          optionId: libraryOption.id,
          key: libraryOption.key,
          name: libraryOption.name,
          imageUrl: libraryOption.imageUrl,
          defaultPricing: libraryOption.defaultPricing,
          nutrition: libraryOption.nutrition,
          status: { isActive: true, isVisible: true, isAvailable: true },
          sortOrder: libraryOption.sortOrder ?? 0,
        };
      })
      .filter(Boolean) as ProductCustomizationGroup["options"];

    onSave({ ...group, options: nextOptions });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>اختيار الخيارات</DialogTitle>
          <DialogDescription>
            الاختيارات هنا تخص هذا المنتج فقط داخل مجموعة {group?.name.ar || group?.key}.
          </DialogDescription>
        </DialogHeader>
        <SearchInput value={query} onChange={setQuery} placeholder="ابحث عن خيار" />
        <div className="max-h-[28rem] overflow-auto rounded-lg border">
          {options.length ? (
            <div className="grid gap-0 divide-y">
              {options.map((option) => {
                const checked = selectedIds.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-right hover:bg-muted/50"
                    onClick={() => toggle(option.id)}
                  >
                    <Checkbox checked={checked} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">
                        {option.name.ar || option.name.en || option.key}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.key}
                      </span>
                    </span>
                    {checked ? <Check className="size-4 text-primary" /> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">لا توجد خيارات مناسبة لهذه المجموعة.</p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" onClick={handleSave}>
            حفظ الاختيارات ({selectedIds.length})
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditGroupRulesDialog({
  group,
  open,
  onOpenChange,
  onSave,
}: {
  group: ProductCustomizationGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (group: ProductCustomizationGroup) => void;
}) {
  const [minSelections, setMinSelections] = useState("0");
  const [maxSelections, setMaxSelections] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");

  useEffect(() => {
    if (!group) return;
    setMinSelections(String(group.rules.minSelections ?? 0));
    setMaxSelections(group.rules.maxSelections == null ? "" : String(group.rules.maxSelections));
    setIsRequired(Boolean(group.rules.isRequired));
    setEnabled(
      group.status?.isActive !== false &&
        group.status?.isVisible !== false &&
        group.status?.isAvailable !== false
    );
    setSortOrder(String(group.sortOrder ?? 0));
  }, [group]);

  const handleSave = () => {
    if (!group) return;
    onSave({
      ...group,
      rules: {
        minSelections: Number(minSelections) || 0,
        maxSelections: maxSelections.trim() ? Number(maxSelections) : null,
        isRequired,
      },
      status: {
        isActive: enabled,
        isVisible: enabled,
        isAvailable: enabled,
      },
      sortOrder: Number(sortOrder) || 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل قواعد المجموعة</DialogTitle>
          <DialogDescription>
            هذه القواعد تطبق على هذا المنتج فقط.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <NumberInput label="الحد الأدنى" value={minSelections} onChange={setMinSelections} />
          <NumberInput label="الحد الأقصى" value={maxSelections} onChange={setMaxSelections} placeholder="بدون حد" />
          <NumberInput label="ترتيب المجموعة" value={sortOrder} onChange={setSortOrder} />
          <SwitchRow label="إجباري" checked={isRequired} onChange={setIsRequired} />
          <SwitchRow label="مفعل" checked={enabled} onChange={setEnabled} />
        </div>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" onClick={handleSave}>
            حفظ القواعد
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pr-9"
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min="0"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
