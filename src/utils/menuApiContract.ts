import type { MenuVersionListParams } from "@/types/menuTypes";
import { buildListQuery } from "@/utils/menu/buildListQuery";

export const menuOptionVisibilityUrl = (id: string) =>
  `/api/dashboard/menu/options/${id}/visibility`;

export const menuOptionGroupVisibilityUrl = (id: string) =>
  `/api/dashboard/menu/option-groups/${id}/visibility`;

export const menuVersionsUrl = (params: MenuVersionListParams = {}) =>
  `/api/dashboard/menu/versions${buildListQuery(params)}`;

export const menuRollbackUrl = (versionId: string) =>
  `/api/dashboard/menu/rollback/${versionId}`;
