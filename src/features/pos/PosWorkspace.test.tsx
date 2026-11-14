// @vitest-environment jsdom
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  it("opens on categories and reprices a fully priced cart immediately with undo", async () => {
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
    expect(screen.queryByRole("dialog", { name: /قناة البيع/ })).not.toBeInTheDocument();
    expect(cart.getByRole("listitem")).toHaveTextContent("42.00");
    expect(cart.getByText(/تم تحويل السلة إلى HungerStation/)).toBeInTheDocument();
    await user.click(cart.getByRole("button", { name: "تراجع عن تحويل القناة" }));
    expect(cart.getByRole("listitem")).toHaveTextContent("37.00");
    expect(screen.getByRole("button", { name: "المطعم" })).toHaveAttribute("aria-pressed", "true");
    expect(cart.queryByRole("button", { name: "الدفع غير متاح في المعاينة" })).not.toBeInTheDocument();
    expect(cart.getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" })).toBeInTheDocument();
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

  it("removes restaurant mode while preserving external payment status", async () => {
    const user = userEvent.setup();
    render(<PosWorkspace catalog={catalog} />);
    expect(screen.queryByRole("group", { name: "نوع طلب المطعم" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "محلي" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Keeta" }));
    expect(screen.getByRole("textbox", { name: "الرقم الخارجي لطلب التطبيق" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "كاش" }));
    expect(screen.getByRole("button", { name: "كاش" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "كاش" })).toHaveClass("border-primary");
    expect(screen.getByRole("button", { name: "مدفوع" })).not.toHaveClass("border-primary");
    expect(screen.getByText("الحالة المختارة: كاش")).toBeInTheDocument();
    expect(screen.getByText(/كاش التطبيقات لا يُضاف لدرج المطعم/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "المطعم" }));
    expect(screen.queryByRole("group", { name: "نوع طلب المطعم" })).not.toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" })).toBeDisabled();
    // A read-only Stage E quote can never unlock Stage F invoice creation.
    expect(screen.queryByRole("dialog", { name: /مراجعة الطلب وتأكيد الفاتورة/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "الدفع غير متاح في المعاينة" })).not.toBeInTheDocument();
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

  it("clears checkout-open intent when the quote disappears after a new menu publish", async () => {
    const user = userEvent.setup();
    const initialQuote = {
      revision: 1, currency: "SAR" as const, channel: "restaurant",
      lines: [{ productId: "water", name: "مياه", variantId: "bottle",
        variantLabel: "عبوة", quantity: 1, basePriceHalalas: 300, addons: [],
        unitPriceHalalas: 300, lineTotalHalalas: 300 }],
      itemCount: 1, provisionalSubtotalHalalas: 300,
      finalPayableHalalas: null, taxHalalas: null, discountHalalas: null,
      canCommit: false as const, note: "معاينة فقط",
    };
    vi.mocked(fetchPosQuote)
      .mockResolvedValueOnce(initialQuote)
      .mockResolvedValueOnce({
        ...initialQuote, revision: 2, provisionalSubtotalHalalas: 450,
        lines: [{ ...initialQuote.lines[0], basePriceHalalas: 450,
          unitPriceHalalas: 450, lineTotalHalalas: 450 }],
      });
    const view = render(<PosWorkspace catalog={catalog} />);
    await user.type(screen.getByRole("searchbox", { name: "ابحث عن صنف" }), "مياه");
    await user.click(screen.getByRole("button", { name: /مياه/ }));
    await user.click(screen.getByRole("button", { name: "مراجعة الأسعار من السيرفر" }));
    expect(await screen.findByRole("region", { name: "نتيجة تسعير السيرفر" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" })).toBeDisabled();

    view.rerender(<PosWorkspace catalog={{
      ...catalog, revision: 2,
      products: catalog.products.map((item) => item.id === "water" ? {
        ...item, variants: item.variants.map((variant) =>
          ({ ...variant, prices: { ...variant.prices, restaurant: 450 } })),
      } : item),
    }} />);
    const reprice = within(screen.getByRole("status", { name: "مراجعة اختلاف أسعار المنيو" }));
    expect(screen.queryByRole("dialog", { name: /مراجعة الطلب وتأكيد الفاتورة/ })).not.toBeInTheDocument();
    await user.click(reprice.getByRole("button", { name: "تأكيد الأسعار الجديدة" }));
    await user.click(screen.getByRole("button", { name: "مراجعة الأسعار من السيرفر" }));
    expect(await screen.findByRole("region", { name: "نتيجة تسعير السيرفر" })).toHaveTextContent("4.50");
    // The old open=true state must never restore the modal after re-quoting.
    expect(screen.queryByRole("dialog", { name: /مراجعة الطلب وتأكيد الفاتورة/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" })).toBeDisabled();
  });

  it("prompts with unavailable item names and never deletes without consent", async () => {
    const user = userEvent.setup();
    render(<PosWorkspace catalog={catalog} />);
    await user.type(screen.getByRole("searchbox"), "تكا");
    await user.click(screen.getByRole("button", { name: /دجاج تكا/ }));
    await user.click(screen.getByRole("button", { name: /200 جم/ }));
    await user.click(screen.getByRole("button", { name: /أضف للسلة/ }));
    const cart = within(screen.getByRole("complementary", { name: "السلة التجريبية" }));
    await user.click(screen.getByRole("button", { name: "Keeta" });
    const dialog = within(screen.getByRole("dialog", { name: "أصناف غير متاحة في القناة الجديدة" }));
    expect(dialog.getByText(/دجاج تكا.*200 جم/)).toBeInTheDocument();
    expect(cart.getByRole("listitem")).toHaveTextContent("دجاج تكا");
    await user.click(dialog.getByRole("button", { name: "ارجع إلى المطعم" }));
    expect(cart.getByRole("listitem")).toHaveTextContent("دجاج تكا");
    expect(screen.getByRole("button", { name: "المطعم" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Keeta" }));
    await user.click(screen.getByRole("button", { name: "احذف الأصناف غير المتاحة وكمّل" }));
    expect(cart.queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keeta" })).toHaveAttribute("aria-pressed", "true");
    await user.click(cart.getByRole("button", { name: "تراجع عن تحويل القناة" }));
    expect(cart.getByRole("listitem")).toHaveTextContent("دجاج تكا");
    expect(screen.getByRole("button", { name: "المطعم" })).toHaveAttribute("aria-pressed", "true");
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
    expect(await screen.findByText(/تم نشر منيو أحدث/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "الدفع غير متاح في المعاينة" })).not.toBeInTheDocument();
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
    const strip = within(screen.getByRole("group", { name: "قناة البيع" }));
    expect(strip.getAllByRole("button")).toHaveLength(4);
    expect(strip.queryByRole("button", { name: "قنوات أخرى" })).not.toBeInTheDocument();
    await user.click(strip.getByRole("button", { name: "تطبيق جديد" }));
    expect(screen.getByRole("group", { name: "قناة البيع" })).toHaveTextContent("تطبيق جديد");
    await user.type(screen.getByRole("searchbox"), "مياه");
    expect(screen.getByRole("button", { name: /مياه/ })).toHaveTextContent("6.50");
    await user.clear(screen.getByRole("searchbox"));
    expect(screen.queryByRole("button", { name: /دجاج بالزبدة/ })).not.toBeInTheDocument();
  });

  it("hides unpriced channels and unpriced product cards, while restaurant remains visible", async () => {
    const user = userEvent.setup();
    const channels = [
      { id: "fourth", label: "غير متاح" },
      { id: "keeta", label: "Keeta" },
      { id: "restaurant", label: "المطعم" },
      { id: "hungerstation", label: "HungerStation" },
    ];
    const products = catalog.products.map((product) => ({
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant, prices: { ...variant.prices, fourth: null,
          hungerstation: product.id === "water" ? 400 : null },
      })),
    }));
    const testCatalog = { ...catalog, channels, products };
    render(<PosWorkspace catalog={testCatalog} />);
    const strip = within(screen.getByRole("group", { name: "قناة البيع" }));
    expect(strip.queryByText("غير متاح")).not.toBeInTheDocument();
    expect(strip.getAllByRole("button").map((entry) => entry.textContent)).toEqual([
      "المطعم", "Keeta", "HungerStation",
    ]);
    await user.click(strip.getByRole("button", { name: "HungerStation" }));
    expect(screen.getByRole("button", { name: /مياه/ })).toHaveTextContent("4.00");
    expect(screen.queryByRole("button", { name: /دجاج تكا/ })).not.toBeInTheDocument();
  });

  it("remembers a selected channel locally and falls back to restaurant if unpriced", async () => {
    const user = userEvent.setup();
    const first = render(<PosWorkspace catalog={catalog} />);
    await user.click(screen.getByRole("button", { name: "Keeta" }));
    first.unmount();
    const next = render(<PosWorkspace catalog={catalog} />);
    expect(screen.getByRole("button", { name: "Keeta" })).toHaveAttribute("aria-pressed", "true");
    next.unmount();
    render(<PosWorkspace catalog={{ ...catalog, channels: [
      { id: "restaurant", label: "المطعم" }, { id: "keeta", label: "Keeta" },
    ], products: catalog.products.map((item) => ({ ...item, variants: item.variants.map((variant) => ({
      ...variant, prices: { ...variant.prices, keeta: null },
    })) })) }} />);
    expect(screen.getByLabelText("القناة الوحيدة: المطعم")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Keeta" })).not.toBeInTheDocument();
    expect(screen.getByText("سلة المطعم")).toBeInTheDocument();
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
    const footerAction = within(cart).getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" });
    expect(footerAction).toHaveClass("min-h-14");
    expect(within(cart).queryByRole("button", { name: "الدفع غير متاح في المعاينة" }))
      .not.toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: "الدفع غير متاح في المعاينة" })).not.toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: "الدفع غير متاح في المعاينة" })).not.toBeInTheDocument();
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

  it("automatically refreshes app-channel prices without pressing the manual review button", async () => {
    vi.mocked(fetchPosQuote).mockReset();
    vi.mocked(fetchPosQuote).mockResolvedValue({
      revision: 1, currency: "SAR", channel: "hungerstation",
      lines: [{
        productId: "water", name: "مياه", variantId: "bottle", variantLabel: "عبوة",
        quantity: 1, basePriceHalalas: 400, addons: [],
        unitPriceHalalas: 400, lineTotalHalalas: 400,
      }],
      itemCount: 1, provisionalSubtotalHalalas: 400,
      finalPayableHalalas: null, taxHalalas: null, discountHalalas: null,
      canCommit: false, note: "مراجعة السعر",
    });
    const user = userEvent.setup();
    render(<PosWorkspace catalog={catalog} />);
    await user.click(screen.getByRole("button", { name: "HungerStation" }));
    await user.type(screen.getByRole("searchbox", { name: "ابحث عن صنف" }), "مياه");
    await user.click(within(screen.getByRole("region", { name: "الكتالوج التجريبي" }))
      .getByRole("button", { name: /مياه/ }));
    const quote = within(await screen.findByRole("region", { name: "نتيجة تسعير السيرفر" }));
    expect(quote.getByText(/4\.00/)).toBeInTheDocument();
    expect(fetchPosQuote).toHaveBeenCalledWith({
      revision: 1, channel: "hungerstation",
      items: [{ productId: "water", variantId: "bottle", quantity: 1, addonIds: [] }],
    });
    const payment = within(screen.getByRole("group", { name: "حالة دفع طلب التطبيق" }));
    expect(payment.getByRole("button", { name: "مدفوع" })).toHaveClass("border-primary");
    expect(payment.getByRole("button", { name: "كاش" })).not.toHaveClass("border-primary");
  });

});
