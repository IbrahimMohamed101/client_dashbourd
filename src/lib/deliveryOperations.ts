import { safeText } from "@/lib/operationsBoard";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;

const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const firstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const text = asString(value);
    if (text) return text;
  }
  return null;
};

const formatAddress = (address: UnknownRecord | null): string | null => {
  const formatted = firstString(address?.formattedAddress, address?.addressSummary);
  if (formatted) return formatted;

  const parts = [
    address?.label,
    address?.district,
    address?.street,
    address?.building ? `مبنى ${address.building}` : null,
    address?.floor ? `دور ${address.floor}` : null,
    address?.apartment ? `شقة ${address.apartment}` : null,
    address?.city,
  ]
    .map((value) => asString(value))
    .filter((value): value is string => Boolean(value));

  return parts.length ? parts.join("، ") : null;
};

export function enrichDeliveryOperationItem(
  item: UnifiedQueueItem
): UnifiedQueueItem {
  const raw = asRecord(item.rawData) ?? {};
  const rawFulfillment = asRecord(raw.fulfillment);
  const rawDelivery =
    asRecord(rawFulfillment?.delivery) ??
    asRecord(raw.delivery) ??
    asRecord(raw.deliveryDetails) ??
    {};
  const address =
    asRecord(item.delivery?.address) ??
    asRecord(rawDelivery.address) ??
    asRecord(raw.deliveryAddress);

  const addressSummary = firstString(
    item.context.addressSummary,
    item.delivery?.addressSummary,
    rawDelivery.addressSummary,
    address?.formattedAddress,
    formatAddress(address)
  );
  const date = firstString(
    item.context.date,
    item.delivery?.date,
    rawDelivery.date,
    raw.scheduledDate,
    raw.businessDate,
    raw.date
  );
  const window = firstString(
    item.context.window,
    item.delivery?.window,
    item.delivery?.deliveryWindow,
    rawDelivery.window,
    rawDelivery.deliveryWindow,
    rawDelivery.deliverySlot,
    rawFulfillment?.deliverySlot,
    raw.deliveryWindow,
    raw.deliverySlot
  );
  const zoneValue = firstString(
    item.delivery?.zone?.name,
    item.delivery?.zone?.id,
    item.delivery?.zoneId,
    asRecord(rawDelivery.zone)?.name,
    asRecord(rawDelivery.zone)?.id,
    rawDelivery.zoneId,
    raw.deliveryZone,
    raw.zoneId
  );
  const addressNotes = firstString(
    item.context.addressNotes,
    address?.notes,
    rawDelivery.addressNotes
  );
  const deliveryStatus = firstString(
    item.delivery?.status,
    rawDelivery.status,
    raw.deliveryStatus,
    raw.status,
    item.status
  );

  return {
    ...item,
    delivery: {
      ...item.delivery,
      ...rawDelivery,
      address: address ?? item.delivery?.address,
      addressSummary,
      date,
      window,
      deliveryWindow: window,
      status: deliveryStatus,
      zone: zoneValue
        ? {
            id: firstString(item.delivery?.zone?.id, rawDelivery.zoneId, zoneValue),
            name: firstString(item.delivery?.zone?.name, asRecord(rawDelivery.zone)?.name, zoneValue),
          }
        : item.delivery?.zone,
    },
    context: {
      ...item.context,
      date,
      window,
      addressSummary,
      addressNotes,
    },
  };
}

export function getAllDeliveryOperationItems(
  items: UnifiedQueueItem[] = []
): UnifiedQueueItem[] {
  return items.filter(
    (item) => item.mode === "delivery" && item.source !== "subscription_pickup_request"
  );
}

export function filterDeliveryOperationsByQuery(
  items: UnifiedQueueItem[],
  query?: string
): UnifiedQueueItem[] {
  const search = query?.trim().toLowerCase() ?? "";
  if (!search) return items;

  return items.filter((item) => {
    const raw = asRecord(item.rawData);
    const address =
      asRecord(item.delivery?.address) ?? asRecord(raw?.deliveryAddress);
    const values = [
      item.customer.name,
      item.customer.phone,
      item.reference,
      item.orderNumber,
      item.context.addressSummary,
      item.context.window,
      item.delivery?.zone?.name,
      item.delivery?.zone?.id,
      item.status,
      address?.district,
      address?.street,
      raw?.subscriptionId,
      raw?.subscriptionDayId,
      raw?.orderId,
    ];

    return values.some((value) =>
      safeText(value, "").toLowerCase().includes(search)
    );
  });
}
