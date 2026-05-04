import api from "@/lib/apis";
export const fetchCreatePremiumMeal = async (data: FormData) => {
  const response = await api.post("/api/dashboard/meal-planner/premium-proteins", data);
  return response.data;
};
