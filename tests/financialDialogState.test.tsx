// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CancelModal } from "../src/components/pages/subscriptions/details/modals/cancel-modal";
import { RefundSettlementModal } from "../src/components/pages/subscriptions/details/modals/refund-settlement-modal";
const mock = vi.hoisted(() => ({
  role: "superadmin",
  preview: vi.fn(),
  execute: vi.fn(),
  settle: vi.fn(),
  legacyCancel: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: mock.role } }),
}));
vi.mock("@/hooks/useSubscriptionsQuery", () => ({
  useCancelSubscriptionMutation: () => ({
    mutateAsync: mock.legacyCancel,
    isPending: false,
  }),
}));
vi.mock(
  "@/features/subscription-financial-control/subscriptionFinancialControlApi",
  () => ({
    fetchFinancialControlPreview: mock.preview,
    executeFinancialControl: mock.execute,
    settleRefund: mock.settle,
  })
);
const preview = {
  subscription: { id: "synthetic-subscription", status: "active" },
  canCancel: true,
  totalRefundableHalala: 30000,
  pendingSettlementHalala: 20000,
  refundChannels: ["moyasar", "cash", "bank_transfer"],
  payments: [
    { paymentId: "payment-a", refundableHalala: 10000 },
    { paymentId: "payment-b", refundableHalala: 20000 },
    { paymentId: "payment-empty", refundableHalala: 0 },
  ],
  refunds: [
    {
      id: "refund-a",
      executionMode: "recorded_only",
      amountHalala: 10000,
      refundChannel: "cash",
      settlement: { status: "pending" },
    },
    {
      id: "refund-b",
      executionMode: "recorded_only",
      amountHalala: 10000,
      refundChannel: "bank_transfer",
      settlement: { status: "pending" },
    },
    {
      id: "refund-settled",
      executionMode: "recorded_only",
      amountHalala: 10000,
      refundChannel: "cash",
      settlement: { status: "settled" },
    },
  ],
};
function mount(element: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrap = (ui: React.ReactElement) => (
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
  const renderResult = render(wrap(element));
  return {
    ...renderResult,
    rerenderDialog: (ui: React.ReactElement) => renderResult.rerender(wrap(ui)),
  };
}
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mock.role = "superadmin";
  mock.preview.mockResolvedValue(preview);
  mock.execute.mockResolvedValue({});
});
it("keeps payment identity, confirmation and form state scoped to each cancellation dialog", async () => {
  const props = { subscriptionId: "sub-a", isOpen: true, onClose: vi.fn() };
  const ui = mount(<CancelModal {...props} />);
  await screen.findByText("إلغاء فقط");
  fireEvent.click(screen.getByRole("button", { name: "استرجاع محاسبي فقط" }));
  const payment = screen.getAllByRole("combobox")[0];
  expect(payment).toHaveValue("payment-a");
  fireEvent.change(payment, { target: { value: "payment-b" } });
  fireEvent.change(
    screen.getByPlaceholderText(
      "مثال: طلب العميل إلغاء الاشتراك واسترجاع المتبقي"
    ),
    { target: { value: "سبب اختبار صناعي" } }
  );
  expect(
    screen.getByRole("button", { name: "تأكيد التسجيل المحاسبي" })
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "تأكيد التسجيل المحاسبي" })
  );
  await waitFor(() => expect(mock.execute).toHaveBeenCalledTimes(1));
  expect(mock.execute.mock.calls[0]).toEqual([
    "sub-a",
    expect.objectContaining({
      paymentId: "payment-b",
      action: "refund",
      refundMode: "full",
      reason: "سبب اختبار صناعي",
    }),
  ]);
  const previousKey = mock.execute.mock.calls[0][1].operationKey;
  ui.rerenderDialog(<CancelModal {...props} isOpen={false} />);
  ui.rerenderDialog(<CancelModal {...props} subscriptionId="sub-b" />);
  await screen.findByText("إلغاء فقط");
  expect(
    screen.getByPlaceholderText(
      "مثال: طلب العميل إلغاء الاشتراك واسترجاع المتبقي"
    )
  ).toHaveValue("");
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "استرجاع محاسبي فقط" }));
  expect(screen.getAllByRole("combobox")[0]).toHaveValue("payment-a");
  fireEvent.change(
    screen.getByPlaceholderText(
      "مثال: طلب العميل إلغاء الاشتراك واسترجاع المتبقي"
    ),
    { target: { value: "سبب جديد" } }
  );
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "تأكيد التسجيل المحاسبي" })
  );
  await waitFor(() => expect(mock.execute).toHaveBeenCalledTimes(2));
  expect(mock.execute.mock.calls[1][0]).toBe("sub-b");
  expect(mock.execute.mock.calls[1][1].operationKey).not.toBe(previousKey);
});
it("uses the selected refund's channel and clears stale confirmation on switches", async () => {
  mount(
    <RefundSettlementModal subscriptionId="sub-a" isOpen onClose={vi.fn()} />
  );
  await screen.findByRole("option", { name: "كاش", exact: true });
  const [refund, method] = screen.getAllByRole("combobox");
  expect(refund).toHaveValue("refund-a");
  expect(method).toHaveValue("cash");
  fireEvent.change(method, { target: { value: "moyasar" } });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.change(refund, { target: { value: "refund-b" } });
  expect(method).toHaveValue("bank_transfer");
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  fireEvent.change(refund, { target: { value: "refund-a" } });
  expect(method).toHaveValue("cash");
  expect(mock.settle).not.toHaveBeenCalled();
  expect(refund.querySelector('option[value="refund-settled"]')).toBeNull();
});
it("keeps financial controls hidden from non-superadmins", () => {
  mock.role = "admin";
  mount(<CancelModal subscriptionId="sub-a" isOpen onClose={vi.fn()} />);
  expect(
    screen.queryByRole("button", { name: "استرجاع محاسبي فقط" })
  ).not.toBeInTheDocument();
  expect(mock.preview).not.toHaveBeenCalled();
  expect(mock.execute).not.toHaveBeenCalled();
});
