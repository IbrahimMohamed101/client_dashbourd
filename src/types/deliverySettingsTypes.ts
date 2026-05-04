export interface DeliveryZoneDTO {
  id: string;
  name: string;
  city: string;
  fee: number;
  minOrderAmount: number;
  status: "active" | "inactive";
  estimatedDeliveryTime: string;
}
