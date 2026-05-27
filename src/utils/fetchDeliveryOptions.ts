import api from "@/lib/apis";
import type { DeliveryOptionsResponse } from "@/types/deliveryTypes";

export const fetchDeliveryOptions = async (): Promise<DeliveryOptionsResponse> => {
  const response = await api.get("/api/dashboard/zones");
  return response.data;
};
