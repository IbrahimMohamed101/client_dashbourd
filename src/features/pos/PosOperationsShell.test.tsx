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
  Link: forwardRef<HTMLAnchorElement, { to: string; children: ReactNode; search?: unknown }>(
    ({ to, children, search: _search, ...props }, ref) => {
      void _search;
      return <a href={to} ref={ref} {...props}>{children}</a>;
    },
  ),
}));

vi.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>القائمة</button>
  ),
}));

vi.mock("./financialApi", () => ({ listPosSales: vi.fn().mockResolvedValue([]) }));
vi.mock("@/components/pages/subscriptions/create/CreateSubscriptionFormContent", () => ({
  CreateSubscriptionFormContent: ({ allowedPaymentMethods }: { allowedPaymentMethods?: readonly string[] }) =>
    <div data-testid="existing-subscription-form" data-allowed-methods={allowedPaymentMethods?.join(",") ?? "all"} />,
}));
vi.mock("@/components/pages/manual-deduction/ManualDeductionPage", () => ({
  default: () => <div data-testid="existing-manual-deduction" />,
}));
vi.mock("@/components/pages/users/create-user-form", () => ({
  CreateUserForm: () => <div data-testid="existing-user-form" />,
}));

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
  it("opens with a real POS catalog and presents the active sale review action", async () => {
    render(<PosOperationsShell catalog={catalog} />);
    expect(screen.getByRole("navigation", { name: "أقسام نقطة البيع" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "ابحث عن صنف" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "الدفع غير متاح في المعاينة" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "مراجعة الطلب قبل الفاتورة" })).toBeInTheDocument();
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

  it("uses existing subscription/deduction components and keeps cashier permissions", async () => {
    const user = userEvent.setup();
    render(<PosOperationsShell catalog={catalog} />);
    await user.click(screen.getByRole("button", { name: "أقسام نقطة البيع" }));
    expect(screen.getByRole("menuitem", { name: "لوحة العمليات الحالية" }))
      .toHaveAttribute("href", "/operations");
    await user.click(screen.getByRole("menuitem", { name: "الاشتراكات" }));
    expect(screen.getByTestId("existing-subscription-form")).toHaveAttribute("data-allowed-methods", "all");
    expect(screen.queryByText(/فيزا تحتاج دور المطعم أو الإدارة/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إنشاء مستخدم سريع" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "كل الاشتراكات" }))
      .toHaveAttribute("href", "/subscriptions");
    await user.click(screen.getByRole("button", { name: "خصم وجبات المشترك" }));
    expect(screen.getByTestId("existing-manual-deduction")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "إنشاء مستخدم سريع" }));
    expect(screen.getByTestId("existing-user-form")).toBeInTheDocument();
  });

  it("opens the existing daily closing workflow instead of duplicating its form", async () => {
    const user = userEvent.setup();
    render(<PosOperationsShell catalog={catalog} />);
    await user.click(screen.getByRole("button", { name: "أقسام نقطة البيع" }));
    await user.click(screen.getByRole("menuitem", { name: "التقفيلة اليومية" }));
    expect(screen.getByRole("link", { name: "فتح تقفيلة اليوم الحالية" }))
      .toHaveAttribute("href", "/daily-closing");
    expect(screen.queryByRole("button", { name: "مراجعة وإغلاق التقفيلة" }))
      .not.toBeInTheDocument();
  });
});
