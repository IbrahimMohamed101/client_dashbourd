import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
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
    if (error.response?.status === 401) {
      Cookies.remove("dashboardToken");
      window.location.href = "/";
    }

    const data = error.response?.data;
    let message = "An unexpected error occurred";

    if (data) {
      if (typeof data.message === "string") {
        // Shape 1: { status: false, message: "..." }
        message = data.message;
      } else if (data.ok === false && data.error?.message) {
        // Shape 2: { ok: false, error: { code, message } }
        message = data.error.message;
      } else if (typeof data.error === "string") {
        message = data.error;
      }
    }

    // Attach normalized message so callers can use it consistently
    (error as Error & { normalizedMessage?: string }).normalizedMessage = message;
    console.error("API Error:", message);
    return Promise.reject(error);
  }
);

export default api;
