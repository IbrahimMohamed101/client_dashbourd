import { describe, expect, it } from "vitest";
import { copyChannelPrices, duplicateDraftProduct } from "./catalogBulkOps";

const catalog = {
  products: [
    { id: "meal", name: "وجبة", active: true, variants: [
      { id: "a", label: "100 جم", prices: { restaurant: "24.00", keeta: "", hungerstation: "28.00" } },
      { id: "b", label: "150 جم", prices: { restaurant: "", keeta: "33.00", hungerstation: "35.00" } },
    ], defaultVariantId: "a", allowedAddonIds: ["addon"] },
    { id: "other", name: "مياه", variants: [
      { id: "c", label: "عبوة", prices: { restaurant: "3.00", keeta: "4.00", hungerstation: "4.00" } },
    ] },
  ],
};

describe("POS stage D price matrix helpers", () => {
  it("fills only missing prices of filtered products without clearing unpriced source or touching other channels", () => {
    const input = structuredClone(catalog);
    const result = copyChannelPrices(input, "restaurant", "keeta", new Set(["meal"]), "missing", { allowNewPrices: true });
    expect(result.changed).toBe(1);
    expect(result.catalog.products[0].variants[0].prices.keeta).toBe("24.00");
    expect(result.catalog.products[0].variants[1].prices.keeta).toBe("33.00");
    expect(result.catalog.products[0].variants[0].prices.hungerstation).toBe("28.00");
    expect(result.catalog.products[1]).toEqual(input.products[1]);
    expect(input).toEqual(catalog);
  });

  it("does not activate an unpriced variant without explicit opt-in", () => {
    const result = copyChannelPrices(catalog, "restaurant", "keeta", new Set(["meal"]), "missing");
    expect(result.changed).toBe(0);
    expect(result.blockedNewPrices).toMatchObject([{
      productId: "meal", variantId: "a", before: "غير مسعّر", after: "24.00", newlyPriced: true,
    }]);
    expect(result.catalog).toBe(catalog);
    expect(result.firstTimeProducts).toEqual([]);
  });

  it("applies an explicit markup and rounds upward in halalas, never rewriting source", () => {
    const result = copyChannelPrices(catalog, "restaurant", "keeta", new Set(["meal"]), "missing",
      { allowNewPrices: true, increasePercent: 15, rounding: "half" });
    expect(result.changed).toBe(1);
    expect(result.changes[0]).toMatchObject({ before: "غير مسعّر", after: "28.00", newlyPriced: true });
    expect(result.catalog.products[0].variants[0].prices.keeta).toBe("28.00");
    expect(result.catalog.products[0].variants[0].prices.restaurant).toBe("24.00");
  });

  it("distinguishes products newly offered on a channel from additional variants", () => {
    const input = structuredClone(catalog);
    input.products[0].variants[1].prices.keeta = "";
    const result = copyChannelPrices(input, "restaurant", "keeta", new Set(["meal"]), "missing",
      { allowNewPrices: true });
    expect(result.firstTimeProducts).toEqual(["وجبة"]);
    expect(result.catalog.products[0].variants[1].prices.keeta).toBe("");
  });

  it("rejects invalid percentages and cannot remove destination prices from a blank source", () => {
    expect(() => copyChannelPrices(catalog, "restaurant", "keeta", new Set(["meal"]), "missing",
      { increasePercent: -5 })).toThrow();
    expect(() => copyChannelPrices(catalog, "restaurant", "keeta", new Set(["meal"]), "missing",
      { increasePercent: 301 })).toThrow();
    const result = copyChannelPrices(catalog, "restaurant", "keeta", new Set(["meal"]), "overwrite",
      { allowNewPrices: true });
    expect(result.catalog.products[0].variants[1].prices.keeta).toBe("33.00");
  });

  it("overwrites only priced source cells in selected rows and leaves other channels intact", () => {
    const result = copyChannelPrices(catalog, "restaurant", "hungerstation", new Set(["meal"]), "overwrite");
    expect(result.changed).toBe(1);
    expect(result.catalog.products[0].variants[0].prices.hungerstation).toBe("24.00");
    expect(result.catalog.products[0].variants[1].prices.hungerstation).toBe("35.00");
    expect(result.catalog.products[1].variants[0].prices.hungerstation).toBe("4.00");
    expect(result.catalog.products[0].variants[0].prices.keeta).toBe("");
  });

  it("never copies the same channel, empty selection or blank sources", () => {
    expect(copyChannelPrices(catalog, "keeta", "keeta", new Set(["meal"]), "overwrite").changed).toBe(0);
    expect(copyChannelPrices(catalog, "restaurant", "keeta", new Set(), "overwrite").changed).toBe(0);
    expect(copyChannelPrices(catalog, "not-a-channel", "keeta", new Set(["meal"]), "overwrite").changed).toBe(0);
  });
});

describe("POS stage D product duplication", () => {
  it("clones ids, prices and addon settings independently, remaps default size and always starts hidden", () => {
    const original = structuredClone(catalog.products[0]);
    const copy = duplicateDraftProduct(original, "copy-meal", ["copy-100", "copy-150"]);
    expect(copy).toMatchObject({
      id: "copy-meal", name: "نسخة من وجبة", active: false,
      defaultVariantId: "copy-100", allowedAddonIds: ["addon"],
    });
    expect(copy.variants.map((variant) => variant.id)).toEqual(["copy-100", "copy-150"]);
    expect(copy.variants[0].prices).toEqual(original.variants[0].prices);
    copy.variants[0].prices.restaurant = "99.00";
    copy.allowedAddonIds!.push("extra");
    expect(original.variants[0].prices.restaurant).toBe("24.00");
    expect(original.allowedAddonIds).toEqual(["addon"]);
  });

  it("rejects reused and malformed identifiers", () => {
    expect(() => duplicateDraftProduct(catalog.products[0], "meal", ["a1", "b1"])).toThrow();
    expect(() => duplicateDraftProduct(catalog.products[0], "new", ["a1"])).toThrow();
    expect(() => duplicateDraftProduct(catalog.products[0], "new", ["a1", "a1"])).toThrow();
  });
});
