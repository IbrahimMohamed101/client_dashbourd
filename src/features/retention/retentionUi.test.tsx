// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveRetentionPage } from "./LiveRetentionPage";
import { RetentionFollowupDialog } from "./RetentionFollowupDialog";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("@/lib/apis", () => ({ default: api }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}));
const customer = { id: "synthetic-user", name: "عميل صناعي", blocked: false };
const live = {
  mode: "live_operational_preview", asOf: "2026-10-31T15:00:53Z", warnings: [],
  totals: { all: 1, active: 1 }, pagination: { page: 1, pageSize: 20, total: 1 },
  rows: [{ userId: customer.id, name: customer.name, phone: "synthetic", status: "active", doNotContact: false,
    remainingAndReserved: 5, lastRecordedAt: "2026-10-01T00:00:00Z" }],
};
function mount(element: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{element}</QueryClientProvider>);
}
afterEach(cleanup);
beforeEach(() => { vi.resetAllMocks(); });
describe("retention UI safety", () => {
  it("offers a safe WhatsApp chat for a Saudi mobile number", async () => {
    api.get.mockResolvedValue({ data: { data: {
      ...live, rows: [{ ...live.rows[0], phone: "0551234567" }],
    } } });
    mount(<LiveRetentionPage />);
    const link = await screen.findByRole("link", { name: "فتح واتساب مع عميل صناعي" });
    expect(screen.getByText("+966 55 123 4567")).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://wa.me/966551234567");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("table").closest('[data-slot="card"]')).toHaveClass("overflow-visible");
  });
  it("hides cached customer data after a failed live refresh", async () => {
    api.get.mockResolvedValueOnce({ data: { data: live } }).mockRejectedValue(new Error("unavailable"));
    mount(<LiveRetentionPage />);
    await screen.findByText(customer.name);
    fireEvent.click(screen.getByRole("button", { name: /تحديث البيانات/ }));
    await screen.findByRole("alert", {}, { timeout: 4000 });
    expect(screen.queryByText(customer.name)).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("never substitutes historical totals for an unavailable live endpoint", async () => {
    api.get.mockRejectedValue(new Error("unavailable"));
    mount(<LiveRetentionPage />);
    await screen.findByRole("alert", {}, { timeout: 4000 });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("190")).not.toBeInTheDocument();
  });
  it("shows the last recorded follow-up and visually distinct overdue priority", async () => {
    api.get.mockResolvedValue({ data: { data: {
      ...live, totals: { all: 1, overdue_14: 1 }, rows: [{
        ...live.rows[0], status: "overdue_14", dueDate: "2026-10-01",
        latestFollowup: {
          createdAt: "2026-10-20T10:00:00Z", outcome: "callback_requested",
          channel: "phone", actor: "staff@example.com",
        },
      }],
    } } });
    mount(<LiveRetentionPage />);
    await screen.findByText("staff@example.com");
    expect(screen.getAllByText("بعد مهلة 14 يومًا").length).toBeGreaterThan(0);
    expect(screen.getByText(/متأخر 30 يوم/)).toBeInTheDocument();
    expect(screen.getByText("طلب معاودة الاتصال")).toBeInTheDocument();
  });
  it("can navigate to page two using server-side pagination", async () => {
    api.get.mockImplementation((_url, config) => {
      const page = config?.params?.page || 1;
      return Promise.resolve({ data: { data: {
        ...live, pagination: { page, pageSize: 20, total: 21 }, rows: [{
          ...live.rows[0], userId: page === 2 ? "page-two" : "page-one",
          name: page === 2 ? "Second Customer" : "First Customer",
        }],
      } } });
    });
    mount(<LiveRetentionPage />);
    await screen.findByText("First Customer");
    fireEvent.click(screen.getAllByRole("button", { name: /التالي/ })[0]);
    await screen.findByText("Second Customer");
    expect(screen.queryByText("First Customer")).not.toBeInTheDocument();
  });
  it("blocks submission when follow-up history cannot be checked", async () => {
    api.get.mockRejectedValue(new Error("unavailable"));
    mount(<RetentionFollowupDialog customer={customer} onClose={vi.fn()} />);
    await screen.findByText("تعذر تحميل سجل المتابعة.");
    expect(screen.getByRole("button", { name: "حفظ المتابعة" })).toBeDisabled();
    expect(api.post).not.toHaveBeenCalled();
  });
  it("honors the durable list-level opt-out even outside recent history", async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    mount(<RetentionFollowupDialog customer={{ ...customer, blocked: true }} onClose={vi.fn()} />);
    await screen.findByText(/العميل طلب عدم التواصل/);
    expect(screen.getByRole("button", { name: "حفظ المتابعة" })).toBeDisabled();
    expect(api.post).not.toHaveBeenCalled();
  });
  it("reuses the request identity after an ambiguous failure and prevents resubmitting a saved event", async () => {
    api.get.mockResolvedValue({ data: { data: [] } });
    api.post.mockRejectedValueOnce(new Error("response lost")).mockResolvedValueOnce({ data: {} });
    mount(<RetentionFollowupDialog customer={customer} onClose={vi.fn()} />);
    await screen.findByText("لم تُسجل متابعة سابقة.");
    fireEvent.change(screen.getByLabelText("ملاحظات الموظف (بدون بيانات حساسة)"), { target: { value: "سبب صناعي" } });
    fireEvent.click(screen.getByRole("button", { name: "حفظ المتابعة" }));
    await screen.findByRole("alert", {}, { timeout: 4000 });
    fireEvent.click(screen.getByRole("button", { name: "حفظ المتابعة" }));
    await screen.findByRole("status");
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(api.post.mock.calls[0][1]).toEqual(api.post.mock.calls[1][1]);
    await waitFor(() => expect(screen.getByRole("button", { name: "حفظ المتابعة" })).toBeDisabled());
  });
});
