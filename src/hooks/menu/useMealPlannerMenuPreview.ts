import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchMealPlannerMenuPreview } from "@/utils/fetchMealPlannerMenu";

export const MEAL_PLANNER_MENU_PREVIEW_KEY = "subscriptions.meal-planner-menu";

export const mealPlannerMenuPreviewQueryOptions = () =>
  queryOptions({
    queryKey: [MEAL_PLANNER_MENU_PREVIEW_KEY, "ar"],
    queryFn: fetchMealPlannerMenuPreview,
    staleTime: 1000 * 10,
  });

export const useMealPlannerMenuPreviewQuery = () =>
  useQuery(mealPlannerMenuPreviewQueryOptions());
