// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PosCheckoutReview } from "./PosCheckoutReview";
import type { PosQuote } from "./quoteApi";

const quote: PosQuote = {
  revision: 10,
  currency: "SAR",
  channel: "restaurant",
  lines: [{
    productId: "butter", name: "دجاج بالزبدة", variantId: "150",
    variantLabel: "150 جم", quantity: 2, basePriceHalalas: 3200,
    addons: [{ productId: "extra-chicken", name: "زيادة دجاج", priceHalalas: 500 }],
    unitPriceHalalas: 3700, lineTotalHalalas: 7400,
  }],
  itemCount: 2, provisionalSubtotalHalalas: 7400,
  finalPayableHalalas: null, taxHalalas: null, discountHalalas: null,
  canCommit: false, note: "Staging only",
};

describe("POS Stage E preview-only checkout review", () => {
  it("shows server unit breakdown and allows changing a non-persistent tender choice", async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    render(<PosCheckoutReview quote={quote} channelName="المطعم" serviceMode="takeaway"
      externalOrderNumber="" externalPaymentStatus="paid" onClose={close} />);
    const dialog = within(screen.getByRole("dialog", { name: /مراجعة الطلب قبل إصدار الفاتورة/ }));
    expect(dialog.getAllByText(/74\.00/)).toHaveLength(2);
    expect(dialog.getByText(/نوع الطلب:/)).toHaveTextContent("سفري");
    expect(dialog.getByText(/زيادة دجاج/)).toBeInTheDocument();
    expect(dialog.getAllByText("غير محسوبة")).toHaveLength(2);
    expect(dialog.getByRole("button", { name: /تأكيد البيع وإصدار الفاتورة/ })).toBeDisabled();
    await user.click(dialog.getByRole("button", { name: "شبكة" }));
    const selectedNetwork = dialog.getByRole("button", { name: "شبكة" });
    expect(selectedNetwork).toHaveAttribute("aria-pressed", "true");
    expect(selectedNetwork).toHaveClass("border-primary", "bg-primary/10");
    expect(selectedNetwork.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: "كاش" })).not.toHaveClass("border-primary");
    expect(dialog.getByRole("button", { name: "إغلاق النافذة" })).toBeInTheDocument();
    expect(dialog.getByText(/لا يتم تحصيل نقد/)).toBeInTheDocument();
    await user.click(dialog.getByRole("button", { name: "رجوع للسلة" }));
    expect(close).toHaveBeenCalledOnce();
  });

  it("hides the current restaurant service mode in order review", () => {
    render(<PosCheckoutReview quote={quote} channelName="المطعم" serviceMode="restaurant"
      externalOrderNumber="" externalPaymentStatus="paid" onClose={() => undefined} />);
    expect(screen.queryByText(/نوع الطلب/)).not.toBeInTheDocument();
  });

  it("shows external app status without claiming it was paid or adding cash to drawer", () => {
    render(<PosCheckoutReview quote={{ ...quote, channel: "keeta" }} channelName="Keeta"
      serviceMode="takeaway" externalOrderNumber="TEST-002" externalPaymentStatus="cash"
      onClose={() => undefined} />);
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText(/TEST-002/)).toBeInTheDocument();
    expect(dialog.getByText(/حالة الدفع المُدخلة من الكاشير: كاش/)).toBeInTheDocument();
    expect(dialog.getByText(/ليست تأكيدًا من تطبيق التوصيل/)).toBeInTheDocument();
    expect(dialog.queryByRole("button", { name: "شبكة" })).not.toBeInTheDocument();
    expect(dialog.getByRole("button", { name: /تأكيد البيع وإصدار الفاتورة/ })).toBeDisabled();
  });
});
