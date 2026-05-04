import api from "@/lib/apis";

export const fetchToggleMealStatus = async (mealId: string): Promise<void> => {
  await api.patch(`/api/dashboard/meal-planner/proteins/${mealId}/toggle`);
};
