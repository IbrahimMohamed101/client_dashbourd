import api from "@/lib/apis";

export const fetchGetDashboardData = async () => {
  try {
    const response = await api.get("/api/dashboard/overview");
    return response.data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
