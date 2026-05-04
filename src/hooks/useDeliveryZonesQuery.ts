import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  fetchDeliveryZonesList,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
} from "@/utils/fetchDeliveryZonesData";

export const deliveryZonesListQueryOptions = (
  page: number = 1,
  limit: number = 20,
  q: string = ""
) =>
  queryOptions({
    queryKey: ["delivery-zones-list", { page, limit, q }],
    queryFn: () => fetchDeliveryZonesList({ page, limit, q }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

export const useDeliveryZonesListQuery = (
  page: number = 1,
  limit: number = 20,
  q: string = ""
) => {
  return useQuery(deliveryZonesListQueryOptions(page, limit, q));
};

export const useCreateDeliveryZoneMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeliveryZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones-list"] });
    },
  });
};

export const useUpdateDeliveryZoneMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDeliveryZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones-list"] });
    },
  });
};

export const useDeleteDeliveryZoneMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeliveryZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones-list"] });
    },
  });
};
