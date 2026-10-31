import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type {
  MealPlannerCatalogV2,
  MealPlannerBuilderGroup,
} from "../../src/types/mealPlannerDashboardTypes";

export const testMealPlannerCatalog: MealPlannerCatalogV2 = {
  products: [],
  optionGroups: [],
  options: [],
  builderGroups: (["protein", "carbs"] as const).map(
    (role) =>
      ({
        id: `context-${role}`,
        sourceGroupId: `group-${role}`,
        productContextId: "product-basic",
        optionRole: role,
        eligible: true,
        compatible: true,
        cardType: "option_family",
        selectionType: "standard_meal",
        product: {
          id: "product-basic",
          key: "basic",
          name: { ar: "وجبة بيسك", en: "Basic meal" },
          status: {},
        },
        group: {
          id: `group-${role}`,
          _id: `group-${role}`,
          key: role,
          name: { ar: role === "protein" ? "البروتين" : "النشويات", en: role },
          status: {},
        },
        families: role === "protein" ? ["beef"] : [],
        options: [],
        rules: { minSelections: 0, maxSelections: 1, isRequired: false },
        optionCount: 0,
        assignableOptionCount: 0,
        sortOrder: 0,
        reasonCodes: [],
      }) satisfies MealPlannerBuilderGroup
  ),
};

// Preload the current three read contracts. Unit tests never call a real backend.
export function renderMealPlanner(ui: ReactElement) {
  const supplied = (ui.props as { catalog?: MealPlannerCatalogV2 }).catalog;
  const catalog = supplied || testMealPlannerCatalog;
  const groups =
    catalog.builderGroups || catalog.authoring?.builderGroups || [];
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  client.setQueryData(["dashboard.meal-planner.v2.catalog"], {
    status: true,
    data: catalog,
  });
  client.setQueryData(["menu.optionGroups", { limit: 100 }], {
    status: true,
    data: {
      items: groups.map((g) => ({
        ...g.group,
        id: g.sourceGroupId,
        isActive: true,
        isVisible: true,
        isAvailable: true,
      })),
    },
  });
  for (const g of groups) {
    client.setQueryData(
      ["menu.optionGroupOptions", g.sourceGroupId, { limit: 100 }],
      {
        status: true,
        data: {
          items: g.options.map((o) => ({
            ...o,
            id: o.optionId,
            groupId: g.sourceGroupId,
            isActive: o.assignable,
            isAvailable: o.assignable,
            isVisible: true,
          })),
        },
      }
    );
  }
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}
