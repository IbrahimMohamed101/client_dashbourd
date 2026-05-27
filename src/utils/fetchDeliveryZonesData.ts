import api from "@/lib/apis";
import { deliveryZoneToggleUrl } from "@/utils/deliveryZoneApiContract";
import type {
  CreateDeliveryZoneDTO,
  DeliveryZonesResponse,
  UpdateDeliveryZoneDTO,
} from "@/types/deliveryZoneTypes";

export const fetchDeliveryZonesList = async ({
  q = "",
  isActive,
}: {
  q?: string;
  isActive?: boolean;
} = {}): Promise<DeliveryZonesResponse> => {
  try {
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    if (typeof isActive === "boolean") {
      params.append("isActive", String(isActive));
    }

    const response = await api.get(
      `/api/dashboard/zones${params.size ? `?${params.toString()}` : ""}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching delivery zones list:", error);
    throw error;
  }
};

export const createDeliveryZone = async (data: CreateDeliveryZoneDTO) => {
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
  data: UpdateDeliveryZoneDTO;
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
