// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PosWorkspace } from "./PosWorkspace";
import { categories, previewProducts } from "./previewCatalog";
import { fetchPosQuote } from "./quoteApi";

vi.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>القائمة</button>
  ),
}));

vi.mock("./quoteApi", () => ({
  fetchPosQuote: vi.fn(),
}));


const catalog = {
  revision: 1,
  categories: [...categories],
  products: previewProducts,
};

describe("POS preview workspace", () => {
  it("opens on categories and reprices a configured item only after confirmation", async () => {
    const user = userEvent.setup();
    render(<PosWorkspace catalog={catalog} />);
    const butter = screen.getByRole("button", { name: /دجاج بالزبدة/ });
    expect(
      within(butter).getByText("من 24.00 ر.س")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "الوجبات" }));
    await user.click(screen.getByRole("button", { name: /دجاج بالزبدة/ }));

    const options = within(
      screen.getByRole("dialog", { name: /دجاج بالزبدة/ })
    );
    expect(options.getByRole("button", { name: /أضف للسلة/ })).toBeEnabled();
    expect(options.getByRole("button", { name: /150 جم/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(options.getByRole("button", { name: /150 جم/ }));
    await user.click(options.getByRole("button", { name: /زيادة دجاج/ }));
    const chosenAddon = options.getByRole("button", { name: /زيادة دجاج/ });
    expect(chosenAddon).toHaveAttribute("aria-pressed", "true");
    expect(chosenAddon).toHaveClass("border-primary", "bg-primary/10");
    expect(chosenAddon.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
    expect(options.getByRole("button", { name: "إغلاق النافذة" })).toBeInTheDocument();
    await user.click(options.getByRole("button", { name: /أضف للسلة/ }));

    const cart = within(
      screen.getByRole("complementary", { name: "السلة التجريبية" })
    );
    expect(cart.getByRole("listitem")).toHaveTextContent("37.00");
    await user.click(screen.getByRole("button", { name: "HungerStation" }));
    const confirmation = within(
      screen.getByRole("dialog", { name: "تغيير قناة البيع" })
    );
    expect(confirmation.getByText(/الإجمالي الحالي/)).toHaveTextContent(
      /37\.00.*42\.00/
    );
    expect(cart.getByRole("listitem", { hidden: true })).toHaveTextContent(
      "37.00"
    );
    await user.click(
      confirmation.getByRole("button", { name: "تأكيد تغيير القناة" })
    );
    expect(cart.getByRole("listitem")).toHaveTextContent("42.00");
    expect(
      cart.getByRole("button", { name: "الدفع غير متاح في المعاينة" })
    ).toBeDisabled();
  });

  it("shows all items immediately and updates product cards for channel and category", async () => {
    const user = userEvent.setup();
    render(<PosWorkspace catalog={catalog} />);

    const butter = screen.getByRole("button", { name: /دجاج بالزبدة/ });
    expect(within(butter).getByText("من 24.00 ر.س")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "HungerStation" }));
    expect(within(butter).getByText("من 28.00 ر.س")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "السلطات" }));
    expect(screen.getByRole("button", { name: /سلطة بيسك/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /دجاج بالزبدة/ })).not.toBeInTheDocument();

    await user.type(screen.getByRole("searchbox"), "دجاج");
    expect(screen.getByRole("button", { name: /دجاج بالزبدة/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "كل الأصناف" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("keeps restaurant service mode separate from channel and app payment status", async () => {
    const user = userEvent.setup();
    render(<PosWorkspace catalog={catalog} />);
    const mode = within(screen.getByRole("group", { name: "نوع طلب المطعم" }));
    expect(mode.getByRole("button", { name: "سفري" })).toHaveAttribute("aria-pressed", "true");
    await user.click(mode.getByRole("button", { name: "محلي" }));
    expect(mode.getByRole("button", { name: "محلي" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Keeta" }));
    expect(screen.getByRole("textbox", { name: "الرقم الخارجي لطلب التطبيق" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "كاش" }));
    expect(screen.getByRole("button", { name: "كاش" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/كاش التطبيقات لا يُضاف لدرج المطعم/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "المطعم" }));
    expect(within(screen.getByRole("group", { name: "نوع طلب المطعم" })).getByRole("button", { name: "محلي" })).toHaveAttribute("aria-pressed", "true");
  });

  it("requests a server-side published catalogue quote without enabling payment", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchPosQuote).mockResolvedValueOnce({
      revision: 1,
      currency: "SAR",
      channel: "restaurant",
      lines: [{
        productId: "water", name: "مياه", variantId: "bottle",
        variantLabel: "عبوة", quantity: 1,
        basePriceHalalas: 300, addons: [],
        unitPriceHalalas: 300, lineTotalHalalas: 300,
      }],
      itemCount: 1,
      provisionalSubtotalHalalas: 300,
      finalPayableHalalas: null,
      taxHalalas: null,
      discountHalalas: null,
      canCommit: false,
      note: "مراجعة سعر",
    });
    render(<PosWorkspace catalog={catalog} />);
    await user.type(screen.getByRole("searchbox", { name: "ابحث عن صنف" }), "مياه");
    await user.click(screen.getByRole("button", { name: /مياه/ }));
    await user.click(screen.getByRole("button", { name: "مراجعة الأسعار من السيرفر" }));
    expect(fetchPosQuote).toHaveBeenCalledWith({
      revision: 1,
      channel: "restaurant",
      items: [{ productId: "water", variantId: "bottle", quantity: 1, addonIds: [] }],
    });
    const quote = within(await screen.findByRole("region", { name: "نتيجة تسعير السيرفر" }));
    expect(quote.getByText(/3\.00/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" }));
    const checkout = within(screen.getByRole("dialog", { name: /مراجعة الطلب قبل إصدار الفاتورة/ }));
    expect(checkout.getAllByText(/3\.00/)).toHaveLength(2);
    expect(checkout.getByRole("button", { name: "شبكة" })).toBeEnabled();
    expect(checkout.getByRole("button", { name: /تأكيد البيع وإصدار الفاتورة/ })).toBeDisabled();
    await user.click(checkout.getByRole("button", { name: "رجوع للسلة" }));
    expect(screen.getByRole("button", { name: "الدفع غير متاح في المعاينة" })).toBeDisabled();
  });

  it("fails closed when server quote totals are inconsistent", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchPosQuote).mockResolvedValueOnce({
      revision: 1, currency: "SAR", channel: "restaurant",
      lines: [{
        productId: "water", name: "مياه", variantId: "bottle", variantLabel: "عبوة",
        quantity: 1, basePriceHalalas: 300, addons: [], unitPriceHalalas: 300,
        lineTotalHalalas: 300,
      }],
      itemCount: 1, provisionalSubtotalHalalas: 500,
      finalPayableHalalas: null, taxHalalas: null, discountHalalas: null,
      canCommit: false, note: "review",
    });
    render(<PosWorkspace catalog={catalog} />);
    await user.type(screen.getByRole("searchbox", { name: "ابحث عن صنف" }), "مياه");
    await user.click(screen.getByRole("button", { name: /مياه/ }));
    expect(screen.getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "مراجعة الأسعار من السيرفر" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/الإجمالي المبدئي/);
    expect(screen.getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" })).toBeDisabled();
  });

  it("blocks switching channels when the selected size has no price in the destination", async () => {
    const user = userEvent.setup();
    render(<PosWorkspace catalog={catalog} />);
    await user.type(screen.getByRole("searchbox"), "تكا");
    await user.click(screen.getByRole("button", { name: /دجاج تكا/ }));
    await user.click(screen.getByRole("button", { name: /200 جم/ }));
    await user.click(screen.getByRole("button", { name: /أضف للسلة/ }));
    await user.click(screen.getByRole("button", { name: "Keeta" }));

    const confirmation = within(
      screen.getByRole("dialog", { name: "تغيير قناة البيع" })
    );
    expect(confirmation.getByText(/غير مسعّرة/)).toBeInTheDocument();
    expect(
      confirmation.getByRole("button", { name: "تأكيد تغيير القناة" })
    ).toBeDisabled();
    await user.click(confirmation.getByRole("button", { name: "إلغاء" }));
    expect(screen.getByRole("button", { name: "المطعم" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });


  it("shows the exact stale server quote conflict instead of a generic outage", async () => {
    const user = userEvent.setup();
    vi.mocked(fetchPosQuote).mockRejectedValueOnce({
      response: { status: 409, data: { error: { code: "POS_CATALOG_CONFLICT" } } },
    });
    render(<PosWorkspace catalog={catalog} />);
    await user.type(screen.getByRole("searchbox"), "مياه");
    await user.click(within(screen.getByRole("region", { name: "الكتالوج التجريبي" })).getByRole("button", { name: /مياه/ }));
    await user.click(screen.getByRole("button", { name: "مراجعة الأسعار من السيرفر" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/تم نشر منيو أحدث/);
    expect(screen.getByRole("button", { name: "الدفع غير متاح في المعاينة" })).toBeDisabled();
  });

  it("uses manager-configured channels without a frontend code change", async () => {
    const user = userEvent.setup();
    const dynamic = {
      ...catalog,
      channels: [
        { id: "restaurant", label: "المطعم" },
        { id: "hungerstation", label: "HungerStation" },
        { id: "keeta", label: "Keeta" },
        { id: "fourth-channel", label: "تطبيق جديد" },
      ],
      products: catalog.products.map((item) => ({
        ...item,
        variants: item.variants.map((variant) => ({
          ...variant,
          prices: { ...variant.prices, "fourth-channel": item.id === "water" ? 650 : null },
        })),
      })),
    };
    render(<PosWorkspace catalog={dynamic} />);
    expect(screen.getByRole("group", { name: "قناة البيع" })).toHaveTextContent("المطعم");
    expect(screen.getByRole("button", { name: "قنوات أخرى" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "قنوات أخرى" })).toHaveTextContent("المطعم");
    await user.click(screen.getByRole("button", { name: "قنوات أخرى" }));
    await user.click(screen.getByRole("menuitem", { name: "تطبيق جديد" }));
    expect(screen.getByRole("group", { name: "قناة البيع" })).toHaveTextContent("تطبيق جديد");
    await user.type(screen.getByRole("searchbox"), "مياه");
    expect(screen.getByRole("button", { name: /مياه/ })).toHaveTextContent("6.50");
    await user.clear(screen.getByRole("searchbox"));
    expect(screen.getByRole("button", { name: /دجاج بالزبدة/ })).toBeDisabled();
  });

  it("prevents approval when a newly published catalog disallows an add-on", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PosWorkspace catalog={catalog} />);
    await user.click(screen.getByRole("button", { name: /دجاج بالزبدة/ }));
    const options = within(screen.getByRole("dialog", { name: /دجاج بالزبدة/ }));
    await user.click(options.getByRole("button", { name: /150 جم/ }));
    await user.click(options.getByRole("button", { name: /زيادة لحم/ }));
    await user.click(options.getByRole("button", { name: /أضف للسلة/ }));
    rerender(<PosWorkspace catalog={{
      ...catalog,
      revision: 2,
      products: catalog.products.map((item) =>
        item.id === "butter" ? { ...item, allowedAddonIds: ["extra-chicken"] } : item
      ),
    }} />);
    const review = within(screen.getByRole("status", { name: "مراجعة اختلاف أسعار المنيو" }));
    expect(review.getByRole("button", { name: "تأكيد الأسعار الجديدة" })).toBeDisabled();
    await user.click(review.getByRole("button", { name: "حذف الصنف غير المتاح" }));
    expect(screen.getByText("اختر صنفًا لتجربة إضافته إلى السلة.")).toBeInTheDocument();
  });

  it("stops mixing prices when a new catalog is published during a sale preview", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PosWorkspace catalog={catalog} />);
    await user.type(screen.getByRole("searchbox"), "مياه");
    await user.click(within(screen.getByRole("region", { name: "الكتالوج التجريبي" })).getByRole("button", { name: /مياه/ }));
    const updated = {
      ...catalog,
      revision: 2,
      products: catalog.products.map((item) =>
        item.id !== "water" ? item : {
          ...item, variants: item.variants.map((v) =>
            ({ ...v, prices: { ...v.prices, restaurant: 450 } })
          ),
        }
      ),
    };
    rerender(<PosWorkspace catalog={updated} />);
    const review = within(screen.getByRole("status", { name: "مراجعة اختلاف أسعار المنيو" }));
    expect(review.getByText(/السلة محفوظة للمراجعة/)).toBeInTheDocument();
    const itemReprice = review.getAllByText(/الجديد:/).find((node) => node.textContent?.includes("القديم:"));
    expect(itemReprice).toHaveTextContent(/3\.00/);
    expect(itemReprice).toHaveTextContent(/4\.50/);
    expect(within(screen.getByRole("region", { name: "الكتالوج التجريبي" })).getByRole("button", { name: /مياه/ })).toBeDisabled();
    await user.click(review.getByRole("button", { name: "تأكيد الأسعار الجديدة" }));
    expect(within(screen.getByRole("region", { name: "الكتالوج التجريبي" })).getByRole("button", { name: /مياه/ })).toBeEnabled();
    expect(within(screen.getByRole("complementary", { name: "السلة التجريبية" })).getByRole("listitem")).toHaveTextContent("4.50");
  });

  it("keeps a single sale topbar and fixed cart actions when switching channels", async () => {
    const user = userEvent.setup();
    render(<PosWorkspace catalog={catalog} operatorName="أحمد" />);
    const viewport = screen.getByTestId("pos-sale-viewport");
    expect(viewport).toHaveClass("h-full", "overflow-hidden");
    expect(screen.getByRole("banner", { name: "شريط البيع" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "ابحث عن صنف" })).toBeInTheDocument();
    expect(screen.getAllByRole("searchbox", { name: "ابحث عن صنف" })).toHaveLength(1);
    const cart = screen.getByRole("complementary", { name: "السلة التجريبية" });
    expect(within(cart).getByText("سلة المطعم")).toBeInTheDocument();
    const footerAction = within(cart).getByRole("button", { name: "الدفع غير متاح في المعاينة" });
    expect(footerAction).toHaveClass("min-h-14");
    expect(footerAction).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Keeta" }));
    expect(within(cart).getByText("سلة Keeta")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "نوع طلب المطعم" })).not.toBeInTheDocument();
    expect(within(cart).getByRole("textbox", { name: "الرقم الخارجي لطلب التطبيق" })).toBeInTheDocument();
    expect(footerAction).toBeDisabled();
  });

  it("merges quick-add duplicate items and edits quantity from the cart", async () => {
    const user = userEvent.setup();
    render(<PosWorkspace catalog={catalog} />);
    const water = screen.getByRole("button", { name: /مياه/ });
    await user.click(water);
    await user.click(water);
    const cart = within(screen.getByRole("complementary", { name: "السلة التجريبية" }));
    expect(cart.getAllByRole("listitem")).toHaveLength(1);
    expect(cart.getByRole("listitem")).toHaveTextContent("6.00");
    await user.click(cart.getByRole("button", { name: "تعديل مياه عبوة" }));
    const dialog = within(screen.getByRole("dialog", { name: /مياه/ }));
    expect(dialog.getByRole("group", { name: "كمية الصنف" })).toHaveTextContent("2");
    await user.click(dialog.getByRole("button", { name: "زِد الكمية المختارة" }));
    await user.click(dialog.getByRole("button", { name: /حفظ التعديل/ }));
    expect(cart.getAllByRole("listitem")).toHaveLength(1);
    expect(cart.getByRole("listitem")).toHaveTextContent("9.00");
    expect(screen.getByRole("button", { name: "الدفع غير متاح في المعاينة" })).toBeDisabled();
  });

  it("prefills 150 g and can edit an add-on line without multiplying add-ons incorrectly", async () => {
    const user = userEvent.setup();
    render(<PosWorkspace catalog={catalog} />);
    await user.click(screen.getByRole("button", { name: /دجاج بالزبدة/ }));
    let dialog = within(screen.getByRole("dialog", { name: /دجاج بالزبدة/ }));
    expect(dialog.getByRole("button", { name: /150 جم/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(dialog.getByRole("button", { name: /زيادة دجاج/ }));
    await user.click(dialog.getByRole("button", { name: "زِد الكمية المختارة" }));
    await user.click(dialog.getByRole("button", { name: /أضف للسلة/ }));
    const cart = within(screen.getByRole("complementary", { name: "السلة التجريبية" }));
    expect(cart.getByRole("listitem")).toHaveTextContent("74.00");
    await user.click(cart.getByRole("button", { name: /تعديل دجاج بالزبدة 150 جم/ }));
    dialog = within(screen.getByRole("dialog", { name: /دجاج بالزبدة/ }));
    expect(dialog.getByRole("button", { name: /زيادة دجاج/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(dialog.getByRole("button", { name: /100 جم/ }));
    await user.click(dialog.getByRole("button", { name: /حفظ التعديل/ }));
    expect(cart.getAllByRole("listitem")).toHaveLength(1);
    expect(cart.getByRole("listitem")).toHaveTextContent("58.00");
  });

  it("restores deleted cart lines via undo, then expires undo after five seconds", async () => {
    const user = userEvent.setup();
    render(<PosWorkspace catalog={catalog} />);
    await user.click(screen.getByRole("button", { name: /مياه/ }));
    const cart = within(screen.getByRole("complementary", { name: "السلة التجريبية" }));
    await user.click(cart.getByRole("button", { name: "احذف مياه عبوة" }));
    expect(cart.queryByRole("listitem")).not.toBeInTheDocument();
    await user.click(cart.getByRole("button", { name: "تراجع عن الحذف" }));
    expect(cart.getByRole("listitem")).toHaveTextContent("مياه عبوة");
    vi.useFakeTimers();
    try {
      fireEvent.click(cart.getByRole("button", { name: "احذف مياه عبوة" }));
      act(() => { vi.advanceTimersByTime(5100); });
      expect(cart.queryByRole("button", { name: "تراجع عن الحذف" })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("restores an operator-scoped session cart, and enforces reprice when published revision changes", async () => {
    const user = userEvent.setup();
    const initial = render(<PosWorkspace catalog={catalog} operatorId="operator-a" />);
    await user.click(screen.getByRole("button", { name: /مياه/ }));
    expect(screen.getByRole("complementary", { name: "السلة التجريبية" })).toHaveTextContent("3.00");
    initial.unmount();
    const another = render(<PosWorkspace catalog={catalog} operatorId="operator-b" />);
    expect(screen.getByText("اختر صنفًا لتجربة إضافته إلى السلة.")).toBeInTheDocument();
    another.unmount();
    const newer = {
      ...catalog, revision: 2, products: catalog.products.map((item) =>
        item.id !== "water" ? item : {
          ...item, variants: item.variants.map((v) =>
            ({ ...v, prices: { ...v.prices, restaurant: 450 } })
          ),
        }
      ),
    };
    render(<PosWorkspace catalog={newer} operatorId="operator-a" />);
    const review = within(screen.getByRole("status", { name: "مراجعة اختلاف أسعار المنيو" }));
    expect(review.getByText(/السلة محفوظة للمراجعة/)).toBeInTheDocument();
    expect(review.getAllByText(/الجديد:/).find((node) => node.textContent?.includes("القديم:"))).toHaveTextContent("4.50");
    expect(within(screen.getByRole("region", { name: "الكتالوج التجريبي" }))
      .getByRole("button", { name: /مياه/ })).toBeDisabled();
    await user.click(review.getByRole("button", { name: "تأكيد الأسعار الجديدة" }));
    expect(screen.getByRole("complementary", { name: "السلة التجريبية" })).toHaveTextContent("4.50");
    expect(screen.getByRole("button", { name: "الدفع غير متاح في المعاينة" })).toBeDisabled();
  });

  it("shows add-ons in meal dialog, not as standalone sales cards unless opted in", async () => {
    const user = userEvent.setup();
    const ui = render(<PosWorkspace catalog={catalog} />);
    expect(within(screen.getByRole("region", { name: "الكتالوج التجريبي" }))
      .queryByRole("button", { name: /زيادة دجاج/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /دجاج بالزبدة/ }));
    expect(within(screen.getByRole("dialog", { name: /دجاج بالزبدة/ }))
      .getByRole("button", { name: /زيادة دجاج/ })).toBeInTheDocument();
    ui.unmount();
    const enabled = {
      ...catalog,
      products: catalog.products.map((item) =>
        item.id === "extra-chicken" ? { ...item, sellStandalone: true } : item),
    };
    render(<PosWorkspace catalog={enabled} />);
    expect(within(screen.getByRole("region", { name: "الكتالوج التجريبي" }))
      .getByRole("button", { name: /زيادة دجاج/ })).toBeInTheDocument();
  });


  it("prefers published defaultVariantId and does not confuse 150ml with 150g", async () => {
    const user = userEvent.setup();
    const changed = {
      ...catalog,
      products: catalog.products.map((item) =>
        item.id === "butter" ? { ...item, defaultVariantId: "200" } : item
      ),
    };
    const view = render(<PosWorkspace catalog={changed} />);
    await user.click(screen.getByRole("button", { name: /دجاج بالزبدة/ }));
    let dialog = within(screen.getByRole("dialog", { name: /دجاج بالزبدة/ }));
    expect(dialog.getByRole("button", { name: /200 جم/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(dialog.getByRole("button", { name: "إغلاق النافذة" }));
    view.unmount();

    const drink = {
      id: "sample-drink", name: "مشروب اختبار", category: "drinks",
      active: true,
      variants: [
        { id: "small", label: "100 مل", prices: { restaurant: 1200, hungerstation: 1400, keeta: 1500 } },
        { id: "large", label: "150 مل", prices: { restaurant: 1500, hungerstation: 1700, keeta: 1800 } },
      ],
    };
    render(<PosWorkspace catalog={{ ...catalog, products: [...catalog.products, drink] }} />);
    await user.click(screen.getByRole("button", { name: /مشروب اختبار/ }));
    dialog = within(screen.getByRole("dialog", { name: /مشروب اختبار/ }));
    expect(dialog.getByRole("button", { name: /100 مل/ })).toHaveAttribute("aria-pressed", "true");
    expect(dialog.getByRole("button", { name: /150 مل/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("falls back to the first priced variant when configured default is unpriced for the channel", async () => {
    const user = userEvent.setup();
    const changed = {
      ...catalog,
      products: catalog.products.map((item) =>
        item.id === "tikka" ? { ...item, defaultVariantId: "200" } : item),
    };
    render(<PosWorkspace catalog={changed} />);
    await user.click(screen.getByRole("button", { name: "Keeta" }));
    await user.click(screen.getByRole("button", { name: /دجاج تكا/ }));
    const dialog = within(screen.getByRole("dialog", { name: /دجاج تكا/ }));
    expect(dialog.getByRole("button", { name: /100 جم/ })).toHaveAttribute("aria-pressed", "true");
    expect(dialog.getByRole("button", { name: /200 جم/ })).toBeDisabled();
  });

});
