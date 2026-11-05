// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PosWorkspace } from "./PosWorkspace";
import { categories, previewProducts } from "./previewCatalog";
import { fetchPosQuote } from "./quoteApi";

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
    expect(options.getByRole("button", { name: /أضف للسلة/ })).toBeDisabled();
    await user.click(options.getByRole("button", { name: /150 جم/ }));
    await user.click(options.getByRole("button", { name: /زيادة دجاج/ }));
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
    const mode = screen.getByRole("combobox", { name: "نوع طلب المطعم" });
    expect(mode).toHaveValue("takeaway");
    await user.selectOptions(mode, "dine-in");
    expect(mode).toHaveValue("dine-in");

    await user.click(screen.getByRole("button", { name: "Keeta" }));
    expect(screen.getByRole("textbox", { name: "الرقم الخارجي لطلب التطبيق" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "كاش" }));
    expect(screen.getByRole("button", { name: "كاش" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/كاش التطبيقات لا يُضاف لدرج المطعم/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "المطعم" }));
    expect(screen.getByRole("combobox", { name: "نوع طلب المطعم" })).toHaveValue("dine-in");
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
    expect(screen.getByRole("button", { name: "الدفع غير متاح في المعاينة" })).toBeDisabled();
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
    await user.click(screen.getByRole("button", { name: "تطبيق جديد" }));
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
});
