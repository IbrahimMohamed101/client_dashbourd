import { queryOptions, useQuery } from "@tanstack/react-query";
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
import type {
  MenuListParams,
  CreateMenuOptionGroupPayload,
  UpdateMenuOptionGroupPayload,
  ReorderItem,
} from "@/types/menuTypes";

const OPTION_GROUPS_KEY = "menu.optionGroups";

export const menuOptionGroupsQueryOptions = (params: MenuListParams = {}) =>
  queryOptions({
    queryKey: [OPTION_GROUPS_KEY, params],
    queryFn: () => fetchMenuOptionGroups(params),
    staleTime: 1000 * 60 * 2,
  });

export const useMenuOptionGroupsQuery = (params: MenuListParams = {}) =>
  useQuery(menuOptionGroupsQueryOptions(params));

export const menuOptionGroupDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [OPTION_GROUPS_KEY, "detail", id],
    queryFn: () => fetchMenuOptionGroupById(id),
    enabled: !!id,
  });

export const useMenuOptionGroupDetailQuery = (id: string) =>
  useQuery(menuOptionGroupDetailQueryOptions(id));

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

export const useDeleteMenuOptionGroupMutation = () =>
  useMutationWithToast({
    mutationFn: (id: string) => fetchDeleteMenuOptionGroup(id),
    successMessage: "تم حذف مجموعة الخيارات بنجاح",
    invalidateKeys: [[OPTION_GROUPS_KEY]],
  });

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
