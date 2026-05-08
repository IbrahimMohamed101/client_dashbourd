import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  CalendarIcon,
  Eye,
  Play,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Search,
  ShoppingBag,
  Store,
} from "lucide-react";
import { format } from "date-fns";
import {
  useOneTimeOrdersListQuery,
  useOneTimeOrderActionMutation,
} from "@/hooks/useOneTimeOrdersQuery";
import type {
  OneTimeOrderListItem,
  OneTimeOrderStatus,
  OneTimeOrderAction,
  OneTimeOrderActionRequest,
} from "@/types/oneTimeOrderTypes";
import {
  getOneTimeOrderStatusLabel,
  getOneTimeOrderStatusColor,
  isOneTimeOrderFinal,
  isUnsupportedOneTimeOrderAction,
} from "@/types/oneTimeOrderTypes";
import { useDebounce } from "@/hooks/useDebounce";
import { useNewOrderDetection } from "@/hooks/useNewOrderDetection";

// ── Status filter options ──
const statusFilters: { value: OneTimeOrderStatus | "all"; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "confirmed", label: "مؤكد" },
  { value: "in_preparation", label: "قيد التحضير" },
  { value: "ready_for_pickup", label: "جاهز للاستلام" },
  { value: "fulfilled", label: "تم الاستلام" },
  { value: "cancelled", label: "ملغي" },
  { value: "expired", label: "منتهي الصلاحية" },
  { value: "pending_payment", label: "بانتظار الدفع" },
];

