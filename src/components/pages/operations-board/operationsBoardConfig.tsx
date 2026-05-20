import { ChefHat, ClipboardList, Store } from "lucide-react";
import type { ReactNode } from "react";

export interface OperationsKitchenSection {
  statuses: string[];
  label: string;
  icon: ReactNode;
  color: string;
  primaryAction: string;
  primaryActionLabel: string;
}

export const KITCHEN_SECTIONS: OperationsKitchenSection[] = [
  {
    statuses: ["open", "locked", "confirmed", "pending_payment"],
    label: "في الانتظار",
    icon: <ClipboardList className="h-4 w-4" />,
    color: "text-amber-600",
    primaryAction: "prepare",
    primaryActionLabel: "بدء التحضير",
  },
  {
    statuses: ["in_preparation", "preparing"],
    label: "قيد التحضير",
    icon: <ChefHat className="h-4 w-4" />,
    color: "text-blue-600",
    primaryAction: "ready_for_pickup",
    primaryActionLabel: "تم التحضير",
  },
  {
    statuses: ["ready", "ready_for_pickup"],
    label: "جاهز",
    icon: <Store className="h-4 w-4" />,
    color: "text-emerald-600",
    primaryAction: "fulfill",
    primaryActionLabel: "تم الاستلام",
  },
];
