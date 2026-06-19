import api from "@/lib/apis";
import type {
  AddonPlanPrice,
  AddonPlanPricesResponse,
} from "@/types/addonTypes";

export type AddonPlanPricePayload = {
  addonPlanId: string;
  basePlanId: string;
  priceHalala: number;
  isActive?: boolean;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const extractRows = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (Array.isArray(record.data)) return record.data;
  const data = asRecord(record.data);
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.docs)) return data.docs;
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.rows)) return record.rows;
  return [];
};

const asNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizePriceRow = (value: unknown): AddonPlanPrice => {
  const row = asRecord(value);
  return {
    ...(row as Partial<AddonPlanPrice>),
    id: row.id === undefined ? undefined : String(row.id),
    _id: row._id === undefined ? undefined : String(row._id),
    addonPlanId: String(row.addonPlanId ?? ""),
    addonPlanName: asRecord(row.addonPlanName),
    category: row.category === undefined ? undefined : String(row.category),
    basePlanId: String(row.basePlanId ?? ""),
    basePlanName: asRecord(row.basePlanName),
    daysCount:
      row.daysCount === undefined ? undefined : asNumber(row.daysCount),
    mealsCount:
      row.mealsCount === undefined ? undefined : asNumber(row.mealsCount),
    priceHalala: asNumber(row.priceHalala),
    priceSar: row.priceSar === undefined ? undefined : asNumber(row.priceSar),
    priceLabel:
      row.priceLabel === undefined ? undefined : String(row.priceLabel),
    currency: row.currency === undefined ? undefined : String(row.currency),
    isActive: row.isActive !== false,
  };
};

export const fetchAddonPlanPrices =
  async (): Promise<AddonPlanPricesResponse> => {
    const response = await api.get("/api/dashboard/addon-prices");
    return {
      status: asRecord(response.data).status !== false,
      data: extractRows(response.data).map(normalizePriceRow),
    };
  };

export const createAddonPlanPrice = async (
  data: AddonPlanPricePayload
): Promise<{ status: boolean; data: AddonPlanPrice }> => {
  const response = await api.post("/api/dashboard/addon-prices", data);
  return response.data;
};

export const updateAddonPlanPrice = async (
  id: string,
  data: AddonPlanPricePayload
): Promise<{ status: boolean; data: AddonPlanPrice }> => {
  const response = await api.put(`/api/dashboard/addon-prices/${id}`, data);
  return response.data;
};

export const deleteAddonPlanPrice = async (id: string): Promise<void> => {
  await api.delete(`/api/dashboard/addon-prices/${id}`);
};

export const toggleAddonPlanPrice = async (
  id: string
): Promise<{ status: boolean; data: AddonPlanPrice }> => {
  const response = await api.patch(`/api/dashboard/addon-prices/${id}/toggle`);
  return response.data;
};
