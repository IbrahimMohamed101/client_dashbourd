import { CheckCircle2, ChevronsUpDown, ImageIcon, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { PremiumUpgradeSourceDto } from "@/types/premiumUpgradeTypes";
import {
  premiumDisplayName,
  premiumKindLabel,
} from "@/utils/fetchPremiumUpgrades";
import { cn } from "@/lib/utils";

export type MenuSourcePickerProps = {
  sources: PremiumUpgradeSourceDto[];
  selectedId: string;
  search: string;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (source: PremiumUpgradeSourceDto) => void;
};

export function MenuSourcePicker({
  sources,
  selectedId,
  search,
  loading,
  onSearchChange,
  onSelect,
}: MenuSourcePickerProps) {
  const selected = sources.find((source) => source.id === selectedId);

  function choose(source: PremiumUpgradeSourceDto) {
    if (source.selectable === false) return;
    onSelect(source);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-auto min-h-14 w-full justify-between gap-3 px-4 py-3 text-right",
            selected && "border-primary bg-primary/5"
          )}
        >
          <span className="min-w-0 flex-1">
            {selected ? (
              <span className="block">
                <span className="block truncate font-semibold">
                  {premiumDisplayName(selected.name)}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {selected.key || selected.id} · {premiumKindLabel(selected.kind)}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">اختر المصدر</span>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        className="z-[70] w-[min(44rem,calc(100vw-2rem))] max-h-[min(78vh,660px)] overflow-hidden p-0"
        dir="rtl"
      >
        <div className="flex max-h-[min(78vh,660px)] min-h-0 flex-col">
          <div className="border-b p-3">
            <div>
              <h3 className="font-semibold">اختر مصدر الترقية</h3>
              <p className="text-xs text-muted-foreground">
                تظهر المنتجات والخيارات من endpoint المصادر. الصفوف غير المتاحة
                للاشتراكات تكون معطلة.
              </p>
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pr-9"
                placeholder="ابحث عن مصدر"
              />
            </div>
          </div>

          <SourceList
            sources={sources}
            selectedId={selectedId}
            loading={loading}
            onSelect={choose}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SourceList({
  sources,
  selectedId,
  loading,
  onSelect,
}: {
  sources: PremiumUpgradeSourceDto[];
  selectedId: string;
  loading: boolean;
  onSelect: (source: PremiumUpgradeSourceDto) => void;
}) {
  if (loading) {
    return (
      <div className="p-3">
        <div className="rounded-lg border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
          جاري تحميل المصادر...
        </div>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="p-3">
        <div className="rounded-lg border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
          لا توجد مصادر متاحة
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-3"
      onWheel={(event) => event.stopPropagation()}
      onTouchMove={(event) => event.stopPropagation()}
    >
      {sources.map((source) => {
        const selected = source.id === selectedId;
        const disabled = source.selectable === false;

        return (
          <button
            type="button"
            key={source.id}
            disabled={disabled}
            onClick={() => onSelect(source)}
            className={cn(
              "w-full rounded-lg border bg-card p-3 text-right transition",
              "hover:border-primary/60 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected && "border-primary bg-primary/5 ring-1 ring-primary",
              disabled && "cursor-not-allowed opacity-60 hover:border-border"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/30">
                {source.imageUrl ? (
                  <img
                    src={source.imageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {premiumDisplayName(source.name)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {source.key || source.id}
                    </p>
                  </div>
                  {selected ? (
                    <Badge className="shrink-0">
                      <CheckCircle2 className="size-3" />
                      محدد
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">
                    {premiumKindLabel(source.kind)}
                  </Badge>
                  {source.group ? (
                    <Badge variant="outline">
                      {formatSourceGroup(source.group)}
                    </Badge>
                  ) : null}
                  {disabled ? (
                    <Badge variant="outline" className="border-amber-200 text-amber-800">
                      غير متاح
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function formatSourceGroup(group: PremiumUpgradeSourceDto["group"]) {
  if (!group) return "-";
  if (typeof group === "string") return group;
  if ("name" in group || "key" in group) {
    return premiumDisplayName(group.name) || group.key || "-";
  }
  if ("ar" in group || "en" in group) {
    return premiumDisplayName(group);
  }
  return "-";
}
