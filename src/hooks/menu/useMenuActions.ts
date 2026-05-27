import { queryOptions, useQuery } from "@tanstack/react-query";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  fetchValidateMenu,
  fetchPublishMenu,
  fetchMenuAuditLogs,
  fetchMenuVersions,
  fetchRollbackMenuVersion,
} from "@/utils/fetchMenuActions";
import type {
  MenuAuditLogParams,
  MenuVersionListParams,
} from "@/types/menuTypes";

const MENU_KEY = "menu";

export const useValidateMenuMutation = () =>
  useMutationWithToast({
    mutationFn: fetchValidateMenu,
    successMessage: "تم التحقق من القائمة بنجاح",
    errorMessage: "حدث خطأ أثناء التحقق من القائمة",
    invalidateKeys: [[MENU_KEY]],
  });

export const usePublishMenuMutation = () =>
  useMutationWithToast({
    mutationFn: (notes?: string) => fetchPublishMenu(notes),
    successMessage: "تم نشر القائمة بنجاح! 🎉",
    invalidateKeys: [[MENU_KEY]],
  });

export const menuAuditLogsQueryOptions = (params: MenuAuditLogParams = {}) =>
  queryOptions({
    queryKey: [MENU_KEY, "auditLogs", params],
    queryFn: () => fetchMenuAuditLogs(params),
    staleTime: 1000 * 60 * 1,
  });

export const useMenuAuditLogsQuery = (params: MenuAuditLogParams = {}) =>
  useQuery(menuAuditLogsQueryOptions(params));

export const menuVersionsQueryOptions = (params: MenuVersionListParams = {}) =>
  queryOptions({
    queryKey: [MENU_KEY, "versions", params],
    queryFn: () => fetchMenuVersions(params),
    staleTime: 1000 * 60 * 1,
  });

export const useMenuVersionsQuery = (params: MenuVersionListParams = {}) =>
  useQuery(menuVersionsQueryOptions(params));

export const useRollbackMenuVersionMutation = () =>
  useMutationWithToast({
    mutationFn: (versionId: string) => fetchRollbackMenuVersion(versionId),
    successMessage: "تم استرجاع نسخة القائمة بنجاح",
    invalidateKeys: [[MENU_KEY]],
  });
