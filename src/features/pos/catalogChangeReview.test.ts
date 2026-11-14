import { describe, expect, it } from "vitest";
import { getPosCatalogChanges } from "./catalogChangeReview";
import { categories, channels, previewProducts, type Catalog } from "./previewCatalog";

const baseline = (): Catalog => ({
  categories: categories.map((item) => ({ ...item })),
  channels: channels.map((item) => ({ ...item })),
  products: structuredClone(previewProducts),
});

describe("POS Stage C published-vs-draft review", () => {
  it("shows no changes for equivalent catalogs", () => {
    expect(getPosCatalogChanges(baseline(), structuredClone(baseline()))).toEqual([]);
  });

  it("lists all modified prices in the correct sales channels and size", () => {
    const original = baseline();
    const next = structuredClone(original);
    const prices = next.products[0].variants[0].prices;
    prices.restaurant = 2700;
    prices.hungerstation = 0;
    prices.keeta = null;
    const changes = getPosCatalogChanges(original, next).filter((item) => item.kind === "price");
    expect(changes).toHaveLength(3);
    expect(changes.find((item) => item.label.includes("المطعم"))).toMatchObject({
      before: "24.00 ر.س", after: "27.00 ر.س",
    });
    expect(changes.find((item) => item.label.includes("HungerStation"))?.after).toBe("مجاني (0 ر.س)");
    expect(changes.find((item) => item.label.includes("Keeta"))?.after).toBe("غير مسعّر");
  });

  it("tracks new products, added channels, availability and preferred size", () => {
    const original = baseline();
    const next = structuredClone(original);
    next.channels?.push({ id: "new-app", label: "تطبيق جديد" });
    next.products[0].active = false;
    next.products[0].defaultVariantId = "200";
    next.products.push({
      id: "new-item", name: "منتج الاختبار", category: "salads",
      active: true, variants: [{ id: "portion", label: "حصة", prices: { restaurant: 1500, hungerstation: null, keeta: null, "new-app": null } }],
    });
    const changes = getPosCatalogChanges(original, next);
    expect(changes.some((item) => item.label === "إضافة صنف" && item.after === "منتج الاختبار")).toBe(true);
    expect(changes.some((item) => item.label.includes("قناة بيع") && item.after === "تطبيق جديد")).toBe(true);
    expect(changes.some((item) => item.label.includes("ظهور") && item.after === "مخفي")).toBe(true);
    expect(changes.some((item) => item.label.includes("الحجم الافتراضي") && item.after === "200")).toBe(true);
    expect(changes.some((item) => item.kind === "price" && item.label.includes("منتج الاختبار"))).toBe(true);
  });
});
