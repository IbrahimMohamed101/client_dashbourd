import { createFileRoute } from "@tanstack/react-router";
import { ClockIcon, MapPinIcon, StoreIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettingsQuery } from "@/hooks/useSettingsQuery";

type PickupBranch = {
  id?: string;
  branchId?: string;
  pickupLocationId?: string;
  code?: string;
  slug?: string;
  key?: string;
  name?: unknown;
  label?: unknown;
  branchName?: unknown;
  address?: unknown;
  phone?: unknown;
  phoneNumber?: unknown;
  pickupWindows?: unknown;
  pickup_windows?: unknown;
  windows?: unknown;
  isActive?: boolean;
  active?: boolean;
  isAvailable?: boolean;
  pickupAvailable?: boolean;
  [key: string]: unknown;
};

const normalizeBranches = (value: unknown): PickupBranch[] => {
  if (Array.isArray(value)) return value as PickupBranch[];
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(
      ([key, branch]) =>
        branch && typeof branch === "object"
          ? ({ key, ...(branch as PickupBranch) } as PickupBranch)
          : { key, name: String(branch ?? key) }
    );
  }
  return [];
};

const detailLabels: Record<string, string> = {
  key: "المفتاح",
  id: "المعرف",
  branchId: "كود الفرع",
  pickupLocationId: "كود موقع الاستلام",
  code: "الكود",
  slug: "الرابط المختصر",
  city: "المدينة",
  area: "المنطقة",
  district: "الحي",
  zone: "النطاق",
  phone: "الهاتف",
  phoneNumber: "رقم الهاتف",
  email: "البريد الإلكتروني",
  timezone: "المنطقة الزمنية",
  notes: "ملاحظات",
  description: "الوصف",
};

const hiddenDetailKeys = new Set([
  "name",
  "label",
  "branchName",
  "address",
  "pickupWindows",
  "pickup_windows",
  "windows",
  "isActive",
  "active",
  "isAvailable",
  "pickupAvailable",
]);

const getLocalizedText = (value: unknown): string => {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "نعم" : "لا";
  if (Array.isArray(value)) {
    return value.map(getLocalizedText).filter(Boolean).join("، ");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const localized =
      record.ar ??
      record.arabic ??
      record.nameAr ??
      record.name_ar ??
      record.en ??
      record.english ??
      record.nameEn ??
      record.name_en;
    if (localized) return getLocalizedText(localized);

    return Object.entries(record)
      .map(([, item]) => getLocalizedText(item))
      .filter(Boolean)
      .join("، ");
  }
  return String(value);
};

const getBranchId = (branch: PickupBranch) =>
  branch.branchId ?? branch.pickupLocationId ?? branch.id ?? branch.key ?? branch.code ?? branch.slug;

const getBranchName = (branch: PickupBranch, index: number) =>
  getLocalizedText(
    branch.name ?? branch.label ?? branch.branchName ?? getBranchId(branch)
  ) || `فرع ${index + 1}`;

const getAddress = (branch: PickupBranch) => getLocalizedText(branch.address);

const getPickupWindows = (branch: PickupBranch) => {
  const windows = branch.pickupWindows ?? branch.pickup_windows ?? branch.windows;
  if (Array.isArray(windows)) return windows.map(getLocalizedText).filter(Boolean);
  const text = getLocalizedText(windows);
  return text ? [text] : [];
};

const isBranchActive = (branch: PickupBranch) =>
  branch.isActive ?? branch.active ?? branch.isAvailable ?? branch.pickupAvailable ?? true;

const getExtraDetails = (branch: PickupBranch) =>
  Object.entries(branch)
    .filter(([key, value]) => !hiddenDetailKeys.has(key) && detailLabels[key] && getLocalizedText(value))
    .map(([key, value]) => ({
      label: detailLabels[key],
      value: getLocalizedText(value),
    }));

export const Route = createFileRoute("/_protected/pickup-branches/")({
  component: PickupBranchesPage,
});

function PickupBranchesPage() {
  const { data, isLoading, isError } = useSettingsQuery();
  const branches = normalizeBranches(data?.data?.pickup_locations);

  if (isLoading) {
    return (
      <div className="space-y-4 px-4 lg:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            تعذر تحميل فروع الاستلام.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 text-right lg:px-6" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            فروع الاستلام
          </h1>
          <p className="text-sm text-muted-foreground">
            مواقع الاستلام المسجلة في إعدادات لوحة التحكم للعرض فقط.
          </p>
        </div>
        <MapPinIcon className="size-6 text-muted-foreground" />
      </div>

      {branches.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            لا توجد فروع استلام مسجلة حالياً.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch, index) => {
            const branchId = getBranchId(branch);
            const address = getAddress(branch);
            const pickupWindows = getPickupWindows(branch);
            const extraDetails = getExtraDetails(branch);
            const active = isBranchActive(branch);

            return (
              <Card key={String(branchId ?? index)} className="overflow-hidden">
                <CardHeader className="space-y-3">
                  <CardTitle className="flex items-start justify-between gap-3 text-base">
                    <span className="flex items-center gap-2">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <StoreIcon className="size-5" />
                      </span>
                      <span>{getBranchName(branch, index)}</span>
                    </span>
                    <span
                      className={
                        active
                          ? "rounded-md bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700"
                          : "rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                      }
                    >
                      {active ? "نشط" : "غير نشط"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                    <Detail label="كود الفرع" value={branchId} />
                    <Detail label="العنوان" value={address || "غير محدد"} />
                    <Detail
                      label="الهاتف"
                      value={getLocalizedText(branch.phone ?? branch.phoneNumber) || "غير محدد"}
                    />
                  </div>

                  {pickupWindows.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ClockIcon className="size-4" />
                        <span>نوافذ الاستلام</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pickupWindows.map((window) => (
                          <span
                            key={window}
                            className="rounded-md border bg-background px-2 py-1 text-xs font-medium"
                          >
                            {window}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {extraDetails.length > 0 ? (
                    <div className="space-y-2 border-t pt-3">
                      {extraDetails.map((detail) => (
                        <Detail
                          key={`${detail.label}-${detail.value}`}
                          label={detail.label}
                          value={detail.value}
                        />
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: unknown }) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-left font-medium">{getLocalizedText(value)}</span>
    </div>
  );
}
