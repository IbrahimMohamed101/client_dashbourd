import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { parseApiError } from "./apiErrors";

const api = axios.create({
  baseURL: import.meta.env?.VITE_BACKEND_URL || "",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Language": "ar",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("dashboardToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

    if (parsedError.status === 401) {
      Cookies.remove("dashboardToken");
      window.location.href = "/";
    }

    if (parsedError.status === 403) {
      toast.error(message || "Ù„ÙŠØ³ Ù„Ø¯ÙŠÙƒ ØµÙ„Ø§Ø­ÙŠØ© Ù„Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡");
    }

    (error as Error & { normalizedMessage?: string }).normalizedMessage =
      message;
    console.error("API Error:", message);
    return Promise.reject(error);
  }
);

export default api;
