import { describe, expect, it } from "vitest";
import { estimateRefundGrossHalalas } from "./posRefundEstimate";
import type { PosInvoice, PosRefund } from "./financialApi";

const invoice = { lines: [
  { id: "a", quantity: 3, grossHalalas: 1000 },
  { id: "b", quantity: 2, grossHalalas: 500 },
] } as PosInvoice;

describe("refund total including VAT before confirmation", () => {
  it("matches half-up per-original-line rounding and full return", () => {
    expect(estimateRefundGrossHalalas(invoice, [], [{ lineId: "a", quantity: 1 }])).toBe(333);
    expect(estimateRefundGrossHalalas(invoice, [], [{ lineId: "a", quantity: 3 }, { lineId: "b", quantity: 2 }])).toBe(1500);
  });
  it("gives the final return the exact outstanding gross", () => {
    const previous = [{ lines: [{ lineId: "a", quantity: 1, grossHalalas: 333 }] }] as PosRefund[];
    expect(estimateRefundGrossHalalas(invoice, previous, [{ lineId: "a", quantity: 2 }])).toBe(667);
  });
});
