import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePremiumUpgradeDetailQuery } from "@/hooks/usePremiumUpgradesQuery";
import { parseApiError } from "@/lib/apiErrors";
import type { PremiumUpgradeConfigDto } from "@/types/premiumUpgradeTypes";
import {
  formatPremiumSar,
  premiumDetailHealthCode,
  premiumDetailHealthStatus,
  premiumDetailStatus,
  premiumDetailUpgradeDeltaSar,
  premiumHealthLabel,
  premiumIssueMessage,
  premiumKindLabel,
  premiumRowKind,
  premiumRowName,
  premiumStatusLabel,
} from "@/utils/fetchPremiumUpgrades";

export function PremiumUpgradeDetailDrawer({
  row,
  onClose,
}: {
  row: PremiumUpgradeConfigDto | null;
  onClose: () => void;
}) {
  const detailQuery = usePremiumUpgradeDetailQuery(row?.id ?? null);
  const detail =
    detailQuery.data?.data && row
      ? { ...row, ...detailQuery.data.data }
      : row;

  return (
    <Dialog open={Boolean(row)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="grid max-h-[90dvh] w-[calc(100%-1rem)] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0"
        dir="rtl"
      >
        <DialogHeader className="border-b px-5 py-4 text-right">
          <DialogTitle>تفاصيل الترقية</DialogTitle>
          <DialogDescription>
            ملخص واضح للترقية المميزة وحالتها الحالية.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">
          {detailQuery.isLoading ? (
            <DetailSkeleton />
          ) : detailQuery.isError ? (
            <DetailError
              error={detailQuery.error}
              onRetry={() => detailQuery.refetch()}
            />
          ) : detail ? (
            <DetailContent compactRow={row} detail={detail} />
          ) : (
            <div className="rounded-xl border bg-muted/20 p-5 text-center text-sm text-muted-foreground">
              لا توجد بيانات لهذا السجل.
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-5 py-4 sm:justify-start">
          <Button type="button" variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailContent({
  compactRow,
  detail,
}: {
  compactRow: PremiumUpgradeConfigDto | null;
  detail: PremiumUpgradeConfigDto;
}) {
  const display = asRecord(detail.display);
  const behavior = asRecord(detail.behavior);
  const status = premiumDetailStatus(compactRow, detail);
  const health = premiumDetailHealthStatus(detail);
  const healthCode = premiumDetailHealthCode(detail);
  const enabled = readOptionalBoolean(display.enabled ?? detail.isEnabled);
  const visible = readOptionalBoolean(display.visible ?? detail.isVisible);
  const consumesMealSlot = readOptionalBoolean(
    behavior.consumesMealSlot ?? behavior.consumesExistingMealSlot
  );
  const sortOrder = readNumber(display.sortOrder ?? detail.sortOrder);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border bg-muted/20 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              العنصر المرتبط
            </p>
            <h3 className="mt-1 truncate text-xl font-semibold">
              {premiumRowName(detail)}
            </h3>
            <div className="mt-2">
              <Badge variant="secondary">
                {premiumKindLabel(premiumRowKind(detail))}
              </Badge>
            </div>
          </div>

          <div className="shrink-0 rounded-xl bg-background px-4 py-3 text-right shadow-sm ring-1 ring-border">
            <p className="text-xs text-muted-foreground">فرق سعر الترقية</p>
            <p className="mt-1 text-lg font-bold">
              {formatPremiumSar(premiumDetailUpgradeDeltaSar(detail))}
            </p>
          </div>
        </div>
      </section>

      {health === "broken" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">يحتاج إلى إعادة ربط بمصدر صالح</p>
          <p className="mt-1 text-amber-900">
            {premiumIssueMessage(healthCode)}
          </p>
        </div>
      ) : null}

      <section className="rounded-2xl border p-4 sm:p-5">
        <h4 className="font-semibold">الحالة والإعدادات</h4>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DetailItem
            label="الحالة"
            value={
              <Badge variant="outline">{premiumStatusLabel(status)}</Badge>
            }
          />
          <DetailItem
            label="صحة الربط"
            value={
              <Badge variant={health === "broken" ? "destructive" : "secondary"}>
                {premiumHealthLabel(health)}
              </Badge>
            }
          />
          {enabled !== undefined ? (
            <DetailItem
              label="التفعيل"
              value={enabled ? "مفعّلة" : "غير مفعّلة"}
            />
          ) : null}
          {visible !== undefined ? (
            <DetailItem
              label="الظهور للعميل"
              value={visible ? "ظاهرة" : "مخفية"}
            />
          ) : null}
          {sortOrder !== undefined ? (
            <DetailItem label="الترتيب" value={sortOrder} />
          ) : null}
          {consumesMealSlot !== undefined ? (
            <DetailItem
              label="تستهلك وجبة من الاشتراك"
              value={consumesMealSlot ? "نعم" : "لا"}
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-muted/25 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1.5 font-semibold">{value}</div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-20 animate-pulse rounded-xl bg-muted/70"
          />
        ))}
      </div>
    </div>
  );
}

function DetailError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const parsed = parseApiError(error);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <p className="font-medium">{parsed.message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={onRetry}
      >
        إعادة المحاولة
      </Button>
    </div>
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readOptionalBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function readNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}
