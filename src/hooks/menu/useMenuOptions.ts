import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  fetchMenuOptions,
  fetchMenuOptionById,
  fetchCreateMenuOption,
  fetchUpdateMenuOption,
  fetchDeleteMenuOption,
  fetchReorderMenuOptions,
  fetchUpdateMenuOptionAvailability,
  fetchToggleMenuOptionActive,
} from "@/utils/fetchMenuOptions";
import { removePaginatedCacheItem } from "@/utils/removePaginatedCacheItem";
import type {
  MenuOptionListParams,
  MenuOptionsResponse,
  CreateMenuOptionPayload,
  UpdateMenuOptionPayload,
  ReorderItem,
} from "@/types/menuTypes";

const OPTIONS_KEY = "menu.options";

export const menuOptionsQueryOptions = (params: MenuOptionListParams = {}) =>
  queryOptions({
    queryKey: [OPTIONS_KEY, params],
    queryFn: () => fetchMenuOptions(params),
    staleTime: Infinity,
  });

export const useMenuOptionsQuery = (params: MenuOptionListParams = {}) =>
  useQuery(menuOptionsQueryOptions(params));

export const menuOptionDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [OPTIONS_KEY, "detail", id],
    queryFn: () => fetchMenuOptionById(id),
    staleTime: Infinity,
  });

export const useMenuOptionDetailQuery = (id: string) =>
  useQuery({
    ...menuOptionDetailQueryOptions(id),
    enabled: !!id && id !== "undefined" && id !== "null",
  });

export const useCreateMenuOptionMutation = () =>
  useMutationWithToast({
    mutationFn: (data: CreateMenuOptionPayload) => fetchCreateMenuOption(data),
    successMessage: "تم إنشاء الخيار بنجاح",
    invalidateKeys: [[OPTIONS_KEY]],
  });

export const useUpdateMenuOptionMutation = () =>
  useMutationWithToast({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuOptionPayload }) =>
      fetchUpdateMenuOption(id, data),
    successMessage: "تم تحديث الخيار بنجاح",
    invalidateKeys: [[OPTIONS_KEY]],
  });

export const useDeleteMenuOptionMutation = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast({
    mutationFn: (id: string) => fetchDeleteMenuOption(id),
    successMessage: "تم حذف الخيار بنجاح",
    invalidateKeys: [[OPTIONS_KEY]],
    onSuccess: (_, id) => {
      queryClient.setQueriesData<MenuOptionsResponse>(
        { queryKey: [OPTIONS_KEY] },
        (current) => removePaginatedCacheItem(current, id)
      );
    },
  });
};

export const useReorderMenuOptionsMutation = () =>
  useMutationWithToast({
    mutationFn: (items: ReorderItem[]) => fetchReorderMenuOptions(items),
    successMessage: "تم إعادة ترتيب الخيارات",
    invalidateKeys: [[OPTIONS_KEY]],
  });

export const useToggleMenuOptionAvailabilityMutation = () =>
  useMutationWithToast({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      fetchUpdateMenuOptionAvailability(id, isAvailable),
    successMessage: "تم تحديث حالة توفر الخيار",
    invalidateKeys: [[OPTIONS_KEY]],
  });

export const useToggleMenuOptionActiveMutation = () =>
  useMutationWithToast({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      fetchToggleMenuOptionActive(id, isVisible),
    successMessage: "تم تحديث حالة تفعيل الخيار",
    invalidateKeys: [[OPTIONS_KEY]],
  });
