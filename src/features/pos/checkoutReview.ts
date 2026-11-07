import type { PosQuote, PosQuoteRequest } from "./quoteApi";

const MAX_TOTAL_HALALAS = 1_000_000_000;

function safeHalalas(value: unknown): value is number {
  return Number.isSafeInteger(value) && typeof value === "number"
    && value >= 0 && value <= MAX_TOTAL_HALALAS;
}

/**
 * Stage E: fail closed if a quote is inconsistent with the cart, stale,
 * or appears to authorize an invoice/payment. This verifies the server's
 * read-only response shape, NOT the accuracy of its tax or settlement.
 */
export function validatePosCheckoutReview(
  request: PosQuoteRequest,
  quote: PosQuote,
): string | null {
  if (!quote || quote.revision !== request.revision || quote.channel !== request.channel
    || quote.currency !== "SAR") return "تسعير السيرفر لا يطابق نسخة المنيو أو قناة البيع.";
  if (quote.canCommit !== false || quote.finalPayableHalalas !== null
    || quote.taxHalalas !== null || quote.discountHalalas !== null) {
    return "تم تغيير عقد التسعير المالي؛ أوقف المعاينة وراجع تكامل الفاتورة.";
  }
  if (!Array.isArray(quote.lines) || quote.lines.length !== request.items.length
    || !safeHalalas(quote.provisionalSubtotalHalalas)
    || !Number.isSafeInteger(quote.itemCount)
    || quote.itemCount < 1) return "بيانات تسعير السلة غير مكتملة.";
  let count = 0;
  let total = 0;
  for (let index = 0; index < request.items.length; index += 1) {
    const item = request.items[index];
    const line = quote.lines[index];
    if (!line || line.productId !== item.productId || line.variantId !== item.variantId
      || line.quantity !== item.quantity || !Number.isSafeInteger(line.quantity)
      || line.quantity < 1 || line.quantity > 99 || !Array.isArray(line.addons)
      || line.addons.length !== (item.addons?.length ?? item.addonIds?.length ?? 0)
      || !safeHalalas(line.basePriceHalalas)
      || !safeHalalas(line.unitPriceHalalas)
      || !safeHalalas(line.lineTotalHalalas)
      || typeof line.name !== "string" || !line.name.trim()
      || typeof line.variantLabel !== "string" || !line.variantLabel.trim()) {
      return "تفاصيل السلة لا تطابق رد السيرفر.";
    }
    const addonIds = line.addons.map((addon) =>
      addon.productId + ":" + (addon.quantity ?? 1)).sort();
    const expectedAddons = item.addons ?? (item.addonIds ?? []).map(productId =>
      ({ productId, quantity: 1 }));
    const expectedIds = expectedAddons.map(addon =>
      addon.productId + ":" + addon.quantity).sort();
    if (JSON.stringify(addonIds) !== JSON.stringify(expectedIds)) {
      return "الإضافات وكمياتها لا تطابق رد السيرفر.";
    }
    let addonsTotal = 0;
    for (const addon of line.addons) {
      if (!safeHalalas(addon.priceHalalas) || typeof addon.name !== "string"
        || !addon.name.trim()) return "تفاصيل سعر الإضافات غير صحيحة.";
      if (!Number.isSafeInteger(addon.quantity ?? 1) || (addon.quantity ?? 1) < 1
        || (addon.quantity ?? 1) > 10) return "كمية الإضافة غير صالحة.";
      addonsTotal += addon.priceHalalas * (addon.quantity ?? 1);
    }
    if (!Number.isSafeInteger(addonsTotal)
      || line.basePriceHalalas + addonsTotal !== line.unitPriceHalalas
      || line.unitPriceHalalas * line.quantity !== line.lineTotalHalalas) {
      return "يوجد اختلاف حسابي في رد التسعير.";
    }
    total += line.lineTotalHalalas;
    count += line.quantity;
    if (!safeHalalas(total) || !Number.isSafeInteger(count)) {
      return "إجمالي الطلب تجاوز الحد الآمن.";
    }
  }
  if (count !== quote.itemCount || total !== quote.provisionalSubtotalHalalas) {
    return "الإجمالي المبدئي لا يطابق تفاصيل الطلب.";
  }
  return null;
}
