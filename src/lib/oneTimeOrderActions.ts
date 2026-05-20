import type {
  OneTimeOrderAction,
  OneTimeOrderListItem,
} from "@/types/oneTimeOrderTypes";
import {
  isOneTimeOrderFinal,
  isUnsupportedOneTimeOrderAction,
} from "@/types/oneTimeOrderTypes";

const FALLBACK_PICKUP_ACTIONS_BY_STATUS: Record<string, OneTimeOrderAction[]> = {
  confirmed: ["prepare", "cancel"],
  in_preparation: ["ready_for_pickup", "cancel"],
  ready_for_pickup: ["fulfill", "cancel"],
};

function sanitizeActions(actions: OneTimeOrderAction[] | undefined) {
  return (actions ?? []).filter(
    (action) => !isUnsupportedOneTimeOrderAction(action)
  );
}

export function getOneTimeOrderRowActions(
  order: OneTimeOrderListItem
): OneTimeOrderAction[] {
  const apiActions = sanitizeActions(order.allowedActions);
  if (apiActions.length > 0) return apiActions;

  if (
    order.paymentStatus !== "paid" ||
    order.fulfillmentMethod !== "pickup" ||
    isOneTimeOrderFinal(order.status)
  ) {
    return [];
  }

  return sanitizeActions(FALLBACK_PICKUP_ACTIONS_BY_STATUS[order.status]);
}
