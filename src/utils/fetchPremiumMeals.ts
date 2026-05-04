import api from "@/lib/apis";
import type { PremiumMealsResponse } from "@/types/premiumMealTypes";

export const fetchPremiumMeals = async (): Promise<PremiumMealsResponse> => {
  const response = await api.get("/api/dashboard/meal-planner/premium-proteins");
  return response.data;
};
