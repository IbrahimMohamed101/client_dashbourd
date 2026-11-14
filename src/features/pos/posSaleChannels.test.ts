import { describe, expect, it } from "vitest";
import { channelAccentStyle, visibleSaleChannels, posChannelLabel } from "./posSaleChannels";
import type { PublishedPosCatalog } from "./catalogApi";

describe("sale channel visibility and stable accessible accents", () => {
  const catalog = {
    revision: 1,
    categories: [],
    channels: [
      { id: "external-unpriced", label: "Unpriced" },
      { id: "keeta", label: "Keeta" },
      { id: "restaurant", label: "المطعم" },
      { id: "hungerstation", label: "HungerStation" },
    ],
    products: [
      { id: "a", name: "A", category: "meals", active: true, variants: [
        { id: "v", label: "V", prices: { restaurant: 100, keeta: 200, hungerstation: null, "external-unpriced": null } },
      ] },
      { id: "b", name: "B", category: "meals", active: false, variants: [
        { id: "v", label: "V", prices: { restaurant: 100, hungerstation: 300 } },
      ] },
    ],
  } as PublishedPosCatalog;
  it("puts restaurant first and excludes unpriced and inactive-only channels", () => {
    expect(visibleSaleChannels(catalog).map((c) => c.id)).toEqual(["restaurant", "keeta"]);
  });
  it("always includes restaurant even when configured channels omit it", () => {
    expect(visibleSaleChannels({ ...catalog, channels: [] })).toEqual([
      { id: "restaurant", label: "المطعم" },
    ]);
  });
  it("deterministically maps each external id to a palette shade and leaves restaurant primary", () => {
    expect(channelAccentStyle("restaurant")).toBeUndefined();
    expect(channelAccentStyle("keeta")).toEqual(channelAccentStyle("keeta"));
    expect(channelAccentStyle("keeta")?.color).toBe("#FFFFFF");
  });
});

describe("POS invoice channel names", () => {
  it("prefers published catalog labels, including any future channel", () => {
    expect(posChannelLabel("jahez", [{ id: "jahez", label: "جاهز - تجريبي" }])).toBe("جاهز - تجريبي");
    expect(posChannelLabel("new-app", [{ id: "new-app", label: "قناة جديدة" }])).toBe("قناة جديدة");
  });
  it("uses Arabic legacy fallbacks, then raw id when unknown", () => {
    expect(posChannelLabel("restaurant")).toBe("المطعم");
    expect(posChannelLabel("hungerstation")).toBe("هنجرستيشن");
    expect(posChannelLabel("keeta")).toBe("كيتا");
    expect(posChannelLabel("jahez")).toBe("جاهز");
    expect(posChannelLabel("not-published")).toBe("not-published");
  });
  it("does not accept empty published labels", () => {
    expect(posChannelLabel("jahez", [{ id: "jahez", label: " " }])).toBe("جاهز");
  });
});
