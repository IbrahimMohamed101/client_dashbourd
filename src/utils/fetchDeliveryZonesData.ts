import api from "@/lib/apis";
import { deliveryZoneToggleUrl } from "@/utils/deliveryZoneApiContract";
import type {
  CreateDeliveryZoneDTO,
  DeliveryZone,
  DeliveryZoneActionResponse,
  DeliveryZoneDetailResponse,
  DeliveryZonesResponse,
  UpdateDeliveryZoneDTO,
} from "@/types/deliveryZoneTypes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeZone(zone: unknown): DeliveryZone {
  const record = isRecord(zone) ? zone : {};
  const rawName = isRecord(record.name) ? record.name : {};
  const id = String(record._id ?? record.id ?? "");

  return {
    _id: id,
    id,
    name: {
      ar: typeof rawName.ar === "string" ? rawName.ar : "",
      en: typeof rawName.en === "string" ? rawName.en : "",
    },
    deliveryFeeHalala:
      typeof record.deliveryFeeHalala === "number" ? record.deliveryFeeHalala : 0,
    isActive: Boolean(record.isActive),
    sortOrder: typeof record.sortOrder === "number" ? record.sortOrder : 0,
    createdAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined,
  };
}

function normalizeZonesResponse(payload: unknown): DeliveryZonesResponse {
  const root = isRecord(payload) ? payload : {};
  const data = Array.isArray(root.data) ? root.data.map(normalizeZone) : [];
  const meta = isRecord(root.meta) ? root.meta : {};

  return {
    status: Boolean(root.status ?? true),
    data,
    meta: {
      filters: isRecord(meta.filters) ? meta.filters : {},
      totalCount:
        typeof meta.totalCount === "number" ? meta.totalCount : data.length,
    },
  };
}

function normalizeZoneDetailResponse(payload: unknown): DeliveryZoneDetailResponse {
  const root = isRecord(payload) ? payload : {};

  return {
    status: Boolean(root.status ?? true),
    data: normalizeZone(root.data),
  };
}

function normalizeZoneActionResponse(payload: unknown): DeliveryZoneActionResponse {
  const root = isRecord(payload) ? payload : {};
  const data = isRecord(root.data) ? root.data : root;

  return {
    id: String(data.id ?? data._id ?? ""),
    isActive: Boolean(data.isActive),
  };
}

export const fetchDeliveryZonesList = async ({
  q = "",
  isActive,
}: {
  q?: string;
  isActive?: boolean;
} = {}): Promise<DeliveryZonesResponse> => {
  const response = await api.get<unknown>("/api/dashboard/zones", {
    params: {
      q: q || undefined,
      isActive: typeof isActive === "boolean" ? isActive : undefined,
    },
  });

  return normalizeZonesResponse(response.data);
};

export const fetchDeliveryZoneById = async (
  id: string
): Promise<DeliveryZone> => {
  const response = await api.get<unknown>(`/api/dashboard/zones/${id}`);
  return normalizeZoneDetailResponse(response.data).data;
};

export const createDeliveryZone = async (
  data: CreateDeliveryZoneDTO
): Promise<DeliveryZone> => {
  const response = await api.post<unknown>("/api/dashboard/zones", data);
  return normalizeZoneDetailResponse(response.data).data;
};

export const updateDeliveryZone = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateDeliveryZoneDTO;
}): Promise<DeliveryZone> => {
  const response = await api.put<unknown>(`/api/dashboard/zones/${id}`, data);
  return normalizeZoneDetailResponse(response.data).data;
};

export const deleteDeliveryZone = async (
  id: string
): Promise<DeliveryZoneActionResponse> => {
  const response = await api.delete<unknown>(`/api/dashboard/zones/${id}`);
  return normalizeZoneActionResponse(response.data);
};

export const toggleDeliveryZone = async (
  id: string
): Promise<DeliveryZoneActionResponse> => {
  const response = await api.patch<unknown>(deliveryZoneToggleUrl(id));
  return normalizeZoneActionResponse(response.data);
};