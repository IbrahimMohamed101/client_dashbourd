import api from "@/lib/apis";

export type FinancialControlAction = "cancel" | "refund" | "cancel_and_refund";
export type RefundMode = "full" | "partial";
export type RefundChannel = "moyasar" | "payment_gateway" | "cash" | "bank_transfer";

export interface RefundablePayment {
  paymentId: string;
  providerPaymentId: string | null;
  provider: string | null;
  method: string | null;
  source: string | null;
  amountHalala: number;
  recordedRefundedHalala: number;
  refundableHalala: number;
  paidAt: string | null;
  currency: string;
}

export interface RefundRecord {
  id: string;
  paymentId: string | null;
  amountHalala: number;
  vatHalala: number;
  status: string;
  executionMode: "provider_confirmed" | "recorded_only" | null;
  refundChannel: RefundChannel | null;
  recordedAt: string | null;
  reason: string;
  settlement: {
    status: "pending" | "partially_settled" | "settled";
    method: RefundChannel | null;
    settledAmountHalala: number;
    settledAt: string | null;
    reference: string | null;
    note: string | null;
    providerConfirmedHalala: number;
  };
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
  // Contract guarantee from the backend: financial-control refund actions only
  // recognize the refund for accounting. They never execute a money transfer.
  accountingOnly: true;
  moneyMovementEnabled: false;
  refundChannels: RefundChannel[];
  payments: RefundablePayment[];
  refunds: RefundRecord[];
  totalRefundableHalala: number;
  pendingSettlementHalala: number;
}

export interface ExecuteFinancialControlPayload {
  action: FinancialControlAction;
  operationKey: string;
  reason: string;
  note?: string;
  paymentId?: string;
  refundMode?: RefundMode;
  refundChannel?: RefundChannel;
  amountHalala?: number;
}

export interface SettleRefundPayload {
  // This records how the money was returned outside the dashboard. Calling this
  // endpoint does not invoke Moyasar or another payment provider.
  method: RefundChannel;
  reference?: string;
  note?: string;
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

export async function settleRefund(
  subscriptionId: string,
  refundId: string,
  payload: SettleRefundPayload
) {
  const response = await api.post(
    `/api/dashboard/subscriptions/${subscriptionId}/financial-control/refunds/${refundId}/settle`,
    payload
  );
  return response.data;
}
