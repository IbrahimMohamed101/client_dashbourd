import api from "@/lib/apis";

export const fetchToggleCategoryStatus = async (
  categoryId: string
): Promise<void> => {
  await api.patch(`/api/dashboard/meal-planner/categories/${categoryId}/toggle`);
};
