export interface DeliveryZone {
  id: string;
  _id?: string;
  name: string | { ar?: string; en?: string };
  deliveryFeeHalala: number;
  isActive: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDeliveryZoneDTO {
  name: string | { ar?: string; en?: string };
  deliveryFeeHalala: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateDeliveryZoneDTO {
  name?: string | { ar?: string; en?: string };
  deliveryFeeHalala: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface DeliveryZonesResponse {
  status: boolean;
  data: DeliveryZone[];
  meta: {
    filters: Record<string, unknown>;
    totalCount: number;
  };
}
