type ApiErrorData = {
  message?: unknown;
  code?: unknown;
  success?: unknown;
  status?: unknown;
  expectedField?: unknown;
  error?:
    | string
    | {
        message?: unknown;
        messageKey?: unknown;
        code?: unknown;
        details?: unknown;
      };
};

type ApiErrorLike = {
  response?: {
    data?: ApiErrorData;
  };
  message?: unknown;
  code?: unknown;
  status?: unknown;
};

const isApiErrorLike = (error: unknown): error is ApiErrorLike =>
  typeof error === "object" && error !== null;

export function getApiErrorMessage(error: unknown): string {
  const apiError = isApiErrorLike(error) ? error : {};
  const data: ApiErrorData = apiError.response?.data ?? {
    message: apiError.message,
    code: apiError.code,
    status: apiError.status,
  };

  if (typeof data?.message === "string") return data.message;

  if (typeof data?.error === "string") return data.error;

  if (typeof data?.error?.message === "string") return data.error.message;

  if (typeof data?.error?.messageKey === "string") {
    return data.error.messageKey;
  }

  if (typeof data?.error?.code === "string") return data.error.code;

  if (typeof data?.code === "string") return data.code;

  if (
    (data?.success === false || data?.status === false) &&
    typeof data?.expectedField === "string"
  ) {
    return `Expected field: ${data.expectedField}`;
  }

  if (typeof apiError.message === "string") return apiError.message;

  if (typeof apiError.code === "string") return apiError.code;

  return "Unexpected error";
}
