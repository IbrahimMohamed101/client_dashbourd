// @vitest-environment jsdom
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useForm } from "react-hook-form";
import { PromoCodeSection } from "../src/components/pages/subscriptions/create/PromoCodeSection";
import type { CreateSubscriptionSchemaType } from "../src/lib/validations/createSubscriptionSchema";
import { normalizePromoCode } from "../src/utils/buildSubscriptionCreationPayload";

afterEach(cleanup);

function PromoHarness({ onApply }: { onApply: () => void }) {
  const form = useForm<CreateSubscriptionSchemaType>({
    defaultValues: { promoCode: "SAM20" },
  });
  return (
    <PromoCodeSection
      form={form}
      appliedPromo={null}
      error={null}
      isApplying={false}
      formatMoney={(halala) => String(halala)}
      availablePromoCodes={[]}
      onApply={onApply}
      onUseCode={() => {}}
    />
  );
}

describe("subscription promo apply action", () => {
  it("calls the promo handler with no click event argument", () => {
    const onApply = vi.fn();
    render(<PromoHarness onApply={onApply} />);

    fireEvent.click(screen.getByRole("button", { name: "تطبيق الكود" }));

    expect(onApply).toHaveBeenCalledExactlyOnceWith();
  });

  it("treats non-string input safely and preserves valid promo codes", () => {
    expect(normalizePromoCode({ type: "click" })).toBeUndefined();
    expect(normalizePromoCode(" sam20 ")).toBe("SAM20");
    expect(normalizePromoCode(" SAM 20 ")).toBe("SAM 20");
  });
});
