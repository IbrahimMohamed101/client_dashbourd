import api from "@/lib/apis";
import type {
  MenuValidationResponse,
  MenuPublishResponse,
  MenuAuditLogsResponse,
  MenuAuditLogParams,
} from "@/types/menuTypes";
import { buildListQuery } from "@/utils/menu/buildListQuery";

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
  const response = await api.get(
    `/api/dashboard/menu/audit-logs${buildListQuery(params)}`
  );
  return response.data;
};
