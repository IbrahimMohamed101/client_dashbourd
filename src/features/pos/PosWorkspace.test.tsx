// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PosWorkspace } from "./PosWorkspace";
import { categories, previewProducts } from "./previewCatalog";

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

  it("stops mixing prices when a new catalog is published during a sale preview", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PosWorkspace catalog={catalog} />);
    await user.type(screen.getByRole("searchbox"), "مياه");
    await user.click(screen.getByRole("button", { name: /مياه/ }));
    rerender(<PosWorkspace catalog={{ ...catalog, revision: 2 }} />);
    expect(screen.getByText(/اتنشر منيو جديد/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /مياه/ })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "ابدأ سلة جديدة" }));
    expect(screen.getByRole("button", { name: /مياه/ })).toBeEnabled();
  });
});
