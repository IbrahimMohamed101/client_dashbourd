import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  DeliveryZone,
  CreateDeliveryZoneDTO,
  UpdateDeliveryZoneDTO,
} from "@/types/deliveryZoneTypes";
import api from "@/lib/apis";

export const useDeliveryZones = () => {
  return useQuery({
    queryKey: ["delivery-zones"],
    queryFn: async () => {
      const { data } = await api.get<{ data: DeliveryZone[] }>(
        "/api/dashboard/zones"
      );
      return data.data;
    },
  });
};

export const useCreateDeliveryZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (zone: CreateDeliveryZoneDTO) => {
      const { data } = await api.post<{ data: DeliveryZone }>(
        "/api/dashboard/zones",
        zone
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
  });
};

export const useUpdateDeliveryZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      zone,
    }: {
      id: string;
      zone: UpdateDeliveryZoneDTO;
    }) => {
      const { data } = await api.patch<{ data: DeliveryZone }>(
        `/api/dashboard/zones/${id}`,
        zone
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
  });
};

export const useDeleteDeliveryZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/dashboard/zones/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
  });
};
