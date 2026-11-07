import type { PosFinanceQuote, PosFinanceQuoteRequest } from "./financialApi";

function amount(n: unknown) {
  return typeof n === "number" && Number.isSafeInteger(n) && n >= 0 && n <= 1_000_000_000;
}

/** Frontend fail-closed consistency guard, not a substitute for backend authority. */
export function validateFinancialQuote(request: PosFinanceQuoteRequest, quote: PosFinanceQuote): string | null {
  if (!quote || quote.revision !== request.revision || quote.channel !== request.channel
    || quote.currency !== "SAR" || quote.kind !== "STAGING_TEST_NON_TAX"
    || quote.rounding !== "HALF_UP_PER_LINE" || quote.vatRate !== "15%") {
    return "تسعير الفاتورة لا يطابق المنيو المنشور أو قواعد الحساب.";
  }
  if (!Array.isArray(quote.lines) || !Array.isArray(request.items)
    || !quote.totals || quote.lines.length < 1) return "سطور الفاتورة ناقصة.";
  let gross = 0, vat = 0, net = 0, before = 0, lineDiscount = 0, allocated = 0;
  for (const line of quote.lines) {
    if (!line || !amount(line.quantity) || line.quantity < 1
      || !amount(line.unitPriceHalalas) || !amount(line.beforeDiscountHalalas)
      || !amount(line.lineDiscountHalalas) || !amount(line.invoiceDiscountPartHalalas)
      || !amount(line.grossHalalas) || !amount(line.vatHalalas)
      || !amount(line.netHalalas)
      || line.beforeDiscountHalalas !== line.unitPriceHalalas * line.quantity
      || line.grossHalalas !== line.beforeDiscountHalalas
        - line.lineDiscountHalalas - line.invoiceDiscountPartHalalas
      || line.vatHalalas !== Math.floor((line.grossHalalas * 30 + 115) / 230)
      || line.netHalalas + line.vatHalalas !== line.grossHalalas) {
      return "حساب السطر في رد السيرفر غير متسق.";
    }
    before += line.beforeDiscountHalalas;
    lineDiscount += line.lineDiscountHalalas;
    allocated += line.invoiceDiscountPartHalalas;
    gross += line.grossHalalas;
    vat += line.vatHalalas;
    net += line.netHalalas;
  }
  const expectedProducts = request.items.map((item, index) => {
    const parentId = "i" + index;
    const main = { id: parentId, productId: item.productId, variantId: item.variantId,
      quantity: item.quantity, parentLineId: null };
    const addons = item.addons.map((addon, addonIndex) => ({
      id: parentId + ":a" + addonIndex, productId: addon.productId,
      parentLineId: parentId, quantity: addon.quantity * item.quantity,
    }));
    return [main, ...addons];
  }).flat();
  if (expectedProducts.length !== quote.lines.length
    || expectedProducts.some((wanted, index) => {
      const actual = quote.lines[index];
      return actual.id !== wanted.id || actual.productId !== wanted.productId
        || actual.parentLineId !== wanted.parentLineId
        || actual.quantity !== wanted.quantity
        || ("variantId" in wanted && actual.variantId !== wanted.variantId);
    })) return "أصناف الفاتورة أو كميات الإضافات لا تطابق السلة.";
  const t = quote.totals;
  if (!amount(t.beforeDiscountHalalas) || !amount(t.lineDiscountHalalas)
    || !amount(t.invoiceDiscountHalalas) || !amount(t.totalDiscountHalalas)
    || !amount(t.grossHalalas) || !amount(t.vatHalalas) || !amount(t.netHalalas)
    || t.beforeDiscountHalalas !== before || t.lineDiscountHalalas !== lineDiscount
    || t.invoiceDiscountHalalas !== allocated || t.totalDiscountHalalas !== allocated + lineDiscount
    || t.grossHalalas !== gross || t.vatHalalas !== vat || t.netHalalas !== net) {
    return "مجاميع الفاتورة غير متسقة مع السطور.";
  }
  return null;
}