export const OneTimeOrderList: React.FC = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [statusFilter, setStatusFilter] = useState<OneTimeOrderStatus | "all">(
    "all"
  );
  const [searchStr, setSearchStr] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchStr, 500);

  // ── Confirmation dialog state ──
  const [confirmDialog, setConfirmDialog] = useState<{
    order: OneTimeOrderListItem;
    action: OneTimeOrderAction;
    requiresPickupCode: boolean;
  } | null>(null);
  const [pickupCode, setPickupCode] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  // ── Queries & Mutations ──
  const { data: listRes, isLoading } = useOneTimeOrdersListQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    date,
    q: debouncedSearch || undefined,
    page,
    limit: 20,
  });

  const actionMutation = useOneTimeOrderActionMutation();

  const orders = listRes?.data?.items ?? [];
  const pagination = listRes?.data?.pagination;

  // ── New order detection: sound + notification ──
  const { resetDetection } = useNewOrderDetection({
    orders,
    enabled: true,
  });

  // Reset detection when filters change to avoid false positives
  React.useEffect(() => {
    resetDetection();
  }, [statusFilter, date, resetDetection]);

  // ── Action handlers ──
  const isActionRequiresConfirmation = (action: OneTimeOrderAction) => {
    return action === "fulfill" || action === "cancel";
  };

  const isActionRequiresPickupCode = (action: OneTimeOrderAction) => {
    return action === "fulfill" || action === "ready_for_pickup";
  };

  const handleAction = (
    order: OneTimeOrderListItem,
    action: OneTimeOrderAction
  ) => {
    // Block unsupported actions
    if (isUnsupportedOneTimeOrderAction(action)) return;

    // Do not act on pending_payment orders
    if (order.paymentStatus !== "paid" && action === "prepare") {
      return;
    }

    if (isActionRequiresConfirmation(action)) {
      setConfirmDialog({
        order,
        action,
        requiresPickupCode: isActionRequiresPickupCode(action),
      });
    } else {
      actionMutation.mutate({ orderId: order.entityId, action });
    }
  };

  const handleConfirmAction = () => {
    if (!confirmDialog) return;

    const body: OneTimeOrderActionRequest = {};
    if (confirmDialog.requiresPickupCode && pickupCode) {
      body.pickupCode = pickupCode;
    }
    if (confirmDialog.action === "cancel" && cancelReason) {
      body.reason = cancelReason;
    }

    actionMutation.mutate({
      orderId: confirmDialog.order.entityId,
      action: confirmDialog.action,
      body,
    });

    setConfirmDialog(null);
    setPickupCode("");
    setCancelReason("");
  };

  // ── Get action button config ──
  const getActionConfig = (action: OneTimeOrderAction) => {
    switch (action) {
      case "prepare":
        return {
          label: "بدء التحضير",
          icon: <Play className="ml-1 h-3.5 w-3.5" />,
          variant: "default" as const,
        };
      case "ready_for_pickup":
        return {
          label: "جاهز للاستلام",
          icon: <PackageCheck className="ml-1 h-3.5 w-3.5" />,
          variant: "secondary" as const,
        };
      case "fulfill":
        return {
          label: "تم الاستلام",
          icon: <CheckCircle2 className="ml-1 h-3.5 w-3.5" />,
          variant: "default" as const,
        };
      case "cancel":
        return {
          label: "إلغاء",
          icon: <XCircle className="ml-1 h-3.5 w-3.5" />,
          variant: "destructive" as const,
        };
      default:
        return { label: action, icon: null, variant: "secondary" as const };
    }
  };

  // ── Render ──
  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ShoppingBag className="h-6 w-6 text-purple-500" />
            طلبات لمرة واحدة
          </h1>
          <p className="text-muted-foreground">
            إدارة طلبات الاستلام من الفرع – منفصلة عن الاشتراكات
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <CalendarIcon className="absolute top-1/2 right-3 mr-1 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(1);
              }}
              className="w-44 pr-10 text-right"
            />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-sm shrink-0">
          <Input
            placeholder="ابحث برقم الطلب أو اسم العميل..."
            value={searchStr}
            onChange={(e) => {
              setSearchStr(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border-transparent bg-muted/50 pr-10 pl-10 transition-colors hover:border-border focus-visible:ring-1"
          />
          <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        <div
          className="flex w-full items-center gap-1.5 overflow-x-auto pb-1 xl:w-auto"
          style={{ scrollbarWidth: "thin" }}
        >
          {statusFilters.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setStatusFilter(opt.value);
                  setPage(1);
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-transparent bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/20 bg-muted/10 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
            <ShoppingBag className="h-8 w-8 opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            لا توجد طلبات
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            لا توجد طلبات لمرة واحدة لهذا اليوم أو تم تصفية جميع النتائج.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right font-semibold">
                  رقم الطلب
                </TableHead>
                <TableHead className="text-right font-semibold">
                  العميل
                </TableHead>
                <TableHead className="text-right font-semibold">
                  النوع
                </TableHead>
                <TableHead className="text-right font-semibold">
                  الدفع
                </TableHead>
                <TableHead className="text-right font-semibold">
                  الحالة
                </TableHead>
                <TableHead className="text-right font-semibold">
                  الوجبات
                </TableHead>
                <TableHead className="text-right font-semibold">
                  الإجراءات
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const statusColor = getOneTimeOrderStatusColor(order.status);
                const isFinal = isOneTimeOrderFinal(order.status);
                const isNonOperational =
                  order.paymentStatus !== "paid" ||
                  order.status === "pending_payment";

                return (
                  <TableRow
                    key={order.entityId}
                    className="group border-b-border/40 transition-colors hover:bg-muted/30"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-purple-500/10 px-2 py-1 font-mono text-xs font-bold text-purple-600">
                          {order.orderNumber}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="truncate text-sm font-medium">
                          {order.customer?.name || "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {order.customer?.phone || ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="gap-1 border-purple-500/20 bg-purple-500/10 text-purple-600"
                      >
                        <Store className="h-3 w-3" />
                        استلام
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          order.paymentStatus === "paid"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                            : "border-gray-500/20 bg-gray-500/10 text-gray-500"
                        }
                      >
                        {order.paymentStatus === "paid"
                          ? "مدفوع"
                          : order.paymentStatus === "initiated"
                            ? "قيد الدفع"
                            : order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusColor.bg} ${statusColor.text} ${statusColor.border} inline-flex items-center gap-1.5 px-2.5 py-1 whitespace-nowrap`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${statusColor.dot} ${!isFinal ? "animate-pulse" : ""}`}
                        />
                        {getOneTimeOrderStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {order.items?.slice(0, 3).map((item) => (
                          <span
                            key={item.id}
                            className="inline-flex items-center gap-1 rounded-md border border-secondary bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
                          >
                            {item.name} x{item.quantity}
                          </span>
                        ))}
                        {order.items?.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{order.items.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* View detail link */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() =>
                            navigate({
                              to: "/one-time-orders/$orderId",
                              params: { orderId: order.entityId },
                            })
                          }
                        >
                          <Eye className="ml-1 h-3.5 w-3.5" />
                          التفاصيل
                        </Button>

                        {/* Action buttons based on allowedActions from backend */}
                        {order.allowedActions
                          ?.filter((a) => !isUnsupportedOneTimeOrderAction(a))
                          .map((action) => {
                            const config = getActionConfig(action);
                            // Do not show prepare for unpaid orders
                            if (action === "prepare" && isNonOperational)
                              return null;
                            return (
                              <Button
                                key={action}
                                variant={config.variant}
                                size="sm"
                                className="h-8 px-3 text-xs shadow-sm transition-all active:scale-95"
                                onClick={() => handleAction(order, action)}
                                disabled={actionMutation.isPending}
                              >
                                {config.icon}
                                {config.label}
                              </Button>
                            );
                          })}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-sm text-muted-foreground">
                إجمالي {pagination.total} طلب
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  السابق
                </Button>
                <span className="text-sm font-medium">
                  {page} / {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.pages}
                  onClick={() =>
                    setPage((p) => Math.min(pagination.pages, p + 1))
                  }
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation dialog for fulfill / cancel */}
      <AlertDialog
        open={!!confirmDialog}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmDialog(null);
            setPickupCode("");
            setCancelReason("");
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              {confirmDialog?.action === "fulfill" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {confirmDialog?.action === "fulfill"
                ? "تأكيد استلام العميل للطلب"
                : "تأكيد إلغاء الطلب"}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-base">
              {confirmDialog?.action === "fulfill"
                ? "يرجى التأكد من أن العميل قد استلم الطلب فعلاً من الفرع."
                : "هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء بسهولة."}
            </AlertDialogDescription>

            {confirmDialog?.requiresPickupCode && (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-semibold text-foreground/80">
                  رمز الاستلام
                </label>
                <Input
                  placeholder="000000"
                  value={pickupCode}
                  onChange={(e) => setPickupCode(e.target.value)}
                  className="h-12 border-2 text-center text-2xl font-bold tracking-[0.5em] focus-visible:ring-primary"
                  dir="ltr"
                  autoFocus
                />
              </div>
            )}

            {confirmDialog?.action === "cancel" && (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-semibold text-foreground/80">
                  سبب الإلغاء
                </label>
                <Input
                  placeholder="أدخل سبب الإلغاء..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="focus-visible:ring-primary"
                  dir="rtl"
                  autoFocus
                />
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2 sm:gap-4">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={
                actionMutation.isPending ||
                (confirmDialog?.requiresPickupCode && !pickupCode.trim()) ||
                (confirmDialog?.action === "cancel" && !cancelReason.trim())
              }
              className={
                confirmDialog?.action === "cancel"
                  ? "text-destructive-foreground bg-destructive hover:bg-destructive/90"
                  : confirmDialog?.action === "fulfill"
                    ? "bg-emerald-600 px-8 font-bold hover:bg-emerald-700"
                    : ""
              }
            >
              {confirmDialog?.action === "fulfill"
                ? "تأكيد الاستلام"
                : "تأكيد الإلغاء"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
