import type { PosInvoice } from "./financialApi";

export function refundDefaultMethod(method: PosInvoice["tender"]["method"]): "cash" | "network" | "external" {
  return method === "cash" ? "cash" : method === "network" ? "network" : "external";
}
