import { queryOptions, useQuery } from "@tanstack/react-query";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  fetchMenuProducts,
  fetchMenuProductById,
  fetchMenuProductComposer,
  fetchCreateMenuProduct,
  fetchUpdateMenuProduct,
  fetchUpdateMenuProductAvailability,
  fetchDuplicateMenuProduct,
  fetchDeleteMenuProduct,
  fetchReorderMenuProducts,
} from "@/utils/fetchMenuProducts";
import type {
  MenuProductListParams,
  MenuProductComposerResponse,
  CreateMenuProductPayload,
  UpdateMenuProductPayload,
  ReorderItem,
} from "@/types/menuTypes";

const PRODUCTS_KEY = "menu.products";

export const menuProductsQueryOptions = (params: MenuProductListParams = {}) =>
  queryOptions({
    queryKey: [PRODUCTS_KEY, params],
    queryFn: () => fetchMenuProducts(params),
    staleTime: Infinity,
  });

export const useMenuProductsQuery = (params: MenuProductListParams = {}) =>
  useQuery(menuProductsQueryOptions(params));

export const menuProductDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [PRODUCTS_KEY, "detail", id],
    queryFn: () => fetchMenuProductById(id),
    staleTime: Infinity,
  });

export const useMenuProductDetailQuery = (id: string) =>
  useQuery({
    ...menuProductDetailQueryOptions(id),
    enabled: !!id && id !== "undefined" && id !== "null",
  });

export const menuProductComposerQueryOptions = (id: string) =>
  queryOptions<MenuProductComposerResponse>({
    queryKey: [PRODUCTS_KEY, "composer", id],
    queryFn: () => fetchMenuProductComposer(id),
    staleTime: 1000 * 30,
  });

export const useMenuProductComposerQuery = (id: string) =>
  useQuery({
    ...menuProductComposerQueryOptions(id),
    enabled: !!id && id !== "undefined" && id !== "null",
  });

export const useCreateMenuProductMutation = () =>
  useMutationWithToast({
    mutationFn: (data: CreateMenuProductPayload) => fetchCreateMenuProduct(data),
    successMessage: "تم إنشاء المنتج بنجاح",
    invalidateKeys: [[PRODUCTS_KEY]],
  });

export const useUpdateMenuProductMutation = () =>
  useMutationWithToast({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuProductPayload }) =>
      fetchUpdateMenuProduct(id, data),
    successMessage: "تم تحديث المنتج بنجاح",
    invalidateKeys: [[PRODUCTS_KEY]],
  });

export const useToggleMenuProductAvailabilityMutation = () =>
  useMutationWithToast({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      fetchUpdateMenuProductAvailability(id, isAvailable),
    successMessage: "تم تحديث حالة التوفر",
    invalidateKeys: [[PRODUCTS_KEY]],
  });

export const useDuplicateMenuProductMutation = () =>
  useMutationWithToast({
    mutationFn: (id: string) => fetchDuplicateMenuProduct(id),
    successMessage: "تم نسخ المنتج بنجاح",
    invalidateKeys: [[PRODUCTS_KEY]],
  });

export const useDeleteMenuProductMutation = () =>
  useMutationWithToast({
    mutationFn: (id: string) => fetchDeleteMenuProduct(id),
    successMessage: "تم حذف المنتج بنجاح",
    invalidateKeys: [[PRODUCTS_KEY]],
  });

export const useReorderMenuProductsMutation = () =>
  useMutationWithToast({
    mutationFn: (items: ReorderItem[]) => fetchReorderMenuProducts(items),
    successMessage: "تم إعادة ترتيب المنتجات",
    invalidateKeys: [[PRODUCTS_KEY]],
  });
