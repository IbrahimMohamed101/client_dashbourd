import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  MENU_PRODUCT_AND_CATEGORY_INVALIDATION_KEYS,
  MENU_PRODUCT_INVALIDATION_KEYS,
} from "@/hooks/menu/menuProductInvalidation";
import {
  fetchMenuProducts,
  fetchMenuProductById,
  fetchMenuProductComposer,
  fetchCreateMenuProduct,
  fetchUpdateMenuProduct,
  fetchBulkUpdateMenuProducts,
  fetchUpdateMenuProductAvailability,
  fetchDuplicateMenuProduct,
  fetchDeleteMenuProduct,
  fetchReorderMenuProducts,
} from "@/utils/fetchMenuProducts";
import { removePaginatedCacheItem } from "@/utils/removePaginatedCacheItem";
import type {
  MenuProductListParams,
  MenuProductsResponse,
  MenuProductComposerResponse,
  CreateMenuProductPayload,
  UpdateMenuProductPayload,
  BulkUpdateProductsPayload,
  ReorderItem,
} from "@/types/menuTypes";

const PRODUCTS_KEY = "menu.products";

export const menuProductsQueryOptions = (params: MenuProductListParams = {}) =>
  queryOptions({
    queryKey: [PRODUCTS_KEY, params],
    queryFn: () => fetchMenuProducts(params),
    staleTime: Infinity,
  });

export const useMenuProductsQuery = (
  params: MenuProductListParams = {},
  enabled = true
) =>
  useQuery({
    ...menuProductsQueryOptions(params),
    enabled,
  });

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
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

export const useMenuProductComposerQuery = (id: string) =>
  useQuery({
    ...menuProductComposerQueryOptions(id),
    enabled: !!id && id !== "undefined" && id !== "null",
  });

export const useCreateMenuProductMutation = () =>
  useMutationWithToast({
    mutationFn: (data: CreateMenuProductPayload) =>
      fetchCreateMenuProduct(data),
    successMessage: "تم إنشاء المنتج بنجاح",
    invalidateKeys: MENU_PRODUCT_INVALIDATION_KEYS,
  });

export const useUpdateMenuProductMutation = () =>
  useMutationWithToast({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMenuProductPayload;
    }) => fetchUpdateMenuProduct(id, data),
    successMessage: "تم تحديث المنتج بنجاح",
    invalidateKeys: MENU_PRODUCT_INVALIDATION_KEYS,
  });

export const useBulkUpdateMenuProductsMutation = () =>
  useMutationWithToast({
    mutationFn: (data: BulkUpdateProductsPayload) =>
      fetchBulkUpdateMenuProducts(data),
    successMessage: "تم تحديث المنتجات المحددة بنجاح",
    invalidateKeys: MENU_PRODUCT_AND_CATEGORY_INVALIDATION_KEYS,
  });

export const useToggleMenuProductAvailabilityMutation = () =>
  useMutationWithToast({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      fetchUpdateMenuProductAvailability(id, isAvailable),
    successMessage: "تم تحديث حالة التوفر",
    invalidateKeys: MENU_PRODUCT_INVALIDATION_KEYS,
  });

export const useDuplicateMenuProductMutation = () =>
  useMutationWithToast({
    mutationFn: (id: string) => fetchDuplicateMenuProduct(id),
    successMessage: "تم نسخ المنتج بنجاح",
    invalidateKeys: MENU_PRODUCT_INVALIDATION_KEYS,
  });

export const useDeleteMenuProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast({
    mutationFn: (id: string) => fetchDeleteMenuProduct(id),
    successMessage: "تم حذف المنتج بنجاح",
    invalidateKeys: MENU_PRODUCT_INVALIDATION_KEYS,
    onSuccess: (_, id) => {
      queryClient.setQueriesData<MenuProductsResponse>(
        { queryKey: [PRODUCTS_KEY] },
        (current) => removePaginatedCacheItem(current, id)
      );
    },
  });
};

export const useReorderMenuProductsMutation = () =>
  useMutationWithToast({
    mutationFn: (items: ReorderItem[]) => fetchReorderMenuProducts(items),
    successMessage: "تم إعادة ترتيب المنتجات",
    invalidateKeys: MENU_PRODUCT_INVALIDATION_KEYS,
  });
