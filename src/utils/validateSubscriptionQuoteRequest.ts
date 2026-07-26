type UnknownRecord = Record<string, unknown>;

type ClientValidationError = Error & {
  code?: string;
  status?: number;
  normalizedMessage?: string;
};

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function parseRequestData(value: unknown): UnknownRecord | null {
  if (typeof value !== "string") return asRecord(value);

  try {
    return asRecord(JSON.parse(value));
  } catch {
    return null;
  }
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function throwClientValidationError(message: string): never {
  const error = new Error(message) as ClientValidationError;
  error.code = "CLIENT_VALIDATION_ERROR";
  error.status = 422;
  error.normalizedMessage = message;
  throw error;
}

export function assertSubscriptionQuoteFulfillmentComplete(data: unknown): void {
  const payload = parseRequestData(data);
  const delivery = asRecord(payload?.delivery);
  if (!delivery) return;

  const type = readString(delivery.type);
  const slot = asRecord(delivery.slot);

  if (type === "delivery") {
    if (!readString(delivery.zoneId)) {
      throwClientValidationError("منطقة التوصيل مطلوبة");
    }

    if (
      !slot ||
      readString(slot.type) !== "delivery" ||
      !readString(slot.slotId) ||
      !readString(slot.window)
    ) {
      throwClientValidationError("فترة التوصيل مطلوبة");
    }
  }

  if (type === "pickup" && !readString(delivery.pickupLocationId)) {
    throwClientValidationError("فرع الاستلام مطلوب");
  }
}
