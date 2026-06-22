import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link2, Search } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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
import {
  PremiumCandidateCard,
  ReadOnlyItem,
  StateToggleLine,
} from "./PremiumCandidateCard";

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
  }, [open, initialSelectionType]);

  const candidatesQuery = usePremiumUpgradeCandidatesQuery(filters, open);
  const createMutation = useCreatePremiumUpgradeMutation(onCreated);
  const candidates = candidatesQuery.data?.data ?? [];
  const selected = candidates.find((candidate) => candidate.id === selectedId);

  function updateFilters(next: Partial<PremiumUpgradeCandidateFilters>) {
    setFilters((current) => ({ ...current, ...next, page: 1 }));
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
    setForm((current) => ({
      ...current,
      displayGroupKey: defaultDisplayGroupForSelection(candidate.selectionType),
      upgradeDeltaSarInput: String(candidate.upgradeDeltaHalala / 100),
    }));
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
        className="max-h-[90dvh] w-[calc(100%-1.5rem)] overflow-y-auto sm:max-w-[72rem]"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>ربط عنصر من المنيو كترقية مميزة</DialogTitle>
          <DialogDescription>
            اختر عنصرا موجودا من المنيو. هذه العملية تنشئ ربط PremiumUpgradeConfig
            فقط ولا تعدل منتج المنيو أو خيار المنيو.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={submit}>
          <CandidateFilters
            filters={filters}
            onChange={updateFilters}
          />

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <CandidateGrid
              candidates={candidates}
              selectedId={selectedId}
              loading={candidatesQuery.isLoading}
              onSelect={selectCandidate}
            />

            <LinkConfigPanel
              candidate={selected ?? null}
              form={form}
              onChange={setForm}
            />
          </div>

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

function CandidateFilters({
  filters,
  onChange,
}: {
  filters: PremiumUpgradeCandidateFilters;
  onChange: (filters: Partial<PremiumUpgradeCandidateFilters>) => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-4">
      <div className="space-y-2 md:col-span-2">
        <Label>بحث اختياري</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.q}
            onChange={(event) => onChange({ q: event.target.value })}
            className="pr-9"
            placeholder="ابحث بالاسم أو المفتاح"
          />
        </div>
      </div>
      <SelectField
        label="مصدر العنصر"
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
      <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 md:col-span-4">
        <div>
          <p className="text-sm font-medium">إظهار العناصر المربوطة مسبقا</p>
          <p className="text-xs text-muted-foreground">
            تظهر للمراجعة فقط وتبقى معطلة حتى لا يتم إنشاء ربط مكرر.
          </p>
        </div>
        <Switch
          checked={filters.includeLinked}
          onCheckedChange={(includeLinked) => onChange({ includeLinked })}
        />
      </div>
    </div>
  );
}

function CandidateGrid({
  candidates,
  selectedId,
  loading,
  onSelect,
}: {
  candidates: PremiumUpgradeCandidateDto[];
  selectedId: string;
  loading: boolean;
  onSelect: (candidate: PremiumUpgradeCandidateDto) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        جار تحميل عناصر المنيو المؤهلة...
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/20 p-6 text-center text-sm leading-6 text-muted-foreground">
        لا توجد عناصر مؤهلة غير مربوطة. فعّل خيار إظهار العناصر المربوطة
        لمراجعتها.
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">العناصر المتاحة للربط</h3>
        <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
          {candidates.length} عنصر
        </span>
      </div>
      <div className="grid max-h-[560px] gap-3 overflow-y-auto pr-1 md:grid-cols-2">
        {candidates.map((candidate) => (
          <PremiumCandidateCard
            key={candidate.id}
            candidate={candidate}
            selected={candidate.id === selectedId}
            onSelect={() => onSelect(candidate)}
          />
        ))}
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
        <h3 className="font-semibold">إعداد الربط</h3>
        <p className="text-sm text-muted-foreground">
          اختر بطاقة من القائمة لتفعيل حقول الإعداد.
        </p>
      </div>

      {candidate ? (
        <div className="grid gap-3 text-sm">
          <ReadOnlyItem
            label="مصدر العنصر"
            value={premiumSourceTypeLabel(candidate.sourceType)}
          />
          <ReadOnlyItem
            label="نوع الترقية"
            value={premiumSelectionTypeLabel(candidate.selectionType)}
          />
          <ReadOnlyItem
            label="سياق المصدر"
            value={getSourceContext(candidate)}
          />
          <ReadOnlyItem
            label="فرق السعر الحالي"
            value={formatPremiumSar(candidate.upgradeDeltaHalala / 100)}
          />
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
          لم يتم اختيار عنصر بعد.
        </div>
      )}

      <div className={candidate ? "space-y-3" : "pointer-events-none space-y-3 opacity-50"}>
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
