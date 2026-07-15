import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { PremiumUpgradeConfigDto } from "@/types/premiumUpgradeTypes";
import { usePremiumUpgradeDetailQuery } from "@/hooks/usePremiumUpgradesQuery";
import {
  formatJsonValue,
  premiumRowKey,
  premiumRowName,
} from "@/utils/fetchPremiumUpgrades";

const detailSections: Array<[string, keyof PremiumUpgradeConfigDto]> = [
  ["revision", "revision"],
  ["source", "source"],
  ["pricing", "pricing"],
  ["display", "display"],
  ["behavior", "behavior"],
  ["health", "health"],
  ["compatibility", "compatibility"],
];

export function PremiumUpgradeDetailDrawer({
  row,
  onClose,
}: {
  row: PremiumUpgradeConfigDto | null;
  onClose: () => void;
}) {
  const detailQuery = usePremiumUpgradeDetailQuery(row?.id ?? null);
  const detail = detailQuery.data?.data ?? row;

  return (
    <Drawer open={Boolean(row)} onOpenChange={(next) => !next && onClose()} direction="right">
      <DrawerContent className="w-[min(92vw,44rem)] sm:max-w-none" dir="rtl">
        <DrawerHeader className="border-b text-right">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DrawerTitle>{detail ? premiumRowName(detail) : "تفاصيل الترقية"}</DrawerTitle>
              <DrawerDescription>
                {detail ? premiumRowKey(detail) : "جاري تحميل التفاصيل..."}
              </DrawerDescription>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </DrawerHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {detailQuery.isLoading ? (
            <div className="rounded-lg border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
              جاري تحميل التفاصيل...
            </div>
          ) : detailQuery.isError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              تعذر تحميل تفاصيل الترقية.
            </div>
          ) : detail ? (
            detailSections.map(([label, key]) => (
              <section key={key} className="rounded-lg border">
                <div className="border-b bg-muted/20 px-3 py-2 text-sm font-semibold">
                  {label}
                </div>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words p-3 text-xs leading-6">
                  {formatJsonValue(detail[key])}
                </pre>
              </section>
            ))
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
