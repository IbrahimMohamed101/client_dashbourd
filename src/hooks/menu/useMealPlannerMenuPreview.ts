import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchMealPlannerMenuPreview } from "@/utils/fetchMealPlannerMenu";

const MEAL_PLANNER_MENU_PREVIEW_KEY = "menu.mealPlannerPreview";

export const mealPlannerMenuPreviewQueryOptions = () =>
  queryOptions({
    queryKey: [MEAL_PLANNER_MENU_PREVIEW_KEY],
    queryFn: fetchMealPlannerMenuPreview,
    staleTime: 1000 * 60,
  });

export const useMealPlannerMenuPreviewQuery = () =>
  useQuery(mealPlannerMenuPreviewQueryOptions());
