import api from "@/lib/apis";

export const fetchDeleteMeal = async (mealId: string): Promise<void> => {
  await api.delete(`/api/dashboard/meal-planner/proteins/${mealId}`);
};
