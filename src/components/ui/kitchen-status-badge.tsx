import { Badge } from "@/components/ui/badge";
import type { KitchenUiStatus } from "@/types/kitchenTypes";

const KITCHEN_STATUS_CONFIG: Record<
  KitchenUiStatus,
  { bg: string; text: string; dot: string; border: string }
> = {
  in_preparation: {
    bg: "bg-amber-500/10",
    text: "text-amber-500 dark:text-amber-400",
    dot: "bg-amber-500 dark:bg-amber-400",
    border: "border-amber-500/20",
  },
  ready_for_pickup: {
    bg: "bg-teal-500/10",
    text: "text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500 dark:bg-teal-400",
    border: "border-teal-500/20",
  },
  out_for_delivery: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500 dark:bg-blue-400",
    border: "border-blue-500/20",
  },
  fulfilled: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    border: "border-emerald-500/20",
  },
  locked: {
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-500 dark:bg-slate-400",
    border: "border-slate-500/20",
  },
  open: {
    bg: "bg-gray-500/10",
    text: "text-gray-600 dark:text-gray-400",
    dot: "bg-gray-500 dark:bg-gray-400",
    border: "border-gray-500/20",
  },
  not_prepared: {
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500 dark:bg-orange-400",
    border: "border-orange-500/20",
  },
  no_show: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500 dark:bg-red-400",
    border: "border-red-500/20",
  },
  confirmed: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500 dark:bg-blue-400",
    border: "border-blue-500/20",
  },
  pending_payment: {
    bg: "bg-gray-500/10",
    text: "text-gray-600 dark:text-gray-400",
    dot: "bg-gray-500 dark:bg-gray-400",
    border: "border-gray-500/20",
  },
  cancelled: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500 dark:bg-red-400",
    border: "border-red-500/20",
  },
  expired: {
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500 dark:bg-orange-400",
    border: "border-orange-500/20",
  },
};

interface KitchenStatusBadgeProps {
  status: KitchenUiStatus;
  label?: string;
}

export function KitchenStatusBadge({ status, label }: KitchenStatusBadgeProps) {
  const style = KITCHEN_STATUS_CONFIG[status] ?? KITCHEN_STATUS_CONFIG["locked"];

  return (
    <Badge
      variant="outline"
      className={`${style.bg} ${style.text} ${style.border} inline-flex items-center gap-1.5 px-2.5 py-1 whitespace-nowrap`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${style.dot} animate-pulse`}
      />
      {label || status}
    </Badge>
  );
}
