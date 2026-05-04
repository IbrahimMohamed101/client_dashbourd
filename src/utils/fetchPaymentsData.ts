import api from "@/lib/apis";

export const fetchPaymentsList = async ({
  page = 1,
  limit = 20,
  status = "",
  type = "",
  q = "",
}: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  q?: string;
}) => {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (status) params.append("status", status);
    if (type) params.append("type", type);
    if (q) params.append("q", q);

    const response = await api.get(`/api/dashboard/payments?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching payments list:", error);
    throw error;
  }
};

export const fetchPaymentDetails = async (id: string) => {
  try {
    const response = await api.get(`/api/dashboard/payments/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching payment details for ID ${id}:`, error);
    throw error;
  }
};

export const fetchPaymentBreakdown = async (id: string) => {
  try {
    const response = await api.get(`/api/dashboard/payments/${id}/breakdown`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching payment breakdown for ID ${id}:`, error);
    throw error;
  }
};

export const verifyPayment = async (id: string) => {
  try {
    const response = await api.post(`/api/dashboard/payments/${id}/verify`);
    return response.data;
  } catch (error) {
    console.error(`Error verifying payment for ID ${id}:`, error);
    throw error;
  }
};
