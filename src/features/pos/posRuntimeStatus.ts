import api from "@/lib/apis";
import { queryOptions } from "@tanstack/react-query";

export type PosRuntimeStatus = {
  enabled: boolean;
  environment: "production" | "staging";
  financialWritesEnabled: boolean;
  reason?: "POS_DISABLED";
  documentType?: string;
};
export async function fetchPosRuntimeStatus(): Promise<PosRuntimeStatus> {
  const response = await api.get<{ data: PosRuntimeStatus }>("/api/dashboard/pos/status");
  return response.data.data;
}
export const posRuntimeStatusOptions = queryOptions({
  queryKey: ["pos", "runtime-status"] as const,
  queryFn: fetchPosRuntimeStatus,
  staleTime: 10_000,
  retry: false,
});
