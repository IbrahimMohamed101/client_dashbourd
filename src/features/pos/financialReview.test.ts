import { describe, expect, it } from "vitest";
import { parseHalalas, toPosDiscount } from "./PosDiscountEditor";
import { validateFinancialQuote } from "./financialReview";
import type { PosFinanceQuote, PosFinanceQuoteRequest } from "./financialApi";

const request: PosFinanceQuoteRequest = {
  revision: 7, channel: "restaurant",
  invoiceDiscount: { type: "percent", value: 10 },
  items: [{ productId: "water", variantId: "bottle", quantity: 3, discount: null, addons: [] }],
};
const quote: PosFinanceQuote = {
  revision: 7, channel: "restaurant", currency: "SAR", kind: "STAGING_TEST_NON_TAX",
  rounding: "HALF_UP_PER_LINE", vatRate: "15%", note: "فاتورة تجريبية — غير ضريبية",
  invoiceDiscount: request.invoiceDiscount ?? null,
  lines: [{
    id: "i0", parentLineId: null, kind: "product",
    productId: "water", variantId: "bottle", name: "مياه",
    variantLabel: "عبوة", quantity: 3, unitPriceHalalas: 300,
    beforeDiscountHalalas: 900, lineDiscountHalalas: 0,
    invoiceDiscountPartHalalas: 90, grossHalalas: 810,
    vatHalalas: 106, netHalalas: 704, discount: null,
  }],
  totals: { beforeDiscountHalalas: 900, lineDiscountHalalas: 0,
    invoiceDiscountHalalas: 90, totalDiscountHalalas: 90,
    grossHalalas: 810, vatHalalas: 106, netHalalas: 704 },
};
describe("Stage F client quote guard and exact halalas", () => {
  it("reads a consistent server quote, but never invents tax", () => {
    expect(validateFinancialQuote(request, quote)).toBeNull();
  });
  it("rejects tampering and inconsistent prices", () => {
    expect(validateFinancialQuote(request, { ...quote, revision: 8 })).toMatch(/المنيو/);
    expect(validateFinancialQuote(request, {
      ...quote, lines: [{ ...quote.lines[0], vatHalalas: 1 }],
    })).toMatch(/السطر/);
    expect(validateFinancialQuote(request, {
      ...quote, totals: { ...quote.totals, grossHalalas: 1 },
    })).toMatch(/مجاميع/);
  });
  it("parses fixed amount safely as integer halalas", () => {
    expect(parseHalalas("23.45")).toBe(2345);
    expect(parseHalalas("0.01")).toBe(1);
    expect(parseHalalas("23.999")).toBeNull();
    expect(parseHalalas("-1")).toBeNull();
    expect(parseHalalas("abc")).toBeNull();
    expect(toPosDiscount({ type: "fixed", input: "1.25" })).toEqual({ type: "fixed", value: 125 });
    expect(toPosDiscount({ type: "percent", input: "15.25" })).toEqual({ type: "percent", value: 15.25 });
    expect(toPosDiscount({ type: "percent", input: "101" })).toBeUndefined();
  });
  it("checks each add-on quantity and exact parent link", () => {
    const withAddon: PosFinanceQuoteRequest = { revision: 7, channel: "restaurant",
      items: [{ productId: "meal", variantId: "150", quantity: 2,
        addons: [{ productId: "extra-chicken", quantity: 3 }] }] };
    const rows: PosFinanceQuote["lines"] = [
      { ...quote.lines[0], id: "i0", productId: "meal", variantId: "150",
        quantity: 2, unitPriceHalalas: 3400, beforeDiscountHalalas: 6800,
        invoiceDiscountPartHalalas: 0, grossHalalas: 6800, vatHalalas: 887,
        netHalalas: 5913 },
      { ...quote.lines[0], id: "i0:a0", parentLineId: "i0", kind: "addon",
        productId: "extra-chicken", variantId: "portion", quantity: 6,
        unitPriceHalalas: 500, beforeDiscountHalalas: 3000,
        invoiceDiscountPartHalalas: 0, grossHalalas: 3000, vatHalalas: 391,
        netHalalas: 2609, perMealAddonQuantity: 3 },
    ];
    const f: PosFinanceQuote = { ...quote, invoiceDiscount: null, lines: rows,
      totals: { beforeDiscountHalalas: 9800, lineDiscountHalalas: 0,
        invoiceDiscountHalalas: 0, totalDiscountHalalas: 0,
        grossHalalas: 9800, vatHalalas: 1278, netHalalas: 8522 } };
    expect(validateFinancialQuote(withAddon, f)).toBeNull();
    expect(validateFinancialQuote({ ...withAddon, items: [{
      ...withAddon.items[0], addons: [{ productId: "extra-chicken", quantity: 2 }],
    }] }, f)).toMatch(/كميات/);
  });
});
