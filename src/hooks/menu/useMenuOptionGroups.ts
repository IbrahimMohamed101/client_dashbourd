import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  fetchMenuOptionGroups,
  fetchMenuOptionGroupById,
  fetchCreateMenuOptionGroup,
  fetchUpdateMenuOptionGroup,
  fetchDeleteMenuOptionGroup,
  fetchReorderMenuOptionGroups,
  fetchUpdateMenuOptionGroupAvailability,
  fetchToggleMenuOptionGroupActive,
} from "@/utils/fetchMenuOptionGroups";
import { removePaginatedCacheItem } from "@/utils/removePaginatedCacheItem";
import type {
  MenuListParams,
  MenuOptionGroupsResponse,
  CreateMenuOptionGroupPayload,
  UpdateMenuOptionGroupPayload,
  ReorderItem,
} from "@/types/menuTypes";

const OPTION_GROUPS_KEY = "menu.optionGroups";

export const menuOptionGroupsQueryOptions = (params: MenuListParams = {}) =>
  queryOptions({
    queryKey: [OPTION_GROUPS_KEY, params],
    queryFn: () => fetchMenuOptionGroups(params),
    staleTime: Infinity,
  });

export const useMenuOptionGroupsQuery = (
  params: MenuListParams = {},
  enabled = true
) =>
  useQuery({
    ...menuOptionGroupsQueryOptions(params),
    enabled,
  });

export const menuOptionGroupDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [OPTION_GROUPS_KEY, "detail", id],
    queryFn: () => fetchMenuOptionGroupById(id),
    staleTime: Infinity,
  });

export const useMenuOptionGroupDetailQuery = (id: string) =>
  useQuery({
    ...menuOptionGroupDetailQueryOptions(id),
    enabled: !!id && id !== "undefined" && id !== "null",
  });

export const useCreateMenuOptionGroupMutation = () =>
  useMutationWithToast({
    mutationFn: (data: CreateMenuOptionGroupPayload) => fetchCreateMenuOptionGroup(data),
    successMessage: "تم إنشاء مجموعة الخيارات بنجاح",
    invalidateKeys: [[OPTION_GROUPS_KEY]],
  });

export const useUpdateMenuOptionGroupMutation = () =>
  useMutationWithToast({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuOptionGroupPayload }) =>
      fetchUpdateMenuOptionGroup(id, data),
    successMessage: "تم تحديث مجموعة الخيارات بنجاح",
    invalidateKeys: [[OPTION_GROUPS_KEY]],
  });

export const useDeleteMenuOptionGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast({
    mutationFn: (id: string) => fetchDeleteMenuOptionGroup(id),
    successMessage: "تم حذف مجموعة الخيارات بنجاح",
    invalidateKeys: [[OPTION_GROUPS_KEY]],
    onSuccess: (_, id) => {
      queryClient.setQueriesData<MenuOptionGroupsResponse>(
        { queryKey: [OPTION_GROUPS_KEY] },
        (current) => removePaginatedCacheItem(current, id)
      );
    },
  });
};

export const useReorderMenuOptionGroupsMutation = () =>
  useMutationWithToast({
    mutationFn: (items: ReorderItem[]) => fetchReorderMenuOptionGroups(items),
    successMessage: "تم إعادة ترتيب مجموعات الخيارات",
    invalidateKeys: [[OPTION_GROUPS_KEY]],
  });

export const useToggleMenuOptionGroupAvailabilityMutation = () =>
  useMutationWithToast({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      fetchUpdateMenuOptionGroupAvailability(id, isAvailable),
    successMessage: "تم تحديث حالة توفر مجموعة الخيارات",
    invalidateKeys: [[OPTION_GROUPS_KEY]],
  });

export const useToggleMenuOptionGroupActiveMutation = () =>
  useMutationWithToast({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      fetchToggleMenuOptionGroupActive(id, isVisible),
    successMessage: "تم تحديث حالة تفعيل مجموعة الخيارات",
    invalidateKeys: [[OPTION_GROUPS_KEY]],
  });
