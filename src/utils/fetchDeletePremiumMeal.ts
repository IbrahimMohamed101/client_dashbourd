import api from "@/lib/apis";

export const fetchDeletePremiumMeal = async (id: string) => {
  const response = await api.delete(`/api/dashboard/meal-planner/premium-proteins/${id}`);
  return response.data;
};
