export interface DeliveryZone {
  id: string;
  name: string;
  delivery_fee: number;
  is_active: boolean;
  coverage_description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateDeliveryZoneDTO {
  name: string;
  delivery_fee: number;
  is_active?: boolean;
  coverage_description?: string;
}

export interface UpdateDeliveryZoneDTO {
  name?: string;
  delivery_fee?: number;
  is_active?: boolean;
  coverage_description?: string;
}

export interface DeliveryZonesResponse {
  data: DeliveryZone[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}
