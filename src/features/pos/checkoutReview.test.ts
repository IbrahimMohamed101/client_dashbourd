import { describe, expect, it } from "vitest";
import { validatePosCheckoutReview } from "./checkoutReview";
import type { PosQuote, PosQuoteRequest } from "./quoteApi";

const request: PosQuoteRequest = {
  revision: 14,
  channel: "restaurant",
  items: [{
    productId: "meal", variantId: "150", quantity: 2,
    addonIds: ["extra-chicken"],
  }],
};

const valid: PosQuote = {
  revision: 14,
  channel: "restaurant",
  currency: "SAR",
  lines: [{
    productId: "meal", variantId: "150", name: "وجبة دجاج", variantLabel: "150 جم",
    quantity: 2, basePriceHalalas: 3000,
    addons: [{ productId: "extra-chicken", name: "زيادة دجاج", priceHalalas: 500 }],
    unitPriceHalalas: 3500, lineTotalHalalas: 7000,
  }],
  itemCount: 2,
  provisionalSubtotalHalalas: 7000,
  finalPayableHalalas: null,
  taxHalalas: null,
  discountHalalas: null,
  canCommit: false,
  note: "معاينة فقط",
};

describe("POS Stage E read-only checkout quote guard", () => {
  it("accepts only consistent read-only server quotes", () => {
    expect(validatePosCheckoutReview(request, valid)).toBeNull();
  });

  it("rejects stale revision and different sales channel", () => {
    expect(validatePosCheckoutReview(request, { ...valid, revision: 15 })).toMatch(/نسخة المنيو/);
    expect(validatePosCheckoutReview(request, { ...valid, channel: "keeta" })).toMatch(/قناة البيع/);
  });

  it("blocks a quote that mistakenly claims payment or tax authority", () => {
    expect(validatePosCheckoutReview(request, { ...valid, canCommit: true as false })).toMatch(/عقد التسعير/);
    expect(validatePosCheckoutReview(request, { ...valid, taxHalalas: 0 as null })).toMatch(/عقد التسعير/);
    expect(validatePosCheckoutReview(request, { ...valid, finalPayableHalalas: 7000 as null })).toMatch(/عقد التسعير/);
  });

  it("rejects changing line identity or addons without re-quoting", () => {
    expect(validatePosCheckoutReview(request, {
      ...valid, lines: [{ ...valid.lines[0], variantId: "200" }],
    })).toMatch(/لا تطابق/);
    expect(validatePosCheckoutReview(request, {
      ...valid, lines: [{ ...valid.lines[0], addons: [] }],
    })).toMatch(/لا تطابق/);
  });

  it("rejects mismatched unit arithmetic, totals and unsafe amounts", () => {
    expect(validatePosCheckoutReview(request, {
      ...valid, lines: [{ ...valid.lines[0], unitPriceHalalas: 3400 }],
    })).toMatch(/اختلاف حسابي/);
    expect(validatePosCheckoutReview(request, {
      ...valid, provisionalSubtotalHalalas: 6900,
    })).toMatch(/الإجمالي المبدئي/);
    expect(validatePosCheckoutReview(request, {
      ...valid, provisionalSubtotalHalalas: Number.MAX_SAFE_INTEGER,
    })).toMatch(/غير مكتملة/);
  });
});
