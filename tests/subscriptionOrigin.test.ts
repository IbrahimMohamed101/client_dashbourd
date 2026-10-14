import { describe, expect, it } from "vitest";
import { subscriptionOriginLabel } from "@/lib/subscriptionOrigin";

describe("subscription purchase channel presentation", () => {
  it("labels checkout and cashier activation unambiguously", () => {
    expect(subscriptionOriginLabel("app")).toBe("التطبيق");
    expect(subscriptionOriginLabel("cashier")).toBe("الكاشير");
    expect(subscriptionOriginLabel("mixed")).toBe("التطبيق + الكاشير");
  });

  it("does not guess the channel of unclassified historic subscriptions", () => {
    expect(subscriptionOriginLabel("unknown")).toBe("غير محدد");
    expect(subscriptionOriginLabel(undefined)).toBe("غير محدد");
  });
});
