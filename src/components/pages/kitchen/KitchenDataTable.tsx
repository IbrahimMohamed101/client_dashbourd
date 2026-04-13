/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  KitchenOperationsRow,
  KitchenUiStatus,
  KitchenRowAction,
} from "@/types/kitchenTypes";
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

interface KitchenDataTableProps {
  data: KitchenOperationsRow[];
  isLoading: boolean;
  onActionClick: (action: KitchenRowAction, actionData?: any) => void;
  isActionLoading: boolean;
}

export const KitchenDataTable: React.FC<KitchenDataTableProps> = ({
  data,
  isLoading,
  onActionClick,
  isActionLoading,
}) => {
  const [confirmAction, setConfirmAction] = useState<KitchenRowAction | null>(
    null
  );
  const [pickupCode, setPickupCode] = useState("");

  const getStatusBadge = (status: KitchenUiStatus, statusLabel: string) => {
    const config: Record<
      string,
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
    };
    const style = config[status] || config["locked"];
    return (
      <Badge
        variant="outline"
        className={`${style.bg} ${style.text} ${style.border} inline-flex items-center gap-1.5 px-2.5 py-1 whitespace-nowrap`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${style.dot} animate-pulse`}
        />
        {statusLabel || status}
      </Badge>
    );
  };

  const getModeBadge = (mode: string, modeLabel: string) => {
    if (mode === "pickup") {
      return (
        <Badge
          variant="secondary"
          className="gap-1 rounded-md border-purple-500/20 bg-purple-500/10 px-2 py-1 text-purple-600 transition-colors hover:bg-purple-500/20 dark:text-purple-400"
        >
          <Store className="h-3 w-3" />
          {modeLabel || "استلام"}
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="gap-1 rounded-md border-sky-500/20 bg-sky-500/10 px-2 py-1 text-sky-600 transition-colors hover:bg-sky-500/20 dark:text-sky-400"
      >
        <Truck className="h-3 w-3" />
        {modeLabel || "توصيل"}
      </Badge>
    );
  };

  const getActionIcon = (actionKey: string) => {
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
  };

  const handleActionPress = (action: KitchenRowAction) => {
    const isNeedsCode =
      action.endpoint?.includes("/verify") ||
      action.endpoint?.includes("fulfill-pickup") ||
      action.key === "fulfill_pickup" ||
      action.key === "verify";

    if (action.requiresConfirmation || isNeedsCode) {
      setConfirmAction(action);
    } else {
      onActionClick(action);
    }
  };

  const renderActions = (row: KitchenOperationsRow) => {
    if (!row.actions || row.actions.length === 0) {
      return (
        <span className="inline-block rounded-md bg-muted/30 px-3 py-1 text-sm text-muted-foreground">
          —
        </span>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        {row.actions
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
                onClick={() => handleActionPress(action)}
                disabled={isActionLoading}
              >
                {getActionIcon(action.key)}
                {action.label}
              </Button>
            );
          })}
      </div>
    );
  };

  // ── Segmented Progress bar ──
  const renderProgress = (row: KitchenOperationsRow) => {
    const { progress } = row;
    if (!progress || !progress.steps || progress.totalSteps === 0) {
      return (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ShieldAlert className="h-3.5 w-3.5 opacity-50" /> غير متوفر
        </span>
      );
    }

    // Create an array of length `totalSteps` to render segments
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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/20 bg-muted/10 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
          <UtensilsCrossed className="h-8 w-8 opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          لا توجد طلبات هنا
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          لا توجد بيانات متاحة لهذا اليوم أو تم تصفية جميع النتائج.
        </p>
      </div>
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
                <TableCell>{getModeBadge(row.mode, row.modeLabel)}</TableCell>
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
                          <span className="h-1 w-1 rounded-full bg-primary/50"></span>
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
                  {getStatusBadge(row.status, row.statusLabel)}
                </TableCell>
                <TableCell className="pr-4">{renderProgress(row)}</TableCell>
                <TableCell className="max-w-[200px] text-right">
                  {renderActions(row)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
            setPickupCode("");
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <RotateCcw className="h-5 w-5 text-primary" />
              تأكيد الإجراء
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-base">
              {confirmAction?.confirmationMessage ||
                "هل أنت متأكد من المضي قدماً في هذا الإجراء؟ لا يمكن التراجع عن معظم التحديثات بسهولة."}
            </AlertDialogDescription>

            {/* If the action is for pickup verification, show input field for the code */}
            {(confirmAction?.endpoint?.includes("/verify") ||
              confirmAction?.endpoint?.includes("fulfill-pickup") ||
              confirmAction?.key === "fulfill_pickup" ||
              confirmAction?.key === "verify") && (
              <div className="mt-4 flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">
                  رمز الاستلام
                </label>
                <Input
                  placeholder="أدخل رمز الاستلام..."
                  value={pickupCode}
                  onChange={(e) => setPickupCode(e.target.value)}
                  className="text-left"
                  dir="ltr"
                />
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2 sm:gap-4">
            <AlertDialogCancel className="mt-0">إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) {
                  const needsCode =
                    confirmAction.endpoint?.includes("/verify") ||
                    confirmAction.endpoint?.includes("fulfill-pickup") ||
                    confirmAction.key === "fulfill_pickup" ||
                    confirmAction.key === "verify";
                  onActionClick(
                    confirmAction,
                    needsCode ? { code: pickupCode } : undefined
                  );
                  setConfirmAction(null);
                  setPickupCode("");
                }
              }}
              disabled={
                (confirmAction?.endpoint?.includes("/verify") ||
                  confirmAction?.endpoint?.includes("fulfill-pickup") ||
                  confirmAction?.key === "fulfill_pickup" ||
                  confirmAction?.key === "verify") &&
                !pickupCode.trim()
              }
              className={
                confirmAction?.variant === "danger"
                  ? "text-destructive-foreground bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              تأكيد الإجراء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
