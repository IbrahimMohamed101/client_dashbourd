import { toast } from "sonner";

import api from "@/lib/apis";
import { halalaToRiyal, riyalToHalala } from "@/utils/price";
import type {
  PremiumUpgradeArchivePayload,
  PremiumUpgradeConfigDto,
  PremiumUpgradeCreatePayload,
  PremiumUpgradeHealth,
  PremiumUpgradeKind,
  PremiumUpgradeListFilters,
  PremiumUpgradeListResponse,
  PremiumUpgradeReadinessResponse,
  PremiumUpgradeSingleResponse,
  PremiumUpgradeSourceDto,
  PremiumUpgradeSourceFilters,
  PremiumUpgradeStatus,
  PremiumUpgradeUpdatePayload,
} from "@/types/premiumUpgradeTypes";

export const PREMIUM_UPGRADES_LIST_QUERY_KEY = "premium-upgrades.list";
export const PREMIUM_UPGRADES_READINESS_QUERY_KEY =
  "premium-upgrades.readiness";
export const PREMIUM_UPGRADES_SOURCES_QUERY_KEY = "premium-upgrades.sources";
export const PREMIUM_UPGRADES_DETAIL_QUERY_KEY = "premium-upgrades.detail";

export const defaultPremiumUpgradeListFilters: PremiumUpgradeListFilters = {
  q: "",
  kind: "all",
  status: "all",
  health: "all",
  page: 1,
  limit: 20,
};

export const defaultPremiumUpgradeSourceFilters: PremiumUpgradeSourceFilters = {
  q: "",
  kind: "product",
  status: "active",
  page: 1,
  limit: 50,
};

const premiumErrorMessages: Record<string, string> = {
  PREMIUM_UPGRADE_INVALID_SOURCE_ID:
    "معرف المصدر غير صحيح. حدّث قائمة المصادر وحاول مرة أخرى.",
  PREMIUM_UPGRADE_SOURCE_NOT_FOUND: "المصدر المحدد لم يعد موجودا.",
  PREMIUM_UPGRADE_SOURCE_NOT_ELIGIBLE:
    "هذا المصدر غير مؤهل ليكون ترقية مميزة.",
  PREMIUM_UPGRADE_RELATION_INVALID: "ربط المصدر غير صحيح أو غير مكتمل.",
  PREMIUM_UPGRADE_DUPLICATE: "هذا المصدر مربوط مسبقا كترقية مميزة.",
  PREMIUM_UPGRADE_KEY_CONFLICT: "مفتاح الترقية المميزة مستخدم مسبقا.",
  PREMIUM_UPGRADE_INVALID_DELTA:
    "سعر الترقية يجب أن يكون رقما صحيحا وغير سالب.",
  PREMIUM_UPGRADE_REVISION_CONFLICT:
    "تم تعديل هذا العنصر بواسطة مدير آخر. حدّث البيانات وحاول مرة أخرى.",
  PREMIUM_UPGRADE_ARCHIVED: "هذه الترقية مؤرشفة ولا تقبل هذا الإجراء.",
};

export async function fetchPremiumUpgradeReadiness(): Promise<PremiumUpgradeReadinessResponse> {
  const response = await api.get("/api/dashboard/premium-upgrades/readiness");
  return response.data;
}

export async function fetchPremiumUpgrades(
  filters: PremiumUpgradeListFilters
): Promise<PremiumUpgradeListResponse<PremiumUpgradeConfigDto>> {
  const response = await api.get("/api/dashboard/premium-upgrades", {
    params: buildListParams(filters),
  });
  return response.data;
}

export async function fetchPremiumUpgradeSources(
  filters: PremiumUpgradeSourceFilters
): Promise<PremiumUpgradeListResponse<PremiumUpgradeSourceDto>> {
  const response = await api.get("/api/dashboard/premium-upgrades/sources", {
    params: buildSourceParams(filters),
  });
  return response.data;
}

export async function fetchPremiumUpgradeDetail(
  id: string
): Promise<PremiumUpgradeSingleResponse<PremiumUpgradeConfigDto>> {
  const response = await api.get(`/api/dashboard/premium-upgrades/${id}`);
  return response.data;
}

export async function createPremiumUpgrade(
  payload: PremiumUpgradeCreatePayload
): Promise<PremiumUpgradeSingleResponse<PremiumUpgradeConfigDto>> {
  const response = await api.post("/api/dashboard/premium-upgrades", payload);
  return response.data;
}

export async function updatePremiumUpgrade({
  id,
  payload,
}: {
  id: string;
  payload: PremiumUpgradeUpdatePayload;
}): Promise<PremiumUpgradeSingleResponse<PremiumUpgradeConfigDto>> {
  const response = await api.patch(
    `/api/dashboard/premium-upgrades/${id}`,
    payload
  );
  return response.data;
}

export async function archivePremiumUpgrade({
  id,
  payload,
}: {
  id: string;
  payload: PremiumUpgradeArchivePayload;
}): Promise<PremiumUpgradeSingleResponse<PremiumUpgradeConfigDto>> {
  const response = await api.post(
    `/api/dashboard/premium-upgrades/${id}/archive`,
    payload
  );
  return response.data;
}

