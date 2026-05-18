import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  fetchMenuCategories,
  fetchMenuCategoryById,
  fetchCreateMenuCategory,
  fetchUpdateMenuCategory,
  fetchDeleteMenuCategory,
  fetchReorderMenuCategories,
} from "@/utils/fetchMenuCategories";
import {
  fetchMenuProducts,
  fetchCreateMenuProduct,
  fetchUpdateMenuProduct,
  fetchUpdateMenuProductAvailability,
  fetchDeleteMenuProduct,
  fetchReorderMenuProducts,
} from "@/utils/fetchMenuProducts";
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
import {
  fetchValidateMenu,
  fetchPublishMenu,
  fetchMenuAuditLogs,
} from "@/utils/fetchMenuActions";
import {
  fetchLinkGroupsToProduct,
  fetchLinkOptionsToGroup,
  fetchUpdateOptionAvailabilityInProduct,
  fetchUpdateOptionOverride,
  fetchUpdateSelectionRules,
} from "@/utils/fetchMenuProductGroups";
import { fetchMenuProductById } from "@/utils/fetchMenuProducts";

import type {
  MenuListParams,
  MenuProductListParams,
  MenuOptionListParams,
  MenuAuditLogParams,
  CreateMenuCategoryPayload,
  UpdateMenuCategoryPayload,
  CreateMenuProductPayload,
  UpdateMenuProductPayload,
  CreateMenuOptionGroupPayload,
  UpdateMenuOptionGroupPayload,
  CreateMenuOptionPayload,
  UpdateMenuOptionPayload,
  ReorderItem,
  LinkGroupsPayload,
  LinkOptionsPayload,
  UpdateOptionOverridePayload,
  UpdateSelectionRulesPayload,
} from "@/types/menuTypes";

// ── Query Keys ──

const MENU_KEYS = {
  categories: (params: MenuListParams) =>
    ["menu", "categories", params] as const,
  products: (params: MenuProductListParams) =>
    ["menu", "products", params] as const,
  optionGroups: (params: MenuListParams) =>
    ["menu", "optionGroups", params] as const,
  options: (params: MenuOptionListParams) =>
    ["menu", "options", params] as const,
  auditLogs: (params: MenuAuditLogParams) =>
    ["menu", "auditLogs", params] as const,
};

// ══════════════════════════════════════
// ── Categories ──
// ══════════════════════════════════════

export const menuCategoriesQueryOptions = (params: MenuListParams = {}) =>
  queryOptions({
    queryKey: MENU_KEYS.categories(params),
    queryFn: () => fetchMenuCategories(params),
    staleTime: 1000 * 60 * 2,
  });

export const useMenuCategoriesQuery = (params: MenuListParams = {}) =>
  useQuery(menuCategoriesQueryOptions(params));

export const useCreateMenuCategoryMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuCategoryPayload) =>
      fetchCreateMenuCategory(data),
    onSuccess: () => {
      toast.success("تم إنشاء التصنيف بنجاح");
      qc.invalidateQueries({ queryKey: ["menu", "categories"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء إنشاء التصنيف");
    },
  });
};

export const useUpdateMenuCategoryMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuCategoryPayload }) =>
      fetchUpdateMenuCategory(id, data),
    onSuccess: () => {
      toast.success("تم تحديث التصنيف بنجاح");
      qc.invalidateQueries({ queryKey: ["menu", "categories"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء تحديث التصنيف");
    },
  });
};

export const useDeleteMenuCategoryMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchDeleteMenuCategory(id),
    onSuccess: () => {
      toast.success("تم حذف التصنيف بنجاح");
      qc.invalidateQueries({ queryKey: ["menu", "categories"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء حذف التصنيف");
    },
  });
};

export const useReorderMenuCategoriesMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderItem[]) => fetchReorderMenuCategories(items),
    onSuccess: () => {
      toast.success("تم إعادة ترتيب التصنيفات");
      qc.invalidateQueries({ queryKey: ["menu", "categories"] });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إعادة الترتيب");
    },
  });
};

