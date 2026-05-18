type ApiErrorLike = {
  response?: {
    data?: {
      message?: unknown;
      error?:
        | string
        | {
            message?: unknown;
            messageKey?: unknown;
          };
    };
  };
  message?: unknown;
};

export function getApiErrorMessage(error: ApiErrorLike): string {
  const data = error.response?.data;

  if (typeof data?.message === "string") return data.message;

  if (typeof data?.error === "string") return data.error;

  if (typeof data?.error?.message === "string") return data.error.message;

  if (typeof data?.error?.messageKey === "string") {
    return data.error.messageKey;
  }

  if (typeof error.message === "string") return error.message;

  return "Unexpected error";
}
