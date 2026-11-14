// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PosRefundDialog } from "./PosRefundDialog";
import { refundDefaultMethod } from "./posRefundMethods";
import { PosInvoiceHistory } from "./PosInvoiceHistory";
import { listPosRefunds, listPosSales, type PosInvoice } from "./financialApi";
import type { PublishedPosCatalog } from "./catalogApi";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "synthetic-operator" } }),
}));
vi.mock("./financialApi", () => ({
  listPosRefunds: vi.fn(),
  listPosSales: vi.fn(),
  recordPosRefund: vi.fn(), getPosRefund: vi.fn(),
  getPosOperation: vi.fn(), getActivePosOperation: vi.fn(), abandonPosOperation: vi.fn(),
}));
vi.mock("./PosInvoiceReceipt", () => ({
  PosInvoiceReceipt: () => <div data-testid="invoice-receipt" />,
  PosCreditNoteReceipt: () => <div data-testid="credit-note-receipt" />,
}));

const invoice = {
  _id: "synthetic-invoice", number: "QA-000001", sequence: 1, publishedRevision: 3,
  channel: "restaurant", serviceMode: "restaurant",
  actor: { id: "synthetic-operator", name: "اختبار", email: "qa@example.test", role: "cashier" },
  issuedAt: "2026-11-14T10:00:00Z", note: "synthetic-only",
  lines: [{ id: "line", parentLineId: null, kind: "product", productId: "water",
    variantId: "bottle", variantLabel: "عبوة", name: "مياه", quantity: 1,
    unitPriceHalalas: 700, beforeDiscountHalalas: 700, lineDiscountHalalas: 0,
    invoiceDiscountPartHalalas: 0, grossHalalas: 700,
    vatHalalas: 91, netHalalas: 609, discount: null }],
  totals: { beforeDiscountHalalas: 700, lineDiscountHalalas: 0,
    invoiceDiscountHalalas: 0, totalDiscountHalalas: 0,
    grossHalalas: 700, netHalalas: 609, vatHalalas: 91 },
  tender: { method: "network" },
  externalOrderNumber: null, appPaymentStatus: null,
} satisfies PosInvoice;

const catalog: PublishedPosCatalog = {
  revision: 3, categories: [], products: [],
  channels: [{ id: "restaurant", label: "المطعم" },
    { id: "jahez", label: "جاهز منشور" }],
};

beforeEach(() => {
  vi.mocked(listPosRefunds).mockReset();
  vi.mocked(listPosRefunds).mockResolvedValue([]);
  vi.mocked(listPosSales).mockReset();
  vi.mocked(listPosSales).mockResolvedValue([]);
  sessionStorage.clear();
});
afterEach(cleanup);

describe("POS refund payment method defaults", () => {
  it.each([
    ["cash", "كاش"],
    ["network", "شبكة"],
    ["app_receivable", "خارجي"],
  ] as const)("defaults from original tender %s and allows operator override", async (tender, label) => {
    expect(refundDefaultMethod(tender)).toBe(
      tender === "app_receivable" ? "external" : tender,
    );
    const user = userEvent.setup();
    render(<PosRefundDialog invoice={{ ...invoice, tender: { method: tender } }}
      onClose={() => undefined} onRecorded={() => undefined} />);
    const dialog = screen.getByRole("dialog", { name: /مرتجع الفاتورة/ });
    expect(within(dialog).getByRole("button", { name: label }))
      .toHaveAttribute("aria-pressed", "true");
    await user.click(within(dialog).getByRole("button", { name: "شبكة" }));
    expect(within(dialog).getByRole("button", { name: "شبكة" }))
      .toHaveAttribute("aria-pressed", "true");
  });
});

describe("POS history channel name from published catalog", () => {
  it("shows Arabic fallback and published labels in table and channel filter", async () => {
    vi.mocked(listPosSales).mockResolvedValue([
      { ...invoice, _id: "jahez", number: "QA-001", channel: "jahez" },
      { ...invoice, _id: "keeta", number: "QA-002", channel: "keeta" },
      { ...invoice, _id: "future", number: "QA-003", channel: "future-id" },
    ]);
    const user = userEvent.setup();
    render(<PosInvoiceHistory catalog={catalog} onSale={() => undefined} />);
    expect(await screen.findByText("جاهز منشور")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "كيتا" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "future-id" })).toBeInTheDocument();
    const filter = screen.getByRole("combobox", { name: "قناة الفواتير" });
    await user.selectOptions(filter, "jahez");
    expect(screen.getByRole("cell", { name: "QA-001" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "QA-002" })).not.toBeInTheDocument();
  });
});
