// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { categories, previewProducts } from "./previewCatalog";
import {
  cartLineId, readPosCartDraft, writePosCartDraft,
  MAX_CART_LINES, MAX_LINE_QUANTITY, type PosSelection,
} from "./posCartDraft";

const catalog = { revision: 5, categories: [...categories], products: previewProducts };
const water = catalog.products.find((item) => item.id === "water")!;
const selected: PosSelection = { product: water, variant: water.variants[0], addons: [] };
const line = { ...selected, id: cartLineId(selected), quantity: 2 };

afterEach(() => window.sessionStorage.clear());

describe("cashier scoped POS cart session storage", () => {
  it("round-trips a business-only draft without storing staff identity, payments or customer data", () => {
    writePosCartDraft("operator-a", {
      revision: 5, channel: "restaurant", serviceMode: "takeaway", lines: [line],
    });
    const content = window.sessionStorage.getItem("basicdiet:pos:draft:v1:operator-a");
    expect(content).toBeTruthy();
    expect(content).not.toMatch(/operator-a|payment|phone|email|customer/);
    const restored = readPosCartDraft("operator-a", catalog);
    expect(restored?.lines).toHaveLength(1);
    expect(restored?.lines[0].quantity).toBe(2);
    expect(restored?.lines[0].variant.prices.restaurant).toBe(300);
    expect(readPosCartDraft("operator-b", catalog)).toBeNull();
  });

  it("restores prior price as a comparison-only snapshot on a newer published revision", () => {
    writePosCartDraft("operator-a", {
      revision: 5, channel: "restaurant", serviceMode: "takeaway", lines: [line],
    });
    const newer = {
      ...catalog, revision: 6,
      products: catalog.products.map((item) =>
        item.id === "water" ? {
          ...item, variants: item.variants.map((variant) => ({
            ...variant, prices: { ...variant.prices, restaurant: 750 },
          })),
        } : item),
    };
    expect(readPosCartDraft("operator-a", newer)?.revision).toBe(5);
    expect(readPosCartDraft("operator-a", newer)?.lines[0].variant.prices.restaurant).toBe(300);
    expect(readPosCartDraft("operator-a", newer)?.lines[0].quantity).toBe(2);
  });

  it("uses published catalog values instead of cached altered prices for the same revision", () => {
    writePosCartDraft("operator-a", {
      revision: 5, channel: "restaurant", serviceMode: "takeaway",
      lines: [{ ...line, variant: { ...line.variant, prices: { ...line.variant.prices, restaurant: 1 } } }],
    });
    const restored = readPosCartDraft("operator-a", catalog);
    // Even though cached product/variant references were altered, the
    // published catalog remains the price source at identical revision.
    expect(restored?.lines[0].variant.prices.restaurant).toBe(300);
  });

  it("rejects invalid quantities, cart-line corruption and mixed identities", () => {
    writePosCartDraft("operator-a", {
      revision: 5, channel: "restaurant", serviceMode: "takeaway", lines: [line],
    });
    const key = "basicdiet:pos:draft:v1:operator-a";
    const original = JSON.parse(window.sessionStorage.getItem(key)!);
    for (const badQuantity of [0, -1, MAX_LINE_QUANTITY + 1, 1.25, "2"]) {
      window.sessionStorage.setItem(key, JSON.stringify({
        ...original, lines: [{ ...original.lines[0], quantity: badQuantity }],
      }));
      expect(readPosCartDraft("operator-a", catalog)).toBeNull();
    }
    window.sessionStorage.setItem(key, JSON.stringify({
      ...original, lines: [{ ...original.lines[0], id: "corrupt" }],
    }));
    expect(readPosCartDraft("operator-a", catalog)).toBeNull();
    window.sessionStorage.setItem(key, JSON.stringify({
      ...original, lines: Array.from({ length: MAX_CART_LINES + 1 }, () => original.lines[0]),
    }));
    expect(readPosCartDraft("operator-a", catalog)).toBeNull();
    window.sessionStorage.setItem(key, "{bad");
    expect(readPosCartDraft("operator-a", catalog)).toBeNull();
    expect(readPosCartDraft("operator-with-different-session", catalog)).toBeNull();
  });

  it("deletes saved draft when cart is cleared and ignores invalid anonymous scope", () => {
    writePosCartDraft("operator-a", {
      revision: 5, channel: "restaurant", serviceMode: "takeaway", lines: [line],
    });
    writePosCartDraft("operator-a", {
      revision: 5, channel: "restaurant", serviceMode: "takeaway", lines: [],
    });
    expect(readPosCartDraft("operator-a", catalog)).toBeNull();
    writePosCartDraft(undefined, {
      revision: 5, channel: "restaurant", serviceMode: "takeaway", lines: [line],
    });
    expect(window.sessionStorage.length).toBe(0);
  });
});
