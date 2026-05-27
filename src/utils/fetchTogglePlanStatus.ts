import api from "@/lib/apis";

export const fetchTogglePlanStatus = async (id: string) => {
  const response = await api.patch(`/api/dashboard/plans/${id}/toggle`);
  return response.data;
};
