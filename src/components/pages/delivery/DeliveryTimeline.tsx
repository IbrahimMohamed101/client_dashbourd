import { CheckCircle2, Circle, Clock } from "lucide-react";

// ── Timeline step definitions ──

const TIMELINE_STEPS = [
  { id: "preparing", label: "قيد التحضير" },
  { id: "out_for_delivery", label: "خرج للتوصيل" },
  { id: "delivered", label: "تم التسليم" },
] as const;

// ── Status → step index mapping ──

const STATUS_TO_INDEX: Record<string, number> = {
  preparing: 0,
  out_for_delivery: 1,
  delivered: 2,
  fulfilled: 2,
};

// ── Progress width by step ──

const PROGRESS_WIDTHS = ["0%", "50%", "calc(100% - 2rem)"] as const;

// ── Props ──

interface DeliveryTimelineProps {
  status: string;
  variant?: "full" | "compact";
}

// ── Component ──

export function DeliveryTimeline({
  status,
  variant = "full",
}: DeliveryTimelineProps) {
  // Don't render timeline for canceled orders
  if (status === "canceled" || status === "delivery_canceled") {
    return (
      <div
        className={`flex items-center justify-center gap-2 text-red-600 dark:text-red-400 ${variant === "compact" ? "py-1 text-xs" : "py-4 text-sm"}`}
      >
        <Clock className={variant === "compact" ? "h-3 w-3" : "h-4 w-4"} />
        <span className="font-medium">ملغي</span>
      </div>
    );
  }

  const currentIndex = STATUS_TO_INDEX[status] ?? 0;

  if (variant === "compact") {
    return (
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className="h-full bg-blue-600 transition-all duration-500 dark:bg-blue-500"
          style={{ width: PROGRESS_WIDTHS[currentIndex] }}
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex w-full max-w-sm items-center justify-between py-6">
      {/* Background track */}
      <div className="absolute right-4 left-4 top-1/2 h-0.5 -translate-y-1/2 bg-muted" />

      {/* Progress fill */}
      <div
        className="absolute right-4 top-1/2 h-0.5 -translate-y-1/2 bg-blue-600 transition-all duration-500 dark:bg-blue-500"
        style={{ width: PROGRESS_WIDTHS[currentIndex] }}
      />

      {/* Step circles */}
      {TIMELINE_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div
            key={step.id}
            className="relative z-10 flex flex-col items-center gap-2"
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full bg-card transition-colors ${
                isCompleted || isCurrent
                  ? "text-blue-600 dark:text-blue-500"
                  : "text-muted-foreground/30"
              }`}
            >
              {isCompleted || isCurrent ? (
                <CheckCircle2 className="h-6 w-6 fill-blue-100 dark:fill-blue-950" />
              ) : (
                <Circle className="h-6 w-6 stroke-[1.5]" />
              )}
            </div>

            <span
              className={`absolute top-10 w-max text-center text-xs font-medium ${
                isCurrent
                  ? "font-bold text-blue-600 dark:text-blue-500"
                  : isCompleted
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
