import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  CalendarIcon,
  BanIcon,
  PlusIcon,
  PauseIcon,
  PlayIcon,
  ReceiptText,
} from "lucide-react";
import type { Subscription } from "@/types/subscriptionTypes";
import { hasEntitlementBatches } from "@/lib/subscriptionStackingPresentation";

interface SubscriptionHeaderProps {
  subscription: Subscription;
  onFreeze: () => void;
  onExtend: () => void;
  onCancel: () => void;
  onUnfreeze: () => void;
  onInvoice?: () => void;
}

export function SubscriptionHeader({
  subscription,
  onFreeze,
  onExtend,
  onCancel,
  onUnfreeze,
  onInvoice,
}: SubscriptionHeaderProps) {
  const isCanceled = subscription.status === "canceled";
  const isExpired = subscription.status === "expired" || subscription.status === "ended";
  const hasBatches = hasEntitlementBatches(subscription);

  let statusLabel = subscription.status;
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";

  switch (subscription.status) {
    case "active":
      statusLabel = "نشط";
      break;
    case "pending":
      statusLabel = "قيد الانتظار";
      variant = "outline";
      break;
    case "canceled":
      statusLabel = "ملغى";
      variant = "destructive";
      break;
    case "expired":
    case "ended":
      statusLabel = "منتهي";
      variant = "secondary";
      break;
  }

  const badgeVariant = variant;

  return (
    <div className="mb-6 flex flex-col gap-5 rounded-2xl border bg-card p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-5">
      <div className="flex min-w-0 items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-full">
          <Link to="/subscriptions">
            <ArrowRightIcon className="size-5" />
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium text-muted-foreground">تفاصيل الاشتراك</p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{subscription.displayId}</h1>
            <Badge
              variant={badgeVariant}
              className={
                variant === "default"
                  ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-700 shadow-none hover:bg-emerald-500/25"
                  : ""
              }
            >
              {statusLabel}
            </Badge>
            {hasBatches ? <Badge variant="outline">حاوية متعددة الباقات</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {subscription.userName || subscription.user?.fullName || "المشترك"}
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 lg:w-auto">
        {onInvoice ? (
          <Button
            size="lg"
            onClick={onInvoice}
            className="w-full gap-2 px-6 font-bold shadow-sm lg:w-auto"
          >
            <ReceiptText className="size-5" />
            عرض وطباعة الفاتورة
          </Button>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="bg-background">
            <CalendarIcon className="mr-2 ml-1 size-4" />
            الجدول الزمني
          </Button>

          {!isCanceled && !isExpired && !hasBatches && (
            <>
              <Button variant="outline" size="sm" className="bg-background" onClick={onExtend}>
                <PlusIcon className="mr-2 ml-1 size-4" />
                تمديد
              </Button>

              {subscription.status === "frozen" ? (
                <Button variant="outline" size="sm" className="bg-background" onClick={onUnfreeze}>
                  <PlayIcon className="mr-2 ml-1 size-4" />
                  إلغاء التجميد
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="bg-background" onClick={onFreeze}>
                  <PauseIcon className="mr-2 ml-1 size-4" />
                  تجميد
                </Button>
              )}

              <Button variant="destructive" size="sm" onClick={onCancel}>
                <BanIcon className="mr-2 ml-1 size-4" />
                إلغاء الاشتراك
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
