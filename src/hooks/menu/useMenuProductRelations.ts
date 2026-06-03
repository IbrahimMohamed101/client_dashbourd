import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  fetchLinkGroupsToProduct,
  fetchLinkOptionsToGroup,
  fetchUpdateOptionAvailabilityInProduct,
  fetchUpdateOptionOverride,
  fetchUpdateSelectionRules,
} from "@/utils/fetchMenuProductGroups";
import type {
  LinkGroupsPayload,
  LinkOptionsPayload,
  UpdateOptionOverridePayload,
  UpdateSelectionRulesPayload,
} from "@/types/menuTypes";

const PRODUCTS_KEY = "menu.products";
const PRODUCTS_DETAIL_KEY = [PRODUCTS_KEY, "detail"];

export const useLinkGroupsToProductMutation = () =>
  useMutationWithToast({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: LinkGroupsPayload;
    }) => fetchLinkGroupsToProduct(productId, data),
    successMessage: "تم تحديث مجموعات المنتج",
    invalidateKeys: [[PRODUCTS_KEY], PRODUCTS_DETAIL_KEY],
  });

export const useUpdateSelectionRulesMutation = () =>
  useMutationWithToast({
    mutationFn: ({
      productId,
      groupId,
      data,
    }: {
      productId: string;
      groupId: string;
      data: UpdateSelectionRulesPayload;
    }) => fetchUpdateSelectionRules(productId, groupId, data),
    successMessage: "تم تحديث قواعد الاختيار",
    invalidateKeys: [PRODUCTS_DETAIL_KEY],
  });

export const useLinkOptionsToGroupMutation = () =>
  useMutationWithToast({
    mutationFn: ({
      productId,
      groupId,
      data,
    }: {
      productId: string;
      groupId: string;
      data: LinkOptionsPayload;
    }) => fetchLinkOptionsToGroup(productId, groupId, data),
    successMessage: "تم تحديث خيارات المنتج",
    invalidateKeys: [PRODUCTS_DETAIL_KEY],
  });

export const useUpdateOptionOverrideMutation = () =>
  useMutationWithToast({
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
    successMessage: "تم تحديث إعدادات الخيار داخل المنتج",
    invalidateKeys: [PRODUCTS_DETAIL_KEY],
  });

export const useUpdateOptionAvailabilityInProductMutation = () =>
  useMutationWithToast({
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
    }) => fetchUpdateOptionAvailabilityInProduct(productId, groupId, optionId, isAvailable),
    successMessage: "تم تحديث توفر الخيار داخل المنتج",
    invalidateKeys: [PRODUCTS_DETAIL_KEY],
  });
