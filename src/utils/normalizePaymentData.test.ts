import { describe, expect, it } from "vitest";
import {
  PAYMENT_CHANNELS,
  normalizePaymentsPayload,
  resolvePaymentChannel,
} from "./normalizePaymentData";

describe("dashboard payment channel normalization", () => {
  it("classifies Moyasar app payments as electronic gateway", () => {
    expect(
      resolvePaymentChannel({
        provider: "moyasar",
        status: "initiated",
        paymentMethod: "moyasar",
      })
    ).toBe(PAYMENT_CHANNELS.ELECTRONIC_GATEWAY);
  });

  it("classifies manual Visa payments as electronic gateway", () => {
    expect(
      resolvePaymentChannel({
        provider: "manual",
        method: "visa",
        source: "dashboard_subscription_visa",
        metadata: { paymentMethod: "visa" },
      })
    ).toBe(PAYMENT_CHANNELS.ELECTRONIC_GATEWAY);
  });

  it("keeps explicit cash payments as cash", () => {
    expect(
      resolvePaymentChannel({
        provider: "cash",
        method: "cash",
        source: "dashboard_subscription_cash",
      })
    ).toBe(PAYMENT_CHANNELS.CASH);
  });

  it("does not silently fall back to cash for future gateways", () => {
    expect(
      resolvePaymentChannel({
        provider: "future_gateway",
        method: "new_wallet",
      })
    ).toBe(PAYMENT_CHANNELS.ELECTRONIC_GATEWAY);
  });

  it("normalizes list and detail payloads to two values only", () => {
    const list = normalizePaymentsPayload({
      status: true,
      data: [
        { _id: "gateway", provider: "moyasar", paymentMethod: "moyasar" },
        { _id: "cash", provider: "cash", paymentMethod: "cash" },
      ],
    });

    expect(list.data[0]).toMatchObject({
      method: "electronic_gateway",
      paymentMethod: "electronic_gateway",
      paymentChannel: "electronic_gateway",
      provider: "moyasar",
    });
    expect(list.data[1]).toMatchObject({
      method: "cash",
      paymentMethod: "cash",
      paymentChannel: "cash",
      provider: "cash",
    });

    const detail = normalizePaymentsPayload({
      status: true,
      data: { provider: "manual", metadata: { paymentMethod: "visa" } },
    });

    expect(detail.data).toMatchObject({
      method: "electronic_gateway",
      paymentMethod: "electronic_gateway",
      paymentChannel: "electronic_gateway",
    });
  });
});
