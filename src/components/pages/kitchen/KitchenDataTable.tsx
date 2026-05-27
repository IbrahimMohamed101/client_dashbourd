import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { KitchenStatusBadge } from "@/components/ui/kitchen-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import type {
  KitchenOperationsRow,
  KitchenRowAction,
} from "@/types/kitchenTypes";
import {
  Clock,
  PackageOpen,
  Play,
  RotateCcw,
  ShieldAlert,
  Store,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface KitchenDataTableProps {
  data: KitchenOperationsRow[];
  isLoading: boolean;
  onActionClick: (
    action: KitchenRowAction,
    actionData?: Record<string, unknown>
  ) => void;
  isActionLoading: boolean;
}

function KitchenModeBadge({ mode, label }: { mode: string; label: string }) {
  if (mode === "pickup") {
    return (
      <Badge
        variant="secondary"
        className="gap-1 rounded-md border-purple-500/20 bg-purple-500/10 px-2 py-1 text-purple-600 transition-colors hover:bg-purple-500/20 dark:text-purple-400"
      >
        <Store className="h-3 w-3" />
        {label || "استلام"}
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="gap-1 rounded-md border-sky-500/20 bg-sky-500/10 px-2 py-1 text-sky-600 transition-colors hover:bg-sky-500/20 dark:text-sky-400"
    >
      <Truck className="h-3 w-3" />
      {label || "توصيل"}
    </Badge>
  );
}

function KitchenProgressBar({ row }: { row: KitchenOperationsRow }) {
  const { progress } = row;
  if (!progress || !progress.steps || progress.totalSteps === 0) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <ShieldAlert className="h-3.5 w-3.5 opacity-50" /> غير متوفر
      </span>
    );
  }

  const segments = Array.from(
    { length: progress.totalSteps },
    (_, i) => i < progress.step
  );

  return (
    <div className="flex min-w-[100px] flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {segments.map((isComplete, idx) => (
          <div
            key={idx}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
              isComplete
                ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                : "bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
        <span>اكتمل</span>
        <span
          className={
            progress.step === progress.totalSteps ? "text-primary" : ""
          }
        >
          {progress.step} / {progress.totalSteps}
        </span>
      </div>
    </div>
  );
}

function getActionIcon(actionKey: string) {
  switch (actionKey) {
    case "start_preparation":
      return <Play className="ml-1.5 h-3.5 w-3.5" />;
    case "out_for_delivery":
      return <Truck className="ml-1.5 h-3.5 w-3.5" />;
    case "ready_for_pickup":
      return <PackageOpen className="ml-1.5 h-3.5 w-3.5" />;
    case "reopen":
      return <RotateCcw className="ml-1.5 h-3.5 w-3.5" />;
    default:
      return null;
  }
}

function isVerificationAction(action: KitchenRowAction | null): boolean {
  if (!action) return false;
  return (
    action.endpoint?.includes("/verify") ||
    action.endpoint?.includes("fulfill-pickup") ||
    action.endpoint?.includes("verify-pickup") ||
    action.key === "fulfill_pickup" ||
    action.key === "verify" ||
    action.key === "verify_pickup"
  );
}

function KitchenActionButtons({
  actions,
  isLoading,
  onPress,
}: {
  actions: KitchenRowAction[];
  isLoading: boolean;
  onPress: (action: KitchenRowAction) => void;
}) {
  if (!actions || actions.length === 0) {
    return (
      <span className="inline-block rounded-md bg-muted/30 px-3 py-1 text-sm text-muted-foreground">
        —
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions
        .filter((a) => a.enabled && a.key !== "lock")
        .map((action) => {
          const isDanger = action.variant === "danger";
          const isPrimary = action.variant === "primary";

          return (
            <Button
              key={action.key}
              variant={
                isDanger ? "destructive" : isPrimary ? "default" : "secondary"
              }
              size="sm"
              className={`h-8 px-3 text-xs shadow-sm transition-all active:scale-95 ${
                !isDanger && !isPrimary
                  ? "bg-muted/50 font-medium text-foreground hover:bg-muted"
                  : "font-semibold"
              }`}
              onClick={() => onPress(action)}
              disabled={isLoading}
            >
              {getActionIcon(action.key)}
              {action.label}
            </Button>
          );
        })}
    </div>
  );
}

