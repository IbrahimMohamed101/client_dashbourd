import api from "@/lib/apis";
import { parseApiError } from "@/lib/apiErrors";
import type {
  CreateAdminCustomerPayload,
  CreateAdminCustomerResult,
  PaginatedUsersResponse,
  ResetAdminCustomerPasswordPayload,
  ResetAdminCustomerPasswordResult,
  TemporaryCredentials,
  User,
} from "@/types/userTypes";

type ApiRecord = Record<string, unknown>;

const ADMIN_USERS_ROUTE = "/api/admin/users";

const isRecord = (value: unknown): value is ApiRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readBoolean = (value: unknown, fallback = false) =>
  typeof value === "boolean" ? value : fallback;

const readNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const normalizePhoneE164 = (value: string) => {
  const compact = value.replace(/[\s()-]/g, "");
  if (/^05\d{8}$/.test(compact)) return `+966${compact.slice(1)}`;
  if (/^5\d{8}$/.test(compact)) return `+966${compact}`;
  if (/^009665\d{8}$/.test(compact)) return `+${compact.slice(2)}`;
  return compact;
};

export const isValidSaudiPhoneE164 = (value: string) =>
  /^\+9665\d{8}$/.test(normalizePhoneE164(value));

export function normalizeAdminCustomer(raw: unknown): User {
  const record = isRecord(raw) ? raw : {};
  const phoneE164 =
    readString(record.phoneE164) ||
    readString(record.phone) ||
    readString(record.mobile) ||
    "";
  const subscriptionsCount =
    readNumber(record.subscriptionsCount) ||
    readNumber(record.totalSubscriptions) ||
    readNumber(record.subscriptionCounts);

  return {
    id:
      readString(record.id) ||
      readString(record.appUserId) ||
      readString(record.coreUserId) ||
      "",
    coreUserId: readString(record.coreUserId) ?? undefined,
    appUserId: readString(record.appUserId),
    fullName:
      readString(record.fullName) ||
      readString(record.name) ||
      readString(record.customerName),
    phone: phoneE164,
    phoneE164,
    email: readString(record.email),
    role: readString(record.role) || "user",
    isActive: readBoolean(record.isActive, true),
    accountStatus: readString(record.accountStatus) || undefined,
    forcePasswordChange: readBoolean(record.forcePasswordChange),
    authState:
      readString(record.authState) === "temporary_password" ||
      readString(record.authState) === "temporary_password_expired" ||
      readString(record.authState) === "active"
        ? (readString(record.authState) as User["authState"])
        : undefined,
    temporaryPasswordReason:
      readString(record.temporaryPasswordReason) === "admin_created" ||
      readString(record.temporaryPasswordReason) === "admin_reset"
        ? (readString(record.temporaryPasswordReason) as User["temporaryPasswordReason"])
        : null,
    temporaryPasswordIssuedAt: readString(record.temporaryPasswordIssuedAt),
    temporaryPasswordExpiresAt: readString(record.temporaryPasswordExpiresAt),
    lastAdminPasswordResetAt: readString(record.lastAdminPasswordResetAt),
    canResetPassword:
      typeof record.canResetPassword === "boolean"
        ? record.canResetPassword
        : undefined,
    fcmTokens: Array.isArray(record.fcmTokens) ? (record.fcmTokens as string[]) : [],
    subscriptionsCount,
    activeSubscriptionsCount:
      readNumber(record.activeSubscriptionsCount) ||
      readNumber(record.activeSubscriptions),
    createdAt: readString(record.createdAt) || "",
    updatedAt: readString(record.updatedAt) || "",
  };
}

function normalizeUsersResponse(response: unknown): PaginatedUsersResponse {
  const root = isRecord(response) ? response : {};
  const data = Array.isArray(root.data) ? root.data : [];
  const meta = isRecord(root.meta) ? root.meta : {};

  return {
    status: readBoolean(root.status, true),
    data: data.map(normalizeAdminCustomer),
    meta: {
      page: readNumber(meta.page, 1),
      limit: readNumber(meta.limit, data.length || 20),
      total: readNumber(meta.total, data.length),
      totalPages:
        readNumber(meta.totalPages) ||
        readNumber(meta.pages) ||
        Math.max(1, Math.ceil(data.length / 20)),
    },
  };
}

function normalizeUserDetailsResponse(response: unknown) {
  const root = isRecord(response) ? response : {};
  const data = isRecord(root.data) ? root.data : root;
  const user = isRecord(data.user) ? data.user : data;
  return {
    ...root,
    data: normalizeAdminCustomer(user),
  };
}

