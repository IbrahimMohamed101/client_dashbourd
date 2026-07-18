// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/lib/apis", () => ({
  default: apiMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

import { MealBuilderDirectCardManager } from "../src/components/pages/menu/meal-builder/MealBuilderDirectCardManager";
import {
  productIdsForDirectCard,
  selectedProductsForDirectCard,
} from "../src/components/pages/menu/meal-builder/mealBuilderDirectCardUtils";
import type {
  MealBuilderSection,
  MealBuilderValidation,
} from "../src/types/mealBuilderTypes";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  apiMock.get.mockReset();
  apiMock.post.mockReset();
  apiMock.patch.mockReset();
  apiMock.delete.mockReset();
  toastMock.success.mockReset();
  toastMock.error.mockReset();
  vi.restoreAllMocks();
  apiMock.get.mockResolvedValue({
    data: {
      status: true,
      data: {
        contractVersion: "dashboard_meal_builder_picker.v1",
        sectionKey: "products",
        candidateType: "product",
        candidates: [
          directCandidate("product-1", { selected: true, assignable: true }),
          directCandidate("product-2", { selected: false, assignable: true }),
        ],
        meta: { page: 1, limit: 1000, total: 2, pages: 1 },
      },
    },
  });
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

function directCandidate(
  id: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    id,
    productId: id,
    type: "product",
    key: id,
    name: { ar: id, en: id },
    label: id,
    selected: false,
    assigned: false,
    assignable: true,
    required: false,
    eligible: true,
    linked: true,
    available: true,
    active: true,
    visible: true,
    published: true,
    subscriptionEnabled: true,
    relationExists: true,
    catalogItemAvailable: true,
    reasonCodes: [],
    warnings: [],
    errors: [],
    state: "eligible",
    ...overrides,
  };
}

function actionResponse(action = "created", sections = [directSection()]) {
  return {
    status: true,
    data: {
      contractVersion: "dashboard_meal_builder_card_action.v1",
      action,
      sectionKey: action === "deleted" ? null : "chef_choices",
      previousSectionKey: null,
      productId: null,
      section: sections[0] ?? null,
      draft: {
        id: "draft-1",
        status: "draft",
        isCurrent: true,
        contractVersion: "dashboard_meal_builder.v1",
        revisionHash: "hash",
        source: "dashboard",
        createdBySystem: false,
        bootstrapKey: "default",
        publishedAt: null,
        sections,
      },
      validation: {
        status: "ok",
        ready: true,
        errors: [],
        warnings: [],
        checks: [],
        summary: {},
      },
      summary: {
        sectionCount: sections.length,
        selectedProductCount: 2,
        ready: true,
        errorCount: 0,
        warningCount: 0,
      },
    },
  };
}

function renderManager({
  sections = [directSection()],
  validation = null,
  onPendingChange = vi.fn(),
  onActionApplied = vi.fn(),
  onBeforeAction = vi.fn(async () => undefined),
}: {
  sections?: MealBuilderSection[];
  validation?: MealBuilderValidation | null;
  onPendingChange?: (pending: boolean) => void;
  onActionApplied?: Parameters<typeof MealBuilderDirectCardManager>[0]["onActionApplied"];
  onBeforeAction?: () => Promise<void>;
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
        onBeforeAction={onBeforeAction}
        onActionApplied={onActionApplied}
        onPendingChange={onPendingChange}
      />
    </QueryClientProvider>
  );
}

