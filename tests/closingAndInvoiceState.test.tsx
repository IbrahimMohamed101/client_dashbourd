// @vitest-environment jsdom
import { Suspense } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Route } from "../src/routes/_protected/daily-closing/index";
import { SubscriptionInvoiceDialog } from "../src/components/pages/subscriptions/invoice/SubscriptionInvoiceDialog";
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }));
vi.mock("@/lib/apis", () => ({ default: api }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "superadmin" } }),
}));
afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());
function mount(element: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const wrap = (ui: React.ReactElement) => (
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
  const result = render(wrap(element));
  return {
    client,
    ...result,
    changeView: (ui: React.ReactElement) => result.rerender(wrap(ui)),
  };
}
it("preserves hydrated closing values when editing one field and saving the draft", async () => {
  const view = {
    businessDate: "2026-10-31",
    status: "draft",
    channels: {
      restaurantHalala: 10000,
      hungerstationHalala: 20000,
      keetaHalala: 30000,
      other: [],
    },
    collections: { cashHalala: 40000, cardHalala: 50000 },
    confirmedSubscriptionCount: null,
    discrepancyReason: "",
    notes: "ملاحظة صناعية",
    history: [],
    automatic: {
      count: 0,
      amountHalala: 0,
      cashHalala: 0,
      cardHalala: 0,
      moyasarHalala: 0,
      unknownHalala: 0,
      rows: [],
    },
    summary: {},
  };
  api.get.mockResolvedValue({ data: { data: view } });
  api.put.mockResolvedValue({ data: { data: view } });
  // Await the route's real split module before starting UI assertions.
  await Route.options.component?.preload?.();
  const Page = Route.options.component! as React.ComponentType;
  await act(async () => {
    mount(
      <Suspense fallback={<div>Loading closing</div>}>
        <Page />
      </Suspense>
    );
  });
  await waitFor(() =>
    expect(screen.getByLabelText("مبيعات المطعم")).toHaveValue(100)
  );
  fireEvent.change(screen.getByLabelText("مبيعات المطعم"), {
    target: { value: "125.00" },
  });
  expect(screen.getByLabelText("مبيعات هنجرستيشن")).toHaveValue(200);
  expect(screen.getByLabelText("مبيعات كيتا")).toHaveValue(300);
  fireEvent.click(screen.getByRole("button", { name: /حفظ مسودة/ }));
  await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
  expect(api.put.mock.calls[0][1]).toMatchObject({
    channels: {
      restaurantHalala: 12500,
      hungerstationHalala: 20000,
      keetaHalala: 30000,
      other: [],
    },
    collections: { cashHalala: 40000, cardHalala: 50000 },
    notes: "ملاحظة صناعية",
  });
  expect(api.post).not.toHaveBeenCalled();
});
it("clears invoice errors between customers and removes closed invoice cache", async () => {
  api.get.mockRejectedValue(new Error("Synthetic invoice unavailable"));
  const ui = mount(
    <SubscriptionInvoiceDialog
      subscriptionId="sub-a"
      open
      onOpenChange={vi.fn()}
    />
  );
  await screen.findByText("Synthetic invoice unavailable");
  ui.changeView(
    <SubscriptionInvoiceDialog
      subscriptionId="sub-a"
      open={false}
      onOpenChange={vi.fn()}
    />
  );
  await waitFor(() =>
    expect(ui.client.getQueryCache().getAll()).toHaveLength(0)
  );
  let release: (value: unknown) => void = () => undefined;
  api.get.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = resolve;
      })
  );
  ui.changeView(
    <SubscriptionInvoiceDialog
      subscriptionId="sub-b"
      open
      onOpenChange={vi.fn()}
    />
  );
  expect(
    screen.queryByText("Synthetic invoice unavailable")
  ).not.toBeInTheDocument();
  await waitFor(() =>
    expect(api.get).toHaveBeenLastCalledWith(
      "/api/dashboard/subscriptions/sub-b/invoice",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  );
  ui.changeView(
    <SubscriptionInvoiceDialog
      subscriptionId="sub-b"
      open={false}
      onOpenChange={vi.fn()}
    />
  );
  release({ data: { data: null } });
});
