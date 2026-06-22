import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import type {
  PremiumUpgradeCandidateDto,
  PremiumUpgradeCandidateFilters,
  PremiumUpgradeSelectionType,
} from "@/types/premiumUpgradeTypes";
import {
  buildCreatePremiumUpgradePayload,
  defaultDisplayGroupForSelection,
  defaultPremiumUpgradeCandidateFilters,
  formatPremiumSar,
  getSourceContext,
  premiumSelectionTypeLabel,
  premiumSourceTypeLabel,
} from "@/utils/fetchPremiumUpgrades";
import {
  useCreatePremiumUpgradeMutation,
  usePremiumUpgradeCandidatesQuery,
} from "@/hooks/usePremiumUpgradesQuery";
import { SelectField } from "./PremiumUpgradeFilters";
import { MenuSourcePicker } from "./MenuSourcePicker";
import { ReadOnlyItem, StateToggleLine } from "./PremiumCandidateCard";

type LinkFormState = {
  displayGroupKey: string;
  upgradeDeltaSarInput: string;
  isEnabled: boolean;
  isVisible: boolean;
  sortOrder: string;
};

export function CandidateLinkDialog({
  open,
  initialSelectionType,
  onClose,
  onCreated,
}: {
  open: boolean;
  initialSelectionType?: PremiumUpgradeSelectionType | "all";
  onClose: () => void;
  onCreated: () => void;
}) {
  const [filters, setFilters] = useState<PremiumUpgradeCandidateFilters>({
    ...defaultPremiumUpgradeCandidateFilters,
    selectionType: initialSelectionType ?? "all",
  });
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<LinkFormState>({
    displayGroupKey: "premium_proteins",
    upgradeDeltaSarInput: "0",
    isEnabled: true,
    isVisible: true,
    sortOrder: "10",
  });

  useEffect(() => {
    if (!open) return;
    setFilters({
      ...defaultPremiumUpgradeCandidateFilters,
      selectionType: initialSelectionType ?? "all",
    });
    setSelectedId("");
    setForm({
      displayGroupKey: "premium_proteins",
      upgradeDeltaSarInput: "0",
      isEnabled: true,
      isVisible: true,
      sortOrder: "10",
    });
  }, [open, initialSelectionType]);

  const candidatesQuery = usePremiumUpgradeCandidatesQuery(filters, open);
  const createMutation = useCreatePremiumUpgradeMutation(onCreated);
  const candidates = candidatesQuery.data?.data ?? [];
  const selected = candidates.find((candidate) => candidate.id === selectedId);

  function updateFilters(next: Partial<PremiumUpgradeCandidateFilters>) {
    setFilters((current) => ({
      ...current,
      ...next,
      q: next.q ?? current.q,
      page: 1,
    }));
  }

  function selectCandidate(candidate: PremiumUpgradeCandidateDto) {
    if (candidate.isLinked) {
      toast.error("هذا العنصر مربوط مسبقا ولا يمكن ربطه مرة أخرى.");
      return;
    }
    if (!candidate.eligibilityDiagnostics.eligible) {
      toast.error("هذا العنصر غير مؤهل للربط كترقية مميزة.");
      return;
    }

    setSelectedId(candidate.id);
    setForm({
      displayGroupKey: defaultDisplayGroupForSelection(candidate.selectionType),
      upgradeDeltaSarInput: String(candidate.upgradeDeltaHalala / 100),
      isEnabled: true,
      isVisible: true,
      sortOrder: form.sortOrder || "10",
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) {
      toast.error("اختر عنصرا من المنيو أولا.");
      return;
    }
    if (selected.isLinked) {
      toast.error("هذا العنصر مربوط مسبقا.");
      return;
    }
    if (!selected.eligibilityDiagnostics.eligible) {
      toast.error("هذا العنصر غير مؤهل للربط.");
      return;
    }
    if (!form.displayGroupKey) {
      toast.error("اختر مجموعة العرض.");
      return;
    }

    const delta = Math.round(Number(form.upgradeDeltaSarInput) * 100);
    const sortOrder = Number(form.sortOrder);
    if (!Number.isFinite(delta) || delta < 0) {
      toast.error("فرق سعر الترقية يجب أن يكون رقما غير سالب.");
      return;
    }
    if (!Number.isFinite(sortOrder)) {
      toast.error("الترتيب يجب أن يكون رقما.");
      return;
    }

    createMutation.mutate(buildCreatePremiumUpgradePayload(selected, form));
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="max-h-[90dvh] w-[calc(100%-1.5rem)] overflow-y-auto sm:max-w-2xl"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>ربط عنصر من المنيو كترقية مميزة</DialogTitle>
          <DialogDescription>
            اختر منتجا أو خيارا موجودا من المنيو ثم حدد إعدادات ظهوره كترقية
            مميزة.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={submit}>
          <div className="space-y-2">
            <Label>العنصر من المنيو</Label>
            <MenuSourcePicker
              candidates={candidates}
              selectedId={selectedId}
              loading={candidatesQuery.isLoading}
              onSelect={selectCandidate}
              includeLinked={filters.includeLinked}
              onIncludeLinkedChange={(includeLinked) =>
                updateFilters({ includeLinked })
              }
              sourceTypeFilter={filters.sourceType}
              onSourceTypeFilterChange={(sourceType) =>
                updateFilters({ sourceType })
              }
              selectionTypeFilter={filters.selectionType}
              onSelectionTypeFilterChange={(selectionType) =>
                updateFilters({ selectionType })
              }
            />
          </div>

          <AdvancedCandidateFilters filters={filters} onChange={updateFilters} />

          <SelectedCandidateSummary candidate={selected ?? null} />

          <LinkConfigPanel
            candidate={selected ?? null}
            form={form}
            onChange={setForm}
          />

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="submit"
              disabled={createMutation.isPending || !selected}
            >
              <Link2 data-icon="inline-start" />
              ربط كترقية مميزة
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdvancedCandidateFilters({
  filters,
  onChange,
}: {
  filters: PremiumUpgradeCandidateFilters;
  onChange: (filters: Partial<PremiumUpgradeCandidateFilters>) => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-3">
      <SelectField
        label="نوع المصدر"
        value={filters.sourceType}
        onValueChange={(sourceType) => onChange({ sourceType })}
        options={[
          ["all", "الكل"],
          ["menu_option", "خيار منيو"],
          ["menu_product", "منتج منيو"],
        ]}
      />
      <SelectField
        label="نوع الترقية"
        value={filters.selectionType}
        onValueChange={(selectionType) => onChange({ selectionType })}
        options={[
          ["all", "الكل"],
          ["premium_meal", "بروتين مميز"],
          ["premium_large_salad", "سلطة كبيرة مميزة"],
        ]}
      />
      <label className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
        <span>
          <span className="block text-sm font-medium">إظهار المرتبط مسبقا</span>
          <span className="block text-xs text-muted-foreground">
            يظهر للمعاينة فقط ويكون معطلا داخل القائمة.
          </span>
        </span>
        <input
          type="checkbox"
          className="size-4 accent-primary"
          checked={filters.includeLinked}
          onChange={(event) => onChange({ includeLinked: event.target.checked })}
        />
      </label>
    </div>
  );
}

function SelectedCandidateSummary({
  candidate,
}: {
  candidate: PremiumUpgradeCandidateDto | null;
}) {
  if (!candidate) {
    return (
      <div className="rounded-lg border bg-muted/20 p-5 text-center text-sm text-muted-foreground">
        اختر عنصر من المنيو أولا لعرض مصدر العنصر ونوع الترقية.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="font-semibold">
          {candidate.name.ar || candidate.name.en || candidate.key}
        </h3>
        <p className="text-sm text-muted-foreground">
          {candidate.name.en || candidate.key}
        </p>
      </div>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <ReadOnlyItem
          label="مصدر العنصر"
          value={premiumSourceTypeLabel(candidate.sourceType)}
        />
        <ReadOnlyItem
          label="نوع الترقية"
          value={premiumSelectionTypeLabel(candidate.selectionType)}
        />
        <ReadOnlyItem label="سياق المصدر" value={getSourceContext(candidate)} />
        <ReadOnlyItem
          label="فرق السعر الحالي"
          value={formatPremiumSar(candidate.upgradeDeltaHalala / 100)}
        />
      </div>
    </div>
  );
}

function LinkConfigPanel({
  candidate,
  form,
  onChange,
}: {
  candidate: PremiumUpgradeCandidateDto | null;
  form: LinkFormState;
  onChange: (form: LinkFormState) => void;
}) {
  function update(next: Partial<LinkFormState>) {
    onChange({ ...form, ...next });
  }

  return (
    <aside className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="font-semibold">إعدادات ظهور الترقية</h3>
        <p className="text-sm text-muted-foreground">
          بعد اختيار العنصر، عدل مجموعة العرض والسعر والترتيب.
        </p>
      </div>

      <div
        className={
          candidate ? "space-y-3" : "pointer-events-none space-y-3 opacity-50"
        }
      >
        <SelectField
          label="مجموعة العرض"
          value={form.displayGroupKey}
          onValueChange={(displayGroupKey) => update({ displayGroupKey })}
          options={[
            ["premium_proteins", "بروتينات مميزة"],
            ["premium_salads", "سلطات مميزة"],
          ]}
        />
        <NumberField
          label="فرق سعر الترقية بالريال"
          value={form.upgradeDeltaSarInput}
          min="0"
          step="0.01"
          onChange={(upgradeDeltaSarInput) => update({ upgradeDeltaSarInput })}
        />
        <NumberField
          label="الترتيب"
          value={form.sortOrder}
          step="1"
          onChange={(sortOrder) => update({ sortOrder })}
        />
        <div className="flex flex-wrap gap-4">
          <StateToggleLine
            label="مفعل"
            checked={form.isEnabled}
            onCheckedChange={(isEnabled) => update({ isEnabled })}
          />
          <StateToggleLine
            label="ظاهر للعميل"
            checked={form.isVisible}
            onCheckedChange={(isVisible) => update({ isVisible })}
          />
        </div>
      </div>
    </aside>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        step={step}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
