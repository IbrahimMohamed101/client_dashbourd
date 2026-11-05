import api from "@/lib/apis";
import type { Channel } from "./previewCatalog";

export type PosQuoteLine = {
  productId: string;
  name: string;
  variantId: string;
  variantLabel: string;
  quantity: number;
  basePriceHalalas: number;
  addons: { productId: string; name: string; priceHalalas: number }[];
  unitPriceHalalas: number;
  lineTotalHalalas: number;
};

export type PosQuote = {
  revision: number;
  currency: "SAR";
  channel: Channel;
  lines: PosQuoteLine[];
  itemCount: number;
  provisionalSubtotalHalalas: number;
  finalPayableHalalas: null;
  taxHalalas: null;
  discountHalalas: null;
  canCommit: false;
  note: string;
};

export type PosQuoteRequest = {
  revision: number;
  channel: Channel;
  items: {
    productId: string;
    variantId: string;
    quantity: number;
    addonIds: string[];
  }[];
};

export async function fetchPosQuote(request: PosQuoteRequest): Promise<PosQuote> {
  const response = await api.post<{ data: PosQuote }>(
    "/api/dashboard/pos/quote",
    request
  );
  return response.data.data;
}
