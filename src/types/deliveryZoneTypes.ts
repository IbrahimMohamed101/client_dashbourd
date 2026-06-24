export interface DeliveryZoneName {
  ar: string;
  en: string;
}

export interface DeliveryZone {
  _id: string;
  id?: string;
  name: DeliveryZoneName;
  deliveryFeeHalala: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliveryZoneActionResponse {
  id: string;
  isActive: boolean;
}

export interface CreateDeliveryZoneDTO {
  name: DeliveryZoneName;
  deliveryFeeHalala: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateDeliveryZoneDTO {
  name: DeliveryZoneName;
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

export interface DeliveryZoneDetailResponse {
  status: boolean;
  data: DeliveryZone;
}

export type DeliveryZoneActiveFilter = "all" | "active" | "inactive";