import { Archive, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  PremiumUpgradeConfigDto,
  PremiumUpgradeListFilters,
} from "@/types/premiumUpgradeTypes";
import {
  formatPremiumSar,
  premiumNameAr,
  premiumSelectionTypeLabel,
  premiumSourceTypeLabel,
} from "@/utils/fetchPremiumUpgrades";
import { useUpdatePremiumUpgradeStateMutation } from "@/hooks/usePremiumUpgradesQuery";
import {
  PremiumValidityBadge,
  ReadOnlyItem,
  SourceStatusGroup,
  StateToggleLine,
} from "./PremiumCandidateCard";

export function PremiumUpgradesTable({
  rows,
  loading,
  filters,
  total,
  totalPages,
  onPageChange,
  onEdit,
  onArchive,
}: {
  rows: PremiumUpgradeConfigDto[];
  loading: boolean;
  filters: PremiumUpgradeListFilters;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (row: PremiumUpgradeConfigDto) => void;
  onArchive: (row: PremiumUpgradeConfigDto) => void;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>قائمة الترقيات المميزة</CardTitle>
          <CardDescription>
            الأسعار المعروضة بالريال، والحفظ يرسل فرق سعر الترقية بالهللة.
          </CardDescription>
        </div>
        <Badge variant="secondary">{total} إعداد</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <MobileRows
          rows={rows}
          loading={loading}
          onEdit={onEdit}
          onArchive={onArchive}
        />
        <DesktopRows
          rows={rows}
          loading={loading}
          onEdit={onEdit}
          onArchive={onArchive}
        />

        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            صفحة {filters.page} من {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={filters.page <= 1}
              onClick={() => onPageChange(filters.page - 1)}
            >
              السابق
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={filters.page >= totalPages}
              onClick={() => onPageChange(filters.page + 1)}
            >
              التالي
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MobileRows({
  rows,
  loading,
  onEdit,
  onArchive,
}: {
  rows: PremiumUpgradeConfigDto[];
  loading: boolean;
  onEdit: (row: PremiumUpgradeConfigDto) => void;
  onArchive: (row: PremiumUpgradeConfigDto) => void;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-muted/20 p-5 text-center text-sm text-muted-foreground md:hidden">
        جار تحميل الترقيات...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/20 p-5 text-center text-sm text-muted-foreground md:hidden">
        لا توجد ترقيات مطابقة للتصفية الحالية.
      </div>
    );
  }

  return (
    <div className="space-y-3 md:hidden">
      {rows.map((row) => (
        <PremiumUpgradeMobileCard
          key={row.id}
          row={row}
          onEdit={() => onEdit(row)}
          onArchive={() => onArchive(row)}
        />
      ))}
    </div>
  );
}

function DesktopRows({
  rows,
  loading,
  onEdit,
  onArchive,
}: {
  rows: PremiumUpgradeConfigDto[];
  loading: boolean;
  onEdit: (row: PremiumUpgradeConfigDto) => void;
  onArchive: (row: PremiumUpgradeConfigDto) => void;
}) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الاسم</TableHead>
            <TableHead className="text-right">مفتاح الترقية</TableHead>
            <TableHead className="text-right">نوع الترقية</TableHead>
            <TableHead className="text-right">نوع المصدر</TableHead>
            <TableHead className="text-right">فرق السعر</TableHead>
            <TableHead className="text-right">حالة العرض</TableHead>
            <TableHead className="text-right">الصلاحية</TableHead>
            <TableHead className="text-right">حالة المصدر</TableHead>
            <TableHead className="text-right">الترتيب</TableHead>
            <TableHead className="text-right">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={10} className="h-28 text-center text-muted-foreground">
                جار تحميل الترقيات...
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-28 text-center text-muted-foreground">
                لا توجد ترقيات مطابقة للتصفية الحالية.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <PremiumUpgradeRow
                key={row.id}
                row={row}
                onEdit={() => onEdit(row)}
                onArchive={() => onArchive(row)}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function PremiumUpgradeRow({
  row,
  onEdit,
  onArchive,
}: {
  row: PremiumUpgradeConfigDto;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const stateMutation = useUpdatePremiumUpgradeStateMutation();
  const pending = stateMutation.isPending || row.status === "archived";

  return (
    <TableRow>
      <TableCell>
        <div className="min-w-[160px]">
          <p className="font-medium">{premiumNameAr(row.sourceName)}</p>
          <p className="text-xs text-muted-foreground">
            {row.sourceName.en || row.sourceKey}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <code className="rounded bg-muted px-2 py-1 text-xs">
          {row.premiumKey}
        </code>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {premiumSelectionTypeLabel(row.selectionType)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {premiumSourceTypeLabel(row.sourceType)}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">
        {formatPremiumSar(row.upgradeDeltaSar)}
      </TableCell>
      <TableCell>
        <StateControls row={row} pending={pending} />
      </TableCell>
      <TableCell>
        <PremiumValidityBadge row={row} />
      </TableCell>
      <TableCell>
        <SourceStatusGroup status={row.sourceStatus} />
      </TableCell>
      <TableCell>{row.sortOrder}</TableCell>
      <TableCell>
        <Actions row={row} onEdit={onEdit} onArchive={onArchive} />
      </TableCell>
    </TableRow>
  );
}

function PremiumUpgradeMobileCard({
  row,
  onEdit,
  onArchive,
}: {
  row: PremiumUpgradeConfigDto;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const stateMutation = useUpdatePremiumUpgradeStateMutation();
  const pending = stateMutation.isPending || row.status === "archived";

  return (
    <article className="space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{premiumNameAr(row.sourceName)}</h3>
          <p className="text-sm text-muted-foreground">
            {row.sourceName.en || row.sourceKey}
          </p>
        </div>
        <CustomerStateBadge row={row} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <ReadOnlyItem label="مفتاح الترقية" value={row.premiumKey} />
        <ReadOnlyItem label="فرق السعر" value={formatPremiumSar(row.upgradeDeltaSar)} />
        <ReadOnlyItem label="نوع الترقية" value={premiumSelectionTypeLabel(row.selectionType)} />
        <ReadOnlyItem label="نوع المصدر" value={premiumSourceTypeLabel(row.sourceType)} />
        <ReadOnlyItem label="الترتيب" value={row.sortOrder} />
      </div>

      <StateControls row={row} pending={pending} />
      <div className="space-y-2">
        <PremiumValidityBadge row={row} />
        <SourceStatusGroup status={row.sourceStatus} />
      </div>
      <Actions row={row} onEdit={onEdit} onArchive={onArchive} mobile />
    </article>
  );
}

function StateControls({
  row,
  pending,
}: {
  row: PremiumUpgradeConfigDto;
  pending: boolean;
}) {
  const stateMutation = useUpdatePremiumUpgradeStateMutation();

  return (
    <div className="flex min-w-[15rem] flex-wrap items-center gap-3">
      <CustomerStateBadge row={row} />
      <StateToggleLine
        label="مفعل"
        checked={row.isEnabled}
        disabled={pending}
        onCheckedChange={(isEnabled) =>
          stateMutation.mutate({
            id: row.id,
            payload: { expectedRevision: row.revision, isEnabled },
          })
        }
      />
      <StateToggleLine
        label="ظاهر"
        checked={row.isVisible}
        disabled={pending}
        onCheckedChange={(isVisible) =>
          stateMutation.mutate({
            id: row.id,
            payload: { expectedRevision: row.revision, isVisible },
          })
        }
      />
    </div>
  );
}

function CustomerStateBadge({ row }: { row: PremiumUpgradeConfigDto }) {
  if (row.status === "archived") {
    return <Badge variant="secondary">مؤرشف</Badge>;
  }

  if (!row.isEnabled && !row.isVisible) {
    return <Badge variant="secondary">معطل ومخفي</Badge>;
  }

  if (!row.isEnabled) {
    return <Badge variant="secondary">معطل</Badge>;
  }

  if (!row.isVisible) {
    return <Badge variant="outline">مخفي عن العميل</Badge>;
  }

  return <Badge>نشط للعميل</Badge>;
}

function Actions({
  row,
  onEdit,
  onArchive,
  mobile,
}: {
  row: PremiumUpgradeConfigDto;
  onEdit: () => void;
  onArchive: () => void;
  mobile?: boolean;
}) {
  return (
    <div className={mobile ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2"}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={row.status === "archived"}
        onClick={onEdit}
      >
        <Pencil data-icon="inline-start" />
        تعديل
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={row.status === "archived"}
        onClick={onArchive}
      >
        <Archive data-icon="inline-start" />
        أرشفة
      </Button>
    </div>
  );
}
