import { useState } from "react";
import type { FormEvent } from "react";
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
  PremiumUpgradeConfigDto,
  PremiumUpgradeKind,
  PremiumUpgradeSourceFilters,
} from "@/types/premiumUpgradeTypes";
import { useUpdatePremiumUpgradeMutation, usePremiumUpgradeSourcesQuery } from "@/hooks/usePremiumUpgradesQuery";
import {
  defaultPremiumUpgradeSourceFilters,
  premiumDisplayName,
  premiumPriceSar,
  premiumRowHealth,
  premiumRowKind,
  premiumRowName,
} from "@/utils/fetchPremiumUpgrades";
import { isValidRiyalInput, riyalToHalala } from "@/utils/price";
import { SelectField } from "./PremiumUpgradeFilters";
import { ReadOnlyItem, StateToggleLine } from "./PremiumCandidateCard";
import { MenuSourcePicker } from "./MenuSourcePicker";
import { PriceInput } from "./CandidateLinkDialog";

export function EditPremiumUpgradeDialog({
  row,
  mode,
  onClose,
  onSaved,
}: {
  row: PremiumUpgradeConfigDto | null;
  mode: "edit" | "relink";
  onClose: () => void;
  onSaved: () => void;
}) {
  const isRelink = mode === "relink";

  return (
    <Dialog open={Boolean(row)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>{isRelink ? "إعادة ربط الترقية" : "تعديل الترقية"}</DialogTitle>
          <DialogDescription>
            {isRelink
              ? "اختر نوعا ومصدرا صالحا للترقية المكسورة دون حذفها."
              : "عدّل السعر والحالة والظهور والترتيب فقط."}
          </DialogDescription>
        </DialogHeader>

        {row ? (
          isRelink ? (
            <RelinkPremiumUpgradeForm
              key={row.id}
              row={row}
              onClose={onClose}
              onSaved={onSaved}
            />
          ) : (
            <EditPremiumUpgradeForm
              key={row.id}
              row={row}
              onClose={onClose}
              onSaved={onSaved}
            />
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditPremiumUpgradeForm({
  row,
  onClose,
  onSaved,
}: {
  row: PremiumUpgradeConfigDto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    upgradePriceSarInput: String(premiumPriceSar(row)),
    currency: "SAR" as const,
    isActive: row.status ? row.status === "active" : row.isEnabled !== false,
    isVisible: row.status ? row.status !== "hidden" : row.isVisible !== false,
    sortOrder: String(row.sortOrder ?? 0),
  });
  const updateMutation = useUpdatePremiumUpgradeMutation(onSaved);

  function submit(event: FormEvent) {
    event.preventDefault();

    if (!isValidRiyalInput(form.upgradePriceSarInput)) {
      toast.error("سعر الترقية يجب أن يكون رقما غير سالب بالريال.");
      return;
    }

    const sortOrder = Number(form.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      toast.error("الترتيب يجب أن يكون رقما.");
      return;
    }

    updateMutation.mutate({
      id: row.id,
      payload: {
        expectedRevision: row.revision,
        upgradeDeltaHalala: riyalToHalala(form.upgradePriceSarInput),
        currency: form.currency,
        isActive: form.isActive,
        isVisible: form.isVisible,
        sortOrder,
      },
    });
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <Summary row={row} />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label>سعر الترقية</Label>
          <PriceInput
            value={form.upgradePriceSarInput}
            onChange={(upgradePriceSarInput) =>
              setForm((current) => ({ ...current, upgradePriceSarInput }))
            }
          />
        </div>
        <SelectField
          label="العملة"
          value={form.currency}
          onValueChange={() =>
            setForm((current) => ({ ...current, currency: "SAR" }))
          }
          options={[["SAR", "SAR"]]}
        />
        <NumberField
          label="الترتيب"
          value={form.sortOrder}
          step="1"
          onChange={(sortOrder) =>
            setForm((current) => ({ ...current, sortOrder }))
          }
        />
      </div>

      <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/20 p-3">
        <StateToggleLine
          label="نشط"
          checked={form.isActive}
          onCheckedChange={(isActive) =>
            setForm((current) => ({ ...current, isActive }))
          }
        />
        <StateToggleLine
          label="ظاهر"
          checked={form.isVisible}
          onCheckedChange={(isVisible) =>
            setForm((current) => ({ ...current, isVisible }))
          }
        />
      </div>

      <DialogFooter className="gap-2 sm:justify-start">
        <Button type="submit" disabled={updateMutation.isPending}>
          حفظ
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          إلغاء
        </Button>
      </DialogFooter>
    </form>
  );
}

function RelinkPremiumUpgradeForm({
  row,
  onClose,
  onSaved,
}: {
  row: PremiumUpgradeConfigDto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState<PremiumUpgradeKind>(premiumRowKind(row));
  const [sourceId, setSourceId] = useState(row.sourceId ?? "");
  const [sourceFilters, setSourceFilters] = useState<PremiumUpgradeSourceFilters>({
    ...defaultPremiumUpgradeSourceFilters,
    kind,
  });
  const sourcesQuery = usePremiumUpgradeSourcesQuery(sourceFilters, true);
  const updateMutation = useUpdatePremiumUpgradeMutation(onSaved);
  const sources = sourcesQuery.data?.data ?? [];
  const selected = sources.find((source) => source.id === sourceId);

  function updateKind(value: string) {
    const nextKind = value as PremiumUpgradeKind;
    setKind(nextKind);
    setSourceId("");
    setSourceFilters((current) => ({
      ...current,
      kind: nextKind,
      q: "",
      page: 1,
    }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!sourceId) {
      toast.error("اختر مصدرا صالحا أولا.");
      return;
    }

    updateMutation.mutate({
      id: row.id,
      payload: {
        expectedRevision: row.revision,
        kind,
        sourceId,
      },
    });
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <Summary row={row} />
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        يحتاج إلى إعادة ربط بمصدر صالح
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="النوع"
          value={kind}
          onValueChange={updateKind}
          options={[
            ["product", "منتج كامل"],
            ["option", "خيار داخل وجبة"],
          ]}
        />
        <div className="space-y-2">
          <Label>المصدر</Label>
          <MenuSourcePicker
            sources={sources}
            selectedId={sourceId}
            search={sourceFilters.q}
            loading={sourcesQuery.isLoading || sourcesQuery.isFetching}
            onSearchChange={(q) =>
              setSourceFilters((current) => ({ ...current, q, page: 1 }))
            }
            onSelect={(source) => setSourceId(source.id)}
          />
        </div>
      </div>

      {selected ? (
        <div className="rounded-lg border bg-muted/20 p-3 text-sm">
          <ReadOnlyItem label="المصدر الجديد" value={premiumDisplayName(selected.name)} />
        </div>
      ) : null}

      <DialogFooter className="gap-2 sm:justify-start">
        <Button type="submit" disabled={updateMutation.isPending || !sourceId}>
          إعادة الربط
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          إلغاء
        </Button>
      </DialogFooter>
    </form>
  );
}

function Summary({ row }: { row: PremiumUpgradeConfigDto }) {
  return (
    <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-3">
      <ReadOnlyItem label="الاسم" value={premiumRowName(row)} />
      <ReadOnlyItem label="المفتاح" value={row.key || row.premiumKey || "-"} />
      <ReadOnlyItem
        label="الصحة"
        value={premiumRowHealth(row) === "broken" ? "يحتاج إصلاح" : "جاهز"}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        value={value}
        step={step}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
