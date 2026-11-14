import type { PosInvoice, PosRefund, PosRefundRequest } from "./financialApi";

/** Read-only estimate matching the backend's per-original-line half-up rounding.
 * The server remains authoritative and rejects stale refund balances. */
export function estimateRefundGrossHalalas(
  invoice: PosInvoice,
  prior: PosRefund[],
  lines: PosRefundRequest["lines"],
): number {
  return lines.reduce((total, item) => {
    const line = invoice.lines.find((entry) => entry.id === item.lineId);
    if (!line || item.quantity <= 0) return total;
    const earlier = prior.flatMap((refund) => refund.lines)
      .filter((entry) => entry.lineId === item.lineId);
    const returnedQuantity = earlier.reduce((sum, entry) => sum + entry.quantity, 0);
    const returnedGrossHalalas = earlier.reduce((sum, entry) => sum + entry.grossHalalas, 0);
    const value = returnedQuantity + item.quantity === line.quantity
      ? line.grossHalalas - returnedGrossHalalas
      : Math.floor((line.grossHalalas * item.quantity * 2 + line.quantity) / (2 * line.quantity));
    return total + Math.max(0, value);
  }, 0);
}
