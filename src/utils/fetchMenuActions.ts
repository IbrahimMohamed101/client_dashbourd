import api from "@/lib/apis";
import type {
  MenuValidationResponse,
  MenuPublishResponse,
  MenuAuditLogsResponse,
  MenuAuditLogParams,
} from "@/types/menuTypes";

// ── §13 Validate Menu ──
// POST /api/dashboard/menu/validate
// No body required.

export const fetchValidateMenu =
  async (): Promise<MenuValidationResponse> => {
    const response = await api.post("/api/dashboard/menu/validate");
    return response.data;
  };

// ── §14 Publish Menu ──
// POST /api/dashboard/menu/publish

export const fetchPublishMenu = async (
  notes?: string
): Promise<MenuPublishResponse> => {
  const response = await api.post("/api/dashboard/menu/publish", { notes });
  return response.data;
};

// ── §15 Menu Audit Logs ──
// GET /api/dashboard/menu/audit-logs

export const fetchMenuAuditLogs = async (
  params: MenuAuditLogParams = {}
): Promise<MenuAuditLogsResponse> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.action) searchParams.append("action", params.action);
  if (params.entityType) searchParams.append("entityType", params.entityType);
  if (params.entityId) searchParams.append("entityId", params.entityId);

  const query = searchParams.toString();
  const response = await api.get(
    `/api/dashboard/menu/audit-logs${query ? `?${query}` : ""}`
  );
  return response.data;
};
