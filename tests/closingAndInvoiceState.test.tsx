// @vitest-environment jsdom
import { Suspense } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
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
vi.mock("@/utils/ksaDate", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils/ksaDate")>()),
  getTodayKSADate: () => "2026-11-08",
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
    closingVersion: "LEGACY_V1", calculationMode: "legacy_calculate_closing",
    requiresReason: false, reasonCodes: [],
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
    expect(screen.getByLabelText("مبيعات المطعم — يدوي")).toHaveValue(100)
  );
  fireEvent.change(screen.getByLabelText("مبيعات المطعم — يدوي"), {
    target: { value: "125.00" },
  });
  expect(screen.getByLabelText("مبيعات هنجرستيشن — يدوي")).toHaveValue(200);
  expect(screen.getByLabelText("مبيعات كيتا — يدوي")).toHaveValue(300);
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

it("uses server POS totals on 2026-11-08 and shows zero reconciliation when cash/network match", async () => {
  const amountDigits = (halalas: number) => new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(halalas / 100);
  const expected = {
    cashHalalas: 150965,
    networkHalalas: 335240,
    appReceivableHalalas: 7600,
    totalHalalas: 493805,
  };
  const view = {
    businessDate: "2026-11-08",
    status: "draft",
    closingVersion: "POS_V2", calculationMode: "pos_expected_totals",
    requiresReason: true, reasonCodes: ["CASH_DIFFERENCE", "NETWORK_DIFFERENCE"],
    channels: {
      restaurantHalala: 990000,
      hungerstationHalala: 88000,
      keetaHalala: 77000,
      other: [],
    },
    collections: { cashHalala: 0, cardHalala: 0 },
    confirmedSubscriptionCount: null,
    discrepancyReason: "",
    notes: "",
    history: [],
    automatic: {
      count: 0, amountHalala: 12345, cashHalala: 1, cardHalala: 1,
      moyasarHalala: 0, unknownHalala: 0, rows: [],
    },
    summary: {},
    expectedTotals: {
      businessDate: "2026-11-08",
      pos: {
        invoiceCount: 13, refundCount: 2,
        grossHalalas: 68805, refundsHalalas: 5000, netHalalas: 63805,
        restaurantCashHalalas: 30965, restaurantNetworkHalalas: 25240,
        restaurantExternalRefundHalalas: 0,
        appReceivableByChannelHalalas: { hungerstation: 3600, keeta: 4000 },
        unresolvedRefundInvoiceCount: 0,
      },
      subscriptions: {
        paymentCount: 2, cashHalalas: 120000, visaHalalas: 310000,
      },
      expected,
    },
    reconciliation: {
      countedCashHalala: 0, countedNetworkHalala: 0,
      expectedCashHalala: expected.cashHalalas,
      expectedNetworkHalala: expected.networkHalalas,
      expectedAppReceivableHalala: expected.appReceivableHalalas,
      cashDifferenceHalala: -expected.cashHalalas,
      networkDifferenceHalala: -expected.networkHalalas,
      localDifferenceHalala: -(expected.cashHalalas + expected.networkHalalas),
    },
  };
  api.get.mockResolvedValue({ data: { status: true, data: view } });
  await Route.options.component?.preload?.();
  const Page = Route.options.component! as React.ComponentType;
  await act(async () => {
    mount(<Suspense fallback={<div>Loading closing</div>}><Page /></Suspense>);
  });
  await waitFor(() => expect(api.get).toHaveBeenCalledWith(
    "/api/dashboard/daily-closings/2026-11-08"
  ));
  const totals = await screen.findByLabelText("التوقعات والتسوية المالية");
  expect(totals).toHaveTextContent(amountDigits(150965));
  expect(totals).toHaveTextContent(amountDigits(335240));
  expect(totals).toHaveTextContent(amountDigits(7600));
  expect(totals).toHaveTextContent(amountDigits(493805));

  const pos = screen.getByLabelText("مبيعات POS المحسوبة من النظام");
  expect(within(pos).getByText("عدد فواتير الكاشير")).toBeInTheDocument();
  expect(within(pos).getByText("13")).toBeInTheDocument();
  expect(pos).toHaveTextContent(amountDigits(63805));
  const apps = screen.getByLabelText("مستحقات التطبيقات من POS");
  expect(within(apps).getByText("هنجرستيشن")).toBeInTheDocument();
  expect(within(apps).getByText("كيتا")).toBeInTheDocument();
  expect(apps).toHaveTextContent(amountDigits(3600));
  expect(apps).toHaveTextContent(amountDigits(4000));
  const subscriptions = screen.getByLabelText("تحصيل الاشتراكات حسب طريقة الدفع");
  expect(subscriptions).toHaveTextContent(amountDigits(120000));
  expect(subscriptions).toHaveTextContent(amountDigits(310000));

  fireEvent.change(screen.getByLabelText("المدفوع كاش"), { target: { value: "1509.65" } });
  fireEvent.change(screen.getByLabelText("المدفوع شبكة"), { target: { value: "3352.40" } });
  const differenceLine = within(totals).getByText("الفرق").parentElement!;
  expect(differenceLine).toHaveTextContent(amountDigits(0));
  expect(within(totals).getByText("فرق الكاش (المعدود − المتوقع)").parentElement).toHaveTextContent(amountDigits(0));
  expect(within(totals).getByText("فرق الشبكة (المعدود − المتوقع)").parentElement).toHaveTextContent(amountDigits(0));

  // POS_V2 must never offer manual overrides for the three POS-managed channels.
  expect(screen.queryByLabelText("مبيعات المطعم — يدوي")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("مبيعات هنجرستيشن — يدوي")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("مبيعات كيتا — يدوي")).not.toBeInTheDocument();
  expect(screen.getByLabelText("أسباب الفرق من السيرفر")).toHaveTextContent("فرق بين الكاش المعدود وكاش النظام");
  expect(screen.getByLabelText("أسباب الفرق من السيرفر")).toHaveTextContent("فرق بين الشبكة المعدودة والشبكة المسجلة");
  expect(within(totals).getByText("الفرق").parentElement).toHaveTextContent(amountDigits(0));
  fireEvent.change(screen.getByLabelText("المدفوع شبكة"), { target: { value: "3352.39" } });
  const shortage = within(totals).getByText("الفرق").parentElement!;
  expect(shortage).toHaveTextContent(amountDigits(1));
  expect(shortage.textContent).toContain("-");
  api.put.mockResolvedValue({ data: { data: view } });
  fireEvent.click(screen.getByRole("button", { name: /حفظ مسودة/ }));
  await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
  expect(api.put.mock.calls[0][1].channels).toEqual({ other: [] });
});

it("does not silently use old local totals when expectedTotals is absent", async () => {
  api.get.mockResolvedValue({ data: { data: {
    businessDate: "2026-11-08",
    status: "new",
    closingVersion: "POS_V2", calculationMode: "pos_expected_totals",
    requiresReason: false, reasonCodes: [],
    channels: { restaurantHalala: 0, hungerstationHalala: 0, keetaHalala: 0, other: [] },
    collections: { cashHalala: 0, cardHalala: 0 },
    confirmedSubscriptionCount: null,
    discrepancyReason: "",
    notes: "",
    history: [],
    automatic: { count: 0, amountHalala: 0, cashHalala: 0, cardHalala: 0, moyasarHalala: 0, unknownHalala: 0, rows: [] },
    summary: {},
  } } });
  await Route.options.component?.preload?.();
  const Page = Route.options.component! as React.ComponentType;
  await act(async () => mount(<Suspense fallback={<div>Loading closing</div>}><Page /></Suspense>));
  await waitFor(() => expect(screen.getAllByRole("alert").some(
    element => element.textContent?.includes("expectedTotals")
  )).toBe(true));
  expect(screen.getByRole("button", { name: /حفظ وإرسال/ })).toBeDisabled();
});
