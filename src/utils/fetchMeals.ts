import api from "@/lib/apis";
import type { MealsResponse } from "@/types/mealTypes";

export const fetchMeals = async (): Promise<MealsResponse> => {
  const response = await api.get("/api/dashboard/meal-planner/proteins");
  return response.data;
};
