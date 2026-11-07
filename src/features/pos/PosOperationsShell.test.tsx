// @vitest-environment jsdom
import { forwardRef, type ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PosOperationsShell } from "./PosOperationsShell";
import { categories, previewProducts } from "./previewCatalog";

// This shell test does not mount a real TanStack Router. Use an anchor for
// its navigation link while route-authorization tests verify the true router.
vi.mock("@tanstack/react-router", () => ({
  Link: forwardRef<HTMLAnchorElement, { to: string; children: ReactNode }>(
    ({ to, children, ...props }, ref) => (
      <a href={to} ref={ref} {...props}>{children}</a>
    ),
  ),
}));

vi.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>القائمة</button>
  ),
}));

vi.mock("./financialApi", () => ({ listPosSales: vi.fn().mockResolvedValue([]) }));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { role: "cashier", name: "", email: "branch-cashier@synthetic.example.test" },
  }),
}));

const catalog = {
  revision: 3,
  categories: [...categories],
  products: previewProducts,
};

describe("POS operations dashboard Staging shell", () => {
  it("opens with a real POS catalog and never exposes a payment write", async () => {
    render(<PosOperationsShell catalog={catalog} />);
    expect(screen.getByRole("navigation", { name: "أقسام نقطة البيع" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "ابحث عن صنف" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "الدفع غير متاح في المعاينة" })).toBeDisabled();
    expect(screen.getByText("branch-cashier")).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "أقسام نقطة البيع" }));
    expect(screen.getByRole("menuitem", { name: /منيو الكاشير والأسعار/ }))
      .toHaveAttribute("href", "/pos/menu");
  });

  it("uses the published catalog for overview numbers and no fabricated sales", async () => {
    const user = userEvent.setup();
    render(<PosOperationsShell catalog={catalog} />);
    await user.click(screen.getByRole("button", { name: "أقسام نقطة البيع" }));
    await user.click(screen.getByRole("menuitem", { name: "نظرة عامة" }));
    expect(screen.getByText("ملخص نقطة البيع")).toBeInTheDocument();
    expect(screen.getAllByText(String(catalog.products.length)).length).toBeGreaterThan(0);
    expect(screen.getByText(/لا يتم حساب صافي المبيعات/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ابدأ طلبًا جديدًا" }));
    expect(screen.getByRole("searchbox", { name: "ابحث عن صنف" })).toBeInTheDocument();
  });

  it("shows actual Staging invoice history filters without inventing invoices", async () => {
    const user = userEvent.setup();
    render(<PosOperationsShell catalog={catalog} />);
    await user.click(screen.getByRole("button", { name: "أقسام نقطة البيع" }));
    await user.click(screen.getByRole("menuitem", { name: "الطلبات والفواتير" }));
    const section = within(screen.getByRole("region", { name: "الطلبات والفواتير" }));
    await user.type(section.getByRole("searchbox", { name: "بحث الفواتير" }), "K-123");
    expect(section.getByRole("searchbox", { name: "بحث الفواتير" })).toHaveValue("K-123");
    await user.selectOptions(section.getByRole("combobox", { name: "قناة الفواتير" }), "keeta");
    expect(section.getByRole("combobox", { name: "قناة الفواتير" })).toHaveValue("keeta");
    expect(await section.findByText(/لا توجد فواتير مطابقة على Staging/)).toBeInTheDocument();
    expect(section.getByRole("button", { name: "تحديث" })).toBeEnabled();
  });

  it("allows subscription package selection but blocks unauthorized paid renewal", async () => {
    const user = userEvent.setup();
    render(<PosOperationsShell catalog={catalog} />);
    await user.click(screen.getByRole("button", { name: "أقسام نقطة البيع" }));
    await user.click(screen.getByRole("menuitem", { name: "الاشتراكات" }));
    await user.click(screen.getByRole("button", { name: "تجديد" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "مدة الباقة" }), "30");
    await user.selectOptions(screen.getByRole("combobox", { name: "وزن البروتين" }), "200");
    expect(screen.getByText(/30 يومًا · 200 جم/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "الاستعلام عن السعر وإكمال الاشتراك" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "خصم وجبة" }));
    expect(screen.getByRole("button", { name: "تأكيد خصم وجبة" })).toBeDisabled();
  });

  it("can enter close counts for review without submitting or storing a close", async () => {
    const user = userEvent.setup();
    render(<PosOperationsShell catalog={catalog} />);
    await user.click(screen.getByRole("button", { name: "أقسام نقطة البيع" }));
    await user.click(screen.getByRole("menuitem", { name: "التقفيلة اليومية" }));
    await user.type(screen.getByRole("textbox", { name: "النقدية المعدودة" }), "500.25");
    expect(screen.getByRole("textbox", { name: "النقدية المعدودة" })).toHaveValue("500.25");
    expect(screen.getByRole("button", { name: "مراجعة وإغلاق التقفيلة" })).toBeDisabled();
    expect(screen.getByText(/في الذاكرة المؤقتة للواجهة فقط/)).toBeInTheDocument();
  });
});
