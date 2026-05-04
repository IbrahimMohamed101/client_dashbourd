import api from "@/lib/apis";
export const fetchUpdatePremiumMeal = async (
  id: string,
  data: FormData
) => {
  const response = await api.put(`/api/dashboard/meal-planner/premium-proteins/${id}`, data);
  return response.data;
};
