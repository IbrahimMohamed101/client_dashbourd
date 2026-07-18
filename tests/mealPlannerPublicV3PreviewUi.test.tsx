// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("@/lib/apis", () => ({
  default: apiMock,
}));

import { MealPlannerMenuPreviewTab } from "../src/components/pages/menu/meal-planner-preview/MealPlannerMenuPreviewTab";

function renderPreview() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MealPlannerMenuPreviewTab />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  apiMock.get.mockReset();
});

afterEach(() => cleanup());

describe("MealPlannerMenuPreviewTab public v3 errors", () => {
  it("shows a retryable Arabic 503 state without falling back to draft or legacy fields", async () => {
    apiMock.get.mockRejectedValueOnce({
      response: {
        status: 503,
        data: {
          error: {
            code: "MEAL_PLANNER_PRIMARY_CONTENT_EMPTY",
            messageAr: "لا توجد بيانات منشورة جاهزة",
          },
        },
      },
    });

    renderPreview();

    expect(await screen.findByText("معاينة التطبيق غير متاحة مؤقتا")).toBeInTheDocument();
    expect(
      screen.getByText(/لن نستخدم بيانات المسودة أو الحقول القديمة كبديل/)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /إعادة المحاولة/ })).toBeInTheDocument();
    expect(screen.queryByText("legacy-v2-section")).not.toBeInTheDocument();
  });

  it("retries the public v3 preview endpoint", async () => {
    const user = userEvent.setup();
    apiMock.get
      .mockRejectedValueOnce({
        response: {
          status: 503,
          data: {
            error: {
              code: "MEAL_PLANNER_PRIMARY_CONTENT_EMPTY",
              messageAr: "لا توجد بيانات منشورة جاهزة",
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          status: true,
          data: {
            builderCatalog: {
              contractVersion: "meal_planner_menu.v3",
              sections: [],
            },
          },
        },
      });

    renderPreview();

    await screen.findByText("معاينة التطبيق غير متاحة مؤقتا");
    await user.click(screen.getByRole("button", { name: /إعادة المحاولة/ }));

    await waitFor(() => expect(apiMock.get).toHaveBeenCalledTimes(2));
  });
});
