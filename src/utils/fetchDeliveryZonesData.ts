import api from "@/lib/apis";
import { deliveryZoneToggleUrl } from "@/utils/deliveryZoneApiContract";

export const fetchDeliveryZonesList = async ({
  page = 1,
  limit = 20,
  q = "",
}: {
  page?: number;
  limit?: number;
  q?: string;
}) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (q) params.append("q", q);

    const response = await api.get(
      `/api/dashboard/zones?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching delivery zones list:", error);
    throw error;
  }
};

export const createDeliveryZone = async (data: Record<string, unknown>) => {
  try {
    const response = await api.post("/api/dashboard/zones", data);
    return response.data;
  } catch (error) {
    console.error("Error creating delivery zone:", error);
    throw error;
  }
};

export const updateDeliveryZone = async ({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown>;
}) => {
  try {
    const response = await api.put(`/api/dashboard/zones/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating delivery zone ${id}:`, error);
    throw error;
  }
};

export const deleteDeliveryZone = async (id: string) => {
  try {
    const response = await api.delete(`/api/dashboard/zones/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting delivery zone ${id}:`, error);
    throw error;
  }
};

export const toggleDeliveryZone = async (id: string) => {
  try {
    const response = await api.patch(deliveryZoneToggleUrl(id));
    return response.data;
  } catch (error) {
    console.error(`Error toggling delivery zone ${id}:`, error);
    throw error;
  }
};
