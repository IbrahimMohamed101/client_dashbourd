import type { AuthResponse, User } from "@/types/auth";

type AuthResponsePayload = Partial<AuthResponse> & {
  data?: {
    token?: string;
    user?: User | null;
  };
};

export function normalizeAuthResponse(
  payload: AuthResponsePayload
): AuthResponse {
  return {
    status: Boolean(payload.status),
    token: payload.token ?? payload.data?.token ?? "",
    user: payload.data?.user ?? payload.user ?? null,
  };
}
