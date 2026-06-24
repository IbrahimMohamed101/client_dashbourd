interface PaymentDTO {
  id: string;
  customerName: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "refunded" | "completed";
  method: "credit_card" | "apple_pay" | "google_pay" | "wallet";
  date: string;
  reference: string;
}

interface LocalizedTextDTO {
  ar?: string | null;
  en?: string | null;
}

interface PromoCodeStateDTO {
  isExpired: boolean;
  isStarted: boolean;
  isDeleted: boolean;
  isUsageExhausted?: boolean;
  isCurrentlyValid: boolean;
}

type PromoCodeDiscountType = "percentage" | "fixed" | "fixed_amount";
type PromoCodeAppliesTo = "subscription" | "addon_plans" | "all";

type PromoCodeDisplayStatus = "active" | "expired" | "inactive" | "archived";

interface PromoCodeUsageDTO {
  id: string;
  userId?: string | null;
  checkoutDraftId?: string | null;
  subscriptionId?: string | null;
  paymentId?: string | null;
  discountAmountHalala: number;
  status: string;
  reservedAt?: string | null;
  consumedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string | null;
}

interface PromoCodeDTO {
  id: string;
  code: string;
  name?: LocalizedTextDTO | null;
  title?: string | null;
  description?: string | null;
  discountType: PromoCodeDiscountType;
  discountValue: number;
  isActive: boolean;
  appliesTo?: PromoCodeAppliesTo | string | null;
  appliesToList?: string[];
  currency?: string | null;
  maxDiscountAmountHalala?: number | null;
  minimumSubscriptionAmountHalala?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  deletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  usageLimitTotal?: number | null;
  usageLimitPerUser?: number | null;
  currentUsageCount?: number | null;
  usedCount?: number | null;
  eligiblePlanIds?: string[];
  planIds?: string[];
  eligiblePlanDaysCounts?: number[];
  firstPurchaseOnly?: boolean;
  allowedUserIds?: string[];
  metadata?: Record<string, unknown> | null;
  recentUsage?: PromoCodeUsageDTO[];
  state: PromoCodeStateDTO;
}

interface PromoCodesListMeta {
  total: number;
  totalPages: number;
  currentPage: number;
  lastPage: number;
  limit?: number;
  page?: number;
}

interface PromoCodesListResponse {
  data: PromoCodeDTO[];
  meta: PromoCodesListMeta;
}

interface PromoCodePayload {
  code: string;
  name?: LocalizedTextDTO;
  discountType: "percentage" | "fixed";
  discountValue: number;
  usageLimitTotal?: number | null;
  usageLimitPerUser?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  appliesTo?: PromoCodeAppliesTo;
  isActive?: boolean;
}

interface PromoCodeValidationResult {
  valid: boolean;
  promo?: {
    code?: string;
    discountType?: PromoCodeDiscountType;
    discountValue?: number;
    discountAmountHalala?: number;
    isApplied?: boolean;
  };
  breakdown?: Record<string, unknown>;
}

type StatusFilter = PromoCodeDisplayStatus | "all";

export type {
  PaymentDTO,
  LocalizedTextDTO,
  PromoCodeStateDTO,
  PromoCodeDiscountType,
  PromoCodeAppliesTo,
  PromoCodeDisplayStatus,
  PromoCodeUsageDTO,
  PromoCodeDTO,
  PromoCodesListMeta,
  PromoCodesListResponse,
  PromoCodePayload,
  PromoCodeValidationResult,
  StatusFilter,
};