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
  isCurrentlyValid: boolean;
}

type PromoCodeDiscountType = "percentage" | "fixed" | "fixed_amount";

type PromoCodeDisplayStatus = "active" | "expired" | "inactive";

interface PromoCodeDTO {
  id: string;
  code: string;
  name?: LocalizedTextDTO | null;
  discountType: PromoCodeDiscountType;
  discountValue: number;
  isActive: boolean;
  appliesTo?: string | null;
  appliesToList?: string[];
  currency?: string | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  usageLimitTotal?: number | null;
  usageLimitPerUser?: number | null;
  currentUsageCount?: number | null;
  usedCount?: number | null;
  eligiblePlanIds?: string[];
  firstPurchaseOnly?: boolean;
  deletedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  state: PromoCodeStateDTO;
}

interface PromoCodesListMeta {
  total: number;
  totalPages: number;
  currentPage: number;
  lastPage: number;
}

interface PromoCodesListResponse {
  data: PromoCodeDTO[];
  meta: PromoCodesListMeta;
}

interface PromoCodePayload {
  code: string;
  name?: LocalizedTextDTO;
  discountType: PromoCodeDiscountType;
  discountValue: number;
  usageLimitTotal?: number | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  appliesTo?: string;
  isActive?: boolean;
}

type StatusFilter = PromoCodeDisplayStatus | "all";

export type {
  PaymentDTO,
  LocalizedTextDTO,
  PromoCodeStateDTO,
  PromoCodeDiscountType,
  PromoCodeDisplayStatus,
  PromoCodeDTO,
  PromoCodesListMeta,
  PromoCodesListResponse,
  PromoCodePayload,
  StatusFilter,
};