function normalizeTemporaryCredentials(raw: unknown): TemporaryCredentials {
  const record = isRecord(raw) ? raw : {};
  return {
    temporaryPassword: readString(record.temporaryPassword) || "",
    expiresAt: readString(record.expiresAt) || "",
    mustChangePassword: readBoolean(record.mustChangePassword, true),
  };
}

function normalizeCreateResponse(response: unknown): CreateAdminCustomerResult {
  const root = isRecord(response) ? response : {};
  const data = isRecord(root.data) ? root.data : {};
  const userNode = isRecord(data.user) ? data.user : data;
  const temporaryCredentials = normalizeTemporaryCredentials(
    data.temporaryCredentials
  );

  return {
    user: normalizeAdminCustomer(userNode),
    temporaryCredentials,
  };
}

function normalizeResetResponse(response: unknown): ResetAdminCustomerPasswordResult {
  const root = isRecord(response) ? response : {};
  const data = isRecord(root.data) ? root.data : {};
  return {
    userId: readString(data.userId) || "",
    phoneE164: readString(data.phoneE164) || readString(data.phone) || "",
    forcePasswordChange: true,
    temporaryPassword: readString(data.temporaryPassword) || "",
    temporaryPasswordExpiresAt: readString(data.temporaryPasswordExpiresAt) || "",
    sessionsRevoked: readBoolean(data.sessionsRevoked),
  };
}

export const fetchAdminCustomers = async ({
  page = 1,
  limit = 20,
  q,
}: {
  page?: number;
  limit?: number;
  q?: string;
} = {}): Promise<PaginatedUsersResponse> => {
  const params = new URLSearchParams();
  if (page) params.append("page", page.toString());
  if (limit) params.append("limit", limit.toString());
  const query = q?.trim();
  if (query) params.append("q", query);

  const response = await api.get(`${ADMIN_USERS_ROUTE}?${params.toString()}`);
  return normalizeUsersResponse(response.data);
};

export const fetchUsersList = fetchAdminCustomers;

export const fetchAdminCustomer = async (userId: string) => {
  const response = await api.get(`${ADMIN_USERS_ROUTE}/${userId}`);
  return normalizeUserDetailsResponse(response.data);
};

export const fetchUserDetails = fetchAdminCustomer;

export const fetchUserSubscriptions = async (userId: string) => {
  const response = await api.get(
    `/api/dashboard/users/${userId}/subscriptions`
  );
  return response.data;
};

export const createAdminCustomer = async (
  payload: CreateAdminCustomerPayload
) => {
  const response = await api.post(ADMIN_USERS_ROUTE, payload);
  return normalizeCreateResponse(response.data);
};

export const createUser = createAdminCustomer;

export const resetAdminCustomerPassword = async ({
  userId,
  payload,
}: {
  userId: string;
  payload: ResetAdminCustomerPasswordPayload;
}) => {
  const response = await api.post(
    `${ADMIN_USERS_ROUTE}/${userId}/reset-password`,
    payload
  );
  return normalizeResetResponse(response.data);
};

export const resetUserPassword = resetAdminCustomerPassword;

export const updateUser = async ({
  userId,
  data,
}: {
  userId: string;
  data: {
    isActive: boolean;
  };
}) => {
  const response = await api.put(`${ADMIN_USERS_ROUTE}/${userId}`, data);
  return response.data;
};

export function getAdminCustomerErrorMessage(error: unknown) {
  const parsed = parseApiError(error);
  const code = parsed.code?.toUpperCase();
  const message = parsed.message.toUpperCase();

  if (parsed.status === 409 || code === "CONFLICT") {
    return "يوجد مستخدم مسجل بنفس رقم الجوال أو البريد الإلكتروني";
  }
  if (
    code === "INVALID_PHONE" ||
    message.includes("INVALID_PHONE") ||
    message.includes("PHONE")
  ) {
    return "رقم الجوال غير صحيح";
  }
  if (parsed.status === 403 && message.includes("INACTIVE")) {
    return "يجب تفعيل حساب العميل قبل إعادة تعيين كلمة المرور";
  }
  if (parsed.status === 403 || code === "FORBIDDEN" || code === "UNAUTHORIZED") {
    return "ليس لديك صلاحية لتنفيذ هذا الإجراء";
  }
  if (parsed.status === 404 || code === "NOT_FOUND") {
    return "المستخدم غير موجود";
  }
  if (
    parsed.status === 400 ||
    parsed.status === 422 ||
    code === "INVALID" ||
    message.includes("VALIDATION")
  ) {
    return "تحقق من البيانات المدخلة";
  }
  if (parsed.status && parsed.status >= 500) {
    return "تعذر تنفيذ العملية حاليًا";
  }
  return parsed.message || "تعذر تنفيذ العملية حاليًا";
}
