import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import api from "@/lib/apis";
import {
  buildOperationsActionPayload,
  extractOperationsQueueItems,
  getEndpointForAction,
  getScreensForRole,
  OPERATIONS_SCREENS,
  type OperationsScreen,
} from "@/lib/operationsBoard";
import type {
  DashboardOpsActionResponse,
  DashboardOpsListResponse,
  UnifiedQueueItem,
} from "@/types/dashboardOpsTypes";

interface UseOperationsBoardParams {
  date?: string;
  q?: string;
}

export function useOperationsBoard(params: UseOperationsBoardParams = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const role = user?.role;
  const { label: screenLabel, screens: visibleScreens } =
    getScreensForRole(role);

  const queueQuery = useQuery({
    queryKey: ["operations-board", "queue", visibleScreens, params.date, params.q],
    queryFn: async () => {
      const results = await Promise.all(
        visibleScreens.map(async (screen) => {
          const { data } = await api.get<DashboardOpsListResponse>(
            `/api/dashboard/${screen}/queue`,
            {
              params: {
                date: params.date || undefined,
                q: params.q || undefined,
              },
            }
          );
          const items = extractOperationsQueueItems(data);
          return { screen, items };
        })
      );
      return results;
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    placeholderData: (prev) => prev,
    enabled: visibleScreens.length > 0,
  });

  const emptyItemsByScreen: Record<OperationsScreen, UnifiedQueueItem[]> = {
    kitchen: [],
    pickup: [],
    courier: [],
  };

  const itemsByScreen = queueQuery.data?.reduce(
    (acc, result) => {
      acc[result.screen] = Array.isArray(result.items) ? result.items : [];
      return acc;
    },
    { ...emptyItemsByScreen }
  ) ?? { ...emptyItemsByScreen };

  const allItems = Object.values(itemsByScreen).flat();

  const actionMutation = useMutation({
    mutationFn: async ({
      item,
      action,
      reason,
      notes,
      pickupCode,
    }: {
      item: UnifiedQueueItem;
      action: string;
      reason?: string;
      notes?: string;
      pickupCode?: string;
    }) => {
      const endpoint = getEndpointForAction(action);
      const payload = buildOperationsActionPayload(
        item,
        action,
        reason,
        notes,
        pickupCode
      );
      const { data } = await api.post<DashboardOpsActionResponse>(
        endpoint,
        payload
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success(`تم ${variables.action} بنجاح`);
      queryClient.invalidateQueries({ queryKey: ["operations-board", "queue"] });
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "حدث خطأ غير متوقع"
      );
    },
  });

  const requestAction = (
    item: UnifiedQueueItem,
    action: string,
    _actionLabel: string,
    _isDangerous?: boolean,
    reason?: string,
    notes?: string,
    pickupCode?: string
  ) => {
    actionMutation.mutate({ item, action, reason, notes, pickupCode });
  };

  return {
    screenLabel,
    visibleScreens,
    itemsByScreen,
    allItems,
    isLoading: visibleScreens.length > 0 && queueQuery.isLoading,
    isPending: actionMutation.isPending,
    requestAction,
  };
}

export type { OperationsScreen as Screen } from "@/lib/operationsBoard";
export { OPERATIONS_SCREENS as SCREENS, getScreensForRole };
