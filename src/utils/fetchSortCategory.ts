import api from "@/lib/apis";

export const fetchSortCategory = async (
  categoryId: string,
  sortOrder: number
): Promise<void> => {
  await api.patch(`/api/dashboard/meal-planner/categories/${categoryId}/sort`, {
    sortOrder,
  });
};
