import { createFileRoute } from "@tanstack/react-router";

import { PremiumMealsPage } from "@/components/pages/premium-meals/PremiumMealsPage";

export const Route = createFileRoute("/_protected/premium-meals/")({
  component: PremiumMealsPage,
});