export function KitchenDataTable({
  data,
  isLoading,
  onActionClick,
  isActionLoading,
}: KitchenDataTableProps) {
  const [confirmAction, setConfirmAction] = useState<KitchenRowAction | null>(
    null
  );
  const [pickupCode, setPickupCode] = useState("");

  const handleActionPress = (action: KitchenRowAction) => {
    if (action.requiresConfirmation || isVerificationAction(action)) {
      setConfirmAction(action);
    } else {
      onActionClick(action);
    }
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    onActionClick(
      confirmAction,
      isVerificationAction(confirmAction) ? { code: pickupCode } : undefined
    );
    setConfirmAction(null);
    setPickupCode("");
  };

  const handleCancel = () => {
    setConfirmAction(null);
    setPickupCode("");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="لا توجد طلبات هنا"
        description="لا توجد بيانات متاحة لهذا اليوم أو تم تصفية جميع النتائج."
        icon={UtensilsCrossed}
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[200px] text-right font-semibold">
                العميل
              </TableHead>
              <TableHead className="text-right font-semibold">المرجع</TableHead>
              <TableHead className="text-right font-semibold">النوع</TableHead>
              <TableHead className="text-right font-semibold whitespace-nowrap">
                الوقت
              </TableHead>
              <TableHead className="w-[260px] text-right font-semibold">
                الوجبات
              </TableHead>
              <TableHead className="text-right font-semibold">الحالة</TableHead>
              <TableHead className="w-[140px] text-right font-semibold">
                التقدم
              </TableHead>
              <TableHead className="text-right font-semibold">
                الإجراءات
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id}
                className="group border-b-border/40 transition-colors hover:bg-muted/30"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/10 text-sm font-bold text-primary uppercase shadow-sm">
                      {row.customer.name ? row.customer.name.charAt(0) : "?"}
                    </div>
                    <div className="flex flex-col gap-0.5 overflow-hidden leading-tight">
                      <span
                        className="truncate text-sm font-medium"
                        title={row.customer.name}
                      >
                        {row.customer.name || "—"}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium">
                      {row.reference}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <KitchenModeBadge mode={row.mode} label={row.modeLabel} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm whitespace-nowrap text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 opacity-70" />
                    <span className="font-medium">
                      {row.timeWindow.label || "—"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {row.items.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {row.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-1 rounded-md border border-secondary bg-secondary/50 px-2 py-1 text-[11px] font-medium text-secondary-foreground transition-colors hover:bg-secondary"
                        >
                          <span className="h-1 w-1 rounded-full bg-primary/50" />
                          <span
                            className="max-w-[120px] truncate"
                            title={item.name}
                          >
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
                      <ShieldAlert className="h-3 w-3" />
                      لم يتم التعيين
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <KitchenStatusBadge
                    status={row.status}
                    label={row.statusLabel}
                  />
                </TableCell>
                <TableCell className="pr-4">
                  <KitchenProgressBar row={row} />
                </TableCell>
                <TableCell className="max-w-[200px] text-right">
                  <KitchenActionButtons
                    actions={row.actions}
                    isLoading={isActionLoading}
                    onPress={handleActionPress}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              {isVerificationAction(confirmAction) ? (
                <ShieldAlert className="h-5 w-5 text-amber-500" />
              ) : (
                <RotateCcw className="h-5 w-5 text-primary" />
              )}
              {isVerificationAction(confirmAction)
                ? "التحقق من رمز الاستلام"
                : "تأكيد الإجراء"}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-base">
              {confirmAction?.confirmationMessage ||
                (isVerificationAction(confirmAction)
                  ? "يرجى إدخال رمز الاستلام المقدم من العميل لإتمام الطلب."
                  : "هل أنت متأكد من المضي قدماً في هذا الإجراء؟ لا يمكن التراجع عن معظم التحديثات بسهولة.")}
            </AlertDialogDescription>

            {isVerificationAction(confirmAction) && (
              <div className="mt-6 space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground/80">
                    رمز الاستلام (Verification Code)
                  </label>
                  <Input
                    placeholder="0000"
                    value={pickupCode}
                    onChange={(e) => setPickupCode(e.target.value)}
                    className="h-12 border-2 text-center text-2xl font-bold tracking-[0.5em] focus-visible:ring-primary"
                    dir="ltr"
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground">
                    هذا الرمز ضروري لضمان تسليم الطلب للعميل الصحيح.
                  </p>
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2 sm:gap-4">
            <AlertDialogCancel className="mt-0" onClick={handleCancel}>
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={
                isVerificationAction(confirmAction) && !pickupCode.trim()
              }
              className={
                confirmAction?.variant === "danger"
                  ? "text-destructive-foreground bg-destructive hover:bg-destructive/90"
                  : isVerificationAction(confirmAction)
                    ? "bg-primary px-8 font-bold"
                    : ""
              }
            >
              {isVerificationAction(confirmAction)
                ? "تحقق وإتمام"
                : "تأكيد الإجراء"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
