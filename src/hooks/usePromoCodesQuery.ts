import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  fetchPromoCodesList,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} from "@/utils/fetchPromoCodesData";

export const promoCodesListQueryOptions = (
  page: number = 1,
  limit: number = 20,
  q: string = ""
) =>
  queryOptions({
    queryKey: ["promo-codes-list", { page, limit, q }],
    queryFn: () => fetchPromoCodesList({ page, limit, q }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

export const usePromoCodesListQuery = (
  page: number = 1,
  limit: number = 20,
  q: string = ""
) => {
  return useQuery(promoCodesListQueryOptions(page, limit, q));
};

export const useCreatePromoCodeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPromoCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes-list"] });
    },
  });
};

export const useUpdatePromoCodeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePromoCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes-list"] });
    },
  });
};

export const useDeletePromoCodeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePromoCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes-list"] });
    },
  });
};
