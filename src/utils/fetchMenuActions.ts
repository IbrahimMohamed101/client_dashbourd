import api from "@/lib/apis";
import type {
  MenuValidationResponse,
  MenuPublishResponse,
  MenuAuditLogsResponse,
  MenuAuditLogParams,
  MenuVersionsResponse,
  MenuVersionListParams,
  MenuRollbackResponse,
} from "@/types/menuTypes";
import { buildListQuery } from "@/utils/menu/buildListQuery";
import { menuRollbackUrl, menuVersionsUrl } from "@/utils/menuApiContract";

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

// ── Menu Versions ──
// GET /api/dashboard/menu/versions

export const fetchMenuVersions = async (
  params: MenuVersionListParams = {}
): Promise<MenuVersionsResponse> => {
  const response = await api.get(menuVersionsUrl(params));
  return response.data;
};

// ── Rollback Menu Version ──
// POST /api/dashboard/menu/rollback/:versionId

export const fetchRollbackMenuVersion = async (
  versionId: string
): Promise<MenuRollbackResponse> => {
  const response = await api.post(menuRollbackUrl(versionId), { confirm: true });
  return response.data;
};