describe("MealBuilderDirectCardManager", () => {
  it("renders direct-product cards with lifecycle controls", () => {
    renderManager();

    expect(screen.getByRole("button", { name: "create-direct-card" })).toBeInTheDocument();
    expect(screen.getByText("اختيارات الشيف")).toBeInTheDocument();
    expect(screen.getByText(/chef_choices/)).toBeInTheDocument();
    expect(screen.getByText("2 منتجات")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /تعديل chef_choices/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /حذف chef_choices/ })).toBeInTheDocument();
  });

  it("renders a direct card title once inside the direct manager", () => {
    renderManager({
      sections: [
        directSection({
          titleOverride: { ar: "", en: "Chef Choices" },
        }),
      ],
    });

    expect(screen.getAllByText("Chef Choices")).toHaveLength(1);
  });

  it("deduplicates hydrated selectedProducts and items", () => {
    const section = directSection({
      selectedProducts: [
        {
          id: "product-1",
          productId: "product-1",
          type: "product",
          label: "Product 1",
        },
        {
          id: "product-2",
          productId: "product-2",
          type: "product",
          label: "Product 2",
        },
      ],
      items: [
        {
          id: "product-1",
          productId: "product-1",
          type: "product",
          label: "Product 1 duplicate",
        },
        {
          id: "product-2",
          productId: "product-2",
          type: "product",
          label: "Product 2 duplicate",
        },
      ],
    });

    expect(selectedProductsForDirectCard(section)).toHaveLength(2);
    expect(productIdsForDirectCard(section)).toEqual(["product-1", "product-2"]);
  });

  it("clears owned pending after create success and prevents rapid double submit", async () => {
    const user = userEvent.setup();
    const onPendingChange = vi.fn();
    const onActionApplied = vi.fn();
    apiMock.post.mockResolvedValueOnce({ data: actionResponse("created") });
    renderManager({
      sections: [],
      onPendingChange,
      onActionApplied,
    });

    await user.click(screen.getByRole("button", { name: "create-direct-card" }));
    await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
    await user.type(document.querySelector<HTMLInputElement>("#direct-card-key")!, "chef_choices");
    await user.type(document.querySelector<HTMLInputElement>("#direct-card-title-en")!, "Chef Choices");
    await user.click(screen.getByRole("checkbox", { name: /product-2/ }));

    const saveButton = screen.getByRole("button", { name: "save-direct-card" });
    await Promise.all([user.click(saveButton), user.click(saveButton)]);

    await waitFor(() => expect(apiMock.post).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onActionApplied).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(onPendingChange.mock.calls.at(-1)?.[0]).toBe(false)
    );
    expect(toastMock.success).toHaveBeenCalledTimes(1);
  });

  it("keeps dirty dialog open when close confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    renderManager({ sections: [] });

    await user.click(screen.getByRole("button", { name: "create-direct-card" }));
    await user.type(document.querySelector<HTMLInputElement>("#direct-card-key")!, "chef_choices");
    await user.click(screen.getByRole("button", { name: "close-direct-card-dialog" }));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "save-direct-card" })).toBeInTheDocument();
  });

  it("closes clean dialog without confirmation", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    renderManager({ sections: [] });

    await user.click(screen.getByRole("button", { name: "create-direct-card" }));
    await user.click(screen.getByRole("button", { name: "close-direct-card-dialog" }));

    expect(confirmSpy).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "save-direct-card" })).not.toBeInTheDocument()
    );
  });

  it("requires confirmation before removing an existing product", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    apiMock.delete.mockResolvedValueOnce({
      data: actionResponse("product_removed", [
        directSection({ selectedProductIds: ["product-2"] }),
      ]),
    });
    const onActionApplied = vi.fn();
    renderManager({ onActionApplied });

    await user.click(screen.getAllByLabelText(/chef_choices/)[0]);
    await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /product-1/ }));

    await waitFor(() => expect(apiMock.delete).toHaveBeenCalledTimes(1));
    expect(onActionApplied).toHaveBeenCalledTimes(1);
    expect(toastMock.success).toHaveBeenCalledTimes(1);
  });

  it("does not remove a product when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    renderManager();

    await user.click(screen.getAllByLabelText(/chef_choices/)[0]);
    await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /product-1/ }));

    expect(apiMock.delete).not.toHaveBeenCalled();
  });

  it("opens delete-card flow for the final product", async () => {
    const user = userEvent.setup();
    renderManager({
      sections: [
        directSection({
          selectedProductIds: ["product-1"],
          items: [
            {
              id: "product-1",
              productId: "product-1",
              type: "product",
              key: "product-1",
              label: "product-1",
            },
          ],
        }),
      ],
    });

    await user.click(screen.getAllByLabelText(/chef_choices/)[0]);
    await waitFor(() => expect(apiMock.get).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: /product-1/ }));

    expect(apiMock.delete).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /حذف البطاقة|Ø­Ø°Ù Ø§Ù„Ø¨Ø·Ø§Ù‚Ø©/ })).toBeInTheDocument();
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
