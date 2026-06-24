import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  fetchDeliveryZonesList,
  fetchDeliveryZoneById,
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

export const deliveryZoneDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["delivery-zone-detail", id],
    queryFn: () => fetchDeliveryZoneById(id),
    staleTime: 1000 * 60 * 5,
  });

export const useDeliveryZonesListQuery = (
  q: string = "",
  isActive?: boolean
) => {
  return useQuery(deliveryZonesListQueryOptions(q, isActive));
};

export const useDeliveryZoneDetailQuery = (id: string | null) => {
  return useQuery({
    ...deliveryZoneDetailQueryOptions(id ?? ""),
    enabled: Boolean(id),
  });
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones-list"] });
      queryClient.invalidateQueries({
        queryKey: ["delivery-zone-detail", variables.id],
      });
    },
  });
};

export const useDeleteDeliveryZoneMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeliveryZone,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones-list"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-zone-detail", id] });
    },
  });
};

export const useToggleDeliveryZoneMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleDeliveryZone,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones-list"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-zone-detail", id] });
    },
  });
};