// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeductionForm } from "../src/components/pages/manual-deduction/DeductionForm";
import type { Subscription } from "../src/types/subscriptionTypes";

afterEach(cleanup);

const subscription = {
  id: "subscription-1",
  userName: "عميل اختبار",
  planName: "خطة 7 أيام",
  totalMeals: 14,
  remainingMeals: 14,
  remainingRegularMeals: 10,
  remainingPremiumMeals: 4,
  premiumRemaining: 4,
  endDate: "2026-07-29T00:00:00.000Z",
  addonBalances: [
    {
      addonId: "addon-juice",
      name: "عصير",
      remainingQty: 7,
      totalQty: 7,
    },
  ],
} as Subscription;

describe("manual deduction form", () => {
  it("shows the 10 regular, 4 premium, and 7 independent add-on units", () => {
    render(
      <DeductionForm
        subscription={subscription}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isPending={false}
      />
    );

    expect(screen.getByText("10 متاح")).toBeInTheDocument();
    expect(screen.getByText("4 متاح")).toBeInTheDocument();
    expect(screen.getByText("7 وحدة")).toBeInTheDocument();
    expect(screen.getByText("المتاح: 7 من 7")).toBeInTheDocument();
  });

  it("keeps selected meal and add-on totals visibly separate", async () => {
    const user = userEvent.setup();
    render(
      <DeductionForm
        subscription={subscription}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        isPending={false}
      />
    );

    const regular = screen.getByLabelText("وجبات عادية");
    const premium = screen.getByLabelText("وجبات مميزة");
    const addonInput = screen.getByLabelText("عصير");
    await user.clear(regular);
    await user.type(regular, "2");
    await user.clear(premium);
    await user.type(premium, "1");
    await user.clear(addonInput);
    await user.type(addonInput, "3");

    expect(screen.getByText("الوجبات: 3 • الإضافات: 3")).toBeInTheDocument();
  });
});
