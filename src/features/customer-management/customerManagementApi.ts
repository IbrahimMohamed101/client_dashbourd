import api from "@/lib/apis";
import { parseApiError } from "@/lib/apiErrors";
import { normalizePhoneE164 } from "@/utils/fetchUsersData";

export type CustomerAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  district?: string;
  street?: string;
  building?: string;
  apartment?: string;
  notes?: string;
  lat?: number;
  lng?: number;
};

export type MealCompensation = {
  id: string | null;
  idempotencyKey: string;
  quantity: number;
  reason: string;
  byUserId: string | null;
  byRole: string;
  before: { totalMeals: number; remainingMeals: number };
  after: { totalMeals: number; remainingMeals: number };
  createdAt: string | null;
};

export type ManagedCustomerProfile = {
  id: string;
  coreUserId: string;
  appUserId: string | null;
  fullName: string | null;
  phone: string;
  phoneE164: string;
  email: string | null;
  isActive: boolean;
  activeSubscription: {
    id: string;
    displayId: string;
    status: string;
    planId: string | null;
    planName: { ar: string; en: string } | null;
    startDate: string | null;
    endDate: string | null;
    validityEndDate: string | null;
    deliveryMode: "delivery" | "pickup";
    deliveryAddress: CustomerAddress | null;
    selectedMealsPerDay: number;
    selectedGrams: number;
    balances: {
      totalMeals: number;
      remainingMeals: number;
      remainingRegularMeals: number;
      remainingPremiumMeals: number;
      consumedMeals: number;
      reservedMeals: number;
      forfeitedMeals: number;
      compensatedMealsTotal: number;
    };
    compensationHistory: MealCompensation[];
  } | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CustomerManagementDraft = {
  fullName: string;
  phone: string;
  email: string;
  isActive: boolean;
  deliveryAddress: Required<
    Pick<
      CustomerAddress,
      | "line1"
      | "line2"
      | "city"
      | "district"
      | "street"
      | "building"
      | "apartment"
      | "notes"
    >
  > & Pick<CustomerAddress, "lat" | "lng">;
};

export type UpdateCustomerManagementPayload = {
  reason: string;
  fullName?: string | null;
  phone?: string;
  email?: string | null;
  isActive?: boolean;
  deliveryAddress?: CustomerAddress;
};

type CustomerManagementUpdateResponse = {
  status: boolean;
  data: ManagedCustomerProfile;
  meta: {
    changedFields: string[];
    sessionsRevoked: boolean;
  };
};

type MealCompensationResponse = {
  status: boolean;
  data: ManagedCustomerProfile;
  meta: {
    compensation: MealCompensation;
    replayed: boolean;
  };
};

const CUSTOMER_MANAGEMENT_ROUTE = "/api/dashboard/customer-management";
const ADDRESS_TEXT_KEYS = [
  "line1",
  "line2",
  "city",
  "district",
  "street",
  "building",
  "apartment",
  "notes",
] as const;

export function draftFromManagedCustomer(
  profile: ManagedCustomerProfile
): CustomerManagementDraft {
  const address = profile.activeSubscription?.deliveryAddress ?? {};
  return {
    fullName: profile.fullName ?? "",
    phone: profile.phoneE164 || profile.phone || "",
    email: profile.email ?? "",
    isActive: profile.isActive,
    deliveryAddress: {
      ...(Object.fromEntries(
        ADDRESS_TEXT_KEYS.map((key) => [key, String(address[key] ?? "")])
      ) as Required<Pick<CustomerAddress, (typeof ADDRESS_TEXT_KEYS)[number]>>),
      ...(typeof address.lat === "number" ? { lat: address.lat } : {}),
      ...(typeof address.lng === "number" ? { lng: address.lng } : {}),
    },
  };
}

function normalizedAddress(draft: CustomerManagementDraft) {
  const address: CustomerAddress = {};
  for (const key of ADDRESS_TEXT_KEYS) {
    const value = draft.deliveryAddress[key].trim();
    if (value) address[key] = value;
  }

  if (typeof draft.deliveryAddress.lat === "number") {
    address.lat = draft.deliveryAddress.lat;
  }
  if (typeof draft.deliveryAddress.lng === "number") {
    address.lng = draft.deliveryAddress.lng;
  }
  return address;
}

function comparableAddress(value: CustomerAddress | null | undefined) {
  const result: Record<string, string | number> = {};
  for (const key of ADDRESS_TEXT_KEYS) {
    const text = String(value?.[key] ?? "").trim();
    if (text) result[key] = text;
  }
  if (typeof value?.lat === "number") result.lat = value.lat;
  if (typeof value?.lng === "number") result.lng = value.lng;
  return result;
}

export function buildCustomerManagementUpdate(
  original: ManagedCustomerProfile,
  draft: CustomerManagementDraft,
  reason: string
): UpdateCustomerManagementPayload | null {
  const payload: UpdateCustomerManagementPayload = { reason: reason.trim() };
  const fullName = draft.fullName.trim().replace(/\s+/g, " ") || null;
  const email = draft.email.trim().toLowerCase() || null;
  const phone = normalizePhoneE164(draft.phone.trim());

  if (fullName !== (original.fullName ?? null)) payload.fullName = fullName;
  if (phone !== (original.phoneE164 || original.phone)) payload.phone = phone;
  if (email !== (original.email ?? null)) payload.email = email;
  if (draft.isActive !== original.isActive) payload.isActive = draft.isActive;

  if (original.activeSubscription?.deliveryMode === "delivery") {
    const address = normalizedAddress(draft);
    if (
      JSON.stringify(comparableAddress(address)) !==
      JSON.stringify(comparableAddress(original.activeSubscription.deliveryAddress))
    ) {
      payload.deliveryAddress = address;
    }
  }

  return Object.keys(payload).length > 1 ? payload : null;
}

export async function fetchManagedCustomer(customerId: string) {
  const response = await api.get(`${CUSTOMER_MANAGEMENT_ROUTE}/${customerId}`, {
    suppressGlobalForbiddenToast: true,
  });
  return response.data.data as ManagedCustomerProfile;
}

export async function updateManagedCustomer({
  customerId,
  payload,
}: {
  customerId: string;
  payload: UpdateCustomerManagementPayload;
}) {
  const response = await api.patch<CustomerManagementUpdateResponse>(
    `${CUSTOMER_MANAGEMENT_ROUTE}/${customerId}`,
    payload,
    { suppressGlobalForbiddenToast: true }
  );
  return response.data;
}

export async function grantMealCompensation({
  customerId,
  quantity,
  reason,
  idempotencyKey,
}: {
  customerId: string;
  quantity: number;
  reason: string;
  idempotencyKey: string;
}) {
  const response = await api.post<MealCompensationResponse>(
    `${CUSTOMER_MANAGEMENT_ROUTE}/${customerId}/meal-compensations`,
    { quantity, reason: reason.trim(), idempotencyKey },
    { suppressGlobalForbiddenToast: true }
  );
  return response.data;
}

export function getCustomerManagementErrorMessage(error: unknown) {
  const parsed = parseApiError(error);
  const code = parsed.code?.toUpperCase();

  if (code === "CUSTOMER_IDENTITY_CONFLICT" || parsed.status === 409) {
    return "رقم الجوال أو البريد الإلكتروني مستخدم في حساب آخر";
  }
  if (code === "ACTIVE_DELIVERY_SUBSCRIPTION_REQUIRED") {
    return "لا يمكن تعديل العنوان بدون اشتراك توصيل نشط";
  }
  if (code === "ACTIVE_SUBSCRIPTION_REQUIRED") {
    return "لا يمكن إضافة تعويض بدون اشتراك نشط";
  }
  if (code === "INVALID_COMPENSATION_QUANTITY") {
    return "عدد الوجبات التعويضية يجب أن يكون من 1 إلى 100";
  }
  if (code === "BALANCE_CHANGED") {
    return "تغير رصيد الاشتراك أثناء العملية؛ حدّث البيانات وحاول مرة أخرى";
  }
  if (code === "TRANSACTION_REQUIRED") {
    return "التحديث الآمن غير متاح حاليًا؛ لم يتم تغيير أي بيانات";
  }
  if (code === "NO_CHANGES") return "لم يتم إجراء أي تغيير على البيانات";
  if (code === "REASON_REQUIRED") return "اكتب سبب التعديل قبل الحفظ";
  if (code === "INVALID_PHONE") return "رقم الجوال السعودي غير صحيح";
  if (code === "INVALID_EMAIL") return "البريد الإلكتروني غير صحيح";
  if (parsed.status === 403) return "هذه الصفحة متاحة للسوبر أدمين فقط";
  if (parsed.status === 404) return "العميل غير موجود";
  if (parsed.status && parsed.status >= 500) return "تعذر تحديث البيانات حاليًا";
  return "تحقق من البيانات المدخلة وحاول مرة أخرى";
}
