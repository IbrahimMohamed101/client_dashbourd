import { useState } from "react";
import { Link2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type {
  PremiumUpgradeConfigDto,
  PremiumUpgradeListFilters,
} from "@/types/premiumUpgradeTypes";
import { defaultPremiumUpgradeListFilters } from "@/utils/fetchPremiumUpgrades";
import {
  usePremiumUpgradeInvalidation,
  usePremiumUpgradeReadinessQuery,
  usePremiumUpgradesQuery,
} from "@/hooks/usePremiumUpgradesQuery";
import { ReadinessCard } from "./ReadinessCard";
import { PremiumUpgradeFilters } from "./PremiumUpgradeFilters";
import { PremiumUpgradesTable } from "./PremiumUpgradesTable";
import { CandidateLinkDialog } from "./CandidateLinkDialog";
import { EditPremiumUpgradeDialog } from "./EditPremiumUpgradeDialog";
import { ArchivePremiumUpgradeDialog } from "./ArchivePremiumUpgradeDialog";

export function PremiumMealsPage() {
  const [filters, setFilters] = useState<PremiumUpgradeListFilters>(
    defaultPremiumUpgradeListFilters
  );
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [editingRow, setEditingRow] =
    useState<PremiumUpgradeConfigDto | null>(null);
  const [archiveRow, setArchiveRow] =
    useState<PremiumUpgradeConfigDto | null>(null);

  const readinessQuery = usePremiumUpgradeReadinessQuery();
  const listQuery = usePremiumUpgradesQuery(filters);
  const { invalidatePremiumUpgrades } = usePremiumUpgradeInvalidation();

  const rows = listQuery.data?.data ?? [];
  const total = listQuery.data?.meta?.total ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const loading = listQuery.isFetching || readinessQuery.isFetching;

  return (
    <div
      className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-6 lg:px-6"
      dir="rtl"
    >
      <header className="rounded-lg border bg-card p-5 shadow-xs lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Link2 className="size-5" />
            </div>
            <div className="min-w-0 space-y-2">
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                الوجبات المميزة
              </h1>
              <p className="max-w-4xl text-sm leading-6 text-muted-foreground">
                إدارة ترقيات وجبات الاشتراك فقط. الترقية تستهلك خانة وجبة موجودة
                ولا تضيف وجبة جديدة أو إضافة مستقلة.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={invalidatePremiumUpgrades}
            >
              <RefreshCw
                data-icon="inline-start"
                className={loading ? "animate-spin" : undefined}
              />
              تحديث
            </Button>
            <Button type="button" onClick={() => setCandidateOpen(true)}>
              <Link2 data-icon="inline-start" />
              ربط عنصر من المنيو كترقية مميزة
            </Button>
          </div>
        </div>
      </header>

      <ReadinessCard
        readiness={readinessQuery.data ?? null}
        loading={readinessQuery.isLoading}
        error={readinessQuery.isError}
      />

      <PremiumUpgradeFilters filters={filters} onChange={setFilters} />

      <PremiumUpgradesTable
        rows={rows}
        loading={listQuery.isLoading}
        filters={filters}
        total={total}
        totalPages={totalPages}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        onEdit={setEditingRow}
        onArchive={setArchiveRow}
      />

      <CandidateLinkDialog
        open={candidateOpen}
        onClose={() => setCandidateOpen(false)}
        onCreated={() => setCandidateOpen(false)}
      />

      <EditPremiumUpgradeDialog
        row={editingRow}
        onClose={() => setEditingRow(null)}
        onSaved={() => setEditingRow(null)}
      />

      <ArchivePremiumUpgradeDialog
        row={archiveRow}
        onClose={() => setArchiveRow(null)}
        onArchived={() => setArchiveRow(null)}
      />
    </div>
  );
}
