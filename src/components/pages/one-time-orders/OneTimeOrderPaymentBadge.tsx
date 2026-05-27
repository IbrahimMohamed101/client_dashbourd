import { Badge } from "@/components/ui/badge";
import type { OneTimeOrderPaymentStatus } from "@/types/oneTimeOrderTypes";

interface OneTimeOrderPaymentBadgeProps {
  status: OneTimeOrderPaymentStatus;
}

const PAYMENT_CONFIG: Record<
  string,
  { label: string; classes: string }
> = {
  paid: {
    label: "مدفوع",
    classes: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
  },
  initiated: {
    label: "قيد الدفع",
    classes: "border-gray-500/20 bg-gray-500/10 text-gray-500",
  },
};

export function OneTimeOrderPaymentBadge({ status }: OneTimeOrderPaymentBadgeProps) {
  const config = PAYMENT_CONFIG[status] ?? {
    label: status,
    classes: "border-gray-500/20 bg-gray-500/10 text-gray-500",
  };

  return (
    <Badge variant="outline" className={config.classes}>
      {config.label}
    </Badge>
  );
}
