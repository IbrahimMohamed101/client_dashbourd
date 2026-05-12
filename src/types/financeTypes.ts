export interface PaymentDTO {
  id: string;
  customerName: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "refunded" | "completed";
  method: "credit_card" | "apple_pay" | "google_pay" | "wallet";
  date: string;
  reference: string;
}

export interface PromoCodeDTO {
  id: string;
  code: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  usageCount: number;
  maxUsage?: number;
  expiryDate: string;
  status: "active" | "expired" | "disabled";
}
