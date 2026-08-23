import { describe, expect, it } from "vitest";
import {
  getDefaultValues,
  promoCodeSchema,
  toPromoCodePayload,
  type PromoCodeFormValues,
} from "../src/utils/promoCodeForm";
import { promoCodeAppSelectionUrl } from "../src/utils/promoCodeApiContract";

const values: PromoCodeFormValues = {
  code: " save20 ",
  nameAr: "عرض",
  nameEn: "Offer",
  discountType: "percentage",
  discountValue: "20",
  usageLimitTotal: "",
  usageLimitPerUser: "",
  startsAt: "",
  expiresAt: "",
  appliesTo: "subscription",
  isActive: true,
  showInApp: true,
  showOnHome: true,
  showOnPlans: true,
  displayPriority: "25",
  appTitleAr: " وفّر على اشتراكك ",
  appTitleEn: " Save on your subscription ",
  appDescriptionAr: " انسخ الكود ",
  appDescriptionEn: " Copy the code ",
  homeMessageAr: " اعرض الخطط ",
  homeMessageEn: " View plans ",
};

describe("promo-code app display contract", () => {
  it("uses the singleton app-promo selection endpoint", () => {
    expect(promoCodeAppSelectionUrl()).toBe(
      "/api/dashboard/promo-codes/app-selection"
    );
  });

  it("sends display controls and localized copy without formatting a discount label", () => {
    const payload = toPromoCodePayload(values);

    expect(payload.code).toBe("SAVE20");
    expect(payload.appDisplay).toEqual({
      isVisible: true,
      showOnHome: true,
      showOnPlans: true,
      priority: 25,
      title: { ar: "وفّر على اشتراكك", en: "Save on your subscription" },
      description: { ar: "انسخ الكود", en: "Copy the code" },
      homeMessage: { ar: "اعرض الخطط", en: "View plans" },
    });
    expect(payload.appDisplay).not.toHaveProperty("discountLabel");
  });

  it("keeps existing promo codes hidden by default", () => {
    const defaults = getDefaultValues();
    expect(defaults.showInApp).toBe(false);
    expect(defaults.showOnHome).toBe(true);
    expect(defaults.showOnPlans).toBe(true);
  });

  it("requires at least one placement for a visible app promotion", () => {
    const result = promoCodeSchema.safeParse({
      ...values,
      showOnHome: false,
      showOnPlans: false,
    });
    expect(result.success).toBe(false);
  });
});
