import api from "@/lib/apis";
import type { MealPlannerMenuResponse } from "@/types/mealPlannerMenuTypes";
import { mapMealPlannerMenuResponse } from "@/utils/mealPlannerMenuAdapter";

export const mealPlannerMenuPreviewUrl = () =>
  "/api/subscriptions/meal-planner-menu?lang=ar";

export const fetchMealPlannerMenuPreview =
  async (): Promise<MealPlannerMenuResponse> => {
    const response = await api.get(mealPlannerMenuPreviewUrl());
    return {
      status: response.data?.status ?? true,
      data: mapMealPlannerMenuResponse(response.data),
    };
  };
