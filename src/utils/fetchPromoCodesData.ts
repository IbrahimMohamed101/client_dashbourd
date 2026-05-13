import api from "@/lib/apis";
import type {
  PromoCodeDTO,
  PromoCodePayload,
  PromoCodesListResponse,
} from "@/types/financeTypes";

interface FetchPromoCodesListParams {
  page?: number;
  limit?: number;
  q?: string;
  includeDeleted?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

function readPromoCodes(value: unknown): PromoCodeDTO[] | null {
  return Array.isArray(value) ? (value as PromoCodeDTO[]) : null;
}

function normalizePromoCodesListResponse(payload: unknown): PromoCodesListResponse {
  const root = isRecord(payload) ? payload : {};
  const dataNode = isRecord(root.data) ? root.data : root;
  const nestedDataNode = isRecord(dataNode.data) ? dataNode.data : dataNode;
  const data =
    readPromoCodes(dataNode.items) ??
    readPromoCodes(dataNode.data) ??
    readPromoCodes(nestedDataNode.items) ??
    readPromoCodes(payload) ??
    [];
  const metaNode = isRecord(dataNode.meta) ? dataNode.meta : dataNode;
  const total = readNumber(metaNode.total, data.length);
  const totalPages = readNumber(
    metaNode.totalPages,
    readNumber(metaNode.lastPage, 1)
  );

  return {
    data,
    meta: {
      total,
      totalPages,
      currentPage: readNumber(metaNode.currentPage, readNumber(metaNode.page, 1)),
      lastPage: readNumber(metaNode.lastPage, totalPages),
    },
  };
}

function normalizePromoCodeDetailResponse(payload: unknown): PromoCodeDTO | null {
  if (!isRecord(payload)) return null;

  if (isRecord(payload.data)) {
    if (isRecord(payload.data.data)) {
      return payload.data.data as unknown as PromoCodeDTO;
    }

    return payload.data as unknown as PromoCodeDTO;
  }

  return payload as unknown as PromoCodeDTO;
}

export const fetchPromoCodesList = async ({
  page = 1,
  limit = 20,
  q = "",
  includeDeleted = false,
}: FetchPromoCodesListParams): Promise<PromoCodesListResponse> => {
  const response = await api.get<unknown>("/api/dashboard/promo-codes", {
    params: {
      page,
      limit,
      q: q || undefined,
      includeDeleted,
    },
  });

  return normalizePromoCodesListResponse(response.data);
};

export const fetchPromoCodeById = async (
  id: string
): Promise<PromoCodeDTO | null> => {
  const response = await api.get<unknown>(`/api/dashboard/promo-codes/${id}`);
  return normalizePromoCodeDetailResponse(response.data);
};

export const createPromoCode = async (
  data: PromoCodePayload
): Promise<PromoCodeDTO | null> => {
  const response = await api.post<unknown>("/api/dashboard/promo-codes", data);
  return normalizePromoCodeDetailResponse(response.data);
};

export const updatePromoCode = async ({
  id,
  data,
}: {
  id: string;
  data: PromoCodePayload;
}): Promise<PromoCodeDTO | null> => {
  const response = await api.put<unknown>(
    `/api/dashboard/promo-codes/${id}`,
    data
  );
  return normalizePromoCodeDetailResponse(response.data);
};

export const deletePromoCode = async (id: string): Promise<unknown> => {
  const response = await api.delete<unknown>(`/api/dashboard/promo-codes/${id}`);
  return response.data;
};
