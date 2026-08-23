import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createPromoCode,
  deletePromoCode,
  fetchPromoCodeAppSelection,
  fetchPromoCodeById,
  fetchPromoCodesList,
  togglePromoCode,
  updatePromoCode,
  updatePromoCodeAppSelection,
  validatePromoCode,
} from "@/utils/fetchPromoCodesData";

export const promoCodesListQueryOptions = (includeDeleted: boolean = false) =>
  queryOptions({
    queryKey: ["promo-codes-list", { includeDeleted }],
    queryFn: () => fetchPromoCodesList({ includeDeleted }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

export const promoCodeDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["promo-code-detail", id],
    queryFn: () => fetchPromoCodeById(id),
    staleTime: 1000 * 60 * 5,
  });

export const promoCodeAppSelectionQueryOptions = () =>
  queryOptions({
    queryKey: ["promo-code-app-selection"],
    queryFn: fetchPromoCodeAppSelection,
    staleTime: 1000 * 60 * 5,
  });

export const usePromoCodesListQuery = (includeDeleted: boolean = false) => {
  return useQuery(promoCodesListQueryOptions(includeDeleted));
};

export const usePromoCodeDetailQuery = (id: string | null) => {
  return useQuery({
    ...promoCodeDetailQueryOptions(id ?? ""),
    enabled: Boolean(id),
  });
};

export const usePromoCodeAppSelectionQuery = () => {
  return useQuery(promoCodeAppSelectionQueryOptions());
};

export const useUpdatePromoCodeAppSelectionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePromoCodeAppSelection,
    onSuccess: (data) => {
      queryClient.setQueryData(["promo-code-app-selection"], data);
      queryClient.invalidateQueries({ queryKey: ["promo-codes-list"] });
      if (data.promoCodeId) {
        queryClient.invalidateQueries({
          queryKey: ["promo-code-detail", data.promoCodeId],
        });
      }
    },
  });
};

export const useCreatePromoCodeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPromoCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes-list"] });
      queryClient.invalidateQueries({ queryKey: ["promo-code-app-selection"] });
    },
  });
};

export const useUpdatePromoCodeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePromoCode,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes-list"] });
      queryClient.invalidateQueries({
        queryKey: ["promo-code-detail", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["promo-code-app-selection"] });
    },
  });
};

export const useDeletePromoCodeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePromoCode,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes-list"] });
      queryClient.invalidateQueries({ queryKey: ["promo-code-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["promo-code-app-selection"] });
    },
  });
};

export const useTogglePromoCodeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: togglePromoCode,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes-list"] });
      queryClient.invalidateQueries({ queryKey: ["promo-code-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["promo-code-app-selection"] });
    },
  });
};

export const useValidatePromoCodeMutation = () => {
  return useMutation({
    mutationFn: validatePromoCode,
  });
};
