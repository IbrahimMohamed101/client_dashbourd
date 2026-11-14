// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PosInvoiceReceipt } from "./PosInvoiceReceipt";
import type { PosInvoice } from "./financialApi";

const invoice = {
  _id: "invoice", number: "TST-0001", sequence: 1, publishedRevision: 1,
  channel: "restaurant", serviceMode: "restaurant",
  actor: { id: "cashier", name: "Test", email: "synthetic@example.test", role: "cashier" },
  externalOrderNumber: null, appPaymentStatus: null,
  issuedAt: "2026-11-14T00:00:00Z", note: "test",
  lines: [], totals: {
    beforeDiscountHalalas: 500, lineDiscountHalalas: 0,
    invoiceDiscountHalalas: 0, totalDiscountHalalas: 0,
    grossHalalas: 500, netHalalas: 435, vatHalalas: 65,
  }, tender: { method: "network" },
} satisfies PosInvoice;

describe("POS historical receipt service mode compatibility", () => {
  for (const [serviceMode, label] of [
    ["dine-in", "محلي"], ["takeaway", "سفري"], ["delivery", "توصيل"],
  ]) {
    it(`preserves legacy ${serviceMode} receipt label`, () => {
      render(<PosInvoiceReceipt invoice={{ ...invoice, serviceMode }} onClose={() => undefined} />);
      expect(screen.getByText(`نوع الطلب: ${label}`)).toBeInTheDocument();
      cleanup();
    });
  }
  it("does not display service mode for new restaurant invoices", () => {
    render(<PosInvoiceReceipt invoice={invoice} onClose={() => undefined} />);
    expect(screen.queryByText(/نوع الطلب/)).not.toBeInTheDocument();
    cleanup();
  });
});

describe("POS receipt channel labels", () => {
  it("translates Jahez when no published catalog entry exists", () => {
    render(<PosInvoiceReceipt invoice={{ ...invoice, channel: "jahez" }} onClose={() => undefined} />);
    expect(screen.getByText("قناة البيع: جاهز")).toBeInTheDocument();
    cleanup();
  });
  it("uses a published custom label over fallback on historical receipts", () => {
    render(<PosInvoiceReceipt invoice={{ ...invoice, channel: "jahez" }}
      channels={[{ id: "jahez", label: "جاهز - جدة" }]} onClose={() => undefined} />);
    expect(screen.getByText("قناة البيع: جاهز - جدة")).toBeInTheDocument();
    cleanup();
  });
});
