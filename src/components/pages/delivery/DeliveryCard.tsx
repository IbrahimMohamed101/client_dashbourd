import { useState } from "react";
import { Phone, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeliveryTimeline } from "./DeliveryTimeline";
import type {
  UnifiedOperationalDTO,
  DashboardOpsActionRequest,
} from "@/types/dashboardOpsTypes";
import { getBadgeClasses } from "@/types/dashboardOpsTypes";

// ── Action button config ──

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

interface ActionConfig {
  label: string;
  variant: ButtonVariant;
  className?: string;
}

const ACTION_CONFIG: Record<string, ActionConfig> = {
  dispatch: {
    label: "خروج",
    variant: "default",
    className: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
  },
  arriving_soon: {
    label: "قريب",
    variant: "secondary",
  },
  delivered: {
    label: "تم",
    variant: "default",
    className: "bg-green-600 hover:bg-green-700 text-white shadow-sm",
  },
  cancel: {
    label: "إلغاء",
    variant: "ghost",
    className: "text-red-500 hover:text-red-600 hover:bg-red-50/50",
  },
};

// ── Props ──

interface DeliveryCardProps {
  item: UnifiedOperationalDTO;
  onActionClick: (action: string, payload: DashboardOpsActionRequest) => void;
  isActionLoading: boolean;
}

// ── Component ──

export function DeliveryCard({
  item,
  onActionClick,
  isActionLoading,
}: DeliveryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAction = (action: string) => {
    onActionClick(action, { entityId: item.id, type: item.type });
  };

  const hasDetails =
    item.context.notes || item.context.orderDetails || item.context.cancelInfo;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card p-3 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:hover:border-blue-900">
      {/* ── Top Meta ── */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="truncate font-mono text-[10px] font-medium text-muted-foreground/60">
            {item.reference}
          </span>
          {item.ui?.label && (
            <Badge
              variant="secondary"
              className={`px-1.5 py-0 text-[10px] font-medium ${getBadgeClasses(item.ui.color)}`}
            >
              {item.ui.label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
          <span>{item.type === "subscription" ? "اشتراك" : "طلب"}</span>
          {item.context.window && (
            <>
              <span className="opacity-30">|</span>
              <span className="font-semibold text-foreground/70">
                {item.context.window}
              </span>
            </>
          )}
        </div>
      </div>

      {/* ── Main Info ── */}
      <div className="mb-3 flex flex-col gap-0.5">
        <h3 className="truncate text-base font-bold tracking-tight text-foreground">
          {item.customer.name}
        </h3>
        <div
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          dir="ltr"
        >
          <Phone className="h-3 w-3" />
          <span>{item.customer.phone}</span>
        </div>
      </div>

      {/* ── Address ── */}
      <div className="mb-3 flex items-start gap-1.5 rounded-lg bg-muted/30 p-2 text-xs">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
        <p className="line-clamp-2 leading-relaxed text-muted-foreground/90">
          {item.context.addressSummary || "لا يوجد عنوان مسجل"}
        </p>
      </div>

      {/* ── Status Track ── */}
      <div className="mb-3 space-y-1.5">
        <DeliveryTimeline status={item.status} variant="compact" />
        <div className="flex justify-between text-[10px] font-medium text-muted-foreground/50">
          <span>تحضير</span>
          <span>شحن</span>
          <span>تسليم</span>
        </div>
      </div>

      {/* ── Footer Actions ── */}
      <div className="flex items-center gap-1.5">
        <div className="flex flex-1 items-center gap-1.5">
          {item.allowedActions?.map((action) => {
            const config = ACTION_CONFIG[action];
            if (!config) return null;
            return (
              <Button
                key={action}
                variant={config.variant}
                size="sm"
                className={`h-10 flex-1 px-2 text-xs font-bold shadow-sm transition-transform active:scale-[0.98] md:h-8 ${config.className ?? ""}`}
                disabled={isActionLoading}
                onClick={() => handleAction(action)}
              >
                {config.label}
              </Button>
            );
          })}
        </div>

        {hasDetails && (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground/60 hover:text-foreground md:h-8 md:w-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 md:h-4 md:w-4" />
            ) : (
              <ChevronDown className="h-5 w-5 md:h-4 md:w-4" />
            )}
          </Button>
        )}
      </div>

      {/* ── Expanded Detail View ── */}
      {isExpanded && (
        <div className="mt-3 animate-in space-y-2 border-t pt-3 duration-200 fade-in slide-in-from-top-1">
          {item.context.notes && (
            <div className="rounded-md border border-blue-100 bg-blue-50/30 p-2 text-[11px] dark:border-blue-900 dark:bg-blue-950/20">
              <span className="mb-0.5 block font-bold text-blue-700 dark:text-blue-400">
                ملاحظة:
              </span>
              <p className="text-blue-800 dark:text-blue-300">
                {item.context.notes}
              </p>
            </div>
          )}
          {item.context.orderDetails && (
            <div className="rounded-md bg-muted/50 p-2 text-[11px]">
              <span className="mb-0.5 block font-bold text-foreground/70">
                الطلب:
              </span>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {item.context.orderDetails}
              </p>
            </div>
          )}
          {item.context.cancelInfo && (
            <div className="rounded-md border border-red-100 bg-red-50/30 p-2 text-[11px] dark:border-red-900 dark:bg-red-950/20">
              <span className="mb-0.5 block font-bold text-red-700 dark:text-red-400">
                إلغاء:
              </span>
              <p className="text-red-800 dark:text-red-300">
                {item.context.cancelInfo.reason}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
