import { useState } from "react";
import { Phone, MapPin, ChevronDown, ChevronUp, Clock, Package } from "lucide-react";
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
    label: "خروج للتوصيل",
    variant: "default",
    className: "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20",
  },
  notify_arrival: {
    label: "قريب",
    variant: "secondary",
  },
  fulfill: {
    label: "تم التسليم",
    variant: "default",
    className: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20",
  },
  cancel: {
    label: "إلغاء",
    variant: "ghost",
    className: "text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30",
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

  const handleAction = (actionId: string) => {
    onActionClick(actionId, {
      action: actionId,
      entityId: item.id,
      entityType: item.type,
      source: item.source,
    });
  };

  const hasDetails =
    item.context.notes || item.context.orderDetails || item.context.cancelInfo;

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-muted-foreground/10 bg-card/50 p-5 shadow-sm backdrop-blur-sm transition-all hover:border-primary/20 hover:shadow-lg dark:hover:border-primary/30">
      {/* ── Header ── */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[10px] font-black text-primary"
            >
              {item.type === "subscription" ? "اشتراك" : "طلب لمرة واحدة"}
            </Badge>
            <span className="font-mono text-[11px] font-bold tracking-tight text-muted-foreground/60">
              #{item.reference}
            </span>
          </div>
          <h3 className="line-clamp-1 text-lg font-black tracking-tight text-foreground">
            {item.customer.name}
          </h3>
        </div>

        {item.ui?.label && (
          <div
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${getBadgeClasses(item.ui.color)}`}
          >
            {item.ui.label}
          </div>
        )}
      </div>

      {/* ── Contact & Details ── */}
      <div className="mb-6 flex flex-col gap-3.5">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
            <Phone className="h-4 w-4" />
          </div>
          <span dir="ltr" className="font-mono font-bold text-foreground/80">
            {item.customer.phone}
          </span>
        </div>

        <div className="flex items-start gap-3 text-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin className="h-4 w-4" />
          </div>
          <p className="mt-1.5 line-clamp-2 leading-relaxed text-muted-foreground font-medium">
            {item.context.addressSummary || "لا يوجد عنوان مسجل"}
          </p>
        </div>

        {item.context.window && (
          <div className="flex items-center gap-3 text-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
              <Clock className="h-4 w-4" />
            </div>
            <span className="font-bold text-orange-600 dark:text-orange-400">
              {item.context.window}
            </span>
          </div>
        )}
      </div>

      {/* ── Spacer to push footer down ── */}
      <div className="flex-1" />

      {/* ── Status Track ── */}
      <div className="mb-6 space-y-2.5 rounded-2xl bg-muted/30 p-4">
        <DeliveryTimeline status={item.status} variant="compact" />
        <div className="flex justify-between px-0.5 text-[10px] font-black text-muted-foreground/60">
          <span>تحضير</span>
          <span>شحن</span>
          <span>تسليم</span>
        </div>
      </div>

      {/* ── Footer Actions ── */}
      <div className="flex items-center gap-2 border-t border-muted-foreground/5 pt-4">
        <div className="flex flex-1 items-center gap-2">
          {item.allowedActions && item.allowedActions.length > 0 ? (
            item.allowedActions.map((action) => {
              const actionId = action.id;
              const config = ACTION_CONFIG[actionId];
              if (!config) return null;
              return (
                <Button
                  key={actionId}
                  variant={config.variant}
                  size="sm"
                  className={`h-10 flex-1 rounded-xl px-3 text-xs font-bold transition-all active:scale-95 ${config.className ?? ""}`}
                  disabled={isActionLoading}
                  onClick={() => handleAction(actionId)}
                >
                  {config.label || action.label}
                </Button>
              );
            })
          ) : (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/20 py-2.5 bg-muted/10">
              <Package className="h-4 w-4 text-muted-foreground/40" />
              <span className="text-xs font-bold text-muted-foreground/50">لا توجد إجراءات متاحة</span>
            </div>
          )}
        </div>

        {hasDetails && (
          <Button
            variant="outline"
            size="icon"
            className={`h-10 w-10 shrink-0 rounded-xl transition-all ${isExpanded ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:text-foreground border-muted-foreground/20"}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>

      {/* ── Expanded Detail View ── */}
      {isExpanded && (
        <div className="mt-4 animate-in space-y-3 rounded-2xl bg-muted/40 p-4 duration-200 fade-in slide-in-from-top-2">
          {item.context.notes && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs dark:border-blue-900/50 dark:bg-blue-950/30">
              <span className="mb-1.5 block font-black text-blue-700 dark:text-blue-400">
                ملاحظة:
              </span>
              <p className="font-medium leading-relaxed text-blue-800 dark:text-blue-300">
                {item.context.notes}
              </p>
            </div>
          )}
          {item.context.orderDetails && (
            <div className="rounded-xl border border-muted-foreground/10 bg-background/50 p-3 text-xs shadow-sm">
              <span className="mb-1.5 block font-black text-foreground/80">
                تفاصيل الطلب:
              </span>
              <p className="whitespace-pre-wrap font-medium leading-relaxed text-muted-foreground">
                {item.context.orderDetails}
              </p>
            </div>
          )}
          {item.context.cancelInfo && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs dark:border-rose-900/50 dark:bg-rose-950/30">
              <span className="mb-1.5 block font-black text-rose-700 dark:text-rose-400">
                سبب الإلغاء:
              </span>
              <p className="font-medium leading-relaxed text-rose-800 dark:text-rose-300">
                {item.context.cancelInfo.reason}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
