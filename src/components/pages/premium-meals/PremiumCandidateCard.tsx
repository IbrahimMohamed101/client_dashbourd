import { CheckCircle2, CircleAlert, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  PremiumUpgradeCandidateDto,
  PremiumUpgradeConfigDto,
  PremiumUpgradeSourceStatus,
} from "@/types/premiumUpgradeTypes";
import {
  formatPremiumSar,
  getSourceContext,
  premiumNameAr,
  premiumSelectionTypeLabel,
  premiumSourceTypeLabel,
} from "@/utils/fetchPremiumUpgrades";
import { cn } from "@/lib/utils";

export function PremiumCandidateCard({
  candidate,
  selected,
  onSelect,
}: {
  candidate: PremiumUpgradeCandidateDto;
  selected: boolean;
  onSelect: () => void;
}) {
  const eligible = candidate.eligibilityDiagnostics.eligible;
  const disabled = candidate.isLinked || !eligible;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "w-full rounded-lg border bg-card p-4 text-right transition",
        "hover:border-primary/60 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "border-primary bg-primary/5 ring-1 ring-primary",
        disabled && "cursor-not-allowed opacity-65 hover:border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{premiumNameAr(candidate.name)}</h3>
          <p className="text-sm text-muted-foreground">
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

      <div className="mt-3 flex flex-wrap gap-2">
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

      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <InfoLine label="مفتاح الترقية" value={candidate.premiumKey} />
        <InfoLine label="مصدر العنصر" value={getSourceContext(candidate)} />
      </div>

      <div className="mt-3">
        {candidate.isLinked ? (
          <StateLine tone="muted" text="مربوط مسبقا ولا يمكن ربطه مرة أخرى" />
        ) : eligible ? (
          <StateLine tone="success" text="مؤهل للربط كترقية مميزة" />
        ) : (
          <StateLine
            tone="warning"
            text={
              candidate.eligibilityDiagnostics.issues.join("، ") ||
              "غير مؤهل للربط"
            }
          />
        )}
      </div>
    </button>
  );
}

export function SourceStatusGroup({
  status,
}: {
  status: PremiumUpgradeSourceStatus;
}) {
  const items: Array<[keyof PremiumUpgradeSourceStatus, string]> = [
    ["exists", "موجود"],
    ["active", "نشط"],
    ["visible", "ظاهر"],
    ["available", "متاح"],
    ["published", "منشور"],
    ["subscriptionEnabled", "للاشتراك"],
    ["relationValid", "الربط صحيح"],
  ];

  return (
    <div className="flex max-w-[260px] flex-wrap gap-1">
      {items.map(([key, label]) => (
        <Badge
          key={key}
          variant="outline"
          className={
            status[key]
              ? "border-emerald-200 text-emerald-700"
              : "border-red-200 text-red-700"
          }
        >
          {label}
        </Badge>
      ))}
    </div>
  );
}

export function PremiumValidityBadge({
  row,
}: {
  row: PremiumUpgradeConfigDto;
}) {
  if (row.validation.valid) {
    return (
      <Badge variant="outline" className="border-emerald-200 text-emerald-700">
        <CheckCircle2 className="size-3" />
        صالح
      </Badge>
    );
  }

  return (
    <div className="space-y-1">
      <Badge variant="destructive">
        <CircleAlert className="size-3" />
        غير صالح
      </Badge>
      <p className="max-w-[240px] whitespace-normal text-xs text-muted-foreground">
        {[...row.validation.errors, ...row.validation.warnings].join("، ")}
      </p>
    </div>
  );
}

export function ReadOnlyItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}

export function StateToggleLine({
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
      />
      <span
        className={cn(
          "inline-flex h-[18px] w-8 items-center rounded-full border transition",
          checked ? "border-primary bg-primary" : "border-input bg-input"
        )}
      >
        <span
          className={cn(
            "size-4 rounded-full bg-background transition",
            checked ? "-translate-x-3.5" : "translate-x-0.5"
          )}
        />
      </span>
      <span>{label}</span>
    </label>
  );
}

export function ReplacementHelp({
  onOpenCandidates,
}: {
  onOpenCandidates?: () => void;
}) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm leading-6 text-blue-950">
      <p>
        لتغيير مصدر العنصر، أرشف هذا الربط ثم اربط عنصرا آخر من المنيو. تغيير
        المصدر لا يعدل عنصر المنيو الحالي ولا يتم عبر تعديل PATCH.
      </p>
      {onOpenCandidates ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2 bg-white"
          onClick={onOpenCandidates}
        >
          <Link2 data-icon="inline-start" />
          استبدال المصدر
        </Button>
      ) : null}
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="break-words font-medium">{value}</p>
    </div>
  );
}

function StateLine({
  tone,
  text,
}: {
  tone: "success" | "warning" | "muted";
  text: string;
}) {
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-muted bg-muted/40 text-muted-foreground";

  return <p className={cn("rounded-md border px-2 py-1 text-xs", className)}>{text}</p>;
}
