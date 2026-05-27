import type { PickupBranchesResponse } from "@/types/pickupTypes";
import { fetchSettings } from "@/utils/fetchSettings";

export const fetchPickupBranches =
  async (): Promise<PickupBranchesResponse> => {
    const response = await fetchSettings();
    return {
      status: response.status,
      data: {
        pickup_locations: response.data.pickup_locations ?? [],
        pickup_windows: response.data.pickup_windows ?? [],
        defaultBranchId: "main",
      },
    };
  };
