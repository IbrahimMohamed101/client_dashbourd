// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveRetentionPage } from "./LiveRetentionPage";
import { RetentionFollowupDialog } from "./RetentionFollowupDialog";

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("@/lib/apis", () => ({ default: api }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));
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
