import api from "@/lib/apis";

export const fetchUpdateMeal = async (
  mealId: string,
  data: FormData
): Promise<void> => {
  await api.put(`/api/dashboard/meal-planner/proteins/${mealId}`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
