import type { MenuVersionListParams } from "@/types/menuTypes";
import { buildListQuery } from "@/utils/buildListQuery";

export const menuOptionVisibilityUrl = (id: string) =>
  `/api/dashboard/menu/options/${id}/visibility`;

export const menuCategoryVisibilityUrl = (id: string) =>
  `/api/dashboard/menu/categories/${id}/visibility`;

export const menuCategoryAvailabilityUrl = (id: string) =>
  `/api/dashboard/menu/categories/${id}/availability`;

export const menuProductVisibilityUrl = (id: string) =>
  `/api/dashboard/menu/products/${id}/visibility`;

export const menuOptionGroupVisibilityUrl = (id: string) =>
  `/api/dashboard/menu/option-groups/${id}/visibility`;

export const menuProductComposerUrl = (productId: string) =>
  `/api/dashboard/menu/products/${productId}/composer`;

export const menuPreviewUrl = () => "/api/dashboard/menu/preview";

export const menuDiffUrl = () => "/api/dashboard/menu/diff";

export const menuVersionsUrl = (params: MenuVersionListParams = {}) =>
  `/api/dashboard/menu/versions${buildListQuery(params)}`;

export const menuRollbackUrl = (versionId: string) =>
  `/api/dashboard/menu/rollback/${versionId}`;
