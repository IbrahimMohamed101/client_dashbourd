import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  fetchCustomizationLibrary,
  fetchProductCustomization,
  saveProductCustomization,
} from "@/utils/fetchMenuCustomization";
import type { SaveProductCustomizationPayload } from "@/types/menuCustomizationTypes";

const CUSTOMIZATION_KEY = "menu.customization";
const LIBRARY_KEY = "menu.customization-library";

export const customizationLibraryQueryOptions = () =>
  queryOptions({
    queryKey: [LIBRARY_KEY],
    queryFn: fetchCustomizationLibrary,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

export const useCustomizationLibraryQuery = () =>
  useQuery(customizationLibraryQueryOptions());

export const productCustomizationQueryOptions = (productId: string) =>
  queryOptions({
    queryKey: [CUSTOMIZATION_KEY, productId],
    queryFn: () => fetchProductCustomization(productId),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

export const useProductCustomizationQuery = (productId: string) =>
  useQuery({
    ...productCustomizationQueryOptions(productId),
    enabled: !!productId && productId !== "undefined" && productId !== "null",
  });

export const useSaveProductCustomizationMutation = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: string;
      payload: SaveProductCustomizationPayload;
    }) => saveProductCustomization(productId, payload),
    successMessage: "تم حفظ تخصيص المنتج بنجاح",
    onSuccess: (data, variables) => {
      queryClient.setQueryData([CUSTOMIZATION_KEY, variables.productId], data);
    },
  });
};
