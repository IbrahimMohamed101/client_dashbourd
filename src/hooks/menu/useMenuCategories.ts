import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  MENU_CATEGORY_AND_PRODUCT_INVALIDATION_KEYS,
  MENU_CATEGORY_INVALIDATION_KEYS,
} from "@/hooks/menu/menuProductInvalidation";
import {
  fetchMenuCategories,
  fetchMenuCategoryById,
  fetchCreateMenuCategory,
  fetchUpdateMenuCategory,
  fetchBulkAssignProductsToCategory,
  fetchDeleteMenuCategory,
  fetchReorderMenuCategories,
} from "@/utils/fetchMenuCategories";
import { removePaginatedCacheItem } from "@/utils/removePaginatedCacheItem";
import type {
  MenuListParams,
  MenuCategoriesResponse,
  CreateMenuCategoryPayload,
  UpdateMenuCategoryPayload,
  BulkAssignProductsToCategoryPayload,
  ReorderItem,
} from "@/types/menuTypes";

const CATEGORIES_KEY = "menu.categories";

export const menuCategoriesQueryOptions = (params: MenuListParams = {}) =>
  queryOptions({
    queryKey: [CATEGORIES_KEY, params],
    queryFn: () => fetchMenuCategories(params),
    staleTime: Infinity,
  });

export const useMenuCategoriesQuery = (params: MenuListParams = {}) =>
  useQuery(menuCategoriesQueryOptions(params));

export const menuCategoryDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [CATEGORIES_KEY, "detail", id],
    queryFn: () => fetchMenuCategoryById(id),
    staleTime: Infinity,
  });

export const useMenuCategoryDetailQuery = (id: string) =>
  useQuery({
    ...menuCategoryDetailQueryOptions(id),
    enabled: !!id && id !== "undefined" && id !== "null",
  });

export const useCreateMenuCategoryMutation = () =>
  useMutationWithToast({
    mutationFn: (data: CreateMenuCategoryPayload) =>
      fetchCreateMenuCategory(data),
    successMessage: "تم إنشاء التصنيف بنجاح",
    invalidateKeys: MENU_CATEGORY_INVALIDATION_KEYS,
  });

export const useUpdateMenuCategoryMutation = () =>
  useMutationWithToast({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMenuCategoryPayload;
    }) => fetchUpdateMenuCategory(id, data),
    successMessage: "تم تحديث التصنيف بنجاح",
    invalidateKeys: MENU_CATEGORY_INVALIDATION_KEYS,
  });

export const useBulkAssignProductsToCategoryMutation = () =>
  useMutationWithToast({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: BulkAssignProductsToCategoryPayload;
    }) => fetchBulkAssignProductsToCategory(categoryId, data),
    successMessage: "تم تحديث منتجات التصنيف بنجاح",
    invalidateKeys: MENU_CATEGORY_AND_PRODUCT_INVALIDATION_KEYS,
  });

export const useDeleteMenuCategoryMutation = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast({
    mutationFn: (id: string) => fetchDeleteMenuCategory(id),
    successMessage: "تم حذف التصنيف بنجاح",
    invalidateKeys: MENU_CATEGORY_INVALIDATION_KEYS,
    onSuccess: (_, id) => {
      queryClient.setQueriesData<MenuCategoriesResponse>(
        { queryKey: [CATEGORIES_KEY] },
        (current) => removePaginatedCacheItem(current, id)
      );
    },
  });
};

export const useReorderMenuCategoriesMutation = () =>
  useMutationWithToast({
    mutationFn: (items: ReorderItem[]) => fetchReorderMenuCategories(items),
    successMessage: "تم إعادة ترتيب التصنيفات",
    invalidateKeys: MENU_CATEGORY_INVALIDATION_KEYS,
  });
