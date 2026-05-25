import api from "./apis";
import { queryOptions } from "@tanstack/react-query";
import type { AuthResponse, LoginCredentials } from "@/types/auth";
import { normalizeAuthResponse } from "./authResponse";

export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>(
    "/api/dashboard/auth/login",
    credentials
  );

  return normalizeAuthResponse(response.data);
};


export const getSession = async (): Promise<AuthResponse> => {
  const response = await api.get<AuthResponse>("/api/dashboard/auth/me");
  return normalizeAuthResponse(response.data);
};

export const logout = async (): Promise<void> => {
  await api.post("/api/dashboard/auth/logout");
};

export const sessionQueryOptions = queryOptions({
  queryKey: ["session"],
  queryFn: getSession,
  staleTime: 1000 * 60 * 5, // 5 minutes
  retry: false, // Do not retry on failure (e.g. 401 Unauthorized)
});