export const menuCategoryDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["menu", "categories", "detail", id] as const,
    queryFn: () => fetchMenuCategoryById(id),
    enabled: !!id,
  });

export const useMenuCategoryDetailQuery = (id: string) =>
  useQuery(menuCategoryDetailQueryOptions(id));

// ══════════════════════════════════════
// ── Products ──
// ══════════════════════════════════════

export const menuProductsQueryOptions = (params: MenuProductListParams = {}) =>
  queryOptions({
    queryKey: MENU_KEYS.products(params),
    queryFn: () => fetchMenuProducts(params),
    staleTime: 1000 * 60 * 2,
  });

export const useMenuProductsQuery = (params: MenuProductListParams = {}) =>
  useQuery(menuProductsQueryOptions(params));

export const menuProductDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["menu", "products", "detail", id] as const,
    queryFn: () => fetchMenuProductById(id),
    enabled: !!id,
  });

export const useMenuProductDetailQuery = (id: string) =>
  useQuery(menuProductDetailQueryOptions(id));

export const useCreateMenuProductMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuProductPayload) =>
      fetchCreateMenuProduct(data),
    onSuccess: () => {
      toast.success("تم إنشاء المنتج بنجاح");
      qc.invalidateQueries({ queryKey: ["menu", "products"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء إنشاء المنتج");
    },
  });
};

export const useUpdateMenuProductMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuProductPayload }) =>
      fetchUpdateMenuProduct(id, data),
    onSuccess: () => {
      toast.success("تم تحديث المنتج بنجاح");
      qc.invalidateQueries({ queryKey: ["menu", "products"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء تحديث المنتج");
    },
  });
};

export const useToggleMenuProductAvailabilityMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      fetchUpdateMenuProductAvailability(id, isAvailable),
    onSuccess: () => {
      toast.success("تم تحديث حالة التوفر");
      qc.invalidateQueries({ queryKey: ["menu", "products"] });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث حالة التوفر");
    },
  });
};

export const useDeleteMenuProductMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchDeleteMenuProduct(id),
    onSuccess: () => {
      toast.success("تم حذف المنتج بنجاح");
      qc.invalidateQueries({ queryKey: ["menu", "products"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء حذف المنتج");
    },
  });
};

export const useReorderMenuProductsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderItem[]) => fetchReorderMenuProducts(items),
    onSuccess: () => {
      toast.success("تم إعادة ترتيب المنتجات");
      qc.invalidateQueries({ queryKey: ["menu", "products"] });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إعادة الترتيب");
    },
  });
};

export const useLinkGroupsToProductMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: LinkGroupsPayload;
    }) => fetchLinkGroupsToProduct(productId, data),
    onSuccess: (_data, variables) => {
      toast.success("تم تحديث مجموعات المنتج");
      qc.invalidateQueries({ queryKey: ["menu", "products"] });
      qc.invalidateQueries({
        queryKey: ["menu", "products", "detail", variables.productId],
      });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || "حدث خطأ أثناء تحديث مجموعات المنتج"
      );
    },
  });
};

export const useUpdateSelectionRulesMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      groupId,
      data,
    }: {
      productId: string;
      groupId: string;
      data: UpdateSelectionRulesPayload;
    }) => fetchUpdateSelectionRules(productId, groupId, data),
    onSuccess: (_data, variables) => {
      toast.success("تم تحديث قواعد الاختيار");
      qc.invalidateQueries({
        queryKey: ["menu", "products", "detail", variables.productId],
      });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || "حدث خطأ أثناء تحديث قواعد الاختيار"
      );
    },
  });
};

export const useLinkOptionsToGroupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      groupId,
      data,
    }: {
      productId: string;
      groupId: string;
      data: LinkOptionsPayload;
    }) => fetchLinkOptionsToGroup(productId, groupId, data),
    onSuccess: (_data, variables) => {
      toast.success("تم تحديث خيارات المنتج");
      qc.invalidateQueries({
        queryKey: ["menu", "products", "detail", variables.productId],
      });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || "حدث خطأ أثناء تحديث خيارات المنتج"
      );
    },
  });
};

export const useUpdateOptionOverrideMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      groupId,
      optionId,
      data,
    }: {
      productId: string;
      groupId: string;
      optionId: string;
      data: UpdateOptionOverridePayload;
    }) => fetchUpdateOptionOverride(productId, groupId, optionId, data),
    onSuccess: (_data, variables) => {
      toast.success("تم تحديث إعدادات الخيار داخل المنتج");
      qc.invalidateQueries({
        queryKey: ["menu", "products", "detail", variables.productId],
      });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || "حدث خطأ أثناء تحديث إعدادات الخيار"
      );
    },
  });
};

export const useUpdateOptionAvailabilityInProductMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      groupId,
      optionId,
      isAvailable,
    }: {
      productId: string;
      groupId: string;
      optionId: string;
      isAvailable: boolean;
    }) =>
      fetchUpdateOptionAvailabilityInProduct(
        productId,
        groupId,
        optionId,
        isAvailable
      ),
    onSuccess: (_data, variables) => {
      toast.success("تم تحديث توفر الخيار داخل المنتج");
      qc.invalidateQueries({
        queryKey: ["menu", "products", "detail", variables.productId],
      });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || "حدث خطأ أثناء تحديث توفر الخيار"
      );
    },
  });
};

// ══════════════════════════════════════
// ── Option Groups ──
// ══════════════════════════════════════

export const menuOptionGroupsQueryOptions = (params: MenuListParams = {}) =>
  queryOptions({
    queryKey: MENU_KEYS.optionGroups(params),
    queryFn: () => fetchMenuOptionGroups(params),
    staleTime: 1000 * 60 * 2,
  });

export const useMenuOptionGroupsQuery = (params: MenuListParams = {}) =>
  useQuery(menuOptionGroupsQueryOptions(params));

export const useCreateMenuOptionGroupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuOptionGroupPayload) =>
      fetchCreateMenuOptionGroup(data),
    onSuccess: () => {
      toast.success("تم إنشاء مجموعة الخيارات بنجاح");
      qc.invalidateQueries({ queryKey: ["menu", "optionGroups"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || "حدث خطأ أثناء إنشاء مجموعة الخيارات"
      );
    },
  });
};

export const useUpdateMenuOptionGroupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMenuOptionGroupPayload;
    }) => fetchUpdateMenuOptionGroup(id, data),
    onSuccess: () => {
      toast.success("تم تحديث مجموعة الخيارات بنجاح");
      qc.invalidateQueries({ queryKey: ["menu", "optionGroups"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || "حدث خطأ أثناء تحديث مجموعة الخيارات"
      );
    },
  });
};

export const useDeleteMenuOptionGroupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchDeleteMenuOptionGroup(id),
    onSuccess: () => {
      toast.success("تم حذف مجموعة الخيارات بنجاح");
      qc.invalidateQueries({ queryKey: ["menu", "optionGroups"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || "حدث خطأ أثناء حذف مجموعة الخيارات"
      );
    },
  });
};

export const menuOptionGroupDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["menu", "optionGroups", "detail", id] as const,
    queryFn: () => fetchMenuOptionGroupById(id),
    enabled: !!id,
  });

export const useMenuOptionGroupDetailQuery = (id: string) =>
  useQuery(menuOptionGroupDetailQueryOptions(id));

export const useReorderMenuOptionGroupsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderItem[]) => fetchReorderMenuOptionGroups(items),
    onSuccess: () => {
      toast.success("تم إعادة ترتيب مجموعات الخيارات");
      qc.invalidateQueries({ queryKey: ["menu", "optionGroups"] });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إعادة الترتيب");
    },
  });
};

export const useToggleMenuOptionGroupAvailabilityMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      fetchUpdateMenuOptionGroupAvailability(id, isAvailable),
    onSuccess: () => {
      toast.success("تم تحديث حالة توفر مجموعة الخيارات");
      qc.invalidateQueries({ queryKey: ["menu", "optionGroups"] });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث حالة التوفر");
    },
  });
};

export const useToggleMenuOptionGroupActiveMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      fetchToggleMenuOptionGroupActive(id, isVisible),
    onSuccess: () => {
      toast.success("تم تحديث حالة تفعيل مجموعة الخيارات");
      qc.invalidateQueries({ queryKey: ["menu", "optionGroups"] });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث حالة التفعيل");
    },
  });
};

// ══════════════════════════════════════
// ── Options ──
// ══════════════════════════════════════

export const menuOptionsQueryOptions = (params: MenuOptionListParams = {}) =>
  queryOptions({
    queryKey: MENU_KEYS.options(params),
    queryFn: () => fetchMenuOptions(params),
    staleTime: 1000 * 60 * 2,
  });

export const useMenuOptionsQuery = (params: MenuOptionListParams = {}) =>
  useQuery(menuOptionsQueryOptions(params));

export const useCreateMenuOptionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMenuOptionPayload) => fetchCreateMenuOption(data),
    onSuccess: () => {
      toast.success("تم إنشاء الخيار بنجاح");
      qc.invalidateQueries({ queryKey: ["menu", "options"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء إنشاء الخيار");
    },
  });
};

export const useUpdateMenuOptionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMenuOptionPayload }) =>
      fetchUpdateMenuOption(id, data),
    onSuccess: () => {
      toast.success("تم تحديث الخيار بنجاح");
      qc.invalidateQueries({ queryKey: ["menu", "options"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء تحديث الخيار");
    },
  });
};

export const useDeleteMenuOptionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchDeleteMenuOption(id),
    onSuccess: () => {
      toast.success("تم حذف الخيار بنجاح");
      qc.invalidateQueries({ queryKey: ["menu", "options"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء حذف الخيار");
    },
  });
};

export const menuOptionDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["menu", "options", "detail", id] as const,
    queryFn: () => fetchMenuOptionById(id),
    enabled: !!id,
  });

export const useMenuOptionDetailQuery = (id: string) =>
  useQuery(menuOptionDetailQueryOptions(id));

export const useReorderMenuOptionsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderItem[]) => fetchReorderMenuOptions(items),
    onSuccess: () => {
      toast.success("تم إعادة ترتيب الخيارات");
      qc.invalidateQueries({ queryKey: ["menu", "options"] });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إعادة الترتيب");
    },
  });
};

export const useToggleMenuOptionAvailabilityMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      fetchUpdateMenuOptionAvailability(id, isAvailable),
    onSuccess: () => {
      toast.success("تم تحديث حالة توفر الخيار");
      qc.invalidateQueries({ queryKey: ["menu", "options"] });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث حالة التوفر");
    },
  });
};

export const useToggleMenuOptionActiveMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      fetchToggleMenuOptionActive(id, isVisible),
    onSuccess: () => {
      toast.success("تم تحديث حالة تفعيل الخيار");
      qc.invalidateQueries({ queryKey: ["menu", "options"] });
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تحديث حالة التفعيل");
    },
  });
};

// ══════════════════════════════════════
// ── Menu Actions (Validate / Publish / Audit) ──
// ══════════════════════════════════════

export const useValidateMenuMutation = () => {
  return useMutation({
    mutationFn: fetchValidateMenu,
    onError: () => {
      toast.error("حدث خطأ أثناء التحقق من القائمة");
    },
  });
};

export const usePublishMenuMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string) => fetchPublishMenu(notes),
    onSuccess: () => {
      toast.success("تم نشر القائمة بنجاح! 🎉");
      // Invalidate everything after publish
      qc.invalidateQueries({ queryKey: ["menu"] });
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء نشر القائمة");
    },
  });
};

export const menuAuditLogsQueryOptions = (params: MenuAuditLogParams = {}) =>
  queryOptions({
    queryKey: MENU_KEYS.auditLogs(params),
    queryFn: () => fetchMenuAuditLogs(params),
    staleTime: 1000 * 60 * 1,
  });

export const useMenuAuditLogsQuery = (params: MenuAuditLogParams = {}) =>
  useQuery(menuAuditLogsQueryOptions(params));
