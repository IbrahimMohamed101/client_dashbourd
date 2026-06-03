import { queryOptions, useQuery } from "@tanstack/react-query";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  fetchMenuCategories,
  fetchMenuCategoryById,
  fetchCreateMenuCategory,
  fetchUpdateMenuCategory,
  fetchDeleteMenuCategory,
  fetchReorderMenuCategories,
} from "@/utils/fetchMenuCategories";
import type {
  MenuListParams,
  CreateMenuCategoryPayload,
  UpdateMenuCategoryPayload,
  ReorderItem,
} from "@/types/menuTypes";

const CATEGORIES_KEY = "menu.categories";

export const menuCategoriesQueryOptions = (params: MenuListParams = {}) =>
  queryOptions({
    queryKey: [CATEGORIES_KEY, params],
    queryFn: () => fetchMenuCategories(params),
    staleTime: 1000 * 60 * 2,
  });

export const useMenuCategoriesQuery = (params: MenuListParams = {}) =>
  useQuery(menuCategoriesQueryOptions(params));

export const menuCategoryDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [CATEGORIES_KEY, "detail", id],
    queryFn: () => fetchMenuCategoryById(id),
    staleTime: 1000 * 60 * 2,
  });

export const useMenuCategoryDetailQuery = (id: string) =>
  useQuery({
    ...menuCategoryDetailQueryOptions(id),
    enabled: !!id && id !== "undefined" && id !== "null",
  });

export const useCreateMenuCategoryMutation = () =>
  useMutationWithToast({
    mutationFn: (data: CreateMenuCategoryPayload) => fetchCreateMenuCategory(data),
    successMessage: "تم إنشاء التصنيف بنجاح",
    invalidateKeys: [[CATEGORIES_KEY]],
  });

export const useUpdateMenuCategoryMutation = () =>
  useMutationWithToast({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuCategoryPayload }) =>
      fetchUpdateMenuCategory(id, data),
    successMessage: "تم تحديث التصنيف بنجاح",
    invalidateKeys: [[CATEGORIES_KEY]],
  });

export const useDeleteMenuCategoryMutation = () =>
  useMutationWithToast({
    mutationFn: (id: string) => fetchDeleteMenuCategory(id),
    successMessage: "تم حذف التصنيف بنجاح",
    invalidateKeys: [[CATEGORIES_KEY]],
  });

export const useReorderMenuCategoriesMutation = () =>
  useMutationWithToast({
    mutationFn: (items: ReorderItem[]) => fetchReorderMenuCategories(items),
    successMessage: "تم إعادة ترتيب التصنيفات",
    invalidateKeys: [[CATEGORIES_KEY]],
  });
