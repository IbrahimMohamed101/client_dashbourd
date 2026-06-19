import api from "@/lib/apis";
import type {
  Addon,
  AddonPlanPricesResponse,
  AddonPlansResponse,
  AddonsResponse,
} from "@/types/addonTypes";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const asLocalized = (value: unknown) => {
  const record = asRecord(value);
  if (Object.keys(record).length > 0) {
    return {
      ar: String(record.ar ?? record.arabic ?? record.name_ar ?? ""),
      en: String(record.en ?? record.english ?? record.name_en ?? ""),
    };
  }

  return {
    ar: typeof value === "string" ? value : "",
    en: typeof value === "string" ? value : "",
  };
};

const asNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const extractItems = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;

  const record = asRecord(payload);
  if (Array.isArray(record.data)) return record.data;

  const data = asRecord(record.data);
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.docs)) return data.docs;
  if (Array.isArray(data.addons)) return data.addons;
  if (Array.isArray(data.rows)) return data.rows;

  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.docs)) return record.docs;
  if (Array.isArray(record.addons)) return record.addons;
  if (Array.isArray(record.rows)) return record.rows;

  return [];
};

const normalizeAddon = (value: unknown): Addon => {
  const addon = asRecord(value);
  const legacy = asRecord(addon.legacyCompatibility);
  const id = String(addon.id ?? addon._id ?? "");
  const name = asLocalized(addon.name);
  const description = asLocalized(addon.description);
  const priceHalala = asNumber(
    addon.priceHalala ?? legacy.priceHalala ?? addon.price_halala
  );

  return {
    ...(addon as Partial<Addon>),
    id,
    _id: String(addon._id ?? id),
    name,
    description,
    price: asNumber(addon.price ?? addon.priceSar ?? priceHalala / 100),
    priceHalala,
    category: String(addon.category ?? "addons"),
    currency: String(addon.currency ?? legacy.currency ?? "SAR"),
    type:
      addon.type === "subscription" || addon.kind === "plan"
        ? "subscription"
        : "one_time",
    imageUrl: String(addon.imageUrl ?? addon.image ?? ""),
    isActive: addon.isActive !== false,
    sortOrder: asNumber(addon.sortOrder),
    createdAt: String(addon.createdAt ?? ""),
    updatedAt: String(addon.updatedAt ?? ""),
  };
};

const normalizeAddonsResponse = (payload: unknown): AddonsResponse => ({
  status: asRecord(payload).status !== false,
  data: extractItems(payload).map(normalizeAddon),
});

export const fetchAddons = async (): Promise<AddonsResponse> => {
  const response = await api.get("/api/dashboard/addons");
  return normalizeAddonsResponse(response.data);
};

export const fetchAddonPlans = async (): Promise<AddonPlansResponse> => {
  const response = await api.get("/api/dashboard/addon-plans");
  return normalizeAddonsResponse(response.data);
};

export const fetchAddonPrices =
  async (): Promise<AddonPlanPricesResponse> => {
    const response = await api.get("/api/dashboard/addon-prices");
    return response.data;
  };

export const fetchAddonItems = async (): Promise<AddonsResponse> => {
  const response = await api.get("/api/dashboard/addon-items");
  return normalizeAddonsResponse(response.data);
};
