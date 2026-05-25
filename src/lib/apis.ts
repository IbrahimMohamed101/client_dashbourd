import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { getApiErrorMessage } from "./apiErrors";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "",
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
    const message = getApiErrorMessage(error);

    if (error.response?.status === 401) {
      Cookies.remove("dashboardToken");
      window.location.href = "/";
    }

    if (error.response?.status === 403) {
      toast.error(message || "ليس لديك صلاحية للوصول إلى هذا الإجراء");
    }

    // Attach normalized message so callers can use it consistently
    (error as Error & { normalizedMessage?: string }).normalizedMessage = message;
    console.error("API Error:", message);
    return Promise.reject(error);
  }
);

export default api;
