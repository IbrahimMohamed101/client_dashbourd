export type LocalizedText = {
  ar?: string;
  en?: string;
};

export interface PickupLocation {
  _id?: string;
  id?: string;
  key?: string;
  code?: string;
  slug?: string;
  branchId?: string;
  pickupLocationId?: string;
  name?: LocalizedText | string;
  title?: LocalizedText | string;
  address?: LocalizedText | string;
  isActive?: boolean;
  active?: boolean;
  enabled?: boolean;
  isEnabled?: boolean;
  isAvailable?: boolean;
  available?: boolean;
  pickupEnabled?: boolean;
  supportsPickup?: boolean;
  pickupAvailable?: boolean;
  availableForPickup?: boolean;
  acceptsPickup?: boolean;
  pickupWindows?: string[];
  windows?: string[];
  [key: string]: unknown;
}

export interface PickupBranchesResponse {
  status: boolean;
  data: {
    pickup_locations: PickupLocation[];
    pickup_windows: string[];
    defaultBranchId: "main";
  };
}
