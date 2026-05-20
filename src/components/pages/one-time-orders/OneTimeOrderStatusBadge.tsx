import { Badge } from "@/components/ui/badge";
import {
  getOneTimeOrderStatusColor,
  getOneTimeOrderStatusLabel,
  isOneTimeOrderFinal,
} from "@/types/oneTimeOrderTypes";
import type { OneTimeOrderStatus } from "@/types/oneTimeOrderTypes";

interface OneTimeOrderStatusBadgeProps {
  status: OneTimeOrderStatus;
}

export function OneTimeOrderStatusBadge({ status }: OneTimeOrderStatusBadgeProps) {
  const { bg, text, border, dot } = getOneTimeOrderStatusColor(status);
  const isFinal = isOneTimeOrderFinal(status);

  return (
    <Badge
      variant="outline"
      className={`${bg} ${text} ${border} inline-flex items-center gap-1.5 px-2.5 py-1 whitespace-nowrap`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dot} ${!isFinal ? "animate-pulse" : ""}`}
      />
      {getOneTimeOrderStatusLabel(status)}
    </Badge>
  );
}
