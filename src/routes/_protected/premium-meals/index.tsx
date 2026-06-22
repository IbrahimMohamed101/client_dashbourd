import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  CheckCircle2,
  Filter,
  Link2,
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/apis";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_protected/premium-meals/")({
  component: PremiumMealsScreen,
});

type SourceType = "menu_option" | "menu_product";
type SelectionType = "premium_meal" | "premium_large_salad";
type PremiumUpgradeStatus = "active" | "archived";
type FilterValue = "all" | string;

type LocalizedName = {
  ar: string | null;
  en: string | null;
};

type PremiumUpgradeConfigDto = {
  id: string;
  revision: number;
  sourceType: SourceType;
  sourceId: string;
  sourceProductId: string | null;
  sourceGroupId: string | null;
  sourceGroupKey: string | null;
  sourceKey: string;
  sourceName: LocalizedName;
  selectionType: SelectionType;
  premiumKey: string;
  displayGroup: { key: string | null; id: string | null };
  upgradeDeltaHalala: number;
  upgradeDeltaSar: number;
  currency: "SAR";
  isEnabled: boolean;
  isVisible: boolean;
  status: PremiumUpgradeStatus;
  sortOrder: number;
  sourceStatus: {
    exists: boolean;
    active: boolean;
    visible: boolean;
    available: boolean;
    published: boolean;
    subscriptionEnabled: boolean;
    relationValid: boolean;
  };
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  businessRule: {
    consumesExistingMealSlot: true;
    doesAddMeal: false;
    limitSource: "subscription_total_meals";
  };
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

type PremiumUpgradeCandidateDto = {
  id: string;
  sourceId: string;
  type: SourceType;
  sourceType: SourceType;
  sourceProductId: string | null;
  sourceGroupId: string | null;
  sourceProductKey: string | null;
  sourceGroupKey: string | null;
  key: string;
  premiumKey: string;
  name: LocalizedName;
  selectionType: SelectionType;
  upgradeDeltaHalala: number;
  currency: "SAR";
  isLinked: boolean;
  eligibilityDiagnostics: {
    eligible: boolean;
    issues: string[];
  };
};

type ListResponse<T> = {
  data: T[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
  };
  status: boolean;
};

type SingleResponse<T> = {
  data: T;
  status: boolean;
};

type ReadinessResponse = {
  isReady: boolean;
  diagnostics: {
    totalConfigs?: number;
    activeConfigs?: number;
    missingSources?: number;
    invalidRelations?: number;
    duplicateKeys?: number;
    priceMismatches?: unknown[];
    legacyChecks?: {
      builderProteinsCount?: number;
      fallbackActive?: boolean;
    };
    configState?: {
      isEmpty?: boolean;
      legacyFallbackActive?: boolean;
      configsAuthoritative?: boolean;
      backfillStatus?: string;
      partialConfigRisk?: boolean;
      knownKeys?: string[];
      configuredKnownKeys?: string[];
      missingConfigKeys?: string[];
    };
    knownSources?: Array<{
      premiumKey?: string;
      resolvable?: boolean;
      sourceType?: string;
      sourceId?: string;
      sourceProductId?: string | null;
      sourceGroupId?: string | null;
      issues?: string[];
    }>;
    unresolvedSourceKeys?: string[];
  };
  status: boolean;
};

type ListFilters = {
  q: string;
  status: FilterValue;
  isEnabled: FilterValue;
  isVisible: FilterValue;
  sourceType: FilterValue;
  selectionType: FilterValue;
  page: number;
  limit: number;
};

type CandidateFilters = {
  q: string;
  sourceType: FilterValue;
  selectionType: FilterValue;
  includeLinked: boolean;
  page: number;
  limit: number;
};

const LIST_QUERY_KEY = "premium-upgrades.list";
const READINESS_QUERY_KEY = "premium-upgrades.readiness";
const CANDIDATES_QUERY_KEY = "premium-upgrades.candidates";

const defaultListFilters: ListFilters = {
  q: "",
  status: "all",
  isEnabled: "all",
  isVisible: "all",
  sourceType: "all",
  selectionType: "all",
  page: 1,
  limit: 20,
};

const defaultCandidateFilters: CandidateFilters = {
  q: "",
  sourceType: "all",
  selectionType: "all",
  includeLinked: false,
  page: 1,
  limit: 20,
};

const errorMessages: Record<string, string> = {
  PREMIUM_UPGRADE_INVALID_SOURCE_ID:
    "معرف المصدر غير صحيح. حدّث قائمة العناصر وحاول مرة أخرى.",
  PREMIUM_UPGRADE_SOURCE_NOT_FOUND: "عنصر المنيو المحدد لم يعد موجودا.",
  PREMIUM_UPGRADE_SOURCE_NOT_ELIGIBLE:
    "هذا العنصر غير مؤهل ليكون ترقية مميزة.",
  PREMIUM_UPGRADE_RELATION_INVALID: "ربط المصدر غير صحيح أو غير مكتمل.",
  PREMIUM_UPGRADE_DUPLICATE: "هذا المصدر مربوط مسبقا كترقية مميزة.",
  PREMIUM_UPGRADE_KEY_CONFLICT: "مفتاح الترقية المميزة مستخدم مسبقا.",
  PREMIUM_UPGRADE_INVALID_DELTA:
    "فرق سعر الترقية يجب أن يكون رقما صحيحا وغير سالب.",
  PREMIUM_UPGRADE_REVISION_CONFLICT:
    "تم تعديل هذا العنصر بواسطة مدير آخر. حدّث الصفحة وحاول مرة أخرى.",
  PREMIUM_UPGRADE_ARCHIVED: "هذه الترقية مؤرشفة ولا تقبل هذا الإجراء.",
};

function PremiumMealsScreen() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ListFilters>(defaultListFilters);
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [editingRow, setEditingRow] =
    useState<PremiumUpgradeConfigDto | null>(null);
  const [archiveRow, setArchiveRow] =
    useState<PremiumUpgradeConfigDto | null>(null);

  const readinessQuery = useQuery({
    queryKey: [READINESS_QUERY_KEY],
    queryFn: getReadiness,
  });

  const listQuery = useQuery({
    queryKey: [LIST_QUERY_KEY, filters],
    queryFn: () => listPremiumUpgrades(filters),
  });

  const rows = listQuery.data?.data ?? [];
  const total = listQuery.data?.meta?.total ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  function refreshAll() {
    queryClient.invalidateQueries({ queryKey: [READINESS_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [LIST_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [CANDIDATES_QUERY_KEY] });
  }

  return (
    <div
      className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-6 lg:px-6"
      dir="rtl"
    >
      <PageHeader
        loading={listQuery.isFetching || readinessQuery.isFetching}
        onRefresh={refreshAll}
        onAdd={() => setCandidateOpen(true)}
      />

      <ReadinessCard
        readiness={readinessQuery.data ?? null}
        loading={readinessQuery.isLoading}
        error={readinessQuery.isError}
      />

      <FiltersCard filters={filters} onChange={setFilters} />

      <UpgradesTable
        rows={rows}
        loading={listQuery.isLoading}
        filters={filters}
        total={total}
        totalPages={totalPages}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        onEdit={setEditingRow}
        onArchive={setArchiveRow}
        onChanged={refreshAll}
      />

      <CandidateDialog
        open={candidateOpen}
        onClose={() => setCandidateOpen(false)}
        onCreated={() => {
          setCandidateOpen(false);
          refreshAll();
        }}
      />

      <EditDialog
        row={editingRow}
        onClose={() => setEditingRow(null)}
        onSaved={() => {
          setEditingRow(null);
          refreshAll();
        }}
      />

      <ArchiveDialog
        row={archiveRow}
        onClose={() => setArchiveRow(null)}
        onArchived={() => {
          setArchiveRow(null);
          refreshAll();
        }}
      />
    </div>
  );
}

function PageHeader({
  loading,
  onRefresh,
  onAdd,
}: {
  loading: boolean;
  onRefresh: () => void;
  onAdd: () => void;
}) {
  return (
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
          <Button type="button" variant="outline" onClick={onRefresh}>
            <RefreshCw
              data-icon="inline-start"
              className={loading ? "animate-spin" : undefined}
            />
            تحديث
          </Button>
          <Button type="button" onClick={onAdd}>
            <Link2 data-icon="inline-start" />
            ربط عنصر من المنيو
          </Button>
        </div>
      </div>
    </header>
  );
}

function ReadinessCard({
  readiness,
  loading,
  error,
}: {
  readiness: ReadinessResponse | null;
  loading: boolean;
  error: boolean;
}) {
  const diagnostics = readiness?.diagnostics;
  const state = diagnostics?.configState;
  const banner = getReadinessBanner(readiness);

  return (
    <Card className="shadow-none">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              {banner.tone === "success" ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <ShieldAlert className="size-5 text-amber-600" />
              )}
              جاهزية نظام الترقيات
            </CardTitle>
            <CardDescription>
              توضح هذه البطاقة هل إعدادات PremiumUpgradeConfig مكتملة وآمنة
              للاستخدام في مخطط الاشتراكات.
            </CardDescription>
          </div>
          <Badge variant={readiness?.isReady ? "default" : "secondary"}>
            {loading ? "جار التحميل" : readiness?.isReady ? "جاهز" : "يحتاج مراجعة"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={banner.className}>{error ? "تعذر تحميل الجاهزية." : banner.message}</div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Metric label="كل الإعدادات" value={diagnostics?.totalConfigs ?? "-"} />
          <Metric label="النشطة" value={diagnostics?.activeConfigs ?? "-"} />
          <Metric label="مصادر مفقودة" value={diagnostics?.missingSources ?? "-"} />
          <Metric label="روابط غير صحيحة" value={diagnostics?.invalidRelations ?? "-"} />
          <Metric label="مفاتيح مكررة" value={diagnostics?.duplicateKeys ?? "-"} />
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <DetailBlock
            title="حالة الإعداد"
            items={[
              ["مصدر الحقيقة", state?.configsAuthoritative ? "الإعدادات الحالية" : "الرجوع القديم"],
              ["حالة النقل", state?.backfillStatus ?? "-"],
              ["خطر إعداد جزئي", state?.partialConfigRisk ? "نعم" : "لا"],
              ["الرجوع القديم", state?.legacyFallbackActive ? "مفعل" : "غير مفعل"],
            ]}
          />
          <DetailBlock
            title="المفاتيح المعروفة"
            items={[
              ["المعروفة", formatList(state?.knownKeys)],
              ["المعدة", formatList(state?.configuredKnownKeys)],
              ["الناقصة", formatList(state?.missingConfigKeys)],
            ]}
          />
          <DetailBlock
            title="قاعدة مهمة"
            items={[
              ["عند عدم وجود إعدادات", "قد يعمل الرجوع القديم"],
              ["عند وجود أي إعداد", "تصبح الإعدادات مصدر الحقيقة"],
              ["الإنتاج", "لا يسمح بإعداد جزئي"],
            ]}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FiltersCard({
  filters,
  onChange,
}: {
  filters: ListFilters;
  onChange: (filters: ListFilters) => void;
}) {
  function update(next: Partial<ListFilters>) {
    onChange({ ...filters, ...next, page: next.page ?? 1 });
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="size-4" />
          التصفية والبحث
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        <div className="space-y-2 xl:col-span-2">
          <Label htmlFor="premium-search">بحث</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="premium-search"
              value={filters.q}
              onChange={(event) => update({ q: event.target.value })}
              className="pr-9"
              placeholder="اسم، مفتاح، أو مصدر"
            />
          </div>
        </div>
        <SelectField
          label="الحالة"
          value={filters.status}
          onValueChange={(status) => update({ status })}
          options={[
            ["all", "الكل"],
            ["active", "نشط"],
            ["archived", "مؤرشف"],
          ]}
        />
        <SelectField
          label="مفعل"
          value={filters.isEnabled}
          onValueChange={(isEnabled) => update({ isEnabled })}
          options={[
            ["all", "الكل"],
            ["true", "مفعل"],
            ["false", "معطل"],
          ]}
        />
        <SelectField
          label="ظاهر"
          value={filters.isVisible}
          onValueChange={(isVisible) => update({ isVisible })}
          options={[
            ["all", "الكل"],
            ["true", "ظاهر"],
            ["false", "مخفي"],
          ]}
        />
        <SelectField
          label="مصدر العنصر"
          value={filters.sourceType}
          onValueChange={(sourceType) => update({ sourceType })}
          options={[
            ["all", "الكل"],
            ["menu_option", "خيار منيو"],
            ["menu_product", "منتج منيو"],
          ]}
        />
        <SelectField
          label="نوع الترقية"
          value={filters.selectionType}
          onValueChange={(selectionType) => update({ selectionType })}
          options={[
            ["all", "الكل"],
            ["premium_meal", "بروتين مميز"],
            ["premium_large_salad", "سلطة كبيرة مميزة"],
          ]}
        />
      </CardContent>
    </Card>
  );
}

function UpgradesTable({
  rows,
  loading,
  filters,
  total,
  totalPages,
  onPageChange,
  onEdit,
  onArchive,
  onChanged,
}: {
  rows: PremiumUpgradeConfigDto[];
  loading: boolean;
  filters: ListFilters;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (row: PremiumUpgradeConfigDto) => void;
  onArchive: (row: PremiumUpgradeConfigDto) => void;
  onChanged: () => void;
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
        <div className="md:hidden">
          {loading ? (
            <div className="rounded-lg border bg-muted/20 p-5 text-center text-sm text-muted-foreground">
              جار تحميل الترقيات...
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border bg-muted/20 p-5 text-center text-sm text-muted-foreground">
              لا توجد ترقيات مطابقة للتصفية الحالية.
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <PremiumUpgradeMobileCard
                  key={row.id}
                  row={row}
                  onEdit={() => onEdit(row)}
                  onArchive={() => onArchive(row)}
                  onChanged={onChanged}
                />
              ))}
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العنصر</TableHead>
                <TableHead className="text-right">المفتاح</TableHead>
                <TableHead className="text-right">النوع</TableHead>
                <TableHead className="text-right">المصدر</TableHead>
                <TableHead className="text-right">فرق السعر</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">صالح</TableHead>
                <TableHead className="text-right">الترتيب</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-28 text-center text-muted-foreground"
                  >
                    جار تحميل الترقيات...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-28 text-center text-muted-foreground"
                  >
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
                    onChanged={onChanged}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
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

function PremiumUpgradeMobileCard({
  row,
  onEdit,
  onArchive,
  onChanged,
}: {
  row: PremiumUpgradeConfigDto;
  onEdit: () => void;
  onArchive: () => void;
  onChanged: () => void;
}) {
  const stateMutation = useStateMutation(onChanged);
  const pending = stateMutation.isPending || row.status === "archived";

  return (
    <article className="space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">{nameAr(row.sourceName)}</h3>
          <p className="text-sm text-muted-foreground">{row.sourceName.en || row.sourceKey}</p>
        </div>
        <Badge variant={row.status === "active" ? "default" : "secondary"}>
          {row.status === "active" ? "نشط" : "مؤرشف"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <ReadOnlyItem label="المفتاح" value={row.premiumKey} />
        <ReadOnlyItem label="فرق السعر" value={formatSar(row.upgradeDeltaSar)} />
        <ReadOnlyItem label="نوع الترقية" value={selectionTypeLabel(row.selectionType)} />
        <ReadOnlyItem label="مصدر العنصر" value={sourceTypeLabel(row.sourceType)} />
        <ReadOnlyItem label="مجموعة المصدر" value={row.sourceGroupKey || row.sourceGroupId || row.sourceProductId || row.sourceId} />
        <ReadOnlyItem label="الترتيب" value={row.sortOrder} />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/20 p-3">
        <ToggleLine
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
        <ToggleLine
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
        <ValidationBadge row={row} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={row.status === "archived"}
          onClick={onEdit}
        >
          <Pencil data-icon="inline-start" />
          تعديل
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={row.status === "archived"}
          onClick={onArchive}
        >
          <Archive data-icon="inline-start" />
          أرشفة
        </Button>
      </div>
    </article>
  );
}

function PremiumUpgradeRow({
  row,
  onEdit,
  onArchive,
  onChanged,
}: {
  row: PremiumUpgradeConfigDto;
  onEdit: () => void;
  onArchive: () => void;
  onChanged: () => void;
}) {
  const stateMutation = useStateMutation(onChanged);
  const pending = stateMutation.isPending || row.status === "archived";

  return (
    <TableRow>
      <TableCell>
        <div className="min-w-[180px]">
          <p className="font-medium">{nameAr(row.sourceName)}</p>
          <p className="text-xs text-muted-foreground">{row.sourceName.en || row.sourceKey}</p>
        </div>
      </TableCell>
      <TableCell>
        <code className="rounded bg-muted px-2 py-1 text-xs">{row.premiumKey}</code>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{selectionTypeLabel(row.selectionType)}</Badge>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <Badge variant="secondary">{sourceTypeLabel(row.sourceType)}</Badge>
          <p className="max-w-[220px] truncate text-xs text-muted-foreground">
            {row.sourceGroupKey || row.sourceGroupId || row.sourceProductId || row.sourceId}
          </p>
        </div>
      </TableCell>
      <TableCell className="font-medium">{formatSar(row.upgradeDeltaSar)}</TableCell>
      <TableCell>
        <div className="flex min-w-[150px] flex-col gap-2">
          <Badge variant={row.status === "active" ? "default" : "secondary"}>
            {row.status === "active" ? "نشط" : "مؤرشف"}
          </Badge>
          <ToggleLine
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
          <ToggleLine
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
      </TableCell>
      <TableCell>
        <ValidationBadge row={row} />
      </TableCell>
      <TableCell>{row.sortOrder}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
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
      </TableCell>
    </TableRow>
  );
}

function CandidateDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [filters, setFilters] =
    useState<CandidateFilters>(defaultCandidateFilters);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({
    displayGroupKey: "premium_proteins",
    upgradeDeltaSarInput: "0",
    isEnabled: true,
    isVisible: true,
    sortOrder: "10",
  });

  const candidatesQuery = useQuery({
    queryKey: [CANDIDATES_QUERY_KEY, filters, open],
    queryFn: () => listCandidates(filters),
    enabled: open,
  });

  const candidates = candidatesQuery.data?.data ?? [];
  const selected = candidates.find((candidate) => candidate.id === selectedId);
  const createMutation = useCreateMutation(onCreated);

  function chooseCandidate(candidateId: string) {
    const candidate = candidates.find((item) => item.id === candidateId);
    setSelectedId(candidateId);
    if (!candidate) return;
    setForm((current) => ({
      ...current,
      displayGroupKey:
        candidate.selectionType === "premium_large_salad"
          ? "premium_salads"
          : "premium_proteins",
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
    const delta = Math.round(Number(form.upgradeDeltaSarInput) * 100);
    if (!Number.isFinite(delta) || delta < 0) {
      toast.error("فرق سعر الترقية يجب أن يكون رقما غير سالب.");
      return;
    }
    createMutation.mutate({
      sourceType: selected.sourceType,
      sourceId: selected.sourceId,
      sourceProductId: selected.sourceProductId,
      sourceGroupId: selected.sourceGroupId,
      selectionType: selected.selectionType,
      displayGroupKey: form.displayGroupKey,
      upgradeDeltaHalala: delta,
      isEnabled: form.isEnabled,
      isVisible: form.isVisible,
      sortOrder: Number(form.sortOrder),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[88dvh] w-[calc(100%-1.5rem)] max-w-4xl overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>ربط عنصر من المنيو كترقية مميزة</DialogTitle>
          <DialogDescription>
            اختر عنصرا موجودا ومؤهلا فقط. هذه العملية لا تنشئ منتجا أو خيارا
            جديدا.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={submit}>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label>بحث في العناصر</Label>
              <Input
                value={filters.q}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    q: event.target.value,
                    page: 1,
                  }))
                }
                placeholder="اسم أو مفتاح"
              />
            </div>
            <SelectField
              label="نوع المصدر"
              value={filters.sourceType}
              onValueChange={(sourceType) =>
                setFilters((current) => ({ ...current, sourceType, page: 1 }))
              }
              options={[
                ["all", "الكل"],
                ["menu_option", "خيار منيو"],
                ["menu_product", "منتج منيو"],
              ]}
            />
            <SelectField
              label="نوع الترقية"
              value={filters.selectionType}
              onValueChange={(selectionType) =>
                setFilters((current) => ({
                  ...current,
                  selectionType,
                  page: 1,
                }))
              }
              options={[
                ["all", "الكل"],
                ["premium_meal", "بروتين مميز"],
                ["premium_large_salad", "سلطة كبيرة مميزة"],
              ]}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
            <div>
              <p className="text-sm font-medium">إظهار العناصر المربوطة مسبقا</p>
              <p className="text-xs text-muted-foreground">
                مفيد للمراجعة فقط، ولا يمكن إنشاء ربط مكرر.
              </p>
            </div>
            <Switch
              checked={filters.includeLinked}
              onCheckedChange={(includeLinked) =>
                setFilters((current) => ({ ...current, includeLinked, page: 1 }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>العنصر المراد ربطه</Label>
            <Select value={selectedId} onValueChange={chooseCandidate}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="اختر عنصرا مؤهلا من المنيو" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem
                    key={candidate.id}
                    value={candidate.id}
                    disabled={
                      candidate.isLinked ||
                      !candidate.eligibilityDiagnostics.eligible
                    }
                  >
                    {candidateOptionLabel(candidate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {candidatesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">جار تحميل العناصر...</p>
            ) : candidates.length === 0 ? (
              <p className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                لا توجد عناصر مؤهلة غير مربوطة. فعّل خيار إظهار العناصر المربوطة
                لمراجعتها.
              </p>
            ) : null}
            {selected ? <CandidateSummary candidate={selected} /> : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SelectField
              label="مجموعة العرض"
              value={form.displayGroupKey}
              onValueChange={(displayGroupKey) =>
                setForm((current) => ({ ...current, displayGroupKey }))
              }
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
              onChange={(upgradeDeltaSarInput) =>
                setForm((current) => ({ ...current, upgradeDeltaSarInput }))
              }
            />
            <NumberField
              label="الترتيب"
              value={form.sortOrder}
              step="1"
              onChange={(sortOrder) =>
                setForm((current) => ({ ...current, sortOrder }))
              }
            />
            <div className="flex items-end gap-4 pb-2">
              <ToggleLine
                label="مفعل"
                checked={form.isEnabled}
                onCheckedChange={(isEnabled) =>
                  setForm((current) => ({ ...current, isEnabled }))
                }
              />
              <ToggleLine
                label="ظاهر"
                checked={form.isVisible}
                onCheckedChange={(isVisible) =>
                  setForm((current) => ({ ...current, isVisible }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button type="submit" disabled={createMutation.isPending}>
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

function EditDialog({
  row,
  onClose,
  onSaved,
}: {
  row: PremiumUpgradeConfigDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    displayGroupKey: row?.displayGroup.key ?? "premium_proteins",
    upgradeDeltaSarInput: String(row?.upgradeDeltaSar ?? 0),
    sortOrder: String(row?.sortOrder ?? 0),
  });
  const updateMutation = useUpdateMutation(onSaved);

  useEffect(() => {
    if (!row) return;
    setForm({
      displayGroupKey: row.displayGroup.key ?? "premium_proteins",
      upgradeDeltaSarInput: String(row.upgradeDeltaSar ?? 0),
      sortOrder: String(row.sortOrder ?? 0),
    });
  }, [row]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!row) return;
    const delta = Math.round(Number(form.upgradeDeltaSarInput) * 100);
    if (!Number.isFinite(delta) || delta < 0) {
      toast.error("فرق سعر الترقية يجب أن يكون رقما غير سالب.");
      return;
    }
    updateMutation.mutate({
      id: row.id,
      payload: {
        expectedRevision: row.revision,
        displayGroupKey: form.displayGroupKey,
        upgradeDeltaHalala: delta,
        sortOrder: Number(form.sortOrder),
      },
    });
  }

  return (
    <Dialog open={Boolean(row)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل فرق السعر والعرض</DialogTitle>
          <DialogDescription>
            يمكن تعديل فرق سعر الترقية ومجموعة العرض والترتيب فقط. بيانات المصدر
            الأصلية للقراءة فقط.
          </DialogDescription>
        </DialogHeader>
        {row ? (
          <form className="space-y-5" onSubmit={submit}>
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-2">
              <ReadOnlyItem label="العنصر" value={nameAr(row.sourceName)} />
              <ReadOnlyItem label="مفتاح الترقية" value={row.premiumKey} />
              <ReadOnlyItem label="نوع الترقية" value={selectionTypeLabel(row.selectionType)} />
              <ReadOnlyItem label="مصدر العنصر" value={sourceTypeLabel(row.sourceType)} />
              <ReadOnlyItem label="المراجعة الحالية" value={row.revision} />
              <ReadOnlyItem label="الحالة" value={row.status === "active" ? "نشط" : "مؤرشف"} />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <SelectField
                label="مجموعة العرض"
                value={form.displayGroupKey}
                onValueChange={(displayGroupKey) =>
                  setForm((current) => ({ ...current, displayGroupKey }))
                }
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
                onChange={(upgradeDeltaSarInput) =>
                  setForm((current) => ({ ...current, upgradeDeltaSarInput }))
                }
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

            <DialogFooter className="gap-2 sm:justify-start">
              <Button type="submit" disabled={updateMutation.isPending}>
                حفظ التعديل
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ArchiveDialog({
  row,
  onClose,
  onArchived,
}: {
  row: PremiumUpgradeConfigDto | null;
  onClose: () => void;
  onArchived: () => void;
}) {
  const [reason, setReason] = useState("");
  const archiveMutation = useArchiveMutation(onArchived);

  useEffect(() => {
    setReason("");
  }, [row?.id]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!row) return;
    if (reason.trim().length < 3) {
      toast.error("اكتب سبب الأرشفة بوضوح.");
      return;
    }
    archiveMutation.mutate({
      id: row.id,
      payload: { expectedRevision: row.revision, reason: reason.trim() },
    });
  }

  return (
    <Dialog open={Boolean(row)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>أرشفة ترقية مميزة</DialogTitle>
          <DialogDescription>
            سيتم أرشفة الترقية فقط. لن يتم حذف عنصر المنيو أو أي سجلات تاريخية
            للعملاء.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="rounded-lg border bg-muted/20 p-3 text-sm">
            {row ? nameAr(row.sourceName) : ""}
          </div>
          <div className="space-y-2">
            <Label htmlFor="archive-reason">سبب الأرشفة</Label>
            <Textarea
              id="archive-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="مثال: لم يعد متاحا من المورد"
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="submit"
              variant="destructive"
              disabled={archiveMutation.isPending}
            >
              أرشفة
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function DetailBlock({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <div className="rounded-lg border p-3">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">
        {items.map(([label, value]) => (
          <div key={label} className="flex gap-2 text-sm">
            <span className="shrink-0 text-muted-foreground">{label}:</span>
            <span className="min-w-0 break-words">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
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

function ToggleLine({
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
      <Switch
        size="sm"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
      <span>{label}</span>
    </label>
  );
}

function ValidationBadge({ row }: { row: PremiumUpgradeConfigDto }) {
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
        <XCircle className="size-3" />
        يحتاج مراجعة
      </Badge>
      <p className="max-w-[220px] text-xs text-muted-foreground">
        {[...row.validation.errors, ...row.validation.warnings].join("، ")}
      </p>
    </div>
  );
}

function CandidateSummary({
  candidate,
}: {
  candidate: PremiumUpgradeCandidateDto;
}) {
  const eligible = candidate.eligibilityDiagnostics.eligible;
  return (
    <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 text-sm md:grid-cols-2">
      <ReadOnlyItem label="الاسم" value={nameAr(candidate.name)} />
      <ReadOnlyItem label="مفتاح الترقية" value={candidate.premiumKey} />
      <ReadOnlyItem label="نوع الترقية" value={selectionTypeLabel(candidate.selectionType)} />
      <ReadOnlyItem label="مصدر العنصر" value={sourceTypeLabel(candidate.sourceType)} />
      <ReadOnlyItem label="فرق السعر الحالي" value={formatSar(candidate.upgradeDeltaHalala / 100)} />
      <ReadOnlyItem
        label="الأهلية"
        value={
          candidate.isLinked
            ? "مربوط مسبقا"
            : eligible
              ? "مؤهل للربط"
              : candidate.eligibilityDiagnostics.issues.join("، ") || "غير مؤهل"
        }
      />
    </div>
  );
}

function ReadOnlyItem({
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

function useCreateMutation(onSuccess: () => void) {
  return useMutation({
    mutationFn: createPremiumUpgrade,
    onSuccess: () => {
      toast.success("تم ربط العنصر كترقية مميزة.");
      onSuccess();
    },
    onError: showPremiumError,
  });
}

function useUpdateMutation(onSuccess: () => void) {
  return useMutation({
    mutationFn: updatePremiumUpgrade,
    onSuccess: () => {
      toast.success("تم حفظ التعديل.");
      onSuccess();
    },
    onError: showPremiumError,
  });
}

function useStateMutation(onSuccess: () => void) {
  return useMutation({
    mutationFn: updatePremiumUpgradeState,
    onSuccess: () => {
      toast.success("تم تحديث الحالة.");
      onSuccess();
    },
    onError: showPremiumError,
  });
}

function useArchiveMutation(onSuccess: () => void) {
  return useMutation({
    mutationFn: archivePremiumUpgrade,
    onSuccess: () => {
      toast.success("تمت أرشفة الترقية.");
      onSuccess();
    },
    onError: showPremiumError,
  });
}

async function getReadiness(): Promise<ReadinessResponse> {
  const response = await api.get("/api/dashboard/premium-upgrades/readiness");
  return response.data;
}

async function listPremiumUpgrades(
  filters: ListFilters
): Promise<ListResponse<PremiumUpgradeConfigDto>> {
  const response = await api.get("/api/dashboard/premium-upgrades", {
    params: buildListParams(filters),
  });
  return response.data;
}

async function listCandidates(
  filters: CandidateFilters
): Promise<ListResponse<PremiumUpgradeCandidateDto>> {
  const response = await api.get("/api/dashboard/premium-upgrades/candidates", {
    params: buildCandidateParams(filters),
  });
  return response.data;
}

async function createPremiumUpgrade(payload: {
  sourceType: SourceType;
  sourceId: string;
  sourceProductId: string | null;
  sourceGroupId: string | null;
  selectionType: SelectionType;
  displayGroupKey: string;
  upgradeDeltaHalala: number;
  isEnabled: boolean;
  isVisible: boolean;
  sortOrder: number;
}): Promise<SingleResponse<PremiumUpgradeConfigDto>> {
  const response = await api.post("/api/dashboard/premium-upgrades", payload);
  return response.data;
}

async function updatePremiumUpgrade({
  id,
  payload,
}: {
  id: string;
  payload: {
    expectedRevision: number;
    displayGroupKey?: string;
    upgradeDeltaHalala?: number;
    sortOrder?: number;
  };
}): Promise<SingleResponse<PremiumUpgradeConfigDto>> {
  const response = await api.patch(
    `/api/dashboard/premium-upgrades/${id}`,
    payload
  );
  return response.data;
}

async function updatePremiumUpgradeState({
  id,
  payload,
}: {
  id: string;
  payload: {
    expectedRevision: number;
    isEnabled?: boolean;
    isVisible?: boolean;
  };
}): Promise<SingleResponse<PremiumUpgradeConfigDto>> {
  const response = await api.patch(
    `/api/dashboard/premium-upgrades/${id}/state`,
    payload
  );
  return response.data;
}

async function archivePremiumUpgrade({
  id,
  payload,
}: {
  id: string;
  payload: { expectedRevision: number; reason: string };
}): Promise<SingleResponse<PremiumUpgradeConfigDto>> {
  const response = await api.post(
    `/api/dashboard/premium-upgrades/${id}/archive`,
    payload
  );
  return response.data;
}

function buildListParams(filters: ListFilters) {
  const params: Record<string, string | number | boolean> = {
    page: filters.page,
    limit: filters.limit,
  };
  if (filters.q.trim()) params.q = filters.q.trim();
  if (filters.status !== "all") params.status = filters.status;
  if (filters.isEnabled !== "all")
    params.isEnabled = filters.isEnabled === "true";
  if (filters.isVisible !== "all")
    params.isVisible = filters.isVisible === "true";
  if (filters.sourceType !== "all") params.sourceType = filters.sourceType;
  if (filters.selectionType !== "all")
    params.selectionType = filters.selectionType;
  return params;
}

function buildCandidateParams(filters: CandidateFilters) {
  const params: Record<string, string | number | boolean> = {
    page: filters.page,
    limit: filters.limit,
    includeLinked: filters.includeLinked,
  };
  if (filters.q.trim()) params.q = filters.q.trim();
  if (filters.sourceType !== "all") params.sourceType = filters.sourceType;
  if (filters.selectionType !== "all")
    params.selectionType = filters.selectionType;
  return params;
}

function getReadinessBanner(readiness: ReadinessResponse | null) {
  const diagnostics = readiness?.diagnostics;
  const state = diagnostics?.configState;
  const baseClass = "rounded-lg border p-3 text-sm";

  if (!readiness) {
    return {
      tone: "info",
      message: "جار تحميل فحص الجاهزية...",
      className: `${baseClass} bg-muted/20 text-muted-foreground`,
    };
  }
  if (state?.partialConfigRisk || (diagnostics?.duplicateKeys ?? 0) > 0) {
    return {
      tone: "critical",
      message:
        "يوجد خطر إعداد جزئي أو مفاتيح مكررة. لا تنشر قبل إكمال كل المفاتيح المعروفة.",
      className: `${baseClass} border-red-200 bg-red-50 text-red-900`,
    };
  }
  if ((diagnostics?.missingSources ?? 0) > 0 || (diagnostics?.invalidRelations ?? 0) > 0) {
    return {
      tone: "warning",
      message: "بعض مصادر الترقيات مفقودة أو روابطها غير صحيحة.",
      className: `${baseClass} border-amber-200 bg-amber-50 text-amber-950`,
    };
  }
  if ((diagnostics?.priceMismatches?.length ?? 0) > 0) {
    return {
      tone: "warning",
      message: "يوجد اختلاف بين أسعار الرجوع القديم وإعدادات الترقيات الحالية.",
      className: `${baseClass} border-amber-200 bg-amber-50 text-amber-950`,
    };
  }
  if (state?.isEmpty && state.legacyFallbackActive) {
    return {
      tone: "info",
      message: "لا توجد إعدادات بعد. الرجوع القديم مفعل مؤقتا.",
      className: `${baseClass} border-blue-200 bg-blue-50 text-blue-950`,
    };
  }
  if (readiness.isReady && !state?.partialConfigRisk) {
    return {
      tone: "success",
      message: "نظام الترقيات المميزة جاهز.",
      className: `${baseClass} border-emerald-200 bg-emerald-50 text-emerald-900`,
    };
  }
  return {
    tone: "info",
    message: "راجع تفاصيل الجاهزية قبل استخدام الشاشة في الإنتاج.",
    className: `${baseClass} border-blue-200 bg-blue-50 text-blue-950`,
  };
}

function showPremiumError(error: unknown) {
  const code = getApiErrorCode(error);
  toast.error(
    (code && errorMessages[code]) ||
      getErrorMessage(error) ||
      "حدث خطأ غير متوقع. حدّث الصفحة وحاول مرة أخرى."
  );
}

function getApiErrorCode(error: unknown): string | null {
  const response = (error as { response?: { data?: unknown } })?.response?.data;
  const data = response as {
    code?: string;
    error?: { code?: string };
    data?: { code?: string };
    errors?: Array<{ code?: string }>;
  };
  return (
    data?.code ||
    data?.error?.code ||
    data?.data?.code ||
    data?.errors?.[0]?.code ||
    null
  );
}

function getErrorMessage(error: unknown): string | null {
  return (
    (error as { normalizedMessage?: string })?.normalizedMessage ||
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ||
    null
  );
}

function nameAr(name: LocalizedName) {
  return name.ar || name.en || "بدون اسم";
}

function selectionTypeLabel(value: SelectionType) {
  return value === "premium_large_salad" ? "سلطة كبيرة مميزة" : "بروتين مميز";
}

function sourceTypeLabel(value: SourceType) {
  return value === "menu_product" ? "منتج منيو" : "خيار منيو";
}

function formatSar(value: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatList(values?: string[]) {
  return values?.length ? values.join("، ") : "-";
}

function candidateOptionLabel(candidate: PremiumUpgradeCandidateDto) {
  const state = candidate.isLinked
    ? "مربوط مسبقا"
    : candidate.eligibilityDiagnostics.eligible
      ? "مؤهل"
      : "غير مؤهل";
  return `${nameAr(candidate.name)} / ${candidate.name.en || candidate.key} - ${sourceTypeLabel(candidate.sourceType)} - ${selectionTypeLabel(candidate.selectionType)} - ${state}`;
}
