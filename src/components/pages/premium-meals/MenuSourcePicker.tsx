import { useMemo, useState } from "react";
import { CheckCircle2, ChevronsUpDown, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PremiumUpgradeCandidateDto } from "@/types/premiumUpgradeTypes";
import {
  formatPremiumSar,
  getSourceContext,
  premiumNameAr,
  premiumSelectionTypeLabel,
  premiumSourceTypeLabel,
} from "@/utils/fetchPremiumUpgrades";
import { cn } from "@/lib/utils";

export type MenuSourcePickerProps = {
  candidates: PremiumUpgradeCandidateDto[];
  selectedId: string;
  loading: boolean;
  onSelect: (candidate: PremiumUpgradeCandidateDto) => void;
  includeLinked: boolean;
  onIncludeLinkedChange: (value: boolean) => void;
  sourceTypeFilter: string;
  onSourceTypeFilterChange: (value: string) => void;
  selectionTypeFilter: string;
  onSelectionTypeFilterChange: (value: string) => void;
};

export function MenuSourcePicker({
  candidates,
  selectedId,
  loading,
  onSelect,
  includeLinked,
  onIncludeLinkedChange,
}: MenuSourcePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = candidates.find((candidate) => candidate.id === selectedId);

  const filteredCandidates = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return candidates;
    return candidates.filter((candidate) => {
      const haystack = [
        candidate.name.ar,
        candidate.name.en,
        candidate.key,
        candidate.premiumKey,
        candidate.sourceProductKey,
        candidate.sourceGroupKey,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(text);
    });
  }, [candidates, query]);

  function choose(candidate: PremiumUpgradeCandidateDto) {
    if (candidate.isLinked || !candidate.eligibilityDiagnostics.eligible) return;
    onSelect(candidate);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-14 w-full justify-between gap-3 px-4 py-3 text-right"
          >
            <span className="min-w-0 flex-1">
              {selected ? (
                <span className="block">
                  <span className="block font-semibold">
                    {premiumNameAr(selected.name)}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {selected.name.en || selected.key} ·{" "}
                    {premiumSourceTypeLabel(selected.sourceType)} ·{" "}
                    {premiumSelectionTypeLabel(selected.selectionType)}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  اختر خيارا أو منتجا من المنيو
                </span>
              )}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(42rem,calc(100vw-2rem))] p-3"
          dir="rtl"
        >
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold">اختر عنصر من المنيو</h3>
              <p className="text-xs text-muted-foreground">
                تظهر العناصر المؤهلة غير المربوطة مباشرة. البحث هنا اختياري
                داخل القائمة فقط.
              </p>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pr-9"
                placeholder="ابحث داخل العناصر المعروضة"
              />
            </div>

            <CandidateList
              candidates={filteredCandidates}
              unfilteredCount={candidates.length}
              selectedId={selectedId}
              loading={loading}
              includeLinked={includeLinked}
              onIncludeLinkedChange={onIncludeLinkedChange}
              onSelect={choose}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function CandidateList({
  candidates,
  unfilteredCount,
  selectedId,
  loading,
  includeLinked,
  onIncludeLinkedChange,
  onSelect,
}: {
  candidates: PremiumUpgradeCandidateDto[];
  unfilteredCount: number;
  selectedId: string;
  loading: boolean;
  includeLinked: boolean;
  onIncludeLinkedChange: (value: boolean) => void;
  onSelect: (candidate: PremiumUpgradeCandidateDto) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
        جار تحميل عناصر المنيو...
      </div>
    );
  }

  if (candidates.length === 0) {
    if (unfilteredCount === 0 && !includeLinked) {
      return (
        <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
          <p>
            لا توجد عناصر متاحة للربط. قد تكون كل العناصر المؤهلة مربوطة
            بالفعل.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => onIncludeLinkedChange(true)}
          >
            عرض العناصر المربوطة مسبقا
          </Button>
        </div>
      );
    }

    if (unfilteredCount === 0 && includeLinked) {
      return (
        <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
          لا توجد بيانات مرشحة من الخادم. يرجى مراجعة endpoint الخاصة
          بالمرشحين.
        </div>
      );
    }

    return (
      <div className="rounded-lg border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
        لا توجد عناصر مطابقة.
      </div>
    );
  }

  return (
    <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
      {candidates.map((candidate) => {
        const selected = candidate.id === selectedId;
        const disabled =
          candidate.isLinked || !candidate.eligibilityDiagnostics.eligible;

        return (
          <button
            type="button"
            key={candidate.id}
            disabled={disabled}
            onClick={() => onSelect(candidate)}
            className={cn(
              "w-full rounded-lg border bg-card p-3 text-right transition",
              "hover:border-primary/60 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "border-primary bg-primary/5 ring-1 ring-primary",
              disabled && "cursor-not-allowed opacity-60 hover:border-border"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{premiumNameAr(candidate.name)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {candidate.name.en || candidate.key}
                </p>
              </div>
              {selected ? (
                <Badge>
                  <CheckCircle2 className="size-3" />
                  محدد
                </Badge>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary">
                {premiumSourceTypeLabel(candidate.sourceType)}
              </Badge>
              <Badge variant="outline">
                {premiumSelectionTypeLabel(candidate.selectionType)}
              </Badge>
              <Badge variant="outline">
                {formatPremiumSar(candidate.upgradeDeltaHalala / 100)}
              </Badge>
            </div>

            <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <span>المصدر: {getSourceContext(candidate)}</span>
              <span>المفتاح: {candidate.premiumKey}</span>
            </div>

            {candidate.isLinked ? (
              <p className="mt-2 rounded border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                مربوط مسبقا ولا يمكن ربطه مرة أخرى
              </p>
            ) : !candidate.eligibilityDiagnostics.eligible ? (
              <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
                {candidate.eligibilityDiagnostics.issues.join("، ") ||
                  "غير مؤهل للربط"}
              </p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
