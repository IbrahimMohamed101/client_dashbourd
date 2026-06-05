import api from "@/lib/apis";
import type { PublicMenuResponse } from "@/types/publicMenuTypes";
import { mapPublicMenuResponse } from "@/utils/publicMenuAdapter";

export const publicMenuPreviewUrl = () =>
  "/api/orders/menu?includePublicV2=true";

export const fetchPublicMenuPreview = async (): Promise<PublicMenuResponse> => {
  const response = await api.get(publicMenuPreviewUrl());
  return {
    status: response.data?.status ?? true,
    data: mapPublicMenuResponse(response.data),
  };
};
