import api from "@/lib/apis";

export type FinancialControlAction = "cancel" | "refund" | "cancel_and_refund";
export type RefundMode = "full" | "partial";

export interface RefundablePayment {
  paymentId: string;
  providerPaymentId: string;
  amountHalala: number;
  recordedRefundedHalala: number;
  refundableHalala: number;
  paidAt: string | null;
  currency: string;
  providerRefundStatus: string | null;
}

export interface FinancialControlPreview {
  subscription: {
    id: string;
    displayId: string;
    status: string;
    canceledAt: string | null;
    cancellationReason: string;
  };
  canCancel: boolean;
  payments: RefundablePayment[];
  totalRefundableHalala: number;
}

export interface ExecuteFinancialControlPayload {
  action: FinancialControlAction;
  operationKey: string;
  reason: string;
  note?: string;
  paymentId?: string;
  refundMode?: RefundMode;
  amountHalala?: number;
}

export async function fetchFinancialControlPreview(subscriptionId: string) {
  const response = await api.get<{ status: boolean; data: FinancialControlPreview }>(
    `/api/dashboard/subscriptions/${subscriptionId}/financial-control`
  );
  return response.data.data;
}

export async function executeFinancialControl(
  subscriptionId: string,
  payload: ExecuteFinancialControlPayload
) {
  const response = await api.post(
    `/api/dashboard/subscriptions/${subscriptionId}/financial-control`,
    payload
  );
  return response.data;
}
