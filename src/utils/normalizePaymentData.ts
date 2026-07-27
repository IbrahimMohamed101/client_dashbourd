export const PAYMENT_CHANNELS = {
  ELECTRONIC_GATEWAY: "electronic_gateway",
  CASH: "cash",
} as const;

export type PaymentChannel =
  (typeof PAYMENT_CHANNELS)[keyof typeof PAYMENT_CHANNELS];

const DASHBOARD_SUBSCRIPTION_CASH_SOURCE = "dashboard_subscription_cash";

function normalizeToken(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function resolvePaymentChannel(payment: Record<string, unknown>): PaymentChannel {
  const metadata =
    payment.metadata && typeof payment.metadata === "object" && !Array.isArray(payment.metadata)
      ? (payment.metadata as Record<string, unknown>)
      : {};

  const candidates = [
    payment.paymentChannel,
    payment.paymentMethod,
    payment.method,
    metadata.paymentChannel,
    metadata.paymentMethod,
  ].map(normalizeToken);

  const provider = normalizeToken(payment.paymentProvider ?? payment.provider);
  const source = normalizeToken(payment.source);

  if (
    provider === PAYMENT_CHANNELS.CASH ||
    candidates.includes(PAYMENT_CHANNELS.CASH) ||
    source === DASHBOARD_SUBSCRIPTION_CASH_SOURCE
  ) {
    return PAYMENT_CHANNELS.CASH;
  }

  // Cash must be explicit. Moyasar, Visa, wallets, and any future non-cash
  // provider all belong to the electronic gateway channel.
  return PAYMENT_CHANNELS.ELECTRONIC_GATEWAY;
}

export function normalizePaymentRecord<T extends Record<string, unknown>>(payment: T) {
  const paymentChannel = resolvePaymentChannel(payment);

  return {
    ...payment,
    method: paymentChannel,
    paymentMethod: paymentChannel,
    paymentChannel,
  };
}

export function normalizePaymentsPayload<T>(payload: T): T {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const response = payload as Record<string, unknown>;

  if (Array.isArray(response.data)) {
    return {
      ...response,
      data: response.data.map((item) =>
        item && typeof item === "object" && !Array.isArray(item)
          ? normalizePaymentRecord(item as Record<string, unknown>)
          : item
      ),
    } as T;
  }

  if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
    return {
      ...response,
      data: normalizePaymentRecord(response.data as Record<string, unknown>),
    } as T;
  }

  return payload;
}
