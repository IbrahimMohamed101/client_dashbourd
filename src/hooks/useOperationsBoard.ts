import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/apis";
import {
  buildOperationsActionPayload,
  getCourierItems,
  getEndpointForAction,
  getPickupItems,
  getScreensForRole,
  OPERATIONS_SCREENS,
  type OperationsScreen,
} from "@/lib/operationsBoard";
import type {
  DashboardOpsActionResponse,
  UnifiedQueueItem,
} from "@/types/dashboardOpsTypes";
import {
  fetchDashboardOpsList,
  fetchDashboardOpsSearch,
} from "@/utils/fetchDashboardOpsData";

interface UseOperationsBoardParams {
  date?: string;
  q?: string;
}

const itemTimestamp = (item: UnifiedQueueItem) => {
  const raw =
    item.timestamps?.updatedAt ||
    item.timestamps?.createdAt ||
    item.context.date ||
    "";
  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : 0;
};

const newestFirst = (items: UnifiedQueueItem[]) =>
  [...items].sort((a, b) => itemTimestamp(b) - itemTimestamp(a));

const PREPARATION_ACTIONS = new Set([
  "prepare",
  "start_preparation",
  "ready_for_pickup",
  "ready_for_delivery",
]);

const PREPARATION_STATUSES = new Set([
  "open",
  "preparing",
  "in_preparation",
]);

function hasPreparationAction(item: UnifiedQueueItem): boolean {
  const actionIds = [
    ...(item.allowedActions || []).map((action) => action.id),
    ...(item.actions?.allowed || []),
  ];

  return actionIds.some((id) => PREPARATION_ACTIONS.has(id));
}

function hasKitchenWorkload(item: UnifiedQueueItem): boolean {
  return Boolean(
    item.kitchenDetails?.mealSlots?.length ||
      item.kitchen?.meals?.length ||
      item.mealSlots?.length ||
      item.context.requiredMealCount ||
      item.context.mealCount
  );
}

function isPreparationQueueItem(item: UnifiedQueueItem): boolean {
  if (hasPreparationAction(item)) return true;
  if (item.actions?.canPrepare || item.actions?.canReadyForPickup) return true;
  if (!hasKitchenWorkload(item)) return false;

  return PREPARATION_STATUSES.has(item.status);
}

function getPreparationItems(items: UnifiedQueueItem[] = []): UnifiedQueueItem[] {
  return items.filter(isPreparationQueueItem);
}

function excludeItems(
  items: UnifiedQueueItem[],
  excludedItems: UnifiedQueueItem[]
): UnifiedQueueItem[] {
  const excludedIds = new Set(excludedItems.map((item) => item.id));
  return items.filter((item) => !excludedIds.has(item.id));
}

export function useOperationsBoard(params: UseOperationsBoardParams = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const role = user?.role;
  const { label: screenLabel, screens: visibleScreens } =
    getScreensForRole(role);

  const queueQuery = useQuery({
    queryKey: [
      "operations-board",
      "queue",
      visibleScreens,
      params.date,
      params.q,
    ],
    queryFn: async () => {
      const search = params.q?.trim() || "";
      const response =
        search.length >= 3
          ? await fetchDashboardOpsSearch(search)
          : await fetchDashboardOpsList(params.date || "");
      const items = response.data?.items ?? [];
      const kitchenItems = getPreparationItems(items);
      const pickupItems = excludeItems(getPickupItems(items), kitchenItems);
      const courierItems = excludeItems(getCourierItems(items), kitchenItems);

      return [
        { screen: "kitchen" as const, items: newestFirst(kitchenItems) },
        { screen: "pickup" as const, items: newestFirst(pickupItems) },
        { screen: "courier" as const, items: newestFirst(courierItems) },
      ].filter((result) => visibleScreens.includes(result.screen));
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

  const itemsByScreen =
    queueQuery.data?.reduce(
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
      const actionDef = item.allowedActions?.find(
        (entry) => entry.id === action
      );
      const endpoint = actionDef?.endpoint || getEndpointForAction(action);
      const method = (actionDef?.method || "POST").toLowerCase();
      const payload = buildOperationsActionPayload(
        item,
        action,
        reason,
        notes,
        pickupCode
      );
      const { data } = await api.request<DashboardOpsActionResponse>({
        url: endpoint,
        method,
        data: payload,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      toast.success(`تم تنفيذ ${variables.action} بنجاح`);
      queryClient.invalidateQueries({ queryKey: ["operations-board", "queue"] });
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err?.response?.data?.message || err?.message || "تعذر تنفيذ الإجراء"
      );
      queryClient.invalidateQueries({ queryKey: ["operations-board", "queue"] });
    },
  });

  const requestAction = (
    item: UnifiedQueueItem,
    action: string,
    _actionLabel?: string,
    _isDangerous?: boolean,
    reason?: string,
    notes?: string,
    pickupCode?: string
  ) => {
    actionMutation.mutate({ item, action, reason, notes, pickupCode });
  };

  return {
    role,
    screenLabel,
    visibleScreens,
    allItems,
    itemsByScreen,
    isLoading: queueQuery.isLoading,
    isPending: actionMutation.isPending,
    requestAction,
    queueQuery,
    actionMutation,
    screens: OPERATIONS_SCREENS,
  };
}
