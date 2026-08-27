import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { parseApiError } from "./apiErrors";

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
    suppressGlobalForbiddenToast?: boolean;
  }
}

const api = axios.create({
  baseURL: import.meta.env?.VITE_BACKEND_URL || "",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Language": "ar",
  },
});

function createIdempotencyKey() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `manual-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("dashboardToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const method = String(config.method || "GET").toUpperCase();
    const url = String(config.url || "");
    if (method === "POST" && /\/manual-deduction(?:\?|$)/.test(url)) {
      const headers = config.headers as
        | (Record<string, unknown> & {
            get?: (header: string) => unknown;
            set?: (header: string, value: string) => void;
          })
        | undefined;
      const existing = typeof headers?.get === "function"
        ? headers.get("Idempotency-Key")
        : headers?.["Idempotency-Key"];
      if (!existing) {
        const key = createIdempotencyKey();
        if (typeof headers?.set === "function") {
          headers.set("Idempotency-Key", key);
        } else if (headers) {
          headers["Idempotency-Key"] = key;
        }
      }
    }

    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      const headers = config.headers as
        | (Record<string, unknown> & { delete?: (header: string) => void })
        | undefined;
      if (typeof headers?.delete === "function") {
        headers.delete("Content-Type");
      } else if (headers) {
        delete headers["Content-Type"];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const parsedError = parseApiError(error);
    const message = parsedError.message;

    if (
      (parsedError.status === 401 || parsedError.code === "TOKEN_REVOKED") &&
      !error.config?.skipAuthRedirect
    ) {
      Cookies.remove("dashboardToken");
      window.location.href = "/";
    }

    if (
      parsedError.status === 403 &&
      !error.config?.suppressGlobalForbiddenToast
    ) {
      toast.error(message || "ليس لديك صلاحية للوصول إلى هذا الإجراء");
    }

    (error as Error & { normalizedMessage?: string }).normalizedMessage =
      message;
    return Promise.reject(error);
  }
);

export default api;
