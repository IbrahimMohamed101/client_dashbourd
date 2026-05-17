export interface UnifiedQueueItem {
  id: string;
  status: string;
  method: "delivery" | "pickup";
  allowedActions: string[];
  notes?: string;
  userName?: string;
  userPhone?: string;
  source?: "subscription" | "one_time_order";
  entityType?: "subscription_day" | "order";
  subscriptionDayId?: string;
  mealSlots?: {
    slot: string;
    items: { name: string; quantity: number; notes?: string }[];
  }[];
  entityId?: string;
  orderNumber?: string;
  items?: { id: string; name: string; quantity: number; notes?: string }[];
  paymentStatus?: string;
  pickup?: {
    branchId: string;
    branchName?: string;
    window?: string;
    pickupCode?: string;
  };
}

export interface UnifiedOperationalDTO {
  id: string;
  type: "subscription" | "order";
  source?: "subscription" | "one_time_order";
  mode: "delivery" | "pickup";
  reference: string;
  status: string;
  ui: {
    label: string;
    color: string;
    icon: string;
    badgeText?: string;
  };
  customer: { name: string; phone: string };
  context: {
    date: string;
    window?: string;
    addressSummary?: string;
    pickupCode?: string;
    notes?: string;
    cancelInfo?: { reason: string; note?: string };
    orderDetails?: string;
  };
  allowedActions: string[];
  timestamps: { createdAt: string; updatedAt: string };
}

export const isOneTimeOrder = (item: { source?: string; entityType?: string }): boolean => {
  return item.source === "one_time_order" || item.entityType === "order";
};
