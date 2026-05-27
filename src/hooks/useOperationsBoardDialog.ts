import { useReducer } from "react";
import type { UnifiedQueueItem } from "@/types/dashboardOpsTypes";

interface OperationsDialogState {
  item: UnifiedQueueItem | null;
  action: string;
  actionLabel: string;
  isDangerous: boolean;
  isFulfillOpen: boolean;
}

type OperationsDialogAction =
  | {
      type: "open_reason";
      item: UnifiedQueueItem;
      action: string;
      actionLabel: string;
      isDangerous: boolean;
    }
  | { type: "open_fulfill"; item: UnifiedQueueItem }
  | { type: "close" };

const initialDialogState: OperationsDialogState = {
  item: null,
  action: "",
  actionLabel: "",
  isDangerous: false,
  isFulfillOpen: false,
};

function operationsDialogReducer(
  state: OperationsDialogState,
  action: OperationsDialogAction
): OperationsDialogState {
  switch (action.type) {
    case "open_reason":
      return {
        item: action.item,
        action: action.action,
        actionLabel: action.actionLabel,
        isDangerous: action.isDangerous,
        isFulfillOpen: false,
      };
    case "open_fulfill":
      return {
        ...initialDialogState,
        item: action.item,
        isFulfillOpen: true,
      };
    case "close":
      return initialDialogState;
    default:
      return state;
  }
}

export function useOperationsBoardDialog() {
  const [state, dispatch] = useReducer(
    operationsDialogReducer,
    initialDialogState
  );

  return {
    dialogState: state,
    openReasonDialog: (
      item: UnifiedQueueItem,
      action: string,
      actionLabel: string,
      isDangerous: boolean
    ) =>
      dispatch({
        type: "open_reason",
        item,
        action,
        actionLabel,
        isDangerous,
      }),
    openFulfillDialog: (item: UnifiedQueueItem) =>
      dispatch({ type: "open_fulfill", item }),
    closeDialog: () => dispatch({ type: "close" }),
  };
}
