import api from "@/lib/apis";

export const fetchPromoCodesList = async ({
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

    const response = await api.get(`/api/dashboard/promo-codes?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching promo codes list:", error);
    throw error;
  }
};

export const createPromoCode = async (data: Record<string, unknown>) => {
  try {
    const response = await api.post("/api/dashboard/promo-codes", data);
    return response.data;
  } catch (error) {
    console.error("Error creating promo code:", error);
    throw error;
  }
};

export const updatePromoCode = async ({
  id,
  data,
}: {
  id: string;
  data: Record<string, unknown>;
}) => {
  try {
    const response = await api.put(`/api/dashboard/promo-codes/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating promo code ${id}:`, error);
    throw error;
  }
};

export const deletePromoCode = async (id: string) => {
  try {
    const response = await api.delete(`/api/dashboard/promo-codes/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting promo code ${id}:`, error);
    throw error;
  }
};
