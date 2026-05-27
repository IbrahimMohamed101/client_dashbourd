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
  toggleDeliveryZone,
} from "@/utils/fetchDeliveryZonesData";

export const deliveryZonesListQueryOptions = (
  q: string = "",
  isActive?: boolean
) =>
  queryOptions({
    queryKey: ["delivery-zones-list", { q, isActive: isActive ?? null }],
    queryFn: () => fetchDeliveryZonesList({ q, isActive }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

export const useDeliveryZonesListQuery = (
  q: string = "",
  isActive?: boolean
) => {
  return useQuery(deliveryZonesListQueryOptions(q, isActive));
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

export const useToggleDeliveryZoneMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleDeliveryZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones-list"] });
    },
  });
};
