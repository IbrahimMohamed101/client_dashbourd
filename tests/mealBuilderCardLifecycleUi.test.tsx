// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MealBuilderDirectCardManager } from "../src/components/pages/menu/meal-builder/MealBuilderDirectCardManager";
import type {
  MealBuilderSection,
  MealBuilderValidation,
} from "../src/types/mealBuilderTypes";

afterEach(() => {
  cleanup();
});

function directSection(overrides: Partial<MealBuilderSection> = {}): MealBuilderSection {
  return {
    key: "chef_choices",
    sectionType: "product_list",
    sourceKind: "product_list",
    productContextId: null,
    sourceGroupId: null,
    sourceCategoryId: null,
    selectedOptionIds: [],
    selectedProductIds: ["product-1", "product-2"],
    includeMode: "selected",
    selectionType: "",
    titleOverride: { ar: "اختيارات الشيف", en: "Chef Choices" },
    sortOrder: 20,
    required: false,
    minSelections: 0,
    maxSelections: 1,
    multiSelect: false,
    visible: true,
    availableFor: ["subscription"],
    items: [
      {
        id: "product-1",
        productId: "product-1",
        type: "product",
        key: "grilled_chicken",
        label: "دجاج مشوي",
        name: { ar: "دجاج مشوي", en: "Grilled Chicken" },
      },
      {
        id: "product-2",
        productId: "product-2",
        type: "product",
        key: "salmon",
        label: "سلمون",
        name: { ar: "سلمون", en: "Salmon" },
      },
    ],
    ...overrides,
  };
}

function renderManager({
  sections = [directSection()],
  validation = null,
}: {
  sections?: MealBuilderSection[];
  validation?: MealBuilderValidation | null;
} = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MealBuilderDirectCardManager
        sections={sections}
        validation={validation}
        pending={false}
        onBeforeAction={vi.fn()}
        onActionApplied={vi.fn()}
      />
    </QueryClientProvider>
  );
}

describe("MealBuilderDirectCardManager", () => {
  it("renders direct-product cards with lifecycle controls", () => {
    renderManager();

    expect(screen.getByRole("button", { name: /إضافة بطاقة منتجات/ })).toBeInTheDocument();
    expect(screen.getByText("اختيارات الشيف")).toBeInTheDocument();
    expect(screen.getByText(/chef_choices/)).toBeInTheDocument();
    expect(screen.getByText("2 منتجات")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /تعديل chef_choices/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /حذف chef_choices/ })).toBeInTheDocument();
  });

  it("renders validation details for backend issues", () => {
    renderManager({
      validation: {
        status: "error",
        ready: false,
        errors: [
          {
            level: "error",
            code: "MEAL_BUILDER_CARD_PRODUCTS_REQUIRED",
            cardKey: "chef_choices",
            message: "A direct product card must contain products",
          },
        ],
        warnings: [],
        checks: [
          {
            level: "error",
            code: "MEAL_BUILDER_CARD_PRODUCTS_REQUIRED",
            cardKey: "chef_choices",
            message: "A direct product card must contain products",
          },
        ],
      },
    });

    expect(screen.getByText("تحتاج مراجعة")).toBeInTheDocument();
    expect(screen.getByText(/A direct product card must contain products/)).toBeInTheDocument();
  });
});