export function buildCreatePremiumUpgradePayload(form: {
  kind: PremiumUpgradeKind;
  sourceId: string;
  upgradePriceSarInput: string;
  currency: "SAR";
  isActive: boolean;
  isVisible: boolean;
  sortOrder: string;
}): PremiumUpgradeCreatePayload {
  return {
    kind: form.kind,
    sourceId: form.sourceId,
    upgradeDeltaHalala: riyalToHalala(form.upgradePriceSarInput),
    currency: form.currency,
    isActive: Boolean(form.isActive),
    isVisible: Boolean(form.isVisible),
    sortOrder: Number(form.sortOrder),
  };
}

export function showPremiumUpgradeError(error: unknown) {
  const code = getPremiumUpgradeErrorCode(error);
  toast.error(
    (code && premiumErrorMessages[code]) ||
      getApiErrorMessage(error) ||
      "حدث خطأ غير متوقع. حدّث البيانات وحاول مرة أخرى."
  );
}

export function getPremiumUpgradeErrorCode(error: unknown): string | null {
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

export function premiumDisplayName(
  value?: string | { ar?: string | null; en?: string | null } | null
) {
  if (typeof value === "string") return value || "بدون اسم";
  return value?.ar || value?.en || "بدون اسم";
}

export function premiumRowName(row: PremiumUpgradeConfigDto) {
  return premiumDisplayName(row.name ?? row.sourceName ?? null);
}

export function premiumRowKey(row: PremiumUpgradeConfigDto) {
  return row.key || row.premiumKey || row.sourceKey || "-";
}

export function premiumRowKind(row: PremiumUpgradeConfigDto): PremiumUpgradeKind {
  if (row.kind === "product" || row.sourceType === "menu_product") {
    return "product";
  }
  return "option";
}

export function premiumKindLabel(value: PremiumUpgradeKind | string) {
  return value === "product" ? "منتج كامل" : "خيار داخل وجبة";
}

export function premiumStatusLabel(value?: PremiumUpgradeStatus | string | null) {
  switch (value) {
    case "hidden":
      return "مخفي";
    case "disabled":
      return "متوقف";
    case "archived":
      return "مؤرشف";
    default:
      return "نشط";
  }
}

export function premiumHealthLabel(value?: PremiumUpgradeHealth | string | null) {
  return value === "broken" ? "يحتاج إصلاح" : "جاهز";
}

export function premiumIssueMessage(issueCode?: string | null) {
  switch (issueCode) {
    case "SOURCE_NOT_FOUND":
      return "المصدر المرتبط غير موجود";
    case "SOURCE_RELATION_INVALID":
      return "ربط المصدر غير صحيح";
    case "SOURCE_NOT_SELECTABLE":
      return "المصدر غير متاح للاشتراكات";
    default:
      return "يحتاج إلى إعادة ربط بمصدر صالح";
  }
}

export function premiumRowHealth(row: PremiumUpgradeConfigDto): PremiumUpgradeHealth {
  if (row.health === "ready" || row.health === "broken") return row.health;
  if (row.validation && row.validation.valid === false) return "broken";
  return "ready";
}

export function premiumRowStatus(row: PremiumUpgradeConfigDto): string {
  if (row.status) return row.status;
  if (row.isEnabled === false) return "disabled";
  if (row.isVisible === false) return "hidden";
  return "active";
}

export function premiumPriceHalala(row: PremiumUpgradeConfigDto) {
  return Number(
    row.priceHalala ?? row.upgradeDeltaHalala ?? halalaFromSar(row.priceSar)
  );
}

export function premiumPriceSar(row: PremiumUpgradeConfigDto) {
  if (row.priceSar !== null && row.priceSar !== undefined) {
    return Number(row.priceSar);
  }
  if (row.upgradeDeltaSar !== null && row.upgradeDeltaSar !== undefined) {
    return Number(row.upgradeDeltaSar);
  }
  return halalaToRiyal(row.priceHalala ?? row.upgradeDeltaHalala ?? 0);
}

export function formatPremiumSar(value: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPremiumList(values?: string[]) {
  return values?.length ? values.join("، ") : "-";
}

export function formatJsonValue(value: unknown) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value || "-";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value, null, 2);
}

function buildListParams(filters: PremiumUpgradeListFilters) {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
  };
  if (filters.q.trim()) params.q = filters.q.trim();
  if (filters.kind !== "all") params.kind = filters.kind;
  if (filters.status !== "all") params.status = filters.status;
  if (filters.health !== "all") params.health = filters.health;
  return params;
}

function buildSourceParams(filters: PremiumUpgradeSourceFilters) {
  const params: Record<string, string | number> = {
    page: filters.page,
    limit: filters.limit,
    status: filters.status,
  };
  if (filters.q.trim()) params.q = filters.q.trim();
  if (filters.kind !== "all") params.kind = filters.kind;
  return params;
}

function halalaFromSar(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function getApiErrorMessage(error: unknown): string | null {
  return (
    (error as { normalizedMessage?: string })?.normalizedMessage ||
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ||
    null
  );
}
